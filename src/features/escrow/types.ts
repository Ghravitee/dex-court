import type { ExtendedEscrow } from "../../types";

// ─── Enums ───────────────────────────────────────────────────────────────────

export type CreationStep =
  | "idle"
  | "creating_backend"
  | "awaiting_approval"
  | "approving"
  | "creating_onchain"
  | "waiting_confirmation"
  | "success"
  | "error";

export type EscrowType = "myself" | "others";

export type EscrowStatus =
  | "pending"
  | "signed"
  | "completed"
  | "cancelled"
  | "expired"
  | "disputed"
  | "pending_approval";

// ─── File upload ──────────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

// ─── Extended escrow types ───────────────────────────────────────────────────

type ExtendedEscrowBase = Omit<ExtendedEscrow, "status">;

export interface ExtendedEscrowWithOnChain extends ExtendedEscrowBase {
  txHash?: string;
  onChainId?: string;
  chainId?: number;
  includeFunds?: "yes" | "no";
  useEscrow?: boolean;
  escrowAddress?: string;
  escrowType?: EscrowType;
  status: EscrowStatus;
  source?: string;
  payerDetails?: {
    id?: string;
    telegramUsername?: string | null;
    username?: string;
    avatarId?: number | null;
  };
  payeeDetails?: {
    id?: string;
    telegramUsername?: string | null;
    username?: string;
    avatarId?: number | null;
  };
}

export interface OnChainEscrowData extends ExtendedEscrowWithOnChain {
  onChainStatus?: string;
  onChainAmount?: string;
  onChainDeadline?: number;
  onChainParties?: {
    serviceProvider: string;
    serviceRecipient: string;
  };
  onChainToken?: string;
  isOnChainActive?: boolean;
  isFunded?: boolean;
  isSigned?: boolean;
  isCompleted?: boolean;
  isDisputed?: boolean;
  isCancelled?: boolean;
  lastUpdated?: number;
}

// ─── Form ────────────────────────────────────────────────────────────────────

// ─── Milestone (user-friendly shape) ─────────────────────────────────────────

export interface Milestone {
  percent: string; // "25", "50", etc. — user types a plain percentage
  date: Date | null; // exact date the milestone unlocks
}

export interface EscrowFormState {
  title: string;
  type: "public" | "private" | "";
  counterparty: string;
  payer: "me" | "counterparty" | "";
  partyA: string;
  partyB: string;
  payerOther: "partyA" | "partyB" | "";
  token: string;
  customTokenAddress: string;
  amount: string;
  description: string;
  evidence: UploadedFile[];
  milestones: Milestone[];
  tokenDecimals: number;
}

export const initialFormState: EscrowFormState = {
  title: "",
  type: "",
  counterparty: "",
  payer: "",
  partyA: "",
  partyB: "",
  payerOther: "",
  token: "",
  customTokenAddress: "",
  amount: "",
  description: "",
  evidence: [],
  milestones: [],
  tokenDecimals: 18,
};

// ─── Pending agreement data (stored between steps) ───────────────────────────

export interface PendingAgreementData {
  form: EscrowFormState;
  deadline: Date | null;
  serviceProviderAddr: string;
  serviceRecipientAddr: string;
  firstPartyAddr: string;
  counterPartyAddr: string;
  contractAgreementId: string;
  filesToUpload: File[];
  tokenAddr: string;
  amountBN: bigint;
  vestingMode: boolean;
  milestonePercs: number[];
  milestoneOffsets: number[];
  deadlineDuration: number;
}
