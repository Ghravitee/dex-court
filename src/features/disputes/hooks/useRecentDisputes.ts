import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { disputeService } from "../../../services/disputeServices";
import type { DisputeListItem, DisputeRow } from "../../../types";

const fetchRecentDisputes = async (): Promise<DisputeRow[]> => {
  const response = await disputeService.getDisputes({ top: 10, sort: "desc" });
  const results: DisputeListItem[] = response.results || [];
  return results.map((dispute) =>
    disputeService.transformDisputeListItemToRow(dispute),
  );
};

export const useRecentDisputes = () => {
  const { data, isLoading, isError } = useQuery<DisputeRow[]>({
    queryKey: ["disputes", "recent"],
    queryFn: fetchRecentDisputes,
    staleTime: 1000 * 60 * 5, // 5 min — same page revisit won't refetch
    gcTime: 1000 * 60 * 10, // 10 min — keep in cache after unmount
  });

  const disputeItems = useMemo(
    () =>
      (data ?? []).map((dispute) => ({
        id: dispute.id,
        quote:
          dispute.claim || dispute.description || `Dispute: ${dispute.title}`,
        name: dispute.parties,
        title: dispute.title,
        plaintiff: dispute.plaintiff,
        defendant: dispute.defendant,
        plaintiffData: dispute.plaintiffData,
        defendantData: dispute.defendantData,
        plaintiffUserId:
          dispute.plaintiffData?.userId || dispute.plaintiffData?.id || "",
        defendantUserId:
          dispute.defendantData?.userId || dispute.defendantData?.id || "",
        evidenceCount: dispute.evidence?.length || 0,
      })),
    [data],
  );

  return { disputeItems, loading: isLoading, isError };
};
