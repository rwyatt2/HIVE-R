# CI/CD Pipelines

HIVE-R uses GitHub Actions for continuous integration. Three workflows run on every push to `main` and on all pull requests.

## Workflows

### CI - Test (`ci-test.yml`)

| Step | What it does |
|---|---|
| TypeScript typecheck | `npm run typecheck` — catches type errors |
| Client ESLint | `cd client && npm run lint` — React/TS linting |
| Vitest + coverage | `npm run test:coverage` — unit & integration tests |
| Codecov upload | Posts coverage report to PR |
| npm audit | Checks for known vulnerabilities |

### CI - Build (`ci-build.yml`)

| Step | What it does |
|---|---|
| Backend build | `npm run build` — TypeScript → `dist/` |
| Client build | `cd client && npm run build` — Vite → `client/dist/` |
| Docker build | Multi-stage image build with GHA layer caching |

### CI - Docker (`ci-docker.yml`)

Only runs when `Dockerfile`, `src/**`, or `package*.json` change.

| Step | What it does |
|---|---|
| Build image | `docker build` with Buildx |
| Start container | Runs with mock API key |
| Smoke tests | Hits `/health`, `/`, `/metrics` |

## Secrets Required

| Secret | Required | Purpose |
|---|---|---|
| `CODECOV_TOKEN` | Optional | Coverage uploads (private repos) |

## Adding a New Check

1. Edit the relevant `.yml` file in `.github/workflows/`
2. Add a new step under the `steps:` section
3. Push to a branch and open a PR to test

## Concurrency

All workflows use concurrency groups (`test-$ref`, `build-$ref`, `docker-$ref`). If you push again while a workflow is running, the old run is cancelled automatically.

## Local Equivalents

```bash
# Run what CI runs locally:
npm run typecheck         # Type check
cd client && npm run lint # Client lint
npm run test:coverage     # Tests + coverage
npm run build             # Backend build
cd client && npm run build# Client build
docker build -t hive-r .  # Docker build
```
