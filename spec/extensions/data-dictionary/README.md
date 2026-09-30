# Data Dictionary Extension

Dimensions and variables for gridded, multidimensional, or tabular data.

- **Applies to:** datasets with measurement variables, bands, or columns, and any dataset whose
  meaning depends on axes/codes.
- **Declared in:** `extensions[]`.

## `dimensions[]`

- **Requirement:** Conditional. Required for data cubes, tabular data with axes, or any dataset
  whose meaning depends on axes/codes.
- **Expected value per dimension:**
  `{ name, type, description, values, extent, reference_system, step, unit }`.
- **Rules:**
  - `type` is either a **reserved** value or a domain axis name:
    - `temporal` - an axis of ISO 8601 dates or instants. The only type that may carry a `step`, and
      the only spelling that works: `time`, `date`, `datetime`, and `timestamp` are rejected rather
      than silently read as domain axes. A record may declare several.
    - `z` - a vertical axis: soil depth, height, or pressure level. **At most one per record**,
      since it is the only spatial axis a record ever declares. List its levels in `values` and give
      it a `unit`.
    - `location` - a column identifying a place rather than measuring something, such as an admin or
      station code. It is a key, not an axis of space.
    - Anything else names a domain axis after what it varies (`crop`, `technology`, `scenario`).
      Lowercase, digits, `-` and `_`.
  - **Bands are not a dimension.** This extension has no band dimension type; a multi-band file's
    bands are `variables[]`. `bands` is still an accepted axis name if a resource genuinely varies
    along something it calls a band, but it gets no special treatment.
  - **`spatial` and `geometry` are rejected.** The horizontal lat/lon grid comes from the top-level
    `spatial` field and is never declared here. Use `z` for a vertical axis and `location` for a
    place key.
  - `unit` is the unit of measurement for the values, preferably UDUNITS-2 or UCUM. Give one on a
    `z` dimension (`cm`, `m`, `hPa`) and on any numeric domain axis whose values are not
    self-describing. It is not a substitute for `reference_system`, which names the vocabulary or
    vertical CRS the values are coded against - a `z` dimension can carry both.
  - **Do not declare the horizontal lat/lon grid here.** It comes from the top-level `spatial`
    field.
  - **Declare every temporal axis here** as `type: temporal` with a `step`. The top-level `temporal`
    field carries only the coverage extent (start/end); all temporal cadence lives on these
    dimensions. A record may declare **several** - files split by year with a day column inside each
    is two temporal axes, and so is one store holding a yearly climatology beside a daily field.
  - **A temporal dimension's `values` are ISO 8601 dates or instants, written as strings.** Bare
    numbers (`2030`) and range labels (`2020-2040`) are rejected. A **binned** axis lists each bin's
    start and states its length in `step`, exactly as a monthly axis lists month starts: a 30-year
    projection axis is `values: ["2021", "2051"]` with `step: P30Y`. The readable form (`2021-2050`)
    follows from the value and the step; do not write it.
  - **A cyclic label axis is not temporal.** `DJF`/`MAM`/`JJA`/`SON` repeats every year, while a
    temporal axis runs in one direction, so a season is a domain axis named `season`. Its `P3M` was
    never a step along an axis - it is how long each label covers - so state that in `description`
    alongside the code list in `reference_system`.
  - `step` is the spacing of one step, always an ISO 8601 duration (`P3M`, `P20Y`), and valid **only
    on a `type: temporal` dimension**. It is the only cadence field a dimension carries; a domain
    axis describes its cadence in prose.
  - `extent` is `[first, last]` on a regular temporal axis, in place of listing every value. It
    requires `step` and excludes `values`. Both strings are written at one precision (`1981`,
    `1981-01`, `1981-01-01`, or a date-time), no coarser than the step, start before end. The values
    are `first, first + step, …` while `<= last`, at that same precision: `extent: ["1981", "2025"]`
    with `step: P1Y` is `1981, 1982, ... 2025`.
  - `values` lists the allowed values along the dimension. Omit it for a high-cardinality key column
    (you would not enumerate every household id or admin code).
  - `reference_system` is the vocabulary the values are coded against; prefer a resolvable URI when
    one exists (e.g. the AGROVOC URI for a `crop` dimension).
  - Define coded values. Use `reference_system`, a short inline explanation in `description`, or a
    sidecar code list linked with `rel=describedby`.
  - `name` MUST be unique across `dimensions[]` and `variables[]` together: they share one
    namespace.
  - Do not add custom fields such as `value_definitions` to `dimensions[]`.

