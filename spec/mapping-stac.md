# CDH → STAC Mapping

Status: draft

This document specifies how a CDH metadata record (as defined by `standard.md`
and `standard.yaml`) is encoded as STAC. Field definitions and requirement
levels are authoritative in `standard.md`; this document is authoritative for
**placement**.

## 1. When to use STAC

Use STAC when the resource has meaningful spatial, temporal, asset-level,
variable-level, or data-cube discovery needs. Typical cases:

- Rasters, COGs, Zarr, NetCDF, GeoParquet
- Data cubes and gridded climate products
- Spatial vector assets, spatial/temporal tabular assets
- APIs for access to geospatial data

The `encoding` field in `standard.yaml` is authoritative for routing. Set
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
| File                | File size, checksum                                                 |
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
| `license_holder`            | `providers[role=licensor]`                                                                                                                                                                      |
| `contact[]`                 | `providers[]` for organizations; Contacts Extension `contacts[]` for people                                                                                                                     |
| `citation`                  | `sci:citation`                                                                                                                                                                                  |
| `doi`                       | `sci:doi` and `links[rel=cite-as]`                                                                                                                                                              |
| `related_publications[]`    | `sci:publications[]`                                                                                                                                                                            |
| `note`                      | `cgiar-cdh:note`                                                                                                                                                                                |
| `version`                   | `version` (Version Extension)                                                                                                                                                                   |
| `previous_version`          | `links[rel=predecessor-version]`; mark prior record `deprecated: true`                                                                                                                          |
| `funding[]`                 | `cgiar-cdh:funding`                                                                                                                                                                             |
| `cdh.domain[]`              | `cgiar-cdh:domain` on the Collection; also expanded into Themes Extension `themes[]` under the CDH domain scheme. First entry drives sub-catalog placement.                                     |
| `keywords[]` (linked items) | Each linked-keyword entry (`{ term, scheme, uri }`) is also emitted as a Themes Extension `themes[]` concept, grouped by `scheme`. Plain-string keywords are emitted only into STAC `keywords`. |
| Themes Extension `themes[]` | Encoder output only — populated from `cdh.domain`, `cdh.commodities`, `cdh.climate.hazards`, and any linked-keyword entries. Not an author-facing input field.                                  |

### 4.2 Resource type

STAC implies the resource type via the STAC object type (`Catalog`,
`Collection`, `Item`) and asset media types. CDH records additionally SHOULD
include `cgiar-cdh:resource_type` at the Collection level for cross-encoding
consistency when the record could also be expressed as an OGC API Record.

### 4.3 Spatial / Temporal

| CDH                                | STAC placement                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `spatial.bbox`                     | `extent.spatial.bbox` (Collection); `bbox` (Item)                                              |
| `spatial.geography`                | `cgiar-cdh:geography`                                                                          |
| `spatial.crs`                      | Projection Extension: `proj:code` (preferred) or `proj:epsg`                                   |
| `spatial.resolution`               | `cgiar-cdh:spatial_resolution` at Collection; use `summaries` when it varies                   |
| `temporal.start_date` / `end_date` | `extent.temporal.interval` (Collection); `datetime` / `start_datetime` / `end_datetime` (Item) |
| `temporal.resolution`              | `cgiar-cdh:temporal_resolution` at Collection; use `summaries` when it varies                  |

### 4.4 Data fields, dimensions, variables

Choice of extension depends on the primary asset format:

- **Data cube / Zarr / NetCDF / multi-dimensional**: Datacube Extension.
  - `dimensions[]` → `cube:dimensions`
  - `variables[]` → `cube:variables`
- **COG / GeoTIFF raster bands**: Raster Extension `raster:bands` on the asset,
  in addition to Datacube when both apply.
- **Tabular (Parquet, CSV, vector)**: Table Extension `table:columns`;
  `table:primary_geometry` for `geography.column`; optional `table:row_count`.

