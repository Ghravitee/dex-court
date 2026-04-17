import { type RevenueDataPoint } from "../types";

const revenueCache = new Map<string, RevenueDataPoint[]>();

export const genRevenue = (
  type: "daily" | "weekly" | "monthly",
): RevenueDataPoint[] => {
  const cacheKey = `revenue-${type}`;
  if (revenueCache.has(cacheKey)) {
    return revenueCache.get(cacheKey)!;
  }

  const out: RevenueDataPoint[] = [];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const BASE_REVENUE = 0;
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate(); // 1-31

  if (type === "daily") {
    let cumulative = BASE_REVENUE;
    for (let i = 1; i <= currentDay; i++) {
      cumulative += i * 200;
      out.push({ t: i, revenue: cumulative });
    }
  } else if (type === "weekly") {
    let cumulative = BASE_REVENUE;
    for (let m = 0; m < 12; m++) {
      if (m > currentMonth) break;
      for (let w = 0; w < 4; w++) {
        cumulative += (m * 4 + w) * 300;
        out.push({
          t: m === 0 ? "" : months[m],
          revenue: cumulative,
        });
      }
    }
  } else {
    let cumulative = BASE_REVENUE;
    for (let m = 0; m <= currentMonth; m++) {
      cumulative += m * 1000;
      out.push({ t: months[m], revenue: cumulative });
    }
  }

  revenueCache.set(cacheKey, out);
  return out;
};
