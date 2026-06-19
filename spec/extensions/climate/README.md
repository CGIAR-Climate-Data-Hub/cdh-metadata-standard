# Climate Extension

Climate projection provenance: baseline, scenarios, models, downscaling, hazards.

- **Applies to:** climate projection, CMIP-based, hazard/risk, and adaptation
  resources.
- **Schema:** `https://cgiar-climate-data-hub.github.io/metadata/v0.0.1/extensions/climate/schema.json`
- **Declared in** a record's `extensions[]`. See [the standard](../../standard.md),
  §4.3, for the extension mechanism.

## `climate.mip_era`

- **Requirement:** Conditional. Required when the resource is based on CMIP
  model output.
- **Vocabulary (informal):** `CMIP5`, `CMIP6`.

## `climate.scenarios[]`

- **Requirement:** Conditional. Required for projection, scenario, adaptation,
  or future-climate resources.
- **Vocabulary (informal):** SSP labels (`ssp126`, `ssp245`, `ssp370`,
  `ssp585`), RCP labels (`rcp26`, `rcp45`, `rcp85`), or `historic`.

## `climate.models[]`

- **Requirement:** Conditional. Required for CMIP-based resources.
- **Vocabulary (informal):** Canonical CMIP source IDs (e.g., `MPI-ESM1-2-HR`,
  `MRI-ESM2-0`). Use `ensemble` to indicate a multi-model ensemble.

## `climate.hazards[]`

- **Requirement:** Conditional. Required for risk, impact, climate-service, and
  adaptation datasets.
- **Vocabulary:** Values MUST appear in `vocab/hazard.json`. That file is
  AGROVOC-aligned and maps each name to its AGROVOC URI.
- **Expected value:** List of friendly names (e.g., `drought`, `heat-stress`,
  `flooding`, `cold-stress`).
- **Encoding:** Expanded into a `themes` entry under the CDH hazard scheme (see
  themes generation in [the standard](../../standard.md)). Does not appear as a
  standalone field in the encoded output.

## `climate.baseline`

- **Requirement:** Conditional. Required when the dataset reports anomalies,
  departures, or future values relative to a baseline.
- **Expected value:** `{ start_date, end_date }`.

## `climate.bias_adjustment`

- **Requirement:** Conditional. Required for bias-adjusted climate data.
- **Expected value:** `{ method, reference_dataset }`.

## `climate.downscaling`

- **Requirement:** Conditional. Required for downscaled climate data.
- **Expected value:** `{ method, resolution }`.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/metadata/v0.0.1/extensions/climate/schema.json
climate:
  mip_era: CMIP6
  scenarios: [ssp245, ssp585]
  models: [MPI-ESM1-2-HR, ensemble]
  hazards: [drought, heat-stress]
  baseline:
    start_date: "1981-01-01"
    end_date: "2010-12-31"
  bias_adjustment:
    method: quantile-mapping
    reference_dataset: CHIRPS
  downscaling:
    method: statistical
    resolution: 0.05
```
