# Climate Data Hub Metadata & Discovery Standard (Draft)

## Purpose

This repository defines a lightweight framework for structuring, documenting, and cataloging climate datasets so they can be:

- discovered by humans and AI systems
- interpreted correctly
- reused in analytical and decision-support contexts
- linked clearly to methods, code, and source data

The aim is not to create a perfect or exhaustive standard. The aim is to create a practical, enforceable approach that improves interoperability, reproducibility, and discoverability without imposing excessive burden on contributors.

---

## Scope

This draft is intended for datasets and derived data products used in climate-related analysis, including but not limited to:

- climate hazard and risk datasets
- climate vulnerability and risk assessment (CVRA) outputs
- adaptation and mitigation analytics
- exposure and sensitivity datasets
- zonal summaries derived from gridded products
- vector, raster, and tabular data products
- datasets intended for use in analytical workflows, proposals, or decision support systems

---

## Design Principles

### 1. Keep the core standard minimal
Only require metadata fields that are genuinely important for discovery, interpretation, and repeatability.

### 2. Prefer pragmatic consistency over formal perfection
Do not delay delivery by attempting to build complete ontologies or exhaustive controlled vocabularies before implementation.

### 3. Combine structure with narrative
Structured fields are needed for filtering and indexing. Narrative descriptions are needed for interpretation by humans and AI systems.

### 4. Treat datasets as discovery objects
A dataset is not just a file. A useful catalog entry must communicate what the data are, what they mean, how they were created, and what they can be used for.

### 5. Separate row-level data from dataset-level metadata
Do not duplicate invariant metadata in large tables. Row-level tables should contain only fields that vary by row. Dataset-level metadata should hold provenance, input sources, and processing context.

### 6. Support reproducibility through "ingredients + recipe"
Each dataset should declare:
- the key input datasets used
- the subset of those datasets used, where relevant
- the code or pipeline used to generate outputs

### 7. Design for AI use, but do not rely on AI to fix poor metadata
AI can help interpret good metadata, but cannot reliably compensate for ambiguous, inconsistent, or missing metadata.

---

## Recommended System Architecture

The standard is designed to support a layered system:

### Layer 1. Data assets
Examples:
- Parquet
- Zarr
- Cloud-Optimized GeoTIFF (COG)
- GeoPackage
- CSV

### Layer 2. Structured metadata
Machine-readable metadata describing:
- discovery fields
- provenance
- ingredients
- access
- variables
- use cases

### Layer 3. Narrative documentation
Human-readable and AI-readable documentation describing:
- what the dataset is
- how it was generated
- how it should be interpreted
- how it can be used

### Layer 4. Catalog interface
Searchable catalog entries rendered from metadata to support browsing, filtering, and retrieval.

A STAC-based catalog is a suitable outer layer for discovery, but STAC alone is not sufficient. It should be extended with additional metadata and linked documentation.

---

## Recommended Approach to Tabular Data

## Long format as the default
Where feasible, tabular data should use a long format rather than wide format. This is preferred because it:

- handles multiple variables more flexibly
- works better with Parquet and columnar storage
- simplifies indexing and querying
- scales better across heterogeneous datasets

However, long format should not be treated as a rigid requirement. Some datasets may require alternative structures.

## Row-level fields should only include information that varies by row
Do not repeat invariant metadata such as:
- boundary source
- boundary version
- processing date
- code repository
- ingredient sources

These belong in dataset-level metadata.

---

## Recommended Row-Level Table Structure

The exact schema will vary by dataset, but the following pattern is recommended.

### Core row-level fields

```text
dataset_id
zone_id or geometry_id

admin0_iso
admin1_id (optional)
admin2_id (optional)

lat (optional)
lon (optional)

variable
value
unit

time_start
time_end
time_label
time_unit

statistic
error_value (optional)
error_type (optional)

scenario (optional)
model (optional)

category_1 (optional)
category_2 (optional)
category_3 (optional)
```

## Notes

### Geography
Use stable IDs or ISO codes where possible. Where rows are linked to zonal systems, `zone_id` should be the stable identifier from the source geography.

### Time
Avoid mixing incompatible time representations in a single field. Prefer:
- `time_start`
- `time_end`
- `time_label`
- `time_unit`

