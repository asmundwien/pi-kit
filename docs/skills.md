# Module: skills

This module documentation lives under `docs/` instead of `skills/` because pi discovers markdown files in the package's configured skills path. Non-skill markdown inside `skills/` can be interpreted as a skill and must be avoided.

## Goal

Package behavior skills for `@asmundwien/pi-kit` so agents learn when and how to use the package's interactive tools and reusable behavior workflows.

## Anti-goals

- Do not implement runtime tool behavior; extension modules own that.
- Do not replace project governance or user intent.
- Do not force interactive workflows for informational lists or single direct questions.
- Do not turn bounded hardening guidance into product, UX, architecture, security posture, public-contract, or scope judgment.

## Public responsibilities

- Expose pi-discoverable skills under stable names.
- Describe behavioral triggers clearly enough for progressive skill loading.
- Provide bounded hardening guidance for multi-angle independent reviewer assessments, safe fixes, and verification against explicit criteria.

## Internal responsibilities

- Keep `SKILL.md` instructions concise and operational.
- Store longer examples under skill-local `references/` directories when they are current and maintained.
- Link behavior to public tool contracts without depending on extension internals.

## Dependencies

- Pi skill discovery from the package manifest.
- The `collect_decisions` agent tool for the `collect-decisions` skill's preferred workflow.
- Project governance and hardening criteria supplied by the user or target artifact for the `harden` skill.

## Extension points

- Add new skill directories only when a package behavior needs reusable agent guidance.
- Add skill-local references when examples or background would make `SKILL.md` too large, and remove them when they become stale.
- Add new hardening protocols only when they remain bounded to explicit criteria, single-writer fixes, deterministic verification, and explicit escalation for human decisions.

## Invariants

- Skill directory names must match `SKILL.md` frontmatter names.
- Skills must not claim a tool was used when it was unavailable.
- Skills must preserve the boundary between behavior guidance and runtime implementation.
- Harden skills must distinguish safe in-scope auto-fixes from decisions that require human judgment, and must keep all edits on a single writer path.

## Failure/recovery expectations

If a referenced tool is unavailable, the skill should instruct the agent to state that clearly and use a transparent fallback. Recovery is user-driven: install or load the package resources and retry in a fresh pi session.

## Diagram

```text
agent about to present multi-decision list
  -> collect-decisions skill
    -> collect_decisions tool when available
      -> one-topic-at-a-time user choices
        -> answer summary or pause/resume state

user requests hardening
  -> harden skill
    -> explicit target, criteria, and review lens roster
      -> Round 1 parallel evidence-tied reviewer findings
        -> synthesize safe fixes vs human decisions
          -> single-writer fixes and deterministic verification
            -> optional focused Round 2, then stop
```
