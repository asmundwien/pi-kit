# pi-kit

A small kit of utility commands for the pi CLI.

## Commands

- `/code [args...]` — runs the VS Code `code` CLI and forwards arguments, e.g. `/code .` or `/code --new-window "path with spaces"`.

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

## Development

This project uses pnpm.

```bash
pnpm install
pnpm run check
pnpm run pack:dry-run
```

## Releases

Releases are automated with Conventional Commits and semantic-release.

Commit effects:

- `fix: ...` publishes a patch release.
- `feat: ...` publishes a minor release.
- `feat!: ...` or a `BREAKING CHANGE:` footer publishes a major release.
- `docs: ...`, `chore: ...`, `ci: ...`, and similar non-release commits do not publish.

The release workflow runs on `main`, creates the GitHub release/tag, and publishes to npm through npm Trusted Publishing.

For the first `0.1.0` release, publish once manually and tag the release so semantic-release has a baseline:

```bash
pnpm publish --access public
git tag v0.1.0
git push origin v0.1.0
```

Then configure npm Trusted Publishing for package `@asmundwien/pi-kit`:

- Provider: GitHub Actions
- Organization/user: `asmundwien`
- Repository: `pi-kit`
- Workflow filename: `publish-npm.yml`
- Allowed action: npm publish

After that, release only through Conventional Commits on `main`.
