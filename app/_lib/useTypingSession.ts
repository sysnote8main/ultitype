"use client";

import {
  type ClipboardEvent,
  type CompositionEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type DirectChallenge, englishLongChallenges, longChallenges } from "@/src/lib/challenges";
import {
  type ModeId,
  applyDirectKey,
  calculateMetrics,
  countCorrectAtSamePositions,
  countImeCorrectCharacters,
  getRank,
  isImeSubmissionMatch,
  isProductionUnlocked,
  modes,
  shouldAcceptTextInput,
} from "@/src/lib/typing";
import {
  ignoredKeys,
  initialSettings,
  initialStats,
  initialStoredState,
  storageKey,
} from "./constants";
import {
  estimateImeKeystrokes,
  getDirectChallenges,
  removeRomajiVisualSpaces,
} from "./challenge-utils";
import type {
  AppSettings,
  ChallengeLanguage,
  DirectKeyEvent,
  FinishReason,
  ProductionDuration,
  RuntimeStats,
  Screen,
  StoredSession,
  StoredState,
} from "./types";

export function useTypingSession() {
  const [stored, setStored] = useState<StoredState>(initialStoredState);
  const [modeId, setModeId] = useState<ModeId>("practice-accuracy");
  const [screen, setScreen] = useState<Screen>("mode-select");
  const [challengeLanguage, setChallengeLanguage] = useState<ChallengeLanguage>("ja");
  const [productionDuration, setProductionDuration] = useState<ProductionDuration>(300);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<RuntimeStats>(initialStats);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finishReason, setFinishReason] = useState<FinishReason | null>(null);
  const [imeError, setImeError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mode = modes.find((item) => item.id === modeId) ?? modes[0];
  const acceptsTextInput = shouldAcceptTextInput(mode);
  const durationSeconds = mode.group === "production" ? productionDuration : mode.durationSeconds;
  const elapsedSeconds = startedAt ? Math.min((now - startedAt) / 1000, durationSeconds) : 0;
  const remainingSeconds = durationSeconds - elapsedSeconds;
  const productionUnlocked = isProductionUnlocked(stored.bestPracticeScore);
  const directChallenges = getDirectChallenges(challengeLanguage, mode.group);
  const currentDirectChallenge =
    directChallenges[challengeIndex % directChallenges.length] ??
    ({
      display: "",
      guide: "",
      input: "",
    } satisfies DirectChallenge);
  const imeChallenges = challengeLanguage === "ja" ? longChallenges : englishLongChallenges;
  const currentImeChallenge = imeChallenges[challengeIndex % imeChallenges.length] ?? "";
  const currentDisplay = mode.requiresIme
    ? currentImeChallenge
    : currentDirectChallenge.display;
  const currentInputTarget = mode.requiresIme
    ? currentImeChallenge
    : currentDirectChallenge.input;
  const currentGuide =
    challengeLanguage === "ja" &&
    !mode.requiresIme &&
    !stored.settings.showRomajiWordSpaces &&
    currentDirectChallenge.guide
      ? removeRomajiVisualSpaces(currentDirectChallenge.guide)
      : currentDirectChallenge.guide;
  const bestPracticeRank = getRank(stored.bestPracticeScore);
  const bestProductionRank = getRank(stored.bestProductionScore);

  const metrics = useMemo(
    () =>
      calculateMetrics({
        elapsedSeconds,
        keystrokes: stats.keystrokes,
        characterAttempts: stats.characterAttempts,
        correctCharacters: stats.correctCharacters,
        mistakes: stats.mistakes,
        intervals: stats.intervals,
        accuracyExponent: mode.accuracyExponent,
        useFlowMultiplier: mode.id === "practice-flow",
      }),
    [elapsedSeconds, mode.accuracyExponent, mode.id, stats],
  );

  const currentRank = getRank(metrics.score);
  const currentCorrect = mode.requiresIme
    ? countImeCorrectCharacters(input, currentDisplay)
    : countCorrectAtSamePositions(input, currentInputTarget);
  const currentAccuracy =
    mode.requiresIme && currentDisplay.length > 0
      ? currentCorrect / currentDisplay.length
      : input.length > 0
        ? currentCorrect / input.length
        : 1;
  const isProductionBlocked = mode.group === "production" && !productionUnlocked;
  const progress = Math.min(100, (elapsedSeconds / durationSeconds) * 100);
  const correctionDebt = !acceptsTextInput && mode.lockMistakes ? stats.mistakeDebt : 0;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      setStored({
        ...initialStoredState,
        ...parsed,
        settings: {
          ...initialSettings,
          ...parsed.settings,
        },
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [stored]);

  useEffect(() => {
    document.documentElement.dataset.theme = stored.settings.theme;
  }, [stored.settings.theme]);

  useEffect(() => {
    if (!startedAt || isFinished) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => window.clearInterval(timer);
  }, [isFinished, startedAt]);

  useEffect(() => {
    if (startedAt && !isFinished && remainingSeconds <= 0) {
      finishSession();
    }
  });

  useEffect(() => {
    const idleRetireMs = stored.settings.idleRetireSeconds * 1000;
    if (!startedAt || isFinished || idleRetireMs <= 0 || isProductionBlocked) {
      return;
    }

    const lastActivityAt = stats.lastInputAt ?? startedAt;
    if (now - lastActivityAt >= idleRetireMs) {
      finishSession("retired");
    }
  });

  useEffect(() => {
    if (screen !== "typing" || acceptsTextInput || isProductionBlocked) {
      return;
    }

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      handleDirectKeyDown(event);
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  });

  function prepareSession() {
    setStats(initialStats);
    setInput("");
    setChallengeIndex(0);
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
    window.requestAnimationFrame(() => {
      if (acceptsTextInput) {
        inputRef.current?.focus();
        return;
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }

  function beginSession() {
    const timestamp = Date.now();
    setStartedAt(timestamp);
    setNow(timestamp);
    setIsFinished(false);
  }

  function resetSession() {
    setStats(initialStats);
    setInput("");
    setChallengeIndex(0);
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
  }

  function finishSession(reason: FinishReason = "completed") {
    if (isFinished) {
      return;
    }

    setIsFinished(true);
    setFinishReason(reason);

    if (reason === "retired") {
      return;
    }

    const session: StoredSession = {
      modeId,
      challengeLanguage,
      score: metrics.score,
      rank: currentRank.label,
      accuracy: metrics.accuracy,
      keysPerSecond: metrics.keysPerSecond,
      createdAt: new Date().toISOString(),
    };

    setStored((previous) => ({
      settings: previous.settings,
      bestPracticeScore:
        mode.group === "practice"
          ? Math.max(previous.bestPracticeScore, metrics.score)
          : previous.bestPracticeScore,
      bestProductionScore:
        mode.group === "production"
          ? Math.max(previous.bestProductionScore, metrics.score)
          : previous.bestProductionScore,
      sessions: [session, ...previous.sessions].slice(0, 8),
    }));
  }

  function selectMode(nextModeId: ModeId) {
    const nextMode = modes.find((item) => item.id === nextModeId);
    if (!nextMode || (nextMode.group === "production" && !productionUnlocked)) {
      return;
    }

    setModeId(nextModeId);
    resetSession();
    setScreen("typing");
  }

  function returnToModeSelect() {
    resetSession();
    setScreen("mode-select");
  }

  function openSettings() {
    resetSession();
    setScreen("settings");
  }

  function changeChallengeLanguage(nextLanguage: ChallengeLanguage) {
    if (challengeLanguage === nextLanguage) {
      return;
    }

    setChallengeLanguage(nextLanguage);
    resetSession();
  }

  function updateSettings(nextSettings: Partial<AppSettings>) {
    setStored((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        ...nextSettings,
      },
    }));
  }

  function recordKey(metricKeystrokes = 1, physicalKeystrokes = 1) {
    const timestamp = Date.now();

    setStats((previous) => ({
      ...previous,
      keystrokes: previous.keystrokes + metricKeystrokes,
      physicalKeystrokes: previous.physicalKeystrokes + physicalKeystrokes,
      intervals:
        previous.lastKeyAt === null
          ? previous.intervals
          : [...previous.intervals, timestamp - previous.lastKeyAt],
      lastKeyAt: timestamp,
      lastInputAt: timestamp,
    }));
  }

  function handleDirectKeyDown(event: DirectKeyEvent) {
    if (acceptsTextInput || isFinished) {
      return;
    }

    if (ignoredKeys.has(event.key)) {
      return;
    }

    if (event.key !== "Backspace" && event.key.length !== 1) {
      return;
    }

    event.preventDefault();

    if (!startedAt) {
      beginSession();
    }

    const result = applyDirectKey({
      state: {
        input,
        mistakeDebt: stats.mistakeDebt,
        characterAttempts: stats.characterAttempts,
        correctCharacters: stats.correctCharacters,
        mistakes: stats.mistakes,
        completedPrompts: stats.completedPrompts,
      },
      key: event.key,
      target: currentInputTarget,
      lockMistakes: mode.lockMistakes,
    });

    recordKey();
    setStats((previous) => ({
      ...previous,
      characterAttempts: result.state.characterAttempts,
      correctCharacters: result.state.correctCharacters,
      mistakes: result.state.mistakes,
      mistakeDebt: result.state.mistakeDebt,
      completedPrompts: result.state.completedPrompts,
      lastKeyAt:
        result.state.completedPrompts > previous.completedPrompts ? null : previous.lastKeyAt,
    }));

    setInput(result.state.input);

    if (result.state.completedPrompts > stats.completedPrompts) {
      setChallengeIndex((previous) => previous + 1);
    }
  }

  function handleImeKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (!acceptsTextInput || isFinished) {
      return;
    }

    if (!ignoredKeys.has(event.key)) {
      if (!startedAt) {
        beginSession();
      }
      recordKey(0, 1);
    }

    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    const matches = isImeSubmissionMatch(input, currentDisplay);

    if (!matches) {
      setImeError("課題文と一致していません。修正してから Enter で提出してください。");
      setStats((previous) => ({ ...previous, mistakes: previous.mistakes + 1 }));
      return;
    }

    const estimatedKeystrokes = estimateImeKeystrokes(currentDisplay);
    setStats((previous) => ({
      ...previous,
      keystrokes: previous.keystrokes + estimatedKeystrokes,
      characterAttempts: previous.characterAttempts + currentDisplay.length,
      correctCharacters: previous.correctCharacters + currentDisplay.length,
      completedPrompts: previous.completedPrompts + 1,
    }));
    setInput("");
    setImeError("");
    setChallengeIndex((previous) => previous + 1);
  }

  function handleImeInput(nextInput: string) {
    if (!acceptsTextInput) {
      return;
    }

    setInput(nextInput);
    if (imeError) {
      setImeError("");
    }
  }

  function preventDirectTextInput(
    event:
      | FormEvent<HTMLTextAreaElement>
      | ClipboardEvent<HTMLTextAreaElement>
      | CompositionEvent<HTMLTextAreaElement>
      | DragEvent<HTMLTextAreaElement>,
  ) {
    if (!acceptsTextInput) {
      event.preventDefault();
    }
  }

  return {
    bestPracticeRank,
    bestProductionRank,
    challengeLanguage,
    currentAccuracy,
    productionDuration,
    productionUnlocked,
    screen,
    settings: stored.settings,
    sessions: stored.sessions,
    typingPanelProps: {
      acceptsTextInput,
      challengeLanguage,
      correctionDebt,
      currentDisplay,
      currentGuide: currentGuide ?? currentInputTarget,
      currentRank,
      finishReason,
      imeError,
      input,
      inputRef,
      isFinished,
      isProductionBlocked,
      metrics,
      mode,
      progress,
      remainingSeconds,
      startedAt,
      stats,
      onBackToModeSelect: returnToModeSelect,
      onImeInput: handleImeInput,
      onImeKeyDown: handleImeKeyDown,
      onPrepareSession: prepareSession,
      onPreventDirectTextInput: preventDirectTextInput,
      onResetSession: resetSession,
    },
    bestPracticeScore: stored.bestPracticeScore,
    bestProductionScore: stored.bestProductionScore,
    metrics,
    stats,
    changeChallengeLanguage,
    openSettings,
    selectMode,
    setProductionDuration,
    showModeSelect: () => setScreen("mode-select"),
    updateSettings,
  };
}
