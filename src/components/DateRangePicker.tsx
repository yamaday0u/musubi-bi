import { format, addMonths, startOfMonth, endOfMonth, addYears } from "date-fns";
import { ja } from "date-fns/locale";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartChange: (date: Date | null) => void;
  onEndChange: (date: Date | null) => void;
}

// クイック選択プリセット
function getPresets() {
  const now = new Date();
  const presets = [];
  for (let i = 1; i <= 6; i++) {
    const m = addMonths(now, i);
    presets.push({
      label: format(m, "yyyy年M月", { locale: ja }),
      start: startOfMonth(m),
      end: endOfMonth(m),
    });
  }
  return presets;
}

export function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addYears(new Date(), 3), "yyyy-MM-dd");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開始日
          </label>
          <input
            type="date"
            min={today}
            max={maxDate}
            value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              const val = e.target.value;
              onStartChange(val ? new Date(val + "T00:00:00") : null);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            終了日
          </label>
          <input
            type="date"
            min={startDate ? format(startDate, "yyyy-MM-dd") : today}
            max={maxDate}
            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              const val = e.target.value;
              onEndChange(val ? new Date(val + "T00:00:00") : null);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      </div>

      {/* クイック選択 */}
      <div>
        <p className="text-xs text-gray-500 mb-2">クイック選択</p>
        <div className="flex flex-wrap gap-2">
          {getPresets().map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onStartChange(preset.start);
                onEndChange(preset.end);
              }}
              className="text-xs px-3 py-1 rounded-full border border-pink-300 text-pink-700 hover:bg-pink-50 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
