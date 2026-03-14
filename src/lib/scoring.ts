import { format, eachDayOfInterval } from "date-fns";
import type { KoyomiDay } from "./koyomiApi";

export interface ScoreTag {
  label: string;
  type: "good" | "great" | "love" | "bad";
}

export interface DayScore {
  date: Date;
  score: number;
  stars: number;
  tags: ScoreTag[];
  isWarning: boolean;
  koyomiData?: KoyomiDay;
}

// 不成就日パターン（月 → 該当する日の配列）
const FUSEIJUUBI_PATTERN: Record<number, number[]> = {
  1: [1, 8, 15, 22, 29],
  2: [5, 12, 19, 26],
  3: [3, 10, 17, 24],
  4: [7, 14, 21, 28],
  5: [4, 11, 18, 25],
  6: [6, 13, 20, 27],
  7: [1, 8, 15, 22, 29],
  8: [5, 12, 19, 26],
  9: [3, 10, 17, 24],
  10: [7, 14, 21, 28],
  11: [4, 11, 18, 25],
  12: [6, 13, 20, 27],
};

// 黒日（受死日）パターン（月 → 該当する日）
const KOKUBI_PATTERN: Record<number, number> = {
  1: 18, 2: 1, 3: 18, 4: 14, 5: 3, 6: 17,
  7: 20, 8: 7, 9: 21, 10: 9, 11: 23, 12: 12,
};

function isFuseijuubi(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return FUSEIJUUBI_PATTERN[month]?.includes(day) ?? false;
}

function isKokubi(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return KOKUBI_PATTERN[month] === day;
}

function scoreToStars(score: number): number {
  if (score >= 70) return 5;
  if (score >= 50) return 4;
  if (score >= 35) return 3;
  if (score >= 20) return 2;
  return 1;
}

export function scoreDay(date: Date, koyomi?: KoyomiDay): DayScore {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  let score = 0;
  const tags: ScoreTag[] = [];
  let hasTensyabi = false;

  // === APIデータからの判定 ===
  if (koyomi) {
    if (koyomi.rokuyou === "大安") {
      score += 30;
      tags.push({ label: "大安", type: "great" });
    } else if (koyomi.rokuyou === "友引") {
      score += 15;
      tags.push({ label: "友引", type: "good" });
    } else if (koyomi.rokuyou === "仏滅") {
      score -= 20;
      tags.push({ label: "仏滅", type: "bad" });
    } else if (koyomi.rokuyou === "赤口") {
      score -= 10;
      tags.push({ label: "赤口", type: "bad" });
    } else if (koyomi.rokuyou) {
      tags.push({ label: koyomi.rokuyou, type: "good" });
    }

    if (koyomi.tensyabiflg) {
      score += 25;
      hasTensyabi = true;
      tags.push({ label: "天赦日", type: "great" });
    }

    if (koyomi.hitotubuflg) {
      score += 20;
      tags.push({ label: "一粒万倍日", type: "great" });
    }

    if (koyomi.daimyoubiflg) {
      score += 10;
      tags.push({ label: "大明日", type: "good" });
    }

    if (koyomi.zyunisi === "寅") {
      score += 10;
      tags.push({ label: "寅の日", type: "good" });
    } else if (koyomi.zyunisi === "巳") {
      score += 10;
      tags.push({ label: "巳の日", type: "good" });
    }

    if (koyomi.holiday) {
      score += 15;
      tags.push({ label: koyomi.holiday, type: "good" });
    }
  }

  // === フロントエンド自前判定 ===
  // 愛にまつわる記念日
  if (month === 11 && day === 22) {
    score += 25;
    tags.push({ label: "いい夫婦の日", type: "love" });
  }
  if (month === 12 && day === 12) {
    score += 25;
    tags.push({ label: "ダーズンローズデー", type: "love" });
  }
  if (month === 2 && day === 14) {
    score += 20;
    tags.push({ label: "バレンタインデー", type: "love" });
  }
  if (month === 3 && day === 14) {
    score += 20;
    tags.push({ label: "ホワイトデー", type: "love" });
  }
  if (month === 7 && day === 7) {
    score += 20;
    tags.push({ label: "七夕", type: "love" });
  }
  if (month === 6 && day === 12) {
    score += 20;
    tags.push({ label: "恋人の日", type: "love" });
  }
  if (month === 6 && day === 1) {
    score += 15;
    tags.push({ label: "プロポーズの日", type: "good" });
  }

  // ゾロ目
  if (month === day) {
    score += 15;
    tags.push({ label: "ゾロ目", type: "good" });
  }

  // ジューンブライド
  if (month === 6) {
    score += 5;
    tags.push({ label: "ジューンブライド", type: "good" });
  }

  // 連番（日 === 月 + 1）
  if (day === month + 1) {
    score += 10;
    tags.push({ label: "連番", type: "good" });
  }

  // === 凶日判定 ===
  let isWarning = false;

  if (isFuseijuubi(date)) {
    if (!hasTensyabi) score -= 15;
    tags.push({ label: "不成就日", type: "bad" });
    isWarning = true;
  }

  if (isKokubi(date)) {
    if (!hasTensyabi) score -= 20;
    tags.push({ label: "黒日", type: "bad" });
    isWarning = true;
  }

  return {
    date,
    score,
    stars: scoreToStars(score),
    tags,
    isWarning,
    koyomiData: koyomi,
  };
}

export function scoreRange(
  startDate: Date,
  endDate: Date,
  koyomiMap: Map<string, KoyomiDay>
): DayScore[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days
    .map((date) => {
      // APIのキー形式に合わせて検索（YYYYMMDD形式）
      const key8 = format(date, "yyyyMMdd");
      const key10 = format(date, "yyyy-MM-dd");
      const koyomi = koyomiMap.get(key8) ?? koyomiMap.get(key10);
      return scoreDay(date, koyomi);
    })
    .sort((a, b) => b.score - a.score);
}
