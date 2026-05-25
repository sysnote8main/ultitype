import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { RankGuide } from "../_components/RankGuide";

export default function RanksPage() {
  return (
    <main className="shell rank-guide-page">
      <header className="rank-guide-page-head">
        <Link className="icon-link" href="/" aria-label="戻る" title="戻る">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="panel-heading">
            <Star size={18} fill="currentColor" />
            <span>Rank Guide</span>
          </div>
          <h1>ランクガイド</h1>
          <p>500点から G0 が始まり、必要スコアはランクごとに90点ずつ上がります。</p>
        </div>
      </header>
      <RankGuide />
    </main>
  );
}
