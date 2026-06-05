import { describe, expect, test } from "bun:test";
import {
  commitNumberControlDraft,
  shouldPropagateNumberControlDraft,
} from "./InputSettingsSections";

describe("InputSettingsSections number controls", () => {
  test("keeps out-of-range font size drafts local while typing", () => {
    expect(shouldPropagateNumberControlDraft("2", 10, 48)).toBe(false);
    expect(shouldPropagateNumberControlDraft("20", 10, 48)).toBe(true);
  });

  test("clamps font size drafts only when committed", () => {
    expect(commitNumberControlDraft("2", 10, 48, 1)).toBe("10");
    expect(commitNumberControlDraft("20", 10, 48, 1)).toBe("20");
    expect(commitNumberControlDraft("102", 10, 48, 1)).toBe("48");
  });

  test("supports decimal drafts for ratio settings", () => {
    expect(shouldPropagateNumberControlDraft("0.", 0.2, 1)).toBe(false);
    expect(shouldPropagateNumberControlDraft("0.4", 0.2, 1)).toBe(true);
    expect(commitNumberControlDraft("0.4", 0.2, 1, 0.01)).toBe("0.4");
  });
});
