// AFTER — data is now AccountListResponse; read .results for the array
import { useMemo } from "react";
import { useAllAccounts } from "./useAccounts";

export function useUsersCount() {
  const { data, isLoading: loading, isError } = useAllAccounts();

  // .results holds the array; fall back to [] if the query hasn't resolved yet
  const usersCount = useMemo(
    () =>
      (data?.results ?? []).filter((user) => {
        const hasTelegram = !!user.telegram?.username?.trim();
        const hasWallet = !!user.walletAddress?.trim();
        return hasTelegram || hasWallet;
      }).length,
    [data?.results],
  );

  return {
    usersCount,
    loading,
    error: isError ? "Failed to load users count" : null,
  };
}
