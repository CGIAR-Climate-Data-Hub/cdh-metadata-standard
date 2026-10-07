# CDH to STAC Mapping

Status: v0.4.0

This document describes the mapping of a CDH record as STAC. All field definitions and requirements
live in `standard.md`, A record is valid or invalid against the schema, never against this mapping.
Where the two disagree, `standard.md` wins and this document is wrong.

## 1. When STAC maps well

STAC fits resources with spatial, temporal, asset-level, variable-level, or data-cube discovery
needs:

- Rasters, COGs, Zarr, NetCDF, GeoParquet
- Data cubes and gridded climate products
- Spatial vector assets, spatial/temporal tabular assets
- APIs for access to geospatial data

A record with a spatial footprint - `bbox`, `crs`, `resolution`, or `geometry_column` (see
`standard.md` section 5.3) - carries everything STAC needs and can encode into it directly.
`spatial.geography` alone is a place facet, not a footprint.

### 1.1 Records without a spatial footprint

Whether a deployment also encodes non-spatial records as STAC, to keep one format across the whole
catalog, is allowed, although we acknowledge it is not the intended use for Stac. The constraints
that decide it:

- A **Collection** requires `extent.spatial.bbox`. There is no null or absent form, so a non-spatial
  Collection has to state a footprint it does not have - commonly the whole world, which then
  answers every spatial query.
- An **Item** may set `geometry: null`, and `bbox` is then _prohibited_ - honest about having no
  footprint. But `datetime` is still required, null only when `start_datetime` and `end_datetime`
  are both set, so a record with no temporal extent either needs a stand-in date. An Item is also a
  member of a Collection rather than a resource in its own right, and Items are already produced by
  `href_template` expansion (section 5.2), so the same construct would carry two meanings.

## 2. STAC Extensions

The CDH STAC profile uses the following extensions where applicable.

| Extension           | Purpose                                                             |
| ------------------- | ------------------------------------------------------------------- |
| Scientific          | DOI, citation, related publications                                 |
| Datacube            | Variables, dimensions, units, nodata for data cubes and Zarr/NetCDF |
| Raster              | Per-band metadata for COG-style raster assets                       |
| Table               | Columns, row count, primary geometry for tabular assets             |
| Classification      | Class values, labels, descriptions, bitfields                       |
| Projection          | CRS, EPSG code, projection metadata                                 |
| Processing          | Processing datetime, lineage, software                              |
| Contacts            | People and organizations, including point-of-contact roles          |
| Version             | Dataset version, predecessor/successor records                      |
| File                | File size, checksum                                                 |
| Alternate Assets    | Mirrors and alternate access paths                                  |
| Themes              | Controlled-vocabulary thematic classification                       |
| **CDH (cgiar-cdh)** | Hub-specific approved fields not covered by the above               |

## 3. Native-fields-first rule

Encode each field in the most standard place available:

1. Core STAC field (`id`, `title`, `description`, `license`, `keywords`, `created`, `updated`,
   `providers`, `extent`, …)
2. A STAC Extension field from the table above
3. An approved `cgiar-cdh:*` field
4. A sidecar metadata asset linked with `rel=describedby`
5. Free-text `description` or `cgiar-cdh:note`

Searchable structured facts MUST NOT live only in free text.

## 4. Field-by-field placement

### 4.1 Core

