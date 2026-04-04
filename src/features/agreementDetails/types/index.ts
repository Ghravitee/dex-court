import { Socket } from "socket.io-client";

// ─── WebSocket event types ────────────────────────────────────────────────────

export type AgreementEventType =
  | 1 // Created
  | 2 // Signed
  | 3 // Rejected
  | 4 // Delivered
  | 5 // DeliveryConfirmed
  | 6 // DeliveryRejected
  | 7 // CancelRequested
  | 8 // CancelConfirmed
  | 9 // CancelRejected
  | 10 // Expired
  | 11 // AutoCancelled
  | 13 // Completed
  | 14 // FundDeposited
  | 15 // MilestoneClaimed
  | 16 // MilestoneHoldUpdated
  | 17 // DisputeRaised
  | 18 // DisputeSettled
  | 19; // DisputeUpdated

export interface AgreementSocketEventPayload {
  agreementId: number;
  type: AgreementEventType;
  eventId: number | null;
}

export interface AgreementSocketJoinRequest {
  agreementId: number;
}

export interface AgreementSocketJoinDTO {
  ok: boolean;
  error?: number;
}

interface ServerToClientEvents {
  "agreement:event": (payload: AgreementSocketEventPayload) => void;
}

interface ClientToServerEvents {
  "agreement:join": (
    payload: AgreementSocketJoinRequest,
    ack: (res: AgreementSocketJoinDTO) => void,
  ) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── API enums ────────────────────────────────────────────────────────────────

export const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

export const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
  PARTY_SUBMITTED_DELIVERY: 7,
} as const;

export const AgreementEventTypeEnum = {
  CREATED: 1,
  SIGNED: 2,
  REJECTED: 3,
  DELIVERED: 4,
  DELIVERY_CONFIRMED: 5,
  DELIVERY_REJECTED: 6,
  CANCEL_REQUESTED: 7,
  CANCEL_CONFIRMED: 8,
  CANCEL_REJECTED: 9,
  EXPIRED: 10,
  AUTO_CANCELLED: 11,
  DISPUTED: 12,
  COMPLETED: 13,
  DISPUTERAISED: 17,
} as const;

export const DisputeTypeEnum = {
  ProBono: 1,
  Paid: 2,
} as const;

export type DisputeTypeEnumValue =
  (typeof DisputeTypeEnum)[keyof typeof DisputeTypeEnum];