This is clearer than storing mixed values such as `1982`, `1982.01`, `MAM`, `baseline`, or `2030-2050` in a single field.

### Variables
Variable names should be consistent and interpretable. Avoid vague or opaque names.

Good examples:
- `rainfall_total`
- `rainfall_anomaly`
- `tasmax`
- `yield_maize`
- `heat_stress_days`

Poor examples:
- `rain`
- `precip_final`
- `var1`
- `score_new`

---

## Dataset-Level Metadata: Minimum Required Fields

Each dataset should have a metadata record containing the following minimum fields.

## 1. Identification

```yaml
title:
short_description:
dataset_id:
version:
status:
```

### Notes
- `title` should be human-readable
- `short_description` should describe the dataset clearly in plain language
- `version` should identify the dataset version, not just the metadata version

---

## 2. Discovery Fields

```yaml
themes:
commodities:
hazards:
geographies:
use_cases:
keywords:
```

### Notes
These fields support search, filtering, and AI interpretation.

Examples:
- `themes`: climate risk, adaptation, mitigation, exposure
- `commodities`: maize, banana, rice
- `hazards`: drought, heat, flood
- `use_cases`: proposal preparation, breeding prioritisation, adaptation planning

These do not need to be formal ontologies, but they should be reasonably consistent.

---

## 3. Spatial and Temporal Coverage

```yaml
spatial_coverage:
temporal_coverage:
resolution:
```

### Notes
These can be free text initially if needed, but should be clear.

Examples:
- `spatial_coverage`: Kenya, East Africa, global
- `temporal_coverage`: 1981-2010 baseline; 2030-2050 projections
- `resolution`: 0.25 degree, admin2, HydroBASINS level 6

---

## 4. Access

```yaml
data_access:
code_access:
documentation_access:
license:
```

### Notes
Use stable links where possible:
- DOI
- persistent URL
- stable S3 or STAC URL
- GitHub repository URL

---

## 5. Variable Summary

```yaml
variables:
  - name:
    definition:
    unit:
    interpretation:
    limitations:
```

### Notes
This is essential. Every important variable should be explainable in plain language.

The `interpretation` field is especially important for AI and users. It should indicate directionality where relevant.

Examples:
- Higher values indicate greater hazard
- Higher values indicate wetter conditions
- Negative values indicate lower than baseline conditions

---

## 6. Geographic Extraction Metadata

If the dataset contains zonal or aggregated summaries derived from gridded or vector sources, record the extraction geography at dataset level.

```yaml
aggregation_geography:
  source:
  version:
  level:
  id_field:
  notes:
```

### Examples
- source: GAUL
- version: 2015
- level: admin2
- id_field: ADM2_CODE

This is important for repeatability and interpretation.

### Recommended default zonal systems
Where possible, use a small set of preferred systems:
- administrative: GAUL
- hydrological: HydroBASINS
- AEZ: GAEZ or a clearly documented custom system

Country-specific alternatives may be used where appropriate, especially where national preferences or border sensitivities apply, but they must be clearly documented.

---

## 7. Ingredient Manifest

Each dataset should include a minimal list of important input datasets.

```yaml
ingredients:
  - role:
    name:
    version:
    access:
    subset:
```

### Explanation of fields

- `role`: what function the input served
  - examples: climate, boundary, exposure, crop mask, hazard source

- `name`: source dataset name
  - examples: NEX-GDDP, GAUL, HydroBASINS

- `version`: source dataset version
  - examples: v2, 2015, level 6

- `access`: DOI or stable link

- `subset`: the part of the source actually used
  - variables
  - scenarios
  - models
  - time range
  - level

### Example
```yaml
ingredients:
  - role: climate
    name: NEX-GDDP
    version: v2
    access: https://example.org/nex-gddp
    subset:
      variables: [tasmax, pr]
      scenarios: [ssp245, ssp585]
      models: all
      time_range: 1981-2010, 2030-2050

  - role: boundary
    name: GAUL
    version: 2015
    access: https://example.org/gaul
    subset:
      level: admin2
```

### Important
Do not try to capture everything. Capture enough to tell a researcher what the main ingredients were and allow them to repeat the work in practice.

---

## 8. Processing Recipe

Each dataset should include a concise description of how outputs were generated.

```yaml
process:
  code_repo:
  code_version:
  processing_date:
  summary:
```

