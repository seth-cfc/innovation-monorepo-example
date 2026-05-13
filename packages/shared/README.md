# `@repo/shared`

Pure utility functions and shared types consumed by every app in the monorepo. The canonical example of a *just-in-time* (JIT) package: no build step, `exports` point straight at TypeScript source.

## Install

Workspace consumer:

```jsonc
// apps/<app>/package.json
{
  "dependencies": {
    "@repo/shared": "workspace:*"
  }
}
```

## Usage

```ts
import {
  formatGreeting,
  getMonorepoTagline,
  getSharedFeatures,
  type AppName,
  type MonorepoFeature,
} from "@repo/shared";

formatGreeting("web");                       // "Hello, team! You're..."
formatGreeting("docs", "Seth");              // "Hello, Seth! You're..."
getSharedFeatures();                         // MonorepoFeature[]
```

## API

| Export | Kind | Purpose |
|---|---|---|
| `formatGreeting(appName, name?)` | function | App-aware greeting string. `name` defaults to `"team"`. |
| `getMonorepoTagline()` | function | Tagline string for marketing surfaces. |
| `getSharedFeatures()` | function | Array of `{ title, description }` items. |
| `getSharedTimestamp()` | function | Current ISO timestamp. |
| `AppName` | type | Discriminated union `"web" \| "docs"`. |
| `MonorepoFeature` | type | `{ title: string; description: string }`. |

## Why pure functions only

`@repo/shared` is intentionally side-effect-free. No I/O, no `console`, no environment access. Two reasons:

1. **Server- and client-safe.** Both Next.js apps import these from server components, client components, and route handlers without `"use client"` boundaries.
2. **Trivially testable.** See [`src/index.test.ts`](src/index.test.ts).

If you need I/O, put it in the consuming app or create a server-only package.

## Tests

```bash
pnpm --filter @repo/shared test
```

Vitest, co-located `*.test.ts` files next to the code they test.

## Publishing

JIT exports ship `.ts` source — fine inside the monorepo, **not safe for external consumers** without a TS-aware bundler. Before publishing this package to Azure Artifacts, convert to a compiled `dist/` output. See [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) **Pattern B**.
