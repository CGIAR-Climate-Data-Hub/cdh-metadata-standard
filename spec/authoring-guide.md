This guide is for people filling out metadata records. It explains what to write
first, what can wait, and where optional detail belongs.

The formal standard is `standard.md`. Fillable YAML starting points live in
`../templates/`; each template binds YAML-aware editors to the CDH profile
(`schemas/profiles/cdh.schema.json` = the core plus the CDH extensions) for
validation and field hints.

## The Short Version

Start with enough metadata for someone to find, understand, cite, and access the
resource without opening the files.

Fill these first:

- `id`
- `title`
- `description`
- `resource_type`
- `cdh.domain`
- `keywords`
- `license`
- `contact` with at least one `role: licensor`
- `citation`
- `created`
- `updated`
- `data`

Then add only the sections that apply to the resource.

Optional and conditional sections are useful, but they should not make every
record feel complicated. If a field does not apply, leave it out.

## What Good Metadata Should Answer

A useful record lets a person or an automated tool answer:

- What is this resource?
- What can it be used for?
- Who produced or maintains it?
- How should it be cited?
- What license applies?
- Where can the data, code, or documentation be found?
- What geography and time period does it cover?
- What variables, units, dimensions, or classes does it contain?
- What sources and processing created it?
- What limitations or caveats matter?

## Minimum Record

Use this as the first pass.

```yaml
id: ""
title: ""
description: ""
resource_type: ""
extensions:
  - https://cgiar-climate-data-hub.github.io/metadata/v0.0.1/extensions/cdh/schema.json
keywords: []
license: ""
contact:
  - organization: ""
    role: licensor
    email: ""
    url: ""
citation: ""
created: # can be filled during CDH review
updated: # can be filled during CDH review
cdh:
  domain: []
data:
  - name: ""
    locations:
      - url: ""
    description: ""
    media_type: ""
```

## Required Fields

### `id`

A short, stable, URL-safe identifier.

Use lowercase words with hyphens:

```yaml
id: banana-climate-risk-indicators
```

### `title`

A concise human-readable name.

```yaml
title: Banana Climate Risk Indicators
```

### `description`

One short paragraph explaining what the resource is and what it can be used for.

Do not rely on the description for filterable facts. Put those facts in the
structured fields too.

### `resource_type`

What kind of thing the record describes.

Common values:

- `dataset`
- `software`
- `ai-skill`
- `document`

### `cdh.domain`

The main CDH category used for browsing, filtering, and catalog placement.

Use values from `vocab/domain.json`. Put the primary domain first.

```yaml
cdh:
  domain: [agriculture, climate]
```

### `keywords`

Free-text search terms. Use words people are likely to search for.

Do not repeat values that already have a structured field. Use `keywords` for
extra search phrases, aliases, method names, acronyms, and user-facing terms
that are not already captured elsewhere.

Put these in structured fields instead:

| If the term is a...                              | Put it in...        |
| ------------------------------------------------ | ------------------- |
| places, countries, regions, or named geographies | `spatial.geography` |
| crop, livestock type, or commodity               | `commodities`       |
| climate hazard                                   | `climate.hazards`   |
| time period or temporal resolution               | `temporal.*`        |

```yaml
keywords:
  - zonal statistics
  - weighted mean
  - climate risk screening
  - growing season
```

#### Linking keywords to an ontology

It is recomended, but not required, to link keywords to an ontology if it
exists. To attach an external ontology link (AGROVOC, GEMET, etc.) to a keyword,
use the object form:

```yaml
keywords:
  - zonal statistics
  - term: Food security
    scheme: https://www.eionet.europa.eu/gemet/
    uri: https://www.eionet.europa.eu/gemet/en/concept/1838
    description: Availability of food and access to it.
```

Plain-string keywords stay full-text-only. Both forms can be mixed in the same
list.

### `license`, `contact`, and `citation`

These make the record reusable and citable.

Prefer SPDX license identifiers such as `CC-BY-4.0`, `CC0-1.0`, or `MIT`.

For `contact`, use either an organization contact or a person contact. Every
record must include at least one contact with `role: licensor`; that contact is
the licensing party for the resource.

Organization contact:

```yaml
contact:
  - organization: Alliance of Bioversity International and CIAT
    role: licensor
    url: https://alliancebioversityciat.org/
```

Person contact:

```yaml
contact:
  - name: Jane Doe
    organization: CGIAR
    role: processor
    email: jane.doe@example.org
```

If `name` is used, include `organization` too. `organization` on its own is OK.
Use only official STAC provider roles: `licensor`, `producer`, `processor`, or
`host`.

### `created` and `updated`

