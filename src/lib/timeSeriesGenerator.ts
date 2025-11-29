import type { TimeSeriesData } from "../hooks/useTimeSeriesStats";

// utils/timeSeriesGenerator.ts
export function generateTimeSeriesData(
  timeframe: "daily" | "weekly" | "monthly",
  currentAgreements: number,
  currentJudges: number,
): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const now = new Date();

  if (timeframe === "daily") {
    // Last 14 days - FIXED: Start from oldest to newest
    for (let i = 0; i < 14; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (13 - i)); // Start from 13 days ago to today

      const progress = i / 13; // Progress from 0 to 1
      const agreements = Math.max(
        1,
        Math.floor(currentAgreements * (0.3 + 0.7 * progress)),
      );
      const judges = Math.max(
        1,
        Math.floor(currentJudges * (0.4 + 0.6 * progress)),
      );

      // FIXED: Day/Month format (21/11 instead of 11/21)
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      data.push({
        date: `${day}/${month}`,
        agreements,
        judges,
      });
    }
  } else if (timeframe === "weekly") {
    // FIXED: Show current month divided into weeks
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get weeks for current month
    const weeksInMonth = getWeeksInMonth(currentYear, currentMonth);

    for (let i = 0; i < weeksInMonth; i++) {
      const progress = i / (weeksInMonth - 1);
      const agreements = Math.max(
        1,
        Math.floor(currentAgreements * (0.3 + 0.7 * progress)),
      );
      const judges = Math.max(
        1,
        Math.floor(currentJudges * (0.4 + 0.6 * progress)),
      );

      data.push({
        date: `Week ${i + 1}`,
        agreements,
        judges,
      });
    }
  } else {
    // FIXED: Full year January to December
    const monthNames = [
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

    for (let i = 0; i < 12; i++) {
      const progress = i / 11; // Progress from Jan (0) to Dec (1)
      const agreements = Math.max(
        1,
        Math.floor(currentAgreements * (0.1 + 0.9 * progress)),
      );
      const judges = Math.max(
        1,
        Math.floor(currentJudges * (0.2 + 0.8 * progress)),
      );

      data.push({
        date: monthNames[i],
        agreements,
        judges,
      });
    }
  }

  return data;
}

// Helper function to get weeks in a month
function getWeeksInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstWeekDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysInMonth = lastDay.getDate();

  return Math.ceil((firstWeekDay + daysInMonth) / 7);
}
