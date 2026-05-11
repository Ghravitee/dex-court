// utils/voteCalculations.ts

import type { VoteOutcomeData } from "../types";

export interface VoteCalculationResult {
  totalVotes: number;
  plaintiffJudgeVotes: number;
  defendantJudgeVotes: number;
  splitJudgeVotes: number; // 🆕
  plaintiffCommunityVotes: number;
  defendantCommunityVotes: number;
  splitCommunityVotes: number; // 🆕
  plaintiffVotes: number;
  defendantVotes: number;
  splitVotes: number; // 🆕
  weightedPlaintiffPct: number;
  weightedDefendantPct: number;
  weightedSplitPct: number; // 🆕
  winPct: number;
  isDismissedDueToNoVotes: boolean;
  isSplit: boolean; // 🆕 convenience flag for render logic
}

export const calculateVoteResults = (
  voteOutcome: VoteOutcomeData,
): VoteCalculationResult => {
  // ── Vote counts ────────────────────────────────────────────────────────────

  const judgeVotes = voteOutcome.votesPerGroup?.judges?.total || 0;
  const communityTierOneVotes =
    voteOutcome.votesPerGroup?.communityTierOne?.total || 0;
  const communityTierTwoVotes =
    voteOutcome.votesPerGroup?.communityTierTwo?.total || 0;
  const communityVotes = communityTierOneVotes + communityTierTwoVotes;
  const totalVotes = judgeVotes + communityVotes;

  // ── Per-outcome counts ─────────────────────────────────────────────────────

  const plaintiffJudgeVotes = voteOutcome.votesPerGroup?.judges?.plaintiff || 0;
  const defendantJudgeVotes = voteOutcome.votesPerGroup?.judges?.defendant || 0;
  const splitJudgeVotes = voteOutcome.votesPerGroup?.judges?.split || 0; // 🆕

  const plaintiffCommunityVotes =
    (voteOutcome.votesPerGroup?.communityTierOne?.plaintiff || 0) +
    (voteOutcome.votesPerGroup?.communityTierTwo?.plaintiff || 0);
  const defendantCommunityVotes =
    (voteOutcome.votesPerGroup?.communityTierOne?.defendant || 0) +
    (voteOutcome.votesPerGroup?.communityTierTwo?.defendant || 0);
  const splitCommunityVotes = // 🆕
    (voteOutcome.votesPerGroup?.communityTierOne?.split || 0) + // 🆕
    (voteOutcome.votesPerGroup?.communityTierTwo?.split || 0); // 🆕

  const plaintiffVotes = plaintiffJudgeVotes + plaintiffCommunityVotes;
  const defendantVotes = defendantJudgeVotes + defendantCommunityVotes;
  const splitVotes = splitJudgeVotes + splitCommunityVotes; // 🆕

  // ── Weighted percentages ───────────────────────────────────────────────────
  // Use backend-provided weighted object when available (most accurate),
  // otherwise fall back to the manual 70/30 calculation.

  let weightedPlaintiffPct: number;
  let weightedDefendantPct: number;
  let weightedSplitPct: number; // 🆕

  if (voteOutcome.weighted) {
    // Backend already computed the weighted breakdown — use it directly.
    weightedPlaintiffPct = voteOutcome.weighted.plaintiff;
    weightedDefendantPct = voteOutcome.weighted.defendant;
    weightedSplitPct = voteOutcome.weighted.split; // 🆕
  } else {
    // Fallback: manual 70% judges / 30% community weighted average.
    const judgePct = voteOutcome.judgePct;
    const communityTierOnePct =
      voteOutcome.percentagesPerGroup?.communityTierOne?.plaintiff || 0;
    const communityTierTwoPct =
      voteOutcome.percentagesPerGroup?.communityTierTwo?.plaintiff || 0;

    let communityPct = 0;
    if (communityVotes > 0) {
      communityPct =
        (communityTierOnePct * communityTierOneVotes +
          communityTierTwoPct * communityTierTwoVotes) /
        communityVotes;
    }

    const judgeWeight = 0.7;
    const communityWeight = 0.3;
    weightedPlaintiffPct =
      judgePct * judgeWeight + communityPct * communityWeight;
    weightedDefendantPct = 100 - weightedPlaintiffPct;
    weightedSplitPct = 0; // Can't derive split from the old percentage shape
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const winPct = Math.round(weightedPlaintiffPct);
  const isDismissedDueToNoVotes =
    voteOutcome.winner === "dismissed" && totalVotes === 0;
  const isSplit = voteOutcome.winner === "split"; // 🆕

  return {
    totalVotes,
    plaintiffJudgeVotes,
    defendantJudgeVotes,
    splitJudgeVotes, // 🆕
    plaintiffCommunityVotes,
    defendantCommunityVotes,
    splitCommunityVotes, // 🆕
    plaintiffVotes,
    defendantVotes,
    splitVotes, // 🆕
    weightedPlaintiffPct,
    weightedDefendantPct,
    weightedSplitPct, // 🆕
    winPct,
    isDismissedDueToNoVotes,
    isSplit, // 🆕
  };
};
