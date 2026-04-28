// hooks/useAccounts.ts
//
// TanStack Query hooks for account data.
// These are the ONLY place caching, deduplication, and background refetch
// are configured. Components import from here, not from accountService directly.
//
// Query key conventions:
//   ["account", "me"]                      — authenticated user's own account
//   ["account", "id", accountId]           — account by numeric ID
//   ["account", "username", username]      — account by username
//   ["account", "wallet", walletAddress]   — account by wallet address
//   ["accounts", "all"]                    — full account list (admin / wallet lookup)

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  fetchMyAccount,
  fetchAccountById,
  fetchAccountByUsername,
  fetchAccountByWalletAddress,
  fetchAllAccounts,
  uploadAvatar,
  updateAccount,
  updateAccountsToJudge,
  updateAccountsToCommunity,
  type AccountSummaryDTO,
  type AccountUpdateRequest,
  type FetchAccountsParams,
  type AccountListResponse,
} from "../services/accountService";
import { clearAvatarCache } from "../lib/avatarUtils";

// ─── Query keys ────────────────────────────────────────────────────────────────
// Centralised so invalidation calls are type-safe and refactor-proof.

export const accountKeys = {
  me: () => ["account", "me"] as const,
  byId: (id: string) => ["account", "id", id] as const,
  byUsername: (username: string) => ["account", "username", username] as const,
  byWallet: (address: string) => ["account", "wallet", address] as const,
  all: () => ["accounts", "all"] as const,
  judges: () => ["accounts", "judges"] as const, // ← isolated
};

// ─── Shared stale times ────────────────────────────────────────────────────────

const STALE = {
  /** Own profile — relatively fresh, user may update it */
  me: 2 * 60 * 1000,
  /** Other profiles — less volatile */
  profile: 5 * 60 * 1000,
  /** Full user list — expensive to fetch, changes rarely */
  list: 10 * 60 * 1000,
} as const;

// ─── Query hooks ───────────────────────────────────────────────────────────────

/** Authenticated user's own account. Disabled when not logged in. */
export function useMyAccount(
  options?: Partial<UseQueryOptions<AccountSummaryDTO>>,
) {
  const isLoggedIn = !!localStorage.getItem("authToken");

  return useQuery({
    queryKey: accountKeys.me(),
    queryFn: fetchMyAccount,
    enabled: isLoggedIn,
    staleTime: STALE.me,
    ...options,
  });
}

/** Any account by its numeric ID. */
export function useAccountById(
  accountId: string | null | undefined,
  options?: Partial<UseQueryOptions<AccountSummaryDTO>>,
) {
  return useQuery({
    queryKey: accountKeys.byId(accountId ?? ""),
    queryFn: () => fetchAccountById(accountId!),
    enabled: !!accountId,
    staleTime: STALE.profile,
    ...options,
  });
}

/** Account by Telegram username or wallet address. */
export function useAccountByUsername(
  username: string | null | undefined,
  options?: Partial<UseQueryOptions<AccountSummaryDTO>>,
) {
  return useQuery({
    queryKey: accountKeys.byUsername(username ?? ""),
    queryFn: () => fetchAccountByUsername(username!),
    enabled: !!username,
    staleTime: STALE.profile,
    ...options,
  });
}

/**
 * Account by wallet address.
 * WARNING: Fetches all accounts client-side. Not scalable.
 * Remove once backend adds GET /accounts/wallet/:address.
 */
export function useAccountByWallet(
  walletAddress: string | null | undefined,
  options?: Partial<UseQueryOptions<AccountSummaryDTO>>,
) {
  return useQuery({
    queryKey: accountKeys.byWallet(walletAddress ?? ""),
    queryFn: () => fetchAccountByWalletAddress(walletAddress!),
    enabled: !!walletAddress,
    // Long stale time because the full-list fetch is expensive
    staleTime: STALE.list,
    ...options,
  });
}

/** Full account list — used for admin panels and wallet lookups. */
export function useAllAccounts(
  params?: FetchAccountsParams,
  options?: Partial<UseQueryOptions<AccountListResponse>>,
) {
  return useQuery({
    // params included in the key so different filters get separate cache entries
    queryKey: [...accountKeys.all(), params] as const,
    queryFn: () => fetchAllAccounts(params),
    staleTime: STALE.list,
    ...options,
  });
}

/** Fetches only judge accounts using the new isJudge filter — no client-side filtering. */
export function useJudges(
  params?: Omit<FetchAccountsParams, "isJudge">,
  options?: Partial<UseQueryOptions<AccountListResponse>>,
) {
  return useQuery({
    queryKey: [...accountKeys.judges(), params] as const, // ← own namespace
    queryFn: () => fetchAllAccounts({ ...params, isJudge: true }),
    staleTime: STALE.list,
    ...options,
  });
}

// ─── Mutation hooks ────────────────────────────────────────────────────────────

/** Update the authenticated user's username or bio. */
export const userProfileKeys = {
  all: () => ["userProfile"] as const,
};

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountUpdateRequest) => updateAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.me() });
      queryClient.invalidateQueries({
        queryKey: accountKeys.all(),
        refetchType: "all",
      });
      // Invalidates ALL ["userProfile", ...] entries regardless of handle
      queryClient.invalidateQueries({
        queryKey: ["userProfile"],
        refetchType: "all",
      });
    },
  });
}

/** Upload a new avatar image for the authenticated user. */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      if (currentUser.id) clearAvatarCache(currentUser.id);

      queryClient.invalidateQueries({ queryKey: accountKeys.me() });
      queryClient.invalidateQueries({
        queryKey: accountKeys.all(),
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["userProfile"],
        refetchType: "all",
      });
    },
  });
}

/** Promote a list of accounts to the Judge role (admin only). */
export function useUpdateAccountsToJudge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountsId: number[]) => updateAccountsToJudge(accountsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all() });
      queryClient.invalidateQueries({ queryKey: accountKeys.judges() }); // ← add
    },
  });
}

/** Demote a list of accounts to the Community role (admin only). */
export function useUpdateAccountsToCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountsId: number[]) => updateAccountsToCommunity(accountsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all() });
      queryClient.invalidateQueries({ queryKey: accountKeys.judges() }); // ← add
    },
  });
}
