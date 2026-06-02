"use client";

import { ArrowLeft, MonitorCog, Wrench } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import mockJapaneseText from "@/src/lib/challenge-data/_mock/ja-mock.txt" with { type: "text" };
import {
  createJapaneseDirectChallenges,
  parseJapaneseChallengeText,
} from "@/src/lib/challenges";
import { createRomajiInputTarget, getRank, modes } from "@/src/lib/typing";
import {
  formatChallengeReading,
  removeRomajiVisualSpaces,
} from "../_lib/challenge-utils";
import { initialStats } from "../_lib/constants";
import type { AppSettings } from "../_lib/types";
import { InputSettingsSections } from "./InputSettingsSections";
import { TypingPanel } from "./TypingPanel";

type InputScreenSettingsScreenProps = {
  settings: AppSettings;
  onBack: () => void;
  onChange: (settings: Partial<AppSettings>) => void;
};

const mockChallenge =
  createJapaneseDirectChallenges(parseJapaneseChallengeText(mockJapaneseText))[0] ??
  createJapaneseDirectChallenges(parseJapaneseChallengeText("[例](れい)[文](ぶん)です。"))[0]!;

type StickyPreviewLayout = {
  height: number | null;
  scale: number;
};

export function calculateStickyPreviewScale(contentHeight: number, viewportHeight: number) {
  if (contentHeight <= 0 || viewportHeight <= 0) {
    return 1;
  }

  const maxHeight = viewportHeight * 0.5;
  return contentHeight > maxHeight ? maxHeight / contentHeight : 1;
}

export function InputScreenSettingsScreen({
  settings,
  onBack,
  onChange,
}: InputScreenSettingsScreenProps) {
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const [stickyPreviewLayout, setStickyPreviewLayout] = useState<StickyPreviewLayout>({
    height: null,
    scale: 1,
  });
  const romajiSource =
    settings.showRomajiWordSpaces || !mockChallenge.romajiSource
      ? (mockChallenge.romajiSource ?? mockChallenge.input)
      : removeRomajiVisualSpaces(mockChallenge.romajiSource);
  const romajiTarget = createRomajiInputTarget(romajiSource, {
    preset: settings.romajiInputPreset,
    selections: settings.romajiInputSelections,
    allowSplitYoon: settings.allowSplitYoon,
    sokuon: settings.sokuonInput,
  });
  const visibleMockInput = removeRomajiVisualSpaces(romajiTarget.guide).slice(0, 7);
  const stickyPreviewStyle: CSSProperties =
    stickyPreviewLayout.height === null ? {} : { height: stickyPreviewLayout.height };
  const previewScaleStyle: CSSProperties = {
    transform: `scale(${stickyPreviewLayout.scale})`,
  };

  useEffect(() => {
    const previewContent = previewContentRef.current;
    if (!previewContent) {
      return;
    }

    let animationFrameId: number | null = null;

    const updatePreviewLayout = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const contentHeight = previewContent.scrollHeight;
        const scale = calculateStickyPreviewScale(contentHeight, window.innerHeight);
        setStickyPreviewLayout({
          height: contentHeight * scale,
          scale,
        });
        animationFrameId = null;
      });
    };

    updatePreviewLayout();

    const resizeObserver = new ResizeObserver(updatePreviewLayout);
    resizeObserver.observe(previewContent);
    window.addEventListener("resize", updatePreviewLayout);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePreviewLayout);
    };
  }, []);

  return (
    <section className="settings-screen input-screen-settings-screen" aria-label="input screen settings">
      <div className="settings-head">
        <div>
          <div className="panel-heading">
            <MonitorCog size={18} />
            <span>Screen Settings</span>
          </div>
          <h2>入力画面設定</h2>
        </div>
        <button className="icon-button" onClick={onBack} title="戻る" type="button">
          <ArrowLeft size={18} />
        </button>
      </div>

      <section className="input-screen-settings-preview" aria-label="input screen mock">
        <div className="input-screen-settings-preview-sticky" style={stickyPreviewStyle}>
          <div
            className="input-screen-settings-preview-scale"
            ref={previewContentRef}
            style={previewScaleStyle}
          >
            <TypingPanel
              acceptsTextInput={false}
              challengeLanguage="ja"
              correctionDebt={0}
              currentAccuracy={1}
              currentDisplay={mockChallenge.display}
              currentFurigana={mockChallenge.furigana ?? []}
              currentGuide={romajiTarget.guide}
              currentReading={formatChallengeReading(
                mockChallenge.reading ?? "",
                settings.showRomajiWordSpaces,
              )}
              currentRomajiTarget={romajiTarget}
              currentRank={getRank(500)}
              elapsedSeconds={31}
              finishReason={null}
              imeError=""
              input={visibleMockInput}
              inputRef={{ current: null }}
              isFinished={false}
              isProductionBlocked={false}
              mistakeFlash={null}
              metrics={{
                accuracy: 1,
                consistency: 1,
                keysPerSecond: 5.2,
                paceMs: 192,
                score: 500,
              }}
              mode={modes[0]!}
              progress={18}
              productionBlockReason=""
              remainingSeconds={104}
              showFuriganaDisplay={settings.showFuriganaDisplay}
              showFuriganaMarker={settings.showFuriganaMarker}
              showHiraganaDisplay={settings.showHiraganaDisplay}
              showHiraganaMarker={settings.showHiraganaMarker}
              showKanjiDisplay={settings.showKanjiDisplay}
              showKanjiMarker={settings.showKanjiMarker}
              showRomajiMarker={settings.showRomajiMarker}
              soundSettings={settings}
              speedDisplayUnit={settings.speedDisplayUnit}
              startedAt={Date.now() - 16000}
              sessionModeIcon={Wrench}
              sessionModeLabel="入力画面設定"
              stats={{
                ...initialStats,
                characterAttempts: visibleMockInput.length,
                completedPrompts: 0,
                correctCharacters: visibleMockInput.length,
                keystrokes: visibleMockInput.length,
                physicalKeystrokes: visibleMockInput.length,
                scoredInputLength: visibleMockInput.length,
              }}
              strictMistakeDisplayMode={settings.strictMistakeDisplayMode}
              strictMistakeInput=""
              topDisplayMetricIds={settings.topDisplayMetricIds}
              onBackToModeSelect={() => undefined}
              onImeInput={() => undefined}
              onImeKeyDown={() => undefined}
              onPrepareSession={() => undefined}
              onPreventDirectTextInput={() => undefined}
              onResetSession={() => undefined}
            />
          </div>
        </div>
      </section>

      <div className="settings-list">
        <InputSettingsSections settings={settings} onChange={onChange} />
      </div>
    </section>
  );
}
