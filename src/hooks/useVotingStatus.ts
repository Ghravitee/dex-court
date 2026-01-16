// hooks/useVotingStatus.ts - UPDATED
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
  }>({
    hasVoted: false,
    canVote: false,
    isLoading: true,
  });

  // Helper function to check if user is plaintiff or defendant
  const isUserPartyToDispute = useCallback(() => {
    if (!user || !disputeData) return false;

    const currentUsername = user.username || user.telegramUsername;
    const normalizeUsername = (username: string | undefined): string => {
      if (!username) return "";
      return username.replace(/^@/, "").toLowerCase().trim();
    };

    const plaintiffUsername = normalizeUsername(disputeData.plaintiff);
    const defendantUsername = normalizeUsername(disputeData.defendant);
    const normalizedCurrent = normalizeUsername(currentUsername);

    return (
      normalizedCurrent === plaintiffUsername ||
      normalizedCurrent === defendantUsername
    );
  }, [user, disputeData]);

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

      // FIRST: Check if user is plaintiff or defendant - they CANNOT vote
      if (isUserPartyToDispute()) {
        console.log("🎯 User is plaintiff or defendant - cannot vote");
        setVotingStatus({
          hasVoted: false,
          canVote: false,
          reason: "Parties cannot vote in their own dispute",
          isLoading: false,
        });
        return;
      }

      // Check localStorage for quick response
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

      // Use hasVoted from dispute data if available
      if (disputeData && disputeData.hasVoted !== undefined) {
        console.log(
          "🎯 Using hasVoted from dispute data:",
          disputeData.hasVoted,
        );
        setVotingStatus({
          hasVoted: disputeData.hasVoted,
          canVote: !disputeData.hasVoted,
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
  }, [disputeId, user, disputeData, isUserPartyToDispute]);

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
