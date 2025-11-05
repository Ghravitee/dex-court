// hooks/useDisputesApi.ts - FIXED VERSION
import { useState, useEffect, useCallback } from "react";
import { disputeService } from "../services/disputeServices";
import type { DisputeRow, DisputeListItem } from "../types";

export function useDisputesApi(userId?: string) {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wrap fetchUserDisputes in useCallback to prevent unnecessary recreations
  const fetchUserDisputes = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      // Get all disputes
      const response = await disputeService.getDisputes();
      const allDisputes: DisputeListItem[] = response.results || [];

      // First, transform all disputes
      const transformedDisputes = allDisputes.map(
        (dispute: DisputeListItem) => {
          return disputeService.transformDisputeListItemToRow(dispute);
        },
      );

      // Then filter by user involvement using the transformed data
      const userDisputes = transformedDisputes.filter((dispute: DisputeRow) => {
        const isPlaintiff = dispute.plaintiffData?.userId === userId;
        const isDefendant = dispute.defendantData?.userId === userId;

        // Check witness involvement using the properly typed transformed data
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

      setDisputes(userDisputes);
    } catch (err) {
      console.error("Error fetching user disputes:", err);
      setError(err instanceof Error ? err.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }, [userId]); // Add userId as dependency since it's used inside the callback

  useEffect(() => {
    fetchUserDisputes();
  }, [fetchUserDisputes]); // Now fetchUserDisputes is stable between renders

  return {
    disputes,
    loading,
    error,
    refetch: fetchUserDisputes,
  };
}
