#!/usr/bin/env node
// The bundled CDH profile is advertised for plain JSON Schema validators.
// Keep one focused check that it rejects first-party extension fields when the
// matching extension URL is missing from extensions[], and that core data
// dictionary fields need no extension URL.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import yaml from "js-yaml";

import { newAjv, rel, ROOT } from "./_ajv.js";

const PROFILE = resolve(ROOT, "spec/schemas/profiles/cdh.schema.bundled.json");

// The shared negative-fixture base, declaring only the cdh extension.
const base = yaml.load(await readFile(resolve(ROOT, "tests/base.yaml"), "utf-8"), {
  schema: yaml.CORE_SCHEMA,
});
base.extensions = base.extensions.filter((url) => url.includes("/extensions/cdh/"));
const extensionUrl = (name) => base.extensions[0].replace("/cdh/", `/${name}/`);

const cases = [
  {
    name: "climate",
    extension: extensionUrl("climate"),
    field: { climate: { mip_era: "CMIP6" } },
  },
  {
    name: "agriculture",
    extension: extensionUrl("agriculture"),
    field: { commodities: ["maize"] },
  },
];

const schema = JSON.parse(await readFile(PROFILE, "utf-8"));
const validate = newAjv().compile(schema);

let failures = 0;
for (const test of cases) {
  const undeclared = { ...base, ...test.field };
  if (validate(undeclared)) {
    failures += 1;
    console.error(`FAIL ${test.name}: bundled profile allowed field without extension URL`);
  }

  const declared = {
    ...undeclared,
    extensions: [...base.extensions, test.extension],
  };
  if (!validate(declared)) {
    failures += 1;
    console.error(`FAIL ${test.name}: bundled profile rejected field with extension URL`);
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || "/"}: ${err.message}`);
    }
  }
}

// Data dictionary fields are core: valid with only the cdh extension, still checked.
const crop = { name: "crop", type: "crop", description: "Crop code axis." };
const yld = { name: "yield", description: "Crop yield." };
const withDictionary = (dimensions) => ({
  ...base,
  structures: [{ name: "main", dimensions, variables: [yld] }],
  data: base.data.map((asset) => ({ ...asset, structures: ["main"] })),
});
if (!validate(withDictionary([crop]))) {
  failures += 1;
  console.error("FAIL data dictionary: bundled profile rejected core structures[]");
  for (const err of validate.errors ?? [])
    console.error(`  ${err.instancePath || "/"}: ${err.message}`);
}
if (validate(withDictionary([{ name: "crop", type: "crop" }]))) {
  failures += 1;
  console.error("FAIL data dictionary: bundled profile allowed a dimension without description");
}

if (failures > 0) process.exit(1);
console.log(`ok   ${rel(PROFILE)} first-party extension declarations and core data dictionary`);
