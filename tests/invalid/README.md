# Negative fixtures

Every record here MUST fail validation. Each file holds only the fields that break one rule; the
validator merges it over the valid [`../base.yaml`](../base.yaml) (objects merge, arrays and scalars
replace). Fixtures cover cross-field checks and conditional schema logic, not plain keywords like
`required` or `enum`.

Run with `npm run check-invalid` or as part of `npm run check`.
