import englishProductionText from "./challenge-data/en-production.txt" with { type: "text" };
import englishPracticeText from "./challenge-data/en-practice.txt" with { type: "text" };
import japaneseProductionText from "./challenge-data/ja-production.txt" with { type: "text" };
import japanesePracticeText from "./challenge-data/ja-practice.txt" with { type: "text" };
import { createRomajiInputTarget } from "./typing";

export type DirectChallenge = {
  display: string;
  guide?: string;
  input: string;
  reading?: string;
  romajiSource?: string;
};

export type JapaneseChallengeSource = {
  display: string;
  reading: string;
};

export type JapaneseReadingGuidePart =
  | {
      kind: "visual";
      text: string;
    }
  | {
      kind: "reading";
      text: string;
      tokenStart: number;
      tokenEnd: number;
    };

export function parseEnglishChallengeText(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseJapaneseChallengeText(source: string): JapaneseChallengeSource[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const columns = line.split("\t");

      if (columns.length !== 2 || !columns[0] || !columns[1]) {
        throw new Error(`Invalid Japanese challenge line ${index + 1}: expected display<TAB>reading`);
      }

      return {
        display: columns[0].trim(),
        reading: columns[1].trim(),
      };
    });
}

function createJapaneseDirectChallenges(challenges: JapaneseChallengeSource[]): DirectChallenge[] {
  return challenges.map(({ display, reading }) => {
    const romajiSource = kanaReadingToRomaji(reading);
    const guide = createVisibleRomajiGuide(romajiSource);

    return {
      display,
      guide,
      input: removeVisualSpaces(guide),
      reading,
      romajiSource,
    };
  });
}

const sokuonSourceMarker = "^";

function kanaReadingToRomaji(reading: string): string {
  return createJapaneseReadingSourceParts(reading)
    .map((part) => part.source)
    .join("");
}

export function createJapaneseReadingGuideParts(reading: string): JapaneseReadingGuidePart[] {
  let tokenIndex = 0;

  return createJapaneseReadingSourceParts(reading).map((part) => {
    if (part.kind === "visual") {
      return {
        kind: "visual",
        text: part.text,
      };
    }

    const tokenCount = countRomajiInputTokens(part.source);
    const guidePart = {
      kind: "reading",
      text: part.text,
      tokenStart: tokenIndex,
      tokenEnd: tokenIndex + tokenCount,
    } satisfies JapaneseReadingGuidePart;
    tokenIndex += tokenCount;
    return guidePart;
  });
}

type JapaneseReadingSourcePart = {
  kind: "reading" | "visual";
  source: string;
  text: string;
};

function createJapaneseReadingSourceParts(reading: string): JapaneseReadingSourcePart[] {
  const characters = Array.from(reading);
  const parts: JapaneseReadingSourcePart[] = [];

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    const next = characters[index + 1] ?? "";
    const pair = `${character}${next}`;

    if (/\s/.test(character)) {
      parts.push({ kind: "visual", source: character, text: character });
      continue;
    }

    if (character === "っ") {
      parts.push({ kind: "reading", source: sokuonSourceMarker, text: character });
      continue;
    }

    const pairedRomaji = kanaRomaji[pair];
    if (pairedRomaji) {
      parts.push({ kind: "reading", source: pairedRomaji, text: pair });
      index += 1;
      continue;
    }

    if (character === "ん") {
      const nextRomaji = resolveKanaRomaji(findNextNonSpaceCharacter(characters, index + 1));
      parts.push({
        kind: "reading",
        source: nextRomaji && /^[aiueoyn]/.test(nextRomaji) ? "n'" : "n",
        text: character,
      });
      continue;
    }

    parts.push({ kind: "reading", source: kanaRomaji[character] ?? character, text: character });
  }

  return parts;
}

function countRomajiInputTokens(source: string): number {
  return createRomajiInputTarget(source, {
    allowSplitYoon: true,
    preset: "hepburn",
    selections: {},
  }).tokens.length;
}

function createVisibleRomajiGuide(source: string): string {
  const result: string[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index] ?? "";
    if (character === "n" && source[index + 1] === "'") {
      result.push("nn");
      index += 1;
      continue;
    }

    if (character === "'") {
      continue;
    }

    if (character !== sokuonSourceMarker) {
      result.push(character);
      continue;
    }

    const next = source[index + 1] ?? "";
    result.push(next !== "n" && /[a-z]/.test(next) ? next : "xtu");
  }

  return result.join("");
}

function resolveKanaRomaji(character: string): string {
  return kanaRomaji[character] ?? character;
}

function findNextNonSpaceCharacter(characters: string[], startIndex: number): string {
  for (let index = startIndex; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    if (!/\s/.test(character)) {
      return character;
    }
  }

  return "";
}

const kanaRomaji: Record<string, string> = {
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  てぃ: "thi",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  ふぁ: "fa",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  だ: "da",
  ぢ: "ji",
  づ: "du",
  で: "de",
  ど: "do",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "wo",
  ぁ: "la",
  ぃ: "li",
  ぅ: "lu",
  ぇ: "le",
  ぉ: "lo",
  ゃ: "lya",
  ゅ: "lyu",
  ょ: "lyo",
  "、": ",",
  "。": ".",
  "　": " ",
};

function removeVisualSpaces(value: string): string {
  return value.replace(/[\s　]/g, "");
}

const japanesePracticeChallenges = parseJapaneseChallengeText(japanesePracticeText);
const japaneseProductionChallenges = parseJapaneseChallengeText(japaneseProductionText);

export const shortChallenges = japanesePracticeChallenges.map(({ display }) => display);
export const longChallenges = japaneseProductionChallenges.map(({ display }) => display);
export const shortChallengeReadings = japanesePracticeChallenges.map(({ reading }) => reading);
export const longChallengeReadings = japaneseProductionChallenges.map(({ reading }) => reading);

export const directShortChallenges = createJapaneseDirectChallenges(japanesePracticeChallenges);
export const directLongChallenges = createJapaneseDirectChallenges(japaneseProductionChallenges);

export const englishShortChallenges = parseEnglishChallengeText(englishPracticeText);
export const englishLongChallenges = parseEnglishChallengeText(englishProductionText);

export const englishDirectShortChallenges: DirectChallenge[] = englishShortChallenges.map(
  (display) => ({
    display,
    input: display,
  }),
);

export const englishDirectLongChallenges: DirectChallenge[] = englishLongChallenges.map(
  (display) => ({
    display,
    input: display,
  }),
);
