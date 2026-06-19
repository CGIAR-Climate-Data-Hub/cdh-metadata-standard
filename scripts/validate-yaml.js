#!/usr/bin/env node
// Validate CDH input YAML records: core composed with only the extensions each
// record declares in extensions[]. A field from an extension that was used but
// not declared is rejected (unevaluatedProperties). cdh is always required.
//
// Usage:
//   node scripts/validate-yaml.js                # default: templates/ + examples/
//   node scripts/validate-yaml.js path [path...] # validate the given files or directories
//
// Directories are walked recursively for *.yaml and *.yml files. Files of any
// other extension are accepted as-is (so explicit non-.yaml paths still work).

import { readdir, readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import yaml from "js-yaml";

import { loadAllSchemas, newAjv, rel, ROOT } from "./_ajv.js";

// Version-tagged $id matches the schema's published gh-pages URL. The version
// comes from package.json so a release bump flows through automatically.
const { version } = JSON.parse(
  await readFile(resolve(ROOT, "package.json"), "utf-8"),
);
const BASE = `https://cgiar-climate-data-hub.github.io/metadata/v${version}`;
const CORE_ID = `${BASE}/schemas/core.schema.json`;
const CDH_EXT_URL = `${BASE}/extensions/cdh/schema.json`;

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
  const targets = [];
  const templatesDir = resolve(ROOT, "templates");
  try {
    const st = await stat(templatesDir);
    if (st.isDirectory()) targets.push(...(await walkYaml(templatesDir)));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
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
if (!ajv.getSchema(CORE_ID)) {
  console.error(`Could not load core schema ${CORE_ID}`);
  process.exit(2);
}

// Compose the validation schema for one record: core + only the extensions it
// declares in extensions[]. unevaluatedProperties:false then rejects a field
// whose extension was used but not declared. cdh is always required.
function profileFor(doc) {
  const declared = Array.isArray(doc?.extensions) ? doc.extensions : [];
  const known = [];
  const unknown = [];
  for (const url of declared) {
    if (typeof url !== "string") continue;
    (ajv.getSchema(url) ? known : unknown).push(url);
  }
  const schema = {
    allOf: [{ $ref: CORE_ID }, ...known.map((url) => ({ $ref: url }))],
    required: ["cdh", "extensions"],
    properties: { extensions: { contains: { const: CDH_EXT_URL } } },
    unevaluatedProperties: false,
  };
  return { schema, unknown };
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
  const { schema, unknown } = profileFor(doc);
  if (unknown.length) {
    console.warn(
      `warn ${rel(file)}: unrecognized extension(s), fields not validated: ${unknown.join(", ")}`,
    );
  }
  const validate = ajv.compile(schema);
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
