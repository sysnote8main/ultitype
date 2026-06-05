"use client";

import { Crosshair, Gauge, Keyboard, Languages, Lock, Waves, Zap } from "lucide-react";
import Link from "next/link";
import { modes, type ModeId, type TypingMode } from "@/src/lib/typing";
import { challengeLanguages } from "../_lib/constants";
import { getModePath } from "../_lib/mode-routes";
import {
  ALPHA_PRODUCTION_LOCK_MESSAGE,
  type ProductionModeId,
  type ProductionModePlayability,
} from "../_lib/release-gates";
import { type SoundSettings, useTypingSounds } from "../_lib/typing-sounds";
import type { ChallengeLanguage, ProductionDuration } from "../_lib/types";

const modeIcons = {
  "practice-accuracy": Crosshair,
  "practice-flow": Waves,
  "practice-speed": Zap,
  "production-ime-off": Keyboard,
  "production-ime-on": Languages,
} satisfies Record<ModeId, typeof Gauge>;

type ModeSelectScreenProps = {
  challengeLanguage: ChallengeLanguage;
  productionDuration: ProductionDuration;
  productionDurations: readonly ProductionDuration[];
  productionPlayableModes: ProductionModePlayability;
  productionUnlocked: boolean;
  soundSettings: SoundSettings;
  onChangeChallengeLanguage: (language: ChallengeLanguage) => void;
  onProductionDurationChange: (duration: ProductionDuration) => void;
  onSelectMode?: (modeId: ModeId) => void;
};

export function ModeSelectScreen({
  challengeLanguage,
  productionDuration,
  productionDurations,
  productionPlayableModes,
  productionUnlocked,
  soundSettings,
  onChangeChallengeLanguage,
  onProductionDurationChange,
  onSelectMode,
}: ModeSelectScreenProps) {
  const playTypingSound = useTypingSounds(soundSettings);

  function handleSelectMode(modeId: ModeId) {
    playTypingSound("select");
    onSelectMode?.(modeId);
  }

  function handleLanguageChange(language: ChallengeLanguage) {
    if (challengeLanguage !== language) {
      playTypingSound("select");
    }

    onChangeChallengeLanguage(language);
  }

  const productionModes = modes.filter(
    (item): item is TypingMode & { id: ProductionModeId } => item.group === "production",
  );
  const hasPlayableProductionMode = productionModes.some(
    (item) => productionPlayableModes[item.id],
  );

  return (
    <section className="mode-select-screen" aria-label="mode selection">
      <div className="mode-select-intro">
      <div className="mode-select-language">
        <span className="language-switch-label">Text</span>
        <div className="language-switch" aria-label="challenge language">
          {challengeLanguages.map((language) => (
            <button
              aria-pressed={challengeLanguage === language.id}
              className={challengeLanguage === language.id ? "selected" : ""}
              key={language.id}
              onClick={() => handleLanguageChange(language.id)}
              type="button"
            >
              <img className="flag-icon" src={language.flagSrc} alt="" aria-hidden="true" />
              {language.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mode-select-heading">
        <div className="panel-heading">
          <Gauge size={18} />
          <span>Modes</span>
        </div>
        <p>練習モードまたは本番モードを選択してください。</p>
      </div>

      </div>

      <div className="mode-select-group">
        <div className="mode-select-section">
          <div className="mode-select-section-heading">
            <span>Practice</span>
            <small>練習モード</small>
          </div>
          <div className="mode-select-grid practice-modes">
            {modes
              .filter((item) => item.group === "practice")
              .map((item) => (
                <ModeSelectCard
                  key={item.id}
                  locked={false}
                  mode={item}
                  onSelect={() => handleSelectMode(item.id)}
                />
              ))}
          </div>
        </div>

        <div className="mode-select-section production-section">
          <div className="mode-select-section-heading">
            <span>Rating</span>
            <small>本番モード</small>
          </div>
          {!hasPlayableProductionMode ? (
            <p className="alpha-lock-note">{ALPHA_PRODUCTION_LOCK_MESSAGE}</p>
          ) : null}
          <div className="duration-block mode-select-duration">
            <div className="segmented">
              {productionDurations.map((duration) => (
                <button
                  className={productionDuration === duration ? "selected" : ""}
                  disabled={!hasPlayableProductionMode}
                  key={duration}
                  onClick={() => onProductionDurationChange(duration)}
                  title={!hasPlayableProductionMode ? ALPHA_PRODUCTION_LOCK_MESSAGE : undefined}
                  type="button"
                >
                  {duration / 60}分
                </button>
              ))}
            </div>
          </div>
          <div className="mode-select-grid production-modes">
            {productionModes.map((item) => {
              const productionPlayable = productionPlayableModes[item.id];

              return (
                <ModeSelectCard
                  key={item.id}
                  lockLabel={productionPlayable ? "A0" : "Alpha"}
                  lockReason={
                    productionPlayable
                      ? "仮レーティング A0 以上で解放"
                      : ALPHA_PRODUCTION_LOCK_MESSAGE
                  }
                  locked={!productionPlayable || !productionUnlocked}
                  mode={item}
                  onSelect={() => handleSelectMode(item.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeSelectCard({
  lockLabel,
  lockReason,
  locked,
  mode,
  onSelect,
}: {
  lockLabel?: string;
  lockReason?: string;
  locked: boolean;
  mode: TypingMode;
  onSelect: () => void;
}) {
  const ModeIcon = modeIcons[mode.id];
  const cardContents = (
    <>
      <div className="mode-card-top">
        <span className="mode-icon" aria-hidden="true">
          <ModeIcon size={26} strokeWidth={2.2} />
        </span>
        <span className="mode-code">{mode.shortLabel}</span>
      </div>
      <div className="mode-card-copy">
        <strong>{mode.label}</strong>
        <small>{mode.description}</small>
      </div>
      {locked ? (
        <span className="mode-lock">
          <Lock size={15} />
          {lockLabel}
        </span>
      ) : null}
    </>
  );

  if (!locked) {
    return (
      <Link
        className="mode-select-card"
        href={getModePath(mode.id)}
        onClick={onSelect}
        title={mode.description}
      >
        {cardContents}
      </Link>
    );
  }

  return (
    <button
      className="mode-select-card locked"
      disabled
      title={lockReason}
      type="button"
    >
      {cardContents}
    </button>
  );
}
