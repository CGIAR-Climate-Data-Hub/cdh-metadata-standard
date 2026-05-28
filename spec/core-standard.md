# Climate Data Hub Metadata Standard

Status: draft

This document defines the **conceptual** metadata model used by the Climate
Data Hub. Every Hub record, regardless of encoding, conforms to the field
definitions, requirement levels, and rules in this document.

Two encodings are supported:

- **STAC** — for spatial, spatiotemporal, gridded, raster, data-cube, and
  spatial/temporal tabular data. See [`mapping-stac.md`](./mapping-stac.md).
- **OGC API Records** (recordJSON) — for discoverable resources that are not
  naturally spatial: documents, code, models, notebooks, dashboards, services,
  APIs, methods, knowledge products. See [`mapping-ogc-records.md`](./mapping-ogc-records.md).

For the field-level mapping table to both encodings, see
[`crosswalk.md`](./crosswalk.md). The machine-readable template is
[`standard.yaml`](./standard.yaml).

For contributor-facing guidance, see the plain-language
[`authoring-guide.md`](./authoring-guide.md).

## 1. Purpose

A Hub record exists to make a resource:

- **Discoverable** by humans and tools.
- **Understandable** without opening the underlying files.
- **Citable** with a stable identifier and reference.
- **Validatable** against a schema.
- **Usable** by automated/AI tools without manual interpretation.

Free-text descriptions support these goals, but MUST NOT be the only place
where structured, filterable facts are stored.

## 2. Requirement Levels

The standard follows RFC 2119-style requirement levels.

| Level         | Meaning                                                |
| ------------- | ------------------------------------------------------ |
| Required      | Metadata is invalid without this field.                |
| Recommended   | Strongly expected unless not applicable.               |
| Conditional   | Required only for certain resource classes.            |
| Optional      | Useful, but not required.                              |

## 3. Authoring Rules

### 3.1 Routing

Every record sets `encoding: stac` or `encoding: ogc-records`. The encoder
uses this to select the serialization profile.

### 3.2 Native fields first

Each fact about the resource is encoded in the most standard place available,
in this order:

1. **Core field** of the chosen encoding (STAC or OGC Records).
2. **An approved STAC Extension field** (STAC only) — see the extension
   profile in `mapping-stac.md`.
3. **An approved `cgiar-cdh:*` field**, as defined by the CDH STAC Extension
   and the CDH OGC Records profile.
4. **A linked sidecar metadata asset** (`rel=describedby`) when the content
   is large, nested, or frequently changing.
5. **A custom property or custom extension** (see §3.3) when no standard
   placement fits.
6. **Free-text inside `description`**, as a last resort, when the fact
   genuinely cannot be structured.

### 3.3 Extending the schema

The hierarchy in §3.2 covers the overwhelming majority of cases. When it
does not, the schema is extensible via the following paths, in preferred
order:

- **Additional STAC Extensions.** Any community STAC Extension may be added
  to a STAC record's `stac_extensions` array. Pin the version. Use when its
  field set is a better fit than core fields, the CDH profile, or an
  existing approved extension.
- **New `cgiar-cdh:*` fields.** Proposed additions must define name,
  expected type, allowed values, and requirement level, and must be added to
  both the CDH STAC Extension schema and the CDH OGC Records profile before
  use. Adding an undefined `cgiar-cdh:*` field will fail validation.
