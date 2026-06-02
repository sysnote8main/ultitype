import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSettings } from "../_lib/constants";
import {
  calculateStickyPreviewScale,
  InputScreenSettingsScreen,
} from "./InputScreenSettingsScreen";

function renderInputScreenSettingsScreen(settings = initialSettings) {
  return renderToStaticMarkup(
    <InputScreenSettingsScreen
      onBack={() => undefined}
      onChange={() => undefined}
      settings={settings}
    />,
  );
}

function getCategoryMarkup(markup: string, categoryId: string) {
  const categoryIds = ["input-settings", "input-screen-settings"];
  const startIndex = markup.indexOf(`id="${categoryId}"`);
  const nextCategoryId = categoryIds[categoryIds.indexOf(categoryId) + 1];
  const endIndex = nextCategoryId ? markup.indexOf(`id="${nextCategoryId}"`) : markup.length;

  return startIndex >= 0 ? markup.slice(startIndex, endIndex) : "";
}

function getPreviewMarkup(markup: string) {
  const startIndex = markup.indexOf('class="input-screen-settings-preview"');
  const endIndex = markup.indexOf('class="settings-list"');

  return startIndex >= 0 && endIndex >= 0 ? markup.slice(startIndex, endIndex) : "";
}

function getCategoryLabels(markup: string) {
  return Array.from(
    markup.matchAll(/<h3[^>]*class="settings-category-title"[^>]*>(.*?)<\/h3>/g),
    (match) => match[1],
  );
}

function getCategoryItemLabels(markup: string, categoryId: string) {
  const categoryMarkup = getCategoryMarkup(markup, categoryId);

  return Array.from(categoryMarkup.matchAll(/<h4[^>]*>(.*?)<\/h4>/g), (match) =>
    match[1],
  );
}

