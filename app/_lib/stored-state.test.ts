import { describe, expect, test } from "bun:test";
import { shouldPersistStoredState } from "./stored-state";

describe("stored state persistence", () => {
  test("does not persist the initial state before storage hydration finishes", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: false,
        skipNextPersist: false,
      }),
    ).toBe(false);
  });

  test("persists after hydration unless the next persist was explicitly skipped", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: false,
      }),
    ).toBe(true);

    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: true,
      }),
    ).toBe(false);
  });
});
