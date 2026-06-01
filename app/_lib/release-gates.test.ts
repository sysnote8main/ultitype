import { describe, expect, test } from "bun:test";
import { canPlayProductionMode, isProductionModePlayableInBuild } from "./release-gates";

describe("release gates", () => {
  test("blocks production mode in production builds", () => {
    expect(isProductionModePlayableInBuild("production")).toBe(false);
  });

  test("allows production mode only on the development server", () => {
    expect(isProductionModePlayableInBuild("development")).toBe(true);
    expect(isProductionModePlayableInBuild("test")).toBe(false);
    expect(isProductionModePlayableInBuild(undefined)).toBe(false);
  });

  test("keeps production mode unplayable in production even when unlocked", () => {
    expect(canPlayProductionMode({ nodeEnv: "production", unlocked: true })).toBe(false);
  });

  test("keeps production mode unplayable on the dev server until unlocked", () => {
    expect(canPlayProductionMode({ nodeEnv: "development", unlocked: false })).toBe(false);
  });
});