| CDH                         | STAC placement                                                                                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | `id`                                                                                                                                                                                                                                          |
| `title`                     | `title`                                                                                                                                                                                                                                       |
| `description`               | `description`                                                                                                                                                                                                                                 |
| `created` / `updated`       | `created` / `updated`                                                                                                                                                                                                                         |
| `keywords`                  | `keywords`                                                                                                                                                                                                                                    |
| `license`                   | `license` (SPDX preferred)                                                                                                                                                                                                                    |
| `attribution`               | `cgiar-cdh:attribution`; also suitable for schema.org `creditText` on generated landing pages.                                                                                                                                                |
| `access`                    | `cgiar-cdh:access` (STAC has no native access-rights field). Omitted = `public`; `public` MAY be left unencoded.                                                                                                                              |
| `access_note`               | `cgiar-cdh:access_note`; also suitable for schema.org `conditionsOfAccess` on generated landing pages.                                                                                                                                        |
| `contact[]`                 | `providers[]` and contacts extension `contacts[]` for additional contact info. At least one contact must include `licensor` in `roles`, which maps to a `licensor` provider. `orcid` or `ror` becomes that contact's `identifier`.            |
| `citation`                  | `sci:citation`                                                                                                                                                                                                                                |
| `doi`                       | `sci:doi` and `links[rel=cite-as]`                                                                                                                                                                                                            |
| `related_publications[]`    | `sci:publications[]`                                                                                                                                                                                                                          |
| `note`                      | `cgiar-cdh:note`                                                                                                                                                                                                                              |
| `version`                   | `version` (Version Extension)                                                                                                                                                                                                                 |
| `deprecated`                | `deprecated` (Version Extension)                                                                                                                                                                                                              |
| `previous_version`          | `links[rel=predecessor-version]` (Version Extension). The rest of the chain follows from the `previous_version` graph: superseded records get `links[rel=successor-version]` and `links[rel=latest-version]` (see `standard.md` section 4.7). |
| `temporal.update_frequency` | `cgiar-cdh:update_frequency`                                                                                                                                                                                                                  |
| `additional_links[]`        | Collection `links[]`: `url` as `href`, `rel` as `rel`, `title` as `title`, and `description` as a `description` extra field (STAC links have none of their own).                                                                              |
| `funding[]`                 | `cgiar-cdh:funding`                                                                                                                                                                                                                           |
| `series`                    | `cgiar-cdh:series` (`{ name, url }`). `name` is the grouping key for series facets and listings.                                                                                                                                              |
| `cdh.domain[]`              | `cgiar-cdh:domain` on the Collection; also expanded into Themes Extension `themes[]` under the CDH domain scheme. First entry drives sub-catalog placement.                                                                                   |
| `keywords[]` (linked items) | Each linked-keyword entry (`{ term, scheme, uri }`) is also emitted as a Themes Extension `themes[]` concept, grouped by `scheme`. Plain-string keywords are emitted only into STAC `keywords`.                                               |
| Themes Extension `themes[]` | Derived output - populated from `cdh.domain`, `commodities`, and any linked-keyword entries. Not an author-facing input field.                                                                                                                |

### 4.2 Resource type

STAC implies resource type through object type and asset media types. CDH also emits
`cgiar-cdh:resource_type` for cross-encoding consistency.

### 4.3 Spatial / Temporal

