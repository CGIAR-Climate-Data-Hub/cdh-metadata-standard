# Climate Data Hub Metadata Standard

Status: v0.3.0

This document defines the metadata model used by the Climate Data Hub - the field definitions,
requirement levels, and rules every Hub record conforms to. The model is self-contained and stands
on its own, independent of any output format. It is designed to be flexible and extensible for other
projects and programs. It is intend to map to commonly used community formats, namely:

- **STAC** - for geospatial data. See [`mapping-stac.md`](./mapping-stac.md).
- **OGC API Records** (recordJSON) - for everything else: non-spatial datasets, documents, software,
  services. See [`mapping-ogc-records.md`](./mapping-ogc-records.md).

For the field-level mapping to both formats, see [`crosswalk.md`](./crosswalk.md). Fillable YAML
templates live in [`templates/`](../templates/), including
[`full-standard.yaml`](../templates/full-standard.yaml).

For contributor-facing guidance, start in [`authoring-guide.md`](./authoring-guide.md).

> [!NOTE] For now, all metadata submissions must be in CDH YAML format which will be automatically
> converted to STAC or OGC API Records. In the future, there may be an option to directly submit
> STAC or OGC API Records.

## 1. Purpose

A Hub record exists to make a resource:

- **Discoverable** by humans, AI agents, and other tools.
- **Understandable** without opening the underlying files.
- **Citable** with a stable identifier and reference.
- **Validatable** against a schema.
- **Usable** without manual interpretation.

Free text helps, but structured facts belong in structured fields.

## 2. Versioning

The CDH metadata standard, schemas, controlled vocabularies, and extensions are versioned together.
A single git tag (`v<MAJOR>.<MINOR>.<PATCH>`) covers all of them. `cdh_schema_version` in input YAML
records matches the same tag.

For now, there is no independent extension version. This may change with increased use of the
extensions. Published URLs follow the pattern `<base>/<TAG>/...`.

## 3. Requirement Levels

The standard follows RFC 2119-style requirement levels.

| Level       | Meaning                                     |
| ----------- | ------------------------------------------- |
| Required    | Metadata is invalid without this field.     |
| Recommended | Strongly expected unless not applicable.    |
| Conditional | Required only for certain resource classes. |
| Optional    | Useful, but not required.                   |

The schema rejects blank values (`""`, `null`, empty required lists). Optional fields may be omitted
when unknown unless omission has a defined meaning. The only allowed `null` is an open-ended
`temporal` interval. Files under `templates/` validate in draft mode so blank placeholders do not
weaken the published schema.

## 4. Authoring Rules

### 4.1 Structured fields first

Each fact about the resource is recorded in the most structured place available, in this order:

1. **A core or CDH extension field** (section 5) when one fits.
2. **A linked sidecar metadata asset** (`rel=describedby`) for large, nested, or changing detail.
3. **A custom extension field** (see section 4.2) when no standard placement fits.
4. **Free-text inside `description`**, as a last resort, when the fact cannot be structured.

### 4.2 Extending the schema

CDH metadata is a generic core plus optional extensions. Validation has two layers:

- **Mechanism:** core plus exactly the extensions declared in `extensions[]`. Fields from undeclared
  extensions are rejected.
- **Profile:** policy rules on top. The CDH profile requires the `cdh` extension and composes the
  five CDH-maintained extensions: `cdh`, `climate`, `datacube`, `classification`, and `agriculture`
  (section 5.5).

A profile is applied by the catalog that validates a record; the record does not name it. The CDH
templates bind the CDH profile for editor hints in a `yaml-language-server` comment. A bundled copy
(`cdh.schema.bundled.json`) is published for validators that need a single schema file.

To carry metadata the standard does not yet cover:

1. Use a field from an existing CDH extension if one fits.
2. Add a field to a CDH extension when it is broadly useful. Update the schema, profile, crosswalk,
   and examples before use.
3. Author a new extension for project- or center-specific fields. Start from
   [`extensions/_template/`](extensions/_template/README.md); see [`extending.md`](./extending.md).

A new extension SHOULD nest fields under one top-level key named after the extension. The older
`datacube`, `classification`, and `agriculture` extensions keep their existing top-level fields.
Fields that outlive one project should move into a shared extension.

### 4.3 Description, note, and free text

Both `description` and `note` should be used to describe the resource itself. They should not be
used as catch-all fallbacks for any free form text.

- **`description` (required)** explains the resource.
- **`note` (optional)** is for caveats, warnings, or interpretation-critical remarks.

### 4.4 Domain vs keywords

`cdh.domain` and `keywords` serve different purposes.

- **`cdh.domain` (required, closed vocab)** - the CDH-controlled high-level classification used for
  structured browse, filtering, and grouping. Values come from `vocab/domain.json`. See the
  [CDH extension](extensions/cdh/README.md).
- **`keywords` (required, open)** - discovery terms for full-text search. Each entry is either a
  plain string OR a linked object `{ term, scheme, uri, description? }` pointing the term at an
  external vocabulary or ontology (e.g., AGROVOC, GEMET). Linked entries carry an ontology concept;
  plain strings are full-text only.

Decision rule:

- A value needed for filter / group-by / catalog browse -> `cdh.domain`.
- A value with an external ontology concept -> linked entry in `keywords`.
- A value useful only for full-text search -> plain string in `keywords`.

### 4.5 Sidecar metadata

Use sidecar files (linked with `rel=describedby`) for large, nested, or frequently changing content
such as long code lists, full [variable dictionaries](extensions/datacube/README.md), QA/QC outputs,
detailed table schemas, and detailed [classification legends](extensions/classification/README.md).

### 4.6 Author-supplied vs machine-derived

Every field a record can hold is either machine-derivable or directly authored. This implies who is
expected to provide each field.

