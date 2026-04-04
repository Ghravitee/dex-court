/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { disputeService } from "../../../services/disputeServices";
import { type LiveCase } from "../types";
import { parseAPIDate } from "../utils/dateUtils";
import { VOTING_DURATION } from "../constants";

export const useLiveDisputes = () => {
  const [liveCases, setLiveCases] = useState<LiveCase[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [votingStartedDisputes, setVotingStartedDisputes] = useState<
    Set<string>
  >(new Set());

  const fetchLiveDisputes = useCallback(async () => {
    try {
      setLiveLoading(true);
      const response = await disputeService.getVoteInProgressDisputes();

      if (response?.results) {
        const liveDisputes = response.results.map((dispute: any) => {
          let endsAt;
          if (dispute.voteStartedAt) {
            const voteStartedAt = parseAPIDate(dispute.voteStartedAt);
            endsAt = voteStartedAt + VOTING_DURATION;
          } else if (dispute.agreement?.type === 2) {
            endsAt = parseAPIDate(dispute.createdAt) + VOTING_DURATION;
          } else {
            endsAt = parseAPIDate(dispute.createdAt) + VOTING_DURATION;
          }

          return {
            id: dispute.id.toString(),
            title: dispute.title || "Untitled Dispute",
            parties: {
              plaintiff: dispute.parties?.plaintiff?.username || "@plaintiff",
              defendant: dispute.parties?.defendant?.username || "@defendant",
              plaintiffAvatar: dispute.parties?.plaintiff?.avatarId || null,
              defendantAvatar: dispute.parties?.defendant?.avatarId || null,
              plaintiffId: dispute.parties?.plaintiff?.id?.toString() || "",
              defendantId: dispute.parties?.defendant?.id?.toString() || "",
            },
            description:
              dispute.claim || dispute.description || "No description provided",
            endsAt,
            totalVotes: 0,
            plaintiffVotes: 0,
            defendantVotes: 0,
            dismissedVotes: 0,
            hasVoted: dispute.hasVoted || false,
            participants: [],
            agreement: dispute.agreement || { type: 1 },
            contractAgreementId: dispute.contractAgreementId,
            chainId: dispute.chainId,
            txnhash: dispute.txnhash,
            type: dispute.type,
            voteStartedAt: dispute.voteStartedAt,
            rawDispute: dispute,
          };
        });

        setLiveCases(liveDisputes);

        const startedDisputeIds = liveDisputes
          .filter((d) => d.voteStartedAt)
          .map((d) => d.id);

        setVotingStartedDisputes((prev) => {
          const newSet = new Set(prev);
          startedDisputeIds.forEach((id) => newSet.add(id));
          return newSet;
        });
      }
    } catch (err) {
      console.error("Failed to fetch live disputes:", err);
      throw err;
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const isVoteStarted = useCallback(
    (disputeId: string): boolean => {
      const dispute = liveCases.find((d) => d.id === disputeId);
      if (!dispute) return false;

      if (dispute.agreement?.type === 1) {
        return true;
      }

      if (dispute.agreement?.type === 2) {
        return votingStartedDisputes.has(disputeId) || !!dispute.voteStartedAt;
      }

      return votingStartedDisputes.has(disputeId) || !!dispute.voteStartedAt;
    },
    [liveCases, votingStartedDisputes],
  );

  return {
    liveCases,
    liveLoading,
    votingStartedDisputes,
    fetchLiveDisputes,
    isVoteStarted,
    setLiveCases,
    setLiveLoading,
  };
};
