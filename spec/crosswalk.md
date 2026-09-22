# CDH Metadata Crosswalk

Single-table view of how CDH fields map to STAC and OGC API Records (recordJSON). This is designed
to be informative only; rules and field definitions live in `standard.md`, and a record is validated
against the schema, not against this table.

`cgiar-cdh:` fields in the STAC column are defined by the
[CDH STAC extension](./encodings/stac/schema.json); the OGC Records column awaits its profile
schema.

`N/A` means the field has no place in that encoding.

## Core

| CDH field               | Requirement    | STAC                                                                                                                                    | OGC API Records (recordJSON)                                                                          |
| ----------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `$schema`               | Required       | Authoring metadata only; not serialized                                                                                                 | Authoring metadata only; not serialized                                                               |
| `id`                    | Required       | `id`                                                                                                                                    | `id`                                                                                                  |
| `title`                 | Required       | `title`                                                                                                                                 | `properties.title`                                                                                    |
| `description`           | Required       | `description`                                                                                                                           | `properties.description`                                                                              |
| `created`               | Required       | `created`                                                                                                                               | `properties.created`                                                                                  |
| `updated`               | Required       | `updated`                                                                                                                               | `properties.updated`                                                                                  |
| `resource_type`         | Required       | implied; optional `cgiar-cdh:resource_type` for cross-encoding consistency                                                              | `properties.type`                                                                                     |
| `cdh.domain`            | Required       | `cgiar-cdh:domain` (also expanded into Themes Extension `themes` under the CDH domain scheme)                                           | `properties["cgiar-cdh:domain"]` (also expanded into `properties.themes` under the CDH domain scheme) |
| `keywords`              | Required       | `keywords`; linked-keyword items (`{ term, scheme, uri }`) are additionally expanded into Themes Extension `themes` grouped by `scheme` | `properties.keywords`; linked items additionally expanded into `properties.themes`                    |
| `themes`                | Derived output | Themes Extension `themes` - generated from `cdh.domain`, `commodities`, and linked-keyword entries. Not an author-facing input field.   | `properties.themes` - same rules                                                                      |
| `license`               | Required       | `license`                                                                                                                               | `properties.license`                                                                                  |
| `access`                | Optional       | `cgiar-cdh:access` (omit = `public`)                                                                                                    | `properties["dct:accessRights"]` (EU accessRights NAL; GeoDCAT)                                       |
| `access_note`           | Conditional    | `cgiar-cdh:access_note`; schema.org `conditionsOfAccess`                                                                                | `properties["cgiar-cdh:access_note"]`; schema.org `conditionsOfAccess`                                |
| `contact`               | Required       | `providers`; Contacts Extension `contacts`; at least one `licensor` contact maps to a `licensor` provider                               | `properties.contacts`; at least one contact with `licensor` in `roles`                                |
| `citation`              | Required       | Scientific Extension `sci:citation`                                                                                                     | `properties["cgiar-cdh:citation"]`                                                                    |
| `doi`                   | Conditional    | Scientific Extension `sci:doi`; `links[rel=cite-as]`                                                                                    | `links[rel=cite-as]`                                                                                  |
| `related_publications`  | Optional       | Scientific Extension `sci:publications`                                                                                                 | `properties["cgiar-cdh:related_publications"]`                                                        |
| `note`                  | Optional       | `cgiar-cdh:note`                                                                                                                        | `properties["cgiar-cdh:note"]`                                                                        |
| `version`               | Required       | Version Extension `version`; superseded releases get output id `<id>-<version>` so ids stay unique                                      | `properties.version`; same output id rule                                                             |
| `deprecated`            | Conditional    | Version Extension `deprecated`                                                                                                          | `properties["cgiar-cdh:deprecated"]`                                                                  |
| `previous_version`      | Conditional    | `links[rel=predecessor-version]`                                                                                                        | `links[rel=predecessor-version]`                                                                      |
| version chain (derived) | Derived output | Superseded records get `links[rel=successor-version]` and `links[rel=latest-version]`                                                   | Same links on superseded records                                                                      |
| `funding`               | Optional       | `cgiar-cdh:funding`                                                                                                                     | `properties["cgiar-cdh:funding"]`                                                                     |
| `series`                | Optional       | `cgiar-cdh:series`                                                                                                                      | `properties["dcat:inSeries"]` (DCAT 3 dataset series)                                                 |

## Spatial / Temporal

| CDH field                                   | Requirement                    | STAC                                                                                                          | OGC API Records                                                      |
| ------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `spatial.bbox`                              | STAC required                  | Collection `extent.spatial.bbox`; Item `bbox`                                                                 | N/A                                                                  |
| `spatial.geography[]`                       | Optional                       | `cgiar-cdh:geography` array                                                                                   | `properties["dct:spatial"]` (place IRIs; GeoDCAT)                    |
| `spatial.crs`                               | Geospatial conditional         | Projection Extension `proj:code` / `proj:epsg`                                                                | N/A                                                                  |
| `spatial.geometry_column`                   | Vector conditional             | Table Extension `table:primary_geometry`                                                                      | N/A                                                                  |
| `spatial.resolution[]`                      | Spatial-unit conditional       | Grid entries map to Datacube `cube:dimensions[].step`; full list also emits as `cgiar-cdh:spatial_resolution` | N/A                                                                  |
| `temporal.date` / `start_date` / `end_date` | STAC required; OGC conditional | `date`->`datetime`; `start_date`/`end_date`->`start_datetime`/`end_datetime`; open when `end_date: null`      | `time` (instant or interval)                                         |
| `temporal.update_frequency`                 | Optional                       | `cgiar-cdh:update_frequency`                                                                                  | `properties["dct:accrualPeriodicity"]` (EU frequency vocabulary URI) |

