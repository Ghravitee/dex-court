/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useVotingStatus.ts - UPDATED
import { useCallback, useEffect, useState } from "react";
import { disputeService } from "../services/disputeServices";
import { useAuth } from "../context/AuthContext";

export const useVotingStatus = (
  disputeId: number | null,
  disputeData?: any,
) => {
  const { user } = useAuth();
  const [votingStatus, setVotingStatus] = useState<{
    hasVoted: boolean;
    canVote: boolean;
    reason?: string;
    isLoading: boolean;
  }>({
    hasVoted: false,
    canVote: false,
    isLoading: true,
  });

  const checkVotingStatus = useCallback(async () => {
    if (!disputeId || !user) {
      setVotingStatus({
        hasVoted: false,
        canVote: false,
        isLoading: false,
      });
      return;
    }

    try {
      setVotingStatus((prev) => ({ ...prev, isLoading: true }));

      // Check localStorage first for quick response
      const storageKey = `vote_${disputeId}_${user.id}`;
      const savedVote = localStorage.getItem(storageKey);

      if (savedVote) {
        console.log("🎯 Found saved vote in localStorage");
        setVotingStatus({
          hasVoted: true,
          canVote: false,
          reason: "You have already voted in this dispute",
          isLoading: false,
        });
        return;
      }

      // ✅ PRIMARY: Use hasVoted from dispute data if available
      if (disputeData && disputeData.hasVoted !== undefined) {
        console.log(
          "🎯 Using hasVoted from dispute data:",
          disputeData.hasVoted,
        );
        setVotingStatus({
          hasVoted: disputeData.hasVoted,
          canVote: !disputeData.hasVoted, // If hasn't voted, they can vote
          reason: disputeData.hasVoted
            ? "You have already voted in this dispute"
            : "You can vote in this dispute",
          isLoading: false,
        });
        return;
      }

      // Fallback: API check for definitive status
      console.log("🔄 Falling back to API check for voting status");
      const eligibility = await disputeService.canUserVote(
        disputeId,
        user.id || "current-user",
      );

      console.log("🔍 Eligibility API response:", eligibility);

      // Determine hasVoted based on the API response
      const hasVotedFromAPI =
        !eligibility.canVote &&
        eligibility.reason?.toLowerCase().includes("already voted");

      setVotingStatus({
        hasVoted: hasVotedFromAPI || false,
        canVote: eligibility.canVote || false,
        reason: eligibility.reason,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error checking voting status:", error);
      setVotingStatus({
        hasVoted: false,
        canVote: false,
        reason: "Error checking voting eligibility",
        isLoading: false,
      });
    }
  }, [disputeId, user, disputeData]);

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

  useEffect(() => {
    checkVotingStatus();
  }, [checkVotingStatus]);

  return {
    ...votingStatus,
    refetch: checkVotingStatus,
    markAsVoted,
  };
};
