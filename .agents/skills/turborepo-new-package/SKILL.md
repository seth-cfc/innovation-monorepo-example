---
name: turborepo-new-package
description: Scaffold a new workspace package in a Turborepo + pnpm monorepo following the repo's existing conventions (scope, tsconfig, eslint, exports, scripts, turbo wiring). Use when the user wants to add, create, or extract a package under packages/ or apps/ — phrases like "add a package", "new package", "create a workspace package", "extract this into a package", "scaffold a package", or "make this its own package". Discovers existing patterns before scaffolding so the new package matches its neighbors. Picks the right shape (just-in-time TypeScript, compiled dist output, CLI binary, or CSS-only theming) and prevents pitfalls like wildcard exports breaking on .ts files, vestigial outDir triggering rootDir warnings, pnpm strict-isolation on transitive deps, and forgotten check-types/lint scripts that hide the package from turbo. Do NOT use for `pnpm add` of a third-party dep, scaffolding a brand-new monorepo, or single-package npm projects.
---

# Turborepo: new package

Adds a workspace package to an existing Turborepo + pnpm monorepo. The skill is convention-driven: read the neighbors first, then match what's already there.

## Workflow

### 1. Discover before you write

Read **two existing packages** under `packages/*` (or wherever the workspace globs point) before scaffolding. Capture:

| Convention | Where to look | What you're capturing |
|---|---|---|
| Scope | any `packages/*/package.json` `name` field | e.g. `@repo`, `@my-org` |
| Workspace globs | `pnpm-workspace.yaml` | confirms `packages/*` is the right home |
| Existing turbo tasks | `turbo.json` `tasks` keys | which scripts a new package must wire to |
| TS config base | any `packages/*/tsconfig.json` `extends` | e.g. `@repo/typescript-config/base.json` vs `react-library.json` vs `nextjs.json` |
| ESLint preset | any `packages/*/eslint.config.mjs` | e.g. `@repo/eslint-config/base` vs `/react-internal` vs `/next` |
| Exports shape | existing `exports` fields | wildcard `"./*": "./src/*.tsx"` vs explicit subpaths |
| `private` default | existing `package.json` files | usually `true` for workspace-only packages |

Don't assume — every monorepo is slightly different. If the user explicitly names a scope, use it; otherwise inherit.

### 2. Pick the package shape

Four common shapes. Pick one based on **how the package will be consumed**.

| Shape | Use when | exports point at | needs build? |
|---|---|---|---|
| **Just-in-time (JIT)** | Library consumed by Next.js / Vite / any bundler in the same monorepo | `./src/*.ts(x)` | No |
| **Compiled** | Library consumed outside a bundler (Node CLI, third-party repo, published to npm) | `./dist/*.js` with `types` at `./src/*.ts` | Yes (`tsc`) |
| **CLI binary** | Standalone executable (Bun-compiled, tsup, unbuild) | `bin` field | Yes (compile/bundle) |
| **CSS-only / config** | Tailwind/PostCSS shared tokens, eslint config, tsconfig presets | `.css` / `.json` / `.js` files via subpath exports | No |

**Default to JIT** for new shared libraries inside a monorepo — it's simpler and Turborepo recommends it. Only reach for Compiled when the package crosses out of the bundler-having world.

For Compiled, CLI, or CSS-only details: **read [references/package-types.md](references/package-types.md)**.

### 3. Scaffold the package (JIT default)

Create `packages/<name>/` with these files:

**`package.json`** (replace `<scope>`, `<name>`, and adjust `dependencies` to match the role):

```json
{
  "name": "@<scope>/<name>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "devDependencies": {
    "@<scope>/eslint-config": "workspace:*",
    "@<scope>/typescript-config": "workspace:*",
    "eslint": "^9.39.1",
    "typescript": "5.9.2"
  }
}
```

Pin eslint/typescript versions to whatever the existing packages use.

**`tsconfig.json`**:

```json
{
  "extends": "@<scope>/typescript-config/base.json",
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

NO `outDir` — JIT packages don't emit. Adding `outDir` triggers a TS6 `rootDir` warning.

**`eslint.config.mjs`**:

```js
import { config } from "@<scope>/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default config;
```

Use `/react-internal` instead of `/base` if the package ships React components. Use `/next` for Next.js apps.

**`src/index.ts`** — start with a single export so type-checks have something to chew on:

```ts
export const placeholder = true;
```

### 4. Multi-export packages

For a package with several public entry points (a UI lib, a multi-utility lib), use **explicit subpath exports**, not wildcards:

```json
"exports": {
  "./button": "./src/button.tsx",
  "./card": "./src/card.tsx",
  "./cn": "./src/cn.ts"
}
```

Wildcards like `"./*": "./src/*.tsx"` silently break for any non-`.tsx` file in the folder. Always prefer explicit.

### 5. Wire consumers

For every app or package that will import the new one, add to its `dependencies` (alphabetically):

```json
"@<scope>/<name>": "workspace:*"
```

Do this even before writing import statements — pnpm install must resolve the link first.

### 6. Verify

Run from the repo root:

1. `pnpm install` — must resolve and link the new workspace package without errors.
2. `pnpm turbo run check-types` — the new package's `check-types` script must appear in the output and pass.
3. `pnpm turbo run lint` — same, for `lint`.
4. If consumers were added in step 5: import from the new package in one consumer file, run check-types again. The import resolves cleanly only after `pnpm install`.

If any verify step fails, **read [references/gotchas.md](references/gotchas.md)** — it covers the most common breakage modes.

## Common mistakes (top 5)

1. **Forgetting `check-types` / `lint` scripts.** The package becomes invisible to `turbo run check-types` / `lint` — silently excluded, no warning.
2. **Wildcard exports + non-`.tsx` files.** `"./*": "./src/*.tsx"` doesn't expose `cn.ts`, `index.ts`, etc. Use explicit subpaths.
3. **Adding `outDir` to a JIT package.** Triggers `TS6: rootDir must be explicitly set` warning. JIT packages don't emit; remove `outDir` entirely.
4. **Forgetting transitive dep declarations under pnpm.** pnpm strict isolation refuses access to a dep your package didn't declare. If you `import { X } from "some-lib"` and `some-lib` is only a transitive of another dep, declare it directly.
5. **Forgetting to add the new package to consumers.** No error at install, but `import "@<scope>/<name>"` will fail in the app. Always update consumer `package.json` files.

For the full failure-mode catalog: **read [references/gotchas.md](references/gotchas.md)**.
