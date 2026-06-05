import { describe, expect, test } from "bun:test";
import {
  createJapaneseDirectChallenges,
  createJapaneseFuriganaParts,
  createJapaneseReadingGuideParts,
  directLongChallenges,
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
  parseEnglishChallengeText,
  parseJapaneseChallengeText,
} from "./challenges";

function shortChallengeText(body: string) {
  return `---
type: "ultitype_sentence_short"
---

${body}`;
}

function longChallengeText(body: string) {
  return `---
type: "ultitype_sentence_long"
---

${body}`;
}

describe("frontmatter challenge data", () => {
  test("parses English short challenges as one sentence per line", () => {
    expect(parseEnglishChallengeText(shortChallengeText("Alpha line.\n\nBeta line.\n"))).toEqual([
      "Alpha line.",
      "Beta line.",
    ]);
  });

  test("parses English long challenges as blank-line separated paragraphs", () => {
    expect(
      parseEnglishChallengeText(
        longChallengeText("Alpha line wraps\nonto the next line.\n\nBeta line."),
      ),
    ).toEqual(["Alpha line wraps onto the next line.", "Beta line."]);
  });

  test("parses Japanese long challenges by joining wrapped lines without spaces", () => {
    expect(
      parseJapaneseChallengeText(
        longChallengeText(
          "[入](にゅう)[力](りょく)する。\n[文](ぶん)[章](しょう)です。\n\n[別](べつ)の[文](ぶん)です。",
        ),
      ),
    ).toEqual([
      {
        display: "入力する。文章です。",
        furigana: [
          { text: "入", ruby: "にゅう" },
          { text: "力", ruby: "りょく" },
          { text: "文", ruby: "ぶん" },
          { text: "章", ruby: "しょう" },
        ],
        reading: "にゅうりょくする。ぶんしょうです。",
      },
      {
        display: "別の文です。",
        furigana: [
          { text: "別", ruby: "べつ" },
          { text: "文", ruby: "ぶん" },
        ],
        reading: "べつのぶんです。",
      },
    ]);
  });

  test("rejects missing or unsupported challenge frontmatter", () => {
    expect(() => parseEnglishChallengeText("Alpha line.")).toThrow("frontmatter");
    expect(() =>
      parseJapaneseChallengeText(`---
type: "unknown"
---

[文](ぶん)です。`),
    ).toThrow("Unsupported challenge data type");
  });

  test("parses Japanese challenges as one annotated display line per challenge", () => {
    expect(
      parseJapaneseChallengeText(shortChallengeText("[解](かい)[析](せき)[結](けっ)[果](か)を[見](み)る。\n")),
    ).toEqual([
      {
        display: "解析結果を見る。",
        furigana: [
          { text: "解", ruby: "かい" },
          { text: "析", ruby: "せき" },
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
          { text: "見", ruby: "み" },
        ],
        reading: "かいせきけっかをみる。",
      },
    ]);
  });

  test("derives display, reading, and ruby groups from one annotated line", () => {
    expect(
      parseJapaneseChallengeText(shortChallengeText("[結](けっ)[果](か)を[見](み)てから[今日](きょう)は[帰](かえ)る")),
    ).toEqual([
      {
        display: "結果を見てから今日は帰る",
        furigana: [
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
          { text: "見", ruby: "み" },
          { text: "今日", ruby: "きょう" },
          { text: "帰", ruby: "かえ" },
        ],
        reading: "けっかをみてからきょうはかえる",
      },
    ]);
  });

  test("supports escaping markdown-style annotation characters", () => {
    expect(parseJapaneseChallengeText(shortChallengeText("\\[Ctrl\\]\\(A\\)と[結](けっ)[果](か)"))).toEqual([
      {
        display: "[Ctrl](A)と結果",
        furigana: [
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
        ],
        reading: "[Ctrl](A)とけっか",
      },
    ]);
  });

  test("requires unescaped kanji to have ruby annotations", () => {
    expect(() => parseJapaneseChallengeText(shortChallengeText("解析結果を見る。"))).toThrow(
      "unannotated kanji requires ruby annotation",
    );
  });

  test("keeps okurigana sokuon out of ruby annotations", () => {
    expect(parseJapaneseChallengeText(shortChallengeText("[保](たも)った[姿](すがた)が[揃](そろ)った"))).toEqual([
      {
        display: "保った姿が揃った",
        furigana: [
          { text: "保", ruby: "たも" },
          { text: "姿", ruby: "すがた" },
          { text: "揃", ruby: "そろ" },
        ],
        reading: "たもったすがたがそろった",
      },
    ]);
  });

  test("rejects generated ruby annotations that duplicate okurigana sokuon", () => {
    expect(() => parseJapaneseChallengeText(shortChallengeText("[保](たもっ)った"))).toThrow(
      "ruby text must not duplicate okurigana sokuon",
    );
    expect(() => parseJapaneseChallengeText(shortChallengeText("[揃](そろっ)った"))).toThrow(
      "ruby text must not duplicate okurigana sokuon",
    );
  });

  test("maps hiragana reading units to romaji input token ranges", () => {
    expect(createJapaneseReadingGuideParts("かい しゃ")).toEqual([
      { kind: "reading", text: "か", tokenStart: 0, tokenEnd: 2 },
      { kind: "reading", text: "い", tokenStart: 2, tokenEnd: 3 },
      { kind: "visual", text: " " },
      { kind: "reading", text: "しゃ", tokenStart: 3, tokenEnd: 4 },
    ]);
  });

  test("maps explicit furigana groups to display occurrences in order", () => {
    expect(
      createJapaneseFuriganaParts(
        "解析結果を見てから判断する速度は、経験によって大きく変わる。",
        [
          { text: "解", ruby: "かい" },
          { text: "析", ruby: "せき" },
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
          { text: "見", ruby: "み" },
          { text: "判", ruby: "はん" },
          { text: "断", ruby: "だん" },
          { text: "速", ruby: "そく" },
          { text: "度", ruby: "ど" },
          { text: "経", ruby: "けい" },
          { text: "験", ruby: "けん" },
          { text: "大", ruby: "おお" },
          { text: "変", ruby: "か" },
        ],
      ),
    ).toEqual([
      { text: "解", ruby: "かい" },
      { text: "析", ruby: "せき" },
      { text: "結", ruby: "けっ" },
      { text: "果", ruby: "か" },
      { text: "を" },
      { text: "見", ruby: "み" },
      { text: "てから" },
      { text: "判", ruby: "はん" },
      { text: "断", ruby: "だん" },
      { text: "する" },
      { text: "速", ruby: "そく" },
      { text: "度", ruby: "ど" },
      { text: "は、" },
      { text: "経", ruby: "けい" },
      { text: "験", ruby: "けん" },
      { text: "によって" },
      { text: "大", ruby: "おお" },
      { text: "きく" },
      { text: "変", ruby: "か" },
      { text: "わる。" },
    ]);
  });

  test("keeps multi-kanji ruby groups intact for synchronized advancement", () => {
    expect(
      createJapaneseFuriganaParts("今日は帰る", [
        { text: "今日", ruby: "きょう" },
        { text: "帰", ruby: "かえ" },
      ]),
    ).toEqual([
      { text: "今日", ruby: "きょう" },
      { text: "は" },
      { text: "帰", ruby: "かえ" },
      { text: "る" },
    ]);
  });

  test("maps repeated kanji by occurrence instead of using a shared word-level reading", () => {
    expect(
      createJapaneseFuriganaParts("生まれた生地を見る。", [
        { text: "生", ruby: "う" },
        { text: "生", ruby: "き" },
        { text: "地", ruby: "じ" },
        { text: "見", ruby: "み" },
      ]),
    ).toEqual([
      { text: "生", ruby: "う" },
      { text: "まれた" },
      { text: "生", ruby: "き" },
      { text: "地", ruby: "じ" },
      { text: "を" },
      { text: "見", ruby: "み" },
      { text: "る。" },
    ]);
  });
});

