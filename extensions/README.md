# Module: extensions

## Goal

Expose pi utility commands provided by `@asmundwien/pi-kit` behind a narrow extension boundary.

## Anti-goals

- Do not own pi core behavior.
- Do not implement full replacements for external tools such as VS Code or OS openers.
- Do not introduce product-specific workflows without an accepted command-level design.

## Public responsibilities

- Register documented pi commands.
- Preserve command names and user-visible behavior described in the root `README.md`.
- Forward user intent to the correct external tool.
- Report success or failure through pi UI notifications.

## Internal responsibilities

- Parse raw command arguments.
- Select platform-specific commands where required.
- Invoke external tools through `pi.exec` with cancellation support.
- Convert stdout, stderr, and exit status into concise user-facing notices.

## Dependencies

- `@mariozechner/pi-coding-agent` extension API.
- External command availability:
  - `code` for `/code`.
  - `open`, `xdg-open`, or `cmd /c start` for `/open`, depending on platform.

## Extension points

- Add new commands as separate TypeScript extension modules.
- Introduce shared internal helpers when multiple commands need the same stable behavior.
- Add command-specific design notes when a command becomes complex enough to need local documentation.

## Invariants

- Commands must not shell-concatenate user input; arguments are passed as arrays to `pi.exec`.
- Unclosed quotes must be reported to the user instead of invoking external tools.
- External process cancellation must respect `ctx.signal`.
- Failures must be visible to the user through an error notification.

## Failure/recovery expectations

External tools may be missing, unavailable, or return a non-zero exit status. Command modules should surface the tool output when available and otherwise report the exit status. Recovery is user-driven: install the missing tool, correct arguments, or retry the command.

## Diagram

```text
pi command
  -> command module
    -> argument parser
      -> pi.exec external tool
        -> pi UI notification
```
