// hooks/useRecentDisputes.ts
import { useQuery } from "@tanstack/react-query";
import { disputeService } from "../../../services/disputeServices";
import type { DisputeListItem, DisputeRow } from "../../../types";

export function useRecentDisputes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["disputes-recent"],
    queryFn: async (): Promise<DisputeRow[]> => {
      const response = await disputeService.getDisputes({
        top: 10,
        sort: "desc",
      });
      return (response.results ?? []).map((dispute: DisputeListItem) =>
        disputeService.transformDisputeListItemToRow(dispute),
      );
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    disputes: data ?? [],
    loading: isLoading,
    error: error
      ? "Something went wrong while fetching recent disputes."
      : null,
  };
}