### Notes
- `code_version` can be a commit hash, release tag, or other stable version reference
- `summary` should describe the main processing steps in plain language

### Example
```yaml
process:
  code_repo: https://github.com/example-org/climate-risk-pipeline
  code_version: 0f3ac9d
  processing_date: 2026-04-21
  summary: >
    Seasonal rainfall and temperature indicators were calculated from daily climate
    data, aggregated to GAUL admin2 using zonal means, and expressed as baseline
    climatologies and future anomalies.
```

---

## 9. Narrative Documentation Template

Each dataset should be accompanied by a short narrative description that can be rendered in a catalog and read by both humans and AI systems.

## Recommended sections

### Overview
What is the dataset?

### Why it matters
What problem does it help address?

### Spatial and temporal scope
Where and when does it apply?

### Methods summary
How was it created?

### Data ingredients
What main source datasets were used?

### Key variables
What are the main variables and how should they be interpreted?

### Intended use cases
What kinds of decisions or analyses can this support?

### Limitations
What should users not do with it?

### Access and code
Where can the data and code be found?

---

## 10. Catalog Rendering

Metadata should be sufficient to render a searchable catalog entry automatically.

## Minimum catalog card fields

```yaml
catalog_entry:
  title:
  short_description:
  themes:
  commodities:
  hazards:
  geographies:
  use_cases:
  variables_summary:
  methods_summary:
  data_access:
  code_access:
```

This allows the catalog to support both browsing and structured search.

---

## 11. AI Readiness

The standard should support AI systems in three ways:

### 1. Discovery
Metadata should allow AI systems to find datasets relevant to a query.

Example query:
> What is the climate risk to banana in Kenya?

Relevant metadata fields:
- geographies
- commodities
- hazards
- themes
- use_cases

### 2. Interpretation
Metadata and narrative documentation should allow AI systems to explain:
- what the dataset contains
- how it was generated
- how values should be interpreted

### 3. Access
Metadata should provide stable links to:
- data
- code
- documentation

Where data are stored in cloud-native formats such as Parquet, Zarr, or COG, documentation should explain how users or agents can subset and retrieve values.

---

## 12. On Controlled Vocabularies and Ontologies

This approach does not depend on building heavy ontologies before implementation.

### Current recommendation
- use consistent naming conventions
- use light tagging for discovery
- use strong variable descriptions
- defer complex ontology work unless it becomes necessary

AI may assist with translation across slightly different terminologies in future, but it cannot reliably correct unclear or inconsistent metadata. Minimal structure is still required.

---

## 13. What This Standard Deliberately Does Not Require

To keep implementation practical, the following are not mandatory in the core standard:

- full provenance graphs
- exhaustive ontologies
- full file-level checksums
- detailed asset lineage for every intermediate file
- complete controlled vocabularies before rollout

These may be added later where useful, but should not block implementation.

---

## 14. Validation Rules

The following should be enforced wherever possible:

### Required
- title
- short_description
- dataset_id
- version
- at least one theme
- at least one geography
- data access link
- at least one variable definition
- ingredient manifest
- processing recipe

### Strongly recommended
- use_cases
- hazards
- commodities
- code access link
- aggregation geography for zonal products

---

## Worked Example

# Example Dataset Metadata Record

