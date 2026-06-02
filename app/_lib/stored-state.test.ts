import { describe, expect, test } from "bun:test";
import { initialStoredState } from "./constants";
import {
  cacheStoredState,
  getInitialStoredState,
  normalizeStoredState,
  resetStoredStateCache,
  shouldPersistStoredState,
} from "./stored-state";

describe("stored state persistence", () => {
  test("does not persist the initial state before storage hydration finishes", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: false,
        skipNextPersist: false,
      }),
    ).toBe(false);
  });

  test("persists after hydration unless the next persist was explicitly skipped", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: false,
      }),
    ).toBe(true);

    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: true,
      }),
    ).toBe(false);
  });

  test("reuses the last loaded state while the next route hydrates storage", () => {
    resetStoredStateCache();

    const loadedState = {
      ...initialStoredState,
      bestPracticeScore: 1200,
      bestProductionScore: 2400,
    };

    cacheStoredState(loadedState);

    expect(getInitialStoredState()).toEqual(loadedState);
  });

  test("fills the speed display setting when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        speedDisplayUnit: undefined,
      },
    });

    expect(stored.settings.speedDisplayUnit).toBe("keysPerSecond");
  });

  test("fills the strict mistake display setting when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        strictMistakeDisplayMode: undefined,
      },
    });

    expect(stored.settings.strictMistakeDisplayMode).toBe("overwrite");
  });

  test("fills top display metrics when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        topDisplayMetricIds: undefined,
      },
    });

    expect(stored.settings.topDisplayMetricIds).toEqual([
      "remainingTime",
      "keysPerSecond",
      "accuracy",
      "mistakes",
      "physicalKeystrokes",
      "completedPrompts",
    ]);
  });

  test("keeps an explicitly empty top display metric selection", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        topDisplayMetricIds: [],
      },
    });

    expect(stored.settings.topDisplayMetricIds).toEqual([]);
  });

  test("fills input screen visibility settings when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showKanjiDisplay: undefined,
        showFuriganaDisplay: undefined,
        showHiraganaDisplay: undefined,
      },
    });

    expect(stored.settings.showKanjiDisplay).toBe(true);
    expect(stored.settings.showFuriganaDisplay).toBe(true);
    expect(stored.settings.showHiraganaDisplay).toBe(true);
  });

  test("fills marker visibility settings when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showKanjiMarker: undefined,
        showFuriganaMarker: undefined,
        showHiraganaMarker: undefined,
        showRomajiMarker: undefined,
      },
    });

    expect(stored.settings.showKanjiMarker).toBe(false);
    expect(stored.settings.showFuriganaMarker).toBe(false);
    expect(stored.settings.showHiraganaMarker).toBe(true);
    expect(stored.settings.showRomajiMarker).toBe(true);
  });

  test("turns furigana display off when kanji display is off in stored settings", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showKanjiDisplay: false,
        showFuriganaDisplay: true,
      },
    });

    expect(stored.settings.showKanjiDisplay).toBe(false);
    expect(stored.settings.showFuriganaDisplay).toBe(false);
  });

  test("turns markers off when their display targets are hidden in stored settings", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showFuriganaDisplay: false,
        showFuriganaMarker: true,
        showHiraganaDisplay: false,
        showHiraganaMarker: true,
        showKanjiDisplay: false,
        showKanjiMarker: true,
        showRomajiMarker: true,
      },
    });

    expect(stored.settings.showKanjiMarker).toBe(false);
    expect(stored.settings.showFuriganaMarker).toBe(false);
    expect(stored.settings.showHiraganaMarker).toBe(false);
    expect(stored.settings.showRomajiMarker).toBe(true);
  });

  test("fills auto retire performance settings when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        consecutiveMistypeRetireCount: undefined,
        accuracyRetireBorderPercent: undefined,
      },
    });

    expect(stored.settings.consecutiveMistypeRetireCount).toBe(0);
    expect(stored.settings.accuracyRetireBorderPercent).toBe(0);
  });
});
