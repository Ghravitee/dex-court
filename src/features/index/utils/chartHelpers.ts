import { type GrowthDataPoint } from "../../../hooks/useAllAgreementsForGrowth";
import { type TimeframeGroupedData } from "../types";

export const groupByTimeframe = (
  data: GrowthDataPoint[],
  timeframe: "daily" | "weekly" | "monthly",
): TimeframeGroupedData[] => {
  if (data.length === 0) return [];

  if (timeframe === "daily") {
    return data.map((d) => ({
      period: d.date,
      newAgreements: d.newAgreements,
      totalAgreements: d.totalAgreements,
    }));
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

    const existing = grouped.get(key) || {
      new: 0,
      total: 0,
      rawDate: point.rawDate,
    };
    existing.new += point.newAgreements;
    existing.total = point.totalAgreements;
    grouped.set(key, existing);
  });

  const sorted = Array.from(grouped.entries()).sort(([, a], [, b]) =>
    a.rawDate.localeCompare(b.rawDate),
  );

  let cumulative = 0;
  const result: TimeframeGroupedData[] = [];

  sorted.forEach(([key, { new: newCount }]) => {
    cumulative += newCount;

    let period: string;
    if (key.includes("W")) {
      period = `W${key.split("-W")[1]}`;
    } else {
      const parts = key.split("-");
      if (parts.length >= 2) {
        const monthIndex = parseInt(parts[1]);
        if (!isNaN(monthIndex)) {
          period = new Date(2000, monthIndex, 1).toLocaleString("default", {
            month: "short",
          });
        } else {
          period = "Unknown";
        }
      } else {
        period = "Unknown";
      }
    }

    result.push({
      period,
      newAgreements: newCount,
      totalAgreements: cumulative,
    });
  });

  return result;
};

export const parseAPIDate = (dateString: string): number => {
  const date = new Date(dateString);
  if (!dateString.endsWith("Z")) {
    return new Date(dateString + "Z").getTime();
  }
  return date.getTime();
};

export const now = () => Date.now();
