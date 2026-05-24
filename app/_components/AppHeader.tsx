import { Settings } from "lucide-react";
import type { Rank } from "@/src/lib/typing";
import { challengeLanguages } from "../_lib/constants";
import type { ChallengeLanguage } from "../_lib/types";

type AppHeaderProps = {
  bestPracticeRank: Rank;
  bestPracticeScore: number;
  bestProductionRank: Rank;
  bestProductionScore: number;
  challengeLanguage: ChallengeLanguage;
  onChangeChallengeLanguage: (language: ChallengeLanguage) => void;
  onOpenSettings: () => void;
};

export function AppHeader({
  bestPracticeRank,
  bestPracticeScore,
  bestProductionRank,
  bestProductionScore,
  challengeLanguage,
  onChangeChallengeLanguage,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="app-header" aria-label="UltiType header">
      <div className="brand-block">
        <h1>UltiType</h1>
        <p>Typing practice and rating</p>
      </div>
      <div className="header-status">
        <div className="rank-strip" aria-label="saved ratings">
          <RankBadge label="仮" rank={bestPracticeRank.label} score={bestPracticeScore} />
          <RankBadge label="本" rank={bestProductionRank.label} score={bestProductionScore} />
        </div>
        <div className="header-actions" aria-label="settings and language">
          <div className="language-switch" aria-label="challenge language">
            {challengeLanguages.map((language) => (
              <button
                aria-pressed={challengeLanguage === language.id}
                className={challengeLanguage === language.id ? "selected" : ""}
                key={language.id}
                onClick={() => onChangeChallengeLanguage(language.id)}
                type="button"
              >
                <img className="flag-icon" src={language.flagSrc} alt="" aria-hidden="true" />
                {language.label}
              </button>
            ))}
          </div>
          <button
            className="settings-button"
            onClick={onOpenSettings}
            title="設定"
            type="button"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

function RankBadge({ label, rank, score }: { label: string; rank: string; score: number }) {
  return (
    <div className="rank-badge">
      <span>{label}</span>
      <strong>{rank}</strong>
      <small>{Math.round(score).toLocaleString()}</small>
    </div>
  );
}
