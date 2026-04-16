# Trade-offs and Decisions

## Why Next.js for both UI and backend
Pros:
- Single deployable unit.
- Shared TypeScript types between client and server.
- Fast setup with built-in routing.

Cons:
- Tighter coupling than separate frontend/backend services.
- API scaling is linked to app deployment strategy.

## Why SQLite
Pros:
- Zero-ops local setup and deterministic environment.
- Good fit for assignment scope and 10k records.

Cons:
- Not ideal for highly concurrent write-heavy workloads.
- Requires migration path for horizontal scaling.

## Why better-sqlite3
Pros:
- Fast synchronous API with low overhead.
- Great for small-to-medium datasets and scripts.

Cons:
- Blocking calls in Node process.
- Less suitable for very high-concurrency multi-instance environments.

## Why Unit-test-first core logic
Pros:
- Fast and stable feedback loop.
- Easy to reason about correctness for business logic.

Cons:
- Does not replace full browser-level interaction tests.
