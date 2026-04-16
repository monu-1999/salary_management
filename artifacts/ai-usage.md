# AI Usage Log

AI was used intentionally to accelerate migration and UI refinement while preserving engineering quality.

## Areas where AI was used
- Rails backend scaffolding and endpoint parity implementation.
- Next.js-to-Rails proxy route conversion.
- Tab-based dashboard UX refactor (list/form/insights/snapshot).
- Documentation updates across architecture/tradeoff/performance/demo artifacts.

## Human verification steps applied
- Lint checks for frontend changes.
- Rails route validation and endpoint smoke checks.
- Manual browser checks for tab flow:
  - `Add` -> form tab
  - `Edit` -> prefilled form tab
  - `View` -> snapshot tab
- API response checks through both:
  - Rails direct URL (`:3001`)
  - Next.js proxy URL (`:3000/api/*`)

## Prompting style used
- Constraint-driven prompts focused on contract compatibility.
- Incremental migration prompts (backend first, then proxy, then UI restructuring).
- Explicit requests for non-breaking behavior and clean commit boundaries.
