// features/reputation/hooks/useGlobalUpdates.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { reputationService } from "../services/reputationService";
import type { GlobalUpdate } from "../types";

const PAGE_SIZE = 5;

export function useGlobalUpdates(initialLimit: number = PAGE_SIZE) {
  const [data, setData] = useState<GlobalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const pageRef = useRef(0);
  const limit = initialLimit;

  const fetchPage = useCallback(
    async (skip: number, append: boolean) => {
      try {
        const response = await reputationService.getGlobalUpdates(limit, skip);
        const results = response.results ?? [];

        setData((prev) => (append ? [...prev, ...results] : results));
        setTotal(response.total ?? 0);
        setHasMore(results.length === limit);
        pageRef.current = Math.floor(skip / limit) + 1;
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch global updates");
      }
    },
    [limit],
  );

  useEffect(() => {
    pageRef.current = 0;
    setLoading(true);
    fetchPage(0, false).finally(() => setLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(pageRef.current * limit, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchPage, limit]);

  return { data, loading, loadingMore, error, loadMore, hasMore, total };
}
