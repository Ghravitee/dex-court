// src/types/auth.types.ts
export interface User {
  id: string;
  username: string;
  bio: string | null;
  isVerified: boolean;
  telegram?: {
    username: string;
    id: string;
  };
  telegramUsername?: string;
  walletAddress: string | null;
  role: number;
  avatarId: number | null;
  handle?: string;
  wallet?: string;
  trustScore?: number;
  roles?: {
    judge: boolean;
    community: boolean;
    user: boolean;
  };
  stats?: {
    deals: number;
    agreements: number;
    disputes: number;
    revenue: {
      "7d": number;
      "30d": number;
      "90d": number;
    };
  };
  joinedDate?: string;
  verified?: boolean;
  avatarUrl?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  linkWallet: (walletAddress: string, signature: string) => Promise<void>;
  linkTelegram: (otp: string) => Promise<void>;
  generateLinkingNonce: (walletAddress: string) => Promise<string>;
  loginWithWallet: (walletAddress: string, signature: string) => Promise<void>;
  generateLoginNonce: (walletAddress: string) => Promise<string>;
}
