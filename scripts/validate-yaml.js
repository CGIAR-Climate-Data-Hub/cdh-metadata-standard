#!/usr/bin/env node
// Validate CDH input YAML records in two layers:
//   mechanism - core composed with only the extensions each record declares in
//     extensions[]; a field from an extension that was used but not declared
//     is rejected (unevaluatedProperties). Always applied.
//   profile (--profile) - a policy schema with house rules (e.g. the CDH
//     profile requires the cdh extension on every record). Optional; the CDH
//     pipeline passes its own profile exactly like any other adopter would.
//
// Usage:
//   node scripts/validate-yaml.js                # default: examples/
//   node scripts/validate-yaml.js path [path...] # validate the given files or directories
//
// Flags:
//   --profile <schema.json>  also validate every record against this policy
//                            schema (the CDH pipeline passes the CDH profile;
//                            adopters pass their own or omit for mechanism-only)
//   --schemas <file-or-dir>  register additional extension schemas (repeatable),
//                            e.g. a third-party extension a record declares
//   --expect-fail            invert the outcome: every file MUST be invalid;
//                            used for the negative fixtures in tests/invalid/,
//                            each merged over the valid tests/base.yaml
//
// Directories are walked recursively for *.yaml and *.yml files. Files of any
// other extension are accepted as-is (so explicit non-.yaml paths still work).

import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

import yaml from "js-yaml";
import validateSpdxExpression from "spdx-expression-validate";

import { loadAllSchemas, newAjv, rel, ROOT } from "./_ajv.js";
// The cross-field rules live beside the schema and are published with it, so a
// browser can run the same source. This script is the only Node caller.
import checkCrossFieldRules, { CDH_VERSIONED_URL, list } from "../spec/checks/cross-field.js";

// Version-tagged $id matches the schema's published gh-pages URL. The version
// comes from package.json so a release bump flows through automatically.
const { version } = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf-8"));
const BASE = `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v${version}`;
const CORE_ID = `${BASE}/schemas/core.schema.json`;

// Records keep the URLs of the release they target, so declared URLs are
// resolved against this checkout's schemas regardless of version.
const toCurrentVersion = (url) => url.replace(CDH_VERSIONED_URL, `$1/v${version}/`);

const YAML_EXTS = [".yaml", ".yml"];

async function walk(dir, exts) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...(await walk(full, exts)));
    } else if (entry.isFile() && exts.includes(extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

async function expand(path) {
  const abs = resolve(process.cwd(), path);
  let st;
  try {
    st = await stat(abs);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`error: path not found: ${path}`);
      process.exit(2);
    }
    throw err;
  }
  return st.isDirectory() ? walk(abs, YAML_EXTS) : [abs];
}

const defaultTargets = () => walk(resolve(ROOT, "examples"), YAML_EXTS);

const argPaths = [];
const extraSchemaPaths = [];
let profilePath = null;
let expectFail = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--schemas") {
    const next = argv[++i];
    if (!next) {
      console.error("error: --schemas requires a file or directory");
      process.exit(2);
    }
    extraSchemaPaths.push(next);
  } else if (argv[i] === "--profile") {
    profilePath = argv[++i];
    if (!profilePath) {
      console.error("error: --profile requires a schema file");
      process.exit(2);
    }
  } else if (argv[i] === "--expect-fail") {
    expectFail = true;
  } else {
    argPaths.push(argv[i]);
  }
}

const files =
  argPaths.length === 0 ? await defaultTargets() : (await Promise.all(argPaths.map(expand))).flat();

if (files.length === 0) {
  console.error("error: no YAML files to validate");
  process.exit(2);
}

const ajv = newAjv();
await loadAllSchemas(ajv);
for (const path of extraSchemaPaths) {
  const abs = resolve(process.cwd(), path);
  const jsonFiles = (await stat(abs)).isDirectory() ? await walk(abs, [".json"]) : [abs];
  for (const file of jsonFiles) {
    const schema = JSON.parse(await readFile(file, "utf-8"));
    ajv.addSchema(schema);
  }
}
if (!ajv.getSchema(CORE_ID)) {
  console.error(`Could not load core schema ${CORE_ID}`);
  process.exit(2);
}

let profileId = null;
if (profilePath) {
  const schema = JSON.parse(await readFile(resolve(process.cwd(), profilePath), "utf-8"));
  profileId = schema.$id;
  if (!profileId) {
    console.error(`error: profile schema ${profilePath} must declare an $id`);
    process.exit(2);
  }
  if (!ajv.getSchema(profileId)) {
    ajv.addSchema(schema);
  }
}

// Compose the mechanism schema for one record: core + only the extensions it
// declares in extensions[]. unevaluatedProperties:false then rejects a field
// whose extension was used but not declared. Policy (e.g. "cdh is required")
// lives in the --profile schema, not here.
function mechanismFor(validator, doc) {
  const declared = list(doc?.extensions);
  const known = [];
  const unknown = [];
  for (const url of declared) {
    if (typeof url !== "string") continue;
    const resolved = toCurrentVersion(url);
    if (validator.getSchema(resolved)) {
      known.push(resolved);
    } else {
      unknown.push(url);
    }
  }
  const schema = {
    allOf: [{ $ref: CORE_ID }, ...known.map((url) => ({ $ref: url }))],
    unevaluatedProperties: false,
  };
  return { schema, known, unknown };
}

