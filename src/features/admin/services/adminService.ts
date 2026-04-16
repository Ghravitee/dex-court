// src/features/admin/services/adminService.ts
//
// Pure async functions — no React, no hooks.
// Imports from the existing apiService so no endpoints change.

import { apiService } from "../../../services/apiService";
import { AdminError, resolveErrorMessage } from "../AdminError";
import { AdminErrorCode } from "../constants";
import type { AdminUser, AdminRoleUpdateResponse } from "../types";

// ─── helpers ────────────────────────────────────────────────────────────────

function mapAxiosError(error: unknown): never {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axiosErr = error as any;
  const apiCode = axiosErr?.response?.data?.errorCode as
    | AdminErrorCode
    | undefined;
  const status: number | undefined = axiosErr?.response?.status;

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
      default:
        throw new AdminError("An unknown admin error occurred.", apiCode);
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

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    // apiService.getAdminUsers() returns AccountSummaryDTO[] — cast is safe
    // because AdminUser is a structural subset we control.
    const users = await apiService.getAdminUsers();
    return users as unknown as AdminUser[];
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
    assertResponseOk(response);
    return response;
  } catch (error) {
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
    assertResponseOk(response);
    return response;
  } catch (error) {
    if (error instanceof AdminError) throw error;
    mapAxiosError(error);
  }
}
