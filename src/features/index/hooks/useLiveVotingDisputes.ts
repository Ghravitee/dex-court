/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useLiveVotingDisputes.ts
import { useQuery } from "@tanstack/react-query";
import { fetchVoteInProgressDisputes } from "../../../services/disputeServices";
import { parseAPIDate, now } from "../utils/chartHelpers";
import { type LiveVotingItem } from "../types";

export function useLiveVotingDisputes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["disputes-live-voting"],
    queryFn: async (): Promise<LiveVotingItem[]> => {
      const response = await fetchVoteInProgressDisputes();
      const results = response?.results ?? [];

      return results.map((dispute: any) => {
        const base = dispute.voteStartedAt
          ? parseAPIDate(dispute.voteStartedAt)
          : parseAPIDate(dispute.createdAt);
        const endsAt = base + 24 * 60 * 60 * 1000;
        const remain = Math.max(0, endsAt - now());
        const daysLeft = Math.ceil(remain / (24 * 60 * 60 * 1000));

        return {
          id: dispute.id.toString(),
          quote:
            dispute.claim || dispute.description || `Dispute: ${dispute.title}`,
          name: `${dispute.parties?.plaintiff?.username || "@plaintiff"} vs ${dispute.parties?.defendant?.username || "@defendant"}`,
          title: `Community Voting • ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`,
          plaintiff: dispute.parties?.plaintiff?.username || "@plaintiff",
          defendant: dispute.parties?.defendant?.username || "@defendant",
          plaintiffData: dispute.parties?.plaintiff,
          defendantData: dispute.parties?.defendant,
          plaintiffUserId:
            dispute.parties?.plaintiff?.id?.toString() ||
            dispute.parties?.plaintiff?.userId ||
            "",
          defendantUserId:
            dispute.parties?.defendant?.id?.toString() ||
            dispute.parties?.defendant?.userId ||
            "",
          endsAt,
          hasVoted: dispute.hasVoted || false,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    liveDisputes: data ?? [],
    loading: isLoading,
    error: error
      ? "Something went wrong while fetching live voting sessions."
      : null,
  };
}
