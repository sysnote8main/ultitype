import { Activity, Trophy } from "lucide-react";
import { modes, type Metrics } from "@/src/lib/typing";
import type { RuntimeStats, StoredSession } from "../_lib/types";
import { RankBadgeCanvas } from "./RankBadgeCanvas";

type LowerStatsProps = {
  currentAccuracy: number;
  metrics: Metrics;
  sessions: StoredSession[];
  stats: RuntimeStats;
};

export function LowerStats({ currentAccuracy, metrics, sessions, stats }: LowerStatsProps) {
  return (
    <section className="lower-grid">
      <div className="analysis-panel">
        <div className="panel-heading">
          <Activity size={18} />
          <span>Live Analysis</span>
        </div>
        <dl>
          <div>
            <dt>現在行の一致率</dt>
            <dd>{(currentAccuracy * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt>平均打鍵間隔</dt>
            <dd>{metrics.paceMs ? `${metrics.paceMs.toFixed(0)} ms` : "--"}</dd>
          </div>
          <div>
            <dt>完了課題</dt>
            <dd>{stats.completedPrompts}</dd>
          </div>
          <div>
            <dt>物理打鍵</dt>
            <dd>{stats.physicalKeystrokes}</dd>
          </div>
        </dl>
      </div>

      <div className="history-panel">
        <div className="panel-heading">
          <Trophy size={18} />
          <span>Recent Sessions</span>
        </div>
        {sessions.length === 0 ? (
          <p className="empty">まだ保存されたセッションはありません。</p>
        ) : (
          <ol>
            {sessions.map((session) => (
              <li key={`${session.createdAt}-${session.modeId}`}>
                <RankBadgeCanvas
                  className="history-rank-canvas"
                  height={32}
                  rank={session.rank}
                  width={68}
                />
                <strong>{Math.round(session.score).toLocaleString()}</strong>
                <small>{modes.find((item) => item.id === session.modeId)?.label}</small>
                <em>{session.challengeLanguage === "en" ? "English" : "日本語"}</em>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
