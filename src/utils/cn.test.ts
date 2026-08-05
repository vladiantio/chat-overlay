import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy classes with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("skips falsy values", () => {
    expect(cn("a", false, null, undefined, "", 0, "b")).toBe("a b");
  });

  it("returns an empty string for no classes", () => {
    expect(cn()).toBe("");
    expect(cn(false, null)).toBe("");
  });
});
