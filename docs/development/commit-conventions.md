# Commit Conventions

HIVE-R uses [Conventional Commits](https://conventionalcommits.org) enforced by commitlint + husky.

## Format

```
type(scope): subject

[optional body]

[optional footer(s)]
```

## Types

| Type | Use When | Changelog |
|---|---|---|
| `feat` | New feature | 🚀 Features |
| `fix` | Bug fix | 🐛 Bug Fixes |
| `perf` | Performance improvement | ⚡ Performance |
| `refactor` | Code restructuring (no behavior change) | ♻️ Refactoring |
| `docs` | Documentation only | 📝 Documentation |
| `test` | Adding/updating tests | 🧪 Tests |
| `ci` | CI/CD changes | 🔧 CI/CD |
| `build` | Build system changes | 📦 Build |
| `chore` | Maintenance (deps, configs) | Hidden |
| `style` | Code style (formatting, semicolons) | Hidden |
| `revert` | Revert a previous commit | ⏪ Reverts |

## Scopes (Optional)

Use the area of codebase being changed:

```
feat(auth): add JWT refresh token rotation
fix(cache): resolve Redis connection leak
docs(readme): update quickstart guide
ci(docker): add smoke test workflow
perf(db): add covering index for cost queries
```

## Breaking Changes

Add `BREAKING CHANGE:` in the footer or `!` after the type:

```
feat(api)!: rename /v1/chat to /v2/chat

BREAKING CHANGE: The /v1/chat endpoint is removed. Use /v2/chat instead.
```

## Examples

```bash
# Feature
git commit -m "feat(agents): add code review agent"

# Bug fix referencing issue
git commit -m "fix(auth): resolve token expiration bug

Closes #42"

# Docs
git commit -m "docs(api): add rate limiting documentation"

# Chore (won't appear in changelog)
git commit -m "chore(deps): bump vitest to v4.1"

# Breaking change
git commit -m "feat(api)!: require API key for all endpoints

BREAKING CHANGE: All endpoints now require an API key header."
```

## Releasing

```bash
# Patch release (1.0.0 → 1.0.1)
npm run release

# Minor release (1.0.0 → 1.1.0)
npm run release:minor

# Major release (1.0.0 → 2.0.0)
npm run release:major

# Then push with tags
git push --follow-tags origin main
```

This bumps version in `package.json`, generates `CHANGELOG.md`, and creates a git tag.

## Enforcement

- **Local**: Husky `commit-msg` hook runs commitlint on every commit
- **CI**: Invalid commit messages are blocked before push
- **Bypass** (emergency only): `git commit --no-verify`
