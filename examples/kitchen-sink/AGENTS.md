# Agent guide, Example Gridded Crop Suitability Projections (SAMPLE - NOT REAL DATA)

Fictional sample. This file shows the shape of an agent guide, not real guidance.

## Keys and joins

- Files are split per crop, scenario, and variable; see `href_template` in the record for the
  pattern and `dimensions[]` for the allowed values.
- The admin-2 aggregation is its own record, `example-crop-suitability-admin2`, joined on the
  admin-2 code column.

## Quirks

- Suitability is a 0 to 1 index, not a probability.
- The grid is WGS84 in degrees. Cell area varies with latitude; reproject before summing area.

## Tested query

```sql
-- mean suitability for one crop and scenario, one file
SELECT avg(value) FROM read_raster('.../suit_ssp245_maiz_suitability_index.tif');
```
