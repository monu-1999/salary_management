# Performance Considerations

## Seeding
- Uses a single explicit transaction for all 10,000 inserts.
- Uses prepared statements instead of building SQL strings in loop.
- Reads first/last name files once.
- Deterministic PRNG avoids expensive external dependencies.

Observed local result in this environment:
- 10,000 inserts completed in approximately 75ms.

## Query Performance
- Country and job-title aggregations are index-supported.
- Employee listing uses server-side pagination to avoid loading all rows in UI.
- Search and filtering run in SQL, reducing frontend memory footprint.

## UI Responsiveness
- Search input debounced before API calls.
- Table rendering limited to current page (20 rows by default).

## Operational Notes
- SQLite with WAL mode configured for better read/write behavior.
- If scale grows beyond this assignment, migrate to Postgres and async DB driver.
