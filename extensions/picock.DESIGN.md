# Module: picock command

## Goal

Provide a small Pi window identity command inspired by Peacock for VS Code. Picock makes the current Pi project visually identifiable by replacing the editor input area's top and bottom border lines with a project-persistent colored line style.

## Anti-goals

- Do not replace Pi's theme system.
- Do not change terminal titles; Pi already owns terminal title behavior.
- Do not use background colors for v1.
- Do not color source code, assistant messages, tool output, or the whole terminal.
- Do not expose complex workspace/profile management.

## Public responsibilities

- Register the `/picock` command.
- Let the user choose color, style, or reset from `/picock` in a Picock-framed selector that reflects the current project identity when one exists.
- Let the user choose a project identity color with `/picock color`, previewing colors while navigating.
- Let the user choose a border style with `/picock style`, previewing styles while navigating.
- Let the user clear the project identity with `/picock reset`.
- Apply the selected identity to both editor border lines.
- Persist the selected identity for the current project.

## Private responsibilities

- Load and save project-local Picock configuration in `.pi/picock.json`.
- Validate persisted color and style values before applying them.
- Replace Pi's editor component with a `CustomEditor` subclass while preserving normal editor input behavior.
- Restore the prior editor component when Picock is reset.
- Render a centered identity label containing only values: project, model, and thinking level.

## Dependencies

- `@mariozechner/pi-coding-agent` for command registration and `CustomEditor`.
- `@mariozechner/pi-tui` for line width measurement and truncation helpers.
- Node `fs/promises` and `path` modules for project-local persistence.

## Invariants

- The selected color is communicated by the border line color, not written as label text.
- The label uses values only, with no field names such as `model:` or `thinking:`.
- Border rendering must not exceed the terminal width passed to `render(width)`.
- Style presets use foreground-colored characters only; v1 avoids background color bars.
- Invalid or absent persisted config must not apply a partial identity.
- Reset removes `.pi/picock.json` and restores the prior editor component.
- Cancelling a color or style selector restores the pre-selector Picock identity.

## Failure and recovery

If `.pi/picock.json` is absent, Picock does nothing until the user chooses a color. If the stored style is missing or unknown, Picock falls back to the default `double` style. If the user selects reset, the stored project config is removed and Pi's previous editor component is restored.

## Flow

```text
user runs /picock
  -> color selector
    -> save .pi/picock.json
      -> replace editor border lines

user runs /picock style
  -> style selector
    -> update .pi/picock.json
      -> replace editor border characters

user runs /picock reset
  -> remove .pi/picock.json
    -> restore previous editor component
```

## Visual shape

```text
━━━━━━━━━━━━━━━━━━━━ pi-kit · model-id · medium ━━━━━━━━━━━━━━━━━━━
user input here
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The border color is the selected project identity color. The label text remains plain terminal text.
