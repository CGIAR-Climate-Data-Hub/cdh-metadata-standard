# CDH to STAC Mapping

Status: draft

This document specifies how a CDH metadata input record (as defined by
`standard.md` and validated by `schemas/metadata-input.schema.json`) is encoded
as STAC. Field definitions and requirement levels are authoritative in
`standard.md`; this document is authoritative for **placement**. Item level
mappings are inlcuded for reference and possible future expansion. However, CDH
yaml files are intended for collection-level metadata.

## 1. When to use STAC

Use STAC when the resource has meaningful spatial, temporal, asset-level,
variable-level, or data-cube discovery needs. Typical cases:

- Rasters, COGs, Zarr, NetCDF, GeoParquet
- Data cubes and gridded climate products
- Spatial vector assets, spatial/temporal tabular assets
- APIs for access to geospatial data

The `encoding` field in the input record is authoritative for routing. Set
`encoding: stac` to use this mapping.

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
| Contacts            | People and organizations, using official STAC provider roles        |
| Version             | Dataset version, predecessor/successor records                      |
| File                | File size                                                           |
| Alternate Assets    | Mirrors and alternate access paths                                  |
| Themes              | Controlled-vocabulary thematic classification                       |
| **CDH (cgiar-cdh)** | Hub-specific approved fields not covered by the above               |

## 3. Native-fields-first rule

Each field MUST be encoded in the most standard place available, in this order:

1. Core STAC field (`id`, `title`, `description`, `license`, `keywords`,
   `created`, `updated`, `providers`, `extent`, …)
2. A STAC Extension field from the table above
3. An approved `cgiar-cdh:*` field
4. A sidecar metadata asset linked with `rel=describedby`
5. Free-text `description` or `cgiar-cdh:note`

Free-text descriptions are valuable but MUST NOT be the only location for
searchable structured facts.

## 4. Field-by-field placement

### 4.1 Core

| CDH                         | STAC placement                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | `id`                                                                                                                                                                                            |
| `title`                     | `title`                                                                                                                                                                                         |
| `description`               | `description`                                                                                                                                                                                   |
| `created` / `updated`       | `created` / `updated`                                                                                                                                                                           |
| `keywords`                  | `keywords`                                                                                                                                                                                      |
| `license`                   | `license` (SPDX preferred)                                                                                                                                                                      |
| `contact[]`                 | `providers[]` and contacts extension `contacts[]` for additional contact info. At least one contact must use `role=licensor`, which maps to `providers[role=licensor]`.                         |
| `citation`                  | `sci:citation`                                                                                                                                                                                  |
| `doi`                       | `sci:doi` and `links[rel=cite-as]`                                                                                                                                                              |
| `related_publications[]`    | `sci:publications[]`                                                                                                                                                                            |
| `note`                      | `cgiar-cdh:note`                                                                                                                                                                                |
| `version`                   | `version` (Version Extension)                                                                                                                                                                   |
| `previous_version`          | `links[rel=predecessor-version]`; mark prior record `deprecated: true`                                                                                                                          |
| `funding[]`                 | `cgiar-cdh:funding`                                                                                                                                                                             |
| `cdh.domain[]`              | `cgiar-cdh:domain` on the Collection; also expanded into Themes Extension `themes[]` under the CDH domain scheme. First entry drives sub-catalog placement.                                     |
| `keywords[]` (linked items) | Each linked-keyword entry (`{ term, scheme, uri }`) is also emitted as a Themes Extension `themes[]` concept, grouped by `scheme`. Plain-string keywords are emitted only into STAC `keywords`. |
| Themes Extension `themes[]` | Encoder output only — populated from `cdh.domain`, `commodities`, `climate.hazards`, and any linked-keyword entries. Not an author-facing input field.                                          |

### 4.2 Resource type

STAC implies the resource type via the STAC object type (`Catalog`,
`Collection`, `Item`) and asset media types. CDH records additionally SHOULD
include `cgiar-cdh:resource_type` at the Collection level for cross-encoding
consistency when the record could also be expressed as an OGC API Record.

### 4.3 Spatial / Temporal

