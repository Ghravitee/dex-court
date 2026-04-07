// hooks/useAgreements.ts
//
// All TanStack Query hooks for agreement data.
// Import from here, never directly from agreementService.
//
// Query key structure:
//   ["agreements"]                          — root invalidation
//   ["agreements", "list", params]          — paginated list
//   ["agreements", "mine"]                  — authenticated user's agreements
//   ["agreements", "detail", id]            — single agreement
//   ["agreements", "user", userId]          — agreements for a specific user
//   ["agreements", "count"]                 — total count

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  fetchAgreements,
  fetchMyAgreements,
  fetchAgreementDetails,
  fetchUserAgreements,
  fetchAgreementsCount,
  createAgreement,
  signAgreement,
  editAgreement,
  deleteAgreement,
  uploadAgreementFiles,
  downloadAgreementFile,
  deleteAgreementFile,
  markAsDelivered,
  confirmDelivery,
  rejectDelivery,
  requestCancellation,
  respondToCancellation,
  type AgreementListParams,
  type AgreementListDTO,
  type AgreementDetailsDTO,
  type AgreementsRequest,
  type AgreementsEditRequest,
  type AgreementDeliveryRejectedRequest,
} from "../services/agreementServices";

// ─── Query keys ────────────────────────────────────────────────────────────────

export const agreementKeys = {
  all: ["agreements"] as const,
  lists: () => [...agreementKeys.all, "list"] as const,
  list: (params: AgreementListParams) =>
    [...agreementKeys.lists(), params] as const,
  mine: () => [...agreementKeys.all, "mine"] as const,
  details: () => [...agreementKeys.all, "detail"] as const,
  detail: (id: number) => [...agreementKeys.details(), id] as const,
  forUser: (userId: string) => [...agreementKeys.all, "user", userId] as const,
  count: () => [...agreementKeys.all, "count"] as const,
} as const;

// ─── Shared stale times ────────────────────────────────────────────────────────

const STALE = {
  list: 2 * 60 * 1000,
  mine: 1 * 60 * 1000,
  detail: 5 * 60 * 1000,
  count: 5 * 60 * 1000,
} as const;

// ─── Query hooks ───────────────────────────────────────────────────────────────

/** Paginated public agreement list with optional filters. */
export function useAgreements(
  params?: AgreementListParams,
  options?: Partial<UseQueryOptions<AgreementListDTO>>,
) {
  return useQuery({
    queryKey: agreementKeys.list(params ?? {}),
    queryFn: () => fetchAgreements(params),
    staleTime: STALE.list,
    ...options,
  });
}

/** Authenticated user's own agreements via /agreement/mine. */
export function useMyAgreements() {
  return useQuery({
    queryKey: agreementKeys.mine(),
    queryFn: fetchMyAgreements,
    staleTime: STALE.mine,
  });
}

/** Full details for a single agreement. */
export function useAgreementDetails(
  agreementId: number | null | undefined,
  options?: Partial<UseQueryOptions<AgreementDetailsDTO>>,
) {
  return useQuery({
    queryKey: agreementKeys.detail(agreementId ?? 0),
    queryFn: () => fetchAgreementDetails(agreementId!),
    enabled: !!agreementId,
    staleTime: STALE.detail,
    ...options,
  });
}

/**
 * Agreements for a specific user (client-side filtered).
 * See fetchUserAgreements for the known backend limitation.
 */
export function useUserAgreements(
  userId: string | null | undefined,
  params?: Pick<AgreementListParams, "status" | "search" | "sort">,
) {
  return useQuery({
    queryKey: agreementKeys.forUser(userId ?? ""),
    queryFn: () => fetchUserAgreements(userId!, params),
    enabled: !!userId,
    staleTime: STALE.list,
  });
}

/** Total agreement count without fetching all records. */
export function useAgreementsCount() {
  return useQuery({
    queryKey: agreementKeys.count(),
    queryFn: fetchAgreementsCount,
    staleTime: STALE.count,
  });
}

