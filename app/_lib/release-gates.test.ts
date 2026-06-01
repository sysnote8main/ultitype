import { describe, expect, test } from "bun:test";
import { canPlayProductionMode, isProductionModePlayableInBuild } from "./release-gates";

describe("release gates", () => {
  test("blocks production mode in production builds", () => {
    expect(isProductionModePlayableInBuild("production")).toBe(false);
  });

  test("allows production mode outside production builds", () => {
    expect(isProductionModePlayableInBuild("development")).toBe(true);
    expect(isProductionModePlayableInBuild("test")).toBe(true);
  });

  test("keeps production mode unplayable in production even when unlocked", () => {
    expect(canPlayProductionMode({ nodeEnv: "production", unlocked: true })).toBe(false);
  });
});
