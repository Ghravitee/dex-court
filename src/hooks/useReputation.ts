// hooks/useReputation.ts
import { useState, useEffect, useCallback } from "react";
import { reputationService } from "../services/ReputationServices.ts";
import type {
  LeaderboardAccount,
  ReputationHistoryResponse,
  GlobalUpdate,
} from "../services/ReputationServices.ts";

export const useLeaderboard = (
  sort: "asc" | "desc" = "desc",
  search: string = "",
  initialLimit: number = 10,
) => {
  const [data, setData] = useState<LeaderboardAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = initialLimit;

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const leaderboardData = await reputationService.getLeaderboard(
        limit,
        0,
        sort,
        search || undefined,
      );
      setData(leaderboardData);
      setHasMore(leaderboardData.length >= limit);
      setPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, [sort, search, limit]);

  const loadMoreData = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const skip = page * limit;
      const newData = await reputationService.getLeaderboard(
        limit,
        skip,
        sort,
        search || undefined,
      );

      if (newData.length > 0) {
        setData((prev) => [...prev, ...newData]);
        setHasMore(newData.length >= limit);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load more leaderboard data",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, limit, sort, search]);

  useEffect(() => {
    // Reset when sort or search changes
    setData([]);
    setPage(0);
    setHasMore(true);
    loadInitialData();
  }, [sort, search, loadInitialData]);

  return {
    data,
    loading,
    loadingMore,
    error,
    loadMore: loadMoreData,
    hasMore,
    refresh: loadInitialData,
  };
};

export const useGlobalUpdates = (initialLimit: number = 5) => {
  const [data, setData] = useState<GlobalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = initialLimit;
  const [total, setTotal] = useState<number>(0);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const updatesData = await reputationService.getGlobalUpdates(limit, 0);
      setData(updatesData.results || []);
      setTotal(updatesData.total || 0);
      setHasMore((updatesData.results?.length || 0) >= limit);
      setPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch global updates",
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadMoreData = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const skip = page * limit;
      const newData = await reputationService.getGlobalUpdates(limit, skip);

      if (newData.results && newData.results.length > 0) {
        setData((prev) => [...prev, ...newData.results]);
        setHasMore(newData.results.length >= limit);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more updates",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, limit]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    data,
    loading,
    loadingMore,
    error,
    loadMore: loadMoreData,
    hasMore,
    total,
    refresh: loadInitialData,
  };
};
export const useReputationHistory = (accountId: string | null) => {
  const [data, setData] = useState<ReputationHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 30; // Show 30 events at a time

  const loadInitialData = useCallback(async () => {
    if (!accountId) {
      console.log("No account ID provided");
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Loading initial reputation data for account:", accountId);

      const history = await reputationService.getReputationHistory(
        accountId,
        itemsPerPage, // Request 30 items
        0,
      );

      console.log("📊 Initial reputation data received:", {
        results: history.results?.length,
        total: history.total, // Should be 110 in your example
        totalResults: history.totalResults, // Should be 30 if API returns 30
        hasMore: history.hasMore,
        skip: 0,
        itemsPerPage,
      });

      setData(history);
      setPage(1);
    } catch (err) {
      console.error("Error loading reputation history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user history",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const loadMoreData = useCallback(async () => {
    if (!accountId) {
      console.log("No account ID for loading more");
      return;
    }

    if (!data) {
      console.log("No data available for loading more");
      return;
    }

    if (loadingMore) {
      console.log("Already loading more");
      return;
    }

    if (!data.hasMore) {
      console.log("No more data to load. hasMore is false");
      return;
    }

    try {
      setLoadingMore(true);
      const skip = page * itemsPerPage;
      console.log("📥 Loading more reputation data:", {
        page,
        skip,
        itemsPerPage,
        currentResults: data.results?.length,
        total: data.total,
        hasMore: data.hasMore,
      });

      const newData = await reputationService.getReputationHistory(
        accountId,
        itemsPerPage,
        skip,
      );

      console.log("📊 New reputation data loaded:", {
        newResults: newData.results?.length,
        total: newData.total,
        totalResults: newData.totalResults,
        hasMore: newData.hasMore,
      });

      // Merge new results with existing ones
      setData((prev) => {
        if (!prev) return newData;

        const mergedResults = [...prev.results, ...newData.results];
        console.log("🔄 Merged results:", {
          prevResults: prev.results.length,
          newResults: newData.results.length,
          mergedResults: mergedResults.length,
          totalEvents: prev.total,
          hasMore: newData.hasMore,
        });

        return {
          ...prev,
          results: mergedResults,
          hasMore: newData.hasMore,
          // Keep other metadata from the original
          total: prev.total,
          baseScore: prev.baseScore,
          finalScore: prev.finalScore,
        };
      });

      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Error loading more reputation history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load more history",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [accountId, data, loadingMore, page, itemsPerPage]);

  useEffect(() => {
    // Reset when account changes
    console.log("🔄 Account changed, resetting reputation history:", accountId);
    setData(null);
    setPage(0);
    setLoadingMore(false);
    if (accountId) {
      loadInitialData();
    }
  }, [accountId, loadInitialData]);

  return {
    data,
    loading,
    loadingMore,
    error,
    loadMoreHistory: loadMoreData,
    hasMore: data?.hasMore || false,
  };
};
