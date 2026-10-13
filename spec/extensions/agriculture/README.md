# Agriculture Extension

Agricultural commodities described by the record.

- **Applies to:** agriculture, food-systems, livestock, and crop resources.
- **Declared in:** `extensions[]`.

## `commodities[]`

- **Requirement:** Conditional. Required for agriculture, food-systems, livestock, and crop
  datasets.
- **Vocabulary:** `vocab/commodity.json`, built from the FAO Indicative Crop Classification and the
  WCA 2030 livestock classification; concepts carry an AGROVOC URI where one corresponds.
- **Expected value:** List of concept ids (e.g., `bananas`, `cassava`, `coffee`, `cereals`,
  `cattle`). Tag the level the dataset is about; see the authoring guide.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.4.1/extensions/agriculture/schema.json
commodities:
  - maize
  - rice
  - wheat
```
