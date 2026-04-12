// features/reputation/hooks/useReputationHistory.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { reputationService } from "../services/reputationService";

const ITEMS_PER_PAGE = 30;

export function useReputationHistory(accountId: string | null) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["reputation-history", accountId],
    queryFn: ({ pageParam = 0 }) =>
      reputationService.getReputationHistory(
        accountId!,
        ITEMS_PER_PAGE,
        pageParam,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore
        ? lastPage.results.length > 0
          ? lastPage.results.length
          : undefined
        : undefined,
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Merge pages into a single results array for consumers
  const allResults = data?.pages.flatMap((p) => p.results) ?? [];
  const firstPage = data?.pages[0];

  return {
    data: firstPage
      ? { ...firstPage, results: allResults, hasMore: hasNextPage ?? false }
      : null,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch reputation history"
      : null,
    hasMore: hasNextPage ?? false,
    loadMore: fetchNextPage,
    eventsShown: allResults.length,
    total: firstPage?.total ?? 0,
  };
}
