# Planning Notes

## Problem Framing
The target user is an HR manager who needs two outcomes:
1. Reliable employee administration workflows.
2. Fast salary insight retrieval for decision-making.

The system should remain responsive with 10,000 employees and support repeated local seeding.

## Implementation Goals
- Build one deployable full-stack app with a simple local setup.
- Keep core logic in testable domain modules, independent from route handlers.
- Prioritize deterministic, fast unit tests over brittle end-to-end tests.

## Key Milestones
1. Scaffold framework and baseline tooling.
2. Implement schema, repository, and insight service.
3. Expose validated CRUD and insight APIs.
4. Build HR-focused UI with pagination/filtering.
5. Add deterministic seed script and unit tests.
6. Prepare architecture/tradeoff/performance artifacts.

## UX Goals
- Minimize clicks for common HR operations.
- Keep salary insights visible in the same workspace as CRUD actions.
- Make filters and form entry obvious and keyboard-friendly.

## Risk Mitigation
- Validation at API boundary using `zod`.
- Unique email constraint in database.
- Indexed tables for country/job-title queries.
- Deterministic seed generation for reproducible local environments.
