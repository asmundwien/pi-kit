---
name: harden
description: Use when the user asks for /harden, asks to harden work before completion, or asks for a bias-resistant quality workflow using independent reviewers from multiple angles. Guides reviewer angle selection, up to two review rounds, safe auto-fixes, verification, and stop conditions.
---

# Harden

## Behavioral intent

Run a bounded hardening workflow against explicit criteria: review from multiple angles, classify findings, safely fix in-scope issues, verify, and report what still needs human judgment. Use independent reviewers or fresh review sessions when available; otherwise cover the same review lenses yourself and state the fallback limitation.

The value comes from structured evaluation, evidence, and deterministic verification — not from open-ended debate or reviewer consensus.

## Required inputs

Before reviewing, identify:

- **Target:** diff, files, design, docs, tests, command behavior, or described change.
- **Criteria:** user intent, acceptance criteria, project governance, existing conventions, or specific risk area.
- **Scope boundary:** what is intentionally out of scope.
- **Mode:** `harden-and-fix` by default for `/harden`, unless the user explicitly asks for `review-only`, `harden-only`, or no modifications.

If target or criteria are missing, ask for the missing input. Do not run an open-ended "what is wrong with this?" review without criteria. If the user wants a default review, use: stated intent, project governance, changed-file conventions, deterministic verification status, code quality, and concrete production risks.

## Core review lenses

Cover these lenses every time. Use separate reviewers when available and proportionate to risk; otherwise cover them as sequential sections in your own review.

1. **Correctness against intent**
   - Does the target satisfy the stated intent and acceptance criteria?
   - Look for missing behavior, edge cases, regressions, and implementation/spec mismatch.

2. **Evidence and failure risk**
   - What proves this works, and how could it fail in real use?
   - Look for missing or self-referential tests, weak validation, null/empty inputs, boundaries, stale data, partial failure, ordering, concurrency, permissions, idempotency, deletion cascades, scale, and recovery behavior.

3. **Simplicity, scope, and code quality**
   - Is the change minimal, maintainable, coherent with existing patterns, and inside scope?
   - Look for overengineering, god classes/files, shallow wrappers, weak cohesion, excessive coupling, leaky abstractions, broad public surfaces, misplaced responsibilities, duplicated logic, poor naming, weak readability, unclear control flow, code that does not read like prose, type-safety gaps, error-handling gaps, lifecycle/resource leaks, hidden global state, avoidable mutation, inconsistent idioms, excessive output size, and discovered work being implemented instead of logged.
   - Check module boundaries: prefer cohesive modules with narrow public surfaces and meaningful internal responsibility. Flag deep-module violations when files/classes accumulate unrelated behavior or leak complexity to callers.

## Conditional review lenses

Add these only when the target calls for them. Treat this as a trigger checklist, not a requirement to spawn every possible reviewer.

- **Security/privacy:** auth, authorization, secrets, tokens, user data, sandboxing, file system access, network calls, dependency trust, injection, or sensitive logging.
- **API/contract compatibility:** exported types, command names, CLI flags, package manifest, public docs, schemas, protocol changes, persistence formats, or backwards compatibility.
- **Data/persistence:** migrations, database queries, caches, storage formats, deletion behavior, idempotency, data recovery, or state transitions.
- **Concurrency/performance:** async flows, parallelism, locks, retries, hot paths, large inputs, memory use, startup cost, or scale behavior.
- **UX/accessibility:** UI, TUI, keyboard behavior, visual output, user-facing errors, accessibility, or workflow friction.
- **Docs/onboarding:** README, help text, examples, architectural docs, skill instructions, setup steps, or user-facing explanation.
- **Release/operations:** CI, packaging, publishing, dependency changes, build scripts, environment assumptions, deployment, or rollback.
- **Governance/instruction:** agent skills, prompts, handbook-derived behavior, project rules, architectural decisions, intake protocol, or role-boundary instructions.
- **Domain:** specialized project invariants not covered by the generic lenses.

## Reviewer execution

When independent reviewers are available, assign each a distinct read-only angle with the same target, criteria, scope, and output expectations. Reviewers must inspect the target directly, avoid project/source edits, report evidence-backed findings, and not debate each other. If independent reviewers are unavailable, perform the angles yourself and disclose the fallback limitation.

Use compact reviewer prompts like:

```text
Review the target from this angle: <angle>.
Target: <diff/files/design/docs/behavior>.
Criteria: <intent, acceptance criteria, governance, conventions>.
Scope boundary: <out of scope>.
Do not modify project/source files. Inspect the target directly.
Return only evidence-backed findings with severity, file/line when applicable, criterion, evidence, recommendation, confidence, and whether the finding appears safe to auto-fix. The orchestrator decides final disposition.
Say "no findings" if you found none.
```

## Review round budget

Run one broad review round. After fixes, run a second focused round only for non-trivial findings, substantial fixes, risky diffs, failed verification, or low confidence. Stop after two non-deterministic review rounds. Continue only deterministic verification/fix loops such as tests, typecheck, lint, or build output until they pass or progress stalls.

## Synthesis and fix policy

Synthesize reviewer results before changing anything. Classify each finding:

- **Fix now:** in scope, obvious from criteria or conventions, low-risk, verifiable, and no human judgment needed.
- **Ask human:** requires product, UX, architecture, security posture, public contract, data migration, prioritization, scope, or low-confidence judgment.
- **Defer/log:** real but outside current scope. In modes that allow edits, capture as discovered work in intake when appropriate. In `review-only` or no-modifications mode, report deferred/intake items only and do not modify intake files.
- **Ignore:** unsupported, generic, taste-only, duplicate, or contradicted by evidence.

In `harden-and-fix` mode, automatically apply **Fix now** items. Use only one writer for fixes; never run multiple writers against the same worktree. In `review-only` or `harden-only` mode, report findings without edits. Never auto-fix **Ask human** or **Defer/log** items.

## Verification after fixes

After fixes, run relevant deterministic checks. Prefer tests, typecheck, lint, build, package dry-runs, or command/user-flow smoke checks that cover touched areas. Add focused tests only when inside `harden-and-fix` scope and derivable from acceptance criteria. If no deterministic verification is available, request independent review or state clearly that the fix is unverified.

## Report format

Use a compact default report:

```text
Harden result: PASS | FIXED | NEEDS CHANGES | NEEDS HUMAN DECISION
Mode: harden-and-fix | review-only | harden-only
Scope/criteria: <short>
Review rounds: <1 or 2, with why Round 2 did or did not run>
Findings:
- [Disposition] [Severity] <issue>. Evidence: <observable fact>. Recommendation: <next step>.
Fixes: <none or summary>
Verification: <checks run, pass/fail, or not run and why>
Decisions/deferred items: <none or list>
Next step: <one recommended action>
```

For broad or high-risk reviews, also include reviewer roster, conditional lens rationale, and full synthesis details. If reviewers agree quickly, do not treat agreement as proof; proof comes from evidence against criteria plus deterministic verification.
