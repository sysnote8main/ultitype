import { Lock } from "lucide-react";
import {
  romajiVariantOptions,
  sokuonInputOptions,
  type RomajiVariantOption,
  type SokuonInputId,
} from "@/src/lib/typing";
import type { AppSettings } from "../_lib/types";

type InputSettingsSectionsProps = {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
};

export function InputSettingsSections({ settings, onChange }: InputSettingsSectionsProps) {
  const showFuriganaDisplay = settings.showKanjiDisplay && settings.showFuriganaDisplay;
  const showKanjiMarker = settings.showKanjiDisplay && settings.showKanjiMarker;
  const showFuriganaMarker = showFuriganaDisplay && settings.showFuriganaMarker;
  const showHiraganaMarker = settings.showHiraganaDisplay && settings.showHiraganaMarker;

  function getRomajiSelection(option: RomajiVariantOption) {
    return (
      settings.romajiInputSelections[option.id] ?? {
        accepted: option.alternatives,
        preferred: option.hepburn,
      }
    );
  }

  function updateRomajiSelection(
    option: RomajiVariantOption,
    selection: { accepted: string[]; preferred: string },
  ) {
    onChange({
      romajiInputSelections: {
        ...settings.romajiInputSelections,
        [option.id]: selection,
      },
    });
  }

  function toggleRomajiAccepted(option: RomajiVariantOption, value: string, checked: boolean) {
    const selection = getRomajiSelection(option);
    const accepted = checked
      ? Array.from(new Set([...selection.accepted, value]))
      : selection.accepted.filter((candidate) => candidate !== value);

    if (accepted.length === 0) {
      return;
    }

    updateRomajiSelection(option, {
      accepted,
      preferred: accepted.includes(selection.preferred) ? selection.preferred : accepted[0],
    });
  }

  function preferRomaji(option: RomajiVariantOption, preferred: string) {
    const selection = getRomajiSelection(option);
    updateRomajiSelection(option, {
      accepted: selection.accepted.includes(preferred)
        ? selection.accepted
        : [...selection.accepted, preferred],
      preferred,
    });
  }

  function toggleSokuonAccepted(value: SokuonInputId, checked: boolean) {
    const accepted = checked
      ? Array.from(new Set([...settings.sokuonInput.accepted, value]))
      : settings.sokuonInput.accepted.filter((candidate) => candidate !== value);

    if (accepted.length === 0) {
      return;
    }

    onChange({
      sokuonInput: {
        ...settings.sokuonInput,
        accepted,
        preferred: accepted.includes(settings.sokuonInput.preferred)
          ? settings.sokuonInput.preferred
          : accepted[0],
      },
    });
  }

  function preferSokuon(preferred: SokuonInputId) {
    onChange({
      sokuonInput: {
        ...settings.sokuonInput,
        accepted: settings.sokuonInput.accepted.includes(preferred)
          ? settings.sokuonInput.accepted
          : [...settings.sokuonInput.accepted, preferred],
        preferred,
      },
    });
  }

  return (
    <>
      <section className="settings-category" aria-labelledby="input-settings">
        <h3 className="settings-category-title" id="input-settings">
          入力方式
        </h3>
        <div className="settings-category-list">
          <section
            className="settings-row romaji-method-row"
            aria-labelledby="romaji-method-setting"
          >
            <div>
              <h4 id="romaji-method-setting">ローマ字入力法</h4>
              <p>許容する派生と、ガイドで優先表示する表記を選ぶ</p>
            </div>
            <div className="romaji-method-controls">
              <div className="romaji-preset-segmented" role="group" aria-label="ローマ字入力法">
                <button
                  aria-pressed={settings.romajiInputPreset === "hepburn"}
                  className={settings.romajiInputPreset === "hepburn" ? "selected" : ""}
                  onClick={() => onChange({ romajiInputPreset: "hepburn" })}
                  type="button"
                >
                  ヘボン式優先
                </button>
                <button
                  aria-pressed={settings.romajiInputPreset === "shortest"}
                  className={settings.romajiInputPreset === "shortest" ? "selected" : ""}
                  onClick={() => onChange({ romajiInputPreset: "shortest" })}
                  type="button"
                >
                  最短優先
                </button>
                <button
                  aria-pressed={settings.romajiInputPreset === "custom"}
                  className={settings.romajiInputPreset === "custom" ? "selected" : ""}
                  onClick={() => onChange({ romajiInputPreset: "custom" })}
                  type="button"
                >
                  個別設定
                </button>
              </div>

              {settings.romajiInputPreset === "custom" ? (
                <div className="romaji-custom-list">
                  {romajiVariantOptions.map((option) => {
                    const selection = getRomajiSelection(option);

                    return (
                      <div className="romaji-custom-item" key={option.id}>
                        <span>{option.label}</span>
                        <div className="romaji-choice-list">
                          {option.alternatives.map((alternative) => (
                            <label key={alternative}>
                              <input
                                checked={selection.accepted.includes(alternative)}
                                onChange={(event) =>
                                  toggleRomajiAccepted(
                                    option,
                                    alternative,
                                    event.currentTarget.checked,
                                  )
                                }
                                type="checkbox"
                              />
                              {alternative}
                            </label>
                          ))}
                        </div>
                        <label className="romaji-preferred-select">
                          <span>表示</span>
                          <select
                            onChange={(event) => preferRomaji(option, event.currentTarget.value)}
                            value={selection.preferred}
                          >
                            {option.alternatives.map((alternative) => (
                              <option key={alternative} value={alternative}>
                                {alternative}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>

          <section className="settings-row sokuon-method-row" aria-labelledby="sokuon-setting">
            <div>
              <h4 id="sokuon-setting">促音入力</h4>
              <p>「っ」の子音重複と ltsu / xtsu / ltu / xtu の扱いを選ぶ</p>
            </div>
            <div className="sokuon-setting-controls">
              <label className="sokuon-split-toggle">
                <span>促音分割を許可</span>
                <span className="toggle-control">
                  <input
                    checked={settings.sokuonInput.allowSplit}
                    onChange={(event) =>
                      onChange({
                        sokuonInput: {
                          ...settings.sokuonInput,
                          allowSplit: event.currentTarget.checked,
                        },
                      })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                </span>
              </label>
              <div className="romaji-choice-list" aria-label="促音入力候補">
                {sokuonInputOptions.map((option) => (
                  <label key={option}>
                    <input
                      checked={settings.sokuonInput.accepted.includes(option)}
                      onChange={(event) => toggleSokuonAccepted(option, event.currentTarget.checked)}
                      type="checkbox"
                    />
                    {option}
                  </label>
                ))}
              </div>
              <label className="romaji-preferred-select">
                <span>表示</span>
                <select
                  onChange={(event) => preferSokuon(event.currentTarget.value as SokuonInputId)}
                  value={settings.sokuonInput.preferred}
                >
                  {sokuonInputOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="settings-row" aria-labelledby="split-yoon-setting">
            <div>
              <h4 id="split-yoon-setting">拗音分割入力</h4>
              <p>「きゃ」を kya だけでなく kila / kixa でも入力できるようにする</p>
            </div>
            <label className="toggle-control">
              <input
                checked={settings.allowSplitYoon}
                onChange={(event) => onChange({ allowSplitYoon: event.currentTarget.checked })}
                type="checkbox"
              />
              <span aria-hidden="true" />
            </label>
          </section>
        </div>
      </section>

      <section className="settings-category" aria-labelledby="input-screen-settings">
        <h3 className="settings-category-title" id="input-screen-settings">
          入力画面
        </h3>
        <div className="settings-category-list">
          <section className="settings-row" aria-labelledby="kanji-display-setting">
            <div>
              <h4 id="kanji-display-setting">漢字表示</h4>
              <p>入力画面に漢字混じりの課題文を表示する</p>
            </div>
            <label className="toggle-control" aria-label="漢字表示">
              <input
                checked={settings.showKanjiDisplay}
                onChange={(event) =>
                  onChange({
                    showFuriganaDisplay: event.currentTarget.checked
                      ? settings.showFuriganaDisplay
                      : false,
                    showFuriganaMarker: event.currentTarget.checked
                      ? settings.showFuriganaMarker
                      : false,
                    showKanjiDisplay: event.currentTarget.checked,
                    showKanjiMarker: event.currentTarget.checked ? settings.showKanjiMarker : false,
                  })
                }
                type="checkbox"
              />
              <span aria-hidden="true" />
            </label>
          </section>

          <section className="settings-row" aria-labelledby="furigana-display-setting">
            <div>
              <h4 id="furigana-display-setting">ふりがな表示</h4>
              <p>漢字混じりの課題文の上にふりがなを表示する</p>
            </div>
            <label
              className={`toggle-control ${settings.showKanjiDisplay ? "" : "locked"}`}
              aria-label="ふりがな表示"
            >
              <input
                checked={showFuriganaDisplay}
                disabled={!settings.showKanjiDisplay}
                onChange={(event) =>
                  onChange({
                    showFuriganaDisplay: event.currentTarget.checked,
                    showFuriganaMarker: event.currentTarget.checked
                      ? settings.showFuriganaMarker
                      : false,
                  })
                }
                type="checkbox"
              />
              <span aria-hidden="true" />
              {!settings.showKanjiDisplay ? (
                <b className="toggle-lock-icon" aria-label="漢字表示オフのためロック">
                  <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
                </b>
              ) : null}
            </label>
          </section>

          <section className="settings-row" aria-labelledby="hiragana-display-setting">
            <div>
              <h4 id="hiragana-display-setting">ひらがな表示</h4>
              <p>入力画面にひらがなの読みを表示する</p>
            </div>
            <label className="toggle-control" aria-label="ひらがな表示">
              <input
                checked={settings.showHiraganaDisplay}
                onChange={(event) =>
                  onChange({
                    showHiraganaDisplay: event.currentTarget.checked,
                    showHiraganaMarker: event.currentTarget.checked
                      ? settings.showHiraganaMarker
                      : false,
                  })
                }
                type="checkbox"
              />
              <span aria-hidden="true" />
            </label>
          </section>

          <section className="settings-row" aria-labelledby="kanji-marker-setting">
            <div>
              <h4 id="kanji-marker-setting">漢字マーカー</h4>
              <p>入力中の位置を漢字表示に下線で表示する</p>
            </div>
            <label
              className={`toggle-control ${settings.showKanjiDisplay ? "" : "locked"}`}
              aria-label="漢字マーカー"
            >
              <input
                checked={showKanjiMarker}
                disabled={!settings.showKanjiDisplay}
                onChange={(event) => onChange({ showKanjiMarker: event.currentTarget.checked })}
                type="checkbox"
              />
              <span aria-hidden="true" />
              {!settings.showKanjiDisplay ? (
                <b className="toggle-lock-icon" aria-label="漢字表示オフのためロック">
                  <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
                </b>
              ) : null}
            </label>
          </section>

          <section className="settings-row" aria-labelledby="furigana-marker-setting">
            <div>
              <h4 id="furigana-marker-setting">ふりがなマーカー</h4>
              <p>入力中の位置をふりがな表示に下線で表示する</p>
            </div>
            <label
              className={`toggle-control ${showFuriganaDisplay ? "" : "locked"}`}
              aria-label="ふりがなマーカー"
            >
              <input
                checked={showFuriganaMarker}
                disabled={!showFuriganaDisplay}
                onChange={(event) => onChange({ showFuriganaMarker: event.currentTarget.checked })}
                type="checkbox"
              />
              <span aria-hidden="true" />
              {!showFuriganaDisplay ? (
                <b className="toggle-lock-icon" aria-label="ふりがな表示オフのためロック">
                  <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
                </b>
              ) : null}
            </label>
          </section>

          <section className="settings-row" aria-labelledby="hiragana-marker-setting">
            <div>
              <h4 id="hiragana-marker-setting">ひらがなマーカー</h4>
              <p>入力中の位置をひらがな表示に下線で表示する</p>
            </div>
            <label
              className={`toggle-control ${settings.showHiraganaDisplay ? "" : "locked"}`}
              aria-label="ひらがなマーカー"
            >
              <input
                checked={showHiraganaMarker}
                disabled={!settings.showHiraganaDisplay}
                onChange={(event) => onChange({ showHiraganaMarker: event.currentTarget.checked })}
                type="checkbox"
              />
              <span aria-hidden="true" />
              {!settings.showHiraganaDisplay ? (
                <b className="toggle-lock-icon" aria-label="ひらがな表示オフのためロック">
                  <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
                </b>
              ) : null}
            </label>
          </section>

          <section className="settings-row" aria-labelledby="romaji-marker-setting">
            <div>
              <h4 id="romaji-marker-setting">ローマ字マーカー</h4>
              <p>入力中の位置をローマ字表示に下線で表示する。ON推奨</p>
            </div>
            <label className="toggle-control" aria-label="ローマ字マーカー">
              <input
                checked={settings.showRomajiMarker}
                onChange={(event) => onChange({ showRomajiMarker: event.currentTarget.checked })}
                type="checkbox"
              />
              <span aria-hidden="true" />
            </label>
          </section>

          <section className="settings-row" aria-labelledby="strict-mistake-display-setting">
            <div>
              <h4 id="strict-mistake-display-setting">正確無比の誤入力表示</h4>
              <p>誤入力した文字を課題文ローマ字上に表示する方法を選ぶ</p>
            </div>
            <div
              className="romaji-preset-segmented"
              role="group"
              aria-label="正確無比の誤入力表示"
            >
              <button
                aria-pressed={settings.strictMistakeDisplayMode === "overwrite"}
                className={settings.strictMistakeDisplayMode === "overwrite" ? "selected" : ""}
                onClick={() => onChange({ strictMistakeDisplayMode: "overwrite" })}
                type="button"
              >
                上書き
              </button>
              <button
                aria-pressed={settings.strictMistakeDisplayMode === "insert"}
                className={settings.strictMistakeDisplayMode === "insert" ? "selected" : ""}
                onClick={() => onChange({ strictMistakeDisplayMode: "insert" })}
                type="button"
              >
                挿入
              </button>
              <button
                aria-pressed={settings.strictMistakeDisplayMode === "none"}
                className={settings.strictMistakeDisplayMode === "none" ? "selected" : ""}
                onClick={() => onChange({ strictMistakeDisplayMode: "none" })}
                type="button"
              >
                何もしない
              </button>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
