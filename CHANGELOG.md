# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the project is pre-1.0, the schema should be considered unstable and breaking changes may
occur between minor versions.

## [Unreleased]

## [0.1.0] - 2026-06-24

### Changed

- **Breaking:** `contact[].role` (single string) is now `contact[].roles[]` (an array), aligning
  with STAC `providers[].roles` and OGC Records `contacts[].roles`. A contact may hold several
  roles, e.g. `roles: [producer, licensor]`. The role vocabulary dropped `host` and added
  `point-of-contact` (which maps to the Contacts extension, not `providers`).
- **Breaking:** `citation` is now a structured object
  (`{ authors, date, title?, publisher?, url? }`) instead of a plain string, and
  `related_publications[].citation` uses the same shape. `citation` is required unless a `doi` is
  provided.
- Relaxed the `unit` requirement from strict UDUNITS-2 to "preferably UDUNITS-2 or UCUM," allowing
  annotated units such as `{head}/km2`.
- **Breaking:** `doi` (and `related_publications[].doi`) must now be a bare DOI (e.g.
  `10.7910/DVN/SWPENT`); URL forms like `https://doi.org/…` are rejected.
- `spatial.bbox` now also accepts a single box `[west, south, east, north]`, not only an array of
  boxes.

### Added

- Date fields document the expected format via descriptions and examples (`YYYY-MM-DD` or RFC 3339
  date-time).
- Field `description`s (and a few `examples`) added across the core schema and all extensions for
  in-editor hints; `media_type` suggests common values.

## \[0.0.2] - 2026-06-22 \[YANKED]

> Published as a pre-release, then withdrawn due to a bug/typo that published the schemas to the
> wrong path, so the versioned schema URLs returned 404. Superseded by 0.1.0.

### Changed

- Restructured the schema into a small `core` plus opt-in extensions (`cdh`, `climate`, `datacube`,
  `classification`, `agriculture`). Records declare the extensions they use and validate against a
  composed profile; fields from undeclared extensions are rejected.
- `resource_type` now uses schema.org types instead of COAR.

### Added

- `href_template` on `data[]` entries, to expand one entry into many items.
- Crop and livestock roots (and GLW4 crops) in the commodity vocabulary.

### Removed

- `encoding` field.
- `climate.hazards` field and its vocabulary.
- `themes` from the authoring spec (it is encoder output only).

## [0.0.1] - 2026-06-03

### Added

- Initial prototype of the core metadata specification, controlled vocabularies, and supporting
  build scripts.

[Unreleased]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/releases/tag/v0.0.1
