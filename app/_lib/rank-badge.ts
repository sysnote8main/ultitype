export type RankBadgeShape = "none" | "round" | "square";

export type RankBadgeSpec = {
  borderColor: string | null;
  fillColor: string;
  foregroundColor: string;
  glossy: boolean;
  shape: RankBadgeShape;
  text: string;
};

const rankColors = {
  G: "#8a8a8a",
  F: "#a9dc76",
  E: "#77c8ff",
  D: "#34c759",
  C: "#3485ff",
  B: "#ff9f43",
  A: "#ff4d4f",
  S: "#f2b84b",
  M: "#c792ff",
  GM: "#7b3ff2",
  HM: "#3f225e",
  XM: "#111111",
  UM: "#e646ff",
} as const;

const glossyPrefixes = new Set(["S", "M", "GM", "HM", "XM", "UM"]);
const glossAngleDegrees = -22;

export function getRankBadgeSpec(rank: string): RankBadgeSpec {
  const text = rank.trim().toUpperCase() || "-";

  if (text === "-") {
    return {
      borderColor: null,
      fillColor: rankColors.G,
      foregroundColor: "#ffffff",
      glossy: false,
      shape: "none",
      text,
    };
  }

  const prefix = getRankPrefix(text);
  const color = rankColors[prefix] ?? rankColors.G;
  const higherMaster = prefix === "GM" || prefix === "HM" || prefix === "XM" || prefix === "UM";

  if (higherMaster) {
    return {
      borderColor: null,
      fillColor: color,
      foregroundColor: "#ffffff",
      glossy: glossyPrefixes.has(prefix),
      shape: "square",
      text,
    };
  }

  return {
    borderColor: color,
    fillColor: "#ffffff",
    foregroundColor: "#2a2a2a",
    glossy: glossyPrefixes.has(prefix),
    shape: "round",
    text,
  };
}

export function drawRankBadge(
  context: CanvasRenderingContext2D,
  rank: string,
  width: number,
  height: number,
) {
  const spec = getRankBadgeSpec(rank);
  context.clearRect(0, 0, width, height);

  if (spec.shape === "none") {
    drawNoRank(context, spec, width, height);
    return;
  }

  const borderWidth = spec.borderColor ? getRankBadgeBorderWidth(height) : 0;
  const inset = Math.max(borderWidth / 2 + 1, Math.min(width, height) * 0.08);
  const x = inset;
  const y = inset;
  const badgeWidth = width - inset * 2;
  const badgeHeight = height - inset * 2;
  const radius = spec.shape === "round" ? badgeHeight / 2 : 0;

  drawBadgePath(context, x, y, badgeWidth, badgeHeight, radius);
  context.fillStyle = spec.fillColor;
  context.fill();

  if (spec.glossy) {
    drawGloss(context, x, y, badgeWidth, badgeHeight, radius, spec);
  }

  if (spec.borderColor) {
    context.lineWidth = borderWidth;
    context.strokeStyle = spec.borderColor;
    drawBadgePath(context, x, y, badgeWidth, badgeHeight, radius);
    context.stroke();
  }

  drawRankText(context, spec, width, height);
}

function getRankPrefix(rank: string): keyof typeof rankColors {
  if (rank === "UM") {
    return "UM";
  }

  if (rank.startsWith("GM")) {
    return "GM";
  }

  if (rank.startsWith("HM")) {
    return "HM";
  }

  if (rank.startsWith("XM")) {
    return "XM";
  }

  const prefix = rank[0] as keyof typeof rankColors;
  return prefix in rankColors ? prefix : "G";
}

function drawNoRank(
  context: CanvasRenderingContext2D,
  spec: RankBadgeSpec,
  width: number,
  height: number,
) {
  const radius = Math.min(width, height) * 0.42;
  const centerX = width / 2;
  const centerY = height / 2;

  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fillStyle = spec.fillColor;
  context.fill();

  context.beginPath();
  context.moveTo(centerX - radius * 0.46, centerY);
  context.lineTo(centerX + radius * 0.46, centerY);
  context.lineCap = "round";
  context.lineWidth = Math.max(4, radius * 0.22);
  context.strokeStyle = spec.foregroundColor;
  context.stroke();
  context.lineCap = "butt";
}

function drawBadgePath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();

  if (radius === 0) {
    context.rect(x, y, width, height);
    return;
  }

  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.arcTo(x + width, y, x + width, y + radius, radius);
  context.lineTo(x + width, y + height - radius);
  context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  context.lineTo(x + radius, y + height);
  context.arcTo(x, y + height, x, y + height - radius, radius);
  context.lineTo(x, y + radius);
  context.arcTo(x, y, x + radius, y, radius);
  context.closePath();
}

function drawGloss(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  spec: RankBadgeSpec,
) {
  context.save();
  drawBadgePath(context, x, y, width, height, radius);
  context.clip();

  const angle = (getRankBadgeGlossAngleDegrees() * Math.PI) / 180;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const bandWidth = width * 1.85;
  const bandHeight = height * 0.46;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(angle);

  const diagonalGloss = context.createLinearGradient(0, -bandHeight / 2, 0, bandHeight / 2);
  diagonalGloss.addColorStop(0, "rgba(255, 255, 255, 0)");
  diagonalGloss.addColorStop(0.32, "rgba(255, 255, 255, 0.16)");
  diagonalGloss.addColorStop(0.5, "rgba(255, 255, 255, 0.68)");
  diagonalGloss.addColorStop(0.68, "rgba(255, 255, 255, 0.16)");
  diagonalGloss.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = diagonalGloss;
  context.fillRect(-bandWidth / 2, -height * 0.46, bandWidth, bandHeight);
  context.restore();

  const colorGloss = context.createLinearGradient(x, y + height, x + width, y);
  colorGloss.addColorStop(0, "rgba(255, 255, 255, 0)");
  colorGloss.addColorStop(
    0.5,
    spec.shape === "round" ? `${spec.borderColor}33` : "rgba(255, 255, 255, 0.24)",
  );
  colorGloss.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = colorGloss;
  context.fillRect(x, y, width, height);

  context.restore();
}

function drawRankText(
  context: CanvasRenderingContext2D,
  spec: RankBadgeSpec,
  width: number,
  height: number,
) {
  const fontSize = Math.min(height * 0.56, width / Math.max(2.3, spec.text.length * 0.72));
  context.fillStyle = spec.foregroundColor;
  context.font = getRankBadgeTextFont(fontSize);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(spec.text, width / 2, height / 2 + fontSize * 0.035);
}

export function getRankBadgeBorderWidth(height: number) {
  return Math.max(4, height * 0.14);
}

export function getRankBadgeTextFont(fontSize: number) {
  return `700 ${fontSize}px "Quantico", "Trispace", Arial, sans-serif`;
}

export function getRankBadgeGlossAngleDegrees() {
  return glossAngleDegrees;
}
