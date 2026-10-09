import { BarChart2 } from "lucide-react";

interface BarData {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}

interface BarChartProps {
  data: BarData[];
  unit?: "currency" | "number" | "percentage";
  height?: number;
  showValues?: boolean;
  showIcons?: boolean;
  emptyMessage?: string;
}

function formatValue(
  value: number,
  unit: "currency" | "number" | "percentage"
) {
  if (unit === "currency") {
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  }

  if (unit === "percentage") {
    return `${Math.round(value)}%`;
  }

  return Math.round(value).toLocaleString("en-IN");
}

export default function BarChart({
  data,
  unit = "number",
  height = 200,
  showValues = true,
  showIcons = false,
  emptyMessage = "No data available",
}: BarChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => d.value),
    0
  );

  if (data.length === 0 || maxValue === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center text-slate-400">
        <div className="text-center">
          <BarChart2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="relative flex items-end justify-between gap-2"
        style={{ height: `${height + 40}px` }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * height;

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex flex-1 flex-col items-center group"
            >
              <div className="relative flex w-full max-w-[80px] justify-center">
                {showIcons && item.icon && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    {item.icon}
                  </div>
                )}

                <div
                  className="w-full max-w-[60px] rounded-t-lg shadow-sm transition-all duration-200 group-hover:opacity-90"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: item.color || "#0d9488",
                  }}
                />

                <div className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                  <div className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-white whitespace-nowrap shadow-lg">
                    {item.label}:{" "}
                    {formatValue(item.value, unit)}
                  </div>
                </div>
              </div>

              {showValues && barHeight > 12 && (
                <div className="mt-1 text-center">
                  <p className="text-xs font-bold text-slate-600">
                    {formatValue(item.value, unit)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: item.color || "#0d9488",
              }}
            />
            <span className="truncate">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
