import {
  defaultTopDisplayMetricIds,
  initialSettings,
  initialStoredState,
  storageKey,
  topDisplayMetricOptions,
} from "./constants";
import type { AppSettings, StoredState } from "./types";

let cachedStoredState: StoredState | null = null;

export function getInitialStoredState() {
  return cachedStoredState ?? initialStoredState;
}

export function cacheStoredState(storedState: StoredState) {
  cachedStoredState = storedState;
}

export function resetStoredStateCache() {
  cachedStoredState = null;
}

export function normalizeAppSettings(settings: AppSettings): AppSettings {
  const showFuriganaDisplay = settings.showKanjiDisplay && settings.showFuriganaDisplay;

  return {
    ...settings,
    showFuriganaDisplay,
    showKanjiMarker: settings.showKanjiDisplay && settings.showKanjiMarker,
    showFuriganaMarker: showFuriganaDisplay && settings.showFuriganaMarker,
    showHiraganaMarker: settings.showHiraganaDisplay && settings.showHiraganaMarker,
    topDisplayMetricIds: normalizeTopDisplayMetricIds(settings.topDisplayMetricIds),
  };
}

export function normalizeStoredState(storedState: Partial<StoredState> | null | undefined) {
  return {
    ...initialStoredState,
    ...storedState,
    settings: normalizeAppSettings({
      ...initialSettings,
      ...storedState?.settings,
      showKanjiDisplay:
        storedState?.settings?.showKanjiDisplay ?? initialSettings.showKanjiDisplay,
      showFuriganaDisplay:
        storedState?.settings?.showFuriganaDisplay ?? initialSettings.showFuriganaDisplay,
      showHiraganaDisplay:
        storedState?.settings?.showHiraganaDisplay ?? initialSettings.showHiraganaDisplay,
      showKanjiMarker:
        storedState?.settings?.showKanjiMarker ?? initialSettings.showKanjiMarker,
      showFuriganaMarker:
        storedState?.settings?.showFuriganaMarker ?? initialSettings.showFuriganaMarker,
      showHiraganaMarker:
        storedState?.settings?.showHiraganaMarker ?? initialSettings.showHiraganaMarker,
      showRomajiMarker:
        storedState?.settings?.showRomajiMarker ?? initialSettings.showRomajiMarker,
      speedDisplayUnit: storedState?.settings?.speedDisplayUnit ?? initialSettings.speedDisplayUnit,
      strictMistakeDisplayMode:
        storedState?.settings?.strictMistakeDisplayMode ??
        initialSettings.strictMistakeDisplayMode,
      topDisplayMetricIds:
        storedState?.settings?.topDisplayMetricIds ?? [...defaultTopDisplayMetricIds],
      consecutiveMistypeRetireCount:
        storedState?.settings?.consecutiveMistypeRetireCount ??
        initialSettings.consecutiveMistypeRetireCount,
      accuracyRetireBorderPercent:
        storedState?.settings?.accuracyRetireBorderPercent ??
        initialSettings.accuracyRetireBorderPercent,
      sokuonInput: {
        ...initialSettings.sokuonInput,
        ...storedState?.settings?.sokuonInput,
      },
    }),
  };
}

function normalizeTopDisplayMetricIds(value: AppSettings["topDisplayMetricIds"]) {
  if (!Array.isArray(value)) {
    return [...defaultTopDisplayMetricIds];
  }

  const validIds = new Set(topDisplayMetricOptions.map((option) => option.id));
  return value.filter((id) => validIds.has(id));
}

export function readStoredState(
  storage: Pick<Storage, "getItem" | "removeItem">,
): StoredState {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return initialStoredState;
  }

  try {
    return normalizeStoredState(JSON.parse(raw) as Partial<StoredState>);
  } catch {
    storage.removeItem(storageKey);
    return initialStoredState;
  }
}

export function shouldPersistStoredState({
  hasLoadedStoredState,
  skipNextPersist,
}: {
  hasLoadedStoredState: boolean;
  skipNextPersist: boolean;
}) {
  return hasLoadedStoredState && !skipNextPersist;
}
