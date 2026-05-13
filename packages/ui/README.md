# `@repo/ui`

Shared React components for every app in the monorepo. Currently three components (Button, Card, Code) plus two style helpers (`cn`, the CVA config). JIT package — `exports` point at `.tsx` source.

## Install

Workspace consumer:

```jsonc
// apps/<app>/package.json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

`@repo/ui` declares `react` and `react-dom` as `peerDependencies` — the consuming app owns the React version.

## Subpath exports

| Subpath | Re-exports | Use for |
|---|---|---|
| `@repo/ui/button` | `Button`, `buttonVariants` | A primitive `<button>` with CVA `intent` (`primary` \| `secondary`) and `size` (`sm` \| `md`) variants. |
| `@repo/ui/card` | `Card` | An unopinionated container with hover styles. Wrap with `<a>` or a `<Link>` at the call site if you need navigation. |
| `@repo/ui/code` | `Code` | Inline `<code>` element with default styling that merges consumer `className` via `cn`. |
| `@repo/ui/cn` | `cn` | `clsx + tailwind-merge` helper. Use this whenever a component accepts a `className` so consumer classes override base classes correctly. |
| `@repo/ui/cva` | `cva`, `cx`, `compose` | Pre-configured CVA factory with `twMerge` baked into the `onComplete` hook. Use this instead of importing `cva` from the `cva` package directly. |

```tsx
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Code } from "@repo/ui/code";
import { cn } from "@repo/ui/cn";
import { cva } from "@repo/ui/cva";
```

## Component contracts

### Button

```tsx
<Button intent="primary" size="md" onClick={...}>Save</Button>
```

Extends `ComponentPropsWithoutRef<"button">` plus CVA variants. Defaults `type="button"` to avoid accidental form submits. Consumer owns `onClick`, `disabled`, `aria-*`, etc.

### Card

```tsx
<Card title="Optional title">Body content.</Card>

// As a link — wrap explicitly:
<a href={url} target="_blank" rel="noopener noreferrer" className="block">
  <Card title="Turborepo">High-performance build system.</Card>
</a>
```

Unopinionated `<div>` that owns layout + hover styles. Title is optional.

### Code

```tsx
<Code>npm install</Code>
<Code className="bg-brand-red/10 text-brand-red">danger zone</Code>
```

Consumer `className` merges with the base via `cn()` — does **not** replace base styles.

## Adding a component

1. Create `src/<name>.tsx` with a named export.
2. Add `"./<name>": "./src/<name>.tsx"` to `exports` in [`package.json`](package.json).
3. Co-locate a `src/<name>.test.tsx` using `@testing-library/react`.
4. Add a route in [`apps/playground`](../../apps/playground) under `app/<name>/page.tsx` and a link in the playground index.
5. Update this README's subpath table.

## Styling conventions

- CVA + `tailwind-merge` for variant-driven components. The wired-up `cva` is in [`src/cva.config.ts`](src/cva.config.ts) — `twMerge` is baked into the `onComplete` hook.
- `cn()` helper from [`src/cn.ts`](src/cn.ts) for components without variants.
- **Never use** `className ?? "default classes"` — it replaces instead of merging.

## Tests

```bash
pnpm --filter @repo/ui test
```

Vitest + jsdom + `@testing-library/react`. Setup file: [`vitest.setup.ts`](vitest.setup.ts) (loads `@testing-library/jest-dom/vitest`).

## Publishing

JIT shape ships `.tsx` files — won't work for external consumers without a TS+JSX bundler. See [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) **Pattern B** for the conversion path (tsup is recommended over plain `tsc` for `@repo/ui` because of JSX + `"use client"` handling).
