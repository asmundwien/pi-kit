# Contributing

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

## Commit messages

This project uses Conventional Commits.

Examples:

```text
fix: quote code command arguments correctly
feat: add cursor command
ci: update release workflow
docs: clarify install instructions
```

Release effects:

- `fix: ...` publishes a patch release.
- `feat: ...` publishes a minor release.
- `feat!: ...` or a `BREAKING CHANGE:` footer publishes a major release.
- `docs: ...`, `chore: ...`, `ci: ...`, and similar non-release commits do not publish.

## Releases

Releases are automated with Conventional Commits and semantic-release.

The release workflow runs on `main`, creates the GitHub release/tag, and publishes to npm through npm Trusted Publishing.

### First release bootstrap

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
