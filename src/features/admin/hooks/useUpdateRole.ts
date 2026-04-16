// src/features/admin/hooks/useUpdateRole.ts
//
// Single hook that handles both role mutations to eliminate duplication.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { promoteToJudge, promoteToCommunity } from "../services/adminService";
import { adminQueryKeys } from "./useAdminUsers";
import type { RoleTarget, AdminRoleUpdateResponse } from "../types";

export function useUpdateRole(target: RoleTarget) {
  const queryClient = useQueryClient();

  const mutationFn =
    target === "judge" ? promoteToJudge : promoteToCommunity;

  return useMutation<AdminRoleUpdateResponse, Error, number[]>({
    mutationFn,
    onSuccess: () => {
      // Invalidate admin user list and any cached account data
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
