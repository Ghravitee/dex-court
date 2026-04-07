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

  async getLeaderboard(
    top: number = 10,
    skip: number = 0,
    sort: SortDirection = "desc",
    search?: string,
  ): Promise<LeaderboardAccount[]> {
    const params = { top, skip, sort, ...(search ? { search } : {}) };
    const response = await api.get("/accounts/reputation/leaderboard", { params });

    // Normalise varying response shapes from the API
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.results)) return raw.results;
    if (Array.isArray(raw?.data)) return raw.data;

    console.warn("[ReputationService] Unexpected leaderboard response shape:", raw);
    return [];
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
