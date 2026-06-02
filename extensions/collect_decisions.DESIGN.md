# Module: collect_decisions tool

## Goal

Provide an agent-facing decision collection interface for pi sessions so agents can present multiple human decisions one topic at a time instead of as a wall of text.

## Anti-goals

- Do not define global agent behavior; handbook or skills can do that later.
- Do not parse arbitrary assistant prose into decisions.
- Do not replace normal conversation when a single direct question is enough.

## Public responsibilities

- Register the `collect_decisions` tool for agent use.
- Render one decision topic at a time in an interactive TUI.
- Let the user choose a suggestion or write a custom answer.
- Preserve the full ordered decision list in the tool result so later topics are not lost.
- Accept previous answers on resume so answered topics stay visible and editable.
- Return partial answers when the user pauses for discussion.

## Private responsibilities

- Normalize agent-provided decision labels and defaults.
- Track answered, pending, current, and paused state inside the UI.
- Format structured answers and pending decisions for the agent.
- Provide custom rendering for tool calls and results.

## Dependencies

- `@mariozechner/pi-coding-agent` for extension and tool registration.
- `@mariozechner/pi-tui` for TUI components and keyboard handling.
- `typebox` for the runtime schema passed to `pi.registerTool`.

`typebox` is declared as a runtime dependency because the extension imports it directly for the tool parameter schema.

## Invariants

- Decisions keep their original order.
- Each decision has a stable `id` in the result.
- Resumed decision collections receive all original decisions plus `initialAnswers`, not only pending decisions.
- Pausing returns both answered and pending items.
- Non-interactive sessions fail closed with a clear tool result.
- The UI does not send messages to the agent by itself; it only returns structured data through the tool result.
- Human-facing topic, suggestion, and help text wraps to the available terminal width instead of truncating decision content.

## Failure and recovery

If UI is unavailable or no decisions are supplied, the tool returns a cancelled result with an explanatory message. If the user pauses, the agent can discuss the current item and then call the tool again with all original decisions and the prior answers as `initialAnswers`.

## Flow

```text
agent identifies required decisions
  -> collect_decisions tool
    -> one-topic TUI
      -> choice/custom answer/pause
        -> structured answers + pending decisions
          -> agent continues or resumes decision collection
```
