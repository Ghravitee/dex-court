// src/features/admin/constants.ts
import type { AdminRoleValue } from "./types";

export const AdminErrorCode = {
  MissingData: 1,
  AccountNotFound: 7,
  InternalServerError: 10,
  SameAccount: 11,
  MissingWallet: 12, // ← add
  InvalidEnum: 13, // ← add
  InvalidData: 14, // ← add
} as const;

export type AdminErrorCode =
  (typeof AdminErrorCode)[keyof typeof AdminErrorCode];

export const ROLE_CONFIG: Record<
  AdminRoleValue,
  { label: string; color: string; bg: string; ring: string }
> = {
  3: {
    label: "Admin",
    color: "text-yellow-300",
    bg: "bg-yellow-500/20",
    ring: "ring-yellow-400/40",
  },
  2: {
    label: "Judge",
    color: "text-blue-300",
    bg: "bg-blue-500/20",
    ring: "ring-blue-400/40",
  },
  1: {
    label: "Community",
    color: "text-emerald-300",
    bg: "bg-emerald-500/20",
    ring: "ring-emerald-400/40",
  },
  0: {
    label: "Basic",
    color: "text-gray-400",
    bg: "bg-gray-500/20",
    ring: "ring-gray-400/30",
  },
};

export const STALE_TIME = 5 * 60 * 1000; // 5 min
export const GC_TIME = 10 * 60 * 1000; // 10 min
