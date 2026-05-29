"use client";

import { AppHeader } from "./_components/AppHeader";
import { LowerStats } from "./_components/LowerStats";
import { ModeSelectScreen } from "./_components/ModeSelectScreen";
import { SettingsScreen } from "./_components/SettingsScreen";
import { TypingPanel } from "./_components/TypingPanel";
import { productionDurations } from "./_lib/constants";
import { useTypingSession } from "./_lib/useTypingSession";

export default function Home() {
  const session = useTypingSession();

  return (
    <main className="shell">
      <AppHeader
        bestPracticeRank={session.bestPracticeRank}
        bestPracticeScore={session.bestPracticeScore}
        bestProductionRank={session.bestProductionRank}
        bestProductionScore={session.bestProductionScore}
        challengeLanguage={session.challengeLanguage}
        soundSettings={session.settings}
        onChangeChallengeLanguage={session.changeChallengeLanguage}
        onOpenSettings={session.openSettings}
      />

      {session.screen === "settings" ? (
        <SettingsScreen
          onBack={session.showModeSelect}
          onChange={session.updateSettings}
          onClearLocalData={session.clearLocalData}
          settings={session.settings}
        />
      ) : session.screen === "mode-select" ? (
        <ModeSelectScreen
          productionDuration={session.productionDuration}
          productionDurations={productionDurations}
          productionUnlocked={session.productionUnlocked}
          soundSettings={session.settings}
          onProductionDurationChange={session.setProductionDuration}
          onSelectMode={session.selectMode}
        />
      ) : (
        <TypingPanel {...session.typingPanelProps} />
      )}

      {session.screen === "typing" ? (
        <LowerStats
          currentAccuracy={session.currentAccuracy}
          metrics={session.metrics}
          sessions={session.sessions}
          stats={session.stats}
        />
      ) : null}
    </main>
  );
}
