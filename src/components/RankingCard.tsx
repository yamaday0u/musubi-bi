import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DayScore, ScoreTag } from "@/lib/scoring";

interface RankingCardProps {
  rank: number;
  dayScore: DayScore;
}

function StarDisplay({ stars }: { stars: number }) {
  return (
    <span className="text-yellow-400 text-lg">
      {"★".repeat(stars)}
      {"☆".repeat(5 - stars)}
    </span>
  );
}

function TagBadge({ tag }: { tag: ScoreTag }) {
  const variantMap: Record<ScoreTag["type"], "good" | "great" | "love" | "bad"> = {
    good: "good",
    great: "great",
    love: "love",
    bad: "bad",
  };

  const prefixMap: Record<ScoreTag["type"], string> = {
    good: "",
    great: "✨",
    love: "💕",
    bad: "⚠️",
  };

  return (
    <Badge variant={variantMap[tag.type]}>
      {prefixMap[tag.type]} {tag.label}
    </Badge>
  );
}

function getRankStyle(rank: number): string {
  if (rank === 1) return "border-yellow-400 bg-yellow-50";
  if (rank === 2) return "border-gray-400 bg-gray-50";
  if (rank === 3) return "border-amber-600 bg-amber-50";
  return "border-gray-200 bg-white";
}

function getRankBadge(rank: number) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
}

export function RankingCard({ rank, dayScore }: RankingCardProps) {
  const { date, score, stars, tags, isWarning } = dayScore;
  const weekday = format(date, "EEEE", { locale: ja });
  const dateStr = format(date, "yyyy年M月d日", { locale: ja });

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${getRankStyle(rank)}`}>
      <div className="flex items-start gap-3">
        {/* ランク */}
        <div className="flex-shrink-0 flex items-center justify-center w-10">
          {getRankBadge(rank)}
        </div>

        {/* 日付情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg">{dateStr}</span>
            <span className="text-gray-500 text-sm">（{weekday}）</span>
            {isWarning && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle size={12} />
                注意
              </span>
            )}
          </div>

          <div className="mt-1">
            <StarDisplay stars={stars} />
          </div>

          {/* タグ */}
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <TagBadge key={i} tag={tag} />
            ))}
          </div>
        </div>

        {/* スコア */}
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold text-pink-600">{score}</div>
          <div className="text-xs text-gray-400">pts</div>
        </div>
      </div>
    </div>
  );
}
