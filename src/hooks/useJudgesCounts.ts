// hooks/useJudgesCount.ts
import { useMemo } from "react";
import { useAllAccounts } from "./useAccounts";

export function useJudgesCount() {
  const { data: allAccounts = [], isLoading: loading } = useAllAccounts();

  const judgesCount = useMemo(
    () => allAccounts.filter((user) => user.role === 2).length,
    [allAccounts],
  );

  return { judgesCount, loading };
}
