import { describe, expect, test } from "bun:test";
import {
  mobileViewportWarningMediaQuery,
  shouldShowMobileViewportWarning,
} from "./MobileViewportWarning";

describe("MobileViewportWarning", () => {
  test("warns only below the supported desktop minimum width", () => {
    expect(
      shouldShowMobileViewportWarning({
        dismissed: false,
        isNarrowViewport: true,
      }),
    ).toBe(true);

    expect(
      shouldShowMobileViewportWarning({
        dismissed: false,
        isNarrowViewport: false,
      }),
    ).toBe(false);
  });

  test("keeps the warning hidden after the user dismisses it permanently", () => {
    expect(
      shouldShowMobileViewportWarning({
        dismissed: true,
        isNarrowViewport: true,
      }),
    ).toBe(false);
  });

  test("uses 520px as the desktop minimum boundary", () => {
    expect(mobileViewportWarningMediaQuery).toBe("(max-width: 519px)");
  });
});
