# @repo/cli

Internal CLI scaffold built on Bun, [Commander](https://github.com/tj/commander.js), and [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js).

## Prerequisites

- [Bun](https://bun.sh) on `PATH` (the runtime and the build target). pnpm drives dependency installs at the repo root.

## Scripts

Run from the repo root using a pnpm filter, or from `packages/cli/` directly.

```bash
# Run the CLI in dev (Bun executes index.ts directly, no build step)
pnpm --filter @repo/cli start greet World
pnpm --filter @repo/cli start greet         # interactive prompt fallback

# Type-check / lint (participates in turbo run check-types | lint)
pnpm --filter @repo/cli check-types
pnpm --filter @repo/cli lint

# Compile a standalone binary for the host platform
pnpm --filter @repo/cli compile
./packages/cli/dist/cfc-cli greet Seth

# Cross-compile every supported target into dist/
pnpm --filter @repo/cli compile:all
```

The compiled binary is exposed via the `bin.cfc` entry in `package.json`. Rename it to whatever fits your team — update `bin`, the `--outfile` flags in the compile scripts, and call it a day.

## Architecture

- **Commander** owns command/subcommand structure, argument parsing, and `--help`. The `program` instance in `index.ts` is the root; subcommands attach via `.command().action()`.
- **@inquirer/prompts** is used inside command actions when an argument is missing. Wrap prompt calls in `try/catch` and exit cleanly on `ExitPromptError` (Ctrl+C).
- **Bun** is the runtime, bundler, and packager. Use `Bun.file()` for file I/O and `import { $ } from "bun"` for shell commands.

### Suggested layout as commands grow

```
index.ts          # Entry: create program, register commands, call program.parse()
commands/         # One file per command, each exports a function that takes a Command
lib/              # Shared utilities (config, prompts, formatting)
```

## Conventions

- Commands accept optional arguments and fall back to interactive prompts when an argument is missing (see the `greet` command).
- TypeScript strict mode is on; avoid `any`.
- No separate build step for development — Bun runs `.ts` directly.
