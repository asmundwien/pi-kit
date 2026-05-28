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

## Commands

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
