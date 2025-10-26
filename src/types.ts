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
  | "signed" // Keep for backward compatibility
  | "cancelled"
  | "completed"
  | "disputed"
  | "pending_approval";

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
  deadline: string;
  amount?: string;
  token?: string;
  includeFunds?: "yes" | "no";
  useEscrow?: boolean;
  escrowAddress?: string;
  files: number;
  images?: string[];

  // Avatar IDs as numbers
  createdByAvatarId?: number | null;
  counterpartyAvatarId?: number | null;
  createdByUserId?: string;
  counterpartyUserId?: string;

  // Creator information
  creator?: string;
  creatorUserId?: string;
  creatorAvatarId?: number | null;

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
