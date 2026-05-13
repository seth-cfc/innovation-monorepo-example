# Innovation Monorepo Example

Turborepo + pnpm monorepo demonstrating how shared packages flow between multiple apps. Two Next.js apps consume four shared packages backed by two config packages.

For full conventions, repo structure, and gotchas, see [`AGENTS.md`](AGENTS.md). For publishing, see [`docs/PUBLISHING.md`](docs/PUBLISHING.md).

## Stack

React 19 · Next.js 16 · TypeScript 5.9 · Tailwind v4 · pnpm 9 · Turborepo 2.9 · Bun (for `@repo/cli` only).

## Layout

```
apps/
├── web/                Next.js, port 3000
└── docs/               Next.js, port 3001

packages/
├── ui/                 React components (Button, Card, Code) + cn / cva helpers
├── shared/             Pure utility functions and shared types
├── theming/            Tailwind v4 design tokens (./shared, ./web, ./docs subpaths)
├── cli/                Bun-compiled standalone CLI (@repo/cli)
├── eslint-config/      Shared ESLint flat configs (base, react-internal, next-js)
└── typescript-config/  Shared tsconfig presets (base, react-library, nextjs)
```

## Getting started

```bash
pnpm install
pnpm dev          # boots web (3000) and docs (3001)
```

Node 20+ and pnpm 9 are required. Bun is required only for `packages/cli`.

## Common commands

```bash
pnpm dev                      # turbo run dev
pnpm build                    # turbo run build
pnpm lint                     # turbo run lint
pnpm check-types              # turbo run check-types
pnpm format                   # prettier --write

pnpm --filter <name> <cmd>    # scope to a single workspace package or app
                              # e.g. pnpm --filter docs dev
                              # e.g. pnpm --filter @repo/cli compile
```

## Versioning & publishing

[`docs/PUBLISHING.md`](docs/PUBLISHING.md) is the source of truth. Short version:

```bash
pnpm changeset                # record a version bump for the current PR
pnpm version-packages         # consume changesets, bump versions, write CHANGELOGs
pnpm release                  # build + changeset publish
```

CI ([`azure-pipelines.yml`](azure-pipelines.yml)) runs typecheck, lint, test, build, and publish on `main`. A GitHub Actions workflow ([`.github/workflows/release.yml`](.github/workflows/release.yml)) opens the "Version Packages" PR. See [`docs/CI.md`](docs/CI.md) for the full split. Packages stay private until each one flips `private: false` and gets a real scope (the `@repo/*` prefix is a placeholder).

## Documentation map

| Doc | Topic |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Conventions, repo structure, gotchas. Read this first. |
| [`docs/PUBLISHING.md`](docs/PUBLISHING.md) | How to publish to Azure Artifacts. Includes a per-package readiness matrix and the three publishing patterns (JIT, compiled, binary). |
| [`docs/TESTING.md`](docs/TESTING.md) | Vitest vs. `bun:test`, file layout, what to test, watch mode. |
| [`docs/CI.md`](docs/CI.md) | Azure Pipelines + GitHub Actions split, the release flow, troubleshooting. |
| [`apps/*/README.md`](apps/) | Per-app overview (`web`, `docs`, `playground`). |
| [`packages/*/README.md`](packages/) | Per-package API, conventions, and publishing path. |

## AI agents

This repo follows the [`agents.md`](https://agents.md) convention. See [`AGENTS.md`](AGENTS.md) for conventions every agent should follow. Skills live under `.agents/skills/`; `.claude/skills` symlinks to it.