These timestamps are required in serialized records. In draft authoring files,
they may be left blank when CDH review manages metadata timestamps.

### `data`

At least one link to the resource.

```yaml
data:
  - name: primary-data
    locations:
      - url: https://example.org/data.parquet
    description: Primary Parquet table
    media_type: application/vnd.apache.parquet
```

Each asset's `locations` lists one or more access paths to the **same content**
(the first is canonical). Use extra entries only for a different way to reach
the same file (e.g., an S3 mirror of an HTTPS URL); different formats or a
queried service belong in separate `data` / `additional_assets` entries.

If you know the media type or file size, provide it. If either value is missing
it will be added during CDH review.

## Add These Only When They Apply

Some of these are CDH extension fields - `climate`, `commodities`, `classes`, and
`variables`/`dimensions`. The CDH template already declares them in
`extensions[]`, so you only fill the ones that apply. `spatial`, `temporal`,
`processing`, and the asset fields are core and always available.

Using an extension from another project or center? Add its pinned schema URL to
`extensions[]`, bind the matching profile via the
`# yaml-language-server: $schema=` line for validation and hints, then fill its
fields the same way - the core + extension model is identical regardless of who
owns the extension. See `standard.md` section 4.3.

### Spatial

Use `spatial` when the resource has geographic coverage or geospatial assets.

Common fields:

- `spatial.bbox`
- `spatial.geography`
- `spatial.crs`
- `spatial.geometry_column`
- `spatial.resolution`

`spatial.bbox` is a list of bounding boxes in WGS84 (EPSG:4326).

Bounding box coordinate order is:

- 2D: `[west, south, east, north]` = `[xmin, ymin, xmax, ymax]`
- 3D: `[west, south, min_z, east, north, max_z]` (elevation in metres)

If submitting multiple bounding boxes, the first entry is the overall extent;
only add more entries if the union would otherwise leave a large uncovered area
(e.g., Germany + Chile) and data is split across multiple bounding boxes.

When converting from common tools, watch the axis order. Here is a comparison
across several tools + stac:

| From                     | Output order               | CDH bbox                     |
| ------------------------ | -------------------------- | ---------------------------- |
| R `terra::ext(r)`        | `xmin, xmax, ymin, ymax`   | `[xmin, ymin, xmax, ymax]`   |
| R `sf::st_bbox(x)`       | `xmin, ymin, xmax, ymax`   | `[xmin, ymin, xmax, ymax]`   |
| Python `rasterio.bounds` | `left, bottom, right, top` | `[left, bottom, right, top]` |
| GDAL `gdalinfo` corners  | `ulx, uly, lrx, lry`       | `[ulx, lry, lrx, uly]`       |
| STAC `bbox`              | `xmin, ymin, xmax, ymax`   | `[xmin, ymin, xmax, ymax]`   |

```yaml
spatial:
  bbox:
    - [-180.0, -90.0, 180.0, 90.0] # whole Earth
    - [-10.0, 10.0, 10.0, 20.0] # a small region included
```

`spatial.geography` is the named-place facet for browse and filtering (the
precise footprint lives in `spatial.bbox`). Use ids from `vocab/geography.json`,
a controlled list built from UN M49. Because M49 includes regions, you can tag
macro-regions as easily as countries - `[sub-saharan-africa]`,
`[eastern-africa]`, `[kenya, uganda]`, or `[world]` (M49's top level; there is
no `global`). Country ids resolve to their ISO3 code on output, and `parents`
let the catalog roll a country up under its region.

If `spatial.bbox` or `spatial.crs` is omitted for a geospatial STAC record, the
CDH review process will add it. Provide these fields when you know them,
especially for multi-asset records or when the first asset is not
representative.

Use `spatial.resolution` for the spatial spacing or unit at which values are
represented. For regular grids, use `type: xy` when x/y spacing is the same:

```yaml
spatial:
  resolution:
    - type: xy
      value: 0.08333333333333333
      unit: degree
      label: 5 arc-minutes
      reference_system: EPSG:4326
```

For polygon reporting units such as counties or watersheds:

```yaml
spatial:
  resolution:
    - type: polygon
      value: 2
      unit: admin-level
      label: Counties
      reference_system: GAUL
```

Use `spatial.geometry_column` when a vector/table asset contains an embedded
geometry column.

### Temporal

Use `temporal` when the resource has a time period, forecast period, projection
period, or recurring observations.

Common fields:

- `temporal.start_date`
- `temporal.end_date`
- `temporal.resolution`

Use `temporal.resolution.step` for the machine-readable time step when known
(ISO 8601 durations such as `P1D`, `P1M`, or `P1Y`). If not know, this will be
added during CDH review. Use `values` for named or easily interpretable temporal
positions.

