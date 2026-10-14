#!/usr/bin/env node
// Build vocab/climate_model.json and vocab/climate_scenario.json from the CMIP
// controlled vocabularies (see vocab/sources/README.md for provenance and license).
//
//   vocab/sources/CMIP6_source_id.json      WCRP CMIP6 CVs: models
//   vocab/sources/CMIP6_experiment_id.json  WCRP CMIP6 CVs: experiments
//   vocab/sources/esgf-cmip5-model.json     ESGF CMIP5 model facet
//   vocab/sources/esgf-cmip5-experiment.json ESGF CMIP5 experiment facet
//
// Concept ids are the CMIP identifiers verbatim (`UKESM1-0-LL`, `ssp245`), not
// kebab-case, because records and ESGF join on the official spelling.
// Each concept carries `mip_era`, the eras it belongs to.
//
// Regenerate after updating a source:  node scripts/build-climate-vocabs.js
// Then regenerate the enum schemas:    npm run gen-schemas

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { ROOT } from "./_ajv.js";

const SOURCES = resolve(ROOT, "vocab/sources");

const SOURCE_SCHEMES = [
  {
    id: "wcrp-cmip6-cvs",
    uri: "https://github.com/WCRP-CMIP/CMIP6_CVs",
    title: "WCRP CMIP6 Controlled Vocabularies",
  },
  {
    id: "esgf-cmip5",
    uri: "https://esgf.ceda.ac.uk/esg-search/search?project=CMIP5",
    title: "ESGF search index, CMIP5 project facets",
  },
];

const read = async (name) => JSON.parse(await readFile(resolve(SOURCES, name), "utf-8"));

// Merge one era's ids into the map, so an id used by both eras lists both.
function add(byId, ids, era, extra = () => ({})) {
  for (const id of ids) {
    const c = byId.get(id) ?? { id, label: id, mip_era: [] };
    c.mip_era.push(era);
    Object.assign(c, extra(id));
    byId.set(id, c);
  }
}

function finish(byId) {
  const concepts = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const ids = new Set();
  for (const c of concepts) {
    if (ids.has(c.id)) throw new Error(`duplicate id "${c.id}"`);
    ids.add(c.id);
  }
  return concepts;
}

async function main() {
  const cmip6Models = (await read("CMIP6_source_id.json")).source_id;
  const cmip6Experiments = (await read("CMIP6_experiment_id.json")).experiment_id;
  const cmip5Models = (await read("esgf-cmip5-model.json")).values;
  const cmip5Experiments = (await read("esgf-cmip5-experiment.json")).values;

  const models = new Map();
  add(models, cmip5Models, "CMIP5");
  add(models, Object.keys(cmip6Models), "CMIP6", (id) => ({ label: cmip6Models[id].label }));
  // Not a CMIP term: a record built from several models tags the ensemble.
  models.set("ensemble", {
    id: "ensemble",
    label: "Multi-model ensemble",
    mip_era: ["CMIP5", "CMIP6"],
  });

  const scenarios = new Map();
  add(scenarios, cmip5Experiments, "CMIP5");
  add(scenarios, Object.keys(cmip6Experiments), "CMIP6", (id) => ({
    description: cmip6Experiments[id].description,
  }));

  const vocabs = {
    climate_model: {
      title: "Climate Data Hub Climate Model Vocabulary",
      description:
        "Climate model source ids for `climate.models`, generated from the WCRP CMIP6 " +
        "controlled vocabulary and the CMIP5 model facet of the ESGF search index, plus " +
        "`ensemble` for multi-model products. Ids are the CMIP spelling verbatim.",
      concepts: finish(models),
    },
    climate_scenario: {
      title: "Climate Data Hub Climate Scenario Vocabulary",
      description:
        "Experiment ids for `climate.scenarios`, generated from the WCRP CMIP6 controlled " +
        "vocabulary and the CMIP5 experiment facet of the ESGF search index. Ids are the " +
        "CMIP spelling verbatim.",
      concepts: finish(scenarios),
    },
  };

  for (const [name, v] of Object.entries(vocabs)) {
    const vocab = {
      scheme: {
        id: `cdh-${name.replace("_", "-")}`,
        title: v.title,
        description: v.description,
        source_schemes: SOURCE_SCHEMES,
      },
      concepts: v.concepts,
    };
    await writeFile(resolve(ROOT, `vocab/${name}.json`), JSON.stringify(vocab, null, 2) + "\n");
    console.log(`wrote ${v.concepts.length} concepts to vocab/${name}.json`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
