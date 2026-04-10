/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useVotingStatus.ts
import { useCallback, useEffect, useState } from "react";
import { checkVoteEligibility } from "../../../services/disputeServices";
import { useAuth } from "../../../hooks/useAuth";

interface VotingStatus {
  hasVoted: boolean;
  canVote: boolean;
  reason?: string;
  isLoading: boolean;
  tier?: number;
  weight?: number;
  isInitialCheck: boolean;
}

export const useVotingStatus = (
  disputeId: number | null,
  disputeData?: any,
) => {
  const { user } = useAuth();
  const [votingStatus, setVotingStatus] = useState<VotingStatus>({
    hasVoted: false,
    canVote: false,
    isLoading: true,
    isInitialCheck: true,
  });

  const checkVotingStatus = useCallback(async () => {
    if (!disputeId || !user) {
      setVotingStatus((prev) => ({
        ...prev,
        hasVoted: false,
        canVote: false,
        isLoading: false,
        isInitialCheck: false,
      }));
      return;
    }

    const hasVoted = disputeData?.hasVoted === true;

    if (hasVoted) {
      setVotingStatus({
        hasVoted: true,
        canVote: false,
        isLoading: false,
        isInitialCheck: false,
      });
      return;
    }

    setVotingStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      const eligibility = await checkVoteEligibility(disputeId);

      setVotingStatus({
        hasVoted: false,
        canVote: eligibility.canVote,
        reason: eligibility.reason,
        isLoading: false,
        isInitialCheck: false,
        tier: eligibility.tier,
        weight: eligibility.weight,
      });
    } catch (error) {
      console.error("Error checking voting eligibility:", error);
      setVotingStatus({
        hasVoted: false,
        canVote: false,
        reason: "Error checking voting eligibility",
        isLoading: false,
        isInitialCheck: false,
      });
    }
  }, [disputeId, user, disputeData?.hasVoted]);

  const markAsVoted = useCallback(() => {
    setVotingStatus((prev) => ({
      ...prev,
      hasVoted: true,
      canVote: false,
    }));
  }, []);

  useEffect(() => {
    checkVotingStatus();
  }, [checkVotingStatus, disputeData?.status]);

  return { ...votingStatus, refetch: checkVotingStatus, markAsVoted };
};
