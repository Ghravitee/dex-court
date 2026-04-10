// features/reputation/hooks/useLeaderboard.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { reputationService } from "../services/reputationService";
import type { SortDirection } from "../types";

const PAGE_SIZE = 10;

export function useLeaderboard(
  sort: SortDirection = "desc",
  search: string = "",
) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["leaderboard", sort, search],
    queryFn: ({ pageParam = 0 }) =>
      reputationService.getLeaderboard(
        PAGE_SIZE,
        pageParam,
        sort,
        search || undefined,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    data: data?.pages.flat() ?? [],
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch leaderboard"
      : null,
    hasMore: hasNextPage ?? false,
    loadMore: fetchNextPage,
  };
}
