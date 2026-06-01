import { describe, expect, test } from "bun:test";
import { getModePath, getRouteModeId } from "./mode-routes";

describe("mode routes", () => {
  test("maps each practice mode to its own page", () => {
    expect(getModePath("practice-accuracy")).toBe("/practice/accuracy");
    expect(getModePath("practice-flow")).toBe("/practice/flow");
    expect(getModePath("practice-speed")).toBe("/practice/speed");
  });

  test("maps each production mode to its own page", () => {
    expect(getModePath("production-ime-off")).toBe("/production/ime-off");
    expect(getModePath("production-ime-on")).toBe("/production/ime-on");
  });

  test("rejects mismatched or unknown route segments", () => {
    expect(getRouteModeId("practice", "ime-off")).toBeNull();
    expect(getRouteModeId("production", "speed")).toBeNull();
    expect(getRouteModeId("arcade", "flow")).toBeNull();
  });
});