## Data fields

| CDH field      | Requirement            | STAC                                                                               | OGC API Records                      |
| -------------- | ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------ |
| `dimensions[]` | Data conditional       | Datacube Extension `cube:dimensions`                                               | `properties["cgiar-cdh:dimensions"]` |
| `variables[]`  | Data conditional       | Datacube Extension `cube:variables`; Raster Extension `raster:bands` for COG-style | `properties["cgiar-cdh:variables"]`  |
| `classes[]`    | Classified conditional | Classification Extension `classification:classes`                                  | `links[rel=describedby]` to sidecar  |

## CDH-specific

| CDH field                       | Requirement                    | STAC                                                                                                                                            | OGC API Records                                            |
| ------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `cdh.usage.intended_uses`       | Optional                       | `cgiar-cdh:intended_uses`                                                                                                                       | `properties["cgiar-cdh:intended_uses"]`                    |
| `cdh.usage.not_recommended_for` | Optional                       | `cgiar-cdh:not_recommended_for`                                                                                                                 | `properties["cgiar-cdh:not_recommended_for"]`              |
| `commodities`                   | Agriculture conditional        | Encoded as `themes` entry under scheme `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vocab/commodity.json` (AGROVOC-resolved) | Encoded as `properties.themes` entry under the same scheme |
| `climate.mip_era`               | Climate conditional            | `cgiar-cdh:mip_era`                                                                                                                             | `properties["cgiar-cdh:mip_era"]`                          |
| `climate.scenarios`             | Scenario conditional           | `summaries["cgiar-cdh:scenarios"]`; dimension/column if axis                                                                                    | `properties["cgiar-cdh:scenarios"]`                        |
| `climate.models`                | Climate conditional            | `summaries["cgiar-cdh:models"]`                                                                                                                 | `properties["cgiar-cdh:models"]`                           |
| `climate.baseline`              | Anomaly/projection conditional | `cgiar-cdh:baseline`                                                                                                                            | `properties["cgiar-cdh:baseline"]`                         |
| `climate.bias_adjustment`       | Bias-adjusted conditional      | `cgiar-cdh:bias_adjustment`                                                                                                                     | `properties["cgiar-cdh:bias_adjustment"]`                  |
| `climate.downscaling`           | Downscaled conditional         | `cgiar-cdh:downscaling`                                                                                                                         | `properties["cgiar-cdh:downscaling"]`                      |

## Provenance / Processing

| CDH field                             | Requirement                             | STAC                                                                                                      | OGC API Records                                        |
| ------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `processing[].id = "source"`          | Required when `processing[]` is present | Collection-level Processing Extension: `processing:lineage`, `processing:datetime`, `processing:software` | Same fields under `properties["cgiar-cdh:processing"]` |
| `processing[]` (subsequent)           | Conditional                             | Asset-level `processing:datetime`, `processing:lineage`                                                   | Appended to `properties["cgiar-cdh:processing"]`       |
| `processing[].code.url`               | Conditional                             | `links[rel=processing-expression]`                                                                        | `links[rel=processing-expression]`                     |
| `processing[].code.version`           | Conditional                             | Link `cgiar-cdh:code_version` field                                                                       | Link `cgiar-cdh:code_version` field                    |
| `processing[].derived_from[].url`     | Conditional                             | `links[rel=derived_from]`                                                                                 | `links[rel=derived_from]`                              |
| `processing[].derived_from[].version` | Conditional                             | Link `cgiar-cdh:source_version` field                                                                     | Link `cgiar-cdh:source_version` field                  |

## Assets and Links

| CDH field             | Scope       | STAC                                                                             | OGC API Records                                                                     |
| --------------------- | ----------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `data[].locations[]`  | Required    | `locations[0]` = `assets[*].href`; extras to Alternate Assets `alternate`        | `locations[0]` = `links[rel=enclosure]`/`service`; extras to `links[rel=alternate]` |
| `data[].media_type`   | Recommended | `assets[*].type`                                                                 | `links[*].type`                                                                     |
| `data[].file_size`    | Recommended | File Extension `assets[*]["file:size"]`                                          | `links[*].length`                                                                   |
| `data[].nodata`       | Conditional | Datacube `cube:variables[*].nodata`; Raster `raster:bands[*].nodata`             | `properties["cgiar-cdh:variables"][*].nodata`                                       |
| `variables[].nodata`  | Optional    | Datacube `cube:variables[*].nodata` for that variable; overrides the asset value | `properties["cgiar-cdh:variables"][*].nodata`                                       |
| `additional_assets[]` | Recommended | `assets[*]` with appropriate `roles`                                             | `links[*]` with appropriate `rel`                                                   |
| `additional_links[]`  | Optional    | `links[*]`                                                                       | `links[*]`                                                                          |

Each `data[].file_index[]` entry maps to a STAC asset with role `file_index` and to an OGC Records
`describedby` link, titled by its `format`. For a `cdh-inventory` entry, the
[file index rules](standard.md#file-indexes-file_index) supplies the concrete file URLs before the
asset/link mappings above apply. STAC uses the
[inventory asset mapping](mapping-stac.md#54-file-index-assets-file_index); OGC Records uses the
[file inventory mapping](mapping-ogc-records.md#54-file-inventories). The inventory URL is
supporting metadata, not a primary data file.

## Link relations used

`self`, `root`, `parent`, `child`, `collection`, `cite-as`, `describedby`, `describes`, `about`,
`via`, `canonical`, `alternate`, `derived_from`, `enclosure`, `service`, `license`, `preview`,
`icon`, `thumbnail`, `processing-expression`, `predecessor-version`, `successor-version`,
`latest-version`, `version-history`.