## `variables[]`

- **Requirement:** Conditional. Required when the resource has measurement variables, bands, or
  columns.
- **Expected value per variable:**
  `{ name, description, data_type, unit, nodata, note, categories }`.
- **Rules:**
  - Every variable has every declared dimension, unless the record declares `structures[]`.
  - `unit` is the unit of measurement, preferably compliant with UDUNITS-2 or UCUM (e.g., `ha`, `t`,
    `t ha-1`, `K`, `kg m-2 s-1`, `{head}/km2`) rather than strictly validated. Required for
    measurements. Use `1` for dimensionless quantities; omit for text or code columns.
  - Climate variables should use CF standard names where practical (e.g., `precipitation_flux`,
    `air_temperature`).
  - `data_type` is one of a closed list. Numeric types follow STAC `raster:data_type`: `int8`,
    `int16`, `int32`, `int64`, `uint8`, `uint16`, `uint32`, `uint64`, `float16`, `float32`,
    `float64`, and the complex `cint16`, `cint32`, `cfloat32`, `cfloat64`. Table columns may also be
    `decimal` (exact fixed-point), `boolean`, `string`, `binary`, `date`, `time`, or `datetime`. Use
    `other` for nested types such as lists or structs. A geometry column is not a variable; name it
    in `spatial.geometry_column`.
  - `nodata` is the fill value for this variable, and is only needed where it differs from the
    asset's `data[].nodata` - which stays the default for every variable that does not state one.
    Use it when one store holds variables of different types (a `float32` measure filled with
    `-9999` beside a `uint8` classification filled with `255`); a single GeoTIFF cannot, since its
    bands share one data type and one fill value.
  - `description` says what the variable measures. Add reading guidance when direction matters.
  - `note` is for variable-specific caveats. Use record-level `note` for dataset-wide limitations.
  - `categories` lists a coded variable's values, each `{ value, label, description? }`. Required
    when stored values are codes (a class raster, a status flag, a text category). Each `value`
    appears once. A `nodata` value is not a category. For long lists, link a sidecar with
    `rel=describedby` instead.
  - Review may add technical metadata from inspectable files, but not meaning, units, or caveats.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/data-dictionary/schema.json
dimensions:
  - name: crop
    type: crop
    description: Crop code. Full labels are in the dimension codes sidecar.
    values: [whea, maiz, rice]
    reference_system: https://example.org/crop-codes
variables:
  - name: yield
    description: Crop yield for each grid cell. Higher values indicate more output.
    data_type: float32
    unit: t ha-1
    note: >
      Relative quantity; do not sum across cells. Use a weighted mean with harvested_area as the
      weight.
```

### Two temporal axes, and a season that is not one

A cube split by 20-year projection `period` and by `season` has **one** temporal axis, not two. The
period axis is temporal: its values are the ISO 8601 start of each window, and `step` says how long
each one runs. The season axis is cyclic - `DJF` recurs every year - so it is a domain axis, and the
three months each label covers are stated in prose because STAC has nowhere to put them.

```yaml
temporal:
  start_date: "2020-01-01"
  end_date: "2080-12-31"
dimensions:
  - name: period
    type: temporal
    description: 20-year projection window, labelled by its first year.
    values: ["2021", "2041", "2061"] # window starts; 2021-2040, 2041-2060, ...
    step: P20Y
  - name: season
    type: season
    description:
      Meteorological season. Each value covers three months - DJF is December to February.
    reference_system: https://example.org/vocab/seasons
    values: [DJF, MAM, JJA, SON]
variables:
  - name: tas
    description: Near-surface air temperature.
    data_type: float32
    unit: K
