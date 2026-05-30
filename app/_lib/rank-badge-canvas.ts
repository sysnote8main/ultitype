export type RankBadgePaintStep = "immediate" | "font-ready";

export function getRankBadgePaintSteps(canLoadFonts: boolean): RankBadgePaintStep[] {
  return canLoadFonts ? ["immediate", "font-ready"] : ["immediate"];
}
