// hooks/usePublicAgreements.ts
import { useQuery } from "@tanstack/react-query";
import { fetchAgreements } from "../services/agreementServices";
import { AgreementStatusEnum } from "../services/agreementServices";
import type { AgreementSummaryDTO } from "../services/agreementServices";

export interface PublicAgreement {
  id: string;
  title: string;
  description: string;
  status: string;
  createdBy: string;
  counterparty: string;
  dateCreated: string;
  deadline: string;
  amount?: string;
  token?: string;
  type: string;
  visibility: string;
  createdByAvatarId?: number | null;
  counterpartyAvatarId?: number | null;
  createdByUserId?: string;
  counterpartyUserId?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, string> = {
  1: "pending",
  2: "signed",
  3: "completed",
  4: "disputed",
  5: "cancelled",
  6: "expired",
  7: "pending_approval",
};

const getStatusText = (status: number): string =>
  STATUS_MAP[status] ?? "unknown";

const getAgreementType = (visibility: number): string =>
  visibility === 1 ? "Private" : "Public";

const getDisplayName = (party: AgreementSummaryDTO["firstParty"]): string => {
  if (party.telegramUsername) return `@${party.telegramUsername}`;
  if (party.wallet) return party.wallet;
  if (party.username) return party.username;
  return "Unknown User";
};

const transformAgreement = (a: AgreementSummaryDTO): PublicAgreement => ({
  id: a.id.toString(),
  title: a.title || "Untitled Agreement",
  description: a.description?.trim() || "No description available",
  status: getStatusText(a.status),
  createdBy: getDisplayName(a.firstParty),
  counterparty: getDisplayName(a.counterParty),
  dateCreated: a.dateCreated
    ? new Date(a.dateCreated).toLocaleDateString()
    : "Unknown date",
  deadline: a.deadline
    ? new Date(a.deadline).toLocaleDateString()
    : "No deadline",
  amount: a.amount?.toString(),
  token: a.tokenSymbol,
  type: getAgreementType(a.visibility),
  visibility: getAgreementType(a.visibility),
  createdByAvatarId: a.firstParty.avatarId ?? null,
  counterpartyAvatarId: a.counterParty.avatarId ?? null,
  createdByUserId: a.firstParty.id?.toString(),
  counterpartyUserId: a.counterParty.id?.toString(),
});

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function usePublicAgreements() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["public-agreements"],
    queryFn: async (): Promise<PublicAgreement[]> => {
      // Fetch active and completed agreements in parallel — two targeted
      // requests are far cheaper than fetching 1000 records and filtering.
      const [activeResponse, completedResponse] = await Promise.all([
        fetchAgreements({
          top: 100,
          skip: 0,
          sort: "desc",
          status: AgreementStatusEnum.ACTIVE,
        }),
        fetchAgreements({
          top: 100,
          skip: 0,
          sort: "desc",
          status: AgreementStatusEnum.COMPLETED,
        }),
      ]);

      const combined = [
        ...(activeResponse.results ?? []),
        ...(completedResponse.results ?? []),
      ].sort(
        (a, b) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      );

      return combined.map(transformAgreement);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  return {
    agreements: data ?? [],
    loading: isLoading,
    error: error ? "Failed to load agreements" : null,
    refetch,
  };
}
