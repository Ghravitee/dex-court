// hooks/useCumulativeGrowth.ts
import { usePublicAgreements } from "./usePublicAgreements";

export interface GrowthDataPoint {
  date: string; // Formatted date for display
  rawDate: string; // ISO date for sorting
  newAgreements: number;
  totalAgreements: number;
}

export function useCumulativeGrowth() {
  const { agreements, loading } = usePublicAgreements();

  if (loading) return { loading: true, data: [] };
  if (!agreements || agreements.length === 0)
    return { loading: false, data: [] };

  // Sort by dateCreated (oldest first)
  const sorted = [...agreements].sort(
    (a, b) =>
      new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime(),
  );

  // Group by day (YYYY-MM-DD)
  const groupedByDay = new Map<string, number>();

  sorted.forEach((agreement) => {
    const date = new Date(agreement.dateCreated);
    const key = date.toISOString().split("T")[0]; // YYYY-MM-DD

    groupedByDay.set(key, (groupedByDay.get(key) || 0) + 1);
  });

  // Convert to array and sort by date
  const dailyEntries = Array.from(groupedByDay.entries()).sort(
    ([dateA], [dateB]) => dateA.localeCompare(dateB),
  );

  // Calculate cumulative growth
  let cumulative = 0;
  const data: GrowthDataPoint[] = dailyEntries.map(([date, count]) => {
    cumulative += count;

    // Format date for display (DD/MM)
    const dateObj = new Date(date);
    const displayDate = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

    return {
      date: displayDate,
      rawDate: date,
      newAgreements: count,
      totalAgreements: cumulative,
    };
  });

  return { loading: false, data };
}
