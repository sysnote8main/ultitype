import { describe, expect, test } from "bun:test";
import {
  applyDirectKey,
  calculateMetrics,
  createRomajiInputTarget,
  getRomajiGuideDisplay,
  getRank,
  getRankProgression,
  getRankRequiredScore,
  isImeSubmissionMatch,
  isProductionUnlocked,
  modes,
  shouldAcceptTextInput,
} from "./typing";

describe("calculateMetrics", () => {
  test("uses all keystrokes for keys per second and character attempts for accuracy", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 10,
      keystrokes: 70,
      characterAttempts: 60,
      correctCharacters: 54,
      mistakes: 6,
      intervals: [120, 130, 125],
      accuracyExponent: 3,
    });

    expect(metrics.keysPerSecond).toBeCloseTo(7);
    expect(metrics.accuracy).toBeCloseTo(0.9);
    expect(metrics.score).toBeCloseTo(5103);
  });

  test("keeps consistency usable when fast typing has natural interval variance", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 2,
      keystrokes: 16,
      characterAttempts: 16,
      correctCharacters: 16,
      mistakes: 0,
      intervals: [85, 170, 95, 210, 120, 180, 90, 160, 115, 190, 100, 150, 650],
      accuracyExponent: 3,
    });

    expect(metrics.consistency).toBeGreaterThanOrEqual(0.65);
  });
});

describe("rank", () => {
  test("treats scores under 500 as unranked and 500 through 589 as G0", () => {
    expect(getRank(0).label).toBe("-");
    expect(getRank(499).label).toBe("-");
    expect(getRank(500).label).toBe("G0");
    expect(getRank(589).label).toBe("G0");
    expect(getRank(590).label).toBe("G1");
  });

  test("unlocks production at A0", () => {
    expect(isProductionUnlocked(4280)).toBe(true);
    expect(isProductionUnlocked(4279)).toBe(false);
  });

  test("exposes required score for rank progression", () => {
    expect(getRankRequiredScore(0)).toBe(500);
    expect(getRankRequiredScore(1)).toBe(590);
    expect(getRankRequiredScore(2)).toBe(680);
    expect(getRankRequiredScore(42)).toBe(4280);

    const progression = getRankProgression();

    expect(progression[0]).toMatchObject({ label: "G0", requiredScore: 500 });
    expect(progression.find((rank) => rank.label === "A0")?.requiredScore).toBe(4280);
    expect(progression.at(-1)).toMatchObject({ label: "UM" });
  });
});

describe("IME submission matching", () => {
  test("allows Japanese punctuation variants but preserves alphabet differences", () => {
    expect(isImeSubmissionMatch("高速入力，正確性。", "高速入力、正確性。")).toBe(true);
    expect(isImeSubmissionMatch("Type", "type")).toBe(false);
  });
});

