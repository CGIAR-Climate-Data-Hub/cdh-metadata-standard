#!/usr/bin/env node
// Validate vocab/*.json against spec/schemas/vocab/vocabulary.schema.json.

import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { newAjv, rel, ROOT } from "./_ajv.js";

const META_PATH = resolve(ROOT, "spec/schemas/vocab/vocabulary.schema.json");
const VOCAB_DIR = resolve(ROOT, "vocab");

const ajv = newAjv();
const meta = JSON.parse(await readFile(META_PATH, "utf-8"));
const validate = ajv.compile(meta);

const entries = await readdir(VOCAB_DIR);
const files = entries.filter((n) => n.endsWith(".json")).map((n) =>
  resolve(VOCAB_DIR, n)
);

if (files.length === 0) {
  console.log("No vocab files found.");
  process.exit(0);
}

let failures = 0;
for (const file of files) {
  let doc;
  try {
    doc = JSON.parse(await readFile(file, "utf-8"));
  } catch (err) {
    failures += 1;
    console.error(`FAIL ${rel(file)}`);
    console.error(`  /: ${err.message}`);
    continue;
  }

  const errors = [];
  if (!validate(doc)) {
    for (const err of validate.errors ?? []) {
      errors.push(`${err.instancePath || "/"}: ${err.message}`);
    }
  }

  errors.push(...vocabErrors(doc));

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
  if (!Array.isArray(doc.concepts)) return [];

  const errors = [];
  const conceptIds = new Map();
  for (const [index, concept] of doc.concepts.entries()) {
    if (!concept || typeof concept !== "object") continue;
    if (typeof concept.id !== "string") continue;

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
    if (!concept || typeof concept !== "object") continue;
    if (!Array.isArray(concept.broader)) continue;

    for (const [broaderIndex, id] of concept.broader.entries()) {
      if (typeof id !== "string") continue;
      if (!conceptIds.has(id)) {
        errors.push(
          `/concepts/${index}/broader/${broaderIndex}: unknown concept id "${id}"`,
        );
      }
    }
  }

  return errors;
}