| Tier                  | Supplied by                                 | Fields                                                                                                                                                                                  |
| --------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Machine-derivable** | Readable from the data itself               | `media_type` (assets and `file_index[]`), `file_size`, `spatial.bbox`, `spatial.crs`, `spatial.resolution`, `spatial.geometry_column`, `nodata`, `variables[].data_type`, table columns |
| **Authored**          | A person, always - no tool can supply these | `title`, `description`, `note`, `keywords`, `resource_type`, `license`, `access`, `contact`, `citation`, `series`, units, reading guidance, caveats, and every `cdh` field              |

Three rules govern how the tiers interact:

1. **An authored value always wins.** A value written by a person is never silently replaced by one
   read from the data. This holds even when the two disagree.
2. **Machine-derivable fields are never required of the author.** No machine-derivable field is
   listed as Required in section 5; leaving one out is not an omission. Authors SHOULD provide them
   when known, and MUST provide the ones needed to interpret the resource when the data cannot be
   read - embargoed or `access: restricted` resources, or a record authored before the data is
   uploaded. Otherwise they can be filled in the review process with the data.
3. **A disagreement is reported for review.** Where an authored value and the data disagree, the
   difference is reported for review. Neither value is changed automatically: the data may be wrong,
   the record may be wrong, and only a person can say which.

