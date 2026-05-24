import { Crosshair, Gauge, Keyboard, Languages, Lock, Waves, Zap } from "lucide-react";
import { modes, type ModeId, type TypingMode } from "@/src/lib/typing";
import type { ProductionDuration } from "../_lib/types";

const modeIcons = {
  "practice-accuracy": Crosshair,
  "practice-flow": Waves,
  "practice-speed": Zap,
  "production-ime-off": Keyboard,
  "production-ime-on": Languages,
} satisfies Record<ModeId, typeof Gauge>;

type ModeSelectScreenProps = {
  productionDuration: ProductionDuration;
  productionDurations: readonly ProductionDuration[];
  productionUnlocked: boolean;
  onProductionDurationChange: (duration: ProductionDuration) => void;
  onSelectMode: (modeId: ModeId) => void;
};

export function ModeSelectScreen({
  productionDuration,
  productionDurations,
  productionUnlocked,
  onProductionDurationChange,
  onSelectMode,
}: ModeSelectScreenProps) {
  return (
    <section className="mode-select-screen" aria-label="mode selection">
      <div className="mode-select-heading">
        <div className="panel-heading">
          <Gauge size={18} />
          <span>Modes</span>
        </div>
        <p>練習モードまたは本番モードを選択してください。</p>
      </div>

      <div className="mode-select-group">
        <div className="mode-select-section">
          <div className="mode-select-section-heading">
            <span>Practice</span>
            <small>練習モード</small>
          </div>
          <div className="mode-select-grid practice-modes">
            {modes
              .filter((item) => item.group === "practice")
              .map((item) => (
                <ModeSelectCard
                  key={item.id}
                  locked={false}
                  mode={item}
                  onSelect={() => onSelectMode(item.id)}
                />
              ))}
          </div>
        </div>

        <div className="mode-select-section production-section">
          <div className="mode-select-section-heading">
            <span>Rating</span>
            <small>本番モード</small>
          </div>
          <div className="duration-block mode-select-duration">
            <div className="segmented">
              {productionDurations.map((duration) => (
                <button
                  className={productionDuration === duration ? "selected" : ""}
                  key={duration}
                  onClick={() => onProductionDurationChange(duration)}
                  type="button"
                >
                  {duration / 60}分
                </button>
              ))}
            </div>
          </div>
          <div className="mode-select-grid production-modes">
            {modes
              .filter((item) => item.group === "production")
              .map((item) => (
                <ModeSelectCard
                  key={item.id}
                  locked={!productionUnlocked}
                  mode={item}
                  onSelect={() => onSelectMode(item.id)}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeSelectCard({
  locked,
  mode,
  onSelect,
}: {
  locked: boolean;
  mode: TypingMode;
  onSelect: () => void;
}) {
  const ModeIcon = modeIcons[mode.id];

  return (
    <button
      className={`mode-select-card ${locked ? "locked" : ""}`}
      disabled={locked}
      onClick={onSelect}
      title={locked ? "仮レーティング A0 以上で解放" : mode.description}
      type="button"
    >
      <span className="mode-icon" aria-hidden="true">
        <ModeIcon size={28} strokeWidth={2.2} />
      </span>
      <span className="mode-code">{mode.shortLabel}</span>
      <strong>{mode.label}</strong>
      <small>{mode.description}</small>
      {locked ? (
        <span className="mode-lock">
          <Lock size={15} />
          A0
        </span>
      ) : null}
    </button>
  );
}
