import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Code } from "./code";

describe("Code", () => {
  it("renders children inside a <code> element", () => {
    render(<Code>npm install</Code>);
    const el = screen.getByText("npm install");
    expect(el.tagName).toBe("CODE");
  });

  it("merges className with base styles instead of replacing them", () => {
    render(<Code className="bg-red-500">x</Code>);
    const el = screen.getByText("x");
    expect(el.className).toContain("bg-red-500");
    expect(el.className).toContain("rounded"); // base class survives
  });
});
