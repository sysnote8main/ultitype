import { describe, expect, test } from "bun:test";
import {
  getRankBadgeBorderWidth,
  getRankBadgeGlossAngleDegrees,
  getRankBadgeSpec,
  getRankBadgeTextFont,
} from "./rank-badge";

describe("getRankBadgeSpec", () => {
  test("renders no rank as a gray circle with a white center line", () => {
    expect(getRankBadgeSpec("-")).toMatchObject({
      borderColor: null,
      fillColor: "#8a8a8a",
      foregroundColor: "#ffffff",
      glossy: false,
      shape: "none",
      text: "-",
    });
  });

  test("renders G0 through M ranks as white round badges with colored borders", () => {
    expect(getRankBadgeSpec("G0")).toMatchObject({
      borderColor: "#8a8a8a",
      fillColor: "#ffffff",
      foregroundColor: "#2a2a2a",
      glossy: false,
      shape: "round",
      text: "G0",
    });

    expect(getRankBadgeSpec("M6")).toMatchObject({
      borderColor: "#c792ff",
      fillColor: "#ffffff",
      foregroundColor: "#2a2a2a",
      glossy: true,
      shape: "round",
      text: "M6",
    });
  });

  test("adds a glossy treatment to S rank while keeping the round bordered badge", () => {
    expect(getRankBadgeSpec("S3")).toMatchObject({
      borderColor: "#f2b84b",
      fillColor: "#ffffff",
      foregroundColor: "#2a2a2a",
      glossy: true,
      shape: "round",
      text: "S3",
    });
  });

  test("renders GM and higher ranks as filled square badges with white text", () => {
    expect(getRankBadgeSpec("GM0")).toMatchObject({
      borderColor: null,
      fillColor: "#7b3ff2",
      foregroundColor: "#ffffff",
      glossy: true,
      shape: "square",
      text: "GM0",
    });

    expect(getRankBadgeSpec("UM")).toMatchObject({
      borderColor: null,
      foregroundColor: "#ffffff",
      glossy: true,
      shape: "square",
      text: "UM",
    });
  });

  test("uses a heavier border for round bordered rank badges", () => {
    expect(getRankBadgeBorderWidth(36)).toBeGreaterThanOrEqual(5);
  });

  test("uses Quantico as the primary canvas font", () => {
    expect(getRankBadgeTextFont(20)).toBe('700 20px "Quantico", "Trispace", Arial, sans-serif');
  });

  test("applies glossy light as a diagonal band", () => {
    expect(getRankBadgeGlossAngleDegrees()).toBe(-22);
  });
});
