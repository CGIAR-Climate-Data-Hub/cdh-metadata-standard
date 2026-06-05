#!/usr/bin/env node
// Build vocab/geography.json from the official UN M49 CSV export.
//
// Source of truth: vocab/sources/un-m49.csv (UNSD - Methodology export,
// semicolon-delimited). This script flattens the M49 hierarchy into a single
// list of selectable geographies (World, regions, sub-regions, intermediate
// regions, and countries), each with:
//   - id      kebab-case identifier derived from the official name
//   - label   the official M49 name
//   - code    the M49 numeric code
//   - iso3    ISO 3166-1 alpha-3 (countries only)
//   - parents ancestor ids, nearest first (enables roll-up filtering)
//   - groups  LDC / LLDC / SIDS membership (countries only)
//
// Regenerate after updating the CSV:  node scripts/build-geography-vocab.js
// Then regenerate the enum schema:     npm run gen-schemas

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { ROOT } from "./_ajv.js";

const SOURCE = resolve(ROOT, "vocab/sources/un-m49.csv");
const TARGET = resolve(ROOT, "vocab/geography.json");

const GROUP_COLUMNS = [
  { index: 12, name: "LDC" },
  { index: 13, name: "LLDC" },
  { index: 14, name: "SIDS" },
];

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(name) {
  const id = name
    .normalize("NFD")
    .replace(DIACRITICS, "") // strip combining diacritic marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`Cannot derive a valid id from "${name}" (got "${id}")`);
  }
  return id;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  lines.shift(); // header
  return lines.map((line) => line.split(";"));
}

async function main() {
  const rows = parseCsv(await readFile(SOURCE, "utf-8"));

  // code -> concept. Region/sub-region/intermediate codes repeat across rows;
  // dedupe by code. id -> code guards against two distinct codes colliding to
  // the same id.
  const byCode = new Map();
  const idToCode = new Map();

  const register = (node) => {
    const existing = byCode.get(node.code);
    if (existing) {
      if (existing.id !== node.id) {
        throw new Error(
          `M49 code ${node.code} maps to conflicting names "${existing.label}" / "${node.label}"`,
        );
      }
      return;
    }
    const clash = idToCode.get(node.id);
    if (clash && clash !== node.code) {
      throw new Error(
        `id "${node.id}" derived from two codes (${clash}, ${node.code})`,
      );
    }
    idToCode.set(node.id, node.code);
    byCode.set(node.code, node);
  };

  for (const row of rows) {
    // Build the world -> country chain for this row, skipping blank levels.
    const chain = [{ code: row[0] || "001", name: row[1] || "World" }];
    if (row[2]) chain.push({ code: row[2], name: row[3] }); // region
    if (row[4]) chain.push({ code: row[4], name: row[5] }); // sub-region
    if (row[6]) chain.push({ code: row[6], name: row[7] }); // intermediate
    chain.push({
      code: row[9],
      name: row[8],
      iso3: row[11] || undefined,
      groups: GROUP_COLUMNS.filter((g) => row[g.index]?.trim() === "x").map(
        (g) => g.name,
      ),
      isCountry: true,
    }); // country

    chain.forEach((node, i) => {
      // parents: every ancestor, nearest first.
      const parents = chain.slice(0, i).reverse().map((a) => slugify(a.name));
      const concept = {
        id: slugify(node.name),
        label: node.name,
        code: node.code,
      };
      if (node.iso3) concept.iso3 = node.iso3;
      if (parents.length > 0) concept.parents = parents;
      if (node.isCountry && node.groups.length > 0) concept.groups = node.groups;
      register(concept);
    });
  }

  const concepts = [...byCode.values()].sort((a, b) => a.id.localeCompare(b.id));

  // Self-check: every parent must resolve to a known concept id. This keeps the
  // integrity guarantee at the source, so the generated file needs no external
  // structure schema.
  const ids = new Set(concepts.map((c) => c.id));
  for (const concept of concepts) {
    for (const parent of concept.parents ?? []) {
      if (!ids.has(parent)) {
        throw new Error(
          `concept "${concept.id}" references unknown parent "${parent}"`,
        );
      }
    }
  }

  const vocab = {
    scheme: {
      id: "cdh-geography",
      title: "Climate Data Hub Geography Vocabulary",
      description:
        "Controlled vocabulary of geographies (World, regions, sub-regions, " +
        "intermediate regions, and countries) used by the Climate Data Hub for " +
        "metadata filtering and catalog browse. Generated from the UN M49 " +
        "standard; each concept carries its M49 code, ISO 3166-1 alpha-3 code " +
        "(countries), ancestor ids for roll-up, and LDC/LLDC/SIDS membership.",
      source_scheme: {
        id: "un-m49",
        uri: "https://unstats.un.org/unsd/methodology/m49/",
        title: "UN Standard Country or Area Codes for Statistical Use (M49)",
      },
    },
    concepts,
  };

  await writeFile(TARGET, JSON.stringify(vocab, null, 2) + "\n", "utf-8");
  console.log(
    `Wrote ${concepts.length} concepts to ${TARGET.replace(ROOT + "/", "")}`,
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
