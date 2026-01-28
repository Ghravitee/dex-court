// utils/voteCalculations.ts

import type { VoteOutcomeData } from "../types";

export interface VoteCalculationResult {
  totalVotes: number;
  plaintiffJudgeVotes: number;
  defendantJudgeVotes: number;
  plaintiffCommunityVotes: number;
  defendantCommunityVotes: number;
  plaintiffVotes: number;
  defendantVotes: number;
  weightedPlaintiffPct: number;
  weightedDefendantPct: number;
  winPct: number;
  isDismissedDueToNoVotes: boolean;
}

// Remove DoneCase interface and update function to accept VoteOutcomeData
export const calculateVoteResults = (
  voteOutcome: VoteOutcomeData,
): VoteCalculationResult => {
  // Get vote counts directly from API data
  const judgeVotes = voteOutcome.votesPerGroup?.judges?.total || 0;
  const communityTierOneVotes =
    voteOutcome.votesPerGroup?.communityTierOne?.total || 0;
  const communityTierTwoVotes =
    voteOutcome.votesPerGroup?.communityTierTwo?.total || 0;
  const communityVotes = communityTierOneVotes + communityTierTwoVotes;

  const totalVotes = judgeVotes + communityVotes;

  // Get actual vote counts from API
  const plaintiffJudgeVotes = voteOutcome.votesPerGroup?.judges?.plaintiff || 0;
  const defendantJudgeVotes = voteOutcome.votesPerGroup?.judges?.defendant || 0;

  const plaintiffCommunityVotes =
    (voteOutcome.votesPerGroup?.communityTierOne?.plaintiff || 0) +
    (voteOutcome.votesPerGroup?.communityTierTwo?.plaintiff || 0);
  const defendantCommunityVotes =
    (voteOutcome.votesPerGroup?.communityTierOne?.defendant || 0) +
    (voteOutcome.votesPerGroup?.communityTierTwo?.defendant || 0);

  const plaintiffVotes = plaintiffJudgeVotes + plaintiffCommunityVotes;
  const defendantVotes = defendantJudgeVotes + defendantCommunityVotes;

  // Get percentages from API
  const judgePct = voteOutcome.judgePct;
  const communityTierOnePct =
    voteOutcome.percentagesPerGroup?.communityTierOne?.plaintiff || 0;
  const communityTierTwoPct =
    voteOutcome.percentagesPerGroup?.communityTierTwo?.plaintiff || 0;

  // Calculate weighted average for community (weight by vote count if available)
  let communityPct = 0;
  if (communityVotes > 0) {
    communityPct =
      (communityTierOnePct * communityTierOneVotes +
        communityTierTwoPct * communityTierTwoVotes) /
      communityVotes;
  }

  // Weighted calculation (70% judges, 30% community)
  const judgeWeight = 0.7;
  const communityWeight = 0.3;
  const weightedPlaintiffPct =
    judgePct * judgeWeight + communityPct * communityWeight;
  const weightedDefendantPct = 100 - weightedPlaintiffPct;

  const winPct = Math.round(weightedPlaintiffPct);
  const isDismissedDueToNoVotes =
    voteOutcome.winner === "dismissed" && totalVotes === 0;

  return {
    totalVotes,
    plaintiffJudgeVotes,
    defendantJudgeVotes,
    plaintiffCommunityVotes,
    defendantCommunityVotes,
    plaintiffVotes,
    defendantVotes,
    weightedPlaintiffPct,
    weightedDefendantPct,
    winPct,
    isDismissedDueToNoVotes,
  };
};
