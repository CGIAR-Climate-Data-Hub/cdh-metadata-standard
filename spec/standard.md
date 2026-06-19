# Climate Data Hub Metadata Standard

Status: draft

This document defines the metadata model used by the Climate Data Hub. Every Hub
record, regardless of encoding, conforms to the field definitions, requirement
levels, and rules in this document.

Two encodings are supported:

- **STAC** - for spatial, spatiotemporal, gridded, raster, data-cube, and
  spatial/temporal tabular data. See [`mapping-stac.md`](./mapping-stac.md).
- **OGC API Records** (recordJSON) - for discoverable resources that are not
  naturally spatial: non-spatipotemporal datasets, documents, code, models,
  notebooks, dashboards, services, methods, knowledge products. See
  [`mapping-ogc-records.md`](./mapping-ogc-records.md).

For the field-level mapping table to both encodings, see
[`crosswalk.md`](./crosswalk.md). Fillable YAML authoring templates live in
[`templates/`](../templates/), including the complete
[`full-standard.yaml`](../templates/full-standard.yaml) template.

For contributor-facing guidance, start in
[`authoring-guide.md`](./authoring-guide.md).

> \[!NOTE] For now, all metadata submissions must be in CDH YAML format which
> will be automatically converted to STAC or OGC API Records. In the future,
> there may be an option to directly submit STAC or OGC API Records.

## 1. Purpose

A Hub record exists to make a resource:

- **Discoverable** by humans and tools.
- **Understandable** without opening the underlying files.
- **Citable** with a stable identifier and reference.
- **Validatable** against a schema.
- **Usable** by automated/AI tools without manual interpretation.

Free-text descriptions support these goals, but cannot be the only place where
structured, filterable facts are stored.

## 2. Versioning

The CDH metadata standard, schemas, controlled vocabularies, and extensions are
versioned together. A single git tag (`v<MAJOR>.<MINOR>.<PATCH>`) covers all of
them. `cdh_schema_version` in input YAML records matches the same tag.

For now, here is no independent extension version. This may change with incresed
use of the extensions. Published URLs follow the pattern `<base>/<TAG>/...`.

## 3. Requirement Levels

The standard follows RFC 2119-style requirement levels.

| Level       | Meaning                                     |
| ----------- | ------------------------------------------- |
| Required    | Metadata is invalid without this field.     |
| Recommended | Strongly expected unless not applicable.    |
| Conditional | Required only for certain resource classes. |
| Optional    | Useful, but not required.                   |

## 4. Authoring Rules

### 4.1 Routing

Every record sets `encoding: stac` or `encoding: ogc-records`. The encoder uses
this to select the serialization profile.

### 4.2 Native fields first

Each fact about the resource is encoded in the most standard place available, in
this order:

1. **Core field** of the chosen encoding (STAC or OGC Records).
2. **An approved STAC Extension field** (STAC only) - see the extension profile
   in `mapping-stac.md`.
3. **An approved `cgiar-cdh:*` field**, as defined by the CDH STAC Extension and
   the CDH OGC Records profile.
4. **A linked sidecar metadata asset** (`rel=describedby`) when the content is
   large, nested, or frequently changing. This can/should also be used to
   reference other dataset metadata files that may exist, that do not fit into
   the standard, such as a dataset README.
5. **A custom property or custom extension** (see section 4.3) when no standard
   placement fits.
6. **Free-text inside `description`**, as a last resort, when the fact genuinely
   cannot be structured.

### 4.3 Extending the schema

CDH metadata is a small, generic **core** plus optional **extensions**. A record
declares the extensions it uses in `extensions[]` (pinned schema URLs) and is
validated against a **profile** that composes the core with those extensions.
The CDH profile bundles the CDH-maintained extensions - `cdh`, `climate`,
`datacube`, `classification`, and `agriculture` (defined in section 5.5).

To carry metadata the standard does not yet cover:

1. Use a field from an existing CDH extension if one fits.
2. Add a field to the relevant CDH extension when it is broadly useful. It must
   land in the extension schema, profile, crosswalk, and examples before use.
