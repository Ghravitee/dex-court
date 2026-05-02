// src/features/admin/types.ts

import type { OnChainEscrowData } from "../escrow/types";

export type AdminRoleValue = 0 | 1 | 2 | 3;

export interface AdminUser {
  id: number;
  role: AdminRoleValue;
  isVerified: boolean;
  isAdmin: boolean;
  username?: string;
  bio?: string;
  walletAddress?: string;
  avatarId: number | null;
  telegram?: {
    username?: string;
    id?: string;
  };
}

export interface AdminRoleUpdateResponse {
  errorCode?: number;
  message?: string;
}

export type RoleTarget = "judge" | "community";

export interface AdminStats {
  totalUsers: number;
  admins: number;
  judges: number;
  community: number;
  verified: number;
  walletConnected: number;
  telegramLinked: number;
}

export type Tab = "configs" | "operations";

export interface EscrowConfigInput {
  platformFeeBp: bigint;
  feeAmount: bigint;
  disputeDuration: bigint;
  grace1Duration: bigint;
  grace2Duration: bigint;
}

export interface VotingConfigInput {
  disputeDuration: bigint;
  voteToken: `0x${string}`;
  feeRecipient: `0x${string}`;
  disputeResolver: `0x${string}`;
  feeAmount: bigint;
}

export interface ContractConfigsTabProps {
  activeChainId: number;
  escrowAddress: `0x${string}`;
  votingAddress: `0x${string}`;
  explorerBase: string;
  onUpdateEscrowConfig: (newConfig: EscrowConfigInput) => Promise<void>;
  onUpdateVotingConfig: (newConfig: VotingConfigInput) => Promise<void>;
  isUpdatingEscrow: boolean;
  isUpdatingVoting: boolean;
}

export type TxAction =
  | "setEscrowConfig"
  | "setVotingConfig"
  | "setDisputeResolver"
  | "setFeeRecipient"
  | "freezeAgreement"
  | "recoverStuckEthEscrow"
  | "recoverStuckEthVoting"
  | "recoverStuckTokenEscrow"
  | "recoverStuckTokenVoting"
  | "finalizeEscrowDispute"
  | "finalizeVotingDispute";


export type DisputeOutcome = (typeof DisputeOutcome)[keyof typeof DisputeOutcome];

const DisputeOutcome = {
  Resolved: 0,
  Dismissed: 1,
  Dropped: 2,
} as const;

export interface EscrowConfigInput {
  platformFeeBp: bigint;
  feeAmount: bigint;
  disputeDuration: bigint;
  grace1Duration: bigint;
  grace2Duration: bigint;
}

export interface VotingConfigInput {
  disputeDuration: bigint;
  voteToken: `0x${string}`;
  feeRecipient: `0x${string}`;
  disputeResolver: `0x${string}`;
  feeAmount: bigint;
}

export interface ContractConfigsTabProps {
  escrowAddress: `0x${string}`;
  votingAddress: `0x${string}`;
  explorerBase: string;
  onUpdateEscrowConfig: (newConfig: EscrowConfigInput) => Promise<void>;
  onUpdateVotingConfig: (newConfig: VotingConfigInput) => Promise<void>;
  onSetDisputeResolver: (resolver: `0x${string}`) => Promise<void>;
  onSetFeeRecipient: (recipient: `0x${string}`) => Promise<void>;
  onFreezeAgreement: (id: bigint, status: boolean) => Promise<void>;
  onRecoverStuckEthEscrow: (amount: bigint) => Promise<void>;
  onRecoverStuckEthVoting: (amount: bigint) => Promise<void>;
  onRecoverStuckTokenEscrow: (token: `0x${string}`, amount: bigint) => Promise<void>;
  onRecoverStuckTokenVoting: (token: `0x${string}`, amount: bigint) => Promise<void>;
  isUpdatingEscrow: boolean;
  isUpdatingVoting: boolean;
  isFreezingAgreement: boolean;
  isRecoveringEscrowEth: boolean;
  isRecoveringVotingEth: boolean;
  isRecoveringEscrowToken: boolean;
  isRecoveringVotingToken: boolean;
}

export function shortAddress(address?: string) {
  if (!address) return "—";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export function formatDuration(seconds: string): string {
  const s = Number(seconds);
  if (!s) return "—";
  if (s % 86400 === 0) return `${s / 86400} day${s / 86400 !== 1 ? "s" : ""}`;
  if (s % 3600 === 0) return `${s / 3600} hour${s / 3600 !== 1 ? "s" : ""}`;
  if (s % 60 === 0) return `${s / 60} min`;
  return `${s}s`;
}

export type AgreementStatus =
  | "pending"
  | "signed"
  | "cancelled"
  | "completed"
  | "expired"
  | "disputed"
  | "pending_approval"
  | "frozen";

  // Add near the top, after imports:
interface AgreementRaw {
  onChainData?: {
    frozen?: boolean;
  };
  disputes?: Array<{
    votingId?: string | number;
    disputeId?: string | number;
  }>;
}

export interface AdminAgreement extends Omit<OnChainEscrowData, '_raw'> {
  _raw?: AgreementRaw;
}