"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import { modes } from "@/src/lib/typing";
import { AppShell } from "../_components/AppShell";
import { RankBadgeCanvas } from "../_components/RankBadgeCanvas";
import { SelectSoundLink } from "../_components/SelectSoundLink";

export default function UserPage() {
  return (
    <AppShell className="shell user-page">
      {(session) => (
        <>
          <header className="user-page-head">
            <div>
              <div className="panel-heading">
                <UserRound size={18} />
                <span>User</span>
              </div>
              <h1>ローカルユーザー</h1>
              <p>Keybase連携は未設定です。</p>
            </div>
            <SelectSoundLink
              className="icon-link"
              href="/"
              aria-label="戻る"
              soundKind="back"
              title="戻る"
            >
              <ArrowLeft size={20} />
            </SelectSoundLink>
          </header>

          <section className="user-summary" aria-label="ユーザー概要">
            <div>
              <span>仮ランク</span>
              <RankBadgeCanvas
                className="user-summary-rank-canvas"
                rank={session.bestPracticeRank.label}
              />
              <strong>{Math.round(session.bestPracticeScore).toLocaleString()}</strong>
            </div>
            <div>
              <span>本番ランク</span>
              <RankBadgeCanvas
                className="user-summary-rank-canvas"
                rank={session.bestProductionRank.label}
              />
              <strong>{Math.round(session.bestProductionScore).toLocaleString()}</strong>
            </div>
          </section>

          <section className="user-sessions-panel">
            <div className="panel-heading">
              <UserRound size={18} />
              <span>Recent Sessions</span>
            </div>
            {session.sessions.length === 0 ? (
              <p className="empty">まだ保存されたセッションはありません。</p>
            ) : (
              <ol className="user-session-list">
                {session.sessions.map((storedSession) => (
                  <li key={`${storedSession.createdAt}-${storedSession.modeId}`}>
                    <RankBadgeCanvas
                      className="history-rank-canvas"
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
