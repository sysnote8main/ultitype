"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRank,
  getRankProgression,
  modes,
  type Rank,
  type RankProgressionItem,
} from "@/src/lib/typing";
import { initialStoredState, storageKey } from "../_lib/constants";
import type { StoredState } from "../_lib/types";
import { RankBadgeCanvas } from "./RankBadgeCanvas";

export function RankGuide() {
  const [stored, setStored] = useState<StoredState>(initialStoredState);

  useEffect(() => {
    setStored(readStoredState());
  }, []);

  const bestScore = Math.max(stored.bestPracticeScore, stored.bestProductionScore);
  const currentRank = getRank(bestScore);
  const progression = useMemo(() => getRankProgression(), []);

  return (
    <section className="rank-guide" aria-label="ランク到達状況">
      <section className="score-guide" aria-label="スコア計算式">
        <div className="score-formula">
          <span>基本のスコア計算式</span>
          <strong>打鍵/秒 × 1000 × 正確率^モード係数 × 補正</strong>
          <p>
            正確率は正しく入力した文字数 ÷ 入力を試みた文字数です。均等モードのみ、打鍵間隔の安定度が補正として加わります。
          </p>
        </div>
        <div className="practice-score-modes">
          {modes
            .filter((mode) => mode.group === "practice")
            .map((mode) => (
              <article className="practice-score-mode" key={mode.id}>
                <span>{mode.shortLabel}</span>
                <strong>{mode.label}</strong>
                <dl>
                  <div>
                    <dt>正確率係数</dt>
                    <dd>{mode.accuracyExponent}</dd>
                  </div>
                  <div>
                    <dt>補正</dt>
                    <dd>{mode.id === "practice-flow" ? "安定度" : "なし"}</dd>
                  </div>
                </dl>
                <p>{mode.description}</p>
              </article>
            ))}
        </div>
      </section>

      <div className="rank-guide-summary">
        <div>
          <span>現在ランク</span>
          <RankBadgeCanvas
            className="rank-guide-current-canvas"
            height={52}
            rank={currentRank.label}
            width={112}
          />
        </div>
        <div>
          <span>最高スコア</span>
          <strong>{formatScore(bestScore)}</strong>
        </div>
        <div>
          <span>次の目標</span>
          <strong>{getNextTargetLabel(currentRank, bestScore, progression)}</strong>
        </div>
      </div>

      <div className="rank-guide-table-head" aria-hidden="true">
        <span>ランク帯</span>
        <span>必要スコア</span>
        <span>到達状況</span>
        <span>達成に必要なスコア</span>
      </div>
      <ol className="rank-guide-list">
        {progression.map((rank) => {
          const reached = bestScore >= rank.requiredScore;
          const current = currentRank.level === rank.level;
          const remainingScore = Math.max(0, Math.ceil(rank.requiredScore - bestScore));

          return (
            <li
              className={`rank-guide-row ${reached ? "reached" : ""} ${current ? "current" : ""}`}
              key={rank.label}
            >
              <span className="rank-guide-band">
                <RankBadgeCanvas
                  className="rank-guide-band-canvas"
                  height={34}
                  rank={rank.label}
                  width={72}
                />
                <small>{rank.colorName}</small>
              </span>
              <span className="rank-guide-score">{formatScore(rank.requiredScore)}</span>
              <span className="rank-guide-state">
                {current ? "到達中" : reached ? "到達済み" : "未到達"}
              </span>
              <span className="rank-guide-needed">
                {remainingScore === 0 ? "-" : formatScore(remainingScore)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function readStoredState(): StoredState {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return initialStoredState;
  }

  try {
    return {
      ...initialStoredState,
      ...(JSON.parse(raw) as Partial<StoredState>),
    };
  } catch {
    return initialStoredState;
  }
}

function getNextTargetLabel(
  currentRank: Rank,
  currentScore: number,
  progression: RankProgressionItem[],
) {
  const next = progression.find((rank) => rank.requiredScore > currentScore);
  if (!next) {
    return currentRank.label;
  }

  return `${next.label} あと ${formatScore(next.requiredScore - currentScore)}`;
}

function formatScore(score: number) {
  return Math.round(score).toLocaleString();
}
