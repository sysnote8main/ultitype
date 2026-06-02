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
    currentFurigana: [],
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
    showFuriganaMarker: false,
    showHiraganaDisplay: true,
    showHiraganaMarker: true,
    showKanjiDisplay: true,
    showKanjiMarker: false,
    showRomajiMarker: true,
    soundSettings: initialSettings,
    speedDisplayUnit: "keysPerSecond",
    startedAt: null,
    stats: initialStats,
    strictMistakeDisplayMode: "overwrite",
    strictMistakeInput: "",
    topDisplayMetricIds: initialSettings.topDisplayMetricIds,
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
  test("renders only the selected top display metrics", () => {
    const markup = renderTypingPanel({
      metrics: {
        accuracy: 0.875,
        consistency: 1,
        keysPerSecond: 2.5,
        paceMs: 400,
        score: 0,
      },
      progress: 25,
      remainingSeconds: 90,
      stats: {
        ...initialStats,
        correctCharacters: 18,
        mistakes: 2,
        physicalKeystrokes: 20,
      },
      topDisplayMetricIds: [
        "remainingPercent",
        "keysPerMinute",
        "mistakeRate",
        "correctRate",
      ],
    });

    expect(markup).toContain(">残り時間（％）</span><strong>75%</strong>");
    expect(markup).toContain(">打鍵/分</span><strong>150</strong>");
    expect(markup).toContain(
      '>ミス/物理打鍵</span><strong><span class="metric-split-value"><span>2</span><span>/</span><span>20</span></span></strong>',
    );
    expect(markup).toContain(
      '>正解/物理打鍵</span><strong><span class="metric-split-value"><span>18</span><span>/</span><span>20</span></span></strong>',
    );
    expect(markup).not.toContain(">残り時間</span>");
    expect(markup).not.toContain(">打鍵/秒</span>");
    expect(markup).toContain('class="progress-track"');
  });

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
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
        { text: "見", ruby: "み" },
        { text: "判", ruby: "はん" },
        { text: "断", ruby: "だん" },
      ],
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

  test("can show kanji and furigana markers on the active ruby group", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showFuriganaMarker: true,
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-current">解<rt><span class="furigana-marker-current">か</span><span class="furigana-marker-pending">い</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-pending">析<rt><span class="furigana-marker-pending">せ</span><span class="furigana-marker-pending">き</span></rt></ruby>',
    );
  });

  test("moves the furigana marker by character inside the active ruby group", () => {
    const romajiTarget = createRomajiInputTarget("kai", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "貝",
      currentFurigana: [{ text: "貝", ruby: "かい" }],
      currentGuide: romajiTarget.guide,
      currentReading: "かい",
      currentRomajiTarget: romajiTarget,
      input: "ka",
      showFuriganaMarker: true,
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-current">貝<rt><span class="furigana-marker-correct">か</span><span class="furigana-marker-current">い</span></rt></ruby>',
    );
  });

  test("colors completed and pending kanji while the kanji marker is enabled", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      input: "kaiseki",
      showFuriganaMarker: true,
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-correct">解<rt><span class="furigana-marker-correct">か</span><span class="furigana-marker-correct">い</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-correct">析<rt><span class="furigana-marker-correct">せ</span><span class="furigana-marker-correct">き</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-current">結<rt><span class="furigana-marker-current">け</span><span class="furigana-marker-pending">っ</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-pending">果<rt><span class="furigana-marker-pending">か</span></rt></ruby>',
    );
  });

  test("splits plain kana display markers by character", () => {
    const romajiTarget = createRomajiInputTarget("mitekarakaeru", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "見てから帰る",
      currentFurigana: [
        { text: "見", ruby: "み" },
        { text: "帰", ruby: "かえ" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "みてからかえる",
      currentRomajiTarget: romajiTarget,
      input: "mi",
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<span class="display-plain kanji-marker-current">て</span><span class="display-plain kanji-marker-pending">か</span><span class="display-plain kanji-marker-pending">ら</span>',
    );
  });

  test("keeps sokuon with the following kana for display markers", () => {
    const romajiTarget = createRomajiInputTarget("kekkakan", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "けっか漢",
      currentFurigana: [{ text: "漢", ruby: "かん" }],
      currentGuide: romajiTarget.guide,
      currentReading: "けっかかん",
      currentRomajiTarget: romajiTarget,
      input: "ke",
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<span class="display-plain kanji-marker-correct">け</span><span class="display-plain kanji-marker-current">っか</span>',
    );
  });

  test("can hide hiragana and romaji current markers independently", () => {
    const romajiTarget = createRomajiInputTarget("kai", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "貝",
      currentFurigana: [{ text: "貝", ruby: "かい" }],
      currentGuide: romajiTarget.guide,
      currentReading: "かい",
      currentRomajiTarget: romajiTarget,
      input: "k",
      showHiraganaMarker: false,
      showRomajiMarker: false,
    });

    expect(markup).toContain('<p class="reading-text"><span class="char">か</span><span class="char">い</span></p>');
    expect(markup).not.toContain('<span class="char current">a</span>');
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
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
      ],
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
