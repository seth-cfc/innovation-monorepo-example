# docs

The "docs" app — one of two demo Next.js apps in the monorepo. Runs on **port 3001**.

```bash
pnpm --filter docs dev      # http://localhost:3001
pnpm --filter docs build
pnpm --filter docs start    # production server after build
```

## What it demonstrates

The docs app is intentionally near-identical to [`apps/web`](../web) so that the only differences highlight what changes per-app:

| Concern | `web` | `docs` |
|---|---|---|
| Port | 3000 | 3001 |
| Theme tokens | `@repo/theming/web` | `@repo/theming/docs` |
| Shared packages | `@repo/ui`, `@repo/shared`, `@repo/theming/shared` | identical |

When you want to confirm a change in `packages/*` propagates, edit a shared utility or a Tailwind token and watch both apps update.

## Configuration

- TypeScript preset: `@repo/typescript-config/nextjs.json`
- ESLint preset: `@repo/eslint-config/next-js`
- PostCSS: `@repo/theming/postcss`
- Theme tokens: edit [`packages/theming/docs.css`](../../packages/theming/docs.css) for docs-only tokens, [`packages/theming/shared.css`](../../packages/theming/shared.css) for both.

## Tailwind `@source` directives

[`app/globals.css`](app/globals.css) declares `@source` paths for `@repo/ui` and `@repo/shared` — required so Tailwind v4 scans classes from workspace packages.

## Publishing

`private: true` — apps are never published. See [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) for what does ship.