// Turn an Ajv error into something an author can act on: name the offending
// property for unevaluated/additional-property errors, and show (a sample of)
// the allowed values for enum misses.
function describeError(err) {
  const p = err.params ?? {};
  // A `false` subschema means "this field is not allowed here" (e.g. temporal
  // date vs start_date/end_date); Ajv's own wording says nothing useful.
  if (err.keyword === "false schema") return "must not be present alongside its sibling fields";
  if (err.keyword === "pattern" && err.instancePath.endsWith("/href_template")) {
    return "tokens must be {name} or {name:format}, a format using only %Y %m %d %H %M %j";
  }
  const stray = p.unevaluatedProperty ?? p.additionalProperty;
  if (stray != null) return `${err.message}: "${stray}"`;
  if (Array.isArray(p.allowedValues)) {
    const sample = p.allowedValues.slice(0, 8).join(", ");
    const more = p.allowedValues.length > 8 ? ", …" : "";
    return `${err.message}: ${sample}${more}`;
  }
  return err.message;
}

// Collect every problem for one file; empty array = valid record.
function validateFile(file, doc) {
  const { schema, known, unknown } = mechanismFor(ajv, doc);
  if (unknown.length) {
    return {
      errors: [
        `unknown extension schema(s): ${unknown.join(", ")}`,
        "fields from an unregistered extension would be rejected - pass --schemas <file-or-dir> to register it",
      ],
    };
  }
  const seen = new Set();
  const validate = ajv.compile(schema);
  if (!validate(doc)) {
    // When any subschema fails, Ajv also flags every legitimate top-level
    // field as "unevaluated" - keep only strays that no composed schema
    // actually defines.
    const evaluable = new Set();
    for (const id of [CORE_ID, ...known]) {
      for (const key of Object.keys(ajv.getSchema(id)?.schema?.properties ?? {})) {
        evaluable.add(key);
      }
    }
    for (const err of validate.errors ?? []) {
      if (
        err.keyword === "unevaluatedProperties" &&
        err.instancePath === "" &&
        evaluable.has(err.params?.unevaluatedProperty)
      ) {
        continue;
      }
      seen.add(`${err.instancePath || "/"}: ${describeError(err)}`);
    }
  }
  if (profileId) {
    const validateProfile = ajv.getSchema(profileId);
    if (!validateProfile(doc)) {
      for (const err of validateProfile.errors ?? []) {
        // The mechanism layer owns stray-field detection (it knows what was
        // declared); profile-side unevaluated errors are duplicates or noise.
        if (err.keyword === "unevaluatedProperties") continue;
        const text = `${err.instancePath || "/"}: ${describeError(err)}`;
        if (!seen.has(text)) seen.add(`${text} (profile)`);
      }
    }
  }
  if (seen.size) return { errors: [...seen] };
  return {
    errors: [
      ...checkCrossFieldRules(doc, { isSpdx: validateSpdxExpression }),
      ...missingRelativeAssets(file, doc),
    ],
  };
}

// A relative additional_assets[] url names a file committed beside the record
// (standard.md 5.6). Only this script can see the filesystem, so the check
// lives here rather than in cross-field.js.
function missingRelativeAssets(file, doc) {
  const out = [];
  list(doc?.additional_assets).forEach((asset, i) => {
    list(asset?.locations).forEach((loc, j) => {
      const url = loc?.url;
      if (typeof url !== "string" || /^[a-z][a-z0-9+.-]*:/i.test(url)) return;
      if (!existsSync(resolve(dirname(file), url))) {
        out.push(
          `/additional_assets/${i}/locations/${j}/url: relative path "${url}" not found beside the record`,
        );
      }
    });
  });
  return out;
}

// Parse as YAML 1.2 / JSON-style: bare dates stay strings (matching the
// editor and the JSON output) instead of becoming JS Date objects.
const loadYaml = async (file) =>
  yaml.load(await readFile(file, "utf-8"), { schema: yaml.CORE_SCHEMA });
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const merge = (base, over) =>
  isObject(base) && isObject(over)
    ? {
        ...base,
        ...Object.fromEntries(Object.entries(over).map(([k, v]) => [k, merge(base[k], v)])),
      }
    : over;

// Negative fixtures hold only what breaks; the rest comes from a valid base.
const BASE_FILE = resolve(ROOT, "tests/base.yaml");
const base = expectFail ? await loadYaml(BASE_FILE) : undefined;
// An invalid base would make every fixture fail for the wrong reason.
if (base && validateFile(BASE_FILE, base).errors.length) {
  console.error(`error: ${rel(BASE_FILE)} must be valid`);
  process.exit(2);
}

let failures = 0;
for (const file of files) {
  let result;
  try {
    const doc = await loadYaml(file);
    result = validateFile(file, base ? merge(base, doc) : doc);
  } catch (err) {
    result = { errors: [err.message] };
  }
  const invalid = result.errors.length > 0;
  if (expectFail ? invalid : !invalid) {
    console.log(`ok   ${rel(file)}${expectFail ? " (invalid, as expected)" : ""}`);
  } else {
    failures += 1;
    console.error(`FAIL ${rel(file)}`);
    if (expectFail) {
      console.error("  expected this record to be invalid, but it validated cleanly");
    } else {
      for (const e of result.errors) console.error(`  ${e}`);
    }
  }
}

if (failures > 0) process.exit(1);
