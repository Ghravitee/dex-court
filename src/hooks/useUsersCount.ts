import { useAllAccounts } from "./useAccounts";

export function useUsersCount() {
  const { data, isLoading: loading, isError } = useAllAccounts();

  return {
    usersCount: data?.totalAccounts ?? 0,
    loading,
    error: isError ? "Failed to load users count" : null,
  };
}
