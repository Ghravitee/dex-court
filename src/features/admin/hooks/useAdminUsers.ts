// src/features/admin/hooks/useAdminUsers.ts
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchAdminUsers } from "../services/adminService";
import { AdminError } from "../AdminError";
import { STALE_TIME, GC_TIME } from "../constants";

const PAGE_SIZE = 10;

export const adminQueryKeys = {
  all: ["admin"] as const,
  users: () => [...adminQueryKeys.all, "users"] as const,
  counts: () => [...adminQueryKeys.all, "counts"] as const,
} as const;

export function useAdminCounts() {
  return useQuery({
    queryKey: adminQueryKeys.counts(),
    queryFn: () => fetchAdminUsers({ skip: 0, top: 1, isAdmin: true }),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useAdminUsers() {
  const query = useInfiniteQuery({
    queryKey: adminQueryKeys.users(),
    queryFn: ({ pageParam = 0 }) =>
      fetchAdminUsers({ skip: pageParam, top: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.flatMap((p) => p.users).length;
      return fetched < lastPage.totalAccounts ? fetched : undefined;
    },
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

  const users = query.data?.pages.flatMap((p) => p.users) ?? [];
  const totalAccounts = query.data?.pages[0]?.totalAccounts ?? 0;

  return { ...query, data: users, totalAccounts };
}
