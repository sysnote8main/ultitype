export const ALPHA_PRODUCTION_LOCK_MESSAGE =
  "Alpha版では本番モードは開発中のためプレイできません。";

export function isProductionModePlayableInBuild(
  nodeEnv: string | undefined = process.env.NODE_ENV,
) {
  return nodeEnv === "development";
}

export function canPlayProductionMode({
  nodeEnv = process.env.NODE_ENV,
  unlocked,
}: {
  nodeEnv?: string;
  unlocked: boolean;
}) {
  return unlocked && isProductionModePlayableInBuild(nodeEnv);
}

export const PRODUCTION_MODE_PLAYABLE = isProductionModePlayableInBuild();
