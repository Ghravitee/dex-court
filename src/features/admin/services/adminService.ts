/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/admin/services/adminService.ts
//
// Pure async functions — no React, no hooks.
// Imports from the existing apiService so no endpoints change.

import { apiService } from "../../../services/apiService";
import { AdminError, resolveErrorMessage } from "../AdminError";
import { AdminErrorCode } from "../constants";
import type {
  AdminUser,
  AdminRoleUpdateResponse,
  AdminRoleValue,
} from "../types";

// ─── helpers ────────────────────────────────────────────────────────────────

function mapAxiosError(error: unknown): never {
  const axiosErr = error as any;

  // 🔴 LOG 1 — what does mapAxiosError actually receive?
  console.log("🔴 [mapAxiosError] received:", {
    message: axiosErr?.message,
    status: axiosErr?.status,
    responseStatus: axiosErr?.response?.status,
    data: axiosErr?.data,
    responseData: axiosErr?.response?.data,
    errorCodeFromData: axiosErr?.data?.errorCode,
    errorCodeFromResponseData: axiosErr?.response?.data?.errorCode,
  });

  const apiCode = (axiosErr?.response?.data?.errorCode ??
    axiosErr?.response?.data?.error ?? // ← ADD THIS
    axiosErr?.data?.errorCode ??
    axiosErr?.data?.error) as AdminErrorCode | undefined; // ← AND THIS
  const status: number | undefined =
    axiosErr?.response?.status ?? axiosErr?.status;

  // 🔴 LOG 2 — what did we resolve?
  console.log(
    "🔴 [mapAxiosError] resolved apiCode:",
    apiCode,
    "status:",
    status,
  );

  if (apiCode !== undefined) {
    switch (apiCode) {
      case AdminErrorCode.MissingData:
        throw new AdminError("Please select at least one user.", apiCode);
      case AdminErrorCode.AccountNotFound:
        throw new AdminError(
          "One or more selected accounts could not be found.",
          apiCode,
        );
      case AdminErrorCode.SameAccount:
        throw new AdminError("You cannot change your own role.", apiCode);
      case AdminErrorCode.InternalServerError:
        throw new AdminError(
          "Server validation failed. Please try again.",
          apiCode,
        );
      case AdminErrorCode.MissingWallet:
        throw new AdminError(
          "One or more selected users don't have a wallet address connected.",
          apiCode,
        );
      default:
        throw new AdminError(
          `An unknown admin error occurred. (code: ${apiCode})`,
          apiCode,
        );
    }
  }

  if (status === 401) throw new AdminError("You must be logged in.");
  if (status === 403)
    throw new AdminError("You are not authorized to perform this action.");

  throw new AdminError(resolveErrorMessage(error));
}

function assertResponseOk(response: AdminRoleUpdateResponse): void {
  if (!response.errorCode) return;

  switch (response.errorCode) {
    case AdminErrorCode.MissingData:
      throw new AdminError(
        "Please select at least one user to update.",
        AdminErrorCode.MissingData,
      );
    case AdminErrorCode.AccountNotFound:
      throw new AdminError(
        "One or more selected users were not found.",
        AdminErrorCode.AccountNotFound,
      );
    case AdminErrorCode.SameAccount:
      throw new AdminError(
        "You cannot update your own account role.",
        AdminErrorCode.SameAccount,
      );
    case AdminErrorCode.InternalServerError:
      throw new AdminError(
        "An unexpected error occurred. Please try again.",
        AdminErrorCode.InternalServerError,
      );
    default:
      throw new AdminError("An unknown error occurred.");
  }
}

// ─── public API ─────────────────────────────────────────────────────────────

export async function fetchAdminUsers(params?: {
  skip?: number;
  top?: number;
  isAdmin?: boolean;
}): Promise<{ users: AdminUser[]; totalAccounts: number }> {
  try {
    const result = await apiService.getAdminUsers({
      skip: params?.skip ?? 0,
      top: params?.top ?? 10,
      isAdmin: params?.isAdmin,
    });
    return {
      totalAccounts: result.totalAccounts,
      users: result.users.map((u) => ({
        id: u.id,
        role: (u.role ?? 0) as AdminRoleValue,
        isVerified: u.isVerified ?? false,
        isAdmin: u.isAdmin ?? false,
        username: u.username,
        bio: u.bio ?? undefined,
        walletAddress: u.walletAddress ?? undefined,
        avatarId: u.avatarId ?? null,
        telegram: u.telegram
          ? { username: u.telegram.username, id: u.telegram.id }
          : undefined,
      })),
    };
  } catch (error) {
    const msg = resolveErrorMessage(error);
    if (msg.includes("401"))
      throw new AdminError("Authentication required.", undefined, error);
    if (msg.includes("403"))
      throw new AdminError("Admin access required.", undefined, error);
    throw new AdminError(msg, undefined, error);
  }
}

export async function promoteToJudge(
  accountIds: number[],
): Promise<AdminRoleUpdateResponse> {
  if (accountIds.length === 0)
    throw new AdminError(
      "Please select at least one user to update.",
      AdminErrorCode.MissingData,
    );

  try {
    const response = await apiService.updateAccountsToJudge(accountIds);
    // 🔴 LOG 3 — did the request succeed (2xx) with an errorCode in the body?
    console.log("🔴 [promoteToJudge] response from API:", response);
    assertResponseOk(response);
    return response;
  } catch (error) {
    // 🔴 LOG 4 — what landed in this catch?
    console.log("🔴 [promoteToJudge] catch:", {
      isAdminError: error instanceof AdminError,
      message: (error as any)?.message,
      data: (error as any)?.data,
      response: (error as any)?.response,
    });
    if (error instanceof AdminError) throw error;
    mapAxiosError(error);
  }
}

export async function promoteToCommunity(
  accountIds: number[],
): Promise<AdminRoleUpdateResponse> {
  if (accountIds.length === 0)
    throw new AdminError(
      "Please select at least one user to update.",
      AdminErrorCode.MissingData,
    );

  try {
    const response = await apiService.updateAccountsToCommunity(accountIds);
    // 🔴 LOG 5 — did the request succeed (2xx) with an errorCode in the body?
    console.log("🔴 [promoteToCommunity] response from API:", response);
    assertResponseOk(response);
    return response;
  } catch (error) {
    // 🔴 LOG 6 — what landed in this catch?
    console.log("🔴 [promoteToCommunity] catch:", {
      isAdminError: error instanceof AdminError,
      message: (error as any)?.message,
      data: (error as any)?.data,
      response: (error as any)?.response,
    });
    if (error instanceof AdminError) throw error;
    mapAxiosError(error);
  }
}
