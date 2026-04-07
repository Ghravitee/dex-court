// features/reputation/hooks/useReputationHistory.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { reputationService } from "../services/reputationService";
import type { ReputationHistoryResponse } from "../types";

const ITEMS_PER_PAGE = 30;

export function useReputationHistory(accountId: string | null) {
  const [data, setData] = useState<ReputationHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track skip in a ref — avoids stale closure issues in loadMore
  const skipRef = useRef(0);

  const loadInitial = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    skipRef.current = 0;

    try {
      const history = await reputationService.getReputationHistory(
        accountId,
        ITEMS_PER_PAGE,
        0,
      );
      setData(history);
      skipRef.current = history.results.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reputation history");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const loadMore = useCallback(async () => {
    if (!accountId || !data?.hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const next = await reputationService.getReputationHistory(
        accountId,
        ITEMS_PER_PAGE,
        skipRef.current,
      );

      setData((prev) => {
        if (!prev) return next;
        return {
          ...prev,
          results: [...prev.results, ...next.results],
          hasMore: next.hasMore,
        };
      });

      skipRef.current += next.results.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more history");
    } finally {
      setLoadingMore(false);
    }
  }, [accountId, data?.hasMore, loadingMore]);

  // Reset and reload whenever the selected account changes
  useEffect(() => {
    setData(null);
    setError(null);
    skipRef.current = 0;

    if (accountId) loadInitial();
  }, [accountId, loadInitial]);

  return {
    data,
    loading,
    loadingMore,
    error,
    loadMore,
    hasMore: data?.hasMore ?? false,
    eventsShown: data?.results.length ?? 0,
    total: data?.total ?? 0,
  };
}
