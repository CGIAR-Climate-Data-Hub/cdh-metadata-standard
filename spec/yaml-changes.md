# Proposed Changes to `standard.yaml`

Status: draft. Outstanding changes only — applied items have been moved to the
bottom for the record.

## 1. Defer: aggregation on variables

Do not add an `aggregation` field to `variables[]` yet — revisit after testing
how STAC tooling handles it. The commented block in the current YAML can stay as
a placeholder.

## 2. Defer: items expansion

Do not add an `items` block to `standard.yaml` yet. Item generation from a
collection (e.g., one COG per crop×technology) will be handled by a per-dataset
Python recipe that reads the YAML, rather than by adding encoder hints to the
core schema.

## 3. Minor cleanup

- `note` encodes as `cgiar-cdh:note`; `spatial.geography` encodes as
  `cgiar-cdh:geography`; `geography.spatial_join` encodes as
  `cgiar-cdh:spatial_join` (STAC-only). Update inline comments in the YAML to
  reflect this.
- `funding[]` encodes as `cgiar-cdh:funding` in both profiles.
- The unused `spatial.resolution.aggregation` and
  `temporal.resolution.aggregation` keys (aggregation is deferred — §1) should
  be dropped or marked with a `# deferred` comment.
- The top-level `geography:` block (containing `column` and `spatial_join`)
  overlaps conceptually with `spatial:`. Consider folding `geography.column` and
  `geography.spatial_join` under `spatial:` to keep all spatial-related fields
  in one block, or rename for clarity.

## 4. Open items still to decide

- **Asset vs additional\_assets**: kept separate for now, but the distinction is
  just `roles`. Consider unifying into a single `assets:` list before publishing
  v1.
- **Classes sidecar pattern**: confirm a convention for when `classes[]` is
  inlined vs linked as a sidecar (size threshold? always sidecar?).
- **Ensemble flag for `cdh.climate.models`**: the current YAML has a comment "Do
  we need an ensemble field to indicate this is a multi-model ensemble?" —
  decide whether to add `cdh.climate.ensemble: true|false` or a reserved value
  like `ensemble` in the models list.

***

## Applied / Resolved

For the record:

- **`encoding` (routing signal)** — added as a top-level field directly after
  `cdh_schema_version`. Values: `stac | ogc-records`.
- **Classification split** — `cdh.domain` (required, CDH-controlled, drives
  website filter and sub-catalog placement) vs optional top-level `themes`
  (ontology-linked, largely encoder-populated). Author-added themes entries
  require resolvable scheme URI + per-concept URIs + descriptions.
- **`resource_type` at top level** — replaced the ambiguous top-level `type: ""`
  with `resource_type: ""` and a comment listing allowed values.
- **Processing code field renames** — `processing[].code.code_url` →
  `processing[].code.url` and `processing[].code.code_version` →
  `processing[].code.version`.
- **Processing block — `id`, step ordering, asset chains** — `processing[]` is
  an ordered list; first step uses `id: source`; `derived_from[]` entries are
  always external URLs (matches STAC semantics, no inter-step references);
  per-asset chains live in `data[].processing_steps[]`.
- **Commodities / hazards encoding** — stay as flat lists in YAML
  (`cdh.commodities`, `cdh.climate.hazards`); encoder expands them into `themes`
  entries with AGROVOC URIs via `vocab/commodity.json` and `vocab/hazard.json`.
  The flat `cgiar-cdh:commodities` / `cgiar-cdh:hazards` fields are not emitted.
- **Controlled-vocab files** — `vocab/domain.json`, `vocab/commodity.json`,
  `vocab/hazard.json` are the source of truth. JSON format chosen for
  hand-editing.
- **Themes primary value** — first concept in `cdh.domain` is the primary
  domain.
