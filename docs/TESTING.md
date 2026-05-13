# Testing

Two test runners coexist in this monorepo, picked by what the package actually runs on:

| Package type | Runner | Why |
|---|---|---|
| TypeScript libraries (`@repo/shared`, `@repo/ui`) | [Vitest](https://vitest.dev) | Fast, ESM-native, mature React Testing Library integration via `jsdom`. |
| Bun CLI (`@repo/cli`) | [`bun:test`](https://bun.sh/docs/cli/test) | The CLI runtime *is* Bun. Using Vitest would introduce a Node toolchain just to test code that ships through Bun. |

Both runners use the same `describe` / `it` / `expect` shape, so day-to-day authoring is identical.

## Running tests

```bash
# All packages, parallel via turbo
pnpm test                       # turbo run test

# One package
pnpm --filter @repo/ui test
pnpm --filter @repo/shared test
pnpm --filter @repo/cli test

# Watch mode (skip turbo, call the runner directly)
pnpm --filter @repo/ui exec vitest          # watch UI tests
pnpm --filter @repo/cli exec bun test --watch
```

The root `pnpm test` is what CI runs ([`azure-pipelines.yml`](../azure-pipelines.yml)). It executes through Turborepo so cached packages skip their suites.

## File layout

- **Co-located** with the source they test — `src/button.tsx` ↔ `src/button.test.tsx`.
- **Never** a separate `__tests__/` directory.
- File extension matches the code under test: `.test.ts` for plain TS, `.test.tsx` for React components.

## Vitest setup (libraries)

Each TS library has:

```
packages/<name>/
├── vitest.config.ts        # runner config
├── vitest.setup.ts         # imports `@testing-library/jest-dom/vitest` for React libs
└── src/
    ├── <code>.ts(x)
    └── <code>.test.ts(x)
```

`vitest.config.ts` for a React library:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

For a pure-logic library (`@repo/shared`), drop the React plugin and `jsdom` — use the default `node` environment.

### Including setup in tsconfig

If your tests use `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveAttribute`, …), `tsc` needs to see the setup file or it won't pick up the type augmentations. Add it to `include`:

```jsonc
// packages/ui/tsconfig.json
{
  "include": ["src", "vitest.setup.ts", "vitest.config.ts"]
}
```

## Bun test setup (CLI)

`@repo/cli` runs `bun test` directly — no config file. Tests live alongside source:

```
packages/cli/
├── index.ts
├── index.test.ts           # uses `import { describe, it, expect } from "bun:test"`
└── tsconfig.json           # include adds `*.test.ts`
```

For tests that spawn the CLI itself, use `Bun.$`:

```ts
import { $ } from "bun";

const out = await $`bun run index.ts greet Seth`.text();
```

## What to test

Per the repo's global conventions ([`~/.claude/rules/tests.md`](https://example.com/global-rules)):

- **Prefer integration tests over heavily mocked unit tests.** For UI: render the real component, assert on the DOM. For shared utils: call the function with realistic inputs, assert the output.
- **Don't mock internal functions.** Only mock at system boundaries (network, filesystem, time).
- **Don't rewrite failing tests to pass.** Flag the failure.

Coverage isn't enforced yet — the repo is small enough that "every public export has at least one test" is the working bar. Revisit once a package crosses ~10 exports.

## Turbo cache

Tests participate in Turbo's task graph. Inputs are declared in [`turbo.json`](../turbo.json):

```json
"test": {
  "dependsOn": ["^test"],
  "inputs": ["src/**", "*.ts", "*.tsx", "vitest.config.*", "vitest.setup.*", "package.json"]
}
```

Touching a README or an unrelated config won't bust the test cache. If you add a new test-relevant config file (e.g. `playwright.config.ts` someday), extend `inputs`.

## CI

The full validation chain runs on every PR into `main` and every push to `main`:

```
format:check → check-types → lint → test → build
```

See [`docs/CI.md`](CI.md) for the full pipeline shape and why some jobs live in Azure Pipelines and some in GitHub Actions.
