# AGENTS.md

Context and conventions for AI coding agents working in this repo. Follows the [agents.md](https://agents.md) convention. Compatible with Claude Code, Cursor, Codex, Aider, and any other agent that reads this file.

## Project overview

Turborepo + pnpm monorepo demonstrating how shared packages flow between multiple apps. Two Next.js apps (`web`, `docs`) consume four shared packages (`@repo/ui`, `@repo/shared`, `@repo/theming`, `@repo/cli`) backed by two config packages (`@repo/eslint-config`, `@repo/typescript-config`).

Stack: React 19, Next.js 16, TypeScript 5.9.2, Tailwind v4, pnpm 9, Turborepo 2.9, Bun (for `@repo/cli` only).

## Setup

```bash
pnpm install
```

Bun is required only if working in `packages/cli`. Everything else runs on Node 18+.

## Common commands

Run these from the repo root.

```bash
pnpm dev                    # turbo run dev — boots web (3000) and docs (3001)
pnpm build                  # turbo run build
pnpm lint                   # turbo run lint
pnpm check-types            # turbo run check-types

pnpm --filter <name> <cmd>  # scope to a single workspace package or app
                            # e.g. pnpm --filter docs dev
                            # e.g. pnpm --filter @repo/cli compile
```

Versioning + publishing (see [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the full Azure Artifacts walkthrough):

```bash
pnpm changeset              # create a changeset for the current PR
pnpm version-packages       # consume changesets, bump versions, write CHANGELOGs
pnpm release                # turbo run build && changeset publish
```

## Repo structure

```
apps/
├── web/                    Next.js (port 3000)
└── docs/                   Next.js (port 3001)

packages/
├── ui/                     React components (Button uses CVA, Card+Code use cn())
├── shared/                 Pure utility functions and shared types
├── theming/                Tailwind v4 tokens — three subpath exports:
│                           ./shared (used by both apps)
│                           ./web    (only apps/web)
│                           ./docs   (only apps/docs)
├── cli/                    Bun-compiled CLI scaffold (@repo/cli)
├── eslint-config/          Shared ESLint presets: base, react-internal, next
└── typescript-config/      Shared tsconfig presets: base, react-library, nextjs

.agents/                    Source of truth for agent config (skills, etc.)
.claude/skills              Symlink → ../.agents/skills (so Claude Code reads it)
.changeset/                 Changesets state
azure-pipelines.yml         Azure Pipelines CI: validate + publish
.github/workflows/          GitHub Actions: changeset version-PR loop
docs/PUBLISHING.md          How to publish to Azure Artifacts (readiness matrix + patterns)
docs/TESTING.md             Test runners, layout, what to test
docs/CI.md                  Azure + GitHub Actions split, release flow
turbo.json                  Pipeline definitions
pnpm-workspace.yaml         Workspace globs
```

## Conventions

### Package shape

- Workspace packages use the `@repo/*` scope. `private: true` until explicitly opted in for publishing.
- **Just-in-time** is the default: `exports` point at `./src/*.ts(x)`, no build step. Only `lint` and `check-types` scripts. Do NOT add `outDir` to a JIT package's tsconfig — it triggers a `rootDir` warning.
- **JIT is workspace-only.** External consumers without a TS-aware bundler can't import a JIT package. Before publishing `@repo/shared` or `@repo/ui` to Azure Artifacts, convert to compiled output (see [`docs/PUBLISHING.md`](docs/PUBLISHING.md) Pattern B).
- **Explicit subpath exports** only. Avoid wildcards like `"./*": "./src/*.tsx"` — they silently break for non-`.tsx` files (e.g. `cn.ts`).
- Internal deps use `workspace:*`: `"@repo/shared": "workspace:*"`.

### tsconfig

Extend a `@repo/typescript-config/*` preset. Pick by app/package type:
- Next.js apps → `nextjs.json`
- React libraries / Vite apps / Astro apps → `react-library.json`
- Plain TypeScript packages → `base.json`

### ESLint

`eslint.config.mjs` is a one-line re-export. Pick by package type:
- Plain TS → `@repo/eslint-config/base`
- React libraries → `@repo/eslint-config/react-internal`
- Next.js apps → `@repo/eslint-config/next-js`

### UI components (`packages/ui`)

- Use CVA beta + `tailwind-merge` for variant-driven components. The wired-up `cva` is imported from [`packages/ui/src/cva.config.ts`](packages/ui/src/cva.config.ts) — it has `twMerge` baked into the `onComplete` hook.
- Use the `cn()` helper from [`packages/ui/src/cn.ts`](packages/ui/src/cn.ts) for components without variants. Never use the `className ?? "default classes"` pattern — it replaces instead of merging.
- See [`Button`](packages/ui/src/button.tsx) for the CVA pattern; [`Card`](packages/ui/src/card.tsx) and [`Code`](packages/ui/src/code.tsx) for the `cn()` pattern.

### Tailwind theming

Apps import three CSS files (in order):
```css
@import "tailwindcss";
@import "@repo/theming/shared";   /* shared brand tokens */
@import "@repo/theming/<app>";    /* per-app accent tokens */

@source "../../../packages/ui/src/**/*.{ts,tsx}";
@source "../../../packages/shared/src/**/*.{ts,tsx}";
```

The `@source` directives are required — without them Tailwind won't compile classes used inside workspace packages.

For the per-app theme: edit `packages/theming/web.css` to change only `web`; `docs.css` to change only `docs`; `shared.css` to change both.

### React component conventions

- Named exports only, no default exports.
- `Props` type (not `interface`) above the component, exported only when consumers need it.
- Pass `className` and merge with `cn()`.
- Use lucide-react for icons (when icons are introduced).

## Adding things

If you have access to project skills:

- **New shared package** → use the `turborepo-new-package` skill. Discovers existing conventions, picks the right shape (JIT, compiled, CLI, CSS-only), avoids the common pitfalls.
- **New app** (Next/Vite/Astro) → use the `turborepo-new-app` skill. Picks an unused dev port, runs the framework's official scaffold CLI, strips the boilerplate that conflicts with the monorepo, rewires to `@repo/*`.

Without the skills, mirror an existing sibling: read `packages/shared/` for a JIT lib, `apps/docs/` for a Next.js app. Always run `pnpm install` after editing any `package.json`.

## Gotchas worth knowing

1. **pnpm strict isolation:** a package can only access deps it declares. Transitive deps (e.g. `@inquirer/core` from `@inquirer/prompts`) won't be reachable — declare them explicitly. Don't reach for `shamefully-hoist=true`.

2. **Wildcard exports break on non-`.tsx` files.** Use explicit subpaths in `package.json` `exports`.

3. **`outDir` without emit triggers `TS6` rootDir warnings.** JIT packages don't emit; remove `outDir` entirely from their tsconfig.

4. **`@source` directives are not optional.** Tailwind v4 only scans the importing app's source by default; without `@source` for workspace packages, classes inside `@repo/ui` etc. won't render.

5. **Changesets `publish` is a no-op until packages flip `private: false`.** The CI ([`azure-pipelines.yml`](azure-pipelines.yml)) runs the publish step; it intentionally does nothing until a package explicitly opts in.

6. **Markdown lint will warn on Changesets `.changeset/*.md` files** because they start with frontmatter `---`, not a heading. This is correct per Changesets format — ignore the warning.

## AI tooling

This repo follows the `.agents/` convention: the canonical location for agent skills, prompts, and tool-specific config is `.agents/` at the root. `.claude/skills` is a symlink to `.agents/skills`. If you add Cursor / Codex / Aider config, put it under `.agents/` and symlink the tool's expected directory.

When creating new skills, write them to `.agents/skills/<name>/SKILL.md` — never directly under `.claude/skills/`.

## PR conventions

- Run `pnpm turbo run check-types` and `pnpm turbo run build` before pushing.
- For any package change that should ship a version bump, run `pnpm changeset` and commit the resulting `.changeset/<name>.md` file.
- Rename `@repo` to your org's reserved npm scope before publishing the first package — it's a placeholder until then.