Values may be filled in at any time before publication - by the author, by review, or by a tool that
reads the data - but they are filled **into the record**. A published record is complete on its own
and never resolves descriptive field values from another record, a parent (section 4.8), or an
external file at read time. File enumeration through `file_index` is the explicit exception: the
file list may be external, while all field definitions remain in the record. See the
[File indexes](#file-indexes-file_index).

### 4.7 Versioning a resource

`id` names the resource across all of its releases. `version` names one release. Together they
identify one record, and `id` + `version` is what a citation or a derived record pins. A DOI, when
present, is the persistent identifier of that release; the Hub does not mint identifiers. The `id`
on its own always resolves to the current release, so every bare `id` reference (`parent`, a catalog
URL) follows the resource forward.

Use this rule when a resource changes:

- **Metadata fix or enrichment** (typo, better description, added contact) - update the existing
  record in place. `updated` reflects the revision.
- **Routinely extended time series** (e.g., a monthly-updated observation product) - same record;
  state `temporal.update_frequency`, and use an open-ended `temporal` interval only when this
  resource itself grows continuously. This is not a version.
- **Same values, new packaging** (new file format, chunking, or lossless compression) - update the
  existing record with the additional URLs and the processing code version. If any value changes, it
  is a revision.
- **Revision of the same product** (the publisher issues a new version: corrected or regenerated
  values, same reference period and scope, usually a new DOI; e.g. MapSPAM 2020 v2r0 to v2r2) - a
  new record with the same `id`. Copy the current record, set the new `version`, and point
  `previous_version` at the old record's `version`. Set `deprecated: true` on the old record. The
  old record now describes a superseded release: keep its data description as it was, but metadata
  fixes (broken link, typo) are still allowed.
- **New edition of a product line** (new reference year or generation with its own name, landing
  page, or DOI; e.g. MapSPAM 2010 to 2020, GLW3 to GLW4) - a distinct resource with its own `id`,
  grouped by `series`. Not a version. Follow the publisher's naming: what they call a version is a
  revision, what they give a new name is an edition.
- **Structural change or lossy transform** (dimension added or removed, resolution or extent change,
  aggregation, reclassification) - a distinct resource, not a version. Create a separate record
  linked through `processing[].derived_from`.

Author the chain backward only: each new record points at its predecessor. Version labels carry no
order; the chain does.

`previous_version` only points at Hub records. A predecessor that was never catalogued is
provenance, not a version chain - use `processing[].derived_from` or a `via` link. A resource
superseded by something outside the Hub can carry an `additional_links[]` entry with
`rel: successor-version`; a changelog can be linked with `rel: version-history`.

Superseding a record never rewrites other records. A child keeps its `parent` and follows the
resource to the new release. A derived record keeps its `processing[].derived_from` entry; the
`version` it recorded says which release it used.

### 4.8 Catalog hierarchy

A record's place in the catalog is stated by the record, not by where its file sits. A record with
no `parent` is a top-level entry. A record whose `parent` names another record's `id` is that
record's _child_. Directory layout in a repository is a filing convention with no catalog meaning:
the catalog has no nodes other than records.

Superseded releases (section 4.7) are linked by `previous_version`, never by `parent`. They belong
to the version chain, not the hierarchy. `parent` names an `id`, so a child always hangs under the
current release; children are not copied when a parent is superseded.

Rules:

- **`parent` determines links, never values.** Each record carries its own `license`, `contact`,
  `spatial`, `temporal`, and every other field it needs. Nothing is inherited from a parent, a
  child, or a sibling (section 4.6). `parent` states where the record sits in the catalog, and
  nothing else.
- **Nest a child only when it has no standing outside its parent.** An extraction, aggregation, or
  convenience representation of one product is a child: nobody looks for it without knowing the
  product. A resource with its own standing - its own DOI, its own funding, or inputs from several
  products - is a top-level record, linked by `processing[].derived_from`.
- **Nesting never implies derivation.** Where a child is derived from its parent, say so with
  `processing[].derived_from` (section 5.6), exactly as a top-level record would.
- **Nest families, not themes.** Cross-cutting groupings - a program or initiative (`series`), a
  subject area (`cdh.domain`) - are facets. They MUST NOT drive hierarchy, because their members are
  heterogeneous and each one has to stay individually listed and filterable. Do not create a record
  just to group others under it.
- One level of nesting is normally enough. Deeper trees SHOULD be justified by navigation, not by
  tidiness.
- **Validate the complete catalog before publication.** `id` + `version` MUST be unique, and exactly
  one record per `id` MUST be current (no `deprecated`). Every `parent` MUST resolve to exactly one
  current record, MUST NOT equal the child's own `id`, and MUST NOT create a cycle through other
  parents. Directory layout cannot supply or repair a missing parent.

Self-parenting can be checked from one record. Missing parents, duplicate releases, two current
records for one `id`, and cycles require the complete catalog, including records already published.
A record passing JSON Schema validation alone does not establish that its parent exists or that the
hierarchy is acyclic.

## 5. Field Reference

The fields below are defined by the core schema (`schemas/core.schema.json`) and the CDH extensions
(section 5.5, declared in `extensions[]`). For each field: **Requirement**, **Definition**,
**Expected value**, **Rules**, **Vocabulary** where applicable, and **Example**.

### 5.1 Record and core fields

#### `cdh_schema_version`

- **Requirement:** Required
- **Definition:** The version of the CDH standard this record targets.
- **Expected value:** The release tag, `v<MAJOR>.<MINOR>.<PATCH>` (see section 2).
- **Rules:**
  - The version segment of every CDH-hosted schema URL in `extensions[]` must match
    `cdh_schema_version`, so a record references one release throughout. Validators enforce this as
    a cross-field rule.
- **Example:** `v0.3.0`

#### `id`

- **Requirement:** Required
- **Definition:** A persistent identifier for the resource, shared by all of its releases.
- **Expected value:** Short, stable, URL-safe string.
- **Rules:**
  - `id` + `version` must be unique in the Hub catalog.
  - Must be lowercase.
  - Must not contain `/`, `:`, `?`, `#`, `&`, spaces, or other URL/path-reserved characters.
  - Should use hyphens, not underscores.
  - Should not change when the title changes.
  - Must not include the version. Every release of a resource carries the same `id`; `version` tells
    them apart. See section 4.7.
- **Example:** `spam2020`

#### `title`

- **Requirement:** Required
- **Definition:** Short, human-readable title for the resource.
- **Expected value:** Concise string.
- **Rules:**
  - Must clearly describe the resource.
  - Should not end with punctuation.
  - Should not include the file format unless central to the resource.
- **Example:** `Global Crop Yield 2020 v2`

#### `description`

- **Requirement:** Required
- **Definition:** Human-readable description of the resource.
- **Expected value:** One short paragraph.
- **Rules:**
  - Must say what the resource is and what it can be used for.
  - Should mention geography, time period, variables, scenarios, hazards, or commodities when
    relevant.
  - Should be understandable without opening the data files.
  - Should avoid unexplained acronyms.
  - Must not be a copy of the title.
  - Must not be the only place where filterable facts are stored.
  - Must not be a list of products that use the resource.

#### `note`

- **Requirement:** Optional
- **Definition:** Free-text caveats, warnings, or interpretation-critical remarks that a reader of
  `description` alone could miss.
- **Rules:**
  - Must not duplicate `description`.
  - Must not be used as a second free-form description.
  - Should be short and to the point.
  - Should be omitted when nothing important needs to be highlighted.
  - Use when there is a genuine caveat (e.g., known artifacts, steps needed before analysis,
    restricted geographic validity, sensitive aggregation behaviors).
  - Not a home for facts other fields hold: credit lines go in `attribution`, source provenance in
    `processing[].derived_from`, how an axis is labelled in that dimension's `description`.
  - Not a log of how the record or data was created, modified, licensed, etc.

#### `license`

- **Requirement:** Required
- **Definition:** Legal terms under which the resource may be used.
- **Expected value:** Valid SPDX license expression.
- **Vocabulary:** [SPDX License List](https://spdx.org/licenses/).
- **Rules:**
  - Use SPDX identifiers and expressions such as `CC-BY-4.0`, `CC0-1.0`, or `CC-BY-4.0 OR CC0-1.0`.
  - Custom licenses must use an SPDX `LicenseRef-*` expression and include an `additional_links[]`
    entry with `rel: license` and a URL for the license terms.
  - Data must be licensed to be included in the Hub.
  - Access restrictions are separate from license (see `access`).
  - Do not construct a LicenseRef-\* for assumed terms.
- **Examples:** `CC-BY-4.0`, `CC0-1.0`, `MIT`, `LicenseRef-CGIAR-Restricted`.

#### `attribution`

- **Requirement:** Optional
- **Definition:** Credit line reusers should reproduce: wording a license or upstream source
  requires, or the credit the producer asks for.
- **Expected value:** One short statement.
- **Rules:**
  - Quote required wording as the source states it.
  - Do not restate `citation`; a CC-BY license is satisfied by citing the record.
  - Omit when nothing beyond `citation` and `license` is asked of a reuser.
- **Example:** `Contains modified Copernicus Emergency Management Service information [year]`

#### `access`

- **Requirement:** Optional. Defaults to `public` when omitted.
- **Definition:** Access condition for the data, separate from reuse terms in `license`.
- **Vocabulary:** Closed set, aligned to the DCAT / EU accessRights vocabulary:
  - `public` - openly accessible; the data can be obtained directly.
  - `restricted` - discoverable, but obtaining the data requires a request or authentication (e.g.
    contact the producer, or credentialed/presigned access).
  - `non-public` - catalogued, but not available through public channels.
- **Rules:**
  - Omit (or set `public`) for openly accessible data.
  - An embargo (data not yet released) is `restricted`, not a separate value.
  - For `restricted` / `non-public`, provide `access_note`.
  - Use `additional_links[].rel: create-form` for access request forms and `rel: help` for access
    help pages or `mailto:` contacts.
- **Example:** `restricted`

#### `access_note`

- **Requirement:** Required when `access` is `restricted` or `non-public`.
- **Definition:** Human-readable access conditions or instructions, including embargo details,
  request steps, authentication requirements, or why the data is catalogued but unavailable.
- **Examples:**
  - `Embargoed until 2027-01-01. Contact the maintainer for early access.`
  - `Request access using the linked form. Approval is limited to research use.`

#### `resource_type`

- **Requirement:** Required
- **Definition:** Kind of resource the record describes.
- **Vocabulary:** Closed set defined in `vocab/resource_type.json`. Initial values are `dataset`,
  `software`, `service`, and `document`.
- **Rules:**
  - Should not replace asset media types.

#### `extensions[]`

- **Requirement:** Required. The CDH profile requires it to include the `cdh` extension.
- **Definition:** Pinned schema URLs of the extensions the record uses.
- **Rules:**
  - The record is validated against the core composed with exactly these extensions (see section
    4.2); fields from an undeclared extension are rejected.
  - The CDH template pre-lists the CDH-maintained extensions; authors rarely edit this by hand.

#### `keywords`

- **Requirement:** Required
- **Definition:** Search terms, optionally linked to an external vocabulary.
- **Expected value:** List of items. Each item is either:
  - a plain string (full-text discovery term), or
  - an object `{ term, scheme, uri, description? }` where:
    - `term` (required) - human-readable label,
    - `scheme` - resolvable URI of the source vocabulary/ontology (e.g., AGROVOC, GEMET),
    - `uri` - resolvable URI of the specific concept within `scheme`,
    - `description` - optional human-readable definition.
- **Rules:**
  - Include method names, acronyms, aliases, project terms, and other search phrases not already
    captured by structured fields.
  - Must not replace structured fields such as `resource_type`, `cdh.domain`, `commodities`,
    `climate.*`, `spatial.*`, `temporal.*`, or `variables[]`.
  - Do not duplicate structured values. Geography belongs in `spatial.geography`; commodities in
    [`commodities`](extensions/agriculture/README.md); scenarios, models, baselines, and MIP eras in
    [`climate.*`](extensions/climate/README.md); variables, bands, indicators, and columns in
    [`variables[]`](extensions/datacube/README.md).
  - Filter/group-by values belong in `cdh.domain`, not here. See section 4.4.
  - Should use consistent spelling and capitalization.
  - Linked items must include both `scheme` and `uri`; a `term`-only object is equivalent to a plain
    string.
  - Do not link entries to the
    `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vocab/*` schemes - those values
    belong in `cdh.domain` and `commodities`.

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

#### `created`, `updated`

- **Requirement:** Required
- **Definition:** Date the metadata record was created / last updated.
- **Expected value:** ISO 8601 / RFC 3339 date or datetime.
- **Rules:**
  - `updated` must be ≥ `created`.
  - Refers to the metadata record, not the underlying dataset.
  - Set a new `updated` date each time the record changes.

#### `version`, `previous_version`, `deprecated`

- **Requirement:** `version` is Recommended in the core schema and Required by the CDH profile.
  `previous_version` is required when the record supersedes an existing Hub record;
  `deprecated: true` is required on superseded releases.
- **Expected value:** Version label; `deprecated` is boolean.
- **Rules:**
  - Identify the resource release, not the metadata schema version.
  - Copy the source's own label when it has one (`v2r2`, `2.1`, `2020`). When the source does not
    version, or the resource is Hub-produced, count from `1`.
  - Labels are opaque. Never parse or sort them; order comes from the `previous_version` chain.
  - `previous_version` is the `version` of the predecessor record, which shares this record's `id`.
    See section 4.7.
  - `deprecated: true` marks a superseded release. Superseded records stay searchable so a cited
    release can be found, and are flagged as superseded wherever they are shown.
  - Show and cite `version` together with `id` on every release, including the first. A label only
    pins a release if people copy it before a second release exists.

#### `parent`

- **Requirement:** Optional. Required when the record is a child of another record.
- **Expected value:** The `id` of the parent record.
- **Rules:**
  - Must name an existing Hub record; resolves to its current release. Omit it on top-level records.
  - Must not equal this record's `id` or form a cycle. Resolve and validate parents against the
    complete catalog before publication (section 4.8).
  - Use it only for a representation that has no standing outside its parent; see section 4.8.
  - Not a provenance statement. A derived child still records `processing[].derived_from`.
  - Not a version pointer. Superseded releases use `previous_version`.

#### `series`

- **Requirement:** Optional
- **Expected value:** `{ name, url }`; `name` is required.
- **Rules:**
  - Groups records published under one program, initiative, or product brand (e.g., Africa
    Agriculture Adaptation Atlas, MapSPAM, GLW), independent of the version chain.
  - Members are heterogeneous anda one series may span domains, resolutions, and resource types - a
    program series can hold climate, population, and production datasets at once
  - Not a product family. Do not use `series` to group representations or releases of a single
    resource - a grid and its polygon aggregates, or one product at two resolutions. That
    relationship is expressed by where the records sit in the catalog (section 4.8), plus
    `processing[].derived_from` for the derivation itself.
  - `name` is the grouping key: use the exact same spelling on every record in the series.
  - `url` is the series landing page, when one exists.
  - A series is not a version chain (section 4.7) and not provenance (`processing[].derived_from`).
    Editions of a product line (MapSPAM 2010, MapSPAM 2020) are separate members of one series. A
    record derived from a series member belongs to its own series, if any.

### 5.2 Contact and Citation

#### `contact[]`

- **Requirement:** Required. At least one contact MUST list `licensor` in `roles`. The CDH profile
  also requires at least one `maintainer`.
- **Expected value:** List of objects with `name`, `roles`, `email`, `organization`, `url`.
- **Vocabulary for `roles`:** `licensor`, `producer`, `processor`, `point-of-contact`, and
  `maintainer`. The first three are STAC provider roles; `point-of-contact` and `maintainer` map to
  the Contacts extension instead. `roles` is an array, so one contact may hold several (e.g.,
  `[producer, licensor]`).
  - `point-of-contact`: the party who can be contacted for knowledge about or acquisition of the
    resource (ISO 19115). Questions and errors in the data go here.
  - `maintainer`: the party accountable for the record and any copy of the data the publishing
    catalog hosts (`schema:maintainer`). It keeps both current and passes data errors to the
    `point-of-contact`.
- **Rules:**
  - Must identify at least one responsible party.
  - Must identify at least one licensing party by including `licensor` in `roles`.
  - CDH records must identify at least one `maintainer`. An organization-level maintainer is
    allowed.
  - A `licensor` contact is the party that holds or administers the right to license the resource.
  - Each contact MUST include `roles` and `organization`.
  - Use `organization` on its own for organization-level contacts when no specific person should be
    named.
  - Use `name` plus `organization` for person-level contacts.
  - Email, URL, or org contact page when public.

#### `citation`

- **Requirement:** Required unless a `doi` is provided (a DOI resolves to full citation metadata).
- **Definition:** Structured citation for the resource.
- **Expected value:** Object with `authors` and `date` (both required), and optional `title`,
  `publisher`, `url`.
- **Rules:**
  - Cite the resource described by the record, not only a source dataset.
  - `authors` is an ordered list. Each entry is either a person, `{ family, given? }`, or an
    organization, `{ organization }`. The two forms may be mixed; citation order is preserved.
  - A person with a single name puts it in `family` and omits `given`. Multiple surnames all go in
    `family`.
  - `family`/`given` record which part of the name is which, not the order it is displayed in;
    citation styles decide display order.
  - `title` defaults to the record's top-level `title`; set it only when the cite-as title differs.
  - `publisher` holds the data publisher/repository for datasets, or the journal for articles.

#### `doi`

- **Requirement:** Conditional. Required when a DOI exists; a DOI also satisfies the citation
  requirement on its own.
- **Expected value:** Bare DOI (e.g. `10.7910/DVN/SWPENT`), not a URL.

#### `related_publications[]`

- **Requirement:** Optional
- **Expected value:** List of `{ citation, doi }`, where `citation` is the same structured object. A
  `doi` alone is sufficient for an entry.

#### `funding[]`

- **Requirement:** Optional
- **Expected value:** List of `{ name, url }`.

### 5.3 Spatial

Required when the resource has a geospatial footprint. `spatial.geography` (named places) applies to
any resource for broad discovery; `bbox`, `crs`, `resolution`, and `geometry_column` describe a
precise footprint.

#### `spatial.bbox`

- **Expected value:** A single bounding box, or a list of boxes, in WGS84 decimal degrees
  (EPSG:4326). Each box lists all axes of the southwesterly-most corner first, then all axes of the
  northeasterly-most corner:

  - 2D: `[west, south, east, north]` (= `[xmin, ymin, xmax, ymax]`).
  - 3D: `[west, south, min_z, east, north, max_z]` (= `[xmin, ymin, zmin, xmax, ymax, zmax]`);
    elevation in metres.

  Single-region datasets use a flat box, e.g. `[-180, -90, 180, 90]`. For **disjoint** coverage
  (separate areas with a large gap between them), pass a list of boxes (`[[...], [...]]`), each a
  real area covered, in any order. Do not include an overall/union box.

- **Rules:**
  - Coordinates MUST be in WGS84 regardless of `spatial.crs` (which describes the underlying assets,
    not the bbox).
  - Longitude is constrained to `[-180, 180]` and latitude to `[-90, 90]`; the schema rejects
    out-of-range values.
  - Bbox arrays MUST have length 4 or 6 - other lengths are rejected.
- **Authoring note:** Provide `spatial.bbox` when known, especially for multi-asset records or when
  the first asset is not representative; otherwise review may add it (see section 4.6).

##### Common-tool mappings

The order is (`xmin, ymin, xmax, ymax`), not the "min-min-max-max-per-axis" order produced by R's
`terra::ext()` or GDAL's `-projwin`. Translate carefully - see the tool-by-tool conversion table in
the [authoring guide](./authoring-guide.md#spatial).

##### Examples

```yaml
spatial:
  bbox: [-180.0, -90.0, 180.0, 90.0] # whole Earth, 2D
```

```yaml
spatial:
  bbox: [-180.0, -90.0, -1, 180.0, 90.0, 0] # whole Earth, -1m to 0m (i.e. soil data...)
```

```yaml
spatial:
  bbox: # disjoint coverage; no overall/union box
    - [5.9, 47.3, 15.0, 55.1] # Germany
    - [-75.6, -55.9, -66.4, -17.5] # Chile
```

#### `spatial.geography`

- **Requirement:** Optional
- **Definition:** Named geographies for broad discovery, browse, and filtering.
- **Expected value:** List of concept ids from `vocab/geography.json`.
- **Vocabulary:** `vocab/geography.json` - a controlled list generated from the UN M49 standard. It
  covers the full hierarchy (World, regions, sub-regions, intermediate regions, and countries). Each
  concept carries its M49 `code`, an `iso3` code (countries), `parents` (ancestor ids, for roll-up
  filtering), and LDC/LLDC/SIDS `groups`.
- **Rules:**
  - Must use the `id` from the `vocab/geography.json` vocabulary.
  - Complements `bbox`; one does not replace the other.
- **Examples:** `[world]`, `[sub-saharan-africa]`, `[kenya, uganda]`.

#### `spatial.crs`

- **Requirement:** Conditional. Required for geospatial STAC assets.
- **Expected value:** EPSG code (e.g., `EPSG:4326`), CRS URI, or PROJ string for custom CRS.
- **Vocabulary:** [EPSG codes](https://epsg.io/).
- **Authoring note:** Provide `spatial.crs` when known; otherwise review may add it (see section
  4.6).

#### `spatial.resolution`

- **Requirement:** Conditional. Required when the spatial unit or spacing is needed to interpret the
  data (e.g., regular grids, point observations, or polygon reporting units).
- **Expected value:** List of `{ type, value, unit, label, reference_system }`.
- **Rules:**
  - `type` is required, and is one of `xy`, `x`, `y`, `point`, or `polygon`.
  - **Exactly one spatial characterization per record:** either a single entry, or an `x` + `y` pair
    when grid spacing differs. No other combination is valid - a grid entry never sits beside a
    `point` / `polygon` entry.
  - Use `type: xy` for regular grids with the same x/y spacing.
  - A representation of the same data at a different spatial resolution (e.g. polygon aggregates
    extracted from a grid) is a **separate record** linked by `derived_from`, not a second entry
    here. Resolution is record-level, never per asset.
  - For grid entries (`xy`, `x`, `y`), `value` + `unit` describe grid spacing and map to STAC
    Datacube dimension `step` + `unit`.
  - For point or polygon entries, use `label` and `reference_system` to describe the observation
    locations or reporting units. `value` + `unit` may be used when a meaningful level exists, such
    as `value: 2`, `unit: admin-level`.
  - `label` is the human-readable form (e.g., `5 arc-minutes`, `Kenya counties`).

#### `spatial.geometry_column`

- **Requirement:** Conditional. For vector tables with an embedded geometry column.
- **Expected value:** Name of the geometry column.

### 5.4 Temporal

Required when the resource has temporal coverage. `temporal` records the coverage **extent only** -
temporal cadence is not stored here (see "Temporal cadence" below).

#### `temporal.date`, `temporal.start_date`, `temporal.end_date`

- **Expected value:** ISO 8601 at any precision - year (`2020`), month (`2020-06`), day
  (`2020-06-23`), or an instant (`2020-06-23T00:00:00Z`). Nothing looser is accepted.
- **Rules:**
  - Use `date` for a single instant or period, or `start_date` + `end_date` for a span. They are
    **mutually exclusive**:

    | Meaning                  | Fields                          |
    | ------------------------ | ------------------------------- |
    | Single instant or period | `date`                          |
    | Span                     | `start_date` + `end_date`       |
    | Open-ended series        | `start_date` + `end_date: null` |

  - **Precision states the granularity.** `date: 2020` is the whole year 2020 (a static reference
    year); `date: 2020-06-23T10:00:00Z` is an instant. To say "all of 2020" you write `2020`, not
    `2020-01-01`.
  - **A reduced-precision `end_date` is inclusive through the end of its period** (`end_date: 2010`
    means through 2010-12-31). Starts expand to the beginning of the period, which naive parsing
    already does; only ends need the end-of-period expansion.
  - **`end_date: null` means this resource itself is extended continuously.** A copy refreshed on a
    schedule states its real `end_date` and moves it at each refresh.

#### `temporal.update_frequency`

- **Requirement:** Optional. Recommended while the series is still growing.
- **Expected value:** One of `daily`, `weekly`, `monthly`, `quarterly`, `semiannual`, `annual`,
  `irregular`.
- **Rules:**
  - How often _this resource_ gains new data, not how often its source does. A Hub mirror refreshed
    once a year says `annual` even when the source publishes monthly; the source cadence is
    provenance (`processing[]`).
  - Not the data cadence: a daily series refreshed monthly has a daily `step` and a `monthly`
    `update_frequency`.
  - Omit it on a finished series.

#### Temporal cadence

Temporal cadence (daily, monthly, projection periods, ...) is **not** a `temporal` field. Express it
as a `type: temporal` dimension in the datacube extension, with an ISO 8601 `step` - one dimension
per temporal axis, and a record may have several (files split by year, each holding a day column).

A temporal dimension's values are ISO 8601 dates or instants. A binned axis lists each bin's start
and gives its length as the `step`, so 20-year projection windows are `values: ["2021", "2041"]`
with `step: P20Y`. A **cyclic** label axis - `DJF`/`MAM`/`JJA`/`SON` - is not temporal: it repeats
every year rather than running in one direction, so it is a domain axis named after what it varies,
and how long each label covers is stated in its `description`. This mirrors `spatial`: the
horizontal grid comes from `spatial`, and every other axis - time and domain - is a `dimensions[]`
entry. See the [datacube extension](extensions/datacube/README.md).

### 5.5 Extension fields

CDH extension fields are declared in `extensions[]` and validated with the core (see section 4.2).
Each extension is documented alongside its schema (linked below); all are optional except the `cdh`
extension, which the CDH profile requires (`cdh.domain`). Put values you filter or facet on in these
extension fields, not in `keywords` (see section 4.4).

| Extension                                             | Fields                                                 | Applies to                            |
| ----------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| [CDH](extensions/cdh/README.md)                       | `cdh.domain`, `cdh.usage`                              | all records (required by the profile) |
| [Climate](extensions/climate/README.md)               | `climate.*` - scenarios, models, baseline, downscaling | climate / CMIP / adaptation           |
| [Datacube](extensions/datacube/README.md)             | `dimensions[]`, `variables[]`                          | gridded / multidimensional / tabular  |
| [Classification](extensions/classification/README.md) | `classes[]`                                            | categorical / classified data         |
| [Agriculture](extensions/agriculture/README.md)       | `commodities[]`                                        | agriculture / food-systems / crops    |

### 5.6 Processing and Provenance

#### `processing[]`

- **Requirement:** Recommended - required for derived products.
- **Definition:** Ordered list of processing steps. When present, one step MUST use `id: source`.
- **Expected value per step:** `{ id, description, code: { url, version }, date, derived_from[] }`.
- **Rules:**
  - `id` must be unique within `processing[]`.
  - At least one step must use `id: source` whenever `processing[]` is present.
  - `derived_from[]` entries are `{ id, url, title, version }` references to the data used. A Hub
    record is named by its `id`, which MUST resolve to exactly one catalog record; any other source
    by its `url`. An entry has one or the other, not both. Record `version` whenever the source is
    versioned, as the source labels it; for a Hub record that is its `version`. `url` may then point
    at the source's landing page even when that URL tracks the latest release. Step order is the
    array order; asset-specific chains use `data[].processing_steps[]`.
  - `date` is ISO 8601 / RFC 3339.
  - Put `source` first unless the processing order requires otherwise.

### 5.7 Assets and Links

#### `data[]`

- **Requirement:** Required - at least one entry.
- **Expected value per entry:**
  `{ name, locations, description, media_type, file_size, nodata, processing_steps, structures, href_template, file_index, spatial }`.
- **Vocabulary:** `media_type` must be an
  [IANA media type](https://www.iana.org/assignments/media-types/) (e.g.,
  `application/vnd.zarr; version=3`, `image/tiff; application=geotiff; profile=cloud-optimized`).
- **`locations[]`:** Access location(s) for the asset. Required, unless the entry has a `file_index`
  whose formats carry their own file locations (any format but `cdh-inventory`); then Recommended
  when the files share a prefix, since a prefix is listable and is what a bucket policy or mirror
  points at. Omit it only when the files genuinely share none. Each entry is `{ url, title? }`,
  where `title` is an optional access label describing the access path (e.g., `HTTPS`, `S3`), not
  the content.
  - The first entry is canonical.
  - `url` MUST be an absolute URL. Data never lives beside the record.
  - `url` MUST be machine-actionable: a data file, a store or directory prefix (with
    `href_template`, a `file_index`, or a Zarr-family root), a service endpoint that returns the
    data, or for software the repository or tool URL. A landing page, DOI, Zenodo or Dataverse
    record, or documentation page is not a location; use `citation.url`, `doi`, or
    `additional_links[]`. Only when the data has no URL of its own (`access: restricted`, including
    embargoes) may `url` be the page where access is requested or the data will be released, such as
    an embargoed Dataverse record, and `access_note` MUST say so.
  - List more than one entry only when the additional entries point at the same content via a
    different access path (e.g., an HTTPS and an S3 URL for the same file). All `locations[]` share
    the asset's `media_type`, `file_size`, and `nodata`.
  - Different content, formats, or services are separate `data[]` / `additional_assets[]` entries.
- **`href_template` (optional):** Use when one dataset is split into many files along its dimensions
  (e.g., one COG per crop, production system, and variable). Each `locations[].url` becomes a base
  path with the template appended. Each `{token}` must match a `dimensions[].name`, or be the
  reserved `{variable}` token for files split per variable (`variable` is therefore not allowed as a
  dimension name). `{variable}` expands over the variables the entry holds. With `structures[]`,
  each other token must be a dimension of every structure the entry holds. The entry describes one
  file per combination of the tokens' values. Values are substituted verbatim; every combination is
  assumed to exist. When some combinations do not exist, list the files in a `file_index` instead. A
  token on a `type: temporal` dimension may carry a strftime format, `{date:%Y.%m.%d}`, when the
  file name spells the date differently from the ISO 8601 value. Only `%Y`, `%m`, `%d`, `%H`, `%M`,
  and `%j` are allowed; a token may repeat with different formats
  (`year={date:%Y}/{date:%Y%m%d}.tif`). A format may not be finer than the axis values are written
  (a year axis takes only `%Y`) and must spell every value distinctly. Names the directives cannot
  spell use `file_index`. Omit it for a single file. On a templated entry, `file_size` describes
  **one file**, not the set; where slices differ materially in size, omit it rather than averaging.
  See the [authoring guide](./authoring-guide.md#how-to-handle-many-files-with-href_template).
- **`file_index` (optional):** Use instead of `href_template` when the files do not follow a regular
  pattern, or when there are too many to open one by one. A list of
  `{ format, locations, title, media_type }` indexes that list or open this entry's files as one
  dataset. An index opens files this entry already holds; a store that carries its own data is a
  `data[]` entry, not an index. `cdh-inventory` may appear once. The index is the one part of a
  record that may live outside it; every field definition stays in the record. Mutually exclusive
  with `href_template`. Formats and rules: [File indexes](#file-indexes-file_index).
- **`structures` (conditional):** Names of the `structures[]` this asset holds (datacube extension).
  Required on every asset when the record declares `structures[]`; omitted otherwise. An asset holds
  the dimensions and variables of its structures; in a record without `structures[]`, every asset
  holds every declared one. Authors or inspection tools MUST verify structure membership before
  publication.
- **`spatial` (optional):** `{ bbox, geography }` covering this asset alone, for selecting files by
  area. Same shapes as the top-level `spatial`. Omit when unknown; the top-level bbox is not copied
  down to assets.
- **Rules:**
  - `name` is required and must be unique across `data[]` and `additional_assets[]`.
  - `locations[].url` should be stable, and points at the data even when access is restricted; the
    URL may require credentials. Request forms and instructions go in `access_note` and
    `additional_links[]`.
  - Provide `media_type` and `file_size` when known; otherwise review may add them (see section
    4.6).
  - `processing_steps` references `processing[].id` values.

#### File indexes (`file_index[]`)

Each entry names one index file and the specification it follows. Its `locations[]` are that file at
several addresses; an index whose internal paths use a different scheme is a separate entry. No
format is required and any one is a complete index. Only `cdh-inventory` is validated by CDH; the
others are trusted to their own specifications. An index may live anywhere; the entry's
`locations[]` describe the files, not the index.

| `format`          | Specification                                                                                           | Internal paths resolve against              | Opened by                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| `stac-geoparquet` | [stac-geoparquet](https://github.com/stac-utils/stac-geoparquet/blob/main/spec/stac-geoparquet-spec.md) | As written in the item assets               | STAC clients, DuckDB, GDAL   |
| `gti`             | [GDAL Tile Index](https://gdal.org/en/stable/drivers/raster/gti.html)                                   | The index file's own location               | GDAL, QGIS, rasterio         |
| `vrt`             | [GDAL VRT](https://gdal.org/en/stable/drivers/raster/vrt.html)                                          | The index file's own location               | GDAL, QGIS, rasterio         |
| `kerchunk`        | [kerchunk](https://fsspec.github.io/kerchunk/spec.html)                                                 | As written in the references                | xarray via fsspec            |
| `icechunk`        | [Icechunk](https://icechunk.io/) with virtual chunks                                                    | As written; containers within `locations[]` | xarray via icechunk          |
| `cdh-inventory`   | Below                                                                                                   | Every `locations[].url`                     | CDH validation, spreadsheets |

Prefer `stac-geoparquet` for large tiled products. An Icechunk or Zarr store that holds its own
chunks is a `data[]` entry, not an index. For `kerchunk` and `icechunk` the location may be a
directory prefix; omit `media_type` then.

**`cdh-inventory`** is a CSV (RFC 4180, UTF-8, header row) or a Parquet file with the same columns,
one row per file:

- `href` - required. A relative reference (RFC 3986) resolved against every `locations[].url`, each
  of which MUST be a directory ending in `/`. Must stay beneath the base; no duplicates.
- One column per declared `dimensions[].name` - that file's coordinate on the axis. A cell MUST
  equal a declared value exactly as written in the record, or a valid ISO 8601 date on a temporal
  axis. Include a column for every dimension the entry holds.
- `variable` - the single declared variable the file holds, when files are split per variable. Must
  be one the entry holds.
- `checksum` - optional. The file's digest as `<algorithm>:<hex>`, e.g. `md5:9e107d9d…` or
  `sha256:…`. One algorithm per inventory; a producer's `md5sum` listing joins in directly.

No other columns. Rows list files that exist; nothing is inferred. Use an immutable,
version-specific inventory URL for a release.

#### `additional_assets[]`

- **Requirement:** Recommended
- **Definition:** Non-primary assets (QA/QC, code lists, schemas, thumbnails, alternate formats,
  additional metadata files).
- **Expected value per entry:** `{ name, locations, description, media_type, roles, file_size }`.
- **`locations[]`:** Same shape and rules as `data[].locations` - required, at least one entry;
  first is canonical; multiple entries only for the same content via a different access path - with
  one difference: `url` MAY be a path relative to the record file (`./README.md`,
  `docs/legend.csv`). Use this only for a small, versioned metadata file committed beside the
  record. The file MUST exist at that path, and whoever publishes the record publishes the file with
  it, so the path resolves the same way from the published record.
- **Vocabulary for `roles`:** Suggested, not closed - `metadata`, `validation`, `describedby`,
  `agents`, `thumbnail`, `overview`, `visual`, `example`. Use `example` for a runnable usage example
  (a notebook, script, or SQL file), which is the place for a query a consumer needs but the data
  cannot carry - a required join, or a non-obvious column meaning.
- **Documentation files (optional):** A record MAY carry a human-readable README
  (`roles: [describedby]`, `media_type: text/markdown`) and a guide for AI agents and analysts
  (`roles: [agents]`, same media type). The agent guide holds what no structured field can: the
  stable key and join columns, quirks and caveats, what the coordinate system implies for distance
  and area, and tested queries. Leave out what the record already states. `agents` is not an IANA
  relation or a standard STAC role; it follows the Portolan convention, the only one in use for this
  purpose.
- **Rules:** Same as `data[]`, except the relative-path allowance above.

#### `additional_links[]`

- **Requirement:** Optional
- **Expected value per entry:** `{ name, rel, url, description }`.
- **Vocabulary for `rel`:** See section 6.

## 6. Link Relations

| rel                                             | Use                                       | Source               |
| ----------------------------------------------- | ----------------------------------------- | -------------------- |
| `self`, `root`, `parent`, `child`, `collection` | Catalog navigation                        | IANA / STAC / OGC    |
| `cite-as`                                       | Preferred citation target (DOI)           | IANA                 |
| `license`                                       | License terms for the resource            | IANA / STAC          |
| `describedby` / `describes`                     | Documentation, schema, code list          | IANA                 |
| `about`                                         | Project or explanatory page               | IANA                 |
| `create-form`                                   | Form for requesting access or submission  | IANA                 |
| `help`                                          | Access help page or contact               | IANA                 |
| `via`                                           | Intermediate source                       | IANA                 |
| `canonical`                                     | Authoritative URL (when this is a mirror) | IANA                 |
| `alternate`                                     | Alternate representation                  | IANA                 |
| `derived_from`                                  | Source dataset                            | STAC                 |
| `predecessor-version` / `successor-version`     | Version chain (successor side is derived) | IANA                 |
| `latest-version`                                | Current version (derived, on superseded)  | IANA                 |
| `version-history`                               | Changelog or version history document     | IANA                 |
| `enclosure`                                     | Downloadable file (OGC Records)           | IANA                 |
| `service`                                       | Service endpoint                          | IANA                 |
| `license`                                       | License document                          | IANA                 |
| `preview` / `icon` / `thumbnail`                | Imagery                                   | IANA / STAC          |
| `processing-expression`                         | Code or workflow that produced the data   | STAC Processing Ext. |

Catalog navigation and version-chain relations follow from `parent` (section 4.8) and
`previous_version` (section 4.7). Do not repeat them in `additional_links[]`.

## 7. Controlled Vocabularies Summary

| Field                                                         | Vocabulary                                                                                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `license`                                                     | SPDX License List                                                                                                                                                        |
| dates (`created`, `updated`, `temporal.*`, `processing.date`) | ISO 8601 / RFC 3339                                                                                                                                                      |
| `spatial.crs`                                                 | EPSG codes                                                                                                                                                               |
| `spatial.geography`                                           | `vocab/geography.json` (UN M49; regions + countries)                                                                                                                     |
| `variables[].unit`, grid `spatial.resolution[].unit`          | Unit of measurement, preferably UDUNITS-2 or UCUM (not strictly validated); non-grid spatial units may use clear labels such as `admin-level`                            |
| `variables[].name` (climate)                                  | CF Standard Names (where practical)                                                                                                                                      |
| `contact[].roles[]`                                           | `licensor`, `producer`, `processor` (STAC provider roles), `point-of-contact`, `maintainer` (Contacts extension)                                                         |
| `media_type`                                                  | IANA media types                                                                                                                                                         |
| `resource_type`                                               | `vocab/resource_type.json`                                                                                                                                               |
| `cdh.domain`                                                  | `vocab/domain.json` (CDH closed set)                                                                                                                                     |
| `keywords[].scheme` (linked items)                            | Open - any resolvable controlled-vocabulary URI (e.g., AGROVOC, GEMET). Do not link entries to `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vocab/*`. |
| `commodities`                                                 | `vocab/commodity.json` (AGROVOC-mapped)                                                                                                                                  |
| `climate.mip_era`                                             | `CMIP5`, `CMIP6` (informal)                                                                                                                                              |
| `climate.scenarios`                                           | SSP / RCP labels, `historic` (informal)                                                                                                                                  |
| `climate.models`                                              | CMIP source IDs (informal)                                                                                                                                               |
