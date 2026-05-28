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

Publishing is automated through GitHub Actions when `main` is updated. The workflow publishes the current `package.json` version only if that version is not already on npm.

Required repository secret:

- `NPM_TOKEN` — an npm automation/access token with publish permission for this package.

For manual publishing:

```bash
npm publish --access public --provenance
```
