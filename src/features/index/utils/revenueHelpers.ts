import { type RevenueDataPoint } from "../hooks/useRevenueData";

export interface RevenueChartPoint {
  period: string;
  newRevenue: number;
  totalRevenue: number;
}

export const groupRevenueByTimeframe = (
  data: RevenueDataPoint[],
  timeframe: "daily" | "weekly" | "monthly",
): RevenueChartPoint[] => {
  if (data.length === 0) return [];

  if (timeframe === "daily") {
    let cumulative = 0;
    return data.map((d) => {
      cumulative += d.amount;
      const date = new Date(d.rawDate);
      const displayDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      return {
        period: displayDate,
        newRevenue: d.amount,
        totalRevenue: cumulative,
      };
    });
  }

  const grouped = new Map<string, { new: number; rawDate: string }>();
  

  data.forEach((point) => {
    const date = new Date(point.rawDate);
    let key: string;

    if (timeframe === "weekly") {
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7,
      );
      key = `${date.getFullYear()}-W${weekNumber}`;
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}`;
    }

    const existing = grouped.get(key) ?? { new: 0, rawDate: point.rawDate };
    existing.new += point.amount;
    grouped.set(key, existing);
  });

  const sorted = Array.from(grouped.entries()).sort(([, a], [, b]) =>
    a.rawDate.localeCompare(b.rawDate),
  );

  let cumulative = 0;
  return sorted.map(([key, { new: newAmount }]) => {
    cumulative += newAmount;

    let period: string;
    if (key.includes("W")) {
      period = `W${key.split("-W")[1]}`;
    } else {
      const parts = key.split("-");
      const monthIndex = parseInt(parts[1]);
      period = isNaN(monthIndex)
        ? "Unknown"
        : new Date(2000, monthIndex, 1).toLocaleString("default", { month: "short" });
    }

    return { period, newRevenue: newAmount, totalRevenue: cumulative };
  });
};