3. Author a new extension - your own pinned schema - for project- or
   center-specific fields, and declare it in `extensions[]`. It composes with
   the core without modifying it.

A field that outlives one project or center is a sign it should be a shared
extension rather than an ad hoc addition.

How input fields map to STAC/OGC output extensions (including `cgiar-cdh:*`) is a
separate concern, covered in `mapping-stac.md` and `mapping-ogc-records.md`.

### 4.4 Description, note, and free text

`description` and `note` are first-class fields, not catch-all fallbacks:

- **`description` (required)** is the canonical human- and AI-readable paragraph
  explaining the resource.
- **`note` (optional)** is reserved for caveats, warnings, or
  interpretation-critical remarks that a reader of `description` alone would
  otherwise miss. It is not a second description, and not a place to dump prose
  that did not fit elsewhere. Use `note` only when something important would be
  lost without it.

A fact that is needed for search, filtering, faceting, or programmatic use MUST
be encoded as a structured field, not only mentioned in `description` or `note`.
`description` exists to contextualize structured facts; `note` exists to flag
caveats. Neither is the source of truth for filterable data.

### 4.5 Domain vs keywords (and how themes are produced)

`cdh.domain` and `keywords` are not interchangeable - each serves a different
purpose. There is no author-facing `themes` field; the serialized themes block
is generated by the encoder.

- **`cdh.domain` (required, closed vocab)** - the CDH-controlled high-level
  classification used for **structured browse, filter, and group-by** in the
  catalog UI, and for STAC sub-catalog placement. Values are validated against
  `vocab/domain.json`. This is where the website filter reads from. See the
  [CDH extension](extensions/cdh/README.md).
- **`keywords` (required, open)** - discovery terms for full-text search. Each
  entry is either a plain string OR a linked object
  `{ term, scheme, uri, description? }` pointing the term at an external
  vocabulary or ontology (e.g., AGROVOC, GEMET). Linked-keyword entries are also
  expanded by the encoder into the serialized record's themes block, grouped by
  `scheme`. Plain-string entries are full-text only and are not emitted as
  themes.
- **`themes` (encoder output only)** - not authored. The encoder produces a
  themes block at serialization time from `cdh.domain`, `commodities`,
  `climate.hazards` (against `vocab/*.json`), and any linked-keyword entries.

Decision rule:

- A value needed for filter / group-by / catalog browse -> `cdh.domain`.
- A value with a canonical concept in an external ontology you want to expose
  for semantic discovery -> linked entry in `keywords`.
- A value useful only for full-text search -> plain string in `keywords`.

### 4.6 Sidecar metadata

Use sidecar files (linked with `rel=describedby`) for large, nested, or
frequently changing content such as long code lists, full
[variable dictionaries](extensions/datacube/README.md), QA/QC outputs, detailed
table schemas, and detailed
[classification legends](extensions/classification/README.md).

### 4.7 Author-supplied vs review-inferred

Technical facts readable from the asset - `media_type`, `file_size`,
`spatial.bbox`, `spatial.crs`, and variable `data_type` / `nodata` /
`dimensions` - MAY be added during CDH review when omitted, where they can be
determined from the asset URL, file extension, or inspectable metadata. Authors
SHOULD still provide them when known, especially for multi-asset records.
Curatorial facts - descriptions, units, reading guidance, caveats, license,
citation - cannot be inferred and remain the author's responsibility.

## 5. Field Reference

The fields below are validated by the CDH profile: the core schema
(`schemas/core.schema.json`) plus the CDH extensions (section 5.5, declared in
`extensions[]`). For each field: **Requirement**, **Definition**, **Expected
value**, **Rules**, **Vocabulary** where applicable, and **Example**.

### 5.1 Core

#### `id`

- **Requirement:** Required
- **Definition:** A persistent, unique identifier for the metadata record.
- **Expected value:** Short, stable, URL-safe string.
- **Rules:**
  - Must be unique in the Hub catalog.
  - Must be lowercase.
  - Must not contain `/`, `:`, `?`, `#`, `&`, spaces, or other URL/path-reserved
    characters.
  - Should use hyphens, not underscores.
  - Should not change when the title changes.
  - Should not include version unless each version is a separate record.
