# CDH → OGC API Records Mapping

Status: draft

This document specifies how a CDH metadata input record (as defined by
`standard.md` and validated by `schemas/metadata-input.schema.json`) is encoded
as an **OGC API Records** record using the **recordJSON** schema
(`https://schemas.opengis.net/ogcapi/records/part1/1.0/openapi/schemas/recordJSON.yaml`).

Field definitions and requirement levels are authoritative in `standard.md`;
this document is authoritative for **placement**.

## 1. When to use OGC API Records

Use OGC API Records when the resource is discoverable but is not naturally
modeled as STAC. Typical cases:

- Documents and reports
- Code repositories
- Models, notebooks, methods, protocols
- Dashboards, services, APIs
- Knowledge products
- Non-spatiotemporal tabular datasets

The `encoding` field in the input record is authoritative for routing. Set
`encoding: ogc-records` to use this mapping.

## 2. Record encoding

The CDH OGC Records profile uses the **recordJSON** encoding, not GeoJSON
Features. A record is a plain JSON object with:

- top-level identification fields (`id`, `type`, `time`, `geometry`, `links`)
- a `properties` object for descriptive metadata
- a `links` array for access points, citation targets, and related resources

For typical OGC Records use in CDH (non-spatial resources):

- Set `geometry` to `null`. Do not invent a spatial extent.
- Omit `time` unless the resource has temporal relevance.

## 3. Native-fields-first rule

Each field MUST be encoded in the most standard place available, in this order:

1. recordJSON top-level field (`id`, `type`, `time`, `geometry`, `links`)
2. recordJSON `properties.*` core property (`title`, `description`, `keywords`,
   `themes`, `contacts`, `license`, `created`, `updated`, `version`,
   `resourceLanguages`)
3. An approved `properties["cgiar-cdh:*"]` field
4. A sidecar metadata link with `rel=describedby`
5. Free-text `description` or `properties["cgiar-cdh:note"]`

`cgiar-cdh:*` property names, value types, and controlled vocabularies are
identical to the STAC profile.

## 4. Field-by-field placement

### 4.1 Core

| CDH                         | recordJSON placement                                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | `id`                                                                                                                                                                                          |
| `type` (resource)           | `properties.type`                                                                                                                                                                             |
| `title`                     | `properties.title`                                                                                                                                                                            |
| `description`               | `properties.description`                                                                                                                                                                      |
| `created` / `updated`       | `properties.created` / `properties.updated`                                                                                                                                                   |
| `keywords`                  | `properties.keywords`                                                                                                                                                                         |
| `cdh.domain[]`              | `properties["cgiar-cdh:domain"]`; also expanded into `properties.themes` under the CDH domain scheme. First entry is the primary domain.                                                      |
| `keywords[]` (linked items) | Each linked-keyword entry (`{ term, scheme, uri }`) is also emitted as a `properties.themes` concept, grouped by `scheme`. Plain-string keywords are emitted only into `properties.keywords`. |
| `properties.themes`         | Encoder output only — populated from `cdh.domain`, `commodities`, `climate.hazards`, and any linked-keyword entries. Not an author-facing input field.                                        |
| `license`                   | `properties.license`                                                                                                                                                                          |
| `contact[]`                 | `properties.contacts[]`. At least one contact must use `role=licensor`.                                                                                                                       |
| `citation`                  | `properties["cgiar-cdh:citation"]` (plain text)                                                                                                                                               |
| `doi`                       | `links[rel=cite-as]`                                                                                                                                                                          |
| `related_publications[]`    | `properties["cgiar-cdh:related_publications"]`                                                                                                                                                |
| `note`                      | `properties["cgiar-cdh:note"]`                                                                                                                                                                |
| `version`                   | `properties.version`                                                                                                                                                                          |
| `previous_version`          | `links[rel=predecessor-version]`                                                                                                                                                              |
| `funding[]`                 | `properties["cgiar-cdh:funding"]`                                                                                                                                                             |

### 4.2 Spatial / Temporal (when applicable)

OGC Records is the non-spatial encoding path in CDH. Use these fields only when
the resource genuinely has spatial or temporal relevance.

| CDH                                | recordJSON placement                                               |
| ---------------------------------- | ------------------------------------------------------------------ |
| `spatial.bbox`                     | `geometry` (and optionally `bbox`)                                 |
| `spatial.geography`                | `properties["cgiar-cdh:geography"]`                                |
| `spatial.crs`                      | `properties["cgiar-cdh:crs"]`                                      |
| `spatial.geometry_column`          | `properties["cgiar-cdh:geometry_column"]` when needed              |
| `spatial.resolution[]`             | `properties["cgiar-cdh:spatial_resolution"]`                       |
| `temporal.start_date` / `end_date` | `time` (interval form `{ interval: [start, end] }` per recordJSON) |
| `temporal.resolution`              | `properties["cgiar-cdh:temporal_resolution"]`                      |

