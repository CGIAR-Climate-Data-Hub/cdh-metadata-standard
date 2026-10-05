# CDH Extension

CGIAR Climate Data Hub governance: domain classification and use guidance.

- **Applies to:** all CDH records - the CDH profile requires this extension.
- **Declared in:** `extensions[]`.

## `cdh.domain[]`

- **Requirement:** Required.
- **Definition:** CDH domain(s) used for filtering and grouping.
- **Expected value:** List of one or more domain ids from `vocab/domain.json`. **Multi-valued and
  ordered**: the first entry is the **primary** domain; subsequent entries are secondary and enable
  cross-cutting search.
- **Vocabulary:** `vocab/domain.json`.

## `cdh.usage`

- **Requirement:** Optional
- **Definition:** Use guidance: what the resource was produced for, and what to avoid.
- **Expected value:** Object with `intended_uses` and/or `not_recommended_for`. Omit `usage`
  entirely when there is nothing to say; an empty object is rejected.

### `cdh.usage.intended_uses[]`

- **Requirement:** Optional
- **Definition:** Uses the resource was produced for.
- **Expected value:** List of short free-text phrases. No controlled vocabulary.
- **Rules:**
  - **Illustrative, never exhaustive.** A use that is absent MUST NOT be read as excluded, and a use
    that is listed MUST NOT be read as endorsed for a particular decision. Suitability for anything
    not listed is judged from `description`, `variables`, coverage, and resolution.
  - Not a filter facet: `cdh.domain` is the field catalog browse and filtering use. Faceting on
    `intended_uses` would turn an illustrative list into a closed one.
  - State the use the producers built the resource for, not what it could conceivably support. Vague
    entries (`research`, `decision-making`) carry no information and should be omitted.
  - Name the use, not a product that uses the resource: gridded climate risk analysis, not panel B
    of a climate mapping tool.
  - Limitations belong in `usage.not_recommended_for`, which carries the reason and, where one
    exists, the alternative.

### `cdh.usage.not_recommended_for[]`

- **Requirement:** Optional
- **Expected value:** List of `{ use, reason, use_instead }`.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.4.0/extensions/cdh/schema.json
cdh:
  domain: [agricultural-production] # primary first; rest are secondary
  usage:
    intended_uses: # illustrative, not exhaustive; absence excludes nothing
      - national and sub-national hotspot mapping
      - targeting of adaptation investment
    not_recommended_for:
      - use: field-scale farm management
        reason: The grid is too coarse for field-scale operational decisions.
        use_instead: Local survey or administrative production data.
```
