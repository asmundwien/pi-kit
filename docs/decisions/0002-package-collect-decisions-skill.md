# 0002: Package collect-decisions as a behavior skill

## Status

Accepted for current implementation.

## Context

The `collect_decisions` tool exists as an agent-facing interface, but agents still need behavioral guidance for when to use it. Without a skill, an agent may continue presenting multiple human decisions as a wall of chat questions even though the tool is available.

The intended behavior is triggered before the agent presents a list of things that need user judgment. Informational lists should remain normal chat output; multi-item decision lists should become a guided collection flow.

## Decision

Package a `collect-decisions` skill under `skills/collect-decisions/` and expose it through the package manifest. The skill teaches agents to detect when they are about to ask for multiple human decisions, convert each item into a focused decision topic, call the `collect_decisions` tool when available, and preserve/resume pending decisions after pauses.

The initial implementation included a user-test reference prompt. That reference was later removed as a stale artifact; semantic behavior is now documented in the skill itself.

## Consequences

- The package public surface now includes both extensions and skills.
- The skill owns behavioral guidance; the extension tool continues to own UI state and structured results.
- Installed package users can get the tool and the behavioral trigger together.
- Behavior validation remains partly semantic and user-observed because the important outcome is whether the agent avoids a wall of questions in a live session.
- Stale test prompts should be removed rather than packaged as misleading validation artifacts.
