---
name: turborepo-new-app
description: Scaffold a new application (Next.js, Vite, or Astro) inside an existing Turborepo + pnpm monorepo and wire it to the repo's shared theming, eslint config, tsconfig, and turbo tasks. Use when the user wants to add another app — phrases like "add a new app", "create a new app", "scaffold a Next.js / Vite / Astro app", "another app in the monorepo", "make a Vite playground", "add a marketing site", or "split this off into its own app". Picks an unused dev port to avoid clashing with existing apps, runs the framework's official scaffold CLI, then strips the boilerplate that conflicts with monorepo conventions (its own eslint/tsconfig/prettier setup) and rewires it to consume @repo/* configs and shared theming. Do NOT use for adding routes inside an existing app, scaffolding a brand-new monorepo, or adding a non-app workspace package — use turborepo-new-package for shared libraries.
---

# Turborepo: new app

Adds an app to an existing Turborepo + pnpm monorepo. The official scaffolders (`create-next-app`, `create vite`, `create astro`) all assume they're creating a stand-alone repo — they drop in their own eslint, tsconfig, and prettier setups that fight the monorepo. The non-obvious work is **stripping that boilerplate and rewiring to `@repo/*`**.

## Workflow

### 1. Discover the repo

Read existing apps under `apps/*` (or wherever `pnpm-workspace.yaml` says) and capture:

| Convention | Where | Example |
|---|---|---|
| Scope | any `apps/*/package.json` `name`/`devDependencies` | `@repo/*` |
| pnpm-workspace.yaml globs | repo root | `apps/*`, `packages/*` |
| Existing dev ports | each app's `dev` script | `next dev --port 3000`, `next dev --port 3001` |
| Shared eslint preset | `apps/*/eslint.config.mjs` | `@repo/eslint-config/next` |
| Shared TS preset | `apps/*/tsconfig.json` `extends` | `@repo/typescript-config/nextjs.json` |
| Shared theming entry | `apps/*/app/globals.css` (or equivalent) | `@import "@repo/theming/shared"` |
| Per-app theming files | `packages/theming/*.css` | `web.css`, `docs.css` |
| Turbo tasks defined | `turbo.json` `tasks` | `build`, `dev`, `lint`, `check-types` |

### 2. Pick the framework

If the user names one (Next/Vite/Astro), use it. Otherwise:
- **Default to whatever existing apps use** — same framework keeps the monorepo coherent.
- If there are no existing apps, ask which framework they want.

### 3. Pick a free dev port

Convention: sequential starting at 3000. Read every existing app's `dev` script and pick the next unused port. Don't pick anything in 5173 (Vite default) or 4321 (Astro default) without confirming nothing else uses them.

### 4. Scaffold via the official CLI

Always use the framework's CLI — it sets up the build pipeline correctly.

| Framework | Command |
|---|---|
| Next.js | `pnpm dlx create-next-app@latest apps/<name>` |
| Vite | `pnpm create vite@latest apps/<name>` |
| Astro | `pnpm create astro@latest apps/<name>` |

When the CLI prompts for options, pick TypeScript + the framework's React/Tailwind defaults. Skip git init (the monorepo already has git).

For framework-specific prompt answers and post-scaffold tweaks, **read [references/frameworks.md](references/frameworks.md)**.

### 5. Strip the boilerplate

The CLI drops a stand-alone setup. Remove what the monorepo already provides:

- [ ] Delete `apps/<name>/.gitignore` if its content is covered by the root `.gitignore`. Otherwise merge the meaningful lines into root.
- [ ] Delete `apps/<name>/.git/` if `git init` ran (it shouldn't have, but check).
- [ ] Delete `apps/<name>/README.md` (or rewrite to reflect monorepo usage).
- [ ] Delete any local `.prettierrc*`, `.editorconfig`, or `.nvmrc` that duplicate root.
- [ ] Delete the scaffold's `eslint.config.{js,mjs,ts}` — replace with the `@repo/eslint-config` import (see step 6).

### 6. Rewire to `@repo/*`

**`package.json`**:
- Set `"name"` to match the directory (e.g. `web`, `docs`, `marketing`)
- Update `"dev"` script to use the chosen port (Next: `next dev --port <port>`; Vite/Astro: see frameworks.md)
- Replace any framework-bundled eslint/typescript versions with the workspace's pinned ones (read a sibling app to confirm versions)
- Add the workspace `@repo/*` configs to `devDependencies`:
  ```json
  "@repo/eslint-config": "workspace:*",
  "@repo/typescript-config": "workspace:*",
  "@repo/theming": "workspace:*"
  ```
- Add any shared workspace packages the new app should consume (e.g. `@repo/ui`, `@repo/shared`)

**`tsconfig.json`** — replace whatever the scaffolder generated with:
```json
{
  "extends": "@repo/typescript-config/<preset>.json",
  "compilerOptions": { "plugins": [{ "name": "next" }], "strictNullChecks": true },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```
The right `<preset>` per framework: Next → `nextjs.json`, Vite/Astro/React-only → `react-library.json`, plain TS → `base.json`. If unsure, mirror what a sibling app uses.

**`eslint.config.mjs`** — single line re-export:
```js
import { config } from "@repo/eslint-config/next";
/** @type {import("eslint").Linter.Config} */
export default config;
```
Use `/next` for Next.js, `/react-internal` for Vite/Astro React, `/base` for plain TS.

### 7. Wire Tailwind + shared theming

If the repo uses `@repo/theming` (check for `packages/theming/`):

- Create a per-app theme file: `packages/theming/<app-name>.css` (mirror an existing app's file like `web.css` — pick distinct accent colors).
- Add a subpath export to `packages/theming/package.json`: `"./<app-name>": "./<app-name>.css"`
- In the new app's main stylesheet, import the same trio the other apps use:
  ```css
  @import "tailwindcss";
  @import "@repo/theming/shared";
  @import "@repo/theming/<app-name>";
  ```
- Wire Tailwind through the framework's preferred path:
  - **Next.js** — copy a sibling `postcss.config.js` re-exporting from `@repo/theming/postcss`
  - **Vite/Astro** — use `@tailwindcss/vite` plugin (read [references/frameworks.md](references/frameworks.md) for the config wiring)

### 8. Add to turbo and verify

`turbo.json` already has `dev`, `build`, `lint`, `check-types` defined globally — no change needed unless the new app emits to a non-standard output dir. If it does, extend the `outputs` array on the `build` task accordingly.

Run from repo root, in order:

1. `pnpm install` — links the workspace deps for the new app.
2. `pnpm --filter <app-name> dev` — sanity-check it boots on the chosen port.
3. `pnpm turbo run check-types` — must include the new app and pass.
4. `pnpm turbo run build` — must include the new app and pass.
5. Open the dev URL and confirm Tailwind classes render with the theming tokens.

If any step fails, **read [references/gotchas.md](references/gotchas.md)**.

## Common mistakes (top 5)

1. **Skipping the strip step.** The scaffolder's eslint/tsconfig override the monorepo's — fix lint or type errors will cascade. Always strip and rewire before the first `pnpm install`.
2. **Port collision.** New app dev script defaults to 3000, the existing app already binds 3000. Pick a unique port up front.
3. **Wrong tsconfig preset.** Using `nextjs.json` in a Vite app (or vice versa) misses critical `lib`/`jsx`/`module` settings. Match preset to framework.
4. **Tailwind v3 install on Astro.** Astro's `astro add tailwind` defaults to v4 in `>=5.2.0`. If you're on a repo using Tailwind v4, do NOT install `@astrojs/tailwind` — it's the v3 path. Use `@tailwindcss/vite` instead.
5. **Forgetting per-app theming entry.** App imports `@repo/theming/<app-name>` but the file doesn't exist yet — Vite/Next emit a build error. Create the per-app CSS file before booting dev.

For the full failure-mode catalog: **read [references/gotchas.md](references/gotchas.md)**.
