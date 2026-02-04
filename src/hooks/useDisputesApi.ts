// hooks/useDisputesApi.ts - UPDATE THIS FILE
import { useState, useEffect, useCallback } from "react";
import { disputeService } from "../services/disputeServices";
import type { DisputeRow, DisputeListItem } from "../types";

export function useDisputesApi(userId?: string) {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const DISPUTES_PER_PAGE = 10; // Load 10 disputes at a time

  // Function to fetch disputes for a specific page
  const fetchUserDisputes = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!userId) return;

      // If resetting, show loading for first page only
      if (reset || pageNum === 1) {
        setLoading(true);
      }
      setError(null);

      try {
        // Get disputes with pagination
        const response = await disputeService.getDisputes({
          top: DISPUTES_PER_PAGE,
          skip: (pageNum - 1) * DISPUTES_PER_PAGE,
          sort: "desc",
        });

        const allDisputes: DisputeListItem[] = response.results || [];

        // Transform disputes...
        const transformedDisputes = allDisputes.map(
          (dispute: DisputeListItem) => {
            return disputeService.transformDisputeListItemToRow(dispute);
          },
        );

        // Filter by user involvement
        const userDisputes = transformedDisputes.filter(
          (dispute: DisputeRow) => {
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
          },
        );

        // Update disputes state
        if (reset || pageNum === 1) {
          setDisputes(userDisputes);
        } else {
          setDisputes((prev) => [...prev, ...userDisputes]);
        }

        // Check if we have more disputes to load
        setHasMore(userDisputes.length === DISPUTES_PER_PAGE);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching user disputes:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load disputes",
        );
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchUserDisputes(1, true);
    } else {
      setDisputes([]);
      setHasMore(false);
    }
  }, [userId, fetchUserDisputes]);

  // Function to load more disputes
  const loadMore = useCallback(() => {
    if (!loading && hasMore && userId) {
      fetchUserDisputes(page + 1, false);
    }
  }, [loading, hasMore, page, userId, fetchUserDisputes]);

  // Function to refresh disputes
  const refetch = useCallback(() => {
    if (userId) {
      fetchUserDisputes(1, true);
    }
  }, [userId, fetchUserDisputes]);

  return {
    disputes,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
