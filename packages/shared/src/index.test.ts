import { describe, expect, it } from "vitest";
import {
  formatGreeting,
  getMonorepoTagline,
  getSharedFeatures,
} from "./index.js";

describe("formatGreeting", () => {
  it("uses the default name when none is provided", () => {
    expect(formatGreeting("web")).toContain("Hello, team!");
  });

  it("includes the app name in the message", () => {
    expect(formatGreeting("docs", "Seth")).toBe(
      'Hello, Seth! You\'re looking at the "docs" app, powered by @repo/shared.',
    );
  });
});

describe("getMonorepoTagline", () => {
  it("is non-empty", () => {
    expect(getMonorepoTagline().length).toBeGreaterThan(0);
  });
});

describe("getSharedFeatures", () => {
  it("returns at least one feature with title and description", () => {
    const features = getSharedFeatures();
    expect(features.length).toBeGreaterThan(0);
    for (const f of features) {
      expect(f.title).toBeTruthy();
      expect(f.description).toBeTruthy();
    }
  });
});
