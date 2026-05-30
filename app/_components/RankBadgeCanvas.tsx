"use client";

import { useLayoutEffect, useRef } from "react";
import { drawRankBadge } from "../_lib/rank-badge";
import { getRankBadgePaintSteps } from "../_lib/rank-badge-canvas";

type RankBadgeCanvasProps = {
  className?: string;
  height?: number;
  rank: string;
  width?: number;
};

export function RankBadgeCanvas({
  className,
  height = 36,
  rank,
  width = 76,
}: RankBadgeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;

    function paint() {
      if (cancelled || !canvas) {
        return;
      }

      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawRankBadge(context, rank, width, height);
    }

    const canLoadFonts = Boolean(document.fonts);
    const paintSteps = getRankBadgePaintSteps(canLoadFonts);

    if (paintSteps.includes("immediate")) {
      paint();
    }

    if (paintSteps.includes("font-ready")) {
      void loadRankBadgeFonts(height).then(paint);
    }

    return () => {
      cancelled = true;
    };
  }, [height, rank, width]);

  return (
    <canvas
      aria-label={`Rank ${rank}`}
      className={className}
      height={height}
      ref={canvasRef}
      role="img"
      width={width}
    />
  );
}

async function loadRankBadgeFonts(height: number) {
  const fontSize = Math.round(height * 0.56);
  if (!document.fonts) {
    return;
  }

  await Promise.allSettled([
    document.fonts.load(`700 ${fontSize}px "Quantico"`),
    document.fonts.ready,
  ]);
}
