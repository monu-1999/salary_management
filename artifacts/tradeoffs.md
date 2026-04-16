# Trade-offs and Decisions

## Why Next.js frontend + Rails backend
Pros:
- Clear separation of UI and backend responsibility.
- Rails gives strong API conventions and mature validation/data tooling.
- Next.js keeps fast developer experience for frontend iteration.

Cons:
- Two local processes must run (`3000` + `3001`).
- Cross-service debugging is slightly more involved than monolith handlers.

## Why keep Next.js API proxy routes
Pros:
- Frontend fetch paths stay stable (`/api/*`), no UI URL rewiring.
- Allows backend host/port switching via config (`RAILS_API_BASE_URL`).

Cons:
- Adds one extra network hop.
- Proxy layer introduces another point of failure if misconfigured.

## Why SQLite
Pros:
- Zero-ops local setup and deterministic environment.
- Good fit for assignment scope and 10k records.

Cons:
- Not ideal for heavily concurrent write workloads.
- Requires migration path for multi-node scaling.

## Why tab-based dashboard UX
Pros:
- Cleaner focus: list-first workflow with lower visual clutter.
- Intent-based navigation (`Add/Edit/View`) improves task flow.

Cons:
- More clicks for users who prefer seeing all panels simultaneously.
- Requires state coordination across tabs (selection, form/edit modes).

## Why unit-test-focused validation
Pros:
- Fast and stable feedback loop.
- Strong confidence in deterministic behavior (seed + data logic).

Cons:
- Does not replace full browser-level interaction tests.
