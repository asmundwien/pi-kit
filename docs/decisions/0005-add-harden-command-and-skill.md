# 0005: Add harden command and skill

## Status

Accepted for current implementation.

## Context

Users need a repeatable way to ask Pi agents for a bias-resistant hardening workflow without restating the full orchestration protocol each time. The intended hardening workflow is not a simple single-agent self-review: it should use independent review lenses, prefer fresh-context review agents or fresh review sessions when available, include mandatory and conditional reviewers, allow up to two non-deterministic hardening review rounds, synthesize findings, automatically fix safe in-scope issues, verify fixes, and escalate decisions that require human judgment.

Pi skill commands such as `/skill:harden` can load a skill, but a dedicated `/harden` command provides a shorter user-facing entry point and can queue a harden request as a follow-up when the agent is busy.

## Decision

Add a `harden` behavior skill under `skills/harden/` and a thin `/harden` extension command in `extensions/harden.ts`.

The skill owns the hardening protocol:

- core review lenses for correctness against intent, evidence/failure risk, and simplicity/scope/code quality
- conditional reviewer selection based on the target's changed files, public surface, dependencies, persistence, UI, docs, release, governance, and domain risks
- generic delegation guidance that prefers fresh-context read-only reviewers when independent review agents or fresh review sessions are available
- fallback to sequential same-agent review angles when delegation is unavailable, with an explicit limitation report
- synthesis of findings into safe auto-fixes, human decisions, deferred/intake work, or ignored feedback
- a maximum of two non-deterministic hardening review rounds, with Round 2 focused on changed areas or unresolved risk
- single-writer fix behavior and deterministic verification after fixes

The `/harden` command does not implement hardening logic. It forwards a user message asking the agent to load and follow the packaged `harden` skill. When the agent is busy, it queues the request as a follow-up and warns that state-sensitive targets are evaluated when the queued request runs.

## Consequences

- The package public surface now includes a `/harden` command and `harden` skill.
- Harden behavior remains instruction-level and depends on the active agent following the skill.
- Multi-reviewer fanout is available only when the host session exposes compatible delegation, parallel task, or fresh-session mechanisms; otherwise the skill degrades to sequential review angles and must report that limitation.
- Safe auto-fix behavior is part of the default `/harden` workflow, but decisions involving product, UX, architecture, security posture, public contracts, data migrations, or scope remain human-owned.
- Runtime command behavior stays narrow: command-to-skill forwarding through Pi's `sendUserMessage` API.

## Links

- Skill: [`../../skills/harden/SKILL.md`](../../skills/harden/SKILL.md)
- Command: [`../../extensions/harden.ts`](../../extensions/harden.ts)
- Architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
