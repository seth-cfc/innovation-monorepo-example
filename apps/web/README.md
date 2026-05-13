# web

The "web" app — one of two demo Next.js apps in the monorepo. Runs on **port 3000**.

```bash
pnpm --filter web dev      # http://localhost:3000
pnpm --filter web build
pnpm --filter web start    # production server after build
```

## What it demonstrates

This app exists to prove that a shared package change in `packages/*` flows into multiple consumers. It imports:

- `@repo/ui` — Button, Card, Code components
- `@repo/shared` — pure utilities (`formatGreeting`, `getSharedFeatures`, …)
- `@repo/theming` — Tailwind v4 tokens via `globals.css` (`shared` + `web` subpaths)

The sibling [`apps/docs`](../docs) consumes the same packages with a different theming subpath. Compare the two when wiring a new shared dependency.

## Configuration

- TypeScript preset: `@repo/typescript-config/nextjs.json` (extended in [`tsconfig.json`](tsconfig.json))
- ESLint preset: `@repo/eslint-config/next-js` (re-exported from [`eslint.config.js`](eslint.config.js))
- PostCSS: `@repo/theming/postcss` (re-exported from [`postcss.config.js`](postcss.config.js))
- Theme tokens: edit [`packages/theming/web.css`](../../packages/theming/web.css) for web-only tokens, [`packages/theming/shared.css`](../../packages/theming/shared.css) for tokens that affect both apps.

## Tailwind `@source` directives

[`app/globals.css`](app/globals.css) includes:

```css
@source "../../../packages/ui/src/**/*.{ts,tsx}";
@source "../../../packages/shared/src/**/*.{ts,tsx}";
```

These are required. Without them Tailwind v4 won't scan classes inside workspace packages and styles in `@repo/ui` won't render.

## Adding a route

Standard Next.js App Router conventions — create `app/<route>/page.tsx`. The repo doesn't impose extra layering on top.

## Publishing

This app is `private: true` and stays that way. Apps are not published; only the shared `packages/*` ship to Azure Artifacts. See [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md).