- **Example:** `spam2020-v2`

#### `title`

- **Requirement:** Required
- **Definition:** Short, human-readable title for the resource.
- **Expected value:** Concise string.
- **Rules:**
  - Must clearly describe the resource.
  - Should not end with punctuation.
  - Should not include the file format unless central to the resource.
- **Example:** `MAPSPAM 2020 v2`

#### `description`

- **Requirement:** Required
- **Definition:** Human- and AI-readable description of the resource.
- **Expected value:** One short paragraph.
- **Rules:**
  - Must say what the resource is and what it can be used for.
  - Should mention geography, time period, variables, scenarios, hazards, or
    commodities when relevant.
  - Should be understandable without opening the data files.
  - Should avoid unexplained acronyms.
  - Must not be a copy of the title.
  - Must not be the only place where filterable facts are stored.

#### `note`

- **Requirement:** Optional
- **Definition:** Free-text caveats, warnings, or interpretation-critical
  remarks that a reader of `description` alone could miss.
- **Encodes as:** `cgiar-cdh:note`.
- **Rules:**
  - Must not duplicate `description`.
  - Must not be used as a second free-form description.
  - Should be omitted when nothing important is at stake - empty notes add
    noise.
  - Use when there is a genuine caveat (e.g., known artifact, data version
    mismatch, restricted geographic validity, sensitive aggregation behavior).

#### `license`

- **Requirement:** Required
- **Definition:** Legal terms under which the resource may be used.
- **Expected value:** SPDX identifier preferred; recognized license name or
  clear custom statement otherwise.
