import {
  directLongChallenges,
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
} from "@/src/lib/challenges";
import type { ModeGroup } from "@/src/lib/typing";
import type { ChallengeLanguage } from "./types";

export function getDirectChallenges(language: ChallengeLanguage, group: ModeGroup) {
  if (language === "en") {
    return group === "practice" ? englishDirectShortChallenges : englishDirectLongChallenges;
  }

  return group === "practice" ? directShortChallenges : directLongChallenges;
}

export function removeRomajiVisualSpaces(value: string) {
  return value.replace(/\s/g, "");
}

export function estimateImeKeystrokes(target: string): number {
  const kanaLike = Array.from(target).filter((character) => !/\s/.test(character)).length;
  return Math.ceil(kanaLike * 1.15);
}

export function clampInteger(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.min(max, Math.max(min, parsed));
}
