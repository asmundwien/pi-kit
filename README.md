# pi-kit

A small kit of utility commands for the pi CLI.

## Install

### From npm

```bash
pi install npm:@asmundwien/pi-kit
```

### From git

```bash
pi install git:github.com/asmundwien/pi-kit
```

### From a local checkout

```bash
pi install /absolute/path/to/pi-kit
```

To try it without installing:

```bash
pi -e ./extensions/code.ts
```

## Agent tools

### `collect_decisions`

Lets the agent collect multiple dependent human decisions through an interactive one-topic-at-a-time TUI. Each topic shows a concise problem, suggested answers, and an option to write a custom answer. Answered choices are marked with `✓`; custom answers are shown inline next to the custom option. Press `Esc` to pause and return partial answers plus pending decisions to the agent. When resumed, previous answers can be prefilled so the full decision collection remains navigable.

Use case: replacing a wall of clarification questions with a navigable decision collection.

## Skills

### `collect-decisions`

Loads behavioral guidance for agents that are about to present multiple human decisions, clarification questions, options, or trade-offs. The skill tells the agent to use the `collect_decisions` tool for multi-item decision lists so the user answers one topic at a time instead of receiving a wall of questions.

A fresh-session test prompt is bundled at [`skills/collect-decisions/references/user-test.md`](skills/collect-decisions/references/user-test.md).

## Commands

### `/picock [color|style|reset]`

Colors the Pi input editor border so the current project is easy to identify when several Pi windows are open. The identity is persisted in `.pi/picock.json` for the project.

- `/picock` opens an action selector for color, style, or reset.
- `/picock color` chooses a favorite color with live preview while navigating.
- `/picock style` chooses a border character preset with live preview: minimal, heavy, double, or block.
- `/picock reset` removes the project identity and restores the default editor border.

The selected color is shown through the top and bottom border lines. The centered label shows values only, such as project, model, and thinking level.

### `/code [args...]`

Runs the VS Code `code` CLI and forwards arguments.

Examples:

```text
/code .
/code --new-window "path with spaces"
```

### `/open [args...]`

Opens files, directories, or URLs with the OS default opener and forwards arguments.

Uses `open` on macOS, `xdg-open` on Linux, and `start` through `cmd` on Windows.

Examples:

```text
/open .
/open https://github.com/asmundwien/pi-kit
/open "path with spaces"
```

## Development

This project uses pnpm.

```bash
pnpm install
pnpm run check
pnpm run pack:dry-run
```

`pnpm run check` runs deterministic checks:

- Biome format check
- Biome lint
- TypeScript typecheck

The same checks run in the pre-commit hook and GitHub Actions.

## Governance

- Agent/contributor operating rules live in [`AGENTS.md`](AGENTS.md).
- Architecture notes live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- Durable decisions should be added under [`docs/decisions/`](docs/decisions/).
- Module documentation guidance lives in [`docs/modules/`](docs/modules/).
- Discovered work should be captured in [`intake.yaml`](intake.yaml) until accepted into scope.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
