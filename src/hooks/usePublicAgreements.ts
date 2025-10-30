/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { agreementService } from "../services/agreementServices";

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

// Cache these functions since they're pure
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

// Helper function to get display name - PRIORITIZES TELEGRAM USERNAME
const getDisplayName = (party: any): string => {
  // First priority: Telegram username
  if (party.telegramUsername) {
    return `@${party.telegramUsername}`;
  }

  // Second priority: Telegram info from telegram object
  if (party.telegram?.username) {
    return `@${party.telegram.username}`;
  }

  // Fallback: Custom username (only if no Telegram username exists)
  if (party.username) {
    return `@${party.username}`;
  }

  // Final fallback
  return "Unknown User";
};

// Cache for agreement details to avoid refetching
const detailsCache = new Map<string, any>();

export const usePublicAgreements = () => {
  const [agreements, setAgreements] = useState<PublicAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicAgreements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 Fetching agreement summaries...");

      const allAgreements = await agreementService.getAllAgreements();
      console.log(`📋 Found ${allAgreements.length} total agreements`);

      if (!Array.isArray(allAgreements)) {
        console.warn(
          "❌ getAllAgreements did not return an array:",
          allAgreements,
        );
        setAgreements([]);
        return;
      }

      // Remove duplicates by ID using Set for better performance
      const uniqueAgreementsMap = new Map();
      allAgreements.forEach((agreement) => {
        if (agreement.id && !uniqueAgreementsMap.has(agreement.id.toString())) {
          uniqueAgreementsMap.set(agreement.id.toString(), agreement);
        }
      });

      const uniqueAgreements = Array.from(uniqueAgreementsMap.values());
      console.log(
        `🔄 After deduplication: ${uniqueAgreements.length} agreements`,
      );

      // Only fetch details for agreements that need them
      const agreementsNeedingDetails = uniqueAgreements.filter(
        (agreement) =>
          !agreement.description && !detailsCache.has(agreement.id.toString()),
      );

      if (agreementsNeedingDetails.length > 0) {
        console.log(
          `📝 Fetching details for ${agreementsNeedingDetails.length} agreements`,
        );
        await Promise.all(
          agreementsNeedingDetails.map(async (agreement) => {
            try {
              const details = await agreementService.getAgreementDetails(
                agreement.id,
              );
              detailsCache.set(agreement.id.toString(), details.data);
            } catch (error) {
              console.warn(
                `⚠️ Failed to fetch details for agreement ${agreement.id}:`,
                error,
              );
            }
          }),
        );
      }

      const transformedAgreements: PublicAgreement[] = uniqueAgreements.map(
        (agreement) => {
          const cachedDetails = detailsCache.get(agreement.id.toString());
          const firstParty = agreement.firstParty || {};
          const counterParty = agreement.counterParty || {};

          const description =
            agreement.description ||
            cachedDetails?.description ||
            "No description available";

          return {
            id: agreement.id.toString(),
            title: agreement.title || "Untitled Agreement",
            description,
            status: getStatusText(agreement.status),
            createdBy: getDisplayName(firstParty),
            counterparty: getDisplayName(counterParty),
            dateCreated: agreement.dateCreated
              ? new Date(agreement.dateCreated).toLocaleDateString()
              : "Unknown date",
            deadline: agreement.deadline
              ? new Date(agreement.deadline).toLocaleDateString()
              : "No deadline",
            amount: agreement.amount ? agreement.amount.toString() : undefined,
            token: agreement.tokenSymbol || undefined,
            type: getAgreementType(agreement.visibility),
            visibility: getAgreementType(agreement.visibility),
            createdByAvatarId: firstParty.avatarId || null,
            counterpartyAvatarId: counterParty.avatarId || null,
            createdByUserId: firstParty.id?.toString(),
            counterpartyUserId: counterParty.id?.toString(),
          };
        },
      );

      console.log(
        `✅ Successfully transformed ${transformedAgreements.length} agreements`,
      );
      setAgreements(transformedAgreements);
    } catch (err) {
      console.error("❌ Failed to load agreements:", err);
      setError("Failed to load agreements");
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicAgreements();
  }, [fetchPublicAgreements]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      agreements,
      loading,
      error,
      refetch: fetchPublicAgreements,
    }),
    [agreements, loading, error, fetchPublicAgreements],
  );
};
