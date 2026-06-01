"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  Lock,
  Play,
  RotateCcw,
  Timer,
  Waves,
  Zap,
} from "lucide-react";
import type {
  ClipboardEvent,
  CompositionEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  ReactNode,
  RefObject,
} from "react";
import {
  formatTimer,
  getRomajiInputProgress,
  type Metrics,
  type Rank,
  type RomajiInputTarget,
  type TypingMode,
} from "@/src/lib/typing";
import {
  createJapaneseFuriganaParts,
  type JapaneseFuriganaEntry,
  createJapaneseReadingGuideParts,
} from "@/src/lib/challenges";
import { getVisibleSessionRank } from "../_lib/session-rank-visibility";
import { type SoundSettings, useTypingSounds } from "../_lib/typing-sounds";
import type {
  ChallengeLanguage,
  FinishReason,
  KeyStabilitySample,
  MistakeFlash,
  RuntimeStats,
  SpeedDisplayUnit,
  StrictMistakeDisplayMode,
} from "../_lib/types";

type BlockableTextEvent =
  | FormEvent<HTMLTextAreaElement>
  | ClipboardEvent<HTMLTextAreaElement>
  | CompositionEvent<HTMLTextAreaElement>
  | DragEvent<HTMLTextAreaElement>;

type TypingPanelProps = {
  acceptsTextInput: boolean;
  challengeLanguage: ChallengeLanguage;
  correctionDebt: number;
  currentAccuracy: number;
  currentDisplay: string;
  currentFurigana: JapaneseFuriganaEntry[];
  currentGuide: string;
  currentReading: string;
  currentRomajiTarget: RomajiInputTarget | null;
  currentRank: Rank;
  elapsedSeconds: number | null;
  finishReason: FinishReason | null;
  imeError: string;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isFinished: boolean;
  isProductionBlocked: boolean;
  mistakeFlash: MistakeFlash | null;
  metrics: Metrics;
  mode: TypingMode;
  progress: number;
  productionBlockReason: string;
  remainingSeconds: number;
  showFuriganaDisplay: boolean;
  showHiraganaDisplay: boolean;
  showKanjiDisplay: boolean;
  soundSettings: SoundSettings;
  speedDisplayUnit: SpeedDisplayUnit;
  startedAt: number | null;
  stats: RuntimeStats;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  onBackToModeSelect: () => void;
  onImeInput: (input: string) => void;
  onImeKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPrepareSession: () => void;
  onPreventDirectTextInput: (event: BlockableTextEvent) => void;
  onResetSession: () => void;
};

