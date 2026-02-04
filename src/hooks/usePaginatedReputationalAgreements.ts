/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/usePaginatedReputationalAgreements.ts
import { useState, useEffect, useCallback } from "react";
import { agreementService } from "../services/agreementServices";

export function usePaginatedReputationalAgreements(userId?: string) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const AGREEMENTS_PER_PAGE = 10;

  // Filter reputational agreements where user is involved
  const filterUserReputationalAgreements = useCallback(
    (allAgreements: any[]) => {
      if (!userId) return [];

      return allAgreements.filter((agreement: any) => {
        // Only reputational agreements (type === 1)
        if (agreement.type !== 1) return false;

        // Check by user ID
        const firstPartyId = agreement.firstParty?.id?.toString();
        const counterPartyId = agreement.counterParty?.id?.toString();

        return firstPartyId === userId || counterPartyId === userId;
      });
    },
    [userId],
  );

  // Fetch reputational agreements with pagination
  const fetchReputationalAgreements = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!userId) return;

      if (reset || pageNum === 1) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await agreementService.getAgreements({
          top: AGREEMENTS_PER_PAGE,
          skip: (pageNum - 1) * AGREEMENTS_PER_PAGE,
          sort: "desc",
        });

        const allAgreements = response.results || [];
        const userAgreements = filterUserReputationalAgreements(allAgreements);

        // Update agreements state
        if (reset || pageNum === 1) {
          setAgreements(userAgreements);
        } else {
          setAgreements((prev) => [...prev, ...userAgreements]);
        }

        // Check if we have more agreements to load
        setHasMore(userAgreements.length === AGREEMENTS_PER_PAGE);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching reputational agreements:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load agreements",
        );
      } finally {
        setLoading(false);
      }
    },
    [userId, filterUserReputationalAgreements],
  );

  // Function to load more agreements
  const loadMore = useCallback(() => {
    if (!loading && hasMore && userId) {
      fetchReputationalAgreements(page + 1, false);
    }
  }, [loading, hasMore, page, userId, fetchReputationalAgreements]);

  // Function to refresh agreements
  const refetch = useCallback(() => {
    if (userId) {
      fetchReputationalAgreements(1, true);
    }
  }, [userId, fetchReputationalAgreements]);

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchReputationalAgreements(1, true);
    } else {
      setAgreements([]);
      setHasMore(false);
    }
  }, [userId, fetchReputationalAgreements]);

  return {
    agreements,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
