// AFTER — asks the API for judges directly; reads totalResults for the count
import { useJudges } from "./useAccounts";

export function useJudgesCount() {
  const { data, isLoading: loading } = useJudges();

  // totalResults is the authoritative count from the server.
  // Falls back to results.length in case the field is missing.
  const judgesCount = data?.totalResults ?? data?.results.length ?? 0;

  return { judgesCount, loading };
}
