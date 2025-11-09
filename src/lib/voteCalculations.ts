// utils/voteCalculations.ts

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

export const calculateVoteResults = (
  judgeVotes: number,
  communityVotes: number,
  judgePct: number,
  communityPct: number,
  winner: "plaintiff" | "defendant" | "dismissed",
): VoteCalculationResult => {
  const totalVotes = judgeVotes + communityVotes;

  // Calculate actual vote counts from percentages
  const plaintiffJudgeVotes = Math.round((judgePct / 100) * judgeVotes);
  const defendantJudgeVotes = judgeVotes - plaintiffJudgeVotes;

  const plaintiffCommunityVotes = Math.round(
    (communityPct / 100) * communityVotes,
  );
  const defendantCommunityVotes = communityVotes - plaintiffCommunityVotes;

  const plaintiffVotes = plaintiffJudgeVotes + plaintiffCommunityVotes;
  const defendantVotes = defendantJudgeVotes + defendantCommunityVotes;

  // Weighted calculation (70% judges, 30% community)
  const judgeWeight = 0.7;
  const communityWeight = 0.3;
  const weightedPlaintiffPct =
    judgePct * judgeWeight + communityPct * communityWeight;
  const weightedDefendantPct = 100 - weightedPlaintiffPct;

  const winPct = Math.round(weightedPlaintiffPct);
  const isDismissedDueToNoVotes = winner === "dismissed" && totalVotes === 0;

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
