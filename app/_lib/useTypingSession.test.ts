import { describe, expect, test } from "bun:test";
import { getDirectInputKey } from "./useTypingSession";
import type { DirectKeyEvent } from "./types";

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
