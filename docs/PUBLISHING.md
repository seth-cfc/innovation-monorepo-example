# Publishing packages to Azure Artifacts

This monorepo ships every workspace package as `@repo/*` and marks them all `private: true` so nothing leaks to a registry by accident. When you're ready to ship one of them — or a brand-new package — to your team's Azure Artifacts npm feed, this is the loop.

## Prerequisites

- An Azure DevOps **organization** + **project** with an **Artifacts feed** already created.
- A scope reserved in that feed (recommended: match your org name, e.g. `@your-org`). Note: this repo currently uses `@repo` as a workspace-only placeholder — see the appendix on renaming.
- A **Personal Access Token (PAT)** with **Packaging: Read & write** scope. Never commit a PAT.
- Locally: Node 20+, `pnpm@9`, and (if on Windows) Node-installable `vsts-npm-auth`.

## Package readiness matrix

Not every package is publish-ready today. The repo defaults to **just-in-time (JIT)** TypeScript packages — `exports` point at `./src/*.ts(x)` with no build step. That works for workspace consumers (pnpm + Next.js/Vite/Bun all handle TS), but **breaks for external consumers without a TS-aware bundler**.

Use this matrix to find the path for each package:

| Package | Ships | Shape | Path to publish |
|---|---|---|---|
| `@repo/typescript-config` | `.json` | Already publishable | Flip fields (Pattern A) |
| `@repo/eslint-config` | `.js` | Already publishable | Flip fields (Pattern A) |
| `@repo/theming` | `.css` | Already publishable | Flip fields (Pattern A) |
| `@repo/shared` | `.ts` (JIT) | Needs a build step | Convert to compiled (Pattern B) |
| `@repo/ui` | `.tsx` (JIT) | Needs a build step | Convert to compiled (Pattern B) |
| `@repo/cli` | Per-platform binaries | Not a standard npm package | Platform-packages (Pattern C) |

Pick the matching pattern below.

## Step 1 — Pattern A: already-publishable packages

For `@repo/typescript-config`, `@repo/eslint-config`, `@repo/theming` — these already ship runnable files (JSON, JS, CSS). To publish, flip these fields in the package's `package.json`:

```json
{
  "name": "@your-org/shared",
  "version": "0.1.0",
  "type": "module",
  "private": false,
  "license": "UNLICENSED",
  "repository": {
    "type": "git",
    "url": "https://dev.azure.com/<ORG>/<PROJECT>/_git/innovation-monorepo-example",
    "directory": "packages/shared"
  },
  "exports": {
    ".": "./src/index.ts"
  },
  "files": ["src", "README.md", "CHANGELOG.md"],
  "publishConfig": {
    "registry": "https://pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/",
    "access": "restricted"
  }
}
```

What each key earns you:
- `private: false` — pnpm/npm will actually publish it. (Keep `true` on apps and workspace-only configs.)
- `version` — bumped automatically by Changesets; start at `0.1.0`.
- `files` — whitelist of what ends up in the tarball. Without it, every dotfile and `node_modules` lockup risks shipping.
- `exports` — the public API surface; `pnpm publish` respects it.
- `repository.directory` — points npm/pnpm at the right subfolder for monorepo source links.
- `publishConfig.registry` — pins this package to your Azure Artifacts feed even when a developer's default registry is npmjs.org.

That's it for Pattern A. Skip to Step 2.

## Step 1 — Pattern B: convert a JIT TypeScript package to compiled

For `@repo/shared` and `@repo/ui` (and any other JIT TS package), the current `"exports": "./src/index.ts"` ships a `.ts` file in the tarball. External consumers without a bundler that handles TypeScript (or JSX, for `@repo/ui`) will fail to import it. You have two choices:

### Option B1 — Add a `tsc` build step (recommended for `@repo/shared`)

Add a `tsconfig.build.json` that emits to `dist/`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

Then update the package:

```json
{
  "name": "@your-org/shared",
  "version": "0.1.0",
  "type": "module",
  "private": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md", "CHANGELOG.md"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "prepublishOnly": "pnpm build"
  },
  "publishConfig": {
    "registry": "https://pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/",
    "access": "restricted"
  }
}
```

Then in [`turbo.json`](../turbo.json), ensure `build` runs before `release` (it already does via `dependsOn: ["^build"]`). The `prepublishOnly` script is belt-and-suspenders — `pnpm publish` runs it automatically before the tarball is built.

> **Trade-off**: once a package compiles, workspace consumers also resolve through `dist/`, so you have to run `pnpm --filter @repo/shared build` (or `pnpm dev` in watch mode) to see source edits. JIT is faster for inner-loop development. Reserve Pattern B for packages you actually want to publish externally.

### Option B2 — Add `tsup`/`unbuild`/`bunchee` for richer output

