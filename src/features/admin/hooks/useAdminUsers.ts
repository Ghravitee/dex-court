// src/features/admin/hooks/useAdminUsers.ts
import { useQuery } from "@tanstack/react-query";
import { fetchAdminUsers } from "../services/adminService";
import { AdminError } from "../AdminError";
import { STALE_TIME, GC_TIME } from "../constants";
import type { AdminUser } from "../types";

export const adminQueryKeys = {
  all: ["admin"] as const,
  users: () => [...adminQueryKeys.all, "users"] as const,
} as const;

export function useAdminUsers() {
  return useQuery<AdminUser[], AdminError>({
    queryKey: adminQueryKeys.users(),
    queryFn: fetchAdminUsers,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: (failureCount, error) => {
      if (error instanceof AdminError) {
        const msg = error.message;
        if (msg.includes("Authentication") || msg.includes("Admin access")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });
}