describe("direct short challenges", () => {
  test("show Japanese prompts and do not leak generated control labels", () => {
    expect(directShortChallenges).toHaveLength(50);
    expect(directLongChallenges).toHaveLength(20);
    expect(directShortChallenges[0].display).toContain("解析結果");
    expect(directShortChallenges[0].furigana).toContainEqual({ text: "結", ruby: "けっ" });
    expect(directShortChallenges[0].furigana).toContainEqual({ text: "果", ruby: "か" });
    expect(directShortChallenges[0].reading).toContain("かいせきけっか");
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
  test("normalizes Japanese punctuation to half-width romaji symbols", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("ティータイム・じゃ～っ！")),
    );

    expect(challenge?.reading).toBe("てぃーたいむ・じゃ～っ！");
    expect(challenge?.romajiSource).toBe("thi-taimu･ja~^!");
    expect(challenge?.guide).toBe("thi-taimu･ja~xtu!");
    expect(challenge?.input).toBe("thi-taimu･ja~xtu!");
    expect(challenge?.input).not.toContain("・");
    expect(challenge?.input).not.toContain("～");
    expect(challenge?.input).not.toContain("！");
    expect(challenge?.input).not.toContain("ー");
  });

  test("maps long vowel marks in production prompts to hyphen input", () => {
    const challenge = directLongChallenges.find((item) => item.display.startsWith("レーティングは"));

    expect(challenge?.reading).toStartWith("れーてぃんぐは");
    expect(challenge?.romajiSource).toStartWith("re-thinguha");
    expect(challenge?.guide).toStartWith("re-thinguha");
    expect(challenge?.input).toStartWith("re-thinguha");
    expect(challenge?.input).not.toContain("ー");
  });

  test("maps ヴァ行 katakana readings to va vi vu ve vo", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("ヴァヴィヴヴェヴォ")),
    );

    expect(challenge?.reading).toBe("ゔぁゔぃゔゔぇゔぉ");
    expect(challenge?.romajiSource).toBe("vavivuvevo");
    expect(challenge?.guide).toBe("vavivuvevo");
    expect(challenge?.input).toBe("vavivuvevo");
  });

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

    expect(challenge?.romajiSource).toContain("shisen'idou");
    expect(challenge?.guide).toContain("shisennidou");
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