describe("InputScreenSettingsScreen", () => {
  test("shows the mock practice view before the setting list", () => {
    const markup = renderInputScreenSettingsScreen();

    expect(markup.indexOf("input-screen-settings-preview")).toBeLessThan(
      markup.indexOf("settings-list"),
    );
    expect(markup).toContain("input-screen-settings-preview-sticky");
    expect(markup).toContain("input-screen-settings-preview-scale");
    expect(markup).toContain('<ruby class="display-ruby">常<rt>じょう</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">社<rt>しゃ</rt></ruby>');
    expect(markup).toContain("<rt>じょう</rt>");
    expect(markup).toContain('aria-label="romaji input target"');
  });

  test("labels the mock as input screen settings with a wrench icon", () => {
    const markup = renderInputScreenSettingsScreen();
    const previewMarkup = getPreviewMarkup(markup);

    expect(previewMarkup).toContain('<p class="mode-label">入力画面設定</p>');
    expect(previewMarkup).toContain("lucide-wrench");
    expect(previewMarkup).not.toContain("lucide-crosshair");
    expect(previewMarkup).not.toContain('<p class="mode-label">正確無比</p>');
  });

  test("groups migrated settings under input method and input screen categories", () => {
    const markup = renderInputScreenSettingsScreen();

    expect(getCategoryLabels(markup)).toEqual(["入力方式", "入力画面"]);
    expect(getCategoryItemLabels(markup, "input-settings")).toEqual([
      "ローマ字入力法",
      "促音入力",
      "拗音分割入力",
    ]);
    expect(getCategoryItemLabels(markup, "input-screen-settings")).toEqual([
      "漢字表示",
      "ふりがな表示",
      "ひらがな表示",
      "漢字マーカー",
      "ふりがなマーカー",
      "ひらがなマーカー",
      "ローマ字マーカー",
      "正確無比の誤入力表示",
    ]);
  });

  test("shows strict accuracy mistake display choices with overwrite selected by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain('aria-label="正確無比の誤入力表示"');
    expect(inputScreenMarkup).toContain("上書き");
    expect(inputScreenMarkup).toContain("挿入");
    expect(inputScreenMarkup).toContain("何もしない");
    expect(inputScreenMarkup).toContain('aria-pressed="true"');
  });

  test("shows kanji, furigana, and hiragana input screen visibility toggles enabled by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain("漢字表示");
    expect(inputScreenMarkup).toContain("ふりがな表示");
    expect(inputScreenMarkup).toContain("ひらがな表示");
    expect(inputScreenMarkup).toContain('aria-label="漢字表示"');
    expect(inputScreenMarkup).toContain('aria-label="ふりがな表示"');
    expect(inputScreenMarkup).toContain('aria-label="ひらがな表示"');
    expect(
      Array.from(
        inputScreenMarkup
          .slice(0, inputScreenMarkup.indexOf("kanji-marker-setting"))
          .matchAll(/checked=""/g),
      ),
    ).toHaveLength(3);
  });

  test("shows marker visibility toggles with hiragana and romaji enabled by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain("漢字マーカー");
    expect(inputScreenMarkup).toContain("ふりがなマーカー");
    expect(inputScreenMarkup).toContain("ひらがなマーカー");
    expect(inputScreenMarkup).toContain("ローマ字マーカー");
    expect(inputScreenMarkup).toContain("ON推奨");

    const kanjiMarkerIndex = inputScreenMarkup.indexOf('aria-label="漢字マーカー"');
    const furiganaMarkerIndex = inputScreenMarkup.indexOf('aria-label="ふりがなマーカー"');
    const hiraganaMarkerIndex = inputScreenMarkup.indexOf('aria-label="ひらがなマーカー"');
    const romajiMarkerIndex = inputScreenMarkup.indexOf('aria-label="ローマ字マーカー"');
    const strictMistakeIndex = inputScreenMarkup.indexOf("strict-mistake-display-setting");

    expect(inputScreenMarkup.slice(kanjiMarkerIndex, furiganaMarkerIndex)).not.toContain(
      'checked=""',
    );
    expect(inputScreenMarkup.slice(furiganaMarkerIndex, hiraganaMarkerIndex)).not.toContain(
      'checked=""',
    );
    expect(inputScreenMarkup.slice(hiraganaMarkerIndex, romajiMarkerIndex)).toContain(
      'checked=""',
    );
    expect(inputScreenMarkup.slice(romajiMarkerIndex, strictMistakeIndex)).toContain(
      'checked=""',
    );
  });

  test("locks marker toggles when matching display targets are hidden", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showFuriganaDisplay: true,
      showFuriganaMarker: true,
      showHiraganaDisplay: false,
      showHiraganaMarker: true,
      showKanjiDisplay: false,
      showKanjiMarker: true,
      showRomajiMarker: true,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const kanjiMarkerIndex = inputScreenMarkup.indexOf("kanji-marker-setting");
    const furiganaMarkerIndex = inputScreenMarkup.indexOf("furigana-marker-setting");
    const hiraganaMarkerIndex = inputScreenMarkup.indexOf("hiragana-marker-setting");
    const romajiMarkerIndex = inputScreenMarkup.indexOf("romaji-marker-setting");
    const strictMistakeIndex = inputScreenMarkup.indexOf("strict-mistake-display-setting");

    const kanjiMarkerMarkup = inputScreenMarkup.slice(kanjiMarkerIndex, furiganaMarkerIndex);
    const furiganaMarkerMarkup = inputScreenMarkup.slice(
      furiganaMarkerIndex,
      hiraganaMarkerIndex,
    );
    const hiraganaMarkerMarkup = inputScreenMarkup.slice(hiraganaMarkerIndex, romajiMarkerIndex);
    const romajiMarkerMarkup = inputScreenMarkup.slice(romajiMarkerIndex, strictMistakeIndex);

    expect(kanjiMarkerMarkup).toContain('disabled=""');
    expect(kanjiMarkerMarkup).toContain('class="toggle-lock-icon"');
    expect(kanjiMarkerMarkup).not.toContain('checked=""');
    expect(furiganaMarkerMarkup).toContain('disabled=""');
    expect(furiganaMarkerMarkup).toContain('class="toggle-lock-icon"');
    expect(furiganaMarkerMarkup).not.toContain('checked=""');
    expect(hiraganaMarkerMarkup).toContain('disabled=""');
    expect(hiraganaMarkerMarkup).toContain('class="toggle-lock-icon"');
    expect(hiraganaMarkerMarkup).not.toContain('checked=""');
    expect(romajiMarkerMarkup).not.toContain('disabled=""');
    expect(romajiMarkerMarkup).not.toContain('class="toggle-lock-icon"');
    expect(romajiMarkerMarkup).toContain('checked=""');
  });

  test("turns off and disables furigana display when kanji display is off", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showKanjiDisplay: false,
      showFuriganaDisplay: true,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const furiganaControlIndex = inputScreenMarkup.indexOf('aria-label="ふりがな表示"');
    const hiraganaControlIndex = inputScreenMarkup.indexOf('aria-label="ひらがな表示"');
    const furiganaControlMarkup = inputScreenMarkup.slice(
      furiganaControlIndex,
      hiraganaControlIndex,
    );

    expect(furiganaControlMarkup).toContain('disabled=""');
    expect(furiganaControlMarkup).toContain('class="toggle-lock-icon"');
    expect(furiganaControlMarkup).toContain('aria-label="漢字表示オフのためロック"');
    expect(furiganaControlMarkup).not.toContain('checked=""');
  });

  test("keeps the sticky preview unscaled while it fits within half the viewport", () => {
    expect(calculateStickyPreviewScale(400, 900)).toBe(1);
  });

  test("scales the sticky preview down to half the viewport when it is too tall", () => {
    expect(calculateStickyPreviewScale(900, 1000)).toBeCloseTo(0.555, 2);
  });

  test("ignores invalid preview measurements", () => {
    expect(calculateStickyPreviewScale(0, 1000)).toBe(1);
    expect(calculateStickyPreviewScale(600, 0)).toBe(1);
  });
});
