import { ArrowLeft, Moon, Settings, Sun } from "lucide-react";
import { clampInteger } from "../_lib/challenge-utils";
import type { AppSettings } from "../_lib/types";

type SettingsScreenProps = {
  settings: AppSettings;
  onBack: () => void;
  onChange: (settings: Partial<AppSettings>) => void;
};

export function SettingsScreen({ settings, onBack, onChange }: SettingsScreenProps) {
  return (
    <section className="settings-screen" aria-label="settings">
      <div className="settings-head">
        <div>
          <div className="panel-heading">
            <Settings size={18} />
            <span>Settings</span>
          </div>
          <h2>設定</h2>
        </div>
        <button className="icon-button" onClick={onBack} title="戻る" type="button">
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="settings-list">
        <section className="settings-row" aria-labelledby="romaji-space-setting">
          <div>
            <h3 id="romaji-space-setting">日本語ローマ字のスペース</h3>
            <p>ローマ字ガイドの単語間スペースを表示する</p>
          </div>
          <label className="toggle-control">
            <input
              checked={settings.showRomajiWordSpaces}
              onChange={(event) =>
                onChange({ showRomajiWordSpaces: event.currentTarget.checked })
              }
              type="checkbox"
            />
            <span aria-hidden="true" />
          </label>
        </section>

        <section className="settings-row" aria-labelledby="idle-retire-setting">
          <div>
            <h3 id="idle-retire-setting">無入力リタイア</h3>
            <p>0 秒で無効</p>
          </div>
          <label className="number-control">
            <input
              min={0}
              max={120}
              onChange={(event) =>
                onChange({
                  idleRetireSeconds: clampInteger(event.currentTarget.value, 0, 120),
                })
              }
              step={1}
              type="number"
              value={settings.idleRetireSeconds}
            />
            <span>秒</span>
          </label>
        </section>

        <section className="settings-row" aria-labelledby="theme-setting">
          <div>
            <h3 id="theme-setting">テーマ</h3>
            <p>表示テーマを切り替える</p>
          </div>
          <div className="theme-segmented" role="group" aria-label="theme">
            <button
              aria-pressed={settings.theme === "dark"}
              className={settings.theme === "dark" ? "selected" : ""}
              onClick={() => onChange({ theme: "dark" })}
              type="button"
            >
              <Moon size={17} />
              Dark
            </button>
            <button
              aria-pressed={settings.theme === "light"}
              className={settings.theme === "light" ? "selected" : ""}
              onClick={() => onChange({ theme: "light" })}
              type="button"
            >
              <Sun size={17} />
              Light
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
