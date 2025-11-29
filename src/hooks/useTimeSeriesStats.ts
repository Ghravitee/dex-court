// hooks/useTimeSeriesStats.ts
import { useState, useEffect } from "react";
import { useAllAgreementsCount } from "./useAllAgreementsCount";
import { useJudgesCount } from "./useJudgesCounts";
import { generateTimeSeriesData } from "../lib/timeSeriesGenerator";

export interface TimeSeriesData {
  date: string;
  agreements: number;
  judges: number;
}

export function useTimeSeriesStats(timeframe: "daily" | "weekly" | "monthly") {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  const { agreementsCount, loading: agreementsLoading } =
    useAllAgreementsCount();
  const { judgesCount, loading: judgesLoading } = useJudgesCount();

  useEffect(() => {
    if (!agreementsLoading && !judgesLoading) {
      const timeSeries = generateTimeSeriesData(
        timeframe,
        agreementsCount,
        judgesCount,
      );
      setData(timeSeries);
      setLoading(false);
    }
  }, [
    timeframe,
    agreementsCount,
    judgesCount,
    agreementsLoading,
    judgesLoading,
  ]);

  return { data, loading };
}
