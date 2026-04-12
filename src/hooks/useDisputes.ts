// hooks/useDisputes
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchDisputes,
  transformDisputeListItemToRow,
} from "../services/disputeServices";
import type { DisputeRow, DisputeListItem } from "../types";

const DISPUTES_PER_PAGE = 10;

export function useDisputes(userId?: string) {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUserDisputes, setTotalUserDisputes] = useState(0);

  // Stable refs — avoid stale closure issues and unnecessary re-renders
  const allDisputesRef = useRef<DisputeRow[]>([]);
  const hasFetchedRef = useRef(false);
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Pure fetch + filter — no state side-effects, safe to call anywhere
  const fetchAllUserDisputes = useCallback(
    async (uid: string): Promise<DisputeRow[]> => {
      const response = await fetchDisputes({ top: 500, skip: 0, sort: "desc" });
      const allDisputesData: DisputeListItem[] = response.results || [];

      const transformed = allDisputesData.map(transformDisputeListItemToRow);

      return transformed.filter((dispute) => {
        const isPlaintiff = dispute.plaintiffData?.userId === uid;
        const isDefendant = dispute.defendantData?.userId === uid;

        const plaintiffWitnesses = dispute.witnesses?.plaintiff ?? [];
        const defendantWitnesses = dispute.witnesses?.defendant ?? [];
        const isWitness =
          plaintiffWitnesses.some((w) => w.id?.toString() === uid) ||
          defendantWitnesses.some((w) => w.id?.toString() === uid);

        return isPlaintiff || isDefendant || isWitness;
      });
    },
    [],
  ); // No deps — uid is passed as an argument, not closed over

  // Initial load
  useEffect(() => {
    if (!userId || hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    setLoading(true);
    setError(null);

    fetchAllUserDisputes(userId)
      .then((allUserDisputes) => {
        allDisputesRef.current = allUserDisputes;
        setTotalUserDisputes(allUserDisputes.length);
        setDisputes(allUserDisputes.slice(0, DISPUTES_PER_PAGE));
        setHasMore(allUserDisputes.length > DISPUTES_PER_PAGE);
      })
      .catch((err) => {
        console.error("Error fetching user disputes:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load disputes",
        );
      })
      .finally(() => setLoading(false));

    return () => {
      hasFetchedRef.current = false;
    };
  }, [userId, fetchAllUserDisputes]);

  const loadingMoreRef = useRef(false);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;

    const nextPage = page + 1;
    const start = (nextPage - 1) * DISPUTES_PER_PAGE;
    const end = start + DISPUTES_PER_PAGE;

    setDisputes((prev) => [
      ...prev,
      ...allDisputesRef.current.slice(start, end),
    ]);
    setHasMore(end < allDisputesRef.current.length);
    setPage(nextPage);

    loadingMoreRef.current = false;
  }, [hasMore, page]);

  const refetch = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;

    setLoading(true);
    setError(null);
    hasFetchedRef.current = false;

    try {
      const allUserDisputes = await fetchAllUserDisputes(uid);
      allDisputesRef.current = allUserDisputes;
      setTotalUserDisputes(allUserDisputes.length);
      setDisputes(allUserDisputes.slice(0, DISPUTES_PER_PAGE));
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
  }, [fetchAllUserDisputes]);

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