### 4.3 Data fields

For most OGC Records resources, structured field metadata is not needed. When it
is (e.g., a tabular dataset surfaced via OGC Records rather than STAC):

| CDH            | recordJSON placement                                                        |
| -------------- | --------------------------------------------------------------------------- |
| `dimensions[]` | `properties["cgiar-cdh:dimensions"]`                                        |
| `variables[]`  | `properties["cgiar-cdh:variables"]` and/or `links[rel=describedby]` sidecar |
| `classes[]`    | `links[rel=describedby]` to a sidecar class list                            |

`spatial.geometry_column` is generally only useful for spatial tabular/vector
records. For most non-spatial OGC Records resources, omit it.

### 4.4 CDH-specific fields

The `cdh.*`, `climate.*`, and `commodities` fields in the input record are
encoded under `properties["cgiar-cdh:*"]`, **except** for `commodities` and
`climate.hazards`, which are expanded into `properties.themes` entries by
the encoder using the CDH commodity and CDH hazard JSON lookups (see core
standard sections 5.1 and 5.6). Field names, value types, and controlled vocabularies
otherwise match the STAC profile exactly. OGC Records has no equivalent of STAC
`summaries`; faceted values that would be in STAC summaries appear as direct
array properties.

## 5. Links

OGC API Records uses `links` for access, citation targets, services, related
resources, documentation, and provenance.

### 5.1 Link relations

| rel                                         | Use                                          |
| ------------------------------------------- | -------------------------------------------- |
| `self`                                      | This record                                  |
| `collection`                                | Parent record collection                     |
| `cite-as`                                   | DOI or preferred citation target             |
| `describes` / `describedby`                 | Described resource / documentation or schema |
| `enclosure`                                 | Downloadable file                            |
| `service`                                   | Service endpoint                             |
| `derived_from`                              | Source dataset                               |
| `predecessor-version` / `successor-version` | Version chain                                |
| `about`                                     | Project page or explanatory site             |
| `via`                                       | Intermediate source                          |
| `canonical`                                 | Authoritative URL                            |
| `alternate`                                 | Alternate representation                     |
| `license`                                   | License document                             |
| `processing-expression`                     | Code or workflow that produced the resource  |
| `preview` / `icon`                          | Imagery                                      |

### 5.2 File metadata on links

For OGC Records, file-level metadata lives on the link, not as top-level record
metadata:

| CDH                    | recordJSON placement                                    |
| ---------------------- | ------------------------------------------------------- |
| `data[].locations[].url` | `links[*].href`                                       |
| `data[].locations[].title` | `links[*].title` (access label)                     |
| `data[].name`          | `links[*].title`                                        |
| `data[].media_type`    | `links[*].type`                                         |
| `data[].file_size`     | `links[*].length`                                       |
| `data[].description`   | `links[*].title` / `description` extension if supported |

OGC Records uses a native `links[]` array, so multiple access paths need no
extension (unlike STAC): each `locations[]` entry becomes its own link. The
canonical entry (`locations[0]`) takes the primary relation
(`rel=enclosure` / `rel=service`, per section 5.3); each additional same-content
location is emitted as `rel=alternate` with the shared `type` and a `title` from
`locations[].title`. The asset-level `media_type` and `file_size` are repeated
on each generated link.

There is no universal OGC Records equivalent to `file:checksum`. If a checksum
is required, link to a sidecar checksum manifest with `rel=describedby` or use
an approved CDH link-level field `cgiar-cdh:checksum`.

### 5.3 Primary data link

The required CDH `data[]` entries map to `links[rel=enclosure]` for downloadable
files, or `links[rel=service]` for service endpoints (using the canonical
`locations[0]`). If the resource is a landing page, code repository, dashboard,
or model, use `rel=about`, `rel=code` (`processing-expression` for workflow
code), or the most appropriate relation from section 5.1.

## 6. Processing and provenance

OGC API Records has no native processing model. The CDH `processing[]` block
maps to a structured CDH property plus standard links.

Encoding rules:

1. The full `processing[]` array, in order, is emitted as
   `properties["cgiar-cdh:processing"]`. The schema mirrors the YAML.
2. The `source` step's `code.url` maps to `links[rel=processing-expression]` on
   the record. Include `cgiar-cdh:code_version` as a link extra field.
3. Each step's `derived_from[].url` entries (always external URLs) map to
   `links[rel=derived_from]` on the record.
4. Per-asset processing chains live in the corresponding link's
   `cgiar-cdh:processing_steps` extra field (mirroring
   `data[].processing_steps[]` in the YAML).

## 7. Validation expectations

- Records MUST validate against the OGC API Records Part 1 recordJSON schema.
- `cgiar-cdh:*` properties under `properties` MUST conform to the CDH OGC
  Records profile schema.
- Records describing non-spatial resources MUST set `geometry: null` and MUST
  NOT include a fabricated `bbox`.
