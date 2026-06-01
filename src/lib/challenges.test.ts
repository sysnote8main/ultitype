import { describe, expect, test } from "bun:test";
import {
  createJapaneseReadingGuideParts,
  directLongChallenges,
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
  parseEnglishChallengeText,
  parseJapaneseChallengeText,
} from "./challenges";

describe("plain text challenge data", () => {
  test("parses English challenges as one sentence per line", () => {
    expect(parseEnglishChallengeText("Alpha line.\n\nBeta line.\n")).toEqual([
      "Alpha line.",
      "Beta line.",
    ]);
  });

  test("parses Japanese challenges as display text and hiragana reading per line", () => {
    expect(parseJapaneseChallengeText("解析結果を見る。\tかいせきけっかをみる。\n")).toEqual([
      {
        display: "解析結果を見る。",
        reading: "かいせきけっかをみる。",
      },
    ]);
  });

  test("maps hiragana reading units to romaji input token ranges", () => {
    expect(createJapaneseReadingGuideParts("かい しゃ")).toEqual([
      { kind: "reading", text: "か", tokenStart: 0, tokenEnd: 2 },
      { kind: "reading", text: "い", tokenStart: 2, tokenEnd: 3 },
      { kind: "visual", text: " " },
      { kind: "reading", text: "しゃ", tokenStart: 3, tokenEnd: 4 },
    ]);
  });
});

describe("direct short challenges", () => {
  test("show Japanese prompts and do not leak generated control labels", () => {
    expect(directShortChallenges).toHaveLength(50);
    expect(directShortChallenges[0].display).toContain("解析結果");
    expect(directShortChallenges[0].reading).toContain("かいせき けっか");
    expect(directShortChallenges[0].guide).toContain(" ");
    expect(directShortChallenges[0].input).not.toContain(" ");
    expect(directShortChallenges.some((challenge) => challenge.display.includes("control set"))).toBe(
      false,
    );
    expect(directShortChallenges.some((challenge) => challenge.input.includes("control set"))).toBe(
      false,
    );
  });
});

describe("direct Japanese challenge romaji", () => {
  test("maps づ to du instead of zu", () => {
    expect(directLongChallenges.some((challenge) => challenge.guide?.includes("tsudukereba"))).toBe(
      true,
    );
    expect(directLongChallenges.some((challenge) => challenge.guide?.includes("tsuzukereba"))).toBe(
      false,
    );
  });

  test("keeps sokuon markers out of the visible Japanese guide", () => {
    const challenge = directShortChallenges.find((item) => item.romajiSource?.includes("^"));

    expect(challenge?.display).toContain("結果");
    expect(challenge?.guide).toContain("kekka");
    expect(challenge?.guide).not.toContain("^");
  });

  test("keeps syllabic n distinct before a following word that starts with a vowel", () => {
    const challenge = directShortChallenges.find((item) => item.display.includes("視線移動"));

    expect(challenge?.romajiSource).toContain("shisen' idou");
    expect(challenge?.guide).toContain("shisenn idou");
    expect(challenge?.input).toContain("shisennidou");
    expect(challenge?.input).not.toContain("shisenidou");
  });
});

describe("English challenges", () => {
  test("provide direct English prompts without generated control labels", () => {
    expect(englishDirectShortChallenges).toHaveLength(50);
    expect(englishDirectLongChallenges).toHaveLength(20);
    expect(englishDirectShortChallenges[0].display).toBe(englishDirectShortChallenges[0].input);
    expect(
      englishDirectShortChallenges.some((challenge) => challenge.display.includes("control set")),
    ).toBe(false);
  });
});