export function TypingPanel({
  acceptsTextInput,
  challengeLanguage,
  correctionDebt,
  currentAccuracy,
  currentDisplay,
  currentFurigana,
  currentGuide,
  currentReading,
  currentRomajiTarget,
  currentRank,
  elapsedSeconds,
  finishReason,
  imeError,
  input,
  inputRef,
  isFinished,
  isProductionBlocked,
  mistakeFlash,
  metrics,
  mode,
  progress,
  productionBlockReason,
  remainingSeconds,
  showFuriganaDisplay,
  showHiraganaDisplay,
  showKanjiDisplay,
  soundSettings,
  speedDisplayUnit,
  startedAt,
  stats,
  strictMistakeDisplayMode,
  strictMistakeInput,
  onBackToModeSelect,
  onImeInput,
  onImeKeyDown,
  onPrepareSession,
  onPreventDirectTextInput,
  onResetSession,
}: TypingPanelProps) {
  const playTypingSound = useTypingSounds(soundSettings);
  const visibleRank = getVisibleSessionRank({
    elapsedSeconds,
    rankLabel: currentRank.label,
  });
  const speedMetric = getSpeedMetric(metrics.keysPerSecond, speedDisplayUnit);
  const SessionModeIcon = getSessionModeIcon(mode);
  const showDisplayText = challengeLanguage !== "ja" || showKanjiDisplay;

  function handleBackToModeSelect() {
    playTypingSound("back");
    onBackToModeSelect();
  }

  return (
    <section
      className={`practice-panel ${acceptsTextInput ? "ime-panel" : "direct-panel"}`}
      aria-label="typing practice"
    >
      <div className="meter-row">
        <Metric label="残り" value={formatTimer(remainingSeconds)} icon={<Timer size={17} />} />
        <Metric label={speedMetric.label} value={speedMetric.value} />
        <Metric label="正確率" value={`${(metrics.accuracy * 100).toFixed(1)}%`} />
        <Metric label="ミス" value={stats.mistakes.toString()} />
        <Metric label="物理打鍵" value={stats.physicalKeystrokes.toString()} />
        <Metric label="完了課題" value={stats.completedPrompts.toString()} />
      </div>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="session-head">
        <div>
          <p className="mode-label">{mode.label}</p>
          <h2>
            {SessionModeIcon ? (
              <span className="session-mode-symbol" aria-label={mode.label}>
                <SessionModeIcon size={72} strokeWidth={1.6} aria-hidden="true" />
              </span>
            ) : null}
            <span
              aria-label={visibleRank.isConcealed ? "Rank hidden for the first 30 seconds" : undefined}
              className={`session-rank-value ${visibleRank.isConcealed ? "concealed" : ""}`}
            >
              {visibleRank.label}
            </span>
            <span>{Math.round(metrics.score).toLocaleString()} pts</span>
          </h2>
        </div>
        <div className="actions">
          <button
            className="icon-button"
            onClick={handleBackToModeSelect}
            title="モード選択"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="icon-button primary"
            onClick={onPrepareSession}
            title="開始"
            type="button"
          >
            <Play size={18} />
          </button>
          <button
            className="icon-button"
            onClick={onResetSession}
            title="リセット"
            type="button"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {isProductionBlocked ? (
        <div className="locked-panel">
          <Lock size={28} />
          <p>{productionBlockReason}</p>
        </div>
      ) : (
        <>
          <div className="target-view" aria-label="current challenge">
            {mode.requiresIme ? (
              <>
                {showDisplayText ? (
                  <DisplayText
                    display={currentDisplay}
                    furigana={currentFurigana}
                    showFurigana={showFuriganaDisplay}
                  />
                ) : null}
                {showHiraganaDisplay && currentReading ? (
                  <p className="reading-text">{currentReading}</p>
                ) : null}
              </>
            ) : (
              <DirectChallengeView
                display={currentDisplay}
                furigana={currentFurigana}
                guide={currentGuide}
                input={input}
                mistakeFlash={mistakeFlash}
                reading={currentReading}
                romajiTarget={currentRomajiTarget}
                showFuriganaDisplay={showFuriganaDisplay}
                showHiraganaDisplay={showHiraganaDisplay}
                showDisplayText={showDisplayText}
                strictMistakeDisplayMode={strictMistakeDisplayMode}
                strictMistakeInput={strictMistakeInput}
              />
            )}
          </div>

          <CorrectionDebtIndicator debt={correctionDebt} />

          <ChallengeAnalysis
            acceptsTextInput={acceptsTextInput}
            currentAccuracy={currentAccuracy}
            currentDisplay={currentDisplay}
            input={input}
            metrics={metrics}
            speedDisplayUnit={speedDisplayUnit}
            stats={stats}
          />

          {acceptsTextInput ? (
            <textarea
              aria-label="typing input"
              className="typing-input"
              onChange={(event) => onImeInput(event.target.value)}
              onBeforeInput={onPreventDirectTextInput}
              onCompositionStart={onPreventDirectTextInput}
              onDrop={onPreventDirectTextInput}
              onKeyDown={onImeKeyDown}
              onPaste={onPreventDirectTextInput}
              placeholder={
                startedAt
                  ? challengeLanguage === "ja"
                    ? "IMEありで入力し、行が一致したら Enter"
                    : "英文を入力し、行が一致したら Enter"
                  : "開始ボタン、またはここで入力を始める"
              }
              ref={inputRef}
              value={input}
            />
          ) : null}
          {imeError ? <p className="error-line">{imeError}</p> : null}
        </>
      )}

      {isFinished ? (
        <div className={`result-band ${finishReason === "retired" ? "retired" : ""}`}>
          <CheckCircle2 size={20} />
          <span>
            {finishReason === "retired"
              ? "無入力が続いたためリタイアしました"
              : `セッション終了: ${currentRank.label} / ${Math.round(metrics.score).toLocaleString()} pts`}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function ChallengeAnalysis({
  acceptsTextInput,
  currentAccuracy,
  currentDisplay,
  input,
  metrics,
  speedDisplayUnit,
  stats,
}: {
  acceptsTextInput: boolean;
  currentAccuracy: number;
  currentDisplay: string;
  input: string;
  metrics: Metrics;
  speedDisplayUnit: SpeedDisplayUnit;
  stats: RuntimeStats;
}) {
  const tiles = acceptsTextInput
    ? getImeCorrectnessTiles(input, currentDisplay)
    : getDirectCorrectnessTiles(stats.keyStabilityHistory);
  const speedMetric = getSpeedMetric(metrics.keysPerSecond, speedDisplayUnit);
  const driftMs = getAverageAbsoluteDrift(stats.keyStabilityHistory, metrics.paceMs);

  return (
    <section className="challenge-analysis" aria-label="Live Analysis">
      <div className="challenge-analysis-title">Live Analysis</div>
      <div className="analysis-column correctness-column">
        <div className="analysis-heading">
          <span>正誤率</span>
          <strong>{(currentAccuracy * 100).toFixed(1)}%</strong>
          <small>ミス {stats.mistakes}</small>
        </div>
        <div className="correctness-tiles" aria-label="正誤履歴">
          {tiles.length === 0 ? (
            <span className="analysis-empty">入力待ち</span>
          ) : (
            tiles.map((tile) => (
              <span className={`correctness-tile ${tile.state}`} key={tile.id} title={tile.title}>
                {tile.label}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="analysis-column stability-column">
        <div className="analysis-heading">
          <span>安定度</span>
          <strong>{(metrics.consistency * 100).toFixed(0)}%</strong>
          <small>{speedMetric.label} {speedMetric.value}</small>
        </div>
        <div className="analysis-metrics">
          <div>
            <span>平均打鍵間隔</span>
            <strong>{metrics.paceMs ? `${metrics.paceMs.toFixed(0)} ms` : "--"}</strong>
          </div>
          <div>
            <span>ズレ平均</span>
            <strong>{driftMs ? `${driftMs.toFixed(0)} ms` : "--"}</strong>
          </div>
          <div>
            <span>物理打鍵</span>
            <strong>{stats.physicalKeystrokes}</strong>
          </div>
        </div>
        <div className="stability-mini-chart" aria-label="打鍵間隔の安定度グラフ">
          {stats.keyStabilityHistory.slice(-48).length === 0 ? (
            <span className="analysis-empty">入力待ち</span>
          ) : (
            stats.keyStabilityHistory.slice(-48).map((sample) => (
              <span
                className={getStabilityBarClass(sample, metrics.paceMs)}
                key={sample.id}
                style={{ height: `${getBarHeight(sample.intervalMs, metrics.paceMs)}%` }}
                title={formatSampleTitle(sample)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function getSessionModeIcon(mode: TypingMode) {
  if (mode.group !== "practice") {
    return null;
  }

  switch (mode.id) {
    case "practice-accuracy":
      return Crosshair;
    case "practice-flow":
      return Waves;
    case "practice-speed":
      return Zap;
    default:
      return null;
  }
}

function CorrectionDebtIndicator({ debt }: { debt: number }) {
  if (debt <= 0) {
    return null;
  }

  const visibleDots = Math.min(debt, 12);

  return (
    <div aria-live="polite" className="correction-debt" role="status">
      <span className="keycap">Backspace</span>
      <span className="debt-count">あと {debt} 回</span>
      <span className="debt-dots" aria-hidden="true">
        {Array.from({ length: visibleDots }, (_, index) => (
          <span key={index} />
        ))}
        {debt > visibleDots ? <em>+{debt - visibleDots}</em> : null}
      </span>
    </div>
  );
}

type CorrectnessTile = {
  id: string;
  label: string;
  state: "correct" | "wrong" | "correction" | "neutral";
  title: string;
};

function getSpeedMetric(keysPerSecond: number, unit: SpeedDisplayUnit) {
  if (unit === "keysPerMinute") {
    return {
      label: "打鍵/分",
      value: Math.round(keysPerSecond * 60).toLocaleString(),
    };
  }

  return {
    label: "打鍵/秒",
    value: keysPerSecond.toFixed(2),
  };
}

function getDirectCorrectnessTiles(history: KeyStabilitySample[]): CorrectnessTile[] {
  return history.slice(-48).map((sample) => {
    const state = sample.kind === "correction" ? "correction" : sample.isCorrect ? "correct" : "wrong";
    const label = formatKeyLabel(sample.key);

    return {
      id: `direct-${sample.id}`,
      label,
      state,
      title: formatSampleTitle(sample),
    };
  });
}

function getImeCorrectnessTiles(input: string, target: string): CorrectnessTile[] {
  const inputCharacters = Array.from(input);
  const targetCharacters = Array.from(target);
  const startIndex = Math.max(0, inputCharacters.length - 48);

  return inputCharacters.slice(startIndex).map((character, offset) => {
    const index = startIndex + offset;
    const expected = targetCharacters[index];
    const isCorrect = expected !== undefined && character === expected;
    const label = formatKeyLabel(character);

    return {
      id: `ime-${index}-${character}`,
      label,
      state: expected === undefined ? "wrong" : isCorrect ? "correct" : "wrong",
      title: `${label} / ${isCorrect ? "正打" : "ミス"}`,
    };
  });
}

function getAverageAbsoluteDrift(history: KeyStabilitySample[], averageMs: number) {
  const intervals = history
    .map((sample) => sample.intervalMs)
    .filter((interval): interval is number => interval !== null);

  if (intervals.length === 0 || averageMs === 0) {
    return 0;
  }

  return intervals.reduce((sum, interval) => sum + Math.abs(interval - averageMs), 0) / intervals.length;
}

function getStabilityBarClass(sample: KeyStabilitySample, averageMs: number) {
  if (!sample.isCorrect) {
    return "stability-mini-bar wrong";
  }

  if (sample.kind === "correction") {
    return "stability-mini-bar correction";
  }

  if (sample.intervalMs === null || averageMs === 0) {
    return "stability-mini-bar neutral";
  }

  const ratio = sample.intervalMs / averageMs;
  if (ratio < 0.72) {
    return "stability-mini-bar fast";
  }
  if (ratio > 1.42) {
    return "stability-mini-bar slow";
  }
  return "stability-mini-bar stable";
}

function getBarHeight(intervalMs: number | null, averageMs: number) {
  if (intervalMs === null || averageMs === 0) {
    return 34;
  }

  return Math.max(16, Math.min(100, (intervalMs / averageMs) * 54));
}

function formatKeyLabel(key: string) {
  if (key === " ") {
    return "SP";
  }

  if (key === "Backspace") {
    return "BS";
  }

  if (key.length > 2) {
    return "IME";
  }

  return key;
}

function formatSampleTitle(sample: KeyStabilitySample) {
  const interval = sample.intervalMs === null ? "開始" : `${sample.intervalMs} ms`;
  const state = sample.kind === "correction" ? "修正" : sample.isCorrect ? "正打" : "ミス";
  return `${formatKeyLabel(sample.key)} / ${interval} / ${state}`;
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="metric">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function DirectChallengeView({
  display,
  furigana,
  guide,
  input,
  mistakeFlash,
  reading,
  romajiTarget,
  showFuriganaDisplay,
  showHiraganaDisplay,
  showDisplayText,
  strictMistakeDisplayMode,
  strictMistakeInput,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  mistakeFlash: MistakeFlash | null;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showFuriganaDisplay: boolean;
  showHiraganaDisplay: boolean;
  showDisplayText: boolean;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
}) {
  const hasSeparateDisplay = display !== guide;

  return (
    <>
      {showDisplayText && hasSeparateDisplay ? (
        <DisplayText
          display={display}
          furigana={furigana}
          showFurigana={showFuriganaDisplay}
        />
      ) : null}
      {showHiraganaDisplay && reading ? (
        <p className="reading-text">
          {romajiTarget
            ? renderReadingGuideCharacters(reading, romajiTarget, input, mistakeFlash)
            : reading}
        </p>
      ) : null}
      <p
        className="input-target"
        aria-label={hasSeparateDisplay ? "romaji input target" : "input target"}
      >
        {romajiTarget
          ? renderRomajiGuideCharacters(
              romajiTarget,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
            )
          : renderGuideCharacters(
              guide,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
            )}
      </p>
    </>
  );
}

function DisplayText({
  display,
  furigana,
  showFurigana,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  showFurigana: boolean;
}) {
  return (
    <p className="display-text">
      {showFurigana && furigana.length > 0 ? (
        createJapaneseFuriganaParts(display, furigana).map((part, index) =>
          part.ruby ? (
            <ruby className="display-ruby" key={`${part.text}-${index}`}>
              {part.text}
              <rt>{part.ruby}</rt>
            </ruby>
          ) : (
            <span className="display-plain" key={`${part.text}-${index}`}>
              {part.text}
            </span>
          ),
        )
      ) : (
        display
      )}
    </p>
  );
}

function renderReadingGuideCharacters(
  reading: string,
  target: RomajiInputTarget,
  input: string,
  mistakeFlash: MistakeFlash | null,
) {
  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;

  return createJapaneseReadingGuideParts(reading).map((part, partIndex) => {
    if (part.kind === "visual") {
      return (
        <span className="visual-space" key={`reading-space-${partIndex}`} aria-hidden="true">
          {part.text}
        </span>
      );
    }

    const isCompleted = part.tokenEnd <= progress.completedTokens;
    const isCurrent =
      part.tokenStart <= progress.currentTokenIndex &&
      progress.currentTokenIndex < part.tokenEnd;
    const isMistakeFlash = flashTokenIndex !== null && isCurrent && !isCompleted;
    const className = isCompleted ? "char correct" : isCurrent ? "char current" : "char";
    const flashClassName = isMistakeFlash ? `${className} mistake-flash` : className;
    const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

    return (
      <span
        className={flashClassName}
        key={`reading-${part.tokenStart}-${part.text}-${partIndex}-${flashKey}`}
      >
        {part.text}
      </span>
    );
  });
}

function renderRomajiGuideCharacters(
  target: RomajiInputTarget,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
) {
  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;
  const flashCharacterIndex =
    mistakeFlash && progress.currentOption ? progress.currentOptionOffset : 0;
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let inputCharacterIndex = 0;
  let insertedMistakes = false;

  target.parts.forEach((part, partIndex) => {
    if (part.kind === "visual") {
      elements.push(
        <span className="visual-space" key={`space-${partIndex}`} aria-hidden="true">
          {part.text}
        </span>,
      );
      return;
    }

    const text =
      progress.currentTokenIndex === part.tokenIndex && progress.currentOption
        ? progress.currentOption
        : (progress.selectedOptions[part.tokenIndex] ?? part.text);

    Array.from(text).forEach((character, characterIndex) => {
      if (
        strictMistakeDisplayMode === "insert" &&
        !insertedMistakes &&
        inputCharacterIndex === input.length
      ) {
        elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "romaji-insert"));
        insertedMistakes = true;
      }

      const overwriteMistake = getOverwriteMistakeCharacter(
        mistakeCharacters,
        inputCharacterIndex,
        input.length,
        strictMistakeDisplayMode,
      );
      if (overwriteMistake) {
        elements.push(
          <span
            className="char wrong"
            key={`romaji-overwrite-${part.tokenIndex}-${characterIndex}`}
          >
            {overwriteMistake}
          </span>,
        );
        inputCharacterIndex += 1;
        return;
      }

      const isCompletedToken = part.tokenIndex < progress.completedTokens;
      const isCurrentToken = part.tokenIndex === progress.currentTokenIndex;
      const isTypedCurrentCharacter =
        isCurrentToken &&
        progress.currentOption !== null &&
        characterIndex < progress.currentOptionOffset;
      const isMistakeFlash =
        flashTokenIndex === part.tokenIndex &&
        characterIndex === flashCharacterIndex &&
        !isTypedCurrentCharacter;
      const className = isCompletedToken
        ? "char correct"
        : isCurrentToken
          ? isTypedCurrentCharacter
            ? "char correct current"
            : "char current"
          : "char";
      const flashClassName = isMistakeFlash ? `${className} mistake-flash` : className;
      const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

      elements.push(
        <span
          className={flashClassName}
          key={`${part.tokenIndex}-${character}-${characterIndex}-${flashKey}`}
        >
          {character}
        </span>,
      );
      inputCharacterIndex += 1;
    });
  });

  if (strictMistakeDisplayMode === "insert" && !insertedMistakes) {
    elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "romaji-insert"));
  }

  if (strictMistakeDisplayMode === "overwrite") {
    elements.push(
      ...renderStrictMistakeCharacters(
        mistakeCharacters.slice(Math.max(0, inputCharacterIndex - input.length)),
        "romaji-overwrite-tail",
      ),
    );
  }

  return elements;
}

function renderGuideCharacters(
  guide: string,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
) {
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let targetIndex = 0;
  let insertedMistakes = false;

  Array.from(guide).forEach((character, index) => {
    if (/\s/.test(character)) {
      elements.push(
        <span className="visual-space" key={`space-${index}`} aria-hidden="true">
          {character}
        </span>,
      );
      return;
    }

    const typed = input[targetIndex];
    const currentIndex = targetIndex;

    if (
      strictMistakeDisplayMode === "insert" &&
      !insertedMistakes &&
      currentIndex === input.length
    ) {
      elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "direct-insert"));
      insertedMistakes = true;
    }

    const overwriteMistake = getOverwriteMistakeCharacter(
      mistakeCharacters,
      currentIndex,
      input.length,
      strictMistakeDisplayMode,
    );
    targetIndex += 1;
    if (overwriteMistake) {
      elements.push(
        <span className="char wrong" key={`direct-overwrite-${index}`}>
          {overwriteMistake}
        </span>,
      );
      return;
    }

    const isMistakeFlash =
      mistakeFlash !== null && typed === undefined && currentIndex === input.length;

    const className =
      typed === undefined
        ? currentIndex === input.length
          ? "char current"
          : "char"
        : typed === character
          ? "char correct"
          : "char wrong";
    const flashClassName = isMistakeFlash ? `${className} mistake-flash` : className;
    const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

    elements.push(
      <span className={flashClassName} key={`${character}-${index}-${flashKey}`}>
        {character}
      </span>,
    );
  });

  if (strictMistakeDisplayMode === "insert" && !insertedMistakes) {
    elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "direct-insert"));
  }

  if (strictMistakeDisplayMode === "overwrite") {
    elements.push(
      ...renderStrictMistakeCharacters(
        mistakeCharacters.slice(Math.max(0, targetIndex - input.length)),
        "direct-overwrite-tail",
      ),
    );
  }

  return elements;
}

function getVisibleStrictMistakeCharacters(
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
) {
  return strictMistakeDisplayMode === "none" ? [] : Array.from(strictMistakeInput);
}

function getOverwriteMistakeCharacter(
  mistakeCharacters: string[],
  currentIndex: number,
  inputLength: number,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
) {
  if (strictMistakeDisplayMode !== "overwrite") {
    return null;
  }

  const mistakeIndex = currentIndex - inputLength;
  return mistakeIndex >= 0 ? (mistakeCharacters[mistakeIndex] ?? null) : null;
}

function renderStrictMistakeCharacters(mistakeCharacters: string[], keyPrefix: string) {
  return mistakeCharacters.map((character, index) => (
    <span className="char wrong" key={`${keyPrefix}-${index}`}>
      {character}
    </span>
  ));
}
