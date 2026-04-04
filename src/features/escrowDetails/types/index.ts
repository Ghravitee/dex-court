/* eslint-disable @typescript-eslint/no-explicit-any */
import { Socket } from "socket.io-client";

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type AgreementEventType =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19;

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

export const AgreementTypeEnum = { REPUTATION: 1, ESCROW: 2 } as const;

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

export const DisputeStatusEnum = {
  Pending: 1,
  VoteInProgress: 2,
  Settled: 3,
  Dismissed: 4,
  PendingPayment: 5,
  PendingLockingFunds: 6,
} as const;

// ─── Data shape ───────────────────────────────────────────────────────────────

export interface EscrowDetailsData {
  id: string;
  title: string;
  description: string;
  type: "public" | "private";
  from: string;
  to: string;
  status: string;
  dateCreated: string;
  deadline: string;
  amount?: string;
  token?: string;
  includeFunds: "yes" | "no";
  useEscrow: boolean;
  secureTheFunds: boolean;
  escrowAddress?: string;
  files: number;
  images: string[];
  fromAvatarId: number | null;
  toAvatarId: number | null;
  fromUserId: string;
  toUserId: string;
  creator: string;
  creatorUserId: string;
  creatorAvatarId: number | null;
  _raw: any;
}
