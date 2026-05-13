# Gotchas

Failure modes encountered when adding packages to a Turborepo + pnpm monorepo. Each entry: symptom → cause → fix.

## 1. Package doesn't appear in `turbo run check-types` / `lint`

**Symptom:** You run `pnpm turbo run check-types` from root, expecting N+1 packages, but only N show up.

**Cause:** The new package's `package.json` is missing the matching script. Turbo only runs scripts that exist.

**Fix:** Add `"check-types": "tsc --noEmit"` and `"lint": "eslint . --max-warnings 0"` to the new package's scripts. Run `pnpm install` and re-check.

## 2. `Cannot find module '@inquirer/core' from ...` (or similar transitive dep)

**Symptom:** Code imports a sub-module of a dependency that "should" be available transitively.

**Cause:** pnpm enforces strict isolation by default — your package can only access deps it declares directly.

**Fix:** Add the transitive package as an explicit dependency in your new package's `package.json`. Re-run `pnpm install`. Don't reach for `.npmrc` `shamefully-hoist=true` — declare deps properly.

## 3. `TS6: 'rootDir' must be explicitly set` warning

**Symptom:** TypeScript warns about `rootDir` even though you only run `tsc --noEmit`.

**Cause:** `outDir` is set in tsconfig, which makes TS expect a real emit, which requires `rootDir`. JIT packages don't emit and shouldn't have `outDir`.

**Fix:** Remove `outDir` from `compilerOptions`. Optionally also remove `dist` from `exclude` (nothing's writing to it).

## 4. Wildcard exports break for non-`.tsx` files

**Symptom:** Adding a `cn.ts` helper next to `button.tsx`, `card.tsx`, `code.tsx`. Importing `@<scope>/<name>/cn` returns 404 / `ERR_PACKAGE_PATH_NOT_EXPORTED`.

**Cause:** The exports field uses `"./*": "./src/*.tsx"` — pinned to the `.tsx` extension. `.ts` files don't match.

**Fix:** Switch to explicit subpaths:

```json
"exports": {
  "./button": "./src/button.tsx",
  "./card": "./src/card.tsx",
  "./code": "./src/code.tsx",
  "./cn": "./src/cn.ts"
}
```

It's verbose but it's also self-documenting — readers see the public API at a glance.

## 5. Consumer can't import the new package

**Symptom:** App imports `@<scope>/<name>` and Next/Vite/tsserver complains "Cannot find module".

**Cause:** Consumer's `package.json` doesn't list the new package. `pnpm install` linked the package into the workspace, but pnpm only links what's declared.

**Fix:** Add `"@<scope>/<name>": "workspace:*"` to the consumer's `dependencies` (or `devDependencies` for tooling). Re-run `pnpm install`. Re-check the consumer.

## 6. New package using React breaks lint

**Symptom:** `pnpm turbo run lint` shouts about React-specific rules (jsx-a11y, react-hooks) not being defined.

**Cause:** The new package uses `@<scope>/eslint-config/base`, which is the plain-TS preset. It doesn't include React rules.

**Fix:** Switch the new package's `eslint.config.mjs` to import from `@<scope>/eslint-config/react-internal` (or whichever preset name the repo uses for component libraries). Inspect existing component packages to confirm the preset name.

## 7. `pnpm changeset publish` does nothing

**Symptom:** Changesets is configured, the new package has a changeset, CI runs `pnpm changeset publish`, nothing publishes.

**Cause:** The package is still `private: true`.

**Fix:** Flip `private` to `false`, add `publishConfig.registry`, and add `publishConfig.access` (`restricted` for private feeds, `public` for public scopes).

## 8. `extends` resolution fails for tsconfig preset packages

**Symptom:** New tsconfig-config-style package isn't resolvable via `"extends": "@<scope>/<name>/foo.json"`.

**Cause:** TypeScript's `extends` resolution does NOT use `package.json` `exports` field — it uses node module resolution and looks for the file directly inside the package directory.

**Fix:** Don't define `exports` for tsconfig-preset packages. Just put the `.json` files at the package root and reference them by relative path in `extends`. This is the only convention violation in the repo — every other shared config uses `exports`.

## 9. Turbo cache hits when you don't expect them

**Symptom:** You added a package, ran a turbo task, all 5 packages show "FULL TURBO" cache hits — including the new one which has never run before.

**Cause:** Turbo caches the absence of changes. If your new package's `inputs` field doesn't pick up the changes, or if you ran the task in a previous workflow without committing.

**Fix:** Run `pnpm turbo run <task> --force` once to bypass cache. If the issue persists, inspect `turbo.json` `inputs` for the affected task.

## 10. `private: true` apps causing lint/check-types failures

**Symptom:** Lint or check-types fails on an app that doesn't have those scripts.

**Cause:** The app's `package.json` is missing the script — turbo expects it because the task is defined globally.

**Fix:** Either add the script to the app, or accept this as the right behavior — every package and app should define `lint` and `check-types`. Turbo skips packages that don't have the script, but if the task definition mandates running, packages must define it.
