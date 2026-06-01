import { describe, expect, test } from "bun:test";
import { APP_VERSION, getAppVersionLabel } from "./version";

describe("app version label", () => {
  test("prefixes the version label on the dev server", () => {
    expect(getAppVersionLabel("development")).toBe(`DEVSRV-v${APP_VERSION}`);
  });

  test("does not prefix the version label outside the dev server", () => {
    expect(getAppVersionLabel("production")).toBe(`v${APP_VERSION}`);
    expect(getAppVersionLabel("test")).toBe(`v${APP_VERSION}`);
  });
});
