import { describe, expect, test } from "bun:test";
import { getRankBadgePaintSteps } from "./rank-badge-canvas";

describe("rank badge canvas painting", () => {
  test("paints immediately before repainting after fonts load", () => {
    expect(getRankBadgePaintSteps(true)).toEqual(["immediate", "font-ready"]);
  });

  test("still paints once when font loading is unavailable", () => {
    expect(getRankBadgePaintSteps(false)).toEqual(["immediate"]);
  });
});
