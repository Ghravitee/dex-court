import { ZERO_ADDRESS } from "./config";

/**
 * Matches the Solidity return values of getAgreement(...)
 */
export interface Agreement {
  id: bigint;
  creator: `0x${string}`;
  serviceProvider: `0x${string}`;
  serviceRecipient: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  remainingAmount: bigint;
  createdAt: bigint;
  deadline: bigint;
  deadlineDuration: bigint;
  grace1Ends: bigint;
  grace2Ends: bigint;
  grace1EndsCalledBy: `0x${string}`;
  grace2EndsCalledBy: `0x${string}`;
  funded: boolean;
  signed: boolean;
  acceptedByServiceProvider: boolean;
  acceptedByServiceRecipient: boolean;
  completed: boolean;
  disputed: boolean;
  privateMode: boolean;
  frozen: boolean;
  pendingCancellation: boolean;
  orderCancelled: boolean;
  vesting: boolean;
  deliverySubmited: boolean;
  votingId: bigint;
}

export const AGREEMENT_FALLBACK: Agreement = {
  id: 0n,
  creator: ZERO_ADDRESS as `0x${string}`,
  serviceProvider: ZERO_ADDRESS as `0x${string}`,
  serviceRecipient: ZERO_ADDRESS as `0x${string}`,
  token: ZERO_ADDRESS as `0x${string}`,
  amount: 0n,
  remainingAmount: 0n,
  createdAt: 0n,
  deadline: 0n,
  deadlineDuration: 0n,
  grace1Ends: 0n,
  grace2Ends: 0n,
  grace1EndsCalledBy: ZERO_ADDRESS as `0x${string}`,
  grace2EndsCalledBy: ZERO_ADDRESS as `0x${string}`,
  funded: false,
  signed: false,
  acceptedByServiceProvider: false,
  acceptedByServiceRecipient: false,
  completed: false,
  disputed: false,
  privateMode: false,
  frozen: false,
  pendingCancellation: false,
  orderCancelled: false,
  vesting: false,
  deliverySubmited: false,
  votingId: 0n,
};

export interface MilestoneData {
  percentBP: bigint;
  unlockAt: bigint;
  heldByRecipient: boolean;
  claimed: boolean;
  amount: bigint;
}

export interface LoadingStates {
  createAgreement: boolean;
  signAgreement: boolean;
  depositFunds: boolean;
  submitDelivery: boolean;
  approveDelivery: boolean;
  rejectDelivery: boolean;
  cancelOrder: boolean;
  approveCancellation: boolean;
  partialRelease: boolean;
  finalRelease: boolean;
  cancellationTimeout: boolean;
  claimMilestone: boolean;
  setMilestoneHold: boolean;
  raiseDispute: boolean;
  loadAgreement: boolean;
}

export interface VOTING_CONFIG {
  tier1ThresholdPercent: bigint;
  tier2ThresholdPercent: bigint;
  divisor: bigint;
  tier1Weight: bigint;
  tier2Weight: bigint;
  judgeWeight: bigint;
  votingDuration: bigint;
}
export const VOTING_CONFIG_FALLBACK: VOTING_CONFIG = {
  tier1ThresholdPercent: 0n,
  tier2ThresholdPercent: 0n,
  divisor: 0n,
  tier1Weight: 0n,
  tier2Weight: 0n,
  judgeWeight: 0n,
  votingDuration: 0n,
}

export interface VotingStatsWithAvg {
  disputesOpened: bigint;
  votesCast: bigint;
  finalized: bigint;
  plaintiffWins: bigint;
  defendantWins: bigint;
  dismissed: bigint;
  tier1Votes: bigint;
  tier2Votes: bigint;
  judgeVotes: bigint;
  avgResolutionTime: bigint;
}

export interface Leaderboard {
  mostActiveJudge: `0x${string}`;
  mostActiveTier1: `0x${string}`;
  mostActiveTier2: `0x${string}`;
  mostActiveOverall: `0x${string}`;
}

export interface VoterStats {
  tier: bigint;
  totalVotes: bigint;
  votesForPlaintiff: bigint;
  votesForDefendant: bigint;
  votesForDismiss: bigint;
}

export interface VoterTier {
  tier: bigint;
  weight: bigint;
}

export interface DisputeStats {
  id: bigint;
  active: boolean;
  createdAt: bigint;
  endTime: bigint;
  finalized: boolean;
  result: bigint;
  totalVotes: bigint;
  weightedPlaintiff: bigint;
  weightedDefendant: bigint;
  weightedDismiss: bigint;
}

export interface VoterReveal {
  isRevealed: boolean;
  vote: bigint;
  tier: bigint;
  weight: bigint;
  timestamp: bigint;
}
export const VOTING_STATS_WITH_AVG_FALLBACK: VotingStatsWithAvg = {
  disputesOpened: 0n,
  votesCast: 0n,
  finalized: 0n,
  plaintiffWins: 0n,
  defendantWins: 0n,
  dismissed: 0n,
  tier1Votes: 0n,
  tier2Votes: 0n,
  judgeVotes: 0n,
  avgResolutionTime: 0n,
};

export const LEADERBOARD_FALLBACK: Leaderboard = {
  mostActiveJudge: '0x0000000000000000000000000000000000000000',
  mostActiveTier1: '0x0000000000000000000000000000000000000000',
  mostActiveTier2: '0x0000000000000000000000000000000000000000',
  mostActiveOverall: '0x0000000000000000000000000000000000000000',
};

export const VOTER_STATS_FALLBACK: VoterStats = {
  tier: 0n,
  totalVotes: 0n,
  votesForPlaintiff: 0n,
  votesForDefendant: 0n,
  votesForDismiss: 0n,
};

export const VOTER_TIER_FALLBACK: VoterTier = {
  tier: 0n,
  weight: 0n,
};

export const DISPUTE_STATS_FALLBACK: DisputeStats = {
  id: 0n,
  active: false,
  createdAt: 0n,
  endTime: 0n,
  finalized: false,
  result: 0n,
  totalVotes: 0n,
  weightedPlaintiff: 0n,
  weightedDefendant: 0n,
  weightedDismiss: 0n,
};
