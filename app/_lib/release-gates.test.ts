import { describe, expect, test } from "bun:test";
import { canPlayProductionMode, isProductionModePlayableInBuild } from "./release-gates";

describe("release gates", () => {
  test("allows production IME-off mode in production builds", () => {
    expect(
      isProductionModePlayableInBuild({
        modeId: "production-ime-off",
        nodeEnv: "production",
      }),
    ).toBe(true);
  });

  test("keeps production IME-on mode limited to the development server", () => {
    expect(
      isProductionModePlayableInBuild({
        modeId: "production-ime-on",
        nodeEnv: "development",
      }),
    ).toBe(true);
    expect(
      isProductionModePlayableInBuild({
        modeId: "production-ime-on",
        nodeEnv: "production",
      }),
    ).toBe(false);
    expect(
      isProductionModePlayableInBuild({
        modeId: "production-ime-on",
        nodeEnv: "test",
      }),
    ).toBe(false);
    expect(
      isProductionModePlayableInBuild({
        modeId: "production-ime-on",
        nodeEnv: undefined,
      }),
    ).toBe(false);
  });

  test("allows unlocked production IME-off mode in production", () => {
    expect(
      canPlayProductionMode({
        modeId: "production-ime-off",
        nodeEnv: "production",
        unlocked: true,
      }),
    ).toBe(true);
  });

  test("keeps production IME-on mode unplayable in production even when unlocked", () => {
    expect(
      canPlayProductionMode({
        modeId: "production-ime-on",
        nodeEnv: "production",
        unlocked: true,
      }),
    ).toBe(false);
  });

  test("keeps production mode unplayable on the dev server until unlocked", () => {
    expect(
      canPlayProductionMode({
        modeId: "production-ime-off",
        nodeEnv: "development",
        unlocked: false,
      }),
    ).toBe(false);
  });
});