- **Vocabulary:** [SPDX License List](https://spdx.org/licenses/).
- **Rules:**
  - Prefer SPDX identifiers.
  - Data must be licensed to be included in the Hub.
  - Access restrictions are separate from license.
- **Examples:** `CC-BY-4.0`, `CC0-1.0`, `MIT`.

#### `resource_type`

- **Requirement:** Required
- **Definition:** Kind of resource the record describes.
- **Vocabulary:** Closed set defined in `vocab/resource_type.json`. Initial
  values are `dataset`, `software`, `ai-skill`, and `document`.
- **Rules:**
  - Should not replace asset media types.

#### `encoding`

- **Requirement:** Required
- **Definition:** Which serialization profile this record uses.
- **Vocabulary:** `stac`, `ogc-records`.

#### `extensions[]`

- **Requirement:** Recommended.
- **Definition:** Pinned schema URLs of the CDH extensions the record uses.
- **Rules:**
  - The record is validated against a profile composing the core with these
    extensions (see section 4.3).
  - The CDH template pre-lists the CDH-maintained extensions; authors rarely edit
    this by hand.

#### `keywords`

- **Requirement:** Required
- **Definition:** Free-form search terms, optionally linked to an external
  controlled vocabulary or ontology.
- **Expected value:** List of items. Each item is either:
  - a plain string (full-text discovery term), or
  - an object `{ term, scheme, uri, description? }` where:
    - `term` (required) - human-readable label,
    - `scheme` - resolvable URI of the source vocabulary/ontology (e.g.,
      AGROVOC, GEMET),
    - `uri` - resolvable URI of the specific concept within `scheme`,
    - `description` - optional human-readable definition.
- **Rules:**
  - Should include method names, acronyms, aliases, project-specific terms, or
    other user-facing search phrases that are not already captured by structured
    fields.
  - Must not replace structured fields such as `resource_type`, `cdh.domain`,
    `commodities`, `climate.*`, `spatial.*`, `temporal.*`, or `variables[]`.
  - Should not duplicate structured values. If a geography exists, encode it in
    `spatial.geography`; if a crop or commodity exists, encode it in
    [`commodities`](extensions/agriculture/README.md); if a hazard, scenario,
    model, baseline, or MIP era exists, encode it in
    [`climate.*`](extensions/climate/README.md); if a variable, band, indicator,
    or column exists, encode it in [`variables[]`](extensions/datacube/README.md).
  - Values used for filter, group-by, or facet belong in `cdh.domain` (closed
    CDH vocab), not here. See section 4.5.
  - Should use consistent spelling and capitalization.
  - Linked items must include both `scheme` and `uri` to be expanded as themes;
    a `term`-only object is equivalent to a plain string.
  - Do not link entries to the
    `https://cgiar-climate-data-hub.github.io/metadata/vocab/*` schemes - those
    are reserved for encoder expansion from `cdh.domain`, `commodities`, and
    `climate.hazards`.

Authoring YAML:

```yaml
keywords:
  - zonal statistics
  - weighted mean
  - term: Food security
    scheme: https://www.eionet.europa.eu/gemet/
    uri: https://www.eionet.europa.eu/gemet/en/concept/1838
    description: Availability of food and access to it.
```

#### `themes` (encoder output only)

There is no author-facing `themes` field. The encoder produces a themes block at
serialization time from:

- `cdh.domain` -> scheme
  `https://cgiar-climate-data-hub.github.io/metadata/vocab/domain.json` (primary
  and secondary domain concepts);
- `commodities` -> scheme
  `https://cgiar-climate-data-hub.github.io/metadata/vocab/commodity.json`,
  populated with AGROVOC URIs via `vocab/commodity.json`;
- `climate.hazards` -> scheme
  `https://cgiar-climate-data-hub.github.io/metadata/vocab/hazard.json`,
  populated with AGROVOC URIs via `vocab/hazard.json`;
- any linked-keyword entries in `keywords`, grouped by `scheme`.

Each `themes[].concepts[]` entry carries the concept's `id` (CDH vocab id),
`title`, and - where the vocabulary provides one - its authoritative external
concept `url` (e.g., the AGROVOC URI). The `scheme` URIs above are deliberately
**unversioned** stable identifiers (unlike the versioned schema URLs in section
2\): a concept scheme's identity must be durable across releases, and the
unversioned mirror always resolves to the latest published vocabulary.

Themes are NOT what the website filter reads. Themes exist for ontology /
linked-data context in the serialized record.

#### `created`, `updated`

- **Requirement:** Required
- **Definition:** Date the metadata record was created / last updated.
- **Expected value:** ISO 8601 / RFC 3339 date or datetime.
- **Rules:**
  - `updated` must be ≥ `created`.
  - Refers to the metadata record, not the underlying dataset.
  - Authors MAY leave these blank in draft authoring files when the publishing
    pipeline manages metadata timestamps. Serialized records MUST include both
    values.

#### `version`, `previous_version`

- **Requirement:** Conditional. Required when the resource is versioned.
- **Expected value:** Stable version label.
- **Rules:**
  - Identify the resource version, not the metadata schema version.
  - Semantic versions, release names, years, source versions, or commit hashes
    are all acceptable.
  - `previous_version` is the `id` of the predecessor record.

### 5.2 Contact and Citation

#### `contact[]`

- **Requirement:** Required. At least one contact MUST have `role: licensor`.
- **Expected value:** List of objects with `name`, `role`, `email`,
  `organization`, `url`.
- **Vocabulary for `role`:** Official STAC provider roles only - `licensor`,
  `producer`, `processor`, `host`.
- **Rules:**
  - Must identify at least one responsible party.
  - Must identify at least one licensing party using `role: licensor`.
  - A `licensor` contact is the party that holds or administers the right to
    license the resource.
  - Each contact MUST include `role`.
  - Each contact MUST include either `organization` or `name`.
  - Use `organization` on its own for organization-level contacts when no
    specific person should be named.
  - Use `name` plus `organization` for person-level contacts. If `name` is
    present, `organization` is required so the person is not detached from an
    institutional context.
  - Email, URL, or org contact page when public.

#### `citation`

- **Requirement:** Required
- **Definition:** Preferred plain-text citation for the resource.
- **Rules:**
  - Cite the resource described by the record, not only a source dataset.
  - Should include title, organization or author, year, version, and persistent
    identifier when available.

#### `doi`

- **Requirement:** Conditional. Required when a DOI exists.
- **Expected value:** DOI URL (preferred) or DOI string.

#### `related_publications[]`

- **Requirement:** Optional
- **Expected value:** List of `{ citation, doi }`.

#### `funding[]`

- **Requirement:** Optional
- **Expected value:** List of `{ name, url }`.

### 5.3 Spatial

Required for STAC when the resource has spatial relevance. In the CDH OGC
Records profile, only `spatial.geography` is emitted for broad discovery
filtering; records that require bbox, CRS, spatial resolution, or embedded
geometry-column metadata should use `encoding: stac`.

#### `spatial.bbox`

- **Expected value:** STAC-aligned. A list of one or more bounding boxes in
  WGS84 decimal degrees (EPSG:4326). Each bbox lists all axes of the
  southwesterly-most corner first, then all axes of the northeasterly-most
  corner:

  - 2D: `[west, south, east, north]` (= `[xmin, ymin, xmax, ymax]`).
  - 3D: `[west, south, min_z, east, north, max_z]` (=
    `[xmin, ymin, zmin, xmax, ymax, zmax]`); elevation in metres.

  The first entry is the overall extent. Additional entries describe sub-regions
  and should only be added when the union of those sub-regions would otherwise
  leave a large uncovered area (e.g., Germany + Chile). Single-region datasets
  should use exactly one entry.
- **Rules:**
  - Coordinates MUST be in WGS84 regardless of `spatial.crs` (which describes
    the underlying assets, not the bbox).
  - Longitude is constrained to `[-180, 180]` and latitude to `[-90, 90]`; the
    schema rejects out-of-range values.
  - Bbox arrays MUST have length 4 or 6 - other lengths are rejected.
- **Authoring note:** Provide `spatial.bbox` when known, especially for
  multi-asset records or when the first asset is not representative; otherwise
  review may add it (see section 4.7).

##### Common-tool mappings

The STAC order is (`xmin, ymin, xmax, ymax`), not the "min-min-max-max-per-axis"
order produced by R's `terra::ext()` or GDAL's `-projwin`. Translate carefully:

| Source                                      | Native order                 | CDH `bbox` entry                   |
| ------------------------------------------- | ---------------------------- | ---------------------------------- |
| R `terra::ext(r)`                           | `xmin, xmax, ymin, ymax`     | `[xmin, ymin, xmax, ymax]`         |
| R `sf::st_bbox(x)`                          | `xmin, ymin, xmax, ymax`     | `[xmin, ymin, xmax, ymax]` (as-is) |
| Python `rasterio.bounds` / `shapely.bounds` | `(left, bottom, right, top)` | `[left, bottom, right, top]`       |
| GDAL `gdalinfo` corner coordinates          | `ulx, uly, lrx, lry`         | `[ulx, lry, lrx, uly]`             |

##### Examples

```yaml
spatial:
  bbox:
    - [-180.0, -90.0, 180.0, 90.0] # whole Earth, 2D
```

```yaml
spatial:
  bbox:
    - [
        -180.0,
        -90.0,
        -1,
        180.0,
        90.0,
        0,
      ] # whole Earth, -1m to 0m (i.e. soil data...)
```

```yaml
spatial:
  bbox:
    - [-75.6, -55.9, 15.0, 55.1] # overall (Germany + Chile)
    - [5.9, 47.3, 15.0, 55.1] # Germany
    - [-75.6, -55.9, -66.4, -17.5] # Chile
```

#### `spatial.geography`

- **Requirement:** Optional
- **Definition:** Named geographies for broad discovery, browse, and filtering.
- **Expected value:** List of concept ids from `vocab/geography.json`.
- **Vocabulary:** `vocab/geography.json` - a controlled list generated from the
  UN M49 standard. It covers the full hierarchy (World, regions, sub-regions,
  intermediate regions, and countries). Each concept carries its M49 `code`, an
  `iso3` code (countries), `parents` (ancestor ids, for roll-up filtering), and
  LDC/LLDC/SIDS `groups`.
- **Rules:**
  - Must use the `id` from the `vocab/geography.json` vocabulary.
  - Serves a diffrent purpose from `bbox`, just because one exists does not mean
    the other doesn't need to.
- **Examples:** `[world]`, `[sub-saharan-africa]`, `[kenya, uganda]`.

#### `spatial.crs`

- **Requirement:** Conditional. Required for geospatial STAC assets.
- **Expected value:** EPSG code (e.g., `EPSG:4326`), CRS URI, or PROJ string for
  custom CRS.
- **Vocabulary:** [EPSG codes](https://epsg.io/).
- **Authoring note:** Provide `spatial.crs` when known; otherwise review may add
  it (see section 4.7).

#### `spatial.resolution`

- **Requirement:** Conditional. Required when the spatial unit or spacing is
  needed to interpret the data (e.g., regular grids, point observations, or
  polygon reporting units).
- **Expected value:** List of
  `{ type, value, unit, label, reference_system, note }`.
- **Rules:**
  - `type` is one of `xy`, `x`, `y`, `point`, or `polygon`.
  - Use `type: xy` for regular grids with the same x/y spacing.
  - Use separate `type: x` and `type: y` entries only when x/y spacing differs.
  - Do not mix `xy` with `x` / `y` entries in the same record.
  - For grid entries (`xy`, `x`, `y`), `value` + `unit` describe grid spacing
    and map to STAC Datacube dimension `step` + `unit`.
  - For point or polygon entries, use `label` and `reference_system` to describe
    the observation locations or reporting units. `value` + `unit` may be used
    when a meaningful level exists, such as `value: 2`, `unit: admin-level`.
  - `label` is the human-readable form (e.g., `5 arc-minutes`,
    `Kenya counties`).
  - `note` is for short spatial interpretation notes that do not belong in the
    record-level `note`.

#### `spatial.geometry_column`

- **Requirement:** Conditional. For vector tables with an embedded geometry
  column.
- **Expected value:** Name of the geometry column.
- **Encoding:** STAC Table Extension `table:primary_geometry`.

### 5.4 Temporal

Required for STAC. Conditional for OGC Records when the resource has temporal
relevance.

#### `temporal.start_date`, `temporal.end_date`

- **Expected value:** ISO 8601 / RFC 3339 date or datetime. Use `null` for
  open-ended intervals.

#### `temporal.resolution`

- **Requirement:** Conditional. Required for time-series, forecast, projection,
  or recurring-observation data.
- **Expected value:** `{ values, unit, step, note }`.
- **Rules:**
  - `values` lists named or easily interpretable temporal positions when useful
    (e.g., `[1, 2, ..., 12]` for months).
  - `unit` is the author-facing time unit or label (e.g., `day`, `month`,
    `year`, `daily`, `monthly`).
  - `step` is the STAC Datacube-compatible step when known, preferably an ISO
    8601 duration such as `P1D`, `P1M`, or `P1Y`.
  - `note` explains temporal interpretation or temporal aggregation, such as
    "daily data aggregated to monthly using median".

### 5.5 Extension fields

CDH extension fields are declared in `extensions[]` and validated through the
CDH profile (see section 4.3). Each extension is documented alongside its schema
(linked below); all are optional except where the profile requires them
(`cdh.domain` is required). Encode values you filter or facet on in these
extension fields, not in `keywords` (see section 4.5).

| Extension | Fields | Applies to |
| --- | --- | --- |
| [CDH](extensions/cdh/README.md) | `cdh.domain`, `cdh.use_cases`, `cdh.not_recommended_for` | all records (profile-required) |
| [Climate](extensions/climate/README.md) | `climate.*` - scenarios, models, hazards, baseline, downscaling | climate / CMIP / hazard / adaptation |
| [Datacube](extensions/datacube/README.md) | `dimensions[]`, `variables[]` | gridded / multidimensional / tabular |
| [Classification](extensions/classification/README.md) | `classes[]` | categorical / classified data |
| [Agriculture](extensions/agriculture/README.md) | `commodities[]` | agriculture / food-systems / crops |

### 5.6 Processing and Provenance

#### `processing[]`

- **Requirement:** Recommended - required for derived products.
- **Definition:** Ordered list of processing steps. When `processing[]` is
  provided, at least one step MUST use `id: source` and describe the original
  generation of the data; for many records this is the only step needed.
- **Expected value per step:**
  `{ id, description, code: { url, version }, date, derived_from[] }`.
- **Rules:**
  - `id` must be unique within `processing[]`.
  - At least one step must use `id: source` whenever `processing[]` is present.
  - `derived_from[]` entries are always external URLs of the form
    `{ url, title }`. This matches STAC `links[rel=derived_from]` semantics.
    Inter-step references are NOT used here - order in the `processing[]` array
    carries the step sequence, and the chain for a specific asset is captured by
    `data[].processing_steps[]`.
  - `date` is ISO 8601 / RFC 3339.
  - Put the `source` step first unless there is a specific reason to preserve a
    different processing order. Add subsequent steps only when meaningful new
    processing occurs (e.g., format conversion, bias adjustment).

### 5.7 Assets and Links

#### `data[]`

- **Requirement:** Required - at least one entry.
- **Expected value per entry:**
  `{ name, locations, description, media_type, file_size, nodata, processing_steps }`.
- **Vocabulary:** `media_type` must be an
  [IANA media type](https://www.iana.org/assignments/media-types/) (e.g.,
  `application/vnd.zarr; version=3`,
  `image/tiff; application=geotiff; profile=cloud-optimized`).
- **`locations[]`:** Access location(s) for the asset. Required for at least one
  entry. Each entry is `{ url, title? }`, where `title` is an optional access
  label describing the access path (e.g., `HTTPS`, `S3`), not the content.
  - The first entry is canonical.
  - List more than one entry only when the additional entries point at the same
    content via a different access path (e.g., an HTTPS and an S3 URL for the
    same file). All `locations[]` share the asset's `media_type`, `file_size`,
    and `nodata`.
  - Different content or formats (e.g., COG vs NetCDF) and services that are
    queried rather than downloaded (e.g., a Google Earth Engine collection) are
    separate assets - a separate `data[]` or `additional_assets[]` entry, not an
    extra location here.
- **Rules:**
  - `locations[].url` must point to the described resource and should be stable.
  - For restricted resources, `locations[].url` should point to a landing page
    or access instructions.
  - Provide `media_type` and `file_size` when known; otherwise review may add
    them (see section 4.7).
  - `processing_steps` references `processing[].id` values.

#### `additional_assets[]`

- **Requirement:** Recommended
- **Definition:** Non-primary assets (QA/QC, code lists, schemas, thumbnails,
  alternate formats, additional metadata files).
- **Expected value per entry:**
  `{ name, locations, description, media_type, roles, file_size }`.
- **`locations[]`:** Same shape and rules as `data[].locations` - required, at
  least one entry; first is canonical; multiple entries only for the same
  content via a different access path.
- **Vocabulary for `roles`:** STAC roles - `metadata`, `validation`,
  `describedby`, `thumbnail`, `overview`, `visual`.
- **Rules:**
  - Provide `media_type` and `file_size` when known; otherwise review may add
    them (see section 4.7).

#### `additional_links[]`

- **Requirement:** Optional
- **Expected value per entry:** `{ name, rel, url, description }`.
- **Vocabulary for `rel`:** See section 5.

## 6. Link Relations

| rel                                             | Use                                       | Source               |
| ----------------------------------------------- | ----------------------------------------- | -------------------- |
| `self`, `root`, `parent`, `child`, `collection` | Catalog navigation                        | IANA / STAC / OGC    |
| `cite-as`                                       | Preferred citation target (DOI)           | IANA                 |
| `describedby` / `describes`                     | Documentation, schema, code list          | IANA                 |
| `about`                                         | Project or explanatory page               | IANA                 |
| `via`                                           | Intermediate source                       | IANA                 |
| `canonical`                                     | Authoritative URL (when this is a mirror) | IANA                 |
| `alternate`                                     | Alternate representation                  | IANA                 |
| `derived_from`                                  | Source dataset                            | STAC                 |
| `predecessor-version` / `successor-version`     | Version chain                             | IANA                 |
| `enclosure`                                     | Downloadable file (OGC Records)           | IANA                 |
| `service`                                       | Service endpoint                          | IANA                 |
| `license`                                       | License document                          | IANA                 |
| `preview` / `icon` / `thumbnail`                | Imagery                                   | IANA / STAC          |
| `processing-expression`                         | Code or workflow that produced the data   | STAC Processing Ext. |

## 7. Controlled Vocabularies Summary

| Field                                                         | Vocabulary                                                                                                                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `license`                                                     | SPDX License List                                                                                                                                           |
| dates (`created`, `updated`, `temporal.*`, `processing.date`) | ISO 8601 / RFC 3339                                                                                                                                         |
| `spatial.crs`                                                 | EPSG codes                                                                                                                                                  |
| `spatial.geography`                                           | `vocab/geography.json` (UN M49; regions + countries)                                                                                                        |
| `variables[].unit`, grid `spatial.resolution[].unit`          | UDUNITS-2 where practical; non-grid spatial units may use clear labels such as `admin-level`                                                                |
| `variables[].name` (climate)                                  | CF Standard Names (where practical)                                                                                                                         |
| `contact[].role`                                              | Official STAC provider roles: `licensor`, `producer`, `processor`, `host`                                                                                   |
| `media_type`                                                  | IANA media types                                                                                                                                            |
| `resource_type`                                               | `vocab/resource_type.json`                                                                                                                                  |
| `cdh.domain`                                                  | `vocab/domain.json` (CDH closed set)                                                                                                                        |
| `keywords[].scheme` (linked items)                            | Open - any resolvable controlled-vocabulary URI (e.g., AGROVOC, GEMET). Do not link entries to `https://cgiar-climate-data-hub.github.io/metadata/vocab/*`. |
| `commodities`                                                 | `vocab/commodity.json` (AGROVOC-mapped); encoded as themes                                                                                                  |
| `climate.hazards`                                             | `vocab/hazard.json` (AGROVOC-mapped); encoded as themes                                                                                                     |
| `climate.mip_era`                                             | `CMIP5`, `CMIP6` (informal)                                                                                                                                 |
| `climate.scenarios`                                           | SSP / RCP labels, `historic` (informal)                                                                                                                     |
| `climate.models`                                              | CMIP source IDs (informal)                                                                                                                                  |

## 8. Validation Checklist

### Required for every record

- [ ] `id`, `title`, `description`
- [ ] `created`, `updated`
- [ ] `resource_type`, `encoding`
- [ ] `cdh.domain[]` includes at least one concept from `vocab/domain.json`
- [ ] `keywords[]`
- [ ] `license`
- [ ] `contact[]` includes at least one `role: licensor`
- [ ] `citation`
- [ ] `data[]` includes at least one entry

### Required for STAC records

- [ ] `spatial.bbox` or `spatial.geography`
- [ ] `temporal.start_date` / `end_date` when temporal
- [ ] `spatial.crs` for geospatial assets
- [ ] `variables[]` and `dimensions[]` for data-cube or multi-variable data

### Required where applicable

- [ ] `version` for versioned resources
- [ ] `doi` when a DOI exists
- [ ] `processing[]` for derived products
- [ ] `commodities[]` for commodity-specific resources
- [ ] `climate.scenarios[]` for projection-based climate resources
- [ ] `climate.mip_era` for CMIP-based resources
- [ ] `climate.hazards[]` for hazard/risk resources
- [ ] `climate.baseline` for anomalies and baseline-relative indicators
- [ ] `classes[]` or class sidecar for classified data
