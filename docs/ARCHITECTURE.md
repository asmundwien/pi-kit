# Architecture

`pi-kit` is a pi package that contributes utility commands, agent tools, and behavior skills to the pi CLI.

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
| - pi resource registration for extensions/     |
|   and skills/                                  |
+------------------------+-----------------------+
                         |
              +----------+----------+
              |                     |
              v                     v
+----------------------------+  +----------------------------+
| extensions/ module         |  | skills/ module             |
|                            |  |                            |
| Public surface: pi         |  | Public surface: behavior   |
| commands and agent tools   |  | skills                     |
| - /picock                  |  | - collect-decisions        |
| - /code                    |  |                            |
| - /open                    |  | Hides: behavioral trigger  |
| - collect_decisions tool   |  | guidance, tool-use         |
| Hides: argument parsing,   |  | workflow, and user-test    |
| platform command selection,|  | protocol references        |
| process execution, TUI     |  +----------------------------+
| state, user notices,       |
| structured result shaping  |
+----------------------------+
```

The package boundary is intentionally narrow: installing the package exposes pi extension resources and behavior skills. Internal implementation details remain inside their owning modules.

## Runtime flow

```text
user command in pi
  -> pi extension command handler
    -> parse command arguments or present selector
      -> execute external tool, update project config, or change editor rendering
        -> notify user through pi UI

agent tool call
  -> pi extension tool handler
    -> normalize decision topics
      -> render one-topic-at-a-time TUI
        -> return structured answers and pending decisions

agent behavior trigger
  -> collect-decisions skill
    -> detect multi-item human decision list
      -> call collect_decisions tool when available
        -> summarize completed or pending decisions
```

Current commands and external integrations:

- `/picock` applies a project-persistent visual identity to Pi's input editor border using `.pi/picock.json`.
- `/code` invokes the `code` CLI.
- `/open` invokes the platform opener: `open` on macOS, `xdg-open` on Linux, and `cmd /c start` on Windows.

Current agent tools:

- `collect_decisions` presents multiple dependent human decisions one topic at a time and returns structured answers plus pending decisions. Paused decision collections resume with all original topics plus prefilled answers so prior topics remain navigable.

Current behavior skills:

- `collect-decisions` guides agents to use `collect_decisions` before presenting multiple human decisions, clarification questions, options, or trade-offs as a chat list.

## Module boundaries

### Repository root module

Public responsibilities:

- publish package metadata for `@asmundwien/pi-kit`
- declare pi resource entry points
- provide deterministic checks and release automation
- hold root governance, architecture, and intake documents

Internal responsibilities:

- maintain package scripts and CI workflows
- keep generated artifacts out of source control unless intentionally required

### `extensions/` module

Public responsibilities:

- register supported pi commands and agent tools
- preserve command/tool names and user-visible behavior documented in `README.md`
- apply documented project-local visual identity for Picock
- report command failures through pi UI notifications
- return structured tool results for agent-facing interactions

Internal responsibilities:

- parse raw command input
- select platform-specific external commands
- call `pi.exec` with cancellation support
- normalize stdout/stderr into user-facing notifications
- normalize decision topics and own transient TUI state
- load, validate, and persist Picock project configuration

See [`../extensions/README.md`](../extensions/README.md) for module-local documentation.

### `skills/` module

Public responsibilities:

- package behavior skills discovered by pi
- keep skill names stable once published
- document when an agent should load and follow each skill
- provide lightweight test protocols for semantic behavior checks when useful

Internal responsibilities:

- define progressive-disclosure instructions in `SKILL.md`
- keep detailed references near the owning skill
- avoid duplicating extension implementation details; link to public tool behavior instead

See [`skills.md`](skills.md) for skills module documentation. It is stored outside `skills/` so pi does not discover the documentation file as a skill markdown file.

## Modular by design

Future commands should be added as command modules behind the `extensions/` boundary. Shared behavior should become an internal helper only when it protects a stable responsibility; avoid shallow wrappers that merely rename implementation details.

Modules should depend on stable responsibilities and interfaces, not internal implementation details.

## Equal module levels

Treat every module level as a module with its own boundary:

```text
repository root module
  -> extensions module
    -> command/tool modules
      -> implementation units
  -> skills module
    -> skill directories
      -> references
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
      -> external tool invocation or project-local visual state
        -> user-visible notification or editor rendering
```

## Decision rule

When command boundaries, package shape, release behavior, or runtime integration patterns change, update this file in the same change and add durable decisions under `docs/decisions/` when the decision should guide future work.
