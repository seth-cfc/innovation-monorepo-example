# `@repo/eslint-config`

Shared ESLint flat configs for every package and app in the monorepo. Three presets, picked by package type:

| Preset | Subpath import | Use for |
| --- | --- | --- |
| Base | `@repo/eslint-config/base` | Plain TypeScript packages (`@repo/shared`, `@repo/cli`) |
| React (internal library) | `@repo/eslint-config/react-internal` | React component packages (`@repo/ui`) |
| Next.js | `@repo/eslint-config/next-js` | Next.js apps (`apps/web`, `apps/docs`) |

## Usage

Each consumer's `eslint.config.mjs` (or `.js`) is a one-line re-export:

```js
import { config } from "@repo/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default config;
```

For Next.js apps, import the named `nextJsConfig`:

```js
import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default nextJsConfig;
```

## What's in each preset

All presets layer:

- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-config-prettier` (turns off rules Prettier handles)
- `eslint-plugin-turbo` (warns on undeclared env vars)
- `eslint-plugin-only-warn` (downgrades errors to warnings; `--max-warnings 0` still catches them)

The React presets add `eslint-plugin-react` and `eslint-plugin-react-hooks` with the new JSX transform (`react/react-in-jsx-scope: off`). The Next.js preset additionally enables `@next/eslint-plugin-next`'s recommended + core-web-vitals rules.
