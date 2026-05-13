# Continuous Integration

CI for this repo is **split across two systems**. This is deliberate — each tool runs the job it's best at.

| System | Job | Trigger | Why here |
|---|---|---|---|
| [Azure Pipelines](../azure-pipelines.yml) | Validate + publish | PR into `main`, push to `main` | Publishes to Azure Artifacts (the npm feed). Its `npmAuthenticate@0` task injects the feed PAT without putting secrets in GitHub. |
| [GitHub Actions](../.github/workflows/release.yml) | Open "Version Packages" PR | Push to `main` | `changesets/action` handles the version-PR loop in ~10 lines with the free `GITHUB_TOKEN`. Doing this in Azure Pipelines would require Azure DevOps API auth. |

Neither system publishes twice. Azure publishes; GitHub Actions only opens PRs.

## The release flow

```
Author lands feature PR with a `.changeset/*.md` file
   │
   ▼
Merge to `main`
   │
   ├──▶ Azure Pipelines (main trigger): validate + maybe-publish
   │     • check-types, lint, test, build pass
   │     • `pnpm changeset publish` — no-op if no version changed
   │
   └──▶ GitHub Actions Release workflow
         • Sees pending changesets
         • Opens or updates a "Version Packages" PR that consumes them
         │
         ▼
   Someone merges the "Version Packages" PR to `main`
         │
         ▼
   Azure Pipelines fires again on `main`
         • Builds, then `pnpm changeset publish` actually publishes
         • Packages with bumped versions ship to Azure Artifacts
```

## Azure Pipelines

Defined in [`azure-pipelines.yml`](../azure-pipelines.yml). The steps in order:

| Step | Purpose | Failure means |
|---|---|---|
| `NodeTool@0` | Install Node 20 | Misconfigured agent — file an Azure DevOps ticket |
| `npm install -g pnpm@9` | Install pnpm | Network or registry issue |
| Bun install | Read `.bun-version`, install pinned Bun for `@repo/cli` | `.bun-version` missing or version doesn't exist on bun.sh |
| `npmAuthenticate@0` | Inject feed PAT into `.npmrc` | Service connection missing — set up per [PUBLISHING.md](PUBLISHING.md) Prerequisites |
| `pnpm install --frozen-lockfile` | Install workspace deps | `pnpm-lock.yaml` out of sync — run `pnpm install` locally and commit |
| `pnpm format:check` | Prettier check | Run `pnpm format` locally |
| `pnpm turbo run check-types` | TypeScript validation | Fix the type error |
| `pnpm turbo run lint` | ESLint | Fix the lint error |
| `pnpm turbo run test` | Vitest + bun test | Fix the test or the code |
| `pnpm turbo run build` | Next.js builds for every app | Fix the build error |
| `pnpm changeset publish` | Publish bumped packages — **gated** on `main` only | See PUBLISHING.md troubleshooting |

The publish step is gated:

```yaml
condition: and(succeeded(), eq(variables.IS_MAIN, true))
```

PRs run every step *except* publish. This catches publish-blocking errors before merge.

## GitHub Actions

Defined in [`.github/workflows/release.yml`](../.github/workflows/release.yml). One job:

```
checkout → pnpm + node setup → install → changesets/action (version mode)
```

The action:

1. Scans `.changeset/*.md` for pending bumps.
2. If any exist: opens (or updates) a PR titled "chore: version packages" that has the version bumps + CHANGELOG diffs applied.
3. If none exist: no-op.

It runs the script defined by `version: pnpm version-packages` (which calls `changeset version`). It does **not** publish — Azure does that step.

### Required GitHub setup

- **Repository → Settings → Actions → General → Workflow permissions**: Read **and write** permissions. Without this, the action gets a 403 trying to push the version PR.
- **`GITHUB_TOKEN`** is provided automatically by GitHub Actions — no manual secret needed.

## Local validation before pushing

```bash
pnpm format:check
pnpm turbo run check-types
pnpm turbo run lint
pnpm turbo run test
pnpm turbo run build
```

Husky's [pre-commit hook](../.husky/pre-commit) auto-runs Prettier on staged `*.{ts,tsx}` via `lint-staged`. Nothing else runs on commit; full validation happens in CI.

If you skipped the hook (`git commit --no-verify`), at minimum run `pnpm format:check` and `pnpm turbo run check-types` before pushing — those are the most common CI failures.

## Caching

Turbo's local cache is used for every `pnpm turbo run *` invocation. To share cache across CI runs and developers, enable [Vercel Remote Cache](https://turborepo.dev/docs/core-concepts/remote-caching) — not configured today.

The pnpm store cache in Azure Pipelines is **not** wired up. For a meaningful speedup add a `Cache@2` step keyed on `pnpm-lock.yaml`.

## Pipeline troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Pipeline fails at `Authenticate with Azure Artifacts` | Service connection not set up | See [PUBLISHING.md Prerequisites](PUBLISHING.md#prerequisites) |
| `frozen-lockfile` error | Someone forgot to commit `pnpm-lock.yaml` after changing a `package.json` | Run `pnpm install` locally, commit lockfile |
| `pnpm changeset publish` succeeds but nothing publishes | No package has `private: false` yet, or no changeset has actually bumped a version | Expected behavior until you intentionally publish — see PUBLISHING.md |
| Release workflow PR is missing or stale | GitHub workflow permissions are read-only, or no pending changesets exist | Fix repo settings (see above) or add a changeset |
| Husky pre-commit hook didn't run | Running outside `pnpm install`'s `prepare` step, or in a CI clone | Run `pnpm install` once locally to install hooks |
