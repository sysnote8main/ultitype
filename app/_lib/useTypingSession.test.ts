import { describe, expect, test } from "bun:test";
import { initialSettings, initialStats } from "./constants";
import {
  applyAutoRetireScorePenalty,
  countTrailingMistypes,
  getDirectInputKey,
  shouldAutoRetireSession,
} from "./useTypingSession";
import type { DirectKeyEvent, KeyStabilitySample } from "./types";

function keyEvent(input: Partial<DirectKeyEvent>): DirectKeyEvent {
  return {
    code: "",
    key: "",
    preventDefault: () => undefined,
    shiftKey: false,
    ...input,
  };
}

describe("getDirectInputKey", () => {
  test("uses printable key values when IME is off", () => {
    expect(getDirectInputKey(keyEvent({ code: "KeyN", key: "n" }))).toBe("n");
    expect(getDirectInputKey(keyEvent({ code: "Backspace", key: "Backspace" }))).toBe(
      "Backspace",
    );
  });

  test("falls back to physical key codes when IME reports Process", () => {
    expect(getDirectInputKey(keyEvent({ code: "KeyN", key: "Process" }))).toBe("n");
    expect(getDirectInputKey(keyEvent({ code: "KeyY", key: "Process" }))).toBe("y");
    expect(getDirectInputKey(keyEvent({ code: "KeyU", key: "Process" }))).toBe("u");
    expect(getDirectInputKey(keyEvent({ code: "KeyA", key: "Process", shiftKey: true }))).toBe(
      "A",
    );
    expect(getDirectInputKey(keyEvent({ code: "Space", key: "Process" }))).toBe(" ");
    expect(getDirectInputKey(keyEvent({ code: "Backspace", key: "Process" }))).toBe(
      "Backspace",
    );
  });

  test("falls back to punctuation codes for direct romaji prompts", () => {
    expect(getDirectInputKey(keyEvent({ code: "Period", key: "Process" }))).toBe(".");
    expect(getDirectInputKey(keyEvent({ code: "Slash", key: "Process", shiftKey: true }))).toBe(
      "?",
    );
  });

  test("ignores navigation and unknown non-printable keys", () => {
    expect(getDirectInputKey(keyEvent({ code: "ShiftLeft", key: "Shift" }))).toBeNull();
    expect(getDirectInputKey(keyEvent({ code: "Convert", key: "Process" }))).toBeNull();
  });
});

function keySample(
  id: number,
  input: Partial<KeyStabilitySample>,
): KeyStabilitySample {
  return {
    id,
    key: "a",
    intervalMs: null,
    isCorrect: true,
    kind: "input",
    promptIndex: 0,
    at: id,
    ...input,
  };
}

describe("auto retire performance conditions", () => {
  test("counts only trailing wrong input keys as consecutive mistypes", () => {
    expect(
      countTrailingMistypes([
        keySample(0, { isCorrect: false, key: "x" }),
        keySample(1, { isCorrect: true, key: "a" }),
        keySample(2, { isCorrect: false, key: "y" }),
        keySample(3, { isCorrect: false, key: "z" }),
      ]),
    ).toBe(2);

    expect(
      countTrailingMistypes([
        keySample(0, { isCorrect: false, key: "x" }),
        keySample(1, { isCorrect: true, key: "Backspace", kind: "correction" }),
      ]),
    ).toBe(0);
  });

  test("retires when any enabled auto retire condition is met", () => {
    expect(
      shouldAutoRetireSession({
        accuracy: 0.95,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 2,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 2,
          keyStabilityHistory: [
            keySample(0, { isCorrect: false, key: "x" }),
            keySample(1, { isCorrect: false, key: "y" }),
          ],
        },
      }),
    ).toBe(true);

    expect(
      shouldAutoRetireSession({
        accuracy: 0.89,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 0,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 20,
          keyStabilityHistory: [keySample(0, { isCorrect: true, key: "a" })],
        },
      }),
    ).toBe(true);
  });

  test("does not retire for disabled performance conditions or before accuracy exists", () => {
    expect(
      shouldAutoRetireSession({
        accuracy: 0,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 0,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: initialStats,
      }),
    ).toBe(false);
  });

  test("waits for at least 20 character attempts before retiring by accuracy border", () => {
    expect(
      shouldAutoRetireSession({
        accuracy: 0.5,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 0,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 19,
        },
      }),
    ).toBe(false);
  });

  test("applies a 0.7 rating multiplier and caps retired scores at the A6 score", () => {
    expect(applyAutoRetireScorePenalty(1_000)).toBe(700);
    expect(applyAutoRetireScorePenalty(10_000)).toBe(4_820);
  });
});