If you need dual ESM+CJS, multiple entry points, or want bundling, swap `tsc` for [`tsup`](https://tsup.egoist.dev/) or [`bunchee`](https://github.com/huozhi/bunchee). Same `package.json` shape, different `build` script:

```json
{ "scripts": { "build": "tsup src/index.ts --format esm,cjs --dts" } }
```

For `@repo/ui` (React + JSX), tsup is the smoother path since it handles JSX without extra config.

### Watch out

- **`outDir` triggers a TS6 `rootDir` warning** on the existing JIT tsconfig — that's why this approach puts the build settings in a *separate* `tsconfig.build.json`, leaving `tsconfig.json` JIT-clean.
- **`"use client"` directives** in `@repo/ui` survive a tsc compile (tsc treats them as string statements) but tsup needs `--banner '"use client"'` or per-file `directives` config.
- **Test files** must be excluded from the build (`exclude: ["src/**/*.test.ts*"]`) or they'll ship to consumers.
- **Peer dependencies** matter once you publish. `@repo/ui` already declares `react`/`react-dom` as peers (see [packages/ui/package.json](../packages/ui/package.json)); add `tailwindcss` as a peer too if consumers need to extend the theme.

## Step 1 — Pattern C: publishing the CLI binary

`@repo/cli` is compiled by Bun into platform-specific standalone binaries (Linux x64/arm64, macOS x64/arm64, Windows x64). Standard npm can't multiplex one tarball across platforms. Two well-trodden options:

### Option C1 — Optional dependencies per platform (the esbuild / sharp / swc pattern)

Publish six packages:

- `@your-org/cli` — the user-facing entry. Contains a tiny JS shim and `optionalDependencies` for each platform package. The shim resolves to the right binary at runtime.
- `@your-org/cli-linux-x64`, `@your-org/cli-linux-arm64`, `@your-org/cli-darwin-x64`, `@your-org/cli-darwin-arm64`, `@your-org/cli-windows-x64` — each ships the binary for one platform. Each declares `os` and `cpu` fields so npm/pnpm only installs the right one:

```json
{
  "name": "@your-org/cli-linux-x64",
  "version": "0.1.0",
  "os": ["linux"],
  "cpu": ["x64"],
  "files": ["bin"]
}
```

The shim in `@your-org/cli` looks like:

```js
#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const platform = `${process.platform}-${process.arch}`;
const pkg = `@your-org/cli-${platform}`;
const binPath = require.resolve(`${pkg}/bin/cfc-cli`);
const result = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" });
process.exit(result.status ?? 1);
```

This works but adds significant workflow complexity: every release publishes six packages, each cross-compiled from CI.

### Option C2 — Don't publish to npm

For an internal CLI, an easier path:
- Build artifacts via `pnpm --filter @repo/cli compile:all`
- Upload to Azure Pipelines artifacts, an Azure Blob Storage bucket, or GitHub Releases
- Distribute via `curl | bash` install script (`brew tap`-style)

The CLI is a Bun-compiled standalone binary, not a Node.js package — there's no upside to forcing it through npm if your distribution surface is internal. **Recommended** unless you have a strong reason to use the npm registry as the distribution channel.

### Option C3 — Ship source, require Bun

Publish a normal npm package whose `bin` runs `bun run index.ts` directly. Consumers must have Bun installed. Smallest tarball, simplest publish, but pushes a runtime dependency onto every consumer.

## Step 1 — Pattern recap

> Use Pattern A for config/asset packages, Pattern B for TS libraries, and pick one of C1/C2/C3 for the CLI. Once your package matches the right pattern, continue with Step 2.

## Step 2 — Project `.npmrc`

The repo's root [`.npmrc`](../.npmrc) is committed (no secrets). It points pnpm at the Azure Artifacts feed for your scope and forces auth on every request.

Pick the form that matches how the feed was created:

**Org-scoped feed:**

```ini
@your-org:registry=https://pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/
always-auth=true
```

**Project-scoped feed:**

```ini
@your-org:registry=https://pkgs.dev.azure.com/<ORG>/<PROJECT>/_packaging/<FEED>/npm/registry/
always-auth=true
```

Using the scoped form (`@your-org:registry=...`) leaves the public npm registry as the default for everything else in `node_modules`.

## Step 3 — Authentication

The committed `.npmrc` says **where**; auth is the **who**. Pick the path for your environment.

### macOS / Linux

Edit `~/.npmrc` (your **user** file, not the repo's) and paste in the auth block from Azure Docs, with your PAT base64-encoded in `_password=`:

```ini
; begin auth token
//pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:username=anything
//pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:_password=[BASE64_PAT]
//pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:email=npm requires email but doesn't use it
//pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:username=anything
//pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:_password=[BASE64_PAT]
//pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:email=npm requires email but doesn't use it
; end auth token
```

Encode the PAT once: `printf '<PAT>' | base64`.

### Windows

```bash
npm install -g vsts-npm-auth --registry https://registry.npmjs.com --always-auth false
vsts-npm-auth -config .npmrc
```

`vsts-npm-auth` writes credentials into your user-level `.npmrc` automatically, refreshing them when they expire.

### CI

Handled by Azure Pipelines via the `npmAuthenticate@0` task — see [`azure-pipelines.yml`](../azure-pipelines.yml). No PAT lives in the repo.

## Step 4 — The Changesets loop

Changesets is the source of truth for version bumps and changelogs in this monorepo.

### Author a change

```bash
pnpm changeset
```

Interactive prompt: pick which packages changed, choose the semver bump (`patch` / `minor` / `major`) for each, and write a one-line summary. A new file lands in `.changeset/<random-name>.md` — commit it with your PR.

### Reviewer experience

Reviewers see the changeset file in the diff. They know what's getting bumped and can push back on `major` choices before merge.

### Release

After merge to `main`, run (locally or via CI):

```bash
pnpm changeset version
```

This consumes every pending `.changeset/*.md`, bumps versions in `package.json` files, writes/updates each package's `CHANGELOG.md`, and removes the consumed changesets.

Then publish:

```bash
pnpm changeset publish
```

Or wrapped:

```bash
pnpm release
```

`pnpm release` runs `turbo run build` first to ensure every package's `dist/` is up to date, then publishes only packages whose version isn't already on the feed.

## Step 5 — Consuming a published package

In the consuming repo, mirror the project `.npmrc` so its scope resolves to your feed:

```ini
@your-org:registry=https://pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/
always-auth=true
```

Then:

```bash
npm install @your-org/shared
# or pnpm
pnpm add @your-org/shared
```

The user-level auth setup from Step 3 carries over.

## Step 6 — Verify before publishing (dry run)

Before you flip `private: false` and let CI ship a package to the world, inspect the tarball locally. This is the single best way to catch JIT-vs-compiled mistakes, missing `files`, or accidentally bundled secrets.

```bash
# From the package directory:
cd packages/shared
pnpm pack --dry-run            # lists every file that would ship, no tarball written

# Or write the tarball and inspect it:
pnpm pack
tar -tf your-org-shared-0.1.0.tgz | sort

# Or end-to-end (against the real registry, without committing):
pnpm publish --dry-run --no-git-checks
```

What to confirm in the output:

- [ ] No `.ts` / `.tsx` files unless you intend to ship source.
- [ ] No `node_modules/`, no `.env*`, no `tsconfig.tsbuildinfo`.
- [ ] `dist/index.js` (or wherever `exports` points) is present and non-empty.
- [ ] `dist/index.d.ts` is present if you want consumers to get types.
- [ ] `README.md` and `CHANGELOG.md` are included (consumers see them on the feed).
- [ ] Package size is reasonable. A pure-TS shared lib > 1 MB usually means a misconfigured `files` field.

The shipped tarball is what consumers get — `exports` only controls *resolution* once the files are on disk. If a file isn't in the tarball, `exports` pointing at it gives consumers a 404.

## Step 7 — Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | PAT expired or missing from `~/.npmrc` | Regenerate the PAT, re-encode, paste into `~/.npmrc`. Or rerun `vsts-npm-auth -config .npmrc` on Windows. |
| `403 Forbidden` | PAT lacks **Packaging: Read & write**, or wrong scope/feed in registry URL | Double-check the PAT scopes and the registry URL in `.npmrc`. |
| `EPUBLISHCONFLICT` / "version already exists" | You bumped, then bumped again with the same number, or the changeset was already consumed | `pnpm changeset` to record a new bump. |
| `npm ERR! no auth method available` | `always-auth=true` missing from `.npmrc` | Add it to the project `.npmrc`. |
| Package publishes but consumers can't install it | Consumer repo's `.npmrc` uses unscoped `registry=` instead of `@your-org:registry=` | Switch the consumer to the scoped form so npm only routes your scope through Azure Artifacts. |
| Consumer gets `ERR_UNKNOWN_FILE_EXTENSION ".ts"` or `Cannot find module` for a `.tsx` import | Package shipped TypeScript source (JIT shape) to a consumer without a TS-aware bundler | Convert the package to Pattern B (compiled `dist/`), or document that consumers must use Next.js / Vite / Bun. |
| `Cannot find module '@your-org/shared/something'` after publish | The subpath wasn't declared in `exports`, or `files` excluded the target file | Add the subpath to `exports`, add the directory to `files`, and re-run `pnpm pack --dry-run` to confirm. |

## Appendix — Renaming the `@repo` scope

This monorepo ships with every package under `@repo/*`, which works for workspace consumption but isn't a real registry scope. Before publishing your first package, rename across the workspace:

1. In each `packages/*/package.json`, change `"name": "@repo/<pkg>"` → `"name": "@your-org/<pkg>"`.
2. Update import statements across the apps (`apps/web/app/page.tsx`, `apps/docs/app/page.tsx`, etc.) — find/replace `@repo/` → `@your-org/`.
3. Update `workspace:*` references in dependent packages — they're keyed by package name.
4. Run `pnpm install` to refresh the lockfile.
5. Verify with `pnpm turbo run build` and `pnpm turbo run check-types`.
