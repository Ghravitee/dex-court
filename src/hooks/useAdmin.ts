/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/apiService";
import type {
  AdminRoleUpdateResponse,
  AccountSummaryDTO,
} from "../services/apiService";
import { useAuth } from "./useAuth";

// Query keys
export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  user: (id: number) => [...adminKeys.all, "user", id] as const,
};

// Use plain object instead of enum
export const AdminErrorCode = {
  MissingData: 1,
  AccountNotFound: 7,
  SameAccount: 11,
  InternalServerError: 10,
} as const;

export type AdminErrorCode =
  (typeof AdminErrorCode)[keyof typeof AdminErrorCode];

export class AdminError extends Error {
  code?: AdminErrorCode;
  details?: any;

  constructor(message: string, code?: AdminErrorCode, details?: any) {
    super(message);
    this.name = "AdminError";
    this.code = code;
    this.details = details;
  }
}

// Hook for getting all users (admin only)
export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async (): Promise<AccountSummaryDTO[]> => {
      try {
        console.log("🔐 [Hook] Fetching admin users...");
        const users = await apiService.getAdminUsers();
        console.log(`🔐 [Hook] Successfully fetched ${users.length} users`);
        return users;
      } catch (error: unknown) {
        console.error("🔐 [Hook] Error in useAdminUsers:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch users";

        // Handle specific HTTP errors
        if (errorMessage.includes("401")) {
          throw new AdminError("Authentication required", undefined, error);
        }

        if (errorMessage.includes("403")) {
          throw new AdminError("Admin access required", undefined, error);
        }

        throw new AdminError(errorMessage, undefined, error);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry on authentication/authorization errors
      if (error instanceof AdminError) {
        if (
          error.message.includes("Authentication") ||
          error.message.includes("Admin access")
        ) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
};

// Hook for updating users to judge role
// hooks/useAdminApi.ts - Update the mutation error handling
export const useUpdateToJudge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      accountsId: number[],
    ): Promise<AdminRoleUpdateResponse> => {
      if (!accountsId || accountsId.length === 0) {
        throw new AdminError(
          "Please select at least one user to update",
          AdminErrorCode.MissingData,
        );
      }

      try {
        const response = await apiService.updateAccountsToJudge(accountsId);

        // Check if the response indicates an error
        if (response.errorCode) {
          switch (response.errorCode) {
            case AdminErrorCode.MissingData:
              throw new AdminError(
                "Please select at least one user to update",
                AdminErrorCode.MissingData,
              );
            case AdminErrorCode.AccountNotFound:
              throw new AdminError(
                "One or more selected users were not found",
                AdminErrorCode.AccountNotFound,
              );
            case AdminErrorCode.SameAccount:
              throw new AdminError(
                "You cannot update your own account role",
                AdminErrorCode.SameAccount,
              );
            case AdminErrorCode.InternalServerError:
              throw new AdminError(
                "An unexpected error occurred. Please try again",
                AdminErrorCode.InternalServerError,
              );
            default:
              throw new AdminError("An unknown error occurred");
          }
        }

        return response;
      } catch (error: any) {
        // Axios error with response
        const apiErrorCode = error?.response?.data?.errorCode;

        if (apiErrorCode) {
          switch (apiErrorCode) {
            case AdminErrorCode.MissingData:
              throw new AdminError(
                "Please select at least one user.",
                apiErrorCode,
              );

            case AdminErrorCode.AccountNotFound:
              throw new AdminError(
                "One or more selected accounts could not be found.",
                apiErrorCode,
              );

            case AdminErrorCode.SameAccount:
              throw new AdminError(
                "You cannot change your own role.",
                apiErrorCode,
              );

            case AdminErrorCode.InternalServerError:
              throw new AdminError(
                "Server validation failed. Please try again.",
                apiErrorCode,
              );

            default:
              throw new AdminError(
                "An unknown admin error occurred.",
                apiErrorCode,
              );
          }
        }

        // Fallback generic errors
        if (error?.response?.status === 401) {
          throw new AdminError("You must be logged in.");
        }

        if (error?.response?.status === 403) {
          throw new AdminError(
            "You are not authorized to perform this action.",
          );
        }

        throw new AdminError("Failed to update roles. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

// Apply the same fix to useUpdateToCommunity
export const useUpdateToCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      accountsId: number[],
    ): Promise<AdminRoleUpdateResponse> => {
      if (!accountsId || accountsId.length === 0) {
        throw new AdminError(
          "Please select at least one user to update",
          AdminErrorCode.MissingData,
        );
      }

      try {
        const response = await apiService.updateAccountsToCommunity(accountsId);

        // Check if the response indicates an error
        if (response.errorCode) {
          switch (response.errorCode) {
            case AdminErrorCode.MissingData:
              throw new AdminError(
                "Please select at least one user to update",
                AdminErrorCode.MissingData,
              );
            case AdminErrorCode.AccountNotFound:
              throw new AdminError(
                "One or more selected users were not found",
                AdminErrorCode.AccountNotFound,
              );
            case AdminErrorCode.SameAccount:
              throw new AdminError(
                "You cannot update your own account role",
                AdminErrorCode.SameAccount,
              );
            case AdminErrorCode.InternalServerError:
              throw new AdminError(
                "An unexpected error occurred. Please try again",
                AdminErrorCode.InternalServerError,
              );
            default:
              throw new AdminError("An unknown error occurred");
          }
        }

        return response;
      } catch (error: any) {
        // Axios error with response
        const apiErrorCode = error?.response?.data?.errorCode;

        if (apiErrorCode) {
          switch (apiErrorCode) {
            case AdminErrorCode.MissingData:
              throw new AdminError(
                "Please select at least one user.",
                apiErrorCode,
              );

            case AdminErrorCode.AccountNotFound:
              throw new AdminError(
                "One or more selected accounts could not be found.",
                apiErrorCode,
              );

            case AdminErrorCode.SameAccount:
              throw new AdminError(
                "You cannot change your own role.",
                apiErrorCode,
              );

            case AdminErrorCode.InternalServerError:
              throw new AdminError(
                "Server validation failed. Please try again.",
                apiErrorCode,
              );

            default:
              throw new AdminError(
                "An unknown admin error occurred.",
                apiErrorCode,
              );
          }
        }

        // Fallback generic errors
        if (error?.response?.status === 401) {
          throw new AdminError("You must be logged in.");
        }

        if (error?.response?.status === 403) {
          throw new AdminError(
            "You are not authorized to perform this action.",
          );
        }

        throw new AdminError("Failed to update roles. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};
// Utility hook to check if current user is admin
export const useAdminAccess = () => {
  const { user, isLoading } = useAuth();

  return {
    isAdmin: user?.isAdmin === true,
    user,
    isLoading,
  };
};