describe("applyDirectKey", () => {
  function typeDirectKeys(target: ReturnType<typeof createRomajiInputTarget>, keys: string[]) {
    return keys.reduce(
      (state, key) =>
        applyDirectKey({
          state,
          key,
          target,
          lockMistakes: false,
        }).state,
      {
        input: "",
        scoredInputLength: 0,
        mistakeDebt: 0,
        characterAttempts: 0,
        correctCharacters: 0,
        mistakes: 0,
        completedPrompts: 0,
      },
    );
  }

  test("accepts syllabic n as n or nn but never accepts n apostrophe", () => {
    const target = createRomajiInputTarget("han'ei", {
      preset: "shortest",
      selections: {},
    });

    expect(target.guide).toBe("hanei");
    expect(typeDirectKeys(target, Array.from("hanei")).completedPrompts).toBe(1);
    expect(typeDirectKeys(target, Array.from("hannei")).completedPrompts).toBe(1);

    const apostrophe = typeDirectKeys(target, Array.from("han'"));

    expect(apostrophe.completedPrompts).toBe(0);
    expect(apostrophe.input).toBe("han");
    expect(apostrophe.mistakes).toBe(1);

    const rejected = typeDirectKeys(target, Array.from("han'ei"));

    expect(rejected.completedPrompts).toBe(1);
    expect(rejected.mistakes).toBe(1);
  });

  test("allows n and nn for syllabic n before consonants", () => {
    const target = createRomajiInputTarget("bunshou", {
      preset: "hepburn",
      selections: {},
    });

    expect(typeDirectKeys(target, Array.from("bunshou")).completedPrompts).toBe(1);
    expect(typeDirectKeys(target, Array.from("bunnshou")).completedPrompts).toBe(1);
  });

  test("changes the visible romaji guide toward the accepted variant being typed", () => {
    const target = createRomajiInputTarget("handan", {
      preset: "hepburn",
      selections: {},
    });

    expect(getRomajiGuideDisplay(target, "")).toBe("handan");
    expect(getRomajiGuideDisplay(target, "han")).toBe("handan");
    expect(getRomajiGuideDisplay(target, "hann")).toBe("hanndan");
    expect(getRomajiGuideDisplay(target, "hanndann")).toBe("hanndann");
  });

  test("requires three n characters when syllabic n is followed by na-row input", () => {
    const target = createRomajiInputTarget("an'nei", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: true,
    });

    expect(target.guide).toBe("annnei");
    expect(typeDirectKeys(target, Array.from("annei")).completedPrompts).toBe(0);
    expect(typeDirectKeys(target, Array.from("annei")).mistakes).toBeGreaterThan(0);
    expect(typeDirectKeys(target, Array.from("annnei")).completedPrompts).toBe(1);
  });

  test("can disable split yoon inputs such as kila and kixa for kya", () => {
    const permissiveTarget = createRomajiInputTarget("kya", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: true,
    });

    expect(typeDirectKeys(permissiveTarget, Array.from("kya")).completedPrompts).toBe(1);
    expect(typeDirectKeys(permissiveTarget, Array.from("kila")).completedPrompts).toBe(1);
    expect(typeDirectKeys(permissiveTarget, Array.from("kixa")).completedPrompts).toBe(1);

    const strictTarget = createRomajiInputTarget("kya", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: false,
    });

    expect(typeDirectKeys(strictTarget, Array.from("kya")).completedPrompts).toBe(1);
    expect(typeDirectKeys(strictTarget, Array.from("kila")).completedPrompts).toBe(0);
    expect(typeDirectKeys(strictTarget, Array.from("kila")).mistakes).toBeGreaterThan(0);
    expect(typeDirectKeys(strictTarget, Array.from("kixa")).completedPrompts).toBe(0);
    expect(typeDirectKeys(strictTarget, Array.from("kixa")).mistakes).toBeGreaterThan(0);
  });

  test("selects shortest and hepburn guide priority while accepting variants", () => {
    expect(
      createRomajiInputTarget("shichi tsu fu jo han'ei", {
        preset: "shortest",
        selections: {},
      }).guide,
    ).toBe("siti tu hu zyo hanei");

    const hepburn = createRomajiInputTarget("shichi tsu fu jo han'ei", {
      preset: "hepburn",
      selections: {},
    });

    expect(hepburn.guide).toBe("shichi tsu fu jo hannei");
    expect(typeDirectKeys(hepburn, Array.from("shichitsufujohannei")).completedPrompts).toBe(1);
    expect(typeDirectKeys(hepburn, Array.from("sitituhuzyohanei")).completedPrompts).toBe(1);
  });

  test("custom selections can restrict accepted variants separately from display priority", () => {
    const shiOnly = createRomajiInputTarget("shi", {
      preset: "custom",
      selections: {
        shi: { accepted: ["shi"], preferred: "shi" },
      },
    });

    expect(typeDirectKeys(shiOnly, Array.from("shi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(shiOnly, Array.from("si")).mistakes).toBe(1);

    const siOrCiDisplayedAsCi = createRomajiInputTarget("shi", {
      preset: "custom",
      selections: {
        shi: { accepted: ["si", "ci"], preferred: "ci" },
      },
    });

    expect(siOrCiDisplayedAsCi.guide).toBe("ci");
    expect(typeDirectKeys(siOrCiDisplayedAsCi, Array.from("si")).completedPrompts).toBe(1);
    expect(typeDirectKeys(siOrCiDisplayedAsCi, Array.from("ci")).completedPrompts).toBe(1);
    expect(typeDirectKeys(siOrCiDisplayedAsCi, Array.from("shi")).mistakes).toBe(1);

    const bothDisplayedAsShi = createRomajiInputTarget("shi", {
      preset: "custom",
      selections: {
        shi: { accepted: ["shi", "si"], preferred: "shi" },
      },
    });

    expect(bothDisplayedAsShi.guide).toBe("shi");
    expect(typeDirectKeys(bothDisplayedAsShi, Array.from("shi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(bothDisplayedAsShi, Array.from("si")).completedPrompts).toBe(1);
  });

  test("scores only newly reached direct characters after Backspace", () => {
    const first = applyDirectKey({
      state: {
        input: "",
        scoredInputLength: 0,
        mistakeDebt: 0,
        characterAttempts: 0,
        correctCharacters: 0,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "a",
      target: "ab",
      lockMistakes: false,
    });

    const backspace = applyDirectKey({
      state: first.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: false,
    });

    const retyped = applyDirectKey({
      state: backspace.state,
      key: "a",
      target: "ab",
      lockMistakes: false,
    });

    const completed = applyDirectKey({
      state: retyped.state,
      key: "b",
      target: "ab",
      lockMistakes: false,
    });

    expect(first.scoredKeystrokes).toBe(1);
    expect(backspace.scoredKeystrokes).toBe(0);
    expect(retyped.scoredKeystrokes).toBe(0);
    expect(completed.scoredKeystrokes).toBe(1);
    expect(completed.state.completedPrompts).toBe(1);
    expect(completed.state.scoredInputLength).toBe(0);
  });

  test("requires one Backspace per wrong key in strict accuracy mode", () => {
    const firstMiss = applyDirectKey({
      state: {
        input: "",
        scoredInputLength: 0,
        mistakeDebt: 0,
        characterAttempts: 0,
        correctCharacters: 0,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "x",
      target: "ab",
      lockMistakes: true,
    });

    const secondMiss = applyDirectKey({
      state: firstMiss.state,
      key: "y",
      target: "ab",
      lockMistakes: true,
    });

    const stillLocked = applyDirectKey({
      state: secondMiss.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    const oneBackspace = applyDirectKey({
      state: stillLocked.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const twoBackspaces = applyDirectKey({
      state: oneBackspace.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const stillBlockedAfterTwo = applyDirectKey({
      state: twoBackspaces.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    const threeBackspaces = applyDirectKey({
      state: stillBlockedAfterTwo.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const fourBackspaces = applyDirectKey({
      state: threeBackspaces.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const correct = applyDirectKey({
      state: fourBackspaces.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    expect(secondMiss.state.input).toBe("");
    expect(secondMiss.state.mistakeDebt).toBe(2);
    expect(stillLocked.state.mistakeDebt).toBe(3);
    expect(oneBackspace.state.mistakeDebt).toBe(2);
    expect(twoBackspaces.state.mistakeDebt).toBe(1);
    expect(stillBlockedAfterTwo.state.input).toBe("");
    expect(stillBlockedAfterTwo.state.mistakeDebt).toBe(2);
    expect(threeBackspaces.state.mistakeDebt).toBe(1);
    expect(fourBackspaces.state.mistakeDebt).toBe(0);
    expect(correct.state.input).toBe("a");
    expect(correct.state.mistakeDebt).toBe(0);
  });

  test("ignores wrong characters outside strict accuracy mode without advancing", () => {
    const miss = applyDirectKey({
      state: {
        input: "a",
        scoredInputLength: 1,
        mistakeDebt: 0,
        characterAttempts: 1,
        correctCharacters: 1,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "x",
      target: "ab",
      lockMistakes: false,
    });

    const correct = applyDirectKey({
      state: miss.state,
      key: "b",
      target: "ab",
      lockMistakes: false,
    });

    expect(miss.state.input).toBe("a");
    expect(miss.state.mistakes).toBe(1);
    expect(miss.state.characterAttempts).toBe(2);
    expect(correct.state.input).toBe("");
    expect(correct.state.completedPrompts).toBe(1);
  });
});

describe("shouldAcceptTextInput", () => {
  test("accepts text input only in production IME-on mode", () => {
    const results = Object.fromEntries(modes.map((mode) => [mode.id, shouldAcceptTextInput(mode)]));

    expect(results["production-ime-on"]).toBe(true);
    expect(results["practice-accuracy"]).toBe(false);
    expect(results["practice-flow"]).toBe(false);
    expect(results["practice-speed"]).toBe(false);
    expect(results["production-ime-off"]).toBe(false);
  });
});
