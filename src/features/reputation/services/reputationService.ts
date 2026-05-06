// features/reputation/services/reputationService.ts
import { api } from "../../../lib/apiClient";
import type {
  LeaderboardAccount,
  ReputationHistoryResponse,
  GlobalUpdatesResponse,
  SortDirection,
} from "../types";

const ITEMS_PER_PAGE = 30;

class ReputationService {
  async getReputationHistory(
    accountId: string,
    top: number = ITEMS_PER_PAGE,
    skip: number = 0,
  ): Promise<ReputationHistoryResponse> {
    const response = await api.get(`/accounts/${accountId}/reputation`, {
      params: { top, skip },
    });

    const data = response.data;

    // FIX: hasMore should use total count comparison, not exact-match on page size.
    // Using `results.length === top` gives a false negative on the last page
    // when it happens to be a full page. Correct: check if we've fetched everything.
    const fetched = skip + (data.results?.length ?? 0);
    const hasMore = fetched < (data.total ?? 0);

    return { ...data, hasMore };
  }

  // Change the return type to include total
  async getLeaderboard(
    top: number = 10,
    skip: number = 0,
    sort: SortDirection = "desc",
    search?: string,
  ): Promise<{ results: LeaderboardAccount[]; total: number }> {
    const params = { top, skip, sort, ...(search ? { search } : {}) };
    const response = await api.get("/accounts/reputation/leaderboard", {
      params,
    });

    const raw = response.data;

    const results: LeaderboardAccount[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.results)
        ? raw.results
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

    const total: number = raw?.total ?? raw?.totalResults ?? results.length;

    return { results, total };
  }
  async getGlobalUpdates(
    top: number = 5,
    skip: number = 0,
  ): Promise<GlobalUpdatesResponse> {
    const response = await api.get("/accounts/reputation/updates", {
      params: { top, skip },
    });
    return response.data;
  }
}

export const reputationService = new ReputationService();
