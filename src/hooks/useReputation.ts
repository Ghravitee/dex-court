// hooks/useReputation.ts
import { useState, useEffect } from "react";
import { reputationService } from "../services/ReputationServices.ts";
import type {
  LeaderboardAccount,
  ReputationHistoryResponse,
  GlobalUpdate,
} from "../services/ReputationServices.ts";

export const useLeaderboard = (
  sort: "asc" | "desc" = "desc",
  search: string = "",
) => {
  const [data, setData] = useState<LeaderboardAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const leaderboardData = await reputationService.getLeaderboard(
          10,
          0,
          sort,
          search || undefined,
        );
        setData(leaderboardData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch leaderboard",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [sort, search]);

  return { data, loading, error };
};

export const useGlobalUpdates = () => {
  const [data, setData] = useState<GlobalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalUpdates = async () => {
      try {
        setLoading(true);
        setError(null);
        const updatesData = await reputationService.getGlobalUpdates(5);
        setData(updatesData.results);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch global updates",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalUpdates();
  }, []);

  return { data, loading, error };
};

export const useReputationHistory = (accountId: string | null) => {
  const [data, setData] = useState<ReputationHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserHistory = async () => {
      if (!accountId) {
        setData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const history = await reputationService.getReputationHistory(accountId);
        setData(history);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch user history",
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserHistory();
  }, [accountId]);

  return { data, loading, error };
};
