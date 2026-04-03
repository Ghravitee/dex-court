export interface UserData {
  handle: string;
  wallet: string;
  score: number;
  roles: {
    admin: boolean;
    judge: boolean;
    community: boolean;
    user: boolean;
  };
  isVerified: boolean;
  stats: {
    deals: number;
    agreements: number;
    disputes: number;
    revenue: {
      "7d": number;
      "30d": number;
      "90d": number;
    };
  };
}

export interface AgreementStats {
  total: number;
  active: number;
  completed: number;
  disputed: number;
}

export interface EscrowStats extends AgreementStats {
  pending: number;
  pending_approval: number;
  expired: number;
  cancelled: number;
}

export interface DisputesStats {
  total: number;
  pending: number;
  inProgress: number;
  settled: number;
  dismissed: number;
  pendingPayment: number;
}

export type EscrowStatus =
  | "pending"
  | "signed"
  | "completed"
  | "cancelled"
  | "expired"
  | "disputed"
  | "pending_approval"
  | "pending_delivery";

export interface ToasterState {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
}
