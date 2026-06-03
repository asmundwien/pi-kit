---
name: collect-decisions
description: Use when you are about to present the user with a list of decisions, clarification questions, options, trade-offs, or items that need human choices. Converts multi-item ask lists into the collect_decisions tool workflow so the user handles one topic at a time instead of a wall of text.
---

# Collect Decisions

## Behavioral intent

When you are about to show the user a list of things that require human judgment, do not dump the list into chat. Use a structured decision collection flow so the user can address one topic at a time and so unfinished topics are not lost during discussion.

The core trigger is: **"I am about to ask the user to decide, choose, approve, rank, clarify, or answer more than one thing."**

## Use this skill for

- multiple clarification questions before implementation
- alternative approaches where the user must choose
- UX, scope, product, architecture, or policy decisions
- review findings that require user disposition
- acceptance criteria or requirement gaps that need confirmation
- any list where the next step depends on several human answers

## Do not use it for

- a purely informational list where no user response is needed
- a single direct question
- deterministic facts you can verify yourself
- discovered work intake that should be logged rather than decided immediately
- replacing normal conversation after the user asks for explanation or brainstorming

## Required behavior

1. Detect whether the list items are decisions.
   - If the list is informational, present it normally.
   - If there is exactly one decision, ask it directly in chat.
   - If there are two or more decisions, use the `collect_decisions` tool when available.

2. Convert each decision into one focused topic.
   - Give each topic a stable kebab-case `id`.
   - Use a short `label` for navigation.
   - Write `problem` as the specific choice the user must make, not a long explanation.
   - Provide 2-4 concrete `suggestions` with stable `value`s and short labels.
   - Set `allowCustom` to `true` unless custom answers would be unsafe or invalid.

3. Keep the tool call compact.
   - Do not include implementation essays in `problem`.
   - Put the user's real choices in suggestions.
   - Do not overload one topic with multiple independent decisions.

4. After the tool returns:
   - Treat `answers` as the user's decisions.
   - If `paused` is true, stop the collection loop. Do not immediately call `collect_decisions` again.
   - When paused, discuss the topic or feedback the user raised, then ask for an explicit continue signal such as "Continue with the remaining decisions?".
   - Resume only after the user clearly says to continue. Resume with all original decisions plus returned answers as `initialAnswers`.
   - If the user explicitly answers the pending decision in chat while paused, convert that answer into an `initialAnswers` entry for that decision before resuming. Mark it as `wasCustom: true` unless it clearly matches one of the original suggestions.
   - If the user gives ambiguous pause feedback, ask whether it is meant as the answer or only discussion before recording it.
   - If `pending` is non-empty and `paused` is false, do not forget it. Resume or explicitly ask the user how to proceed.
   - Do not treat pause-discussion feedback as an answer to the current pending decision unless the user explicitly states it is their answer.
   - Summarize decisions only after collection completes or when the user asks.

## Tool usage pattern

Call `collect_decisions` with this shape:

```json
{
  "title": "Short purpose",
  "decisions": [
    {
      "id": "scope-boundary",
      "label": "Scope",
      "problem": "Should this change include documentation updates now?",
      "suggestions": [
        {
          "value": "include-docs",
          "label": "Include docs now",
          "description": "Update docs in the same change."
        },
        {
          "value": "defer-docs",
          "label": "Defer docs",
          "description": "Log docs as follow-up work."
        }
      ],
      "allowCustom": true
    }
  ]
}
```

When resuming after a pause, wait for the user's explicit continue signal first. Then pass the full original `decisions` array and add the returned `answers` as `initialAnswers`. If the user answered the paused topic in chat, include that conversational answer in `initialAnswers` too. Do not pass only pending decisions.

## Fallback if the tool is unavailable

If `collect_decisions` is unavailable, say that the decision collection tool is not available and present a compact numbered list grouped by decision. Ask the user to answer by number. Do not pretend the interactive workflow occurred.

## Quality bar

A good decision collection feels like a guided sequence, not a questionnaire dump. The user should see one problem, choose from meaningful options, and still be able to pause for discussion without losing later decisions or being forced back into the collector before they are ready.

