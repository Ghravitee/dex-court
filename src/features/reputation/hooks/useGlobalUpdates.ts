// features/reputation/hooks/useGlobalUpdates.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { reputationService } from "../services/reputationService";
import type { GlobalUpdate } from "../types";

const PAGE_SIZE = 5;

export function useGlobalUpdates(initialLimit: number = PAGE_SIZE) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["global-updates", initialLimit],
    queryFn: ({ pageParam = 0 }) =>
      reputationService.getGlobalUpdates(initialLimit, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const results: GlobalUpdate[] = lastPage.results ?? [];
      return results.length === initialLimit
        ? allPages.length * initialLimit
        : undefined;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const allResults = data?.pages.flatMap((p) => p.results ?? []) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return {
    data: allResults,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch global updates"
      : null,
    hasMore: hasNextPage ?? false,
    loadMore: fetchNextPage,
    total,
  };
}
