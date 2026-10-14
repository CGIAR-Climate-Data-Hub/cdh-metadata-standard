#!/usr/bin/env node
// Build vocab/commodity.json from FAO's crop and livestock classifications.
//
// Sources (see vocab/sources/README.md for provenance and license):
//   vocab/sources/icc11-core.csv         FAO Indicative Crop Classification 1.1
//   vocab/sources/icc11-agrovoc.csv      ICC 1.1 -> AGROVOC correspondence
//   vocab/sources/wca2030-livestock.json WCA 2030 Classification of livestock
//
// Every concept gets:
//   - id       kebab-case identifier derived from the official label
//   - label    the official label
//   - code     the source classification's code (ICC or WCA)
//   - uri      the source concept URI, where the classification has one (ICC)
//   - parents  ancestor ids, nearest first, ending in `crops` or `livestock`
//   - agrovoc  AGROVOC concept URI, where a correspondence exists
//
// `crops` and `livestock` are roots added here so a facet can select one side;
// both are real AGROVOC concepts.
//
// Regenerate after updating a source:  node scripts/build-commodity-vocab.js
// Then regenerate the enum schema:     npm run gen-schemas

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { ROOT } from "./_ajv.js";

const SOURCES = resolve(ROOT, "vocab/sources");
const TARGET = resolve(ROOT, "vocab/commodity.json");
const AGROVOC = "http://aims.fao.org/aos/agrovoc/";

const ROOTS = {
  crops: { label: "Crops", agrovoc: `${AGROVOC}c_1972` },
  livestock: { label: "Livestock", agrovoc: `${AGROVOC}c_4397` },
};

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

// Parentheticals are dropped so "Onions (incl. shallots)" gives `onions`,
// unless that collides with another label; then the full label is used.
const taken = new Map();
function slugify(name) {
  const short = slug(name.replace(/\s*\([^)]*\)/g, ""));
  const id = taken.has(short) && taken.get(short) !== name ? slug(name) : short;
  taken.set(id, name);
  return id;
}

function slug(name) {
  const id = name
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`Cannot derive a valid id from "${name}" (got "${id}")`);
  }
  return id;
}

// RFC 4180: quoted fields may hold commas, newlines, and doubled quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') ((field += '"'), i++);
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(field), (field = ""));
    else if (c === "\n") (row.push(field), rows.push(row), (row = []), (field = ""));
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length > 0) (row.push(field), rows.push(row));
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""])));
}

// Walk `broader` codes up to the root, nearest first.
function parentsOf(code, byCode, root) {
  const parents = [];
  for (let p = byCode.get(code)?.broader; p; p = byCode.get(p)?.broader) {
    parents.push(byCode.get(p).id);
  }
  parents.push(root);
  return parents;
}

async function main() {
  const icc = parseCsv(await readFile(resolve(SOURCES, "icc11-core.csv"), "utf-8"));
  const corr = parseCsv(await readFile(resolve(SOURCES, "icc11-agrovoc.csv"), "utf-8"));
  const wca = JSON.parse(await readFile(resolve(SOURCES, "wca2030-livestock.json"), "utf-8"));

  const agrovocByIcc = new Map(
    corr.filter((r) => r.corr || r.partialCorr).map((r) => [r.code, r.corr || r.partialCorr]),
  );

  const concepts = Object.entries(ROOTS).map(([id, r]) => ({
    id,
    label: r.label,
    agrovoc: r.agrovoc,
  }));

  const iccByCode = new Map(
    icc.map((r) => [r.code, { ...r, id: slugify(r.label_en), label: r.label_en.trim() }]),
  );
  for (const r of iccByCode.values()) {
    const concept = { id: r.id, label: r.label, code: r.code, uri: r.uri };
    concept.parents = parentsOf(r.code, iccByCode, "crops");
    const a = agrovocByIcc.get(r.code);
    if (a) concept.agrovoc = `${AGROVOC}c_${a}`;
    concepts.push(concept);
  }

  const wcaByCode = new Map(
    wca.concepts.map((r) => [r.code, { ...r, id: slugify(r.label), label: r.label.trim() }]),
  );
  for (const r of wcaByCode.values()) {
    const concept = { id: r.id, label: r.label, code: r.code };
    concept.parents = parentsOf(r.code, wcaByCode, "livestock");
    if (r.agrovoc) concept.agrovoc = `${AGROVOC}${r.agrovoc}`;
    concepts.push(concept);
  }

  concepts.sort((a, b) => a.id.localeCompare(b.id));

  // Self-check: unique ids and every parent resolves, so the generated file
  // needs no external structure schema.
  const ids = new Set();
  for (const c of concepts) {
    if (ids.has(c.id)) throw new Error(`duplicate id "${c.id}"`);
    ids.add(c.id);
  }
  for (const c of concepts) {
    for (const p of c.parents ?? []) {
      if (!ids.has(p)) throw new Error(`concept "${c.id}" references unknown parent "${p}"`);
    }
  }

  const vocab = {
    scheme: {
      id: "cdh-commodity",
      title: "Climate Data Hub Commodity Vocabulary",
      description:
        "Controlled vocabulary of crops and livestock used by the Climate Data Hub " +
        "for metadata filtering and catalog browse. Crops are generated from the FAO " +
        "Indicative Crop Classification 1.1 and livestock from the WCA 2030 " +
        "Classification of livestock; each concept carries its source code, ancestor " +
        "ids for roll-up under `crops` or `livestock`, and an AGROVOC URI where one " +
        "corresponds.",
      source_schemes: [
        {
          id: "fao-icc-1-1",
          uri: "https://stats.fao.org/classifications/ICC/v1.1/scheme",
          title: "FAO Indicative Crop Classification (ICC) 1.1",
        },
        {
          id: "fao-wca2030-livestock",
          uri: "https://www.fao.org/world-census-agriculture/wca-round/round-2030-(2026-2035)/en",
          title: "WCA 2030 Classification of livestock (Annex 8)",
        },
      ],
    },
    concepts,
  };

  await writeFile(TARGET, JSON.stringify(vocab, null, 2) + "\n");
  console.log(`wrote ${concepts.length} concepts to vocab/commodity.json`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