```

Two axes really are temporal when both carry dates. Files split by year, each holding a day column:

```yaml
dimensions:
  - name: year
    type: temporal
    description: Year each file covers; the href_template token.
    values: ["2020", "2021", "2022"]
    step: P1Y
  - name: day
    type: temporal
    description: Day of observation within each file. High cardinality, so values are not listed.
    step: P1D
```

## `structures[]`

Layouts for a record whose assets hold different dimensions and variables, such as monthly and
seasonal file sets of one product, or several tables with different columns.

- **Requirement:** Optional. Omit it when every variable has every declared dimension.
- **Expected value per structure:** `{ name, dimensions, variables }`.
- **Rules:**
  - A structure groups variables that share dimensions: every variable in it has every one of its
    dimensions. It does not promise every combination of values exists. `dimensions` may be empty
    when the variables vary only over the horizontal grid.
  - `dimensions` and `variables` name declared `dimensions[]` and `variables[]` entries. A variable
    is defined once and may appear in several structures.
  - With `structures[]`, every variable MUST appear in at least one structure.
  - `name` MUST be unique within `structures[]`.
  - With `structures[]`, every asset MUST name the structures it holds in `data[].structures`.
  - Within one asset, a variable appears in only one of its structures.
  - Each `href_template` token other than `{variable}` MUST be a dimension of every structure the
    asset holds.
  - For a table, the dimensions are its identifier columns and the variables its value columns.
    Listing a column as a dimension does not mean its values are unique.

Monthly and seasonal file sets of the same variables:

```yaml
dimensions:
  - name: time
    type: temporal
    description: Month.
    extent: ["2018-01", "2025-12"]
    step: P1M
  - name: season
    type: season
    description: Rainy season.
    values: [MAM, OND]
  - name: year
    type: temporal
    description: Year of the season.
    extent: ["2018", "2025"]
    step: P1Y
variables:
  - name: flooded
    description: Flood occurrence; 0 = dry, 1 = flooded.
    data_type: uint8
  - name: nobs
    description: Valid observation count.
    data_type: uint16
structures:
  - name: monthly
    dimensions: [time]
    variables: [flooded, nobs]
  - name: seasonal
    dimensions: [season, year]
    variables: [flooded, nobs]
data:
  - name: monthly
    structures: [monthly]
    href_template: "monthly/{variable}-{time}.tif"
  - name: seasonal
    structures: [seasonal]
    href_template: "seasonal/{variable}_{season}_{year}.tif"
```

One store holding variables with different dimensions, such as daily rainfall beside a static land
mask, is one asset with two structures:

```yaml
structures:
  - name: daily
    dimensions: [time]
    variables: [precipitation]
  - name: static
    dimensions: []
    variables: [land_mask]
data:
  - name: store
    structures: [daily, static]
```

## `joins[]`

Joins from this table to other catalogued datasets - typically a value table keyed to an external
geometry/boundary set rather than embedding geometry.

- **Requirement:** Optional.
- **Expected value per join:** `{ target, left_fields, right_fields }`.
- **Rules:**
  - `target` is the dataset joined to: its catalog record id, or an absolute URI for a dataset
    outside the catalog. Prefer the id, which survives a catalog move. An id MUST resolve to exactly
    one catalog record.
  - `left_fields` are this record's key columns; each MUST be a declared
    `dimensions[]`/`variables[]` name. `right_fields` are the matching columns in the target.
  - The two arrays pair **positionally** and MUST be the same length, so composite keys (e.g.
    `[adm0_code, adm2_code]`) and differing column names on each side are both handled.
  - No join type or cardinality is expressed; an entry is an equi-join on the paired fields.

Model the join as two records: the boundary/index set is its own record (its geometries plus the
code columns), and the value table declares its key columns and the `joins[]` entry:

```yaml
dimensions:
  - name: adm0_code
    type: location
    description: GAUL 2015 country code.
  - name: adm2_code
    type: location
    description: GAUL 2015 admin-2 code.
variables:
  - name: population
    description: Population per admin unit.
    unit: "1"
joins:
  - target: https://cdh.example/boundaries/gaul-2015-admin2
    left_fields: [adm0_code, adm2_code]
    right_fields: [ADM0_CODE, ADM2_CODE]
```
