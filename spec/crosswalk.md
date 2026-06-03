# CDH Metadata Crosswalk

Single-table view of how every CDH field maps to STAC and OGC API Records
(recordJSON). For requirement levels, rules, and field definitions, see
`standard.md`. For encoding-specific guidance, see `mapping-stac.md` and
`mapping-ogc-records.md`.

The `cgiar-cdh:` prefix denotes fields defined by the CDH STAC Extension and the
CDH OGC Records profile. Names, types, and allowed values are identical across
both encodings.

## Core

| CDH field              | Requirement         | STAC                                                                                                                                                             | OGC API Records (recordJSON)                                                                          |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                   | Required            | `id`                                                                                                                                                             | `id`                                                                                                  |
| `title`                | Required            | `title`                                                                                                                                                          | `properties.title`                                                                                    |
| `description`          | Required            | `description`                                                                                                                                                    | `properties.description`                                                                              |
| `created`              | Required            | `created`                                                                                                                                                        | `properties.created`                                                                                  |
| `updated`              | Required            | `updated`                                                                                                                                                        | `properties.updated`                                                                                  |
| `type` (resource)      | Required            | implied; optional `cgiar-cdh:resource_type` for cross-encoding consistency                                                                                       | `properties.type`                                                                                     |
| `cdh.domain`           | Required            | `cgiar-cdh:domain` (also expanded into Themes Extension `themes` under the CDH domain scheme)                                                                    | `properties["cgiar-cdh:domain"]` (also expanded into `properties.themes` under the CDH domain scheme) |
| `keywords`             | Required            | `keywords`; linked-keyword items (`{ term, scheme, uri }`) are additionally expanded into Themes Extension `themes` grouped by `scheme`                          | `properties.keywords`; linked items additionally expanded into `properties.themes`                    |
| `themes`               | Encoder output only | Themes Extension `themes` — generated from `cdh.domain`, `commodities`, `climate.hazards`, and linked-keyword entries. Not an author-facing input field. | `properties.themes` — same rules                                                                      |
| `license`              | Required            | `license`                                                                                                                                                        | `properties.license`                                                                                  |
| `license_holder`       | Required            | `providers[role=licensor]`                                                                                                                                       | `properties.contacts[role=licensor]`                                                                  |
| `contact`              | Required            | `providers`; Contacts Extension `contacts`                                                                                                                       | `properties.contacts`                                                                                 |
| `citation`             | Required            | Scientific Extension `sci:citation`                                                                                                                              | `properties["cgiar-cdh:citation"]`                                                                    |
| `doi`                  | Conditional         | Scientific Extension `sci:doi`; `links[rel=cite-as]`                                                                                                             | `links[rel=cite-as]`                                                                                  |
| `related_publications` | Optional            | Scientific Extension `sci:publications`                                                                                                                          | `properties["cgiar-cdh:related_publications"]`                                                        |
| `note`                 | Optional            | `cgiar-cdh:note`                                                                                                                                                 | `properties["cgiar-cdh:note"]`                                                                        |
| `version`              | Conditional         | Version Extension `version`                                                                                                                                      | `properties.version`                                                                                  |
| `previous_version`     | Conditional         | Version Extension `deprecated` / `links[rel=predecessor-version]`                                                                                                | `links[rel=predecessor-version]`                                                                      |
| `funding`              | Optional            | `cgiar-cdh:funding`                                                                                                                                              | `properties["cgiar-cdh:funding"]`                                                                     |

## Spatial / Temporal

| CDH field                          | Requirement                    | STAC                                                        | OGC API Records                               |
| ---------------------------------- | ------------------------------ | ----------------------------------------------------------- | --------------------------------------------- |
| `spatial.bbox`                     | STAC required; OGC conditional | Collection `extent.spatial.bbox`; Item `bbox`               | `geometry`; optionally `bbox`                 |
| `spatial.geography`                | Optional                       | `cgiar-cdh:geography`                                       | `properties["cgiar-cdh:geography"]`           |
| `spatial.crs`                      | Geospatial conditional         | Projection Extension `proj:code` / `proj:epsg`              | `properties["cgiar-cdh:crs"]`                 |
| `spatial.resolution`               | Gridded conditional            | `cgiar-cdh:spatial_resolution` (Collection or `summaries`)  | `properties["cgiar-cdh:spatial_resolution"]`  |
| `temporal.start_date` / `end_date` | STAC required; OGC conditional | Collection `extent.temporal.interval`; Item `datetime` etc. | `time` interval                               |
| `temporal.resolution`              | Temporal conditional           | `cgiar-cdh:temporal_resolution` (Collection or `summaries`) | `properties["cgiar-cdh:temporal_resolution"]` |

## Data fields

