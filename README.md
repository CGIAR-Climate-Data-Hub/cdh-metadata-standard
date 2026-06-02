# Climate Data Hub Metadata Standard

This repository defines the Climate Data Hub metadata standard and input
template. The goal is lightweight, searchable, AI-readable metadata that can be
validated and serialized to STAC or OGC API Records.

> [!WARNING]
> This standard is still a draft. Breaking changes are expected while it is
> being tested and refined.

## Start Here

- [Authoring guide](./spec/authoring-guide.md) - how to fill out metadata
  without getting overwhelmed by optional fields.
- [YAML template](./spec/standard.yaml) - the metadata input template.
- [Metadata input schema](./spec/schemas/metadata-input.schema.json) - validates
  the YAML structure and controlled values.
- [Core standard](./spec/core-standard.md) - formal field definitions and
  validation expectations.

## Mappings

- [Crosswalk](./spec/crosswalk.md) - CDH fields mapped to STAC and OGC API
  Records.
- [STAC mapping](./spec/mapping-stac.md)
- [OGC API Records mapping](./spec/mapping-ogc-records.md)

## Vocabularies

Controlled vocabularies live in [vocab/](./vocab):

- [domain.json](./vocab/domain.json)
- [commodity.json](./vocab/commodity.json)
- [hazard.json](./vocab/hazard.json)

Vocabulary files are validated against
[spec/schemas/vocab/vocabulary.schema.json](./spec/schemas/vocab/vocabulary.schema.json).

After editing a vocabulary, regenerate the schema fragments:

```sh
npm run gen-schemas
```

## Versioning

The CDH metadata standard, schemas, controlled vocabularies, and the `cgiar-cdh`
STAC extension are versioned together. A single git tag
(`v<MAJOR>.<MINOR>.<PATCH>`) covers all of them. `cdh_schema_version` in input
YAML records matches the same tag.

## Validation

All validation runs through `npm`:

```sh
npm install        # one-time, installs dev tooling
npm test           # markdown lint + schema/vocab/yaml validation
npm run check      # schemas + vocabs + compile + yaml (skips markdown)
```

Individual targets: `check-schemas`, `check-vocabs`, `compile-schemas`,
`check-yaml`, `check-markdown`, `gen-schemas`.

The validation scripts use bare ESM imports, so `node` is the supported runtime
today but they should also run under Deno.

## Acknowledgements

The npm-based validation pipeline and schema-publishing workflow are adapted
from/inspired by the
[stac-extensions/template](https://github.com/stac-extensions/template) project.
