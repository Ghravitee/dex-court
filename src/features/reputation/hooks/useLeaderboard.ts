import { useQuery } from "@tanstack/react-query";
import { reputationService } from "../services/reputationService";
import type { SortDirection } from "../types";

export function useLeaderboard(
  sort: SortDirection = "desc",
  search: string = "",
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", sort, search],
    queryFn: () =>
      reputationService.getLeaderboard(100, 0, sort, search || undefined),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    data: data?.results ?? [],
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch leaderboard"
      : null,
  };
}
