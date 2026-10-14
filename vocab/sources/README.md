# Vocabulary sources

Upstream files the `scripts/build-*-vocab.js` scripts read. Do not edit them by hand; replace the
file when the upstream publishes a new version and rerun the build.

| File                         | Source                                                                                                                                                                                    | Retrieved  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `un-m49.csv`                 | [UN M49 Standard Country or Area Codes](https://unstats.un.org/unsd/methodology/m49/overview/), UNSD CSV export                                                                           |            |
| `icc11-core.csv`             | [FAO Indicative Crop Classification 1.1](https://www.fao.org/statistics/caliper/classifications/icc/en), Caliper [CSV download](https://www.fao.org/statistics/caliper/tools/download/en) | 2026-10-13 |
| `icc11-agrovoc.csv`          | ICC 1.1 to AGROVOC correspondence, same Caliper download page                                                                                                                             | 2026-10-13 |
| `CMIP6_source_id.json`       | [WCRP CMIP6 Controlled Vocabularies](https://github.com/WCRP-CMIP/CMIP6_CVs), `main` branch, CC BY 4.0                                                                                    | 2026-10-13 |
| `CMIP6_experiment_id.json`   | Same repository                                                                                                                                                                           | 2026-10-13 |
| `esgf-cmip5-model.json`      | CMIP5 `model` facet of the [ESGF search index](https://esgf.ceda.ac.uk/esg-search/search?project=CMIP5&facets=model&limit=0&format=application/solr+json); CMIP5 published no CV file     | 2026-10-13 |
| `esgf-cmip5-experiment.json` | CMIP5 `experiment` facet, same index                                                                                                                                                      | 2026-10-13 |
| `wca2030-livestock.json`     | WCA 2030 Classification of livestock, transcribed by hand from the PDF; provenance is inside the file                                                                                     | 2026-10-13 |

License: FAO states that the statistical classifications it disseminates are in the public domain
and that no specific license applies
([Caliper FAQ](https://www.fao.org/statistics/caliper/resources/faq/en)). UN M49 is published by
UNSD for public use.
