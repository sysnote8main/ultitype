"use client";

import { AppShell } from "./_components/AppShell";
import { ModeSelectScreen } from "./_components/ModeSelectScreen";
import { productionDurations } from "./_lib/constants";

export default function Home() {
  return (
    <AppShell>
      {(session) => (
        <ModeSelectScreen
          productionDuration={session.productionDuration}
          productionDurations={productionDurations}
          productionPlayable={session.productionPlayable}
          productionUnlocked={session.productionUnlocked}
          soundSettings={session.settings}
          onProductionDurationChange={session.setProductionDuration}
        />
      )}
    </AppShell>
  );
}