`classes[]` → Classification Extension `classification:classes` on the relevant
asset or variable. Large class lists SHOULD be a sidecar asset with
`roles=[metadata, describedby]` and a link with `rel=describedby` from the
variable's containing object.

`geography.spatial_join` → `cgiar-cdh:spatial_join` at Collection, Item, or
Asset depending on which level the join applies to.

### 4.5 Collection vs Item vs Summaries vs Asset

Decision rules:

- **Collection-level field** when the value is an authoritative statement about
  the whole resource (e.g., `title`, `license`, `extent`, `sci:citation`).
- **`summaries`** when the value describes the set of values available across
  Items / Assets / variables (e.g., available scenarios, available commodities,
  per-Item resolutions). Required Collection metadata MUST NOT live only in
  `summaries`.
- **Item-level field** when the value varies per Item and Item-level discovery
  is needed (`datetime`, `bbox`, `geometry`, per-Item variables).
- **Asset-level field** when the value describes a specific file or access
  endpoint (`file:size`, `file:checksum`, asset `roles`, `type`).

### 4.6 CDH-specific fields

All `cdh.*` fields in `standard.yaml` are encoded under the `cgiar-cdh:`
namespace, **except** for `cdh.commodities` and `cdh.climate.hazards`, which are
expanded into `themes` entries by the encoder via the CDH commodity and CDH
hazard JSON lookups (see core standard sections 5.1 and 5.6). The flat
`cgiar-cdh:commodities` / `cgiar-cdh:hazards` fields are not emitted.

Other faceted/multi-valued fields (`scenarios`, `models`) live in `summaries` at
the Collection level when the value applies across Items. Singletons (`mip_era`,
`baseline`, `bias_adjustment`, `downscaling`, `use_cases`,
`not_recommended_for`) are Collection top-level `cgiar-cdh:*` fields.

When a CDH faceted value is also a discoverable axis of the data (e.g., `crop`
is a `cube:dimensions` axis), put the values in the cube/table dimension
definition and advertise the set in `summaries` for catalog filtering. The same
values also appear in `themes` for ontology-aware discovery.

## 5. Assets

Every asset SHOULD include:

- `href`
- `title`
- `type` (media type)
- `roles`
- `description` if the asset is not self-explanatory

Recommended file metadata:

- File Extension `file:size` in bytes — required for primary data assets
- File Extension `file:checksum` — recommended for large or generated assets
- Alternate Assets Extension when multiple access paths exist

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

The CDH `processing[]` block is an id-keyed DAG of processing steps. The first
step SHOULD use `id: source` and describes the original/initial production of
the data.

Encoding rules:

1. The `source` step maps to **Collection-level** Processing Extension fields:
   - `processing:lineage` ← `description`
   - `processing:datetime` ← `date`
   - `processing:software` ← `{ <code.url basename>: code.version }`
2. The `source` step's `code.url` maps to `links[rel=processing-expression]` on
   the Collection. Include `cgiar-cdh:code_version` on the link.
3. The `source` step's `derived_from[].url` entries map to
   `links[rel=derived_from]` on the Collection.
4. Subsequent steps map to **Asset-level** Processing Extension fields on the
   assets that reference them in `processing_steps[]`. If the asset doesn't
   reference any subsequent step explicitly, the encoder MAY default to applying
   the latest step.
5. `derived_from[]` entries are always external URLs and map to
   `links[rel=derived_from]` at the appropriate level (Collection for the
   `source` step; Asset for subsequent steps when the URL is asset-specific).
   Inter-step references are not used.

## 8. Validation expectations

For STAC validation to pass:

- Every declared extension URI in `stac_extensions` MUST be valid and pinned.
- Every `cgiar-cdh:*` field MUST be defined in the CDH STAC Extension schema.
  Adding undefined `cgiar-cdh:*` fields will fail validation.
- File sizes, checksums, and projection codes SHOULD be present on assets that
  need them.
