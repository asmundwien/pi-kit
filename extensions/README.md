# Module: extensions

## Goal

Expose pi utility commands provided by `@asmundwien/pi-kit` behind a narrow extension boundary.

## Anti-goals

- Do not own pi core behavior.
- Do not implement full replacements for external tools such as VS Code or OS openers.
- Do not introduce product-specific workflows without an accepted command-level design.

## Public responsibilities

- Register documented pi commands and agent tools.
- Preserve command/tool names and user-visible behavior described in the root `README.md`.
- Forward command intent to the correct external tool.
- Present agent-owned decision collections through a one-topic-at-a-time TUI.
- Apply project-local Pi window identity through the `/picock` editor border command.
- Forward `/harden` requests into an agent message that asks for the packaged harden skill.
- Report success or failure through pi UI notifications or structured tool results.

## Internal responsibilities

- Parse raw command arguments.
- Select platform-specific commands where required.
- Invoke external tools through `pi.exec` with cancellation support.
- Normalize decision schemas and track in-UI answers/pending topics.
- Load, validate, save, and clear project-local Picock configuration.
- Convert stdout, stderr, exit status, visual identity state, harden request queueing, and decision collection state into concise user-facing notices or structured tool results.

## Dependencies

- `@mariozechner/pi-coding-agent` extension API.
- `@mariozechner/pi-tui` for custom decision collection UI rendering and Picock line-width helpers.
- `typebox` for agent tool parameter schemas.
- Node file-system APIs for Picock project persistence in `.pi/picock.json`.
- External command availability:
  - `code` for `/code`.
  - `open`, `xdg-open`, or `cmd /c start` for `/open`, depending on platform.
- Pi's `sendUserMessage` API for forwarding `/harden` into an agent turn.

## Extension points

- Add new commands or tools as separate TypeScript extension modules.
- Introduce shared internal helpers when multiple extensions need the same stable behavior.
- Add command/tool-specific design notes when an extension becomes complex enough to need local documentation.
- Add Picock styles or color favorites without expanding Picock into a full theme system.
- Keep command-to-skill forwarding commands thin; behavior belongs in the owning skill.

## Invariants

- Commands must not shell-concatenate user input; arguments are passed as arrays to `pi.exec`.
- Unclosed quotes must be reported to the user instead of invoking external tools.
- External process cancellation must respect `ctx.signal`.
- Failures must be visible to the user through an error notification or a structured tool result.
- Decision topics must keep stable IDs and original order in returned results.
- Picock must not write selected colors as label text; the border color carries color identity.
- Picock border rendering must not exceed the terminal width reported by the TUI.
- `/harden` must not implement hardening logic itself; it only forwards intent to the agent and harden skill.

## Failure/recovery expectations

External tools may be missing, unavailable, or return a non-zero exit status. Command modules should surface the tool output when available and otherwise report the exit status. Recovery is user-driven: install the missing tool, correct arguments, or retry the command.

Interactive UI may be unavailable in non-interactive pi modes. Tool modules should fail closed with a structured result that explains what the agent should do next. Commands that require interactive UI should notify the user and avoid partial state changes.

## Diagram

```text
pi command
  -> command module
    -> argument parser, selector, or skill-forwarding prompt
      -> external process, project config, TUI state, or agent message
        -> pi UI notification, editor rendering, or queued agent turn

agent tool call
  -> collect_decisions module
    -> one-topic TUI
      -> structured answers + pending decisions
```
