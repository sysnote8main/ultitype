import { useCallback, useRef } from "react";
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
