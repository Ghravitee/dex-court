export interface UserProfileData {
  id: string;
  handle: string;
  username: string;
  bio: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  telegram?: {
    username: string;
    id: string;
  };
  walletAddress?: string;
  role: number;
  avatarId: number | null;
  wallet: string;
  trustScore: number;
  roles: {
    admin: boolean;
    judge: boolean;
    community: boolean;
    user: boolean;
  };
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
  joinedDate: string;
  avatarUrl?: string;
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

export interface DisputeStats {
  total: number;
  pending: number;
  inProgress: number;
  settled: number;
  dismissed: number;
}
