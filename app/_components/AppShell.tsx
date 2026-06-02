"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import {
  type UseTypingSessionOptions,
  useTypingSession,
} from "../_lib/useTypingSession";

type AppShellProps = {
  children: (session: ReturnType<typeof useTypingSession>) => ReactNode;
  className?: string;
  sessionOptions?: UseTypingSessionOptions;
};

export function AppShell({ children, className = "shell", sessionOptions }: AppShellProps) {
  const session = useTypingSession(sessionOptions);

  return (
    <main className={className}>
      <AppHeader
        bestPracticeRank={session.bestPracticeRank}
        bestPracticeScore={session.bestPracticeScore}
        bestProductionRank={session.bestProductionRank}
        bestProductionScore={session.bestProductionScore}
        soundSettings={session.settings}
      />
      {children(session)}
    </main>
  );
}
