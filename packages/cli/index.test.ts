import { describe, expect, it } from "bun:test";
import { $ } from "bun";

describe("cfc-cli greet", () => {
  it("greets a named user via positional arg", async () => {
    const out = await $`bun run index.ts greet Seth`.text();
    expect(out.trim()).toBe("Hello, Seth!");
  });

  it("--help exits 0 and prints usage", async () => {
    const result = await $`bun run index.ts --help`.quiet();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("greet");
  });
});
