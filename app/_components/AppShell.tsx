"use client";

import type { ReactNode } from "react";
import { cx, css } from "../_lib/css-module";
import { AppHeader } from "./AppHeader";
import { MobileViewportWarning } from "./MobileViewportWarning";
import styles from "./AppShell.module.css";
import {
  type UseTypingSessionOptions,
  useTypingSession,
} from "../_lib/useTypingSession";

type AppShellProps = {
  children: (session: ReturnType<typeof useTypingSession>) => ReactNode;
  className?: string;
  sessionOptions?: UseTypingSessionOptions;
};

export function AppShell({ children, className, sessionOptions }: AppShellProps) {
  const session = useTypingSession(sessionOptions);

  return (
    <main className={cx(css(styles, "shell"), className)}>
      <AppHeader
        bestPracticeRank={session.bestPracticeRank}
        bestPracticeScore={session.bestPracticeScore}
        bestProductionRank={session.bestProductionRank}
        bestProductionScore={session.bestProductionScore}
        soundSettings={session.settings}
      />
      <MobileViewportWarning />
      {children(session)}
    </main>
  );
}
