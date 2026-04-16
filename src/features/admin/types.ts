// src/features/admin/types.ts

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