/**
 * Replaces the old useAgreementsApi hook.
 *
 * Returns the authenticated user's agreements plus their full details,
 * using two coordinated queries instead of manual useState/useEffect.
 *
 * Individual agreement details are fetched on-demand via useAgreementDetails
 * rather than all at once on mount — use that hook in the component that
 * needs details for a specific agreement.
 *
 * For the profile page which needs all details upfront, use this hook
 * which pre-fetches them in a single coordinated query.
 */
export function useMyAgreementsWithDetails() {
  const queryClient = useQueryClient();

  const { data: mineData, isLoading, error } = useMyAgreements();
  const agreements = mineData?.results ?? [];

  // Pre-populate the detail cache for each agreement we already have summaries for.
  // This avoids N separate loading states — details are fetched in parallel
  // and stored individually in the cache so useAgreementDetails is instant.
  const detailQueries = agreements.map((a) => ({
    queryKey: agreementKeys.detail(a.id),
    queryFn: () => fetchAgreementDetails(a.id),
    staleTime: STALE.detail,
  }));

  // Warm the cache — these run in parallel but we don't block the UI on them
  if (agreements.length > 0) {
    detailQueries.forEach((q) => {
      if (!queryClient.getQueryData(q.queryKey)) {
        queryClient.prefetchQuery(q);
      }
    });
  }

  return {
    agreements,
    isLoading,
    error,
  };
}

// ─── Mutation hooks ────────────────────────────────────────────────────────────

export function useCreateAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, files }: { data: AgreementsRequest; files: File[] }) =>
      createAgreement(data, files),
    onSuccess: () => {
      // Invalidate all lists — new agreement appears in public list and mine
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mine() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.count() });
    },
  });
}

export function useSignAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      accepted,
    }: {
      agreementId: number;
      accepted: boolean;
    }) => signAgreement(agreementId, accepted),
    onSuccess: (_, { agreementId }) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mine() });
    },
  });
}

export function useEditAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      data,
    }: {
      agreementId: number;
      data: AgreementsEditRequest;
    }) => editAgreement(agreementId, data),
    onSuccess: (_, { agreementId }) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
    },
  });
}

export function useDeleteAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: number) => deleteAgreement(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.removeQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mine() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.count() });
    },
  });
}

export function useUploadAgreementFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      files,
    }: {
      agreementId: number;
      files: File[];
    }) => uploadAgreementFiles(agreementId, files),
    onSuccess: (_, { agreementId }) => {
      // Files are embedded in the detail response
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
    },
  });
}

export function useDownloadAgreementFile() {
  return useMutation({
    mutationFn: ({
      agreementId,
      fileId,
    }: {
      agreementId: number;
      fileId: number;
    }) => downloadAgreementFile(agreementId, fileId),
  });
}

export function useDeleteAgreementFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      fileId,
    }: {
      agreementId: number;
      fileId: number;
    }) => deleteAgreementFile(agreementId, fileId),
    onSuccess: (_, { agreementId }) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
    },
  });
}

// ─── Delivery action hooks ─────────────────────────────────────────────────────

export function useMarkAsDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: number) => markAsDelivered(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: number) => confirmDelivery(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
    },
  });
}

export function useRejectDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      data,
    }: {
      agreementId: number;
      data: AgreementDeliveryRejectedRequest | FormData;
    }) => rejectDelivery(agreementId, data),
    onSuccess: (_, { agreementId }) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
    },
  });
}

// ─── Cancellation hooks ────────────────────────────────────────────────────────

export function useRequestCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: number) => requestCancellation(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
    },
  });
}

export function useRespondToCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      accepted,
    }: {
      agreementId: number;
      accepted: boolean;
    }) => respondToCancellation(agreementId, accepted),
    onSuccess: (_, { agreementId }) => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
    },
  });
}

// ─── Utility ───────────────────────────────────────────────────────────────────

/** Returns a function to manually invalidate all agreement queries. */
export function useInvalidateAgreements() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: agreementKeys.all });
}
