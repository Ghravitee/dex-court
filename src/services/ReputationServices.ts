/* eslint-disable @typescript-eslint/no-explicit-any */
// services/ReputationServices.ts
import { api } from "../lib/apiClient";
import { useQuery } from "@tanstack/react-query";

// Types based on API responses
export interface ReputationEvent {
  id: number;
  eventType: number;
  value: number;
  eventId: string;
  createdAt: string;
}

export interface AccountReputation {
  id: number;
  username: string;
  avatarId: number;
}

export interface ReputationHistoryResponse {
  total: number;
  totalResults: number;
  baseScore: number;
  finalScore: number;
  results: ReputationEvent[];
  hasMore?: boolean;
}

export interface DisputesStats {
  won: number;
  lost: number;
  dismissed: number;
  tie: number;
  cancelled: number;
}

export interface LeaderboardAccount {
  id: number;
  username: string;
  avatarId: number;
  finalScore: number;
  rank: number;
  agreementsTotal: number;
  disputes: DisputesStats; // Changed from number to object
  lastEvents: ReputationEvent[];
}

export interface LeaderboardResponse {
  total?: number;
  totalResults?: number;
  results?: LeaderboardAccount[];
  data?: LeaderboardAccount[];
}

export interface GlobalUpdate {
  id: number;
  account: AccountReputation;
  eventType: number;
  value: number;
  eventId: number;
  createdAt: string;
}

export interface GlobalUpdatesResponse {
  total: number;
  totalResults: number;
  results: GlobalUpdate[];
}

// TanStack Query Keys for organized cache management
export const reputationQueryKeys = {
  all: ["reputation"] as const,
  leaderboard: () => [...reputationQueryKeys.all, "leaderboard"] as const,
  leaderboardWithParams: (params: any) =>
    [...reputationQueryKeys.leaderboard(), params] as const,
  history: () => [...reputationQueryKeys.all, "history"] as const,
  historyForUser: (accountId: string) =>
    [...reputationQueryKeys.history(), accountId] as const,
  globalUpdates: () => [...reputationQueryKeys.all, "global-updates"] as const,
  globalUpdatesWithParams: (params: any) =>
    [...reputationQueryKeys.globalUpdates(), params] as const,
} as const;

// API service class using the same api client pattern
class ReputationService {
  setAuthToken(token: string) {
    console.log("🔐 Reputation service token set", token);
  }

  clearAuthToken() {
    console.log("🔐 Reputation service token cleared");
  }

  // services/ReputationServices.ts - Update the getReputationHistory method
  // services/ReputationServices.ts - Update the getReputationHistory method
  async getReputationHistory(
    accountId: string,
    top: number = 30,
    skip: number = 0,
  ): Promise<ReputationHistoryResponse> {
    console.log(`🔍 Fetching reputation history for account ${accountId}`, {
      top,
      skip,
    });

    const response = await api.get(`/accounts/${accountId}/reputation`, {
      params: { top, skip },
    });

    const data = response.data;

    console.log("📊 API Response Structure:", {
      total: data.total,
      totalResults: data.totalResults,
      resultsLength: data.results?.length,
      top,
      skip,
    });

    // Use 'total' field for total count (110 in your example)
    // Use 'totalResults' for the count returned in this page (10 in your example)
    // Calculate hasMore based on whether we've received fewer items than requested
    const hasMore = data.results.length === top;

    console.log(`✅ Reputation history fetched:`, {
      resultsCount: data.results?.length,
      total: data.total,
      totalResults: data.totalResults,
      skip,
      hasMore,
      calculation: `hasMore = (${data.results?.length} === ${top}) = ${hasMore}`,
    });

    return {
      ...data,
      hasMore,
    };
  }

  async getLeaderboard(
    top: number = 10,
    skip: number = 0,
    sort: "asc" | "desc" = "desc",
    search?: string,
  ): Promise<LeaderboardAccount[]> {
    console.log("🔍 Fetching reputation leaderboard", {
      top,
      skip,
      sort,
      search,
    });

    const params = {
      top,
      skip,
      sort,
      ...(search && { search }),
    };

    const response = await api.get("/accounts/reputation/leaderboard", {
      params,
    });

    // Handle different response structures
    let leaderboardData: LeaderboardAccount[] = [];

    if (Array.isArray(response.data)) {
      leaderboardData = response.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      leaderboardData = response.data.results;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      leaderboardData = response.data.data;
    } else {
      console.warn("Unexpected leaderboard response structure:", response.data);
      leaderboardData = [];
    }

    console.log(`✅ Leaderboard fetched: ${leaderboardData.length} users`);
    return leaderboardData;
  }

  async getGlobalUpdates(
    top: number = 5,
    skip: number = 0,
  ): Promise<GlobalUpdatesResponse> {
    console.log("🔍 Fetching global reputation updates", { top, skip });

    const response = await api.get("/accounts/reputation/updates", {
      params: { top, skip },
    });

    console.log(
      `✅ Global updates fetched: ${response.data.results?.length} events`,
    );
    return response.data;
  }
}

// Export a singleton instance
export const reputationService = new ReputationService();

// 🎯 TANSTACK QUERY HOOKS

// Query hook for leaderboard
export function useLeaderboard(
  sort: "asc" | "desc" = "desc",
  search: string = "",
  top: number = 10,
  skip: number = 0,
) {
  const params = { sort, search, top, skip };

  return useQuery({
    queryKey: reputationQueryKeys.leaderboardWithParams(params),
    queryFn: () =>
      reputationService.getLeaderboard(top, skip, sort, search || undefined),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Query hook for reputation history
export function useReputationHistory(accountId: string | null) {
  return useQuery({
    queryKey: reputationQueryKeys.historyForUser(accountId || ""),
    queryFn: () => reputationService.getReputationHistory(accountId!),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Query hook for global updates
export function useGlobalUpdates(top: number = 5, skip: number = 0) {
  const params = { top, skip };

  return useQuery({
    queryKey: reputationQueryKeys.globalUpdatesWithParams(params),
    queryFn: () => reputationService.getGlobalUpdates(top, skip),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