| CDH                                | STAC placement                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spatial.bbox`                     | `extent.spatial.bbox` (Collection); `bbox` (Item)                                                                                                    |
| `spatial.geography[]`              | `cgiar-cdh:geography` array                                                                                                                          |
| `spatial.crs`                      | Projection Extension: `proj:code` (preferred) or `proj:epsg`                                                                                         |
| `spatial.geometry_column`          | Table Extension `table:primary_geometry`                                                                                                             |
| `spatial.resolution[]`             | Grid entries (`xy`, `x`, `y`) map to `cube:dimensions[].step` (+ `unit`/`reference_system`); all entries also emit as `cgiar-cdh:spatial_resolution` |
| `temporal.start_date` / `end_date` | `extent.temporal.interval` (Collection); `cube:dimensions[time].extent`; `datetime` / `start_datetime` / `end_datetime` (Item);                      |
| `temporal.resolution`              | `cube:dimensions[time]` for `step`, `values`, and `unit`                                                                                             |

Resolution placement, in order of preference:

1. For gridded/array assets, `spatial.resolution[]` entries with `type: xy`,
   `x`, or `y` are expanded to the relevant `cube:dimensions[]` `step`,
   expressed in that dimension's native `unit` / `reference_system`. `type: xy`
   is an authoring shorthand and serializes as separate x and y dimensions.
2. `temporal.resolution.step` maps to `cube:dimensions[time].step` when the data
   has a real time axis.
3. The Collection-level `cgiar-cdh:spatial_resolution` mirrors the input
   `spatial.resolution[]` list. This is the format-independent value for labels,
   point/polygon reporting units, and non-metric spatial units.
4. The Collection-level `cgiar-cdh:temporal_resolution` mirrors
   `temporal.resolution` (`{ values, unit, step, note }`).

### 4.4 Data fields, dimensions, variables

The encoder does **not** choose between Datacube, Raster, and Table per asset.
The only decision is **tabular or not**:

- **Datacube by default for all array/grid data** (Zarr, NetCDF, GRIB, HDF5, and
  COG/GeoTIFF — single-band or stacked). Datacube is the always-on descriptive
  home for variables and dimensions:

  - `dimensions[]` -> `cube:dimensions`
  - `variables[]`-> `cube:variables`

  A 2D raster is a valid cube: its x and y are horizontal spatial dimensions.
  Use `spatial.resolution[]` grid entries to derive `cube:dimensions[].step` (+
  `unit` / `reference_system`) for grid resolution; the step is expressed in the
  dimension's native units, so geographic grids (degrees, arc-minutes) are
  represented faithfully — unlike the meters-only `raster:spatial_resolution`
  and core `gsd` (see section 4.3 and the `cgiar-cdh:spatial_resolution` note).

- **Compose the Raster Extension on raster assets when band-level physical
  metadata exists.** This is additive for additional stac raster tooling (i.e.
  gdal `/STACIT/`, `odc-stac`, and `stackstac`)

- **Tabular data uses the Table Extension.** Use Table Extension
  `table:columns`; `table:primary_geometry` for `spatial.geometry_column`;
  optional `table:row_count`. Variable/column metadata for tabular assets lives
  in `table:columns`, not `cube:variables`.

`classes[]` -> Classification Extension `classification:classes` on the relevant
asset or variable. Large class lists SHOULD be a sidecar asset with
`roles=[metadata, describedby]` and a link with `rel=describedby` from the
variable's containing object.

### 4.5 Collection vs Item vs Summaries vs Asset

Decision rules:

- **Collection-level field** when the value is an authoritative statement about
  the whole resource (e.g., `title`, `license`, `extent`, `sci:citation`).
- **`summaries`** when the value describes the set of values available across
  Items / Assets / variables (e.g., available scenarios, available commodities,
  per-Item resolutions). Required Collection metadata MUST NOT live only in
  `summaries`.
- **Item-level field** when the value varies per Item and Item-level discovery
  is needed (`datetime`, `bbox`, `geometry`, per-Item variables). **NOTE: This
  is currently not implemented in the current yaml spec.**
- **Asset-level field** when the value describes a specific file or access
  endpoint (`file:size`, asset `roles`, `type`).

### 4.6 CDH-specific fields

The `cdh.*`, `climate.*`, and `commodities` fields in the input record are
encoded under the `cgiar-cdh:` namespace. `commodities` and `climate.hazards`
are expanded into `themes` entries by the encoder via the CDH commodity and CDH
hazard JSON lookups (see core standard sections 5.1 and 5.6).

Other faceted/multi-valued fields (`scenarios`, `models`) live in `summaries` at
the Collection level when the value applies across Items. `mip_era`, `baseline`,
`bias_adjustment`, `downscaling`, `use_cases`, `not_recommended_for` are
Collection top-level `cgiar-cdh:*` fields.

When a CDH faceted value is also a discoverable axis of the data (e.g., `crop`
or `commodity` is a `cube:dimensions` axis), values will be included in both, as
they serve different purposes (dataset discovery and data use/subsetting)

## 5. Assets

Every asset SHOULD include:

- `href`
- `title`
- `type` (media type)
- `roles`
- `description` if the asset is not self-explanatory

Recommended file metadata:

- File Extension `file:size` in bytes — required for primary data assets

### 5.1 Asset `locations[]`

Each input `data[]` / `additional_assets[]` entry carries `locations[]` (one or
more access paths to the **same content**). Encode as:

- `assets[*].href` ← `locations[0].url` (the canonical location).
- Each additional `locations[]` entry -> an Alternate Assets Extension
  `alternate` entry on the same asset, keyed by a short name (from
  `locations[].title` when present, otherwise a generated key), carrying its
  `href` and optional `title`.
- The asset's `type` (media type) and `file:size` apply to all locations, since
  they are the same content.

### 5.1 Asset roles

| Role          | Use                                                     |
| ------------- | ------------------------------------------------------- |
| `data`        | Primary data file, store, or service                    |
| `metadata`    | Metadata file, code list, schema, sidecar dictionary    |
| `validation`  | QA/QC or validation output                              |
| `describedby` | Documentation or code list that describes another asset |
| `thumbnail`   | Preview image                                           |
| `overview`    | Lower-resolution version of the data                    |
| `visual`      | RGB or visualization product                            |

Multiple roles on one asset are allowed (e.g., `[metadata, describedby]`).

## 6. Link relations

| rel                                                 | Use                                            |
| --------------------------------------------------- | ---------------------------------------------- |
| `self` / `root` / `parent` / `child` / `collection` | Catalog navigation                             |
| `cite-as`                                           | Preferred citation target (DOI when available) |
| `derived_from`                                      | Source dataset                                 |
| `predecessor-version` / `successor-version`         | Version chain                                  |
| `describedby` / `describes`                         | Documentation, schema, sidecar metadata        |
| `about`                                             | Project page or explanatory site               |
| `via`                                               | Intermediate source                            |
| `canonical`                                         | Authoritative URL when this is a mirror        |
| `alternate`                                         | Alternate representation of the same record    |
| `processing-expression`                             | Code or workflow that produced the data        |
| `service`                                           | Service endpoint                               |
| `license`                                           | License document                               |
| `preview` / `icon` / `thumbnail`                    | Imagery                                        |

Links SHOULD include `type` and `title` where useful. Extra fields on links MAY
be used for CDH-defined attributes such as `cgiar-cdh:code_version`.

## 7. Processing and provenance

The CDH `processing[]` block is a id-keyed list of processing steps. When
`processing[]` is provided, at least one step MUST use `id: source` and describe
the original/initial production of the data.

Encoding rules:

1. The `source` step maps to **Collection-level Provider** Processing Extension
   fields:
   - `description` -> `processing:lineage`
   - `date` -> `processing:datetime`
   - `{ <code.url basename>: code.version }` -> `processing:software`
2. The any `code.url` maps to `links[rel=processing-expression]` on the
   Collection.
3. The `source` step's `derived_from[].url` entries map to
   `links[rel=derived_from]` on the Collection.
4. Subsequent steps map to **Asset-level** Processing Extension fields on the
   assets that reference them in `processing_steps[]`.
5. `derived_from[]` entries are external URLs/STAC Metadata links and map to
   `links[rel=derived_from]`.

## 8. Validation expectations

For STAC validation to pass:

- Every declared extension URI in `stac_extensions` MUST be valid and pinned.
- Every `cgiar-cdh:*` field MUST be defined in the CDH STAC Extension schema.
  Adding undefined `cgiar-cdh:*` fields will fail validation.
- File sizes and projection codes SHOULD be present on assets that need them.
