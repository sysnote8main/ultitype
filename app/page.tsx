"use client";

import { AppShell } from "./_components/AppShell";
import { ModeSelectScreen } from "./_components/ModeSelectScreen";
import { productionDurations } from "./_lib/constants";

export default function Home() {
  return (
    <AppShell>
      {(session) => (
        <ModeSelectScreen
          challengeLanguage={session.challengeLanguage}
          productionDuration={session.productionDuration}
          productionDurations={productionDurations}
          productionPlayable={session.productionPlayable}
          productionUnlocked={session.productionUnlocked}
          soundSettings={session.settings}
          onChangeChallengeLanguage={session.changeChallengeLanguage}
          onProductionDurationChange={session.setProductionDuration}
        />
      )}
    </AppShell>
  );
}
