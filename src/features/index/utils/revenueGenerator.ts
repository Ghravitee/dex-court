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

  if (type === "daily") {
    for (let i = 1; i <= 30; i++) {
      out.push({
        t: i,
        revenue: 15000 + Math.random() * 4000 + i * 200,
      });
    }
  } else if (type === "weekly") {
    for (let m = 0; m < 12; m++) {
      for (let w = 0; w < 4; w++) {
        out.push({
          t: m === 0 ? "" : months[m],
          revenue: 15000 + Math.random() * 4000 + (m * 4 + w) * 300,
        });
      }
    }
  } else {
    for (let m = 0; m < 12; m++) {
      out.push({
        t: months[m],
        revenue: 20000 + Math.random() * 6000 + m * 1000,
      });
    }
  }

  revenueCache.set(cacheKey, out);
  return out;
};
