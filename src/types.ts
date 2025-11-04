/* eslint-disable @typescript-eslint/no-explicit-any */
export type AgreementStatusFilter =
  | "all"
  | "pending"
  | "signed"
  | "cancelled"
  | "completed"
  | "disputed"
  | "pending_approval";

export type AgreementStatus =
  | "pending"
  | "signed"
  | "cancelled"
  | "completed"
  | "disputed"
  | "pending_approval";

// Add this TimelineEvent interface
export interface TimelineEvent {
  id: number;
  eventType: number;
  type?: number; // Some events might use 'type' instead of 'eventType'
  createdAt: string;
  description?: string;
  actor?: any;
  createdBy?: any;
  userId?: number;
}

// Then update the Agreement interface
export interface Agreement {
  id: string;
  title: string;
  description: string;
  type: "Public" | "Private";
  counterparty: string;
  createdBy: string;
  status: AgreementStatus;
  dateCreated: string;
  completionDate?: string;
  deliverySubmittedDate?: string;
  signingDate?: string;
  cancellationDate?: string;
  deadline: string;
  amount?: string;
  token?: string;
  includeFunds?: "yes" | "no";
  useEscrow?: boolean;
  escrowAddress?: string;
  files: number;
  images?: string[];
  hasFundsWithoutEscrow?: boolean; // Add this
  secureTheFunds?: boolean;

  // 🆕 ADD PROPERLY TYPED TIMELINE PROPERTY
  timeline?: TimelineEvent[];

  // Avatar IDs as numbers
  createdByAvatarId?: number | null;
  counterpartyAvatarId?: number | null;
  createdByUserId?: string;
  counterpartyUserId?: string;

  // Creator information
  creator?: string;
  creatorUserId?: string;
  creatorAvatarId?: number | null;

  // Cancellation properties
  cancelPending?: boolean;
  cancelRequestedById?: string | null;
  cancelInitiatedByUser?: boolean;
  cancelInitiatedByOther?: boolean;

  // Raw API data for role checking
  _raw?: any;
}

// 🆕 ADD: Party DTO for consistent user data handling
export interface PartyDTO {
  id: number;
  username: string;
  telegramUsername?: string;
  wallet?: string | null;
  avatarId?: number | null;
  avatar?: {
    id: number;
    fileName: string;
  } | null;
}

