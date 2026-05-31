# 0001: Add collect_decisions as an agent tool

## Status

Accepted for current implementation.

## Context

Agents often need several human decisions before proceeding. Presenting those decisions as a flat list creates a readability and memory burden for the human, especially when early questions lead to discussion and later questions are forgotten.

Pi supports extension tools, custom TUI components, and structured tool results. This allows the package to expose an agent-facing interface without changing pi core behavior or adding a new slash command.

## Decision

Add a `collect_decisions` agent tool in the `extensions/` module. The tool presents ordered decision topics one at a time, allows selecting a suggestion or writing a custom answer, and returns structured answers plus pending decisions when paused.

Do not add the behavioral skill in this change. Track that as intake until explicitly accepted.

## Consequences

- The public package surface now includes an agent tool in addition to slash commands.
- `extensions/` owns interactive TUI state for this tool.
- The root architecture and module documentation must describe tools, not only commands.
- Agents can resume unresolved topics because the tool result preserves pending decisions.
