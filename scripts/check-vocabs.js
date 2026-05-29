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
  const doc = JSON.parse(await readFile(file, "utf-8"));
  if (validate(doc)) {
    console.log(`ok   ${rel(file)}`);
  } else {
    failures += 1;
    console.error(`FAIL ${rel(file)}`);
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || "/"}: ${err.message}`);
    }
  }
}

if (failures > 0) process.exit(1);
