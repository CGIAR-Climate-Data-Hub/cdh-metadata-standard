# Climate Data Hub Metadata Standard

This repository defines the Climate Data Hub metadata standard and input
template. The goal is lightweight, searchable, AI-readable metadata that can be
validated and serialized to STAC or OGC API Records.

> [!NOTE]
> This standard is still a draft. Breaking changes are expected while it is
> being tested and refined.

## Start Here

- [Authoring guide](./spec/authoring-guide.md) - how to fill out metadata
  without getting overwhelmed by optional fields.
- [YAML template](./spec/standard.yaml) - the metadata input template.
- [Metadata input schema](./spec/schemas/metadata-input.schema.json) -
  validates the YAML structure and controlled values.
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
just schemas
```

Or run the generator directly:

```sh
python scripts/generate-vocab-schemas.py
```
