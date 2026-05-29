#!/usr/bin/env node
// Validate CDH input YAML records against metadata-input.schema.json.
//
// Usage:
//   node scripts/validate-yaml.js                # default: spec/standard.yaml + examples/
//   node scripts/validate-yaml.js path [path...] # validate the given files or directories
//
// Directories are walked recursively for *.yaml and *.yml files. Files of any
// other extension are accepted as-is (so explicit non-.yaml paths still work).

import { readdir, readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import yaml from "js-yaml";

import { loadAllSchemas, newAjv, rel, ROOT } from "./_ajv.js";

const INPUT_SCHEMA_ID =
  "https://cgiar.org/cdh/schemas/metadata-input.schema.json";

async function walkYaml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkYaml(full)));
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (ext === ".yaml" || ext === ".yml") out.push(full);
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
  return st.isDirectory() ? walkYaml(abs) : [abs];
}

async function defaultTargets() {
  const targets = [resolve(ROOT, "spec/standard.yaml")];
  const examplesDir = resolve(ROOT, "examples");
  try {
    const st = await stat(examplesDir);
    if (st.isDirectory()) targets.push(...(await walkYaml(examplesDir)));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  return targets;
}

const argPaths = process.argv.slice(2);
const files = argPaths.length === 0
  ? await defaultTargets()
  : (await Promise.all(argPaths.map(expand))).flat();

if (files.length === 0) {
  console.error("error: no YAML files to validate");
  process.exit(2);
}

const ajv = newAjv();
await loadAllSchemas(ajv);
const validate = ajv.getSchema(INPUT_SCHEMA_ID);
if (!validate) {
  console.error(`Could not load schema ${INPUT_SCHEMA_ID}`);
  process.exit(2);
}

let failures = 0;
for (const file of files) {
  let doc;
  try {
    doc = yaml.load(await readFile(file, "utf-8"));
  } catch (err) {
    failures += 1;
    console.error(`FAIL ${rel(file)}: YAML parse error: ${err.message}`);
    continue;
  }
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
