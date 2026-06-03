# 0004 Add Picock project identity command

- status: accepted

## Context

Developers may keep multiple Pi sessions open side by side. Pi already sets terminal titles, but a title is not enough when terminal windows are tiled or zoomed out. A small footer badge is also too subtle for this use case.

Peacock for VS Code succeeds because it makes window identity ambient and visually obvious. For Pi, the stable full-width surface closest to that behavior is the input editor border.

Pi's editor border color also indicates thinking level, but that signal is subtle and may not be obvious to users. For Picock, project identity intentionally takes over both editor border lines because the goal is quick window recognition across several visible Pi instances.

## Decision

Add a `/picock` extension command that applies project-persistent visual identity to Pi's input editor border.

Command surface:

```text
/picock
/picock color
/picock style
/picock reset
```

Behavior:

- `/picock` opens an action selector for color, style, or reset.
- `/picock color` opens a favorite color selector with live preview while navigating.
- `/picock style` opens a style selector with live preview while navigating.
- `/picock reset` removes the project identity.
- Both top and bottom editor border lines are replaced.
- Border lines are foreground-colored; v1 does not use background colors.
- The selected color is not written as text.
- A centered label may show only values: project, model, thinking level.
- Configuration is persisted in `.pi/picock.json` for the current project.

The initial style presets are:

| Style | Character |
| --- | --- |
| minimal | `─` |
| heavy | `━` |
| double | `═` |
| block | `█` |

The default style is `double`.

## Consequences

- Picock prioritizes project/window identity over Pi's built-in editor-border thinking-level color signal.
- Project persistence is local to `.pi/picock.json`, which is ignored in this repository by default.
- The command remains narrow and does not become a general theme or terminal profile manager.
- Future work may add background-color bars or full theme integration, but those are outside v1.

## Links

- `extensions/picock.ts`
- `extensions/picock.DESIGN.md`
- `docs/ARCHITECTURE.md`
