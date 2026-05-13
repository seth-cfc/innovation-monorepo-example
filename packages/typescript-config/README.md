# `@repo/typescript-config`

Shared TypeScript `tsconfig.json` presets for every package and app in the monorepo. Three presets, picked by package type:

| Preset | File | Extends | Use for |
|---|---|---|---|
| Base | [`base.json`](base.json) | — | Plain TypeScript packages (`@repo/shared`, `@repo/cli`) |
| React library | [`react-library.json`](react-library.json) | `base.json` + `jsx: react-jsx` | React component packages (`@repo/ui`), Vite apps, Astro components |
| Next.js | [`nextjs.json`](nextjs.json) | `base.json` + Next.js plugin, `jsx: preserve`, bundler resolution | Next.js apps (`apps/web`, `apps/docs`, `apps/playground`) |

## Usage

Each consumer's `tsconfig.json` extends one preset:

```jsonc
// packages/shared/tsconfig.json
{
  "extends": "@repo/typescript-config/base.json",
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

```jsonc
// apps/web/tsconfig.json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "strictNullChecks": true
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", "next.config.js", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## What's in `base.json`

Strict defaults shared by every package:

- `strict: true` + `noUncheckedIndexedAccess: true`
- `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`
- `isolatedModules: true` (every file compiles independently — required for bundlers like Vite/Bun)
- `declaration: true` + `declarationMap: true` (for when a package adopts a build step)
- `skipLibCheck: true`
- `lib: ["es2022", "DOM", "DOM.Iterable"]`

## Pitfalls

- **Don't add `outDir`** to a JIT (no-build) package's `tsconfig.json`. TS emits a `TS6` `rootDir` warning when `outDir` is set but `noEmit: true` is in effect. If a package adopts a compile step (see [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) Pattern B), put `outDir` in a separate `tsconfig.build.json`.
- **`react-library.json` uses `jsx: react-jsx`**, which assumes the new JSX transform (no `import React from "react"` required). All package consumers should be on React 17+.
- **`nextjs.json` uses `moduleResolution: Bundler`** because Next.js owns module resolution. Don't extend it from a non-Next.js consumer.

## Publishing

Already-publishable shape (ships JSON). To publish:

1. Flip `private: false`.
2. Add `files: ["*.json", "README.md"]`, `publishConfig`, `repository` per [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) **Pattern A**.

> Note: the package currently has `publishConfig.access: "public"` set even while `private: true`. That's intentional — when `private` flips, the access level is already correct.
