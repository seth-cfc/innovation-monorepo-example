# `@repo/theming`

Tailwind v4 design tokens for every app in the monorepo. Ships CSS — already publishable as-is (no build step).

## Install

```jsonc
// apps/<app>/package.json
{
  "devDependencies": {
    "@repo/theming": "workspace:*"
  }
}
```

## Subpath exports

| Subpath | File | Scope |
|---|---|---|
| `@repo/theming/shared` | [`shared.css`](shared.css) | Tokens + base styles for **every** app (brand colors, light/dark background/foreground, body styles). |
| `@repo/theming/web` | [`web.css`](web.css) | Tokens used **only** by `apps/web`. |
| `@repo/theming/docs` | [`docs.css`](docs.css) | Tokens used **only** by `apps/docs`. |
| `@repo/theming/postcss` | [`postcss.config.js`](postcss.config.js) | Shared PostCSS config (`@tailwindcss/postcss`). |

## Usage

In an app's `app/globals.css`, import in this order:

```css
@import "tailwindcss";
@import "@repo/theming/shared";   /* shared brand tokens + base styles */
@import "@repo/theming/<app>";    /* per-app accent tokens */

@source "../../../packages/ui/src/**/*.{ts,tsx}";
@source "../../../packages/shared/src/**/*.{ts,tsx}";
```

The `@source` directives are required so Tailwind v4 scans classes inside workspace packages — without them, classes used in `@repo/ui` won't render.

In the app's `postcss.config.js`:

```js
import { postcssConfig } from "@repo/theming/postcss";
export default postcssConfig;
```

## Adding a token

- **Shared (both apps):** edit [`shared.css`](shared.css) `@theme` block.
- **Per-app:** edit [`web.css`](web.css) or [`docs.css`](docs.css) `@theme` block.

Tokens declared in `@theme` become Tailwind utility classes automatically (`--color-brand-blue` → `bg-brand-blue`, `text-brand-blue`, etc.).

## Light / dark backgrounds

`shared.css` ships `--background` / `--foreground` CSS variables that flip under `prefers-color-scheme: dark`. These are regular CSS vars (not `@theme` tokens) because they need to respond to a media query — apps consume them via the body styles in `shared.css`.

If you want a class-toggle dark mode instead (the `.dark` strategy), switch to Tailwind v4's `@custom-variant dark` and add tokens via `@theme` overrides under a `.dark` selector.

## Publishing

Already-publishable shape (ships `.css` and `.js`). To publish:

1. Flip `private: false`.
2. Add `files`, `publishConfig`, `repository`, `license` per [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) **Pattern A**.
