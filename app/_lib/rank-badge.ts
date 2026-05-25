export type RankBadgeShape = "none" | "round" | "square";

export type RankBadgeSpec = {
  borderColor: string | null;
  borderGloss: boolean;
  fillColor: string;
  foregroundColor: string;
  glossy: boolean;
  rainbow: boolean;
  shape: RankBadgeShape;
  text: string;
  textStrokeColor: string | null;
};

const rankColors = {
  G: "#8a8a8a",
  F: "#a9dc76",
  E: "#77c8ff",
  D: "#34c759",
  C: "#3485ff",
  B: "#ff9f43",
  A: "#ff4d4f",
  S: "#c99018",
  M: "#7b3ff2",
  M20: "#3f225e",
  M40: "#111111",
  UM: "#e646ff",
} as const;

const glossyPrefixes = new Set<keyof typeof rankColors>(["S", "M", "M20", "M40", "UM"]);
const glossAngleDegrees = -22;

export function getRankBadgeSpec(rank: string): RankBadgeSpec {
  const text = rank.trim().toUpperCase() || "-";

  if (text === "-" || text === "NR") {
    return {
      borderColor: null,
      borderGloss: false,
      fillColor: rankColors.G,
      foregroundColor: "#ffffff",
      glossy: false,
      rainbow: false,
      shape: "round",
      text: "NR",
      textStrokeColor: null,
    };
  }

  const prefix = getRankColorKey(text);
  const color = rankColors[prefix] ?? rankColors.G;
  const master = prefix === "M" || prefix === "M20" || prefix === "M40" || prefix === "UM";

  if (master) {
    return {
      borderColor: null,
      borderGloss: false,
      fillColor: color,
      foregroundColor: prefix === "UM" ? "#111111" : "#ffffff",
      glossy: glossyPrefixes.has(prefix),
      rainbow: prefix === "UM",
      shape: "square",
      text,
      textStrokeColor: prefix === "UM" ? "#ffffff" : null,
    };
  }

  return {
    borderColor: color,
    borderGloss: prefix === "S",
    fillColor: "#ffffff",
    foregroundColor: "#2a2a2a",
    glossy: glossyPrefixes.has(prefix),
    rainbow: false,
    shape: "round",
    text,
    textStrokeColor: null,
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

  const borderWidth = spec.borderColor ? getRankBadgeBorderWidth(height) : 0;
  const inset = Math.max(borderWidth / 2 + 1, Math.min(width, height) * 0.08);
  const x = inset;
  const y = inset;
  const badgeWidth = width - inset * 2;
  const badgeHeight = height - inset * 2;
  const radius = spec.shape === "round" ? badgeHeight / 2 : 0;

  drawBadgePath(context, x, y, badgeWidth, badgeHeight, radius);
  context.fillStyle = spec.rainbow
    ? createRainbowGradient(context, x, y, badgeWidth, badgeHeight)
    : spec.fillColor;
  context.fill();

  if (spec.glossy) {
    drawGloss(context, x, y, badgeWidth, badgeHeight, radius, spec);
  }

  if (spec.borderColor) {
    context.lineWidth = borderWidth;
    context.strokeStyle = spec.borderColor;
    drawBadgePath(context, x, y, badgeWidth, badgeHeight, radius);
    context.stroke();

    if (spec.borderGloss) {
      drawBorderGloss(context, x, y, badgeWidth, badgeHeight, radius, borderWidth);
    }
  }

  drawRankText(context, spec, width, height);
}

function getRankColorKey(rank: string): keyof typeof rankColors {
  if (rank.startsWith("UM")) {
    return "UM";
  }

  if (rank.startsWith("M")) {
    const number = Number.parseInt(rank.slice(1), 10);
    if (number >= 40) {
      return "M40";
    }
    if (number >= 20) {
      return "M20";
    }
    return "M";
  }

  const prefix = rank[0] as keyof typeof rankColors;
  return prefix in rankColors ? prefix : "G";
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

function createRainbowGradient(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const gradient = context.createLinearGradient(x, y + height, x + width, y);
  gradient.addColorStop(0, "#ff3b30");
  gradient.addColorStop(0.18, "#ff9f0a");
  gradient.addColorStop(0.34, "#ffd60a");
  gradient.addColorStop(0.5, "#34c759");
  gradient.addColorStop(0.66, "#32ade6");
  gradient.addColorStop(0.82, "#5856d6");
  gradient.addColorStop(1, "#bf5af2");
  return gradient;
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
  const bandHeight = height * 0.58;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(angle);
  context.filter = `blur(${getRankBadgeGlossBlur(height)}px)`;

  const diagonalGloss = context.createLinearGradient(0, -bandHeight / 2, 0, bandHeight / 2);
  diagonalGloss.addColorStop(0, "rgba(255, 255, 255, 0)");
  diagonalGloss.addColorStop(0.28, "rgba(255, 255, 255, 0.12)");
  diagonalGloss.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
  diagonalGloss.addColorStop(0.72, "rgba(255, 255, 255, 0.12)");
  diagonalGloss.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = diagonalGloss;
  context.fillRect(-bandWidth / 2, -height * 0.52, bandWidth, bandHeight);
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

function drawBorderGloss(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  borderWidth: number,
) {
  context.save();
  context.filter = `blur(${getRankBadgeGlossBlur(height) * 0.75}px)`;

  const borderGloss = context.createLinearGradient(x, y + height, x + width, y);
  borderGloss.addColorStop(0, "rgba(255, 255, 255, 0)");
  borderGloss.addColorStop(0.36, "rgba(255, 244, 178, 0.08)");
  borderGloss.addColorStop(0.5, "rgba(255, 255, 255, 0.78)");
  borderGloss.addColorStop(0.64, "rgba(255, 244, 178, 0.08)");
  borderGloss.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.lineWidth = borderWidth * 0.9;
  context.strokeStyle = borderGloss;
  drawBadgePath(context, x, y, width, height, radius);
  context.stroke();
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
  const textX = width / 2;
  const textY = height / 2 + fontSize * 0.035;

  if (spec.textStrokeColor) {
    context.lineJoin = "round";
    context.lineWidth = getRankBadgeTextStrokeWidth(fontSize);
    context.strokeStyle = spec.textStrokeColor;
    context.strokeText(spec.text, textX, textY);
  }

  context.fillText(spec.text, textX, textY);
}

export function getRankBadgeBorderWidth(height: number) {
  return Math.max(4, height * 0.14);
}

export function getRankBadgeTextFont(fontSize: number) {
  return `700 ${fontSize}px "Quantico", "Trispace", Arial, sans-serif`;
}

export function getRankBadgeTextStrokeWidth(fontSize: number) {
  return Math.max(3, fontSize * 0.16);
}

export function getRankBadgeGlossAngleDegrees() {
  return glossAngleDegrees;
}

export function getRankBadgeGlossBlur(height: number) {
  return Math.max(3, height * 0.11);
}