- **Custom extension namespace. Discouraged.** A new prefixed namespace
  (e.g., `myproj:`) may be defined for a project- or dataset-specific
  extension when a coherent group of related fields is needed and no
  existing community STAC Extension or `cgiar-cdh:*` field fits. This is
  allowed when genuinely necessary, but it is the wrong long-term home for
  anything broadly useful. Before going this route:
  - Check the [STAC Extensions catalog](https://stac-extensions.github.io/)
    for an existing community extension that fits.
  - If the fields would be useful to more than one CDH record, propose them
    as additions to the CDH STAC Extension and OGC Records profile instead
    (the `cgiar-cdh:*` path above). A custom namespace that survives more
    than one project is a sign it should have been a Hub extension.

  If a custom namespace is still the right answer:
  - Declare it in `stac_extensions` (STAC) with a pinned schema URI, or
    document it in a sidecar for OGC Records.
  - Publish the schema so consumers can validate.
  - Plan to revisit at the next standard review and promote to a proper
    extension if the fields prove broadly useful.
- **Additional metadata properties (ad hoc). Strongly discouraged.**
  Standalone custom properties (e.g., `myproj_internal_id: "ABC-123"`,
  `something_else: 42`) are a last resort and should be avoided. Records
  filled with one-off fields and invented prefixes become unsearchable,
  inconsistent, and a burden on every downstream tool. Before adding one,
  exhaust §3.2 (1–5) and the two extension paths above. If a fact matters
  enough to record, it almost always belongs in a `cgiar-cdh:*` field or a
  proper custom extension namespace — promote it there instead. If, after
  all of that, an ad hoc property is genuinely unavoidable:
  - MUST NOT use the `cgiar-cdh:` prefix or any other established namespace prefix.
  - MUST NOT invent a vanity prefix to mimic an official one (e.g., `cdh_*`, `cgiar:`, etc.).
  - Must be self-describing (clear name, obvious type).
  - Will not appear in search, filter, or facet UI, and will not be validated.
  - Must be treated as temporary; revisit at the next standard review and
    either promote, replace, or remove.

The `cgiar-cdh:` prefix is reserved for approved CDH fields and is never a
general-purpose custom namespace.

### 3.4 Description, note, and free text

`description` and `note` are first-class fields, not catch-all fallbacks:

- **`description` (required)** is the canonical human- and AI-readable
  paragraph explaining the resource. Step 6 of the hierarchy in §3.2 lives
  here.
- **`note` (optional)** is reserved for caveats, warnings, or
  interpretation-critical remarks that a reader of `description` alone
  would otherwise miss. It is not a second description, and not a place to
  dump prose that did not fit elsewhere. Use `note` only when something
  important would be lost without it.

A fact that is needed for search, filtering, faceting, or programmatic use
MUST be encoded as a structured field, not only mentioned in `description`
or `note`. `description` exists to contextualize structured facts; `note`
exists to flag caveats. Neither is the source of truth for filterable data.

### 3.5 Domain vs themes vs keywords

These three fields are not interchangeable — each serves a different
purpose.

- **`cdh.domain` (required, closed vocab)** — the CDH-controlled
  high-level classification used for **structured browse, filter, and
  group-by** in the catalog UI, and for STAC sub-catalog placement.
  Values are validated against `vocab/domain.yaml`. This is where the
  website filter reads from.
- **`themes` (optional, open vocab)** — ontology-linked classification
  (URIs, scheme links) used for semantic-web / linked-data consumers.
  Largely **auto-populated by the encoder** from `cdh.domain`,
  `cdh.commodities`, and `cdh.climate.hazards`. Authors may add
  additional entries, but each must include a resolvable `scheme` URI,
  per-concept URIs, and descriptions. Not the primary filter.
- **`keywords` (required, free text)** — unvalidated discovery terms for
  full-text search. Does not drive UI grouping or filter.

Decision rule:

- A value needed for **filter / group-by / catalog browse** → `cdh.domain`.
- A value needed for **ontology linkage / external semantic context** →
  `themes`.
- A value useful only for **full-text search** → `keywords`.

### 3.6 Sidecar metadata

Use sidecar files (linked with `rel=describedby`) for large, nested, or
frequently changing content such as long code lists, full variable
dictionaries, QA/QC outputs, detailed table schemas, and detailed
classification legends.

## 4. Field Reference

The fields below mirror the structure of `standard.yaml`. For each field:
**Requirement**, **Definition**, **Expected value**, **Rules**, **Vocabulary**
where applicable, and **Example**.

### 4.1 Core

#### `id`

- **Requirement:** Required
- **Definition:** A persistent, unique identifier for the metadata record.
- **Expected value:** Short, stable, URL-safe string.
- **Rules:**
  - Must be unique in the Hub catalog.
  - Must be lowercase.
  - Must not contain `/`, `:`, `?`, `#`, `&`, spaces, or other URL/path-reserved characters.
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
  - Should mention geography, time period, variables, scenarios, hazards, or commodities when relevant.
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
  - Should be omitted when nothing important is at stake — empty notes add noise.
  - Use when there is a genuine caveat (e.g., known artifact, data version mismatch, restricted geographic validity, sensitive aggregation behavior).

#### `license`

- **Requirement:** Required
- **Definition:** Legal terms under which the resource may be used.
- **Expected value:** SPDX identifier preferred; recognized license name or clear custom statement otherwise.
- **Vocabulary:** [SPDX License List](https://spdx.org/licenses/).
- **Rules:**
  - Prefer SPDX identifiers.
  - Data must be licensed to be included in the Hub.
  - Access restrictions are separate from license.
- **Examples:** `CC-BY-4.0`, `CC0-1.0`, `MIT`.

#### `resource_type`

- **Requirement:** Required
- **Definition:** Kind of resource the record describes.
- **Vocabulary (CDH-controlled):** `dataset`, `document`, `model`, `notebook`, `code`, `service`, `dashboard`, `api`, `method`, `knowledge-product`.
- **Rules:**
  - Should not replace asset media types.
  - Drives selection of encoding (STAC vs OGC Records).

#### `encoding`

- **Requirement:** Required
- **Definition:** Which serialization profile this record uses.
- **Vocabulary:** `stac`, `ogc-records`.

#### `keywords`

- **Requirement:** Required
- **Definition:** Free-form search terms.
- **Expected value:** List of short terms or phrases.
- **Rules:**
  - Should include method names, acronyms, aliases, project-specific terms, or
    other user-facing search phrases that are not already captured by structured
    fields.
  - Must not replace structured fields such as `resource_type`, `cdh.domain`,
    `cdh.commodities`, `cdh.climate.*`, `spatial.*`, `temporal.*`, or
    `variables[]`.
  - Should not duplicate structured values. If a geography exists, encode it in
    `spatial.geography`; if a crop or commodity exists, encode it in
    `cdh.commodities`; if a hazard, scenario, model, baseline, or MIP era
    exists, encode it in `cdh.climate.*`; if a variable, band, indicator, or
    column exists, encode it in `variables[]`.
  - Use `keywords` for additional search phrases only when they add meaning
    beyond the structured field value, such as common aliases, project-specific
    terms, method names, or user-facing phrases.
  - Values used for filter, group-by, or facet belong in `cdh.domain` (closed CDH vocab) or `themes` (ontology linkage), not here. See §3.5.
  - Should use consistent spelling and capitalization.

#### `themes`

- **Requirement:** Optional.
- **Definition:** Ontology-linked thematic classification block, intended
  for semantic-web / linked-data consumers. Largely **auto-populated by
  the encoder** from `cdh.domain`, `cdh.commodities`, and
  `cdh.climate.hazards` against the files in `vocab/`. Authors may add
  additional entries for extra context.
- **Expected value:** List of `{ scheme, concepts[] }` blocks. Each concept
  has `id` and `title`. For author-added entries, each concept MUST also
  carry a `url` (the URI of the concept in its scheme) and a
  `description`. Encoder-populated entries inherit URIs from the
  corresponding `vocab/` file.
- **Rules for author-added entries:**
  - The `scheme` value MUST be a resolvable URI (e.g., an AGROVOC, GEMET,
    or other published vocabulary endpoint). Free-form schemes are
    rejected.
  - Each `concepts[].url` MUST be a resolvable URI pointing to the
    concept's canonical definition.
  - Each `concepts[].description` MUST be present and human-readable.
  - Do not author themes under the `https://cgiar.org/cdh/vocab/*`
    schemes — those are reserved for encoder expansion from CDH fields.
- **Encoder behavior:**
  - The encoder emits a themes block under
    `https://cgiar.org/cdh/vocab/domain` from `cdh.domain` (carrying
    primary and secondary domain concepts).
  - The encoder emits a themes block under
    `https://cgiar.org/cdh/vocab/commodity` from `cdh.commodities`,
    populated with AGROVOC URIs via `vocab/commodity.yaml`.
  - The encoder emits a themes block under
    `https://cgiar.org/cdh/vocab/hazard` from `cdh.climate.hazards`,
    populated with AGROVOC URIs via `vocab/hazard.yaml`.
  - Author-added themes entries are appended after the encoder-populated
    ones.
- **Note:** `themes` is NOT what the website filter reads — use
  `cdh.domain` for filter / group-by (see §4.6). Themes exists for
  ontology / linked-data context.

Authoring (in `standard.yaml`):

```yaml
cdh:
  domain: [agriculture, climate]
  commodities: [banana, cassava]
  climate:
    hazards: [drought, heat-stress]

# `themes:` is usually omitted by authors — the encoder populates it from
# the CDH fields above. Add entries here only for additional ontology
# context outside the CDH schemes, and only with full scheme URI,
# concept URIs, and descriptions.
themes:
  - scheme: "https://www.eionet.europa.eu/gemet/"
    concepts:
      - id: "1838"
        title: "Food security"
        url: "https://www.eionet.europa.eu/gemet/en/concept/1838"
        description: "Availability of food and access to it."
```

> **Note:** The flat `cdh.domain`, `cdh.commodities`, and
> `cdh.climate.hazards` fields are the source of truth in
> `standard.yaml`. The encoder resolves them against `vocab/*.yaml` and
> emits the corresponding `themes` entries (with URIs) at serialization
> time. The fully-resolved themes block exists only in the serialized
> STAC / OGC Records output — never in `standard.yaml`.

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

- **Requirement:** Conditional — required when the resource is versioned.
- **Expected value:** Stable version label.
- **Rules:**
  - Identify the resource version, not the metadata schema version.
  - Semantic versions, release names, years, source versions, or commit hashes are all acceptable.
  - `previous_version` is the `id` of the predecessor record.

### 4.2 Contact and Citation

#### `license_holder`

- **Requirement:** Required
- **Definition:** Party that holds the rights to license the resource.
- **Encodes as:** `providers[role=licensor]` (STAC) or `properties.contacts[role=licensor]` (OGC).

#### `contact[]`

- **Requirement:** Required for published records.
- **Expected value:** List of objects with `name`, `role`, `email`, `organization`, `url`.
- **Vocabulary for `role`:** Official STAC provider roles only —
  `licensor`, `producer`, `processor`, `host`.
- **Rules:**
  - Must identify at least one responsible party.
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
  - Should include title, organization or author, year, version, and persistent identifier when available.

#### `doi`

- **Requirement:** Conditional — required when a DOI exists.
- **Expected value:** DOI URL (preferred) or DOI string.

#### `related_publications[]`

- **Requirement:** Optional
- **Expected value:** List of `{ citation, doi }`.

#### `funding[]`

- **Requirement:** Optional
- **Expected value:** List of `{ name, url }`.

### 4.3 Spatial

Required for STAC. Conditional for OGC Records when the resource has spatial relevance.

#### `spatial.bbox`

- **Expected value:** `[west, south, east, north]` in decimal degrees (EPSG:4326).
- **Authoring note:** Authors SHOULD provide `spatial.bbox` when they know it,
  especially for multi-asset records or when the first asset is not
  representative. If this value is missing, the CDH review process may add it
  when it can be determined from the asset URL, file extension, or inspectable
  metadata. Serialized records must contain the required values, whether
  supplied by the contributor or added during CDH review.

#### `spatial.geography`

- **Requirement:** Optional
- **Definition:** Named geography label.
- **Examples:** `global`, `africa`, `kenya`.

#### `spatial.crs`

- **Requirement:** Conditional — required for geospatial STAC assets.
- **Expected value:** EPSG code (e.g., `EPSG:4326`), CRS URI, or PROJ string for custom CRS.
- **Vocabulary:** [EPSG codes](https://epsg.io/).
- **Authoring note:** Authors SHOULD provide `spatial.crs` when they know it.
  If this value is missing, the CDH review process may add it when it can be
  determined from the asset URL, file extension, or inspectable metadata.
  Serialized records must contain the required values, whether supplied by the
  contributor or added during CDH review.

#### `spatial.resolution`

- **Requirement:** Conditional — required for gridded data.
- **Expected value:** `{ value, unit, label }`.
- **Rules:**
  - `unit` must be a UDUNITS-2 unit symbol when numeric.
  - `label` is a human-readable form (e.g., `5 arc-minutes`).

### 4.4 Temporal

Required for STAC. Conditional for OGC Records when the resource has temporal relevance.

#### `temporal.start_date`, `temporal.end_date`

- **Expected value:** ISO 8601 / RFC 3339 date or datetime. Use `null` for open-ended intervals.

#### `temporal.resolution`

- **Requirement:** Conditional — required for time-series, forecast, projection, or recurring-observation data.
- **Expected value:** `{ value, unit, label }`.
- **Rules:**
  - `unit` must be a UDUNITS-2 time unit (`day`, `month`, `year`) when numeric.
  - For non-numeric resolutions (e.g., climatology over a baseline period), use `value: static` and a `label`.

### 4.5 Data Fields

#### `dimensions[]`

- **Requirement:** Conditional — required for data cubes, tabular data with axes, or any dataset whose meaning depends on axes/codes.
- **Expected value per dimension:** `{ name, type, description, values, reference_system }`.
- **Rules:**
  - `type` should be one of `spatial`, `temporal`, `bands`, or a domain-specific axis name (e.g., `crop`, `technology`, `scenario`).
  - `values` lists the allowed values along the dimension.
  - `reference_system` is a URI or label for a controlled vocabulary when one applies (e.g., the AGROVOC URI for a `crop` dimension).
  - **Coded values MUST be defined.** If `values` contains short codes whose meaning is not obvious (e.g., `["I", "A", "R"]` for irrigated / all / rainfed, or MAPSPAM crop codes like `["whea", "maiz", "rice"]`), the record MUST resolve them through one of:
    1. `reference_system` pointing at a published controlled vocabulary that defines the codes, OR
    2. an inline definition in the dimension's `description` (e.g., `"I = Irrigated, A = All tech, R = Rainfed"`). Limit this to very short, fixed code sets where the full definition fits cleanly in one sentence, OR
    3. a sidecar asset (e.g., a JSON or CSV code list) linked from the record with `rel=describedby` and `roles: [metadata, describedby]`. One sidecar file MAY cover the codes for **all** dimensions in the dataset — a separate sidecar per dimension is not required. The dimension's `description` should reference the sidecar.
  - Do not invent inline structured fields (e.g., `value_definitions`) on `dimensions[]` — that would break Datacube Extension validation. Use one of the three options above.
  - A coded dimension without any of these will fail review — the codes become unusable for downstream tools.

#### `variables[]`

- **Requirement:** Conditional — required when the resource has measurement variables, bands, or columns.
- **Expected value per variable:** `{ name, dimensions, description, data_type, unit, note }`.
- **Rules:**
  - `unit` must be a UDUNITS-2 unit symbol (e.g., `ha`, `t`, `t ha-1`, `K`, `kg m-2 s-1`). Use `1` or omit for dimensionless quantities.
  - Climate variables should use CF standard names where practical (e.g., `precipitation_flux`, `air_temperature`).
  - `data_type` follows numpy-style names (`float32`, `int16`, …).
  - `description` carries the stable definition and normal reading guidance for
    the variable. Say what the variable measures, then add the reading rule
    when it matters (for example, "Higher values indicate greater heat hazard"
    or "Negative values indicate lower than the baseline").
  - `note` carries caveats, limitations, warnings, or non-obvious use rules for
    the variable. Dataset-wide limitations belong in the record-level `note`
    field instead.
  - For inspectable formats, the CDH review process may add technical variable
    metadata such as names, data types, bands, nodata values, or dimensions
    when it can be determined from the asset URL, file extension, or
    inspectable metadata. Authors are still responsible for descriptions,
    units, reading guidance, and caveats; these cannot be reliably determined
    from the file alone.

Example:

```yaml
variables:
  - name: rainfall_anomaly
    dimensions: [time, scenario, model]
    description: >
      Difference in seasonal rainfall total relative to the baseline
      climatology. Negative values indicate drier than baseline conditions.
    data_type: float32
    unit: mm
    note: >
      Does not describe intra-seasonal rainfall timing or dry-spell frequency.
```

#### `classes[]`

- **Requirement:** Conditional — required for classified, categorical, or bitfield variables.
- **Expected value:** List of `{ variable, values: [ { value, label, description } ] }`.
- **Rules:**
  - Each entry must reference a declared variable name.
  - For long class lists, prefer a sidecar asset linked with `rel=describedby` and keep only summary information here.

#### `geography.column`

- **Requirement:** Conditional — for vector tables with a geometry column.

#### `geography.spatial_join`

- **Requirement:** Conditional — for tabular data that joins to a spatial dataset (e.g., GAUL polygons).
- **Expected value:** `{ source_key, target: { id, url, key }, note }`.

### 4.6 CDH-specific

#### `cdh.domain[]`

- **Requirement:** Required.
- **Definition:** The CDH-controlled domain(s) the record belongs to. This
  is the field that powers the website filter, group-by, and STAC
  sub-catalog placement.
- **Expected value:** List of one or more domain ids from
  `vocab/domain.yaml`. **Multi-valued and ordered**: the first entry is
  the **primary** domain (drives sub-catalog placement); subsequent
  entries are secondary and enable cross-cutting search.
- **Vocabulary:** Closed set defined in `vocab/domain.yaml`. Adding a new
  domain requires updating that file.
- **Encoding:**
  - Encoded as `cgiar-cdh:domain` (STAC) / `properties["cgiar-cdh:domain"]`
    (OGC Records).
  - Also expanded by the encoder into a `themes` entry under the
    `https://cgiar.org/cdh/vocab/domain` scheme for linked-data
    consumers (see §4.1).
- **Example:**

```yaml
cdh:
  domain: [agriculture, climate]   # primary first; rest are secondary
```

#### `cdh.use_cases[]`

- **Requirement:** Optional
- **Vocabulary:** CDH-controlled list (TBD). Free-form until then.

#### `cdh.not_recommended_for[]`

- **Requirement:** Optional
- **Expected value:** List of `{ use, reason, use_instead }`.

#### `cdh.commodities[]`

- **Requirement:** Conditional — required for agriculture, food-systems, livestock, and crop datasets.
- **Vocabulary:** Values MUST appear in `vocab/commodity.yaml`. The encoder uses that file to resolve each name to its AGROVOC URI.
- **Expected value:** List of friendly names (e.g., `banana`, `cassava`, `arabica-coffee`).
- **Encoding:** Expanded into a `themes` entry under the CDH commodity scheme (see §4.1). Does not appear as a standalone field in the encoded output.

#### `cdh.climate.mip_era`

- **Requirement:** Conditional — required when the resource is based on CMIP model output.
- **Vocabulary (informal):** `CMIP5`, `CMIP6`.

#### `cdh.climate.scenarios[]`

- **Requirement:** Conditional — required for projection, scenario, adaptation, or future-climate resources.
- **Vocabulary (informal):** SSP labels (`ssp126`, `ssp245`, `ssp370`, `ssp585`), RCP labels (`rcp26`, `rcp45`, `rcp85`), or `historic`.

#### `cdh.climate.models[]`

- **Requirement:** Conditional — required for CMIP-based resources.
- **Vocabulary (informal):** Canonical CMIP source IDs (e.g., `MPI-ESM1-2-HR`, `MRI-ESM2-0`). Use `ensemble` to indicate a multi-model ensemble.

#### `cdh.climate.hazards[]`

- **Requirement:** Conditional — required for risk, impact, climate-service, and adaptation datasets.
- **Vocabulary:** Values MUST appear in `vocab/hazard.yaml`. That file is AGROVOC-aligned and maps each name to its AGROVOC URI.
- **Expected value:** List of friendly names (e.g., `drought`, `heat-stress`, `flooding`, `cold-stress`).
- **Encoding:** Expanded into a `themes` entry under the CDH hazard scheme (see §4.1). Does not appear as a standalone field in the encoded output.

#### `cdh.climate.baseline`

- **Requirement:** Conditional — required when the dataset reports anomalies, departures, or future values relative to a baseline.
- **Expected value:** `{ start_date, end_date }`.

#### `cdh.climate.bias_adjustment`

- **Requirement:** Conditional — required for bias-adjusted climate data.
- **Expected value:** `{ method, reference_dataset }`.

#### `cdh.climate.downscaling`

- **Requirement:** Conditional — required for downscaled climate data.
- **Expected value:** `{ method, resolution }`.

### 4.7 Processing and Provenance

#### `processing[]`

- **Requirement:** Recommended — required for derived products.
- **Definition:** Ordered list of processing steps. The first step SHOULD
  use `id: source` and describes the original generation of the data; for
  many records this is the only step needed.
- **Expected value per step:** `{ id, description, code: { url, version }, date, derived_from[] }`.
- **Rules:**
  - `id` must be unique within `processing[]`.
  - `derived_from[]` entries are **always external URLs** of the form
    `{ url, title }`. This matches STAC `links[rel=derived_from]`
    semantics. Inter-step references are NOT used here — order in the
    `processing[]` array carries the step sequence, and the chain for a
    specific asset is captured by `data[].processing_steps[]`.
  - `date` is ISO 8601 / RFC 3339.
  - When a record needs only the original generation, list a single
    `id: source` step. Add subsequent steps only when meaningful new
    processing occurs (e.g., format conversion, bias adjustment).

### 4.8 Assets and Links

#### `data[]`

- **Requirement:** Required — at least one entry.
- **Expected value per entry:** `{ name, url, description, media_type, file_size, nodata, processing_steps }`.
- **Vocabulary:** `media_type` must be an [IANA media type](https://www.iana.org/assignments/media-types/) (e.g., `application/vnd.zarr; version=3`, `image/tiff; application=geotiff; profile=cloud-optimized`).
- **Rules:**
  - `url` must point to the described resource and should be stable.
  - For restricted resources, `url` should point to a landing page or access instructions.
  - Authors SHOULD provide `media_type` when they know it.
  - If `media_type` or `file_size` is missing, the CDH review process may add
    it when it can be determined from the asset URL, file extension, or
    inspectable metadata.
  - This review assistance is best effort and may fail for extensionless URLs,
    signed URLs, APIs, landing pages, directories, object-store prefixes,
    ambiguous formats, Zarr stores, or other multi-file resources.
  - Serialized records must contain the required values, whether supplied by
    the contributor or added during CDH review.
  - `processing_steps` references `processing[].id` values.

#### `additional_assets[]`

- **Requirement:** Recommended
- **Definition:** Non-primary assets (QA/QC, code lists, schemas, thumbnails, alternate formats).
- **Expected value per entry:** `{ name, url, description, media_type, roles, file_size }`.
- **Vocabulary for `roles`:** STAC roles — `metadata`, `validation`, `describedby`, `thumbnail`, `overview`, `visual`, plus CDH-specific roles when defined.
- **Rules:**
  - Authors SHOULD provide `media_type` and `file_size` when they know them.
  - If `media_type` or `file_size` is missing, the CDH review process may add
    it when it can be determined from the asset URL, file extension, or
    inspectable metadata.
  - Serialized records must contain the required values, whether supplied by
    the contributor or added during CDH review.

#### `additional_links[]`

- **Requirement:** Optional
- **Expected value per entry:** `{ name, rel, url, description }`.
- **Vocabulary for `rel`:** See §5.

## 5. Link Relations

| rel                       | Use                                                              | Source |
| ------------------------- | ---------------------------------------------------------------- | ------ |
| `self`, `root`, `parent`, `child`, `collection` | Catalog navigation                         | IANA / STAC / OGC |
| `cite-as`                 | Preferred citation target (DOI)                                  | IANA   |
| `describedby` / `describes` | Documentation, schema, code list                               | IANA   |
| `about`                   | Project or explanatory page                                      | IANA   |
| `via`                     | Intermediate source                                              | IANA   |
| `canonical`               | Authoritative URL (when this is a mirror)                        | IANA   |
| `alternate`               | Alternate representation                                         | IANA   |
| `derived_from`            | Source dataset                                                   | STAC   |
| `predecessor-version` / `successor-version` | Version chain                                  | IANA   |
| `enclosure`               | Downloadable file (OGC Records)                                  | IANA   |
| `service`                 | Service endpoint                                                 | IANA   |
| `license`                 | License document                                                 | IANA   |
| `preview` / `icon` / `thumbnail` | Imagery                                                   | IANA / STAC |
| `processing-expression`   | Code or workflow that produced the data                          | STAC Processing Ext. |

## 6. Controlled Vocabularies Summary

| Field                       | Vocabulary                                              |
| --------------------------- | ------------------------------------------------------- |
| `license`                   | SPDX License List                                       |
| dates (`created`, `updated`, `temporal.*`, `processing.date`) | ISO 8601 / RFC 3339   |
| `spatial.crs`               | EPSG codes                                              |
| `variables[].unit`, `*.resolution.unit` | UDUNITS-2                                   |
| `variables[].name` (climate) | CF Standard Names (where practical)                    |
| `contact[].role`            | Official STAC provider roles: `licensor`, `producer`, `processor`, `host` |
| `media_type`                | IANA media types                                        |
| `resource_type`             | CDH-controlled list (§4.1)                              |
| `cdh.domain`                | `vocab/domain.yaml` (CDH closed set)                    |
| `themes[].scheme`           | Open — any resolvable scheme URI. CDH domain, commodity, and hazard schemes are emitted automatically from the CDH flat fields. Author-added schemes must include URIs and descriptions on every concept. |
| `cdh.commodities`           | `vocab/commodity.yaml` (AGROVOC-mapped); encoded as themes |
| `cdh.climate.hazards`       | `vocab/hazard.yaml` (AGROVOC-mapped); encoded as themes    |
| `cdh.climate.mip_era`       | `CMIP5`, `CMIP6` (informal)                             |
| `cdh.climate.scenarios`     | SSP / RCP labels, `historic` (informal)                 |
| `cdh.climate.models`        | CMIP source IDs (informal)                              |

## 7. Validation Checklist

### Required for every record

- [ ] `id`, `title`, `description`
- [ ] `created`, `updated`
- [ ] `resource_type`, `encoding`
- [ ] `cdh.domain[]` includes at least one concept from `vocab/domain.yaml`
- [ ] `keywords[]`
- [ ] `license`, `license_holder`
- [ ] `contact[]` (for published records)
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
- [ ] `cdh.commodities[]` for commodity-specific resources
- [ ] `cdh.climate.scenarios[]` for projection-based climate resources
- [ ] `cdh.climate.mip_era` for CMIP-based resources
- [ ] `cdh.climate.hazards[]` for hazard/risk resources
- [ ] `cdh.climate.baseline` for anomalies and baseline-relative indicators
- [ ] `classes[]` or class sidecar for classified data

## 8. AI-Readability Minimum

A record is AI-ready when an automated tool can answer the following without
opening the data files:

- What is this resource?
- Who produced and maintains it?
- How should it be cited?
- What license governs reuse?
- Where is it accessed?
- What geography and time period does it cover?
- What variables, dimensions, and codes does it contain, and in what units?
- What source data and processing produced it?
- What known limitations apply?
- What file size, media type, and alternate access paths are available?

Descriptions explain and contextualize these answers but are not their only source.
