import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createRomajiInputTarget, getRank, modes } from "@/src/lib/typing";
import { initialSettings, initialStats } from "../_lib/constants";
import { TypingPanel } from "./TypingPanel";

type TypingPanelProps = Parameters<typeof TypingPanel>[0];

function renderTypingPanel(overrides: Partial<TypingPanelProps> = {}) {
  const props: TypingPanelProps = {
    acceptsTextInput: false,
    challengeLanguage: "en",
    correctionDebt: 0,
    currentAccuracy: 1,
    currentDisplay: "ab",
    currentFurigana: "",
    currentGuide: "ab",
    currentReading: "",
    currentRomajiTarget: null,
    currentRank: getRank(0),
    elapsedSeconds: null,
    finishReason: null,
    imeError: "",
    input: "",
    inputRef: { current: null },
    isFinished: false,
    isProductionBlocked: false,
    mistakeFlash: null,
    metrics: {
      accuracy: 1,
      consistency: 1,
      keysPerSecond: 0,
      paceMs: 0,
      score: 0,
    },
    mode: modes[0]!,
    progress: 0,
    productionBlockReason: "本番モードは仮レーティング A0 以上で解放されます。",
    remainingSeconds: 120,
    showFuriganaDisplay: true,
    showHiraganaDisplay: true,
    showKanjiDisplay: true,
    soundSettings: initialSettings,
    speedDisplayUnit: "keysPerSecond",
    startedAt: null,
    stats: initialStats,
    strictMistakeDisplayMode: "overwrite",
    strictMistakeInput: "",
    onBackToModeSelect: () => undefined,
    onImeInput: () => undefined,
    onImeKeyDown: () => undefined,
    onPrepareSession: () => undefined,
    onPreventDirectTextInput: () => undefined,
    onResetSession: () => undefined,
    ...overrides,
  };

  return renderToStaticMarkup(<TypingPanel {...props} />);
}

