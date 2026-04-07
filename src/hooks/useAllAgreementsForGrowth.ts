// hooks/useAllAgreementsForGrowth.ts
import { useQuery } from "@tanstack/react-query";
import { fetchAgreements } from "../services/agreementServices";

export interface GrowthDataPoint {
  date: string; // Formatted date for display (DD/MM)
  rawDate: string; // ISO date for sorting/grouping
  newAgreements: number;
  totalAgreements: number;
}

export function useAllAgreementsForGrowth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agreements-growth"],
    queryFn: async (): Promise<GrowthDataPoint[]> => {
      // Fetch the most recent 500 agreements sorted oldest-first for
      // cumulative calculation. The hard cap avoids the unbounded pagination
      // loop that previously existed. If the platform grows beyond this,
      // the backend should expose a dedicated time-series endpoint.
      const response = await fetchAgreements({
        top: 500,
        skip: 0,
        sort: "asc",
      });

      const agreements = response.results ?? [];
      if (agreements.length === 0) return [];

      // Group by day (YYYY-MM-DD)
      const groupedByDay = new Map<string, number>();

      agreements.forEach((agreement) => {
        try {
          const key = new Date(agreement.dateCreated)
            .toISOString()
            .split("T")[0];
          groupedByDay.set(key, (groupedByDay.get(key) ?? 0) + 1);
        } catch {
          // Skip unparseable dates — non-critical
        }
      });

      // Sort chronologically and compute cumulative totals
      const dailyEntries = Array.from(groupedByDay.entries()).sort(([a], [b]) =>
        a.localeCompare(b),
      );

      let cumulative = 0;
      return dailyEntries.map(([date, count]) => {
        cumulative += count;
        const d = new Date(date);
        const displayDate = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;

        return {
          date: displayDate,
          rawDate: date,
          newAgreements: count,
          totalAgreements: cumulative,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    data: data ?? [],
    loading: isLoading,
    error: error ? "Failed to load growth data" : null,
  };
}
