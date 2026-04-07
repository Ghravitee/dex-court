// hooks/useAllAgreementsCount.ts
//
// Thin wrapper kept for backwards compatibility with StatsGrid and
// useTimeSeriesStats. Internally uses TanStack Query via useAgreementsCount.
// The old double-counting of private agreements is removed — the API's
// totalAgreements already includes all agreements the user has access to.

import { useAgreementsCount } from "./useAgreements";

export function useAllAgreementsCount() {
  const {
    data: agreementsCount = 0,
    isLoading: loading,
    refetch,
  } = useAgreementsCount();

  return { agreementsCount, loading, refetch };
}
