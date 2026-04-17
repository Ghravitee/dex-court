import { type RevenueDataPoint } from "../hooks/useRevenueData";

export interface RevenueChartPoint {
  period: string;
  newRevenue: number;
  totalRevenue: number;
}

const BASE_REVENUE = 0;

export const groupRevenueByTimeframe = (
  data: RevenueDataPoint[],
  timeframe: "daily" | "weekly" | "monthly",
): RevenueChartPoint[] => {
  if (data.length === 0) return [];

  if (timeframe === "daily") {
    let cumulative = BASE_REVENUE;
    return data.map((d) => {
      cumulative += d.amount;
      return {
        period: d.rawDate,
        newRevenue: d.amount,
        totalRevenue: cumulative,
      };
    });
  }

  const grouped = new Map<
    string,
    { new: number; total: number; rawDate: string }
  >();

  data.forEach((point) => {
    const date = new Date(point.rawDate);
    let key: string;

    if (timeframe === "weekly") {
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) /
          7,
      );
      key = `${date.getFullYear()}-W${weekNumber}`;
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}`;
    }

    const existing = grouped.get(key) ?? {
      new: 0,
      total: 0,
      rawDate: point.rawDate,
    };
    existing.new += point.amount;
    grouped.set(key, existing);
  });

  const sorted = Array.from(grouped.entries()).sort(([, a], [, b]) =>
    a.rawDate.localeCompare(b.rawDate),
  );

  let cumulative = BASE_REVENUE;
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
        : new Date(2000, monthIndex, 1).toLocaleString("default", {
            month: "short",
          });
    }

    return { period, newRevenue: newAmount, totalRevenue: cumulative };
  });
};
