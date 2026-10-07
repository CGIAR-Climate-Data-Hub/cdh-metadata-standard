// Cross-field checks for a CDH metadata record - the rules from standard.md
// that JSON Schema cannot state, kept beside the schema and published with it.
//
// Dependency-free ESM, so the same source runs in Node and in a browser:
//
//   import check from "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vX.Y.Z/checks/cross-field.js";
//   const errors = check(record);                       // messages, empty when the record passes
//   const errors = check(record, { isSpdx });           // with an SPDX expression validator
//
// `isSpdx` is injected because SPDX validation is the only rule needing a
// library. Omit it and license expressions are accepted unchecked; the rest of
// the rules are unaffected. In Node, pass `spdx-expression-validate`.
//
// This file carries no schema rules. Anything a schema keyword can state lives
// in the schema, where every validator enforces it.

// Matches CDH-hosted, version-tagged schema URLs; captures the version segment.
export const CDH_VERSIONED_URL =
  /^(https:\/\/cgiar-climate-data-hub\.github\.io\/cdh-metadata-standard)\/(v\d+\.\d+\.\d+)\//;

export const list = (v) => (Array.isArray(v) ? v : []);

// Cross-field rules documented in standard.md that the schema cannot express:
// value-to-value comparisons (dates, lengths), name cross-references between
// arrays, per-property uniqueness, and the SPDX expression grammar. Anything a
// schema keyword can state belongs in the schema, not here.
export default function checkCrossFieldRules(doc, { isSpdx = () => true } = {}) {
  const validateSpdxExpression = isSpdx;
  const out = [];
  if (typeof doc?.cdh_schema_version === "string") {
    const refs = list(doc?.extensions).map((url, i) => [`extensions/${i}`, url]);
    for (const [path, url] of refs) {
      if (typeof url !== "string") continue;
      const urlVersion = url.match(CDH_VERSIONED_URL)?.[2];
      if (urlVersion && urlVersion !== doc.cdh_schema_version) {
        out.push(
          `/${path}: URL targets ${urlVersion} but cdh_schema_version is ${doc.cdh_schema_version} - a record must reference one release throughout`,
        );
      }
    }
  }
  if (typeof doc?.license === "string" && !validateSpdxExpression(doc.license)) {
    out.push(`/license: must be a valid SPDX license expression`);
  }
  // A temporal axis's precision is how its values are written; the schema keeps
  // one precision per axis, so the first string's length gives it.
  const UNITS = ["year", "month", "day", "time"];
  const unitOf = (s) =>
    typeof s === "string" ? ({ 4: "year", 7: "month", 10: "day" }[s.length] ?? "time") : undefined;
  const stepUnit = (step) =>
    /T/.test(step) ? "time" : /[DW]/.test(step) ? "day" : /M/.test(step) ? "month" : "year";
  const dims = new Map();
  list(doc?.dimensions).forEach((d, i) => {
    const extent = list(d?.extent);
    const temporal = d?.type === "temporal";
    const unit = temporal ? unitOf(extent[0] ?? list(d?.values)[0]) : undefined;
    if (unit && extent.length === 2) {
      if (typeof d?.step === "string" && UNITS.indexOf(stepUnit(d.step)) > UNITS.indexOf(unit)) {
        out.push(`/dimensions/${i}/extent: written as ${unit}, coarser than step ${d.step}`);
      } else if (Date.parse(extent[0]) > Date.parse(extent[1])) {
        out.push(`/dimensions/${i}/extent: start ${extent[0]} is after end ${extent[1]}`);
      }
    }
    dims.set(d?.name, {
      count: list(d?.values).length + list(d?.categories).length + extent.length,
      temporal,
      unit,
    });
  });
  const varNames = new Set(list(doc?.variables).map((v) => v?.name));
  // A coded value has one meaning; 1 and "1" are the same code.
  for (const field of ["dimensions", "variables"]) {
    list(doc?.[field]).forEach((v, i) => {
      const seen = new Set();
      list(v?.categories).forEach((c, k) => {
        const key = String(c?.value);
        if (seen.has(key)) {
          out.push(`/${field}/${i}/categories/${k}/value: duplicate value "${key}"`);
        }
        seen.add(key);
      });
    });
  }
  // Structures name declared dimensions and variables. With structures, every
  // variable sits in one and every asset lists the structures it holds.
  const structures = new Map();
  list(doc?.structures).forEach((s, i) => {
    if (typeof s?.name !== "string") return;
    if (structures.has(s.name)) out.push(`/structures/${i}/name: duplicate name "${s.name}"`);
    structures.set(s.name, s);
    list(s?.dimensions).forEach((d, k) => {
      if (!dims.has(d)) {
        out.push(`/structures/${i}/dimensions/${k}: "${d}" does not match any dimensions[].name`);
      }
    });
    list(s?.variables).forEach((v, k) => {
      if (!varNames.has(v)) {
        out.push(`/structures/${i}/variables/${k}: "${v}" does not match any variables[].name`);
      }
    });
  });
  const placed = new Set([...structures.values()].flatMap((s) => list(s?.variables)));
  list(doc?.variables).forEach((v, i) => {
    if (structures.size > 0 && typeof v?.name === "string" && !placed.has(v.name)) {
      out.push(`/variables/${i}: "${v.name}" is not in any structures[]`);
    }
  });
  // The structures each asset holds, resolved once for every check that needs them.
  const held = list(doc?.data).map((asset, i) => {
    // The schema requires the list whenever the record declares structures[].
    if (!Array.isArray(asset?.structures)) return [];
    const found = [];
    const seen = new Map();
    asset.structures.forEach((name, k) => {
      const s = structures.get(name);
      if (!s) {
        out.push(`/data/${i}/structures/${k}: "${name}" does not match any structures[].name`);
        return;
      }
      found.push(s);
      for (const v of list(s.variables)) {
        if (seen.has(v)) {
          out.push(
            `/data/${i}: variable "${v}" is in structures "${seen.get(v)}" and "${name}" - an asset holds each variable in one structure`,
          );
        }
        seen.set(v, name);
      }
    });
    return found;
  });
  // Unit a strftime directive spells; a format may not go finer than the axis values.
  const DIRECTIVE_UNIT = { Y: "year", m: "month", d: "day" };
  list(doc?.data).forEach((asset, i) => {
    const tpl = asset?.href_template;
    if (typeof tpl !== "string" || tpl === "") return;
    // {token} or {token:strftime}; the spec spells a temporal value the way the file name does.
    for (const [, token, spec] of tpl.matchAll(/\{([^}:]+)(?::([^}]*))?\}/g)) {
      const dim = dims.get(token);
      // The schema checks token syntax and requires variables[] for {variable}.
      if (token === "variable") {
        // nothing to resolve
      } else if (!dim) {
        out.push(`/data/${i}/href_template: token {${token}} has no matching dimensions[].name`);
      } else if (dim.count === 0) {
        out.push(
          `/data/${i}/href_template: dimension "${token}" must list its values, categories, or extent`,
        );
      } else {
        // A template assumes every combination exists, so each held structure needs the token.
        for (const s of held[i]) {
          if (!list(s.dimensions).includes(token)) {
            out.push(
              `/data/${i}/href_template: token {${token}} is not a dimension of structure "${s.name}"`,
            );
          }
        }
      }
      if (spec === undefined) continue;
      if (!dim?.temporal) {
        out.push(
          `/data/${i}/href_template: token {${token}:${spec}} carries a format, which is only allowed on a type: temporal dimension`,
        );
      } else if (dim.unit) {
        const finest = Math.max(
          ...[...spec.matchAll(/%([Ymd])/g)].map(([, c]) => UNITS.indexOf(DIRECTIVE_UNIT[c])),
        );
        if (finest > UNITS.indexOf(dim.unit)) {
          out.push(
            `/data/${i}/href_template: token {${token}:${spec}} is finer than the axis values (${dim.unit}); never invent a month, day, or time`,
          );
        }
      }
    }
  });
  const { created, updated } = doc;
  if (typeof created === "string" && typeof updated === "string") {
    if (new Date(updated) < new Date(created)) {
      out.push(`/updated: must be >= created (${created})`);
    }
  }
  const steps = list(doc?.processing);
  const stepIds = new Set();
  steps.forEach((step, i) => {
    if (step?.id == null) return;
    if (stepIds.has(step.id)) out.push(`/processing/${i}/id: duplicate id "${step.id}"`);
    stepIds.add(step.id);
  });
  list(doc?.data).forEach((asset, i) => {
    for (const ref of list(asset?.processing_steps)) {
      if (!stepIds.has(ref)) {
        out.push(`/data/${i}/processing_steps: "${ref}" does not match any processing[].id`);
      }
    }
  });
  // dimensions[] and variables[] share one namespace: they are the columns of
  // one table and the tokens href_template resolves, so a name must be unique
  // across both.
  const declaredNames = new Set();
  for (const [field, entries] of [
    ["dimensions", doc?.dimensions],
    ["variables", doc?.variables],
  ]) {
    list(entries).forEach((entry, i) => {
      if (typeof entry?.name !== "string") return;
      if (declaredNames.has(entry.name)) {
        out.push(
          `/${field}/${i}/name: duplicate name "${entry.name}" - dimensions[] and variables[] share one namespace`,
        );
      }
      declaredNames.add(entry.name);
    });
  }
  const assetNames = new Set();
  for (const [field, assets] of [
    ["data", doc?.data],
    ["additional_assets", doc?.additional_assets],
  ]) {
    list(assets).forEach((asset, i) => {
      if (asset?.name == null) return;
      if (assetNames.has(asset.name)) {
        out.push(
          `/${field}/${i}/name: duplicate asset name "${asset.name}" - names become asset keys and must be unique across data[] and additional_assets[]`,
        );
      }
      assetNames.add(asset.name);
    });
  }
  list(doc?.foreign_keys).forEach((fk, i) => {
    const left = list(fk?.fields);
    const right = list(fk?.reference?.fields);
    if (left.length && right.length && left.length !== right.length) {
      out.push(
        `/foreign_keys/${i}: fields (${left.length}) and reference.fields (${right.length}) must have the same length`,
      );
    }
    left.forEach((f, k) => {
      if (typeof f === "string" && !declaredNames.has(f)) {
        out.push(
          `/foreign_keys/${i}/fields/${k}: "${f}" does not match any declared dimensions[]/variables[] name`,
        );
      }
    });
    // A key's columns must sit together in one asset, or no asset carries the key.
    const together = held.some((ss) => {
      const cols = new Set(ss.flatMap((s) => [...list(s.dimensions), ...list(s.variables)]));
      return left.every((f) => cols.has(f));
    });
    if (structures.size > 0 && left.every((f) => declaredNames.has(f)) && !together) {
      out.push(`/foreign_keys/${i}/fields: no data[] asset holds all of [${left.join(", ")}]`);
    }
  });
  return out;
}
