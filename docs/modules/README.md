# Module Documentation Template

Use this template when adding a deep module.

Every meaningful module boundary should have local documentation scaled to its size. The repository root is also a module; `extensions/` and future child modules follow the same design-documentation principles without needing their own package manager, CI setup, or independent test rig unless technically required.

Modules should treat each other as black boxes. Document this module's public responsibilities, interfaces, invariants, and failure behavior here. Keep internal details owned by this module, and link to other modules instead of duplicating their documentation.

```text
# Module: <name>

## Goal
What this module owns and why it exists.

## Anti-goals
What this module explicitly does not own.

## Public responsibilities
The narrow interface or behaviors callers may depend on.

## Internal responsibilities
Implementation details hidden behind the public surface.

## Dependencies
Other modules, protocols, or runtime assumptions this module depends on. Refer to other modules by their public documentation; do not duplicate their internals here.

## Extension points
Where future capabilities can be added without changing callers.

## Invariants
Properties this module must always preserve.

## Failure/recovery expectations
How failures are reported, contained, retried, rolled back, or made observable.

## Diagram
Optional ASCII diagram for boundaries or data flow.
```