describe("TypingPanel", () => {
  test("shows only the practice mode icon before the in-session rank", () => {
    const markup = renderTypingPanel({
      currentRank: getRank(500),
      elapsedSeconds: 31,
      mode: modes.find((mode) => mode.id === "practice-flow")!,
    });

    expect(markup).toContain('<span class="session-mode-symbol"');
    expect(markup).toContain("lucide-waves-horizontal");
    expect(markup).toContain('width="72"');
    expect(markup).toContain('height="72"');
    expect(markup).not.toContain(
      `<span class="session-mode-symbol">${modes.find((mode) => mode.id === "practice-flow")!.shortLabel}</span>`,
    );
    expect(markup.indexOf("session-mode-symbol")).toBeLessThan(
      markup.indexOf("session-rank-value"),
    );
  });

  test("does not show a mode symbol before production ranks", () => {
    const markup = renderTypingPanel({
      currentRank: getRank(500),
      elapsedSeconds: 31,
      mode: modes.find((mode) => mode.id === "production-ime-off")!,
    });

    expect(markup).not.toContain("session-mode-symbol");
  });

  test("flashes the current direct character after a mistake", () => {
    const markup = renderTypingPanel({
      mistakeFlash: { id: 1, input: "" },
    });

    expect(markup).toContain('<span class="char current mistake-flash">a</span>');
  });

  test("flashes the next romaji character inside the active token", () => {
    const romajiTarget = createRomajiInputTarget("shi", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "し",
      currentGuide: romajiTarget.guide,
      currentRomajiTarget: romajiTarget,
      input: "s",
      mistakeFlash: { id: 2, input: "s" },
    });

    expect(markup).toContain('<span class="char current mistake-flash">h</span>');
  });

  test("overwrites the next direct guide character with strict mistake input", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      input: "a",
      strictMistakeDisplayMode: "overwrite",
      strictMistakeInput: "x",
    });

    expect(markup).toContain('<span class="char correct">a</span>');
    expect(markup).toContain('<span class="char wrong">x</span>');
    expect(markup).not.toContain('<span class="char current">b</span>');
  });

  test("inserts strict mistake input before the next direct guide character", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      input: "a",
      strictMistakeDisplayMode: "insert",
      strictMistakeInput: "x",
    });

    expect(markup.indexOf('<span class="char correct">a</span>')).toBeLessThan(
      markup.indexOf('<span class="char wrong">x</span>'),
    );
    expect(markup.indexOf('<span class="char wrong">x</span>')).toBeLessThan(
      markup.indexOf('<span class="char current">b</span>'),
    );
  });

  test("hides strict mistake input when display mode is none", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      input: "a",
      strictMistakeDisplayMode: "none",
      strictMistakeInput: "x",
    });

    expect(markup).not.toContain('<span class="char wrong">x</span>');
    expect(markup).toContain('<span class="char current">b</span>');
  });

  test("shows the hiragana reading between Japanese display text and romaji target", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
    });

    expect(markup).toContain('<p class="display-text">解析結果</p>');
    expect(markup).toContain('<p class="reading-text">');
    expect(markup).toContain(">か</span>");
    expect(markup).toContain(">い</span>");
    expect(markup).toContain(">せ</span>");
    expect(markup.indexOf("解析結果")).toBeLessThan(markup.indexOf("reading-text"));
    expect(markup.indexOf("reading-text")).toBeLessThan(
      markup.indexOf('aria-label="romaji input target"'),
    );
  });

  test("shows furigana above the Japanese display text by default", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果を見てから判断する。",
      currentFurigana: "かいせき けっか を みてから はんだん する。",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせき けっか を みてから はんだん する。",
      currentRomajiTarget: romajiTarget,
    });

    expect(markup).toContain('<ruby class="display-ruby">解<rt>かい</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">析<rt>せき</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">結<rt>けっ</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">果<rt>か</rt></ruby>');
    expect(markup).toContain('<span class="display-plain">を</span>');
    expect(markup).toContain('<ruby class="display-ruby">見<rt>み</rt></ruby>');
    expect(markup).toContain('<span class="display-plain">てから</span>');
    expect(markup).toContain('<ruby class="display-ruby">判<rt>はん</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">断<rt>だん</rt></ruby>');
  });

  test("can hide furigana while keeping the Japanese display text", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentFurigana: "かいせきけっか",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showFuriganaDisplay: false,
    });

    expect(markup).toContain('<p class="display-text">解析結果</p>');
    expect(markup).not.toContain("<rt>");
  });

  test("can hide the Japanese kanji display while keeping the hiragana reading", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showKanjiDisplay: false,
    });

    expect(markup).not.toContain('<p class="display-text">解析結果</p>');
    expect(markup).toContain('<p class="reading-text">');
    expect(markup).toContain('aria-label="romaji input target"');
  });

  test("can hide the hiragana reading while keeping the Japanese kanji display", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "解析結果",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showHiraganaDisplay: false,
    });

    expect(markup).toContain('<p class="display-text">解析結果</p>');
    expect(markup).not.toContain('<p class="reading-text">');
    expect(markup).toContain('aria-label="romaji input target"');
  });

  test("keeps English IME challenges visible when the kanji display is hidden", () => {
    const markup = renderTypingPanel({
      challengeLanguage: "en",
      currentDisplay: "hello world",
      currentGuide: "hello world",
      mode: modes.find((mode) => mode.id === "production-ime-on")!,
      showKanjiDisplay: false,
    });

    expect(markup).toContain('<p class="display-text">hello world</p>');
  });

  test("highlights the hiragana reading with the current romaji progress", () => {
    const romajiTarget = createRomajiInputTarget("kai", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "貝",
      currentGuide: romajiTarget.guide,
      currentReading: "かい",
      currentRomajiTarget: romajiTarget,
      input: "ka",
    });

    expect(markup).toContain(
      '<p class="reading-text"><span class="char correct">か</span><span class="char current">い</span></p>',
    );
  });
});