| CDH field                | Requirement            | STAC                                                                               | OGC API Records                       |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| `dimensions[]`           | Data conditional       | Datacube Extension `cube:dimensions`                                               | `properties["cgiar-cdh:dimensions"]`  |
| `variables[]`            | Data conditional       | Datacube Extension `cube:variables`; Raster Extension `raster:bands` for COG-style | `properties["cgiar-cdh:variables"]`   |
| `classes[]`              | Classified conditional | Classification Extension `classification:classes`                                  | `links[rel=describedby]` to sidecar   |
| `geography.column`       | Vector conditional     | Table Extension `table:primary_geometry`                                           | n/a (OGC Records is non-spatial path) |
| `geography.spatial_join` | Vector conditional     | `cgiar-cdh:spatial_join` (Collection, Item, or Asset)                              | n/a                                   |

## CDH-specific

| CDH field                     | Requirement                    | STAC                                                                                                                                                             | OGC API Records                                            |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `cdh.use_cases`               | Optional                       | `cgiar-cdh:use_cases`                                                                                                                                            | `properties["cgiar-cdh:use_cases"]`                        |
| `cdh.not_recommended_for`     | Optional                       | `cgiar-cdh:not_recommended_for`                                                                                                                                  | `properties["cgiar-cdh:not_recommended_for"]`              |
| `commodities`             | Agriculture conditional        | Encoded as `themes` entry under scheme `https://cgiar.org/cdh/vocab/commodity` (AGROVOC-resolved); also a `cube:dimensions` / `table:columns` axis if applicable | Encoded as `properties.themes` entry under the same scheme |
| `climate.mip_era`         | Climate conditional            | `cgiar-cdh:mip_era`                                                                                                                                              | `properties["cgiar-cdh:mip_era"]`                          |
| `climate.scenarios`       | Scenario conditional           | `summaries["cgiar-cdh:scenarios"]`; dimension/column if axis                                                                                                     | `properties["cgiar-cdh:scenarios"]`                        |
| `climate.models`          | Climate conditional            | `summaries["cgiar-cdh:models"]`                                                                                                                                  | `properties["cgiar-cdh:models"]`                           |
| `climate.hazards`         | Hazard conditional             | Encoded as `themes` entry under scheme `https://cgiar.org/cdh/vocab/hazard` (AGROVOC-resolved)                                                                   | Encoded as `properties.themes` entry under the same scheme |
| `climate.baseline`        | Anomaly/projection conditional | `cgiar-cdh:baseline`                                                                                                                                             | `properties["cgiar-cdh:baseline"]`                         |
| `climate.bias_adjustment` | Bias-adjusted conditional      | `cgiar-cdh:bias_adjustment`                                                                                                                                      | `properties["cgiar-cdh:bias_adjustment"]`                  |
| `climate.downscaling`     | Downscaled conditional         | `cgiar-cdh:downscaling`                                                                                                                                          | `properties["cgiar-cdh:downscaling"]`                      |

## Provenance / Processing

| CDH field                         | Requirement | STAC                                                                                                      | OGC API Records                                        |
| --------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `processing[].id = "source"`      | Recommended | Collection-level Processing Extension: `processing:lineage`, `processing:datetime`, `processing:software` | Same fields under `properties["cgiar-cdh:processing"]` |
| `processing[]` (subsequent)       | Conditional | Asset-level `processing:datetime`, `processing:lineage`                                                   | Appended to `properties["cgiar-cdh:processing"]`       |
| `processing[].code.url`           | Conditional | `links[rel=processing-expression]`                                                                        | `links[rel=processing-expression]`                     |
| `processing[].code.version`       | Conditional | Link `cgiar-cdh:code_version` field                                                                       | Link `cgiar-cdh:code_version` field                    |
| `processing[].derived_from[].url` | Conditional | `links[rel=derived_from]`                                                                                 | `links[rel=derived_from]`                              |

## Assets and Links

| CDH field              | Scope       | STAC                                                                 | OGC API Records                                |
| ---------------------- | ----------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| `data[].url` (primary) | Required    | `assets[*].href` with `roles` including `data`                       | `links[rel=enclosure]` or `links[rel=service]` |
| `data[].media_type`    | Recommended | `assets[*].type`                                                     | `links[*].type`                                |
| `data[].file_size`     | Recommended | File Extension `assets[*]["file:size"]`                              | `links[*].length`                              |
| `data[].nodata`        | Conditional | Datacube `cube:variables[*].nodata`; Raster `raster:bands[*].nodata` | `properties["cgiar-cdh:variables"][*].nodata`  |
| `additional_assets[]`  | Recommended | `assets[*]` with appropriate `roles`                                 | `links[*]` with appropriate `rel`              |
| `additional_links[]`   | Optional    | `links[*]`                                                           | `links[*]`                                     |

## Link relations used

`self`, `root`, `parent`, `child`, `collection`, `cite-as`, `describedby`,
`describes`, `about`, `via`, `canonical`, `alternate`, `derived_from`,
`enclosure`, `service`, `license`, `preview`, `icon`, `thumbnail`,
`processing-expression`, `predecessor-version`, `successor-version`.
