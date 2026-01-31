// hooks/useVotingStatus.ts - UPDATED to use new endpoint
import { useCallback, useEffect, useState } from "react";
import { disputeService } from "../services/disputeServices";
import { useAuth } from "../hooks/useAuth";

export const useVotingStatus = (
  disputeId: number | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disputeData?: any,
) => {
  const { user } = useAuth();
  const [votingStatus, setVotingStatus] = useState<{
    hasVoted: boolean;
    canVote: boolean;
    reason?: string;
    isLoading: boolean;
    tier?: number;
    weight?: number;
    isInitialCheck: boolean; // Add this flag
  }>({
    hasVoted: false,
    canVote: false,
    isLoading: true,
    isInitialCheck: true, // Initial check is in progress
  });

  const checkVotingStatus = useCallback(async () => {
    if (!disputeId || !user) {
      setVotingStatus({
        hasVoted: false,
        canVote: false,
        isLoading: false,
        isInitialCheck: false,
      });
      return;
    }

    try {
      setVotingStatus((prev) => ({
        ...prev,
        isLoading: true,
        // Don't reset isInitialCheck if it's already false
      }));

      // Use the new endpoint for eligibility check
      const eligibility = await disputeService.canUserVote(
        disputeId,
        user.id || "current-user",
      );

      console.log("🎯 Eligibility result from useVotingStatus:", eligibility);

      // Check localStorage for quick response (for after voting)
      const storageKey = `vote_${disputeId}_${user.id}`;
      const savedVote = localStorage.getItem(storageKey);

      // If we have a saved vote, user has voted
      const hasVotedLocally = !!savedVote;

      // Determine hasVoted status
      const hasVoted =
        hasVotedLocally ||
        (eligibility.reason?.toLowerCase().includes("already voted") ?? false);

      setVotingStatus({
        hasVoted,
        canVote: eligibility.canVote && !hasVoted,
        reason: eligibility.reason,
        isLoading: false,
        isInitialCheck: false, // Mark initial check as complete
        tier: eligibility.tier,
        weight: eligibility.weight,
      });
    } catch (error) {
      console.error("Error checking voting status:", error);
      setVotingStatus({
        hasVoted: false,
        canVote: false,
        reason: "Error checking voting eligibility",
        isLoading: false,
        isInitialCheck: false,
      });
    }
  }, [disputeId, user]);

  const markAsVoted = useCallback(
    (choice: string) => {
      if (!disputeId || !user) return;

      const storageKey = `vote_${disputeId}_${user.id}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          choice,
          timestamp: Date.now(),
        }),
      );

      setVotingStatus((prev) => ({
        ...prev,
        hasVoted: true,
        canVote: false,
        reason: "You have already voted in this dispute",
      }));
    },
    [disputeId, user],
  );

  // Refresh voting status when dispute data changes
  useEffect(() => {
    checkVotingStatus();
  }, [checkVotingStatus, disputeData?.status]);

  return {
    ...votingStatus,
    refetch: checkVotingStatus,
    markAsVoted,
  };
};
