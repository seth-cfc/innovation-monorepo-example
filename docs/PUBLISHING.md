# Publishing packages to Azure Artifacts

This monorepo ships every workspace package as `@repo/*` and marks them all `private: true` so nothing leaks to a registry by accident. When you're ready to ship one of them — or a brand-new package — to your team's Azure Artifacts npm feed, this is the loop.

## Prerequisites

- An Azure DevOps **organization** + **project** with an **Artifacts feed** already created.
- A scope reserved in that feed (recommended: match your org name, e.g. `@your-org`). Note: this repo currently uses `@repo` as a workspace-only placeholder — see the appendix on renaming.
- A **Personal Access Token (PAT)** with **Packaging: Read & write** scope. Never commit a PAT.
- Locally: Node 18+, `pnpm@9`, and (if on Windows) Node-installable `vsts-npm-auth`.

## Step 1 — Anatomy of a publishable package

Every package in `packages/*` follows the same skeleton. To make one publishable, your `package.json` needs the keys below. The closest existing template is [`packages/shared/package.json`](../packages/shared/package.json) — flip `private` to `false` and add `publishConfig`.

```json
{
  "name": "@your-org/shared",
  "version": "0.1.0",
  "type": "module",
  "private": false,
  "license": "UNLICENSED",
  "repository": {
    "type": "git",
    "url": "https://dev.azure.com/<ORG>/<PROJECT>/_git/innovation-monorepo-example"
  },
  "exports": {
    ".": "./src/index.ts"
  },
  "files": ["src", "README.md"],
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
- `publishConfig.registry` — pins this package to your Azure Artifacts feed even when a developer's default registry is npmjs.org.

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

## Step 6 — Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | PAT expired or missing from `~/.npmrc` | Regenerate the PAT, re-encode, paste into `~/.npmrc`. Or rerun `vsts-npm-auth -config .npmrc` on Windows. |
| `403 Forbidden` | PAT lacks **Packaging: Read & write**, or wrong scope/feed in registry URL | Double-check the PAT scopes and the registry URL in `.npmrc`. |
| `EPUBLISHCONFLICT` / "version already exists" | You bumped, then bumped again with the same number, or the changeset was already consumed | `pnpm changeset` to record a new bump. |
| `npm ERR! no auth method available` | `always-auth=true` missing from `.npmrc` | Add it to the project `.npmrc`. |
| Package publishes but consumers can't install it | Consumer repo's `.npmrc` uses unscoped `registry=` instead of `@your-org:registry=` | Switch the consumer to the scoped form so npm only routes your scope through Azure Artifacts. |

## Appendix — Renaming the `@repo` scope

This monorepo ships with every package under `@repo/*`, which works for workspace consumption but isn't a real registry scope. Before publishing your first package, rename across the workspace:

1. In each `packages/*/package.json`, change `"name": "@repo/<pkg>"` → `"name": "@your-org/<pkg>"`.
2. Update import statements across the apps (`apps/web/app/page.tsx`, `apps/docs/app/page.tsx`, etc.) — find/replace `@repo/` → `@your-org/`.
3. Update `workspace:*` references in dependent packages — they're keyed by package name.
4. Run `pnpm install` to refresh the lockfile.
5. Verify with `pnpm turbo run build` and `pnpm turbo run check-types`.
