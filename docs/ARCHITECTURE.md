# Architecture

`pi-kit` is a pi package that contributes utility commands to the pi CLI through extension modules.

## Current boundary

```text
+------------------------------------------------+
| Repository root module                         |
|                                                |
| Public surface: npm package @asmundwien/pi-kit |
|                                                |
| Owns:                                          |
| - package metadata and release automation      |
| - deterministic checks                         |
| - governance and architecture entry points     |
| - pi extension registration under extensions/  |
+------------------------+-----------------------+
                         |
                         v
+------------------------------------------------+
| extensions/ module                             |
|                                                |
| Public surface: pi commands                    |
| - /code                                        |
| - /open                                        |
|                                                |
| Hides: argument parsing, platform command      |
| selection, process execution, user notices     |
+------------------------------------------------+
```

The package boundary is intentionally narrow: installing the package exposes pi extension commands. Internal implementation details remain inside the extension modules.

## Runtime flow

```text
user command in pi
  -> pi extension command handler
    -> parse command arguments
      -> execute external tool through pi.exec
        -> notify user through pi UI
```

Current external integrations:

- `/code` invokes the `code` CLI.
- `/open` invokes the platform opener: `open` on macOS, `xdg-open` on Linux, and `cmd /c start` on Windows.

## Module boundaries

### Repository root module

Public responsibilities:

- publish package metadata for `@asmundwien/pi-kit`
- declare pi extension entry points
- provide deterministic checks and release automation
- hold root governance, architecture, and intake documents

Internal responsibilities:

- maintain package scripts and CI workflows
- keep generated artifacts out of source control unless intentionally required

### `extensions/` module

Public responsibilities:

- register supported pi commands
- preserve command names and user-visible behavior documented in `README.md`
- report command failures through pi UI notifications

Internal responsibilities:

- parse raw command input
- select platform-specific external commands
- call `pi.exec` with cancellation support
- normalize stdout/stderr into user-facing notifications

See [`../extensions/README.md`](../extensions/README.md) for module-local documentation.

## Modular by design

Future commands should be added as command modules behind the `extensions/` boundary. Shared behavior should become an internal helper only when it protects a stable responsibility; avoid shallow wrappers that merely rename implementation details.

Modules should depend on stable responsibilities and interfaces, not internal implementation details.

## Equal module levels

Treat every module level as a module with its own boundary:

```text
repository root module
  -> extensions module
    -> command modules
      -> implementation units
```

This does not mean every nested module needs its own package manager, independent test suite, CI workflow, or release machinery. It means every meaningful module boundary should have appropriately scoped local documentation: README, DESIGN, architecture notes, invariants, and interface expectations as needed.

## Black-box module rule

Modules should treat other modules as black boxes.

A module may rely on another module's documented public responsibilities, interfaces, invariants, and failure behavior. It should not rely on that module's internal state, private architecture, file layout, or implementation details.

Documentation follows the same rule:

- each module owns the documentation for its own internals
- parent modules document child-module boundaries and responsibilities, not child internals
- sibling modules link to each other's public docs instead of duplicating them
- deeper details live with the module that owns them
- if more context is needed, navigate into that module's documentation rather than copying it outward

## Deep module rule

A good command module has a narrow public surface and a deeper implementation.

```text
+---------------------------------------+
| Command public surface                |
| - command name                        |
| - description                         |
| - documented user-visible behavior    |
+-------------------+-------------------+
                    |
                    v
      Hidden implementation details:
      argument parsing, platform selection,
      subprocess invocation, output shaping,
      cancellation handling
```

Avoid shallow modules that merely wrap implementation details and leak complexity into callers.

## Module-local design docs

Deep modules should carry their own small design document or README. This keeps module intent close to implementation while preventing one giant architecture document from becoming stale.

Each module doc should cover:

- goal
- anti-goals
- public responsibilities
- private/internal responsibilities
- dependencies
- extension points
- invariants
- failure/recovery expectations
- small ASCII diagram when useful

## Responsibilities before contracts

Define module responsibilities and protocols before committing to detailed function signatures or schemas.

```text
Caller responsibility:
  express command intent through pi's command surface

Command module responsibility:
  validate and translate intent, preserve command invariants,
  and hide platform/process details

External tool responsibility:
  expose documented behavior as an invoked process

Runtime responsibility:
  provide pi extension APIs, command registration, cancellation,
  subprocess execution, and UI notification surfaces
```

## Boundary protection principle

Modular design should protect critical internal paths. Callers and peer modules should not directly mutate another module's private internals.

Preferred direction:

```text
user intent
  -> documented pi command
    -> command validation/translation
      -> external tool invocation
        -> user-visible notification
```

## Decision rule

When command boundaries, package shape, release behavior, or runtime integration patterns change, update this file in the same change and add durable decisions under `docs/decisions/` when the decision should guide future work.
