# Package types: decision tree + templates

Read this when the new package is **not** a vanilla Just-in-Time TypeScript library. SKILL.md handles the JIT case inline; everything below is for the three other shapes.

## Decision tree

```
Will the package emit JS files (a build step)?
├── No → JIT (use the inline template in SKILL.md)
└── Yes → Will the output be:
          ├── A regular library? → COMPILED
          ├── An executable binary? → CLI
          └── Just CSS/JSON/config files? → CSS-ONLY (no build, but no tsconfig either)
```

## Compiled package

For libraries consumed outside a bundler — Node CLIs that import them, published-to-npm packages, etc. Turborepo's docs call this pattern "Compiled" and recommend it only when JIT isn't an option.

**`package.json`:**

```json
{
  "name": "@<scope>/<name>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "devDependencies": {
    "@<scope>/eslint-config": "workspace:*",
    "@<scope>/typescript-config": "workspace:*",
    "eslint": "^9.39.1",
    "typescript": "5.9.2"
  }
}
```

Note the conditional exports — `types` resolves the source `.ts` directly so `tsserver` gets full type-checking; `default` resolves the compiled `.js` at runtime.

**`tsconfig.json`:**

```json
{
  "extends": "@<scope>/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Both `outDir` AND `rootDir` are required for compiled packages. Set `rootDir` explicitly to silence TS6.

**`turbo.json` task wiring:**

If the consumer's `build` depends on this package's build, the existing `"build": { "dependsOn": ["^build"] }` task in turbo.json already handles it via topological order. Verify by inspecting `turbo.json`.

Add `dist/` to `.gitignore` and the package's own `.gitignore`.

## CLI binary package

For standalone executables — Bun-compiled binaries, tsup-built CLIs, Node ts-node entry points.

**`package.json`** (Bun-compiled flavor):

```json
{
  "name": "@<scope>/<name>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "bin": {
    "<command-name>": "dist/<command-name>"
  },
  "scripts": {
    "start": "bun run index.ts",
    "compile": "bun build --compile --minify --bytecode ./index.ts --outfile dist/<command-name>",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^14.0.3"
  },
  "devDependencies": {
    "@<scope>/eslint-config": "workspace:*",
    "@<scope>/typescript-config": "workspace:*",
    "@types/bun": "latest",
    "eslint": "^9.39.1",
    "typescript": "5.9.2"
  }
}
```

**`tsconfig.json`** (Bun bundler-mode flavor):

```json
{
  "extends": "@<scope>/typescript-config/base.json",
  "compilerOptions": {
    "module": "Preserve",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  },
  "include": ["index.ts", "commands/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Add a `compile` task to root `turbo.json` if it isn't already there:

```json
"compile": {
  "outputs": ["dist/**"]
}
```

If the CLI uses tsup or unbuild instead of Bun, swap the `compile` script for `tsup` / `unbuild` and skip the bundler-mode tsconfig overrides.

## CSS-only / config-only package

For packages that export `.css`, `.json`, or plain `.js` config files — eslint configs, tsconfig presets, tailwind tokens, postcss configs.

**No `tsconfig.json` needed** (nothing to type-check). **No `eslint.config.mjs` needed** for pure config packages.

**`package.json`:**

```json
{
  "name": "@<scope>/<name>",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./shared.css",
    "./postcss": "./postcss.config.js"
  },
  "devDependencies": {
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.5"
  }
}
```

For CSS imported via `@import` in another package's stylesheet, ensure the consumer's bundler resolves `@<scope>/<name>` through node module resolution (Tailwind v4, Vite, Next.js all do this by default).

For tsconfig preset packages, the convention is to ship `base.json`, `nextjs.json`, `react-library.json` etc. and let consumers point at them via `"extends": "@<scope>/typescript-config/<file>.json"`. Don't define an `exports` field — TypeScript's `extends` resolution doesn't use it.

## Naming the package

- Directory name: kebab-case, matches the second half of `@<scope>/<name>`.
- The scope (`@<scope>`) should match every other package in the workspace — discover it from a sibling `package.json`.
- Avoid generic names that collide with npm scope names if the package may eventually be published.
