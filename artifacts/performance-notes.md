# Performance Considerations

## Seeding
- Uses a single explicit transaction for all 10,000 inserts.
- Uses prepared statements instead of ad-hoc SQL string building in loop.
- Reads first/last name source files once.
- Deterministic PRNG keeps seed output reproducible.

Observed local result in this environment:
- 10,000 inserts completed in approximately 75ms.

## Query Performance
- Country and `(country, job_title)` lookups are index-supported.
- Employee listing uses backend pagination, reducing payload size.
- Search and filter predicates execute in SQL (not in browser memory).

## API Path Performance
- UI calls Next.js `/api/*` routes on port `3000`.
- Next.js proxy forwards to Rails API on port `3001`.
- Extra proxy hop is small for local workload but should be monitored in production.

## UI Responsiveness
- Search input is debounced before requesting list updates.
- Tab-based layout reduces heavy concurrent rendering and visual overload.
- Employee list renders only current page rows (20 by default).

## Operational Notes
- Shared SQLite file is used by both seed flow and Rails API.
- Rails is configured to use `sqlite/salary.db` in development.
- If workload grows, migrate to Postgres and remove single-file DB contention.
