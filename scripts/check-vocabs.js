#!/usr/bin/env node
// Validate hand-maintained vocab/*.json against vocabulary.schema.json.
//
// Generated vocab files (built from an external source by a script) are skipped
// here: their generator guarantees their shape, so a separate structure schema
// would be redundant.

import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { newAjv, rel, ROOT } from "./_ajv.js";

const META_PATH = resolve(ROOT, "spec/schemas/vocab/vocabulary.schema.json");
const VOCAB_DIR = resolve(ROOT, "vocab");

// Built by scripts/build-geography-vocab.js, which self-checks its output.
const GENERATED = new Set(["geography.json"]);

const ajv = newAjv();
const validate = ajv.compile(JSON.parse(await readFile(META_PATH, "utf-8")));

const entries = await readdir(VOCAB_DIR);
const files = entries
  .filter((n) => n.endsWith(".json") && !GENERATED.has(n))
  .map((n) => resolve(VOCAB_DIR, n));

let failures = 0;
for (const file of files) {
  const doc = JSON.parse(await readFile(file, "utf-8"));
  // Cross-reference checks assume the shape the schema guarantees.
  const errors = validate(doc)
    ? vocabErrors(doc)
    : validate.errors.map((err) => `${err.instancePath || "/"}: ${err.message}`);

  if (errors.length === 0) {
    console.log(`ok   ${rel(file)}`);
  } else {
    failures += 1;
    console.error(`FAIL ${rel(file)}`);
    for (const err of errors) {
      console.error(`  ${err}`);
    }
  }
}

if (failures > 0) process.exit(1);

function vocabErrors(doc) {
  const errors = [];
  const conceptIds = new Map();
  for (const [index, concept] of doc.concepts.entries()) {
    const firstIndex = conceptIds.get(concept.id);
    if (firstIndex === undefined) {
      conceptIds.set(concept.id, index);
    } else {
      errors.push(
        `/concepts/${index}/id: duplicate id "${concept.id}" first used at /concepts/${firstIndex}/id`,
      );
    }
  }

  for (const [index, concept] of doc.concepts.entries()) {
    for (const [broaderIndex, id] of (concept.broader ?? []).entries()) {
      if (!conceptIds.has(id)) {
        errors.push(`/concepts/${index}/broader/${broaderIndex}: unknown concept id "${id}"`);
      }
    }
  }

  return errors;
}
