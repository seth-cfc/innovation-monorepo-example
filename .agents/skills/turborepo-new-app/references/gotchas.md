# Gotchas

Failure modes when adding apps to a Turborepo + pnpm monorepo. Each entry: symptom → cause → fix.

## 1. New app's `pnpm install` adds duplicate React versions

**Symptom:** Different React versions resolved across apps; runtime errors like "Invalid hook call" once the new app imports `@repo/ui`.

**Cause:** The scaffolder pinned `react`/`react-dom` at a version that doesn't match what the rest of the monorepo uses.

**Fix:** Read a sibling app's `package.json`. Pin `react`, `react-dom`, `@types/react`, `@types/react-dom` to the same versions. Re-run `pnpm install`. If pnpm's lockfile resolves multiple versions, add a `.npmrc` line at root: `dedupe-peer-dependents=true`.

## 2. ESLint config from scaffolder fights `@repo/eslint-config`

**Symptom:** Lint errors that don't appear in the other apps; rules like `no-unused-vars` flagging code that is fine elsewhere.

**Cause:** Scaffolder's `eslint.config.{js,mjs,ts}` wasn't deleted; it's overriding or merging with `@repo/eslint-config`.

**Fix:** Delete the scaffolder's eslint config entirely. Replace with a one-line re-export:
```js
import { config } from "@repo/eslint-config/<preset>";
export default config;
```

## 3. Vite app: `@tailwindcss/postcss` instead of `@tailwindcss/vite`

**Symptom:** Tailwind classes don't compile in a Vite app even though `globals.css` imports `tailwindcss`.

**Cause:** Vite ignores PostCSS for Tailwind v4 — it expects the Vite plugin instead. The agent followed the Next-style PostCSS pattern by mistake.

**Fix:** Remove `postcss.config.js` from the Vite app entirely. Install `@tailwindcss/vite` and add it to `vite.config.ts` plugins array.

## 4. Astro: `@astrojs/tailwind` installed instead of v4 plugin

**Symptom:** Tailwind v4 CSS imports fail; classes from the rest of the monorepo don't render.

**Cause:** The agent ran an old `pnpm add @astrojs/tailwind` instead of `pnpm astro add tailwind`. The `@astrojs/tailwind` integration is for Tailwind v3.

**Fix:** Uninstall `@astrojs/tailwind` and remove it from `astro.config.mjs`. Run `pnpm --filter <app> astro add tailwind` (Astro >= 5.2.0) — this installs `@tailwindcss/vite` and wires the config correctly.

## 5. Port collision with existing app

**Symptom:** `pnpm dev` fails with `EADDRINUSE` or both apps fight for the same port.

**Cause:** New app's `dev` script defaults to the framework's default port (3000 for Next, 5173 for Vite, 4321 for Astro), which an existing app already binds.

**Fix:** Read every existing app's `dev` script and pick a unique port. Update the new app's `dev` script (Next: `next dev --port <port>`; Vite: `vite --port <port>` or `server.port` in `vite.config.ts`; Astro: `astro dev --port <port>` or `server.port` in `astro.config.mjs`).

## 6. Tailwind misses classes from workspace packages

**Symptom:** Tailwind classes used inside `@repo/ui` components don't render — buttons appear unstyled.

**Cause:** Tailwind v4 only scans the importing app's source by default. Classes that live in `packages/ui/src` aren't picked up unless declared as `@source`.

**Fix:** In the app's main CSS, add `@source` directives for every workspace package whose classes need to be compiled:
```css
@source "../../../packages/ui/src/**/*.{ts,tsx}";
@source "../../../packages/shared/src/**/*.{ts,tsx}";
```
Adjust the relative path based on the app's depth.

## 7. `next typegen` fails for Next.js 16+ apps before first build

**Symptom:** `pnpm turbo run check-types` fails on the new Next.js app the very first time, complaining about missing `.next/types/`.

**Cause:** `next typegen` requires `.next/` to exist, but it doesn't yet on a fresh app.

**Fix:** Run `pnpm --filter <app> build` once to generate `.next/`, then re-run check-types. Alternative: chain it in the script — `"check-types": "next typegen && tsc --noEmit"` already handles this on subsequent runs.

## 8. `@repo/theming/<app-name>` import fails

**Symptom:** Build error: `Could not resolve "@repo/theming/<app-name>"`.

**Cause:** The per-app theme file (`packages/theming/<app-name>.css`) doesn't exist, OR its subpath isn't declared in `packages/theming/package.json` `exports`.

**Fix:** Create the file by copying a sibling app's theme (e.g., `web.css` → `<app-name>.css`, customize the accent colors). Add the export entry: `"./<app-name>": "./<app-name>.css"`. Re-run `pnpm install`.

## 9. App not picked up by `turbo run`

**Symptom:** `pnpm turbo run dev` runs the existing apps but skips the new one.

**Cause:** The new app's `package.json` is missing the script (e.g., `dev`), or the workspace glob in `pnpm-workspace.yaml` doesn't cover its directory.

**Fix:** Confirm `apps/*` glob is present in `pnpm-workspace.yaml`. Confirm the new app has `dev`/`build`/`lint`/`check-types` scripts in its `package.json`. Run `pnpm install` again to re-discover the workspace.

## 10. Astro app doesn't apply Tailwind classes

**Symptom:** Tailwind compiles, but classes don't apply on rendered pages.

**Cause:** The CSS file with `@import "tailwindcss"` isn't imported anywhere in Astro's component tree. Astro doesn't auto-include CSS like Next/Vite do — you have to import the global CSS in a layout or page.

**Fix:** Import `src/styles/global.css` in `src/layouts/Layout.astro` (or the equivalent layout the pages use):
```astro
---
import "../styles/global.css";
---
```
