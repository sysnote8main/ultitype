import type { RankProgressionItem } from "@/src/lib/typing";

export type RankGuideColumns = {
  standard: RankProgressionItem[];
  master: RankProgressionItem[];
};

export function splitRankGuideColumns(progression: RankProgressionItem[]): RankGuideColumns {
  return {
    standard: progression.filter((rank) => !isMasterRank(rank.label)),
    master: progression.filter((rank) => isMasterRank(rank.label)),
  };
}

export function getRankGuideStatusLabel(requiredScore: number, currentScore: number) {
  if (currentScore >= requiredScore) {
    return "達成";
  }

  return `あと ${formatRankGuideScore(requiredScore - currentScore)}`;
}

export function formatRankGuideScore(score: number) {
  return Math.ceil(score).toLocaleString();
}

function isMasterRank(label: string) {
  return label.startsWith("M") || label.startsWith("UM");
}
