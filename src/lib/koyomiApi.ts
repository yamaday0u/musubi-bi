export interface KoyomiDay {
  date: string; // "YYYY-MM-DD"
  rokuyou: string;
  hitotubuflg: boolean;
  tensyabiflg: boolean;
  daimyoubiflg: boolean;
  holiday: string;
  zyunisi: string;
}

interface DayData {
  rokuyou?: string;
  hitotubuflg?: boolean;
  tensyabiflg?: boolean;
  daimyoubiflg?: boolean;
  holiday?: string;
  zyunisi?: string;
}

interface ApiResponse {
  datelist: Record<string, DayData>;
}

const CACHE_KEY_PREFIX = "musubi_koyomi_";

export async function fetchMonthData(year: number, month: number): Promise<KoyomiDay[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}${year}_${String(month).padStart(2, "0")}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached) as KoyomiDay[];
  }

  const mm = String(month).padStart(2, "0");
  const base = "https://koyomi.zingsystem.com/api";
  const url = `${base}/?mode=m&cnt=1&targetyyyy=${year}&targetmm=${mm}&targetdd=01`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json() as ApiResponse;

  const datelist = json.datelist ?? {};
  const days: KoyomiDay[] = Object.entries(datelist).map(([dateStr, data]) => ({
    date: dateStr, // "YYYY-MM-DD"
    rokuyou: data.rokuyou ?? "",
    hitotubuflg: data.hitotubuflg ?? false,
    tensyabiflg: data.tensyabiflg ?? false,
    daimyoubiflg: data.daimyoubiflg ?? false,
    holiday: data.holiday ?? "",
    zyunisi: data.zyunisi ?? "",
  }));

  sessionStorage.setItem(cacheKey, JSON.stringify(days));
  return days;
}

export async function fetchRangeData(startDate: Date, endDate: Date): Promise<Map<string, KoyomiDay>> {
  const months = new Set<string>();
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.add(`${current.getFullYear()}-${current.getMonth() + 1}`);
    current.setMonth(current.getMonth() + 1);
  }

  const allDays = new Map<string, KoyomiDay>();

  await Promise.all(
    Array.from(months).map(async (monthStr) => {
      const [year, month] = monthStr.split("-").map(Number);
      const days = await fetchMonthData(year, month);
      days.forEach((day) => {
        allDays.set(day.date, day);
      });
    })
  );

  return allDays;
}
