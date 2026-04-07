// features/reputation/hooks/useLeaderboard.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { reputationService } from "../services/reputationService";
import type { LeaderboardAccount, SortDirection } from "../types";

const PAGE_SIZE = 10;

export function useLeaderboard(sort: SortDirection = "desc", search: string = "") {
  const [data, setData] = useState<LeaderboardAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Track the page in a ref so loadMore doesn't need to be a dep of itself
  const pageRef = useRef(0);

  const fetchPage = useCallback(
    async (skip: number, append: boolean) => {
      try {
        const results = await reputationService.getLeaderboard(
          PAGE_SIZE,
          skip,
          sort,
          search || undefined,
        );

        setData((prev) => (append ? [...prev, ...results] : results));
        // hasMore: if we got a full page there might be more
        setHasMore(results.length === PAGE_SIZE);
        pageRef.current = Math.floor(skip / PAGE_SIZE) + 1;
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
      }
    },
    [sort, search],
  );

  // Reset and reload when sort/search changes
  useEffect(() => {
    pageRef.current = 0;
    setData([]);
    setHasMore(false);
    setError(null);
    setLoading(true);

    fetchPage(0, false).finally(() => setLoading(false));
  }, [fetchPage]); // fetchPage already captures sort + search

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(pageRef.current * PAGE_SIZE, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchPage]);

  return { data, loading, loadingMore, error, loadMore, hasMore };
}
