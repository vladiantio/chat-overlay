import { describe, expect, it } from "vitest";

import { generateColorFromUsername } from "./color";

describe("generateColorFromUsername", () => {
  it("is deterministic for the same username", () => {
    expect(generateColorFromUsername("vladiantio")).toBe(
      generateColorFromUsername("vladiantio"),
    );
  });

  it("produces a valid hsl string", () => {
    expect(generateColorFromUsername("vladiantio")).toMatch(
      /^hsl\(\d{1,3}, 70%, 50%\)$/,
    );
  });

  it("keeps the hue within [0, 360)", () => {
    const hue = Number.parseInt(
      generateColorFromUsername("vladiantio").match(/\d+/)![0],
      10,
    );
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it("is stable per username", () => {
    expect(generateColorFromUsername("pogchamp_fan")).toBe(
      generateColorFromUsername("pogchamp_fan"),
    );
    expect(generateColorFromUsername("youtube_viewer")).toBe(
      generateColorFromUsername("youtube_viewer"),
    );
  });
});
