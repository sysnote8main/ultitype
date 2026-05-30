import { useCallback, useEffect, useRef, useState } from "react";
import type { ModeGroup } from "@/src/lib/typing";
import { storageKey } from "./constants";
import type { AppSettings } from "./types";

export type TypingSoundKind = "normal" | "mistake" | "finish" | "record" | "select" | "back";
export type SoundSettings = Pick<
  AppSettings,
  "soundVolume" | "typingSoundEnabled" | "uiSoundEnabled"
>;

const clickSoundSources = ["/sounds/click1.ogg", "/sounds/click2.ogg"] as const;
const mistakeSoundSource = "/sounds/switch_002.ogg";
const finishSoundSource = "/sounds/confirmation_001.ogg";
const recordSoundSource = "/sounds/confirmation_004.ogg";
const selectSoundSource = "/sounds/select_005.ogg";
const backSoundSource = "/sounds/minimize_008.ogg";
const audioPoolSize = 4;

type FinishSoundInput = {
  modeGroup: ModeGroup;
  score: number;
  bestPracticeScore: number;
  bestProductionScore: number;
};

type TypingSoundSource =
  | (typeof clickSoundSources)[number]
  | typeof mistakeSoundSource
  | typeof finishSoundSource
  | typeof recordSoundSource
  | typeof selectSoundSource
  | typeof backSoundSource;

type ChromeTabMutedInfo = {
  muted?: boolean;
};

type ChromeTab = {
  mutedInfo?: ChromeTabMutedInfo;
};

type ChromeTabChangeInfo = {
  mutedInfo?: ChromeTabMutedInfo;
};

type ChromeTabsEvent<Listener> = {
  addListener?: (listener: Listener) => void;
  removeListener?: (listener: Listener) => void;
};

type ChromeTabsApi = {
  query?: (
    queryInfo: { active: true; currentWindow: true },
    callback: (tabs: ChromeTab[]) => void,
  ) => void;
  onActivated?: ChromeTabsEvent<() => void>;
  onUpdated?: ChromeTabsEvent<(tabId: number, changeInfo: ChromeTabChangeInfo) => void>;
};

type ChromeApi = {
  runtime?: {
    lastError?: unknown;
  };
  tabs?: ChromeTabsApi;
};

const defaultSoundSettings: SoundSettings = {
  soundVolume: 0.7,
  typingSoundEnabled: true,
  uiSoundEnabled: true,
};

export function getFinishSoundKind({
  modeGroup,
  score,
  bestPracticeScore,
  bestProductionScore,
}: FinishSoundInput): Extract<TypingSoundKind, "finish" | "record"> {
  const bestScore = modeGroup === "practice" ? bestPracticeScore : bestProductionScore;

  return score > bestScore ? "record" : "finish";
}

export function getTypingSoundSource(
  kind: TypingSoundKind,
  random: () => number = Math.random,
): TypingSoundSource {
  if (kind === "mistake") {
    return mistakeSoundSource;
  }

  if (kind === "finish") {
    return finishSoundSource;
  }

  if (kind === "record") {
    return recordSoundSource;
  }

  if (kind === "select") {
    return selectSoundSource;
  }

  if (kind === "back") {
    return backSoundSource;
  }

  return clickSoundSources[Math.floor(random() * clickSoundSources.length)] ?? clickSoundSources[0];
}

export function getSoundPlaybackConfig(
  kind: TypingSoundKind,
  settings: SoundSettings = defaultSoundSettings,
) {
  const volume = clamp(settings.soundVolume, 0, 1);
  const isTypingSound = kind === "normal" || kind === "mistake";
  const isEnabled = isTypingSound ? settings.typingSoundEnabled : settings.uiSoundEnabled;

  return {
    shouldPlay: isEnabled && volume > 0,
    volume,
  };
}

export function getChromeActiveTabMuted(chromeApi: ChromeApi | undefined = getGlobalChromeApi()) {
  const query = chromeApi?.tabs?.query;
  if (!query) {
    return Promise.resolve(null);
  }

  return new Promise<boolean | null>((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let settled = false;
    const settle = (value: boolean | null) => {
      if (settled) {
        return;
      }

      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve(value);
    };

    timeoutId = setTimeout(() => settle(null), 250);

    try {
      query({ active: true, currentWindow: true }, (tabs) => {
        if (chromeApi.runtime?.lastError) {
          settle(null);
          return;
        }

        const muted = tabs[0]?.mutedInfo?.muted;
        settle(typeof muted === "boolean" ? muted : null);
      });
    } catch {
      settle(null);
    }
  });
}

export function useChromeActiveTabMuted() {
  const [isMuted, setIsMuted] = useState<boolean | null>(null);

  useEffect(() => {
    const chromeApi = getGlobalChromeApi();
    let isCurrent = true;

    const refreshMutedState = () => {
      void getChromeActiveTabMuted(chromeApi).then((nextMuted) => {
        if (isCurrent) {
          setIsMuted(nextMuted);
        }
      });
    };

    refreshMutedState();

    const handleActivated = () => refreshMutedState();
    const handleUpdated = (_tabId: number, changeInfo: ChromeTabChangeInfo) => {
      if ("mutedInfo" in changeInfo) {
        refreshMutedState();
      }
    };

    chromeApi?.tabs?.onActivated?.addListener?.(handleActivated);
    chromeApi?.tabs?.onUpdated?.addListener?.(handleUpdated);

    return () => {
      isCurrent = false;
      chromeApi?.tabs?.onActivated?.removeListener?.(handleActivated);
      chromeApi?.tabs?.onUpdated?.removeListener?.(handleUpdated);
    };
  }, []);

  return isMuted;
}

export function useTypingSounds(settings?: SoundSettings) {
  const poolsRef = useRef<Partial<Record<TypingSoundSource, HTMLAudioElement[]>>>({});
  const poolIndexesRef = useRef<Partial<Record<TypingSoundSource, number>>>({});

  return useCallback((kind: TypingSoundKind) => {
    if (typeof Audio === "undefined") {
      return;
    }

    const playback = getSoundPlaybackConfig(kind, settings ?? readStoredSoundSettings());
    if (!playback.shouldPlay) {
      return;
    }

    const source = getTypingSoundSource(kind);
    const pool =
      poolsRef.current[source] ??
      Array.from({ length: audioPoolSize }, () => {
        const audio = new Audio(source);
        audio.preload = "auto";
        return audio;
      });

    poolsRef.current[source] = pool;

    const poolIndex = poolIndexesRef.current[source] ?? 0;
    const audio = pool[poolIndex % pool.length];
    poolIndexesRef.current[source] = poolIndex + 1;

    if (!audio) {
      return;
    }

    audio.volume = playback.volume;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [settings]);
}

function readStoredSoundSettings(): SoundSettings {
  if (typeof window === "undefined") {
    return defaultSoundSettings;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<{ settings: Partial<SoundSettings> }>) : null;

    return {
      ...defaultSoundSettings,
      ...parsed?.settings,
    };
  } catch {
    return defaultSoundSettings;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getGlobalChromeApi(): ChromeApi | undefined {
  return (globalThis as { chrome?: ChromeApi }).chrome;
}
