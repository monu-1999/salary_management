# Planning Notes

## Problem Framing
The primary user is an HR manager who needs:
1. Reliable employee administration workflows.
2. Fast salary insight retrieval for decision-making.

The app should remain responsive with 10,000 employees and support repeatable local seeding.

## Implementation Goals
- Keep frontend and backend independently maintainable.
- Use Rails API for durable backend behavior and clear service boundaries.
- Preserve existing frontend API contract through Next.js proxy routes.
- Keep deterministic seed/test tooling for reproducible local validation.

## Key Milestones
1. Build frontend workspace and employee CRUD/insight UX.
2. Implement deterministic SQLite schema and seed flow.
3. Migrate backend behavior from Next.js handlers to Rails API.
4. Add proxy layer (`/api/*`) so UI code remains stable.
5. Refine UX into tab-based navigation (list first, then form/insights/snapshot).
6. Refresh artifacts and docs to match deployed architecture.

## UX Goals
- Default to employee list on load.
- Reduce visual overload by showing one primary workspace section at a time.
- Auto-route user to the right tab for intent:
  - `Add` / `Edit` -> form tab.
  - `View` -> snapshot tab.

## Risk Mitigation
- Validation at backend boundary via Rails model validations.
- Unique email constraint enforced in database and surfaced as `409`.
- Indexed SQLite schema for country/job-title filtering.
- API proxy fallback error for Rails unavailability (`502`) to aid debugging.
