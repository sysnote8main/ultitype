"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import { modes } from "@/src/lib/typing";
import { css } from "../_lib/css-module";
import { AppShell } from "../_components/AppShell";
import { RankBadgeCanvas } from "../_components/RankBadgeCanvas";
import { SelectSoundLink } from "../_components/SelectSoundLink";
import styles from "./UserPage.module.css";

export default function UserPage() {
  return (
    <AppShell className={css(styles, "user-page")}>
      {(session) => (
        <>
          <header className={css(styles, "user-page-head")}>
            <div>
              <div className={css(styles, "panel-heading")}>
                <UserRound size={18} />
                <span>User</span>
              </div>
              <h1>ローカルユーザー</h1>
              <p>Keybase連携は未設定です。</p>
            </div>
            <SelectSoundLink
              className={css(styles, "icon-link")}
              href="/"
              aria-label="戻る"
              soundKind="back"
              title="戻る"
            >
              <ArrowLeft size={20} />
            </SelectSoundLink>
          </header>

          <section className={css(styles, "user-summary")} aria-label="ユーザー概要">
            <div>
              <span>仮ランク</span>
              <RankBadgeCanvas
                className={css(styles, "user-summary-rank-canvas")}
                rank={session.bestPracticeRank.label}
              />
              <strong>{Math.round(session.bestPracticeScore).toLocaleString()}</strong>
            </div>
            <div>
              <span>本番ランク</span>
              <RankBadgeCanvas
                className={css(styles, "user-summary-rank-canvas")}
                rank={session.bestProductionRank.label}
              />
              <strong>{Math.round(session.bestProductionScore).toLocaleString()}</strong>
            </div>
          </section>

          <section className={css(styles, "user-sessions-panel")}>
            <div className={css(styles, "panel-heading")}>
              <UserRound size={18} />
              <span>Recent Sessions</span>
            </div>
            {session.sessions.length === 0 ? (
              <p className={css(styles, "empty")}>まだ保存されたセッションはありません。</p>
            ) : (
              <ol className={css(styles, "user-session-list")}>
                {session.sessions.map((storedSession) => (
                  <li key={`${storedSession.createdAt}-${storedSession.modeId}`}>
                    <RankBadgeCanvas
                      className={css(styles, "history-rank-canvas")}
                      height={32}
                      rank={storedSession.rank}
                      width={68}
                    />
                    <strong>{Math.round(storedSession.score).toLocaleString()}</strong>
                    <small>{modes.find((item) => item.id === storedSession.modeId)?.label}</small>
                    <em>{storedSession.challengeLanguage === "en" ? "English" : "日本語"}</em>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
