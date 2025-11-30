// hooks/useTimeSeriesFromToday.ts
import { useState, useEffect } from "react";
import { useAllAgreementsCount } from "./useAllAgreementsCount";
import { useJudgesCount } from "./useJudgesCounts";
import { useUsersCount } from "./useUsersCount";

interface DailySnapshot {
  date: string; // YYYY-MM-DD format
  agreements: number;
  judges: number;
  users: number;
}

export function useTimeSeriesFromToday() {
  const [historicalData, setHistoricalData] = useState<DailySnapshot[]>([]);

  const { agreementsCount, loading: agreementsLoading } =
    useAllAgreementsCount();
  const { judgesCount, loading: judgesLoading } = useJudgesCount();
  const { usersCount, loading: usersLoading } = useUsersCount();

  useEffect(() => {
    if (agreementsLoading || judgesLoading || usersLoading) return;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    setHistoricalData((prev) => {
      // Check if we already have today's data
      const existingTodayIndex = prev.findIndex((item) => item.date === today);

      if (existingTodayIndex >= 0) {
        // Update today's entry with latest counts
        const updated = [...prev];
        updated[existingTodayIndex] = {
          date: today,
          agreements: agreementsCount,
          judges: judgesCount,
          users: usersCount,
        };
        return updated;
      } else {
        // Add new entry for today
        return [
          ...prev,
          {
            date: today,
            agreements: agreementsCount,
            judges: judgesCount,
            users: usersCount,
          },
        ];
      }
    });
  }, [
    agreementsCount,
    judgesCount,
    usersCount,
    agreementsLoading,
    judgesLoading,
    usersLoading,
  ]);

  // Generate chart data with proper date formatting
  const chartData = historicalData.map((item) => ({
    date: formatChartDate(item.date),
    agreements: item.agreements,
    judges: item.judges,
    users: item.users,
    rawDate: item.date,
  }));

  return {
    data: chartData,
    loading: agreementsLoading || judgesLoading || usersLoading,
    startDate: historicalData[0]?.date,
  };
}

// Helper function
function formatChartDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}
