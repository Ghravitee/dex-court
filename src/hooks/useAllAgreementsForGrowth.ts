// hooks/useAllAgreementsForGrowth.ts
import { useQuery } from "@tanstack/react-query";
import { agreementService } from "../services/agreementServices";

export interface GrowthDataPoint {
  date: string; // Formatted date for display
  rawDate: string; // ISO date for sorting
  newAgreements: number;
  totalAgreements: number;
}

export function useAllAgreementsForGrowth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["all-agreements-growth"],
    queryFn: async () => {
      console.log("📊 Fetching ALL agreements for growth chart...");

      try {
        // Get ALL agreements using the correct method signature
        const allAgreements = await agreementService.getAllAgreements({
          top: 1000, // Large number to get all agreements
          sort: "asc", // Important: Sort ascending for cumulative calculation
        });

        console.log(
          `📊 Found ${allAgreements.length} total agreements for growth calculation`,
        );

        if (allAgreements.length === 0) {
          console.log("📊 No agreements found");
          return [];
        }

        // Log first few agreements to verify data
        console.log(
          "📊 Sample agreements:",
          allAgreements.slice(0, 3).map((a) => ({
            id: a.id,
            dateCreated: a.dateCreated,
            title: a.title,
            status: a.status,
          })),
        );

        // Sort by dateCreated (oldest first) - just in case
        const sorted = [...allAgreements].sort(
          (a, b) =>
            new Date(a.dateCreated).getTime() -
            new Date(b.dateCreated).getTime(),
        );

        // Group by day (YYYY-MM-DD)
        const groupedByDay = new Map<string, number>();

        sorted.forEach((agreement) => {
          try {
            const date = new Date(agreement.dateCreated);
            const key = date.toISOString().split("T")[0]; // YYYY-MM-DD

            groupedByDay.set(key, (groupedByDay.get(key) || 0) + 1);
          } catch (e) {
            console.warn(
              `Could not parse date for agreement ${agreement.id}: ${agreement.dateCreated} `,
              e,
            );
          }
        });

        // Convert to array and sort by date
        const dailyEntries = Array.from(groupedByDay.entries()).sort(
          ([dateA], [dateB]) => dateA.localeCompare(dateB),
        );

        console.log(`📊 Grouped into ${dailyEntries.length} days`);

        // Calculate cumulative growth
        let cumulative = 0;
        const growthData: GrowthDataPoint[] = dailyEntries.map(
          ([date, count]) => {
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
          },
        );

        console.log(`📊 Generated ${growthData.length} growth data points`);
        if (growthData.length > 0) {
          console.log(
            `📊 First: ${growthData[0].date} (${growthData[0].totalAgreements})`,
          );
          console.log(
            `📊 Last: ${growthData[growthData.length - 1].date} (${growthData[growthData.length - 1].totalAgreements})`,
          );
        }

        return growthData;
      } catch (error) {
        console.error("📊 Error fetching agreements:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: data || [],
    loading: isLoading,
    error: error ? "Failed to load growth data" : null,
  };
}