// 🆕 ADD: File DTO for file handling
export interface FileDTO {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

// 🆕 ADD: Timeline Event DTO
export interface TimelineEventDTO {
  id: number;
  eventType: number;
  createdAt: string;
  description?: string;
}

// API response types
export interface ApiAgreement {
  id: number;
  title: string;
  description: string;
  type: number;
  visibility: number;
  status: number;
  amount?: number;
  tokenSymbol?: string;
  deadline: string;
  createdAt: string;
  escrowContract?: string;
  creator: PartyDTO;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  files: FileDTO[];
  timeline: TimelineEventDTO[];
}

// 🆕 ADD: Agreement creation request type
export interface AgreementCreateRequest {
  title: string;
  description: string;
  type: number;
  visibility: number;
  firstParty: string;
  counterParty: string;
  deadline: string;
  tokenSymbol?: string;
  contractAddress?: string;
  amount?: number;
  files?: File[];
}

// 🆕 ADD: Agreement sign request type
export interface AgreementSignRequest {
  accepted: boolean;
}

// 🆕 ADD: Agreement action states for UI
export interface AgreementActionStates {
  isSigning?: boolean;
  isCancelling?: boolean;
  isCompleting?: boolean;
  isConfirming?: boolean;
  isRejecting?: boolean;
}

// 🆕 ADD: User role in agreement
export type AgreementRole =
  | "firstParty"
  | "counterparty"
  | "viewer"
  | "creator";

// 🆕 ADD: Agreement timeline event types
export type TimelineEventType =
  | "created"
  | "signed"
  | "delivery_submitted"
  | "delivery_accepted"
  | "delivery_rejected"
  | "cancelled"
  | "disputed"
  | "completed";

export interface AgreementTimelineEvent {
  type: TimelineEventType;
  date: string;
  description?: string;
  user?: string;
}

// Escrow types (unchanged but included for completeness)
export type Escrow = {
  id: string;
  title: string;
  from: string;
  to: string;
  token: string;
  amount: number;
  status:
    | "pending"
    | "active"
    | "cancelled"
    | "completed"
    | "frozen"
    | "disputed";
  deadline: string;
  type: "public" | "private";
  description: string;
  createdAt: number;
};

// Local type extension at the top of your Escrow component file
export type ExtendedEscrow = Escrow & {
  escrowType?: "myself" | "others";
};

// 🆕 ADD: Agreement filters for the agreements list
export interface AgreementFilters {
  status?: AgreementStatusFilter;
  search?: string;
  sort?: "asc" | "desc";
  type?: "Public" | "Private" | "";
  includeFunds?: "yes" | "no" | "";
}

// 🆕 ADD: Agreement list response
export interface AgreementListResponse {
  totalAgreements: number;
  totalResults: number;
  results: AgreementSummaryDTO[];
}

export interface AgreementSummaryDTO {
  id: number;
  dateCreated: string;
  title: string;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  amount?: number;
  tokenSymbol?: string;
  deadline: string;
  status: number;
}

// 🆕 ADD: User search result type
export interface UserSearchResult {
  id: number;
  username: string;
  telegramUsername?: string;
  displayName?: string;
  avatarId?: number;
  avatar?: {
    id: number;
    fileName: string;
  };
}

// 🆕 ADD: Agreement cancellation types
export interface CancelRequestResponse {
  cancelPending: boolean;
  cancelRequestedById?: number;
  cancelRequestedAt?: string;
}

// 🆕 ADD: Agreement delivery status
export type DeliveryStatus =
  | "not_started"
  | "submitted"
  | "accepted"
  | "rejected";

export interface AgreementDelivery {
  status: DeliveryStatus;
  submittedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  submittedBy?: string;
  acceptedBy?: string;
  rejectedBy?: string;
}

// DISPUTES TYPES
// DISPUTES TYPES
// DISPUTES TYPES

// ✅ Enum replacements using `as const` for erasableSyntaxOnly safety

export const DisputeTypeEnum = {
  ProBono: 1,
  Paid: 2,
} as const;
export type DisputeTypeEnum =
  (typeof DisputeTypeEnum)[keyof typeof DisputeTypeEnum];

export const DisputeStatusEnum = {
  Pending: 1,
  VoteInProgress: 2,
  Settled: 3,
  Dismissed: 4,
} as const;
export type DisputeStatusEnum =
  (typeof DisputeStatusEnum)[keyof typeof DisputeStatusEnum];

export const DisputeResultEnum = {
  PlaintiffWon: 1,
  DefendantWon: 2,
  Cancelled: 3,
  Dismissed: 4,
} as const;
export type DisputeResultEnum =
  (typeof DisputeResultEnum)[keyof typeof DisputeResultEnum];

export const ErrorCodeEnum = {
  MissingData: 1,
  InvalidEnum: 13,
  MissingWallet: 12,
  AccountNotFound: 7,
  SameAccount: 11,
  WitnessesNotFound: 18,
  InvalidData: 14,
  InternalServerError: 10,
  Forbidden: 17,
  InvalidStatus: 16,
} as const;
export type ErrorCodeEnum = (typeof ErrorCodeEnum)[keyof typeof ErrorCodeEnum];

// ✅ Interfaces remain unchanged — fully compatible
export interface UserInfo {
  id: number;
  username: string;
  avatarId: number;
}

export interface EvidenceFile {
  id: number;
  fileName: string;
  fileSize: number;
  side: number;
  mimeType: string;
  uploadedAt: string;
}

export interface PlaintiffComplaint {
  description: string;
  formalClaim: string;
  createdAt: string;
  updatedAt: string;
  evidenceFiles: EvidenceFile[];
}

export interface DefendantResponse {
  formalClaim: string;
  createdAt: string;
  updatedAt: string;
  evidenceFiles: EvidenceFile[];
}

export interface Witnesses {
  plaintiff: UserInfo[];
  defendant: UserInfo[];
}

export interface DisputeDetails {
  id: number;
  title: string;
  status: DisputeStatusEnum;
  type: DisputeTypeEnum;
  result: DisputeResultEnum;
  createdAt: string;
  votePendingAt: string;
  voteStartedAt: string;
  voteEndedAt: string;
  plaintiff: UserInfo;
  defendant: UserInfo;
  witnesses: Witnesses;
  plaintiffComplaint: PlaintiffComplaint;
  defendantResponse: DefendantResponse;
}

export interface DisputeListItem {
  id: number;
  title: string;
  claim: string;
  requestType: DisputeTypeEnum;
  status: DisputeStatusEnum;
  result: DisputeResultEnum;
  createdAt: string;
  votePendingAt: string;
  voteStartedAt: string;
  voteEndedAt: string;
  parties: {
    plaintiff: UserInfo;
    defendant: UserInfo;
  };
}

export interface DisputeListResponse {
  totalDisputes: number;
  totalResults: number;
  results: DisputeListItem[];
}

export interface CreateDisputeRequest {
  title: string;
  description: string;
  requestKind: DisputeTypeEnum;
  defendant: string;
  claim: string;
  witnesses?: string[];
}

export interface CreateDisputeFromAgreementRequest {
  title: string;
  description: string;
  requestKind: DisputeTypeEnum;
  claim: string;
  witnesses?: string[];
  defendant: string;
}

export interface DefendantClaimRequest {
  defendantClaim: string;
  witnesses?: string[];
}

export interface VoteRequest {
  voteType: number;
  comment: string;
}

export interface ApiError {
  error: ErrorCodeEnum;
  message: string;
}

export interface UserData {
  username: string;
  userId?: string;
  avatarId?: number | null;
  telegramUsername?: string;
}
// Update your DisputeRow interface in types.ts
export interface DisputeRow {
  id: string;
  createdAt: string;
  title: string;
  request: "Pro Bono" | "Paid";
  parties: string;
  status: "Pending" | "Vote in Progress" | "Settled" | "Dismissed";
  claim: string;
  plaintiff: string;
  defendant: string;
  description?: string;
  witnesses?: {
    plaintiff: Array<{
      id: number;
      username: string;
      avatarId?: number | null;
    }>;
    defendant: Array<{
      id: number;
      username: string;
      avatarId?: number | null;
    }>;
  };
  evidence: EvidenceFile[]; // This should match the API EvidenceFile structure
  defendantResponse?: {
    description: string;
    evidence: EvidenceFile[]; // This should match the API EvidenceFile structure
    createdAt: string;
  };
  plaintiffReply?: {
    description: string;
    evidence: EvidenceFile[];
    createdAt: string;
  };
  plaintiffData?: UserData;
  defendantData?: UserData;
}

// Update EvidenceFile to have all required properties
export interface EvidenceFile {
  id: number;
  fileName: string;
  fileSize: number;
  side: number;
  mimeType: string;
  uploadedAt: string;
  // Optional properties for frontend compatibility
  fileId?: number;
  url?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size?: string;
}
