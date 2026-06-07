"use client";

import { ArrowLeft, Star } from "lucide-react";
import { css } from "../_lib/css-module";
import { AppShell } from "../_components/AppShell";
import { RankGuide } from "../_components/RankGuide";
import { SelectSoundLink } from "../_components/SelectSoundLink";
import styles from "./RanksPage.module.css";

export default function RanksPage() {
  return (
    <AppShell className={css(styles, "rank-guide-page")}>
      {() => (
        <>
          <header className={css(styles, "rank-guide-page-head")}>
            <div>
              <div className={css(styles, "panel-heading")}>
                <Star size={18} fill="currentColor" />
                <span>Rank Guide</span>
              </div>
              <h1>ランクガイド</h1>
              <p>
                500点未満はランクなし、500点から G0 が始まり、基準スコアはランクごとに90点ずつ上がります。
              </p>
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
          <RankGuide />
        </>
      )}
    </AppShell>
  );
}