```yaml
title: Kenya Banana Climate Risk Indicators
short_description: >
  Dataset providing climate hazard indicators relevant to banana production in Kenya,
  including heat stress and rainfall anomalies, summarised at GAUL admin2 level for
  baseline and future periods.

dataset_id: kenya_banana_climate_risk_admin2
version: v1.0
status: draft

themes:
  - climate risk
  - adaptation
  - exposure

commodities:
  - banana

hazards:
  - heat
  - drought

geographies:
  - Kenya

use_cases:
  - climate risk assessment
  - adaptation planning
  - proposal preparation
  - breeding prioritisation

keywords:
  - banana
  - Kenya
  - admin2
  - climate hazard
  - rainfall anomaly
  - heat stress

spatial_coverage: Kenya
temporal_coverage: Baseline 1981-2010; future 2030-2050
resolution: GAUL admin2

data_access: s3://climate-data-hub/kenya/banana/climate_risk_admin2.parquet
code_access: https://github.com/example-org/metadata-discovery
documentation_access: https://example.org/catalog/kenya_banana_climate_risk_admin2
license: CC-BY-4.0

aggregation_geography:
  source: GAUL
  version: 2015
  level: admin2
  id_field: ADM2_CODE
  notes: >
    Zonal summaries were generated using GAUL admin2 boundaries. Users should confirm
    whether national boundary preferences apply for country-specific analysis.

variables:
  - name: heat_stress_days
    definition: >
      Number of days during the growing period in which daily maximum temperature
      exceeded the defined threshold for heat stress.
    unit: days
    interpretation: Higher values indicate greater heat hazard.
    limitations: >
      This indicator reflects temperature stress only and does not represent full crop impact.

  - name: rainfall_anomaly
    definition: >
      Difference in seasonal rainfall total relative to the baseline climatology.
    unit: mm
    interpretation: Negative values indicate drier than baseline conditions.
    limitations: >
      Does not reflect intra-seasonal rainfall distribution or timing.

ingredients:
  - role: climate
    name: NEX-GDDP
    version: v2
    access: https://example.org/nex-gddp
    subset:
      variables:
        - tasmax
        - pr
      scenarios:
        - ssp245
        - ssp585
      models: all
      time_range: 1981-2010, 2030-2050

  - role: boundary
    name: GAUL
    version: 2015
    access: https://example.org/gaul
    subset:
      level: admin2

  - role: exposure
    name: Banana cultivation mask
    version: v1
    access: https://example.org/banana-mask
    subset:
      geography: Kenya

process:
  code_repo: https://github.com/example-org/climate-risk-pipeline
  code_version: 0f3ac9d
  processing_date: 2026-04-21
  summary: >
    Daily climate data were used to calculate heat stress and seasonal rainfall indicators.
    Results were filtered to banana-relevant geographies, aggregated to GAUL admin2 using
    zonal means and counts, and expressed for baseline and future periods.

catalog_entry:
  title: Kenya Banana Climate Risk Indicators
  short_description: >
    Admin2-level climate hazard indicators for banana production in Kenya, including
    heat stress and rainfall anomalies for baseline and future periods.
  themes:
    - climate risk
    - adaptation
  commodities:
    - banana
  hazards:
    - heat
    - drought
  geographies:
    - Kenya
  use_cases:
    - adaptation planning
    - proposal preparation
  variables_summary:
    - heat_stress_days
    - rainfall_anomaly
  methods_summary: >
    Derived from NEX-GDDP climate projections and summarised to GAUL admin2.
  data_access: s3://climate-data-hub/kenya/banana/climate_risk_admin2.parquet
  code_access: https://github.com/example-org/climate-risk-pipeline
```

# Example Row-Level Table Structure

CSV form (as it would appear in the file):

```text
dataset_id,zone_id,admin0_iso,variable,value,unit,time_start,time_end,time_label,time_unit,statistic,scenario,model,category_1,category_2
kenya_banana_climate_risk_admin2,KEN.1.3_1,KEN,heat_stress_days,24,days,2030-01-01,2050-12-31,2030-2050,climatology,mean,ssp245,all,commodity,banana
kenya_banana_climate_risk_admin2,KEN.1.3_1,KEN,rainfall_anomaly,-42,mm,2030-03-01,2050-05-31,MAM,season,mean,ssp245,all,commodity,banana
```

One record expanded (field-by-field):

| field | record 1 | record 2 |
|---|---|---|
| dataset_id | kenya_banana_climate_risk_admin2 | kenya_banana_climate_risk_admin2 |
| zone_id | KEN.1.3_1 | KEN.1.3_1 |
| admin0_iso | KEN | KEN |
| variable | heat_stress_days | rainfall_anomaly |
| value | 24 | -42 |
| unit | days | mm |
| time_start | 2030-01-01 | 2030-03-01 |
| time_end | 2050-12-31 | 2050-05-31 |
| time_label | 2030-2050 | MAM |
| time_unit | climatology | season |
| statistic | mean | mean |
| scenario | ssp245 | ssp245 |
| model | all | all |
| category_1 | commodity | commodity |
| category_2 | banana | banana |

---

## Final Note

This standard is intended to be practical, not exhaustive. It should be implemented early, refined through use, and improved iteratively. The immediate goal is to ensure that datasets can be found, understood, and reused in real-world analytical workflows without creating excessive burden for contributors.
