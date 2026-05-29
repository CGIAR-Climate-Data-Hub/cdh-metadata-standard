#!/usr/bin/env node
// Compile every CDH JSON Schema to catch broken $refs and dialect issues.

import { findSchemaFiles, newAjv, rel } from "./_ajv.js";
import { readFile } from "node:fs/promises";

const files = await findSchemaFiles();
if (files.length === 0) {
  console.log("No schemas found under spec/schemas or spec/extensions.");
  process.exit(0);
}

const ajv = newAjv();

// Register every schema first so cross-file $refs resolve.
const schemas = [];
for (const file of files) {
  const schema = JSON.parse(await readFile(file, "utf-8"));
  ajv.addSchema(schema);
  schemas.push({ file, schema });
}

let failures = 0;
for (const { file, schema } of schemas) {
  try {
    ajv.compile(schema);
    console.log(`ok   ${rel(file)}`);
  } catch (err) {
    failures += 1;
    console.error(`FAIL ${rel(file)}: ${err.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} schema(s) failed to compile.`);
  process.exit(1);
}
