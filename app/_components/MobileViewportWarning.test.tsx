import { describe, expect, test } from "bun:test";
import {
  calculateMobileViewportWarningStyle,
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

  test("positions the warning inside the visible mobile viewport", () => {
    expect(
      calculateMobileViewportWarningStyle({
        offsetLeft: 0,
        offsetTop: 0,
        width: 390,
        height: 700,
        layoutHeight: 700,
      }),
    ).toMatchObject({
      "--mobile-viewport-warning-left": "14px",
      "--mobile-viewport-warning-bottom": "14px",
      "--mobile-viewport-warning-width": "362px",
    });
  });

  test("keeps the warning pinned to a horizontally shifted visual viewport", () => {
    expect(
      calculateMobileViewportWarningStyle({
        offsetLeft: 130,
        offsetTop: 0,
        width: 390,
        height: 700,
        layoutHeight: 700,
      }),
    ).toMatchObject({
      "--mobile-viewport-warning-left": "144px",
      "--mobile-viewport-warning-bottom": "14px",
      "--mobile-viewport-warning-width": "362px",
    });
  });
});
