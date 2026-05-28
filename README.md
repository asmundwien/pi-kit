# pi-kit

A small kit of utility commands for the pi CLI.

## Commands

- `/code [args...]` — runs the VS Code `code` CLI and forwards arguments, e.g. `/code .` or `/code --new-window "path with spaces"`.

## Install

### From npm

```bash
pi install npm:pi-kit
```

### From git

```bash
pi install git:github.com/<you>/pi-kit
```

### From a local checkout

```bash
pi install /absolute/path/to/pi-kit
```

To try it without installing:

```bash
pi -e ./extensions/code.ts
```

## Publish to npm

Before publishing, confirm the package name and license in `package.json`, then run:

```bash
npm publish --access public
```
