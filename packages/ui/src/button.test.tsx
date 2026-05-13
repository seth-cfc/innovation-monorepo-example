import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("forwards onClick from consumer", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    screen.getByRole("button", { name: "Tap" }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("defaults type to button so it does not submit forms accidentally", () => {
    render(<Button>Cancel</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("merges consumer className via cn (does not replace base classes)", () => {
    render(<Button className="custom-token">Styled</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-token");
    expect(btn.className).toContain("inline-flex"); // base class survives
  });
});
