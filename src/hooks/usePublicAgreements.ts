// hooks/usePublicAgreements.ts - UPDATED VERSION
import { useQuery } from "@tanstack/react-query";
import { agreementService } from "../services/agreementServices";
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

// Helper functions (same as before)
const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    1: "pending",
    2: "signed",
    3: "completed",
    4: "disputed",
    5: "cancelled",
    6: "expired",
    7: "pending_approval",
  };
  return statusMap[status] || "unknown";
};

const getAgreementType = (visibility: number): string => {
  return visibility === 1 ? "Private" : "Public";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDisplayName = (party: any): string => {
  if (party.telegramUsername) {
    return `@${party.telegramUsername}`;
  }
  if (party.telegram?.username) {
    return `@${party.telegram.username}`;
  }
  if (party.username) {
    return `@${party.username}`;
  }
  return "Unknown User";
};

// Transform API response to frontend format
const transformAgreement = (
  apiAgreement: AgreementSummaryDTO,
): PublicAgreement => {
  const firstParty = apiAgreement.firstParty || {};
  const counterParty = apiAgreement.counterParty || {};

  // Use the description from the API, fallback to default
  const description = apiAgreement.description?.trim()
    ? apiAgreement.description
    : "No description available";

  return {
    id: apiAgreement.id.toString(),
    title: apiAgreement.title || "Untitled Agreement",
    description,
    status: getStatusText(apiAgreement.status),
    createdBy: getDisplayName(firstParty),
    counterparty: getDisplayName(counterParty),
    dateCreated: apiAgreement.dateCreated
      ? new Date(apiAgreement.dateCreated).toLocaleDateString()
      : "Unknown date",
    deadline: apiAgreement.deadline
      ? new Date(apiAgreement.deadline).toLocaleDateString()
      : "No deadline",
    amount: apiAgreement.amount ? apiAgreement.amount.toString() : undefined,
    token: apiAgreement.tokenSymbol || undefined,
    type: getAgreementType(apiAgreement.visibility),
    visibility: getAgreementType(apiAgreement.visibility),
    createdByAvatarId: firstParty.avatarId || null,
    counterpartyAvatarId: counterParty.avatarId || null,
    createdByUserId: firstParty.id?.toString(),
    counterpartyUserId: counterParty.id?.toString(),
  };
};

// In your usePublicAgreements hook, replace the queryFn:
export const usePublicAgreements = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["public-agreements"],
    queryFn: async () => {
      console.log("🔍 Fetching signed agreements for homepage...");

      // Use the dedicated method for signed agreements
      const signedAgreements = await agreementService.getSignedAgreements();
      console.log(`✅ Found ${signedAgreements.length} signed agreements`);

      // Log sample agreements to debug descriptions
      if (signedAgreements.length > 0) {
        console.log("🔍 SAMPLE SIGNED AGREEMENTS:");
        signedAgreements.slice(0, 3).forEach((agreement, index) => {
          console.log(
            `  ${index + 1}. ID: ${agreement.id}, Title: "${agreement.title}", Desc: "${agreement.description}"`,
          );
        });
      }

      // Transform all signed agreements
      const transformedAgreements = signedAgreements.map(transformAgreement);

      console.log(
        `✅ Successfully transformed ${transformedAgreements.length} signed agreements`,
      );
      return transformedAgreements;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  return {
    agreements: data || [],
    loading: isLoading,
    error: error ? "Failed to load agreements" : null,
    refetch,
  };
};