| CDH                                         | STAC placement                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spatial.bbox`                              | `extent.spatial.bbox` (Collection) - the overall/union box is prepended as the first entry, then the authored boxes; `bbox` (Item)                                                                                                                                                                                                |
| `spatial.geography[]`                       | `cgiar-cdh:geography` array                                                                                                                                                                                                                                                                                                       |
| `spatial.crs`                               | Projection Extension v2: `proj:code`                                                                                                                                                                                                                                                                                              |
| `spatial.geometry_column`                   | Table Extension `table:primary_geometry`                                                                                                                                                                                                                                                                                          |
| `spatial.resolution[]`                      | Grid entries (`xy`, `x`, `y`) map to `cube:dimensions[].step` (+ `unit`/`reference_system`); `point` and `polygon` entries emit as `cgiar-cdh:spatial_resolution`                                                                                                                                                                 |
| `temporal.date` / `start_date` / `end_date` | `date` -> `datetime`; `start_date`/`end_date` -> `start_datetime`/`end_datetime`; `end_date: null` -> open interval; also `extent.temporal.interval` (Collection). Reduced-precision values expand to full RFC 3339 (start to period start, end inclusive to period end); the raw value also feeds schema.org `temporalCoverage`. |

Resolution placement, in order of preference:

1. For gridded/array assets, `spatial.resolution[]` entries with `type: xy`, `x`, or `y` are
   expanded to the relevant `cube:dimensions[]` `step`, expressed in that dimension's native `unit`
   / `reference_system`. `type: xy` is an authoring shorthand and serializes as separate x and y
   dimensions.
2. `point` and `polygon` entries emit as `cgiar-cdh:spatial_resolution`, and only those: a reporting
   unit has no native STAC home, while grid spacing already has one in rule 1. Repeating a grid
   entry there would state one fact twice, with nothing keeping the two copies in agreement.
3. Temporal cadence is not a resolution field: it comes from a `type: temporal` dimension's `step`
   (see below), which maps to that `cube:dimensions[].step`.

### 4.4 Data fields, dimensions, variables

Array/grid data uses Datacube by default; tabular data uses Table.

- `dimensions[]` -> `cube:dimensions`
- `variables[]` -> `cube:variables`
- `structures[]` -> asset-level `cube:dimensions` and `cube:variables`

Each `cube:variables` entry's `dimensions` comes from the structure that holds the variable, or
every declared dimension when the record has no `structures[]`. An asset with `data[].structures`
carries its own `cube:dimensions` and `cube:variables`, listing only what its structures hold.

Each `dimensions[]` entry becomes a `cube:dimensions` member. A `type: temporal` dimension
serializes as a temporal cube dimension, carrying its `step` (an ISO 8601 duration) as
`cube:dimensions[].step` when supplied; otherwise `step` is omitted, since STAC `null` means
irregular spacing. Never derive a window length or `end_datetime` from `step`. STAC datacube permits
several temporal dimensions, so a store holding a yearly climatology beside a daily field emits one
temporal dimension each, while the top-level `temporal` drives the Collection `extent.temporal`.

For grid data, `spatial.resolution[]` derives `cube:dimensions[].step` with native units.

Dimension types map as follows. The horizontal axes are derived, never authored: `spatial.bbox`
gives each one's `extent` and `spatial.resolution[]` its `step`.

| CDH `dimensions[].type` | STAC `cube:dimensions` entry                                         |
| ----------------------- | -------------------------------------------------------------------- |
| derived from `spatial`  | `{ type: spatial, axis: x }` and `{ type: spatial, axis: y }`        |
| `z`                     | `{ type: spatial, axis: z }`, carrying `values`, `unit`              |
| `temporal`              | `{ type: temporal }`, carrying `values` and `step`                   |
| `location`, any other   | Additional Dimension: `{ type: <the CDH value> }`, carrying `values` |

A temporal dimension requires an `extent`. It is derived, not copied from the CDH field of the same
name. It comes from the dimension's `values` (first and last), its authored `extent`, or the
top-level `temporal` coverage. A record may have several temporal dimensions, each with its own
extent.

A `z` or Additional Dimension needs `extent` or `values`. It carries its `values`, and gets an
`extent` (smallest and largest value) only when the values are numbers. A dimension with no `values`
gets `extent: [null, null]`, unknown bounds, so it stays in `cube:dimensions` for the variables that
name it.

`unit` maps to `cube:dimensions[].unit`, which the datacube extension defines on every dimension
flavour. `spatial` and `geometry` are not accepted as authored types: the first is derived and the
second is a shape CDH does not emit, and the extension forbids both as custom type values.

`data[].nodata` is the asset default and fans out to every variable in that asset; a
`variables[].nodata` replaces it for that variable alone. For an entry templated over `{variable}`
(section 5.2), each expanded Item takes the nodata of the variable it holds.

- Use Raster Extension on raster assets when band-level physical metadata exists.

- `variables[].data_type` maps to the STAC 1.1 `bands[].data_type` common field on rasters and to
  `table:columns[].type` on tables. On tables, dimensions and variables both become columns, each
  with its `description` and, when given, its `data_type` as `type`; `decimal`, `boolean`, `string`,
  `binary`, `date`, `time`, and `datetime` are table-only.
- Tabular data uses Table Extension `table:columns`; `spatial.geometry_column` maps to
  `table:primary_geometry`. Each `foreign_keys[]` entry maps to `cgiar-cdh:foreign_keys` on every
  asset that holds its `fields`, in the same shape: `reference.resource` becomes `reference.href`
  (an id resolves to that record's URL) and `reference.asset` stays the target's asset key.

Integer `variables[].categories` on raster variables map to Classification Extension
`classification:classes` on the corresponding band, or the asset for a single-band raster: `value`
as `value`, `label` as `title`, and `description` as `description`. Each class object's `name` is
derived from `label`: apply Unicode NFKD normalization, discard non-ASCII characters, replace each
run of characters outside `[0-9A-Za-z_-]` with `_`, and trim leading and trailing underscores.
Preserve letter case. If the result is empty, use the integer `value` written as a string. The
`title` retains the original label.

Dimension `categories` are axis coordinates, not pixel classes; they never become
`classification:classes`. Their codes are the dimension's `values` in `cube:dimensions`, and their
labels follow the sidecar rule below.

String codes and table categories MUST retain their original values, labels, and descriptions in a
data dictionary sidecar asset with `roles=[metadata, describedby]` and a link with
`rel=describedby`. Long category lists SHOULD also use a sidecar. Link from the variable's
containing object.

### 4.5 Collection vs Item vs Summaries vs Asset

Decision rules:

- **Collection-level field** when the value is an authoritative statement about the whole resource
  (e.g., `title`, `license`, `extent`, `sci:citation`).
- **`summaries`** when the value describes the set of values available across Items / Assets /
  variables (e.g., available scenarios, available commodities, per-Item resolutions). Required
  Collection metadata MUST NOT live only in `summaries`.
- **Item-level field** when the value varies per Item and Item-level discovery is needed
  (`datetime`, `bbox`, `geometry`, per-Item variables). Items are produced from a `data[]` entry
  carrying `spatial` (5.1), an `href_template` (5.2), or a `cdh-inventory` (5.4); Items cannot be
  authored directly.
- **Asset-level field** when the value describes a specific file or access endpoint (`file:size`,
  asset `roles`, `type`).

### 4.6 CDH-specific fields

The `cdh.*`, `climate.*`, and `commodities` fields in the input record are encoded under the
`cgiar-cdh:` namespace. `commodities` is expanded into `themes` entries via the CDH commodity JSON
lookup.

Faceted fields such as `scenarios` and `models` live in Collection `summaries` when they apply
across Items. `mip_era`, `baseline`, `bias_adjustment`, `downscaling`, `intended_uses`, and
`not_recommended_for` are Collection-level `cgiar-cdh:*` fields.

When a faceted value is also a data axis, emit it in both places: discovery fields and
`cube:dimensions`.

### 4.7 Catalog hierarchy

A record's `parent` (`standard.md` section 4.8) maps to navigation links only:

- Most CDH records are collections (with the non-spatial exception mentioned above).
- A record with `parent` becomes a `child` link on that parent Collection and carries a `parent`
  link back to it, plus `root`. Records without `parent` hang off the root.
- No Catalog object other than the root exists: every node in the tree is a record.
- Superseded releases are not children. They map to `predecessor-version` / `successor-version` /
  `latest-version` links (section 6), never to `child`.

No field value moves between a parent and a child; every published Collection is complete on its
own.

## 5. Assets

The STAC asset key is the entry's `name`; names must be unique across `data[]` and
`additional_assets[]`.

Every asset SHOULD include:

- `href`
- `title`
- `type` (media type)
- `roles`
- `description` if the asset is not self-explanatory

Recommended file metadata: File Extension `file:size` in bytes. A `file_size` written with a unit
converts at powers of 1000, rounded up to whole bytes (`31.1 MB` is `31100000`). A `data[].checksum`
becomes `file:checksum`, re-encoded as a multihash.

### 5.1 Asset `locations[]`

Each input `data[]` / `additional_assets[]` entry carries `locations[]` (one or more access paths to
the **same content**). Encode as:

- `assets[*].href` ← `locations[0].url` (the canonical location).
- Each additional `locations[]` entry -> an Alternate Assets Extension `alternate` entry on the same
  asset, keyed by a short name (from `locations[].title` when present, otherwise a generated key),
  carrying its `href` and optional `title`.
- The asset's `type` (media type) and `file:size` apply to all locations, since they are the same
  content.

A `data[]` entry with `spatial` and no `href_template` or `file_index` is emitted as its own Item
holding that one asset, because STAC searches Items by area and assets have no footprint. The
entry's `spatial.bbox` gives the Item `bbox` and `geometry`, its `spatial.geography` gives
`cgiar-cdh:geography`, and the Item takes the record's temporal coverage. On an `href_template`
entry, `spatial` replaces the record's bbox as each expanded Item's footprint. Entries without
`spatial` stay Collection assets.

### 5.2 Templated assets (`href_template`)

A `data[]` entry with `href_template` emits STAC Items whose assets are the expanded files:

- Each `{token}` resolves against the `dimensions[]` entry of the same `name`; one Item exists for
  each combination in the cross-product of those dimensions' `values` (or the values a temporal
  dimension's `extent` + `step` enumerate).
- For each combination, `locations[0]` + filled template is the canonical asset `href`. A temporal
  token with a format (`{date:%Y.%m.%d}`) is rendered with strftime in the href only; `datetime`,
  the Item `id`, and `cgiar-cdh:partition` carry the ISO value. A format finer than the axis
  precision stops publication with a diagnostic; never invent a month or day. A coarser format
  groups several values into one href. Additional locations become Alternate Assets entries.
- How the combinations group into Items depends on whether a token is a time axis:
  - **A `{token}` resolving to a `type: temporal` dimension** -> one Item per distinct href, its
    `datetime` taken from that token's value. When a coarser format groups several values into one
    href, `start_datetime` / `end_datetime` span them instead, `datetime` is null, and the `id`
    carries the value at the precision the format spells (`2020` for `{date:%Y}`). A STAC Item is
    the unit time-series tooling indexes on, so a time axis has to be Items rather than assets for
    Open Data Cube and similar readers to see a series at all. The token values appear in the Item
    `id`.
  - **No temporal token** -> one Item holding every expanded file as an asset, spanning the record's
    temporal extent via `start_datetime` / `end_datetime`. Splitting on a domain axis instead would
    scatter one dataset across Items that differ in no way a client can order. The `id` names the
    representation, not a position, and carries no token values.
- The Item inherits the Collection's `dimensions` / `variables`, and `cgiar-cdh:partition` records
  the position on those axes. The shape is contextual: an Item's partition lists the values it spans
  (`{"crop": ["maiz", "rice"]}`), while each asset inside it states the one value it holds
  (`{"crop": "maiz"}`) - which is what identifies a file once an Item carries more than one.
- A `data[]` entry **without** `href_template` or `file_index` serializes as a single asset, per
  5.1, and carries no partition: there is nothing to partition it on. The same holds for
  `item_assets`, which is a template shared by every Item rather than one positioned file.

### 5.3 Asset roles

| Role          | Use                                                     |
| ------------- | ------------------------------------------------------- |
| `data`        | Primary data file, store, or service                    |
| `metadata`    | Metadata file, code list, schema, sidecar dictionary    |
| `validation`  | QA/QC or validation output                              |
| `describedby` | Documentation or code list that describes another asset |
| `thumbnail`   | Preview image                                           |
| `overview`    | Lower-resolution version of the data                    |
| `visual`      | RGB or visualization product                            |
| `example`     | Runnable usage example (notebook, script, SQL)          |

Multiple roles on one asset are allowed (e.g., `[metadata, describedby]`).

### 5.4 File index assets (`file_index`)

Every `file_index[]` entry is emitted as a Collection asset with role `file_index`, its `format` (or
`title`) as the asset title, `locations[0]` as `href` and the rest as Alternate Assets, and
`media_type` as `type` when present. A `stac-geoparquet` index MAY additionally be linked with
`rel: items` in place of expanding rows into Items. Only the first `cdh-inventory` entry is expanded
as below; other inventories (mirrors) and other formats are not read.

Apply the [file index rules](standard.md#file-indexes-file_index) before encoding. An inventory
entry describes a file family; do not pass its `data[].locations` through the single-asset mapping
in section 5.1.

- Each row's `href` becomes the file asset's `href`. The CSV URL is supporting metadata only.
- A `checksum` cell becomes the asset's `file:checksum`, re-encoded as a multihash (the File
  extension's form); the algorithm prefix selects the multihash code.
- With exactly one temporal coordinate column, emit one Item per row, including when several rows
  share a date. Derive its time from that coordinate, preserving its precision: a year, month, or
  day denotes an interval; an instant denotes `datetime`. Do not invent midnight for a period. Other
  supplied coordinates become asset partition values and singleton Item partition arrays under
  `cgiar-cdh:partition`.
- Without temporal coordinate columns, emit one Item for the family with one asset per row, using
  the record's temporal coverage. Item partition arrays contain the distinct supplied coordinate
  values; each asset carries its own supplied coordinates. Omitted coordinates stay absent. A
  completely non-temporal resource still needs an explicit encoding decision under section 1.1;
  never invent a timestamp to make an Item validate.
- Multiple temporal coordinate columns require an explicit, documented mapping to Item time. Stop
  publication with a diagnostic if that mapping is absent; do not pick the first column.
- Derive stable Item ids and asset keys from the entry name and relative `href`, using a
  deterministic collision-checked encoding or digest. CSV row numbers are not stable ids.
- Emit only each row's selected variables and member dimensions into file-level Table, Raster, or
  Datacube metadata. For a grouped Item, use their union at Item scope. Resolve a selected
  variable's `nodata` over the asset default. Coordinate metadata alone does not establish native
  array dimensions or band order; inspect those before emitting structural claims.
- Item spatial coverage must describe its own content. The entry's family extent can describe an
  Item containing the entire family, but is not automatically the extent of a single-row Item.
  Require source information or inspection where needed; do not assign a combined family bbox to
  every file. Emit only Items whose required spatial and temporal metadata are resolved.

## 6. Link relations

| rel                                                 | Use                                            |
| --------------------------------------------------- | ---------------------------------------------- |
| `self` / `root` / `parent` / `child` / `collection` | Catalog navigation                             |
| `cite-as`                                           | Preferred citation target (DOI when available) |
| `derived_from`                                      | Source dataset                                 |
| `predecessor-version` / `successor-version`         | Version chain (successor side derived)         |
| `latest-version`                                    | Current version (derived, on superseded)       |
| `version-history`                                   | Changelog or version history document          |
| `describedby` / `describes`                         | Documentation, schema, sidecar metadata        |
| `about`                                             | Project page or explanatory site               |
| `via`                                               | Intermediate source                            |
| `canonical`                                         | Authoritative URL when this is a mirror        |
| `alternate`                                         | Alternate representation of the same record    |
| `processing-expression`                             | Code or workflow that produced the data        |
| `service`                                           | Service endpoint                               |
| `service-desc`                                      | Machine-readable API description               |
| `service-doc`                                       | Human-readable API documentation               |
| `license`                                           | License document                               |
| `preview` / `icon` / `thumbnail`                    | Imagery                                        |

Links SHOULD include `type` and `title` where useful. Extra fields on links MAY be used for
CDH-defined attributes such as `cgiar-cdh:code_version`.

## 7. Processing and provenance

`processing[]` is an id-keyed list of processing steps. When present, one step MUST use
`id: source`.

Encoding rules:

1. The `source` step maps to **Collection-level Provider** Processing Extension fields:
   - `description` -> `processing:lineage`
   - `date` -> `processing:datetime`
   - `{ <code.url basename>: code.version }` -> `processing:software`
2. Any `code.url` maps to `links[rel=processing-expression]` on the Collection.
3. The `source` step's `derived_from[]` entries map to `links[rel=derived_from]` on the Collection.
4. Subsequent steps map to **Asset-level** Processing Extension fields on the assets that reference
   them in `processing_steps[]`.
5. `derived_from[]` entries map to `links[rel=derived_from]`, with `version` carried as a
   `cgiar-cdh:source_version` link field. An `id` resolves to that record's URL.
6. Releases share a YAML `id`. The current release keeps it as the Collection id; superseded
   releases are emitted as `<id>_<version>`. Record ids cannot contain `_`, so these never collide
   with another record's id.

## 8. Validation expectations

For STAC validation to pass:

- Every declared extension URI in `stac_extensions` MUST be valid and pinned.
- Every `cgiar-cdh:*` field MUST be defined in the
  [CDH STAC extension schema](./encodings/stac/schema.json), which closes the namespace: an
  undefined `cgiar-cdh:*` field, or a defined one in the wrong place, fails validation.
- Every emitted record MUST declare the extension in `stac_extensions`, pinned to the release the
  record targets.
- File sizes and projection codes SHOULD be present on assets that need them.
