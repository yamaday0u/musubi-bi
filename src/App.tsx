import { useState, useCallback } from "react";
import { Heart, Search, Loader2 } from "lucide-react";
import { isAfter, differenceInDays } from "date-fns";
import { DateRangePicker } from "@/components/DateRangePicker";
import { RankingCard } from "@/components/RankingCard";
import { Button } from "@/components/ui/button";
import { fetchRangeData } from "@/lib/koyomiApi";
import { scoreRange, type DayScore } from "@/lib/scoring";

const MAX_DAYS = 365;
const MAX_RESULTS = 50;

export default function App() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [results, setResults] = useState<DayScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("開始日と終了日を選択してください。");
      return;
    }
    if (isAfter(startDate, endDate)) {
      setError("開始日は終了日より前にしてください。");
      return;
    }
    if (differenceInDays(endDate, startDate) > MAX_DAYS) {
      setError(`検索期間は最大${MAX_DAYS}日間です。`);
      return;
    }

    setError(null);
    setLoading(true);
    setSearched(false);

    try {
      const koyomiMap = await fetchRangeData(startDate, endDate);
      const scored = scoreRange(startDate, endDate, koyomiMap);
      setResults(scored.slice(0, MAX_RESULTS));
      setSearched(true);
    } catch (err) {
      setError(
        "暦データの取得に失敗しました。しばらく時間をおいて再試行してください。",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const topResults = results.filter((r) => r.score >= 35);
  const restResults = results.filter((r) => r.score < 35);

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-rose-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur border-b border-pink-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <Heart className="text-pink-500" size={24} fill="currentColor" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">結び日</h1>
            <p className="text-xs text-gray-500">
              ふたりの入籍日を、一緒に探そう。
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* 検索フォーム */}
        <section className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              期間を選んでください
            </h2>
            <p className="text-sm text-gray-500">
              入籍を考えている期間を入力すると、縁起の良い日をランキングでお届けします。
            </p>
          </div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            onClick={handleSearch}
            disabled={loading || !startDate || !endDate}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 計算中...
              </>
            ) : (
              <>
                <Search size={18} /> 縁起の良い日を探す
              </>
            )}
          </Button>
        </section>

        {/* 結果 */}
        {searched && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                おすすめ入籍日ランキング
              </h2>
              <span className="text-sm text-gray-500">
                {topResults.length}件
              </span>
            </div>

            {topResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-gray-500">
                  この期間に縁起の良い日が見つかりませんでした。
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  期間を変えてお試しください。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topResults.map((dayScore, i) => (
                  <RankingCard
                    key={dayScore.date.toISOString()}
                    rank={i + 1}
                    dayScore={dayScore}
                  />
                ))}
              </div>
            )}

            {restResults.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  スコアが低い日も表示する（{restResults.length}件）
                </summary>
                <div className="mt-3 space-y-3">
                  {restResults.map((dayScore, i) => (
                    <RankingCard
                      key={dayScore.date.toISOString()}
                      rank={topResults.length + i + 1}
                      dayScore={dayScore}
                    />
                  ))}
                </div>
              </details>
            )}
          </section>
        )}

        {/* フッター */}
        <footer className="text-center text-xs text-gray-400 pb-8">
          <p>
            暦データは{" "}
            <a
              href="https://koyomi.zingsystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              koyomi.zingsystem.com
            </a>{" "}
            を使用しています。
          </p>
          <p className="mt-1">
            スコアはあくまで参考です。ふたりで大切な日を選んでください 💕
          </p>
        </footer>
      </main>
    </div>
  );
}
