// src/web3/interfaces.ts

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
  voteStartedAt: bigint;
  plaintiff: `0x${string}`;
  defendant: `0x${string}`;
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
  voteStartedAt: 0n,
  plaintiff: ZERO_ADDRESS as `0x${string}`,
  defendant: ZERO_ADDRESS as `0x${string}`,
};

export interface Escrow_Configs {
  platformFeeBP: bigint;
  feeAmount: bigint;
  disputeDuration: bigint;
  grace1Duration: bigint;
  grace2Duration: bigint;
}

export const ESCROW_CONFIG_FALLBACKS: Escrow_Configs = {
  platformFeeBP: 0n,
  feeAmount: 0n,
  disputeDuration: 0n,
  grace1Duration: 0n,
  grace2Duration: 0n,
};

export interface VOTING_CONFIG {
  disputeDuration: bigint;
  vToken: `0x${string}`; //voteToken
  feeRec: `0x${string}`; //feeRecipient
  feeAmount: bigint;
}

export const VOTING_CONFIG_FALLBACK: VOTING_CONFIG = {
  disputeDuration: 0n,
  vToken: ZERO_ADDRESS as `0x${string}`,
  feeRec: ZERO_ADDRESS as `0x${string}`,
  feeAmount: 0n,
};

// Add a type for batch creators result
export type BatchCreatorsResult = {
  id: bigint;
  creator: `0x${string}`;
  exists: boolean;
}[];

export const BATCH_CREATORS_FALLBACK: BatchCreatorsResult = [];

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
