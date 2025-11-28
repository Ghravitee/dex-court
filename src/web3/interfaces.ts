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