```yaml
temporal:
  start_date: "1981-01-01"
  end_date: "2020-12-31"
  resolution:
    values: []
    unit: daily
    step: P1D
    note: ""
```

### Variables and dimensions

Use `variables` when the resource has measurements, bands, columns, indicators,
or other named data values.

```yaml
variables:
  - name: heat_stress_days
    dimensions: [time, scenario]
    description: >
      Number of days during the growing period when daily maximum temperature
      exceeded the heat stress threshold. Higher values indicate greater heat
      hazard.
    data_type: float32
    unit: day
    note: >
      This indicator describes temperature stress only and does not represent
      full crop impact.
```

For each variable:

- Use `description` for what the variable measures.
- Include the normal reading guidance in `description` when direction matters.
- Use `note` for variable-specific limitations, caveats, or warnings.
- Use the record-level `note` for dataset-wide limitations.

For inspectable files, the CDH review process may add technical details such as
column names, data types, bands, nodata values, or dimensions when they can be
determined from the asset URL, file extension, or inspectable metadata. Review
cannot reliably determine what a variable means, what unit should be used, how
values should be interpreted, or what caveats matter.

**Dimensions**

Use `dimensions` when variables depend on additional axes such as scenario,
model, crop, technology, band, etc. Time dimension is already covered by
`temporal` metadata field.

Define coded values. If a code is not obvious, explain it in the dimension
description, point to a controlled vocabulary, or link a sidecar code list.

### Classes

Use `classes` for categorical values, class maps, bitfields, or classified
rasters.

For long class lists, link a sidecar file instead of putting everything in the
record.

### Processing

Use `processing` for derived products, generated datasets, or resources where
source data and methods matter.

Keep it concise. A single `source` step is enough for simple records.

```yaml
processing:
  - id: source
    description: >
      Daily climate data were aggregated to GAUL admin2 zones and summarized as
      baseline and future-period indicators.
    code:
      url: https://github.com/example-org/climate-risk-pipeline
      version: 0f3ac9d # Commit hash but could also be version tag
    date: 2026-04-21
    derived_from:
      - title: NEX-GDDP-CMIP6
        url: https://example.org/nex-gddp-cmip6
```

### Climate Fields

Use `climate` fields only when the resource is climate-related and the field
applies.

Possible Fields:

- `climate.hazards`
- `climate.scenarios`
- `climate.models`
- `climate.mip_era`
- `climate.baseline`
- `climate.bias_adjustment`
- `climate.downscaling`

### Commodities

Use `commodities` for agriculture, food-systems, livestock, and crop resources.

Use values from `vocab/commodity.json`.

### Additional Assets and Links

Use these for supporting files, documentation, previews, schemas, QA/QC output,
code lists, alternate formats, or services.

For `additional_assets`, provide `media_type` and `file_size` when known. If
either value is missing, the CDH review process may add it when it can be
determined from the asset URL, file extension, or inspectable metadata.
Serialized records must contain the required values, whether supplied by the
contributor or added during CDH review.

## What Review Cannot Decide

The CDH review process may help fill technical facts from inspectable assets,
but authors must provide the curatorial facts:

- `title`
- `description`
- `license`
- `citation`
- `cdh.domain`
- `commodities`
- `climate.*`
- variable meaning, units, reading guidance, and caveats
- whether a record should be published

## What To Leave Out

Leave a field out when:

- It does not apply to the resource.
- The value would only repeat another field.
- The information is unknown and not required.
- The detail belongs in a sidecar file because it is long, nested, or likely to
  change.

Avoid inventing new fields. If an important fact has no place in the template,
first check the formal standard, then consider whether it belongs in
`additional_links`, `additional_assets`, a sidecar file, or a CDH extension - an
existing extension's field, a new field proposed on one, or a new extension (see
`standard.md` section 4.3).

## Practical Authoring Order

1. Fill the minimum record.
2. Add `spatial` and `temporal` if relevant.
3. Add `variables`, and include units and reading guidance.
4. Add `dimensions` or `classes` only if they are needed to understand values.
5. Add `processing` for derived products.
6. Add climate, commodity, and use-case fields when they improve discovery.
7. Add sidecars or extra links for long supporting detail.
8. Review the record using the checklist in `standard.md`.

## Quick Review

Before publishing, check:

- The title and description are understandable without opening the data.
- Search and filter facts are in structured fields, not only prose.
- Variables have units and plain-language meaning.
- Important caveats are in `note`.
- Data, code, documentation, citation, and license links are stable.
- Optional fields are omitted when they do not apply.
