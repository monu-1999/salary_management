# AI Usage Log

AI was used intentionally to accelerate implementation while preserving engineering quality.

## Areas where AI was used
- Initial architecture decomposition (domain/repository/API/UI/testing slices).
- Boilerplate acceleration for route handlers, validation, and UI structure.
- Test case scaffolding for repository and insight calculations.
- Documentation drafting for planning and trade-off artifacts.

## Human verification steps applied
- Lint, type checks, and production build validation.
- Runtime seeding verification (`npm run seed`) and insertion count checks.
- Unit test verification for core logic and deterministic seed behavior.
- Manual review of API contract and pagination/filter behavior.

## Prompting style used
- Task-specific prompts with constraints (deterministic tests, no hidden magic).
- Incremental implementation prompts per layer (backend first, then UI, then tests).
- Emphasis on correctness, explicit typing, and readable code.
