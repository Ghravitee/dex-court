// hooks/useDisputesApi.ts - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from "react";
import { disputeService } from "../services/disputeServices";
import type { DisputeRow, DisputeListItem } from "../types";

export function useDisputesApi(userId?: string) {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [, setAllDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUserDisputes, setTotalUserDisputes] = useState(0);
  const DISPUTES_PER_PAGE = 10;

  // Use refs for stable references
  const allDisputesRef = useRef<DisputeRow[]>([]);
  const hasFetchedRef = useRef(false);

  // Function to fetch ALL user disputes once
  const fetchAllUserDisputes = useCallback(async () => {
    if (!userId) return [];

    try {
      const response = await disputeService.getDisputes({
        top: 500,
        skip: 0,
        sort: "desc",
      });

      const allDisputesData: DisputeListItem[] = response.results || [];

      const transformedDisputes = allDisputesData.map(
        (dispute: DisputeListItem) => {
          return disputeService.transformDisputeListItemToRow(dispute);
        },
      );

      const userDisputes = transformedDisputes.filter((dispute: DisputeRow) => {
        const isPlaintiff = dispute.plaintiffData?.userId === userId;
        const isDefendant = dispute.defendantData?.userId === userId;

        let isWitness = false;
        if (dispute.witnesses && typeof dispute.witnesses === "object") {
          const plaintiffWitnesses = dispute.witnesses.plaintiff || [];
          const defendantWitnesses = dispute.witnesses.defendant || [];

          isWitness =
            plaintiffWitnesses.some((w) => w.id?.toString() === userId) ||
            defendantWitnesses.some((w) => w.id?.toString() === userId);
        }

        return isPlaintiff || isDefendant || isWitness;
      });

      return userDisputes;
    } catch (err) {
      console.error("Error fetching user disputes:", err);
      return [];
    }
  }, [userId]); // Only depend on userId

  // Initial load - should only run once per userId
  useEffect(() => {
    const fetchInitialDisputes = async () => {
      if (!userId || hasFetchedRef.current) return;

      hasFetchedRef.current = true;
      setLoading(true);

      try {
        const allUserDisputes = await fetchAllUserDisputes();
        allDisputesRef.current = allUserDisputes;
        setAllDisputes(allUserDisputes);
        setTotalUserDisputes(allUserDisputes.length);

        // Get first page
        const firstPageDisputes = allUserDisputes.slice(0, DISPUTES_PER_PAGE);
        setDisputes(firstPageDisputes);
        setHasMore(allUserDisputes.length > DISPUTES_PER_PAGE);
      } catch (err) {
        console.error("Error fetching user disputes:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load disputes",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialDisputes();

    // Reset when userId changes
    return () => {
      hasFetchedRef.current = false;
    };
  }, [userId, fetchAllUserDisputes]);

  // Function to load more disputes (stable reference)
  const loadMore = useCallback(() => {
    if (!loading && hasMore && userId) {
      setLoading(true);

      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * DISPUTES_PER_PAGE;
      const endIndex = startIndex + DISPUTES_PER_PAGE;
      const nextDisputes = allDisputesRef.current.slice(startIndex, endIndex);

      setDisputes((prev) => [...prev, ...nextDisputes]);
      setHasMore(endIndex < allDisputesRef.current.length);
      setPage(nextPage);

      setLoading(false);
    }
  }, [loading, hasMore, page, userId]);

  // Function to refresh disputes
  const refetch = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    hasFetchedRef.current = false;

    try {
      const allUserDisputes = await fetchAllUserDisputes();
      allDisputesRef.current = allUserDisputes;
      setAllDisputes(allUserDisputes);
      setTotalUserDisputes(allUserDisputes.length);

      const firstPageDisputes = allUserDisputes.slice(0, DISPUTES_PER_PAGE);
      setDisputes(firstPageDisputes);
      setHasMore(allUserDisputes.length > DISPUTES_PER_PAGE);
      setPage(1);
    } catch (err) {
      console.error("Error refetching disputes:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refetch disputes",
      );
    } finally {
      setLoading(false);
    }
  }, [userId, fetchAllUserDisputes]);

  return {
    disputes,
    loading,
    error,
    hasMore,
    totalUserDisputes,
    loadMore,
    refetch,
  };
}
