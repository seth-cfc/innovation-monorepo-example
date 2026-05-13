# Framework recipes

Per-framework specifics for the scaffold + rewire workflow in SKILL.md. Read the section matching the chosen framework.

## Next.js

**Scaffold:**
```bash
pnpm dlx create-next-app@latest apps/<name>
```

CLI prompts: TypeScript = yes, ESLint = yes (we'll replace it), Tailwind = yes, App Router = yes, src dir = no, import alias = no. Skip git init.

**Files to keep from scaffold:** `app/`, `next.config.ts`, `next-env.d.ts`, `public/`.
**Files to delete/replace:** `eslint.config.mjs` (scaffold version), `.gitignore` (merge with root), `README.md`.

**`package.json` script tweaks:**
```json
"scripts": {
  "dev": "next dev --port <port>",
  "build": "next build",
  "start": "next start",
  "lint": "eslint --max-warnings 0",
  "check-types": "next typegen && tsc --noEmit"
}
```

**`tsconfig.json`:**
```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "strictNullChecks": true
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", "next.config.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**`eslint.config.mjs`:**
```js
import { config } from "@repo/eslint-config/next";
/** @type {import("eslint").Linter.Config} */
export default config;
```

**Tailwind via PostCSS** — create `apps/<name>/postcss.config.js`:
```js
import { postcssConfig } from "@repo/theming/postcss";
export default postcssConfig;
```

**`app/globals.css`** — open with the theming imports:
```css
@import "tailwindcss";
@import "@repo/theming/shared";
@import "@repo/theming/<app-name>";

@source "../../../packages/ui/src/**/*.{ts,tsx}";
@source "../../../packages/shared/src/**/*.{ts,tsx}";
```

The `@source` directives ensure Tailwind picks up classes used in workspace packages.

## Vite

**Scaffold:**
```bash
pnpm create vite@latest apps/<name>
```

CLI prompts: framework = React, variant = TypeScript + SWC. Skip git.

**Files to keep:** `src/`, `index.html`, `vite.config.ts`, `public/`.
**Files to delete:** `eslint.config.js` (scaffold version), `.gitignore`, `README.md`, the scaffold's `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` (replaced below).

**`package.json` script tweaks:**
```json
"scripts": {
  "dev": "vite --port <port>",
  "build": "tsc -b && vite build",
  "preview": "vite preview --port <port>",
  "lint": "eslint --max-warnings 0",
  "check-types": "tsc --noEmit"
}
```

**`tsconfig.json`** — single config (skip the scaffold's split tsconfig.app/tsconfig.node):
```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "strictNullChecks": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**`eslint.config.mjs`:**
```js
import { config } from "@repo/eslint-config/react-internal";
/** @type {import("eslint").Linter.Config} */
export default config;
```

**Tailwind via Vite plugin** — install `@tailwindcss/vite` and update `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: <port> },
});
```

**`src/index.css`** — same theming imports as Next:
```css
@import "tailwindcss";
@import "@repo/theming/shared";
@import "@repo/theming/<app-name>";

@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

Note: Vite doesn't use PostCSS for Tailwind v4 — the Vite plugin replaces it. Don't add `postcss.config.js` to a Vite app.

## Astro

**Scaffold:**
```bash
pnpm create astro@latest apps/<name>
```

CLI prompts: TypeScript = yes (strict), template = "Empty" (avoids opinionated template content), install dependencies = no (let pnpm install at root handle it). Skip git.

**Files to keep:** `src/`, `astro.config.mjs`, `public/`.
**Files to delete:** scaffold's `tsconfig.json`, `README.md`, `.gitignore`.

**Add the React + Tailwind integrations** (Astro >= 5.2.0 only):
```bash
pnpm --filter <app-name> astro add react
pnpm --filter <app-name> astro add tailwind
```

The `astro add tailwind` command installs `@tailwindcss/vite` and wires it into `astro.config.mjs`. Do NOT install `@astrojs/tailwind` — that's the deprecated v3 path.

**`package.json` script tweaks:**
```json
"scripts": {
  "dev": "astro dev --port <port>",
  "build": "astro build",
  "preview": "astro preview --port <port>",
  "lint": "eslint --max-warnings 0",
  "check-types": "astro check && tsc --noEmit"
}
```

**`tsconfig.json`:**
```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "strictNullChecks": true
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

**`eslint.config.mjs`:**
```js
import { config } from "@repo/eslint-config/react-internal";
/** @type {import("eslint").Linter.Config} */
export default config;
```

**`astro.config.mjs`** — wire React + Tailwind plugin (the `astro add` commands populate this; verify the result):
```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  server: { port: <port> },
});
```

**`src/styles/global.css`** — theming imports:
```css
@import "tailwindcss";
@import "@repo/theming/shared";
@import "@repo/theming/<app-name>";
```

Import this file in any layout that uses Tailwind classes (Astro doesn't auto-include CSS the way Next/Vite do).

## Picking the right `@repo/*` preset by framework

| Framework | tsconfig extends | eslint config import |
|---|---|---|
| Next.js | `@repo/typescript-config/nextjs.json` | `@repo/eslint-config/next` |
| Vite + React | `@repo/typescript-config/react-library.json` | `@repo/eslint-config/react-internal` |
| Astro + React | `@repo/typescript-config/react-library.json` | `@repo/eslint-config/react-internal` |
| Pure-TS app (rare) | `@repo/typescript-config/base.json` | `@repo/eslint-config/base` |

Mirror what a sibling app does if any apps already use the chosen framework — there's no value in inventing a new preset choice.
