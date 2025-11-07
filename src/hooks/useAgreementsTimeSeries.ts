/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAgreementsTimeSeries.ts
import { useState, useEffect } from "react";
import { usePublicAgreements } from "./usePublicAgreements";

interface TimeSeriesData {
  t: string;
  agreements: number;
  signed: number;
  pending: number;
  completed: number;
}

export function useAgreementsTimeSeries(
  type: "daily" | "weekly" | "monthly" = "monthly",
) {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { agreements: allAgreements, loading: agreementsLoading } =
    usePublicAgreements();

  useEffect(() => {
    if (agreementsLoading) return;

    try {
      setLoading(true);
      setError(null);

      // Group agreements by time period
      const groupedData = groupAgreementsByTime(allAgreements, type);
      setData(groupedData);

      console.log(`✅ Generated ${type} agreement time series:`, groupedData);
    } catch (err) {
      console.error("Failed to generate agreement time series:", err);
      setError("Failed to load agreement statistics");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [allAgreements, agreementsLoading, type]);

  return { data, loading, error };
}

function groupAgreementsByTime(
  agreements: any[],
  type: "daily" | "weekly" | "monthly",
): TimeSeriesData[] {
  if (!Array.isArray(agreements)) return [];

  // Sort agreements by creation date
  const sortedAgreements = [...agreements].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (sortedAgreements.length === 0) return [];

  const now = new Date();
  const result: TimeSeriesData[] = [];

  if (type === "daily") {
    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const label = `Day ${14 - i}`;

      const dayAgreements = sortedAgreements.filter((agreement) => {
        const agreementDate = new Date(agreement.createdAt)
          .toISOString()
          .split("T")[0];
        return agreementDate === dateStr;
      });

      result.push({
        t: label,
        agreements: dayAgreements.length,
        signed: dayAgreements.filter((a) => a.status === "signed").length,
        pending: dayAgreements.filter((a) => a.status === "pending").length,
        completed: dayAgreements.filter((a) => a.status === "completed").length,
      });
    }
  } else if (type === "weekly") {
    // Last 12 weeks

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const label = `Week ${12 - i}`;

      const weekAgreements = sortedAgreements.filter((agreement) => {
        const agreementDate = new Date(agreement.createdAt);
        return agreementDate >= weekStart && agreementDate <= weekEnd;
      });

      result.push({
        t: label,
        agreements: weekAgreements.length,
        signed: weekAgreements.filter((a) => a.status === "signed").length,
        pending: weekAgreements.filter((a) => a.status === "pending").length,
        completed: weekAgreements.filter((a) => a.status === "completed")
          .length,
      });
    }
  } else {
    // Monthly for the last 12 months
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

    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[month.getMonth()];

      const monthAgreements = sortedAgreements.filter((agreement) => {
        const agreementDate = new Date(agreement.createdAt);
        return (
          agreementDate.getMonth() === month.getMonth() &&
          agreementDate.getFullYear() === month.getFullYear()
        );
      });

      result.push({
        t: monthLabel,
        agreements: monthAgreements.length,
        signed: monthAgreements.filter((a) => a.status === "signed").length,
        pending: monthAgreements.filter((a) => a.status === "pending").length,
        completed: monthAgreements.filter((a) => a.status === "completed")
          .length,
      });
    }
  }

  return result;
}
