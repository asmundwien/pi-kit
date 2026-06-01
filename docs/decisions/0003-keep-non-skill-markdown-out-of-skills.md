# 0003: Keep non-skill markdown out of skills

## Status

Accepted for current implementation.

## Context

The package manifest exposes `./skills` as a pi skills path. Pi scans markdown files under that path as potential skill definitions. A documentation-only `skills/README.md` can therefore be treated as a skill markdown file and reported as invalid because it does not contain the required skill frontmatter, including `name` and `description`.

The `skills/README.md` file documented the skills module, not an actual behavior skill.

## Decision

Keep documentation-only markdown files out of the configured `skills/` discovery tree. Move the skills module documentation to `docs/skills.md` and leave `skills/` containing only pi-discoverable skill directories such as `skills/collect-decisions/`.

Do not add skill frontmatter to documentation-only files just to satisfy discovery, because that would make documentation appear to be a runnable or loadable skill.

## Consequences

- Pi no longer discovers the skills module documentation as an invalid skill.
- The package manifest can continue exposing the `./skills` directory.
- Skills module documentation is one level farther from the implementation, so `docs/ARCHITECTURE.md` links to its new location and explains why it is outside the module directory.
