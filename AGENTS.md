# Agent Instructions

## Project direction

This repository publishes `@asmundwien/pi-kit`, a small package of utility commands for the pi CLI. Do not add new commands, publishing behavior, product direction, or runtime integrations unless explicitly requested.

## Implementation constraints

- Use TypeScript for production code.
- Plain JavaScript is not allowed for production code.
- Keep commands small, typed, and deterministic.
- If a new runtime dependency or stack is introduced, document why it is needed and how it is checked.

## Deterministic checks

Before considering implementation work complete, run the current baseline:

```bash
pnpm run check
pnpm run pack:dry-run
```

`pnpm run check` runs:

- Biome format check
- Biome lint
- TypeScript typecheck

Package contents are validated with `pnpm run pack:dry-run` and in GitHub Actions.

## Design documentation

- Record architectural decisions in files, not only in conversation.
- Use ASCII diagrams for system boundaries, data flow, module boundaries, and release topology when useful.
- Update `docs/ARCHITECTURE.md` when command boundaries, package shape, or release/runtime behavior change.
- Add decision records under `docs/decisions/` for decisions that should survive future sessions.
- Deep modules should carry module-local documentation near implementation, usually `README.md` or `DESIGN.md`.

## Modular design

- Prefer deep modules: narrow public command surfaces with implementation details hidden inside the module.
- Avoid shallow modules that merely wrap implementation details and leak complexity into callers.
- Treat every module level equally for design purposes: the repository root is a module, `extensions/` is a module, and future child modules may define smaller boundaries.
- Treat other modules as black boxes. Depend on their public responsibilities, interfaces, and documented invariants rather than their internal design or file layout.
- Keep documentation owned by the module it describes. Do not duplicate another module's internal documentation; link to it when deeper context is needed.
- Define responsibilities before detailed contracts; function signatures and schemas should follow from proven module responsibilities.
- External tools such as `code`, `open`, `xdg-open`, or `cmd /c start` are integrations behind the command modules.

Module-local documentation should cover:

- goal
- anti-goals
- public responsibilities
- private/internal responsibilities
- dependencies
- extension points
- invariants
- failure/recovery expectations
- small ASCII diagram when useful

## Work intake

- Keep discovered work in `intake.yaml` until it is explicitly accepted into scope.
- Do not implement discovered work just because it was noticed while doing another task.
- Classify discovered work as Blocker, Adjacent, or Distant, and record whether it is auto-resolvable, requires judgment, or unclear.

## Git hygiene

- Use conventional commit messages.
- Keep commits small and focused on one logical concern.
- Do not commit generated build artifacts unless intentionally required.
- Keep `main` in a working state.
- Use branches for experiments.
- Document architectural decisions before large implementation changes.

Conventional commit examples:

```text
feat(command): add cursor opener
fix(open): handle empty arguments consistently
docs(architecture): document extension boundary
chore(tooling): add deterministic formatting checks
```
