/* eslint-disable @typescript-eslint/no-explicit-any */
// services/accountService.ts
//
// Pure async functions that talk to the accounts API.
// No React. No hooks. No caching logic.
// TanStack Query hooks (in hooks/useAccounts.ts) wrap these and provide
// caching, deduplication, background refetch, and loading states.

import { api } from "../lib/apiClient";
import { devLog } from "../utils/logger";

const API_BASE = import.meta.env.VITE_API_URL;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AccountSummaryDTO {
  id: number;
  username: string;
  bio: string | null;
  walletAddress: string | null;
  isVerified: boolean;
  avatarUrl?: string;
  avatarId?: number | null;
  role?: number;
  isAdmin?: boolean;
  telegram?: {
    username: string;
    id: string;
  };
  /** @deprecated Use telegram.username instead */
  telegramInfo?: string;
}

export interface AccountUpdateRequest {
  username?: string;
  bio?: string;
}

export interface AdminRoleUpdateResponse {
  success: boolean;
  message?: string;
  /**
   * Error codes:
   * 1  = MissingData
   * 7  = AccountNotFound
   * 10 = InternalServerError
   * 11 = SameAccount
   */
  errorCode?: number;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

// NEW: query params the updated GET /accounts endpoint accepts
export interface FetchAccountsParams {
  top?: number;
  skip?: number;
  sort?: "asc" | "desc";
  search?: string;
  isJudge?: boolean;
  isAdmin?: boolean;
}

// NEW: the paginated response shape the endpoint now returns
export interface AccountListResponse {
  totalAccounts: number;
  totalResults: number;
  results: AccountSummaryDTO[];
}

// ─── Response normalisation ────────────────────────────────────────────────────
// The /accounts endpoint returns inconsistent shapes depending on context.
// This transform centralises the defensive fallbacks in one place.

function normaliseAccount(raw: any): AccountSummaryDTO {
  return {
    id: raw.id ?? raw.userId ?? 0,
    username: raw.username ?? raw.name ?? "",
    bio: raw.bio ?? raw.description ?? null,
    walletAddress: raw.walletAddress ?? raw.wallet ?? null,
    isVerified: raw.isVerified ?? raw.verified ?? false,
    avatarUrl: raw.avatarUrl ?? raw.avatar ?? raw.profilePicture,
    avatarId: raw.avatarId ?? raw.avatarFileId ?? null,
    role: raw.role ?? raw.userRole ?? 0,
    isAdmin: raw.isAdmin ?? false,
    telegram: raw.telegram
      ? { username: raw.telegram.username ?? "", id: raw.telegram.id ?? "" }
      : raw.telegramInfo
        ? { username: raw.telegramInfo, id: "" }
        : undefined,
    // Keep for backward compatibility until all callers migrate
    telegramInfo: raw.telegramInfo ?? raw.telegram?.username,
  };
}

// ─── Query functions ───────────────────────────────────────────────────────────
// These are the functions TanStack Query calls inside queryFn.
// They throw on failure so TanStack Query can handle retries and error state.

export async function fetchMyAccount(): Promise<AccountSummaryDTO> {
  const response = await api.get("/accounts/mine");
  return normaliseAccount(response.data);
}

export async function fetchAccountById(
  accountId: string,
): Promise<AccountSummaryDTO> {
  const response = await api.get(`/accounts/id/${accountId}`);
  return normaliseAccount(response.data);
}

export async function fetchAccountByUsername(
  username: string,
): Promise<AccountSummaryDTO> {
  // Strip leading @ — the API expects a clean username
  const clean = username.startsWith("@") ? username.slice(1) : username;
  const response = await api.get(`/accounts/username/${clean}`);
  return normaliseAccount(response.data);
}

// services/accountService.ts

export async function fetchAllAccounts(
  params?: FetchAccountsParams,
): Promise<AccountListResponse> {
  const resolvedParams: FetchAccountsParams = {
    top: 10, // back to sensible default — backend does the filtering now
    skip: 0,
    ...params,
  };

  const response = await api.get("/accounts", { params: resolvedParams });

  const rawList = response.data.results ?? response.data.accounts ?? [];
  const normalized = rawList.map(normaliseAccount);

  return {
    totalAccounts: response.data.totalAccounts ?? 0,
    totalResults: response.data.totalResults ?? normalized.length,
    results: normalized,
  };
}

// ─── Wallet lookup ─────────────────────────────────────────────────────────────
// NOTE: There is no dedicated backend endpoint for wallet lookup.
// This fetches all accounts and filters client-side, which is not scalable.
// TODO: Ask backend to add GET /accounts/wallet/:address
// AFTER
export async function fetchAccountByWalletAddress(
  walletAddress: string,
): Promise<AccountSummaryDTO> {
  devLog(
    `[accountService] Wallet lookup — fetching all accounts to find: ${walletAddress}`,
  );
  const { results } = await fetchAllAccounts();
  const found = results.find(
    (u: AccountSummaryDTO) =>
      u.walletAddress?.toLowerCase() === walletAddress.toLowerCase(),
  );
  if (!found)
    throw new Error(`No account found for wallet address: ${walletAddress}`);
  return found;
}
// ─── Avatar ────────────────────────────────────────────────────────────────────

// Compresses an image file to JPEG before upload.
// Kicks in only when the file exceeds 500KB to avoid unnecessary processing.
async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.7,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not get canvas context"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              }),
            );
          },
          "image/jpeg",
          quality,
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadAvatar(file: File): Promise<void> {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Authentication required");

  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Only JPEG and PNG files are allowed");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("File size must be less than 2MB");
  }

  // Compress if over 500KB
  const fileToUpload =
    file.size > 500 * 1024 ? await compressImage(file) : file;

  const formData = new FormData();
  formData.append("avatar", fileToUpload);

  const response = await fetch(`${API_BASE}/accounts/avatar`, {
    method: "PATCH",
    headers: { Authorization: token },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 413) throw new Error("File too large. Max 2MB.");
    if (response.status === 415)
      throw new Error("Unsupported type. Use JPEG or PNG.");
    throw new Error(`Upload failed: ${response.status} — ${text}`);
  }
}

export async function fetchAvatar(
  userId: string,
  avatarId: number,
  signal?: AbortSignal,
): Promise<string> {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Authentication required");

  // Cache-bust so stale avatars don't persist after an upload
  const url = `${API_BASE}/accounts/${userId}/file/${avatarId}?t=${Date.now()}`;

  const response = await fetch(url, {
    headers: { Authorization: token },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch avatar: ${response.status}`);
  }

  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Invalid image format");

  return URL.createObjectURL(blob);
}

// ─── Mutation functions ────────────────────────────────────────────────────────
// Called inside useMutation({ mutationFn }) — never cached.

export async function updateAccount(data: AccountUpdateRequest): Promise<void> {
  await api.patch("/accounts", data);
}

export async function updateAccountsToJudge(
  accountsId: number[],
): Promise<AdminRoleUpdateResponse> {
  const response = await api.patch("/admin/accounts-role/judge", {
    accountsId,
  });
  return response.data;
}

export async function updateAccountsToCommunity(
  accountsId: number[],
): Promise<AdminRoleUpdateResponse> {
  const response = await api.patch("/admin/accounts-role/community", {
    accountsId,
  });
  return response.data;
}
