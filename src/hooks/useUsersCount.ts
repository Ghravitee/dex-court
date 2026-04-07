// hooks/useUsersCount.ts
import { useMemo } from "react";
import { useAllAccounts } from "./useAccounts";

export function useUsersCount() {
  const {
    data: allAccounts = [],
    isLoading: loading,
    isError,
  } = useAllAccounts();

  const usersCount = useMemo(
    () =>
      allAccounts.filter((user) => {
        const hasTelegram = !!user.telegram?.username?.trim();
        const hasWallet = !!user.walletAddress?.trim();
        return hasTelegram || hasWallet;
      }).length,
    [allAccounts],
  );

  return {
    usersCount,
    loading,
    error: isError ? "Failed to load users count" : null,
  };
}
