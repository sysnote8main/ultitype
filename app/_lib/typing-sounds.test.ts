import { describe, expect, test } from "bun:test";
import {
  getFinishSoundKind,
  getSoundPlaybackConfig,
  getTypingSoundSource,
} from "./typing-sounds";

describe("getTypingSoundSource", () => {
  test("uses switch_002 for mistakes", () => {
    expect(getTypingSoundSource("mistake", () => 0)).toBe("/sounds/switch_002.ogg");
    expect(getTypingSoundSource("mistake", () => 0.99)).toBe("/sounds/switch_002.ogg");
  });

  test("randomly chooses click1 or click2 for normal keystrokes", () => {
    expect(getTypingSoundSource("normal", () => 0)).toBe("/sounds/click1.ogg");
    expect(getTypingSoundSource("normal", () => 0.49)).toBe("/sounds/click1.ogg");
    expect(getTypingSoundSource("normal", () => 0.5)).toBe("/sounds/click2.ogg");
    expect(getTypingSoundSource("normal", () => 0.99)).toBe("/sounds/click2.ogg");
  });

  test("uses confirmation_001 for normal session completion", () => {
    expect(getTypingSoundSource("finish", () => 0)).toBe("/sounds/confirmation_001.ogg");
  });

  test("uses confirmation_004 for new best ratings", () => {
    expect(getTypingSoundSource("record", () => 0)).toBe("/sounds/confirmation_004.ogg");
  });

  test("uses select_005 for UI selection actions", () => {
    expect(getTypingSoundSource("select", () => 0)).toBe("/sounds/select_005.ogg");
  });

  test("uses minimize_008 for back actions", () => {
    expect(getTypingSoundSource("back", () => 0)).toBe("/sounds/minimize_008.ogg");
  });
});

describe("getFinishSoundKind", () => {
  test("returns record when a practice score updates the best practice rating", () => {
    expect(
      getFinishSoundKind({
        modeGroup: "practice",
        score: 501,
        bestPracticeScore: 500,
        bestProductionScore: 900,
      }),
    ).toBe("record");
  });

  test("returns record when a production score updates the best production rating", () => {
    expect(
      getFinishSoundKind({
        modeGroup: "production",
        score: 901,
        bestPracticeScore: 1200,
        bestProductionScore: 900,
      }),
    ).toBe("record");
  });

  test("returns finish when the score does not exceed the existing best rating", () => {
    expect(
      getFinishSoundKind({
        modeGroup: "practice",
        score: 500,
        bestPracticeScore: 500,
        bestProductionScore: 900,
      }),
    ).toBe("finish");
  });
});

describe("getSoundPlaybackConfig", () => {
  test("uses the configured volume for both typing and UI sounds", () => {
    expect(
      getSoundPlaybackConfig("normal", {
        soundVolume: 0.42,
        typingSoundEnabled: true,
        uiSoundEnabled: true,
      }),
    ).toEqual({ shouldPlay: true, volume: 0.42 });

    expect(
      getSoundPlaybackConfig("select", {
        soundVolume: 0.42,
        typingSoundEnabled: true,
        uiSoundEnabled: true,
      }),
    ).toEqual({ shouldPlay: true, volume: 0.42 });
  });

  test("clamps volume into the supported range", () => {
    expect(
      getSoundPlaybackConfig("normal", {
        soundVolume: 2,
        typingSoundEnabled: true,
        uiSoundEnabled: true,
      }).volume,
    ).toBe(1);

    expect(
      getSoundPlaybackConfig("normal", {
        soundVolume: -1,
        typingSoundEnabled: true,
        uiSoundEnabled: true,
      }).volume,
    ).toBe(0);
  });

  test("separately disables typing and UI sounds", () => {
    expect(
      getSoundPlaybackConfig("mistake", {
        soundVolume: 1,
        typingSoundEnabled: false,
        uiSoundEnabled: true,
      }).shouldPlay,
    ).toBe(false);

    expect(
      getSoundPlaybackConfig("select", {
        soundVolume: 1,
        typingSoundEnabled: true,
        uiSoundEnabled: false,
      }).shouldPlay,
    ).toBe(false);
  });
});
