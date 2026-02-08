/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/usePaginatedAgreements.ts
import { useState, useEffect, useCallback } from "react";
import { agreementService } from "../services/agreementServices";

export function usePaginatedAgreements(
  userId?: string,
  walletAddress?: string,
) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const AGREEMENTS_PER_PAGE = 10;

  // Helper function to extract roles from description
  const extractRolesFromDescription = (description: string) => {
    if (!description) return { serviceProvider: null, serviceRecipient: null };

    const serviceProviderMatch = description.match(
      /Service Provider:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
    );
    const serviceRecipientMatch = description.match(
      /Service Recipient:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
    );

    const alternativeProviderMatch = description.match(
      /Provider:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
    );
    const alternativeRecipientMatch = description.match(
      /Recipient:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
    );

    return {
      serviceProvider:
        serviceProviderMatch?.[1] || alternativeProviderMatch?.[1] || null,
      serviceRecipient:
        serviceRecipientMatch?.[1] || alternativeRecipientMatch?.[1] || null,
    };
  };

  // Filter agreements where user is involved
  const filterUserAgreements = useCallback(
    (allAgreements: any[]) => {
      if (!userId && !walletAddress) return [];

      return allAgreements.filter((agreement: any) => {
        // Check by user ID for reputational agreements
        const firstPartyId = agreement.firstParty?.id?.toString();
        const counterPartyId = agreement.counterParty?.id?.toString();

        if (userId && (firstPartyId === userId || counterPartyId === userId)) {
          return true;
        }

        // For escrow agreements, check by wallet address from description
        if (walletAddress && agreement.type === 2) {
          const roles = extractRolesFromDescription(
            agreement.description || "",
          );
          const provider = roles.serviceProvider?.toLowerCase();
          const recipient = roles.serviceRecipient?.toLowerCase();

          return (
            provider === walletAddress.toLowerCase() ||
            recipient === walletAddress.toLowerCase()
          );
        }

        return false;
      });
    },
    [userId, walletAddress],
  );

  // Fetch agreements with pagination
  const fetchAgreements = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!userId && !walletAddress) return;

      if (reset || pageNum === 1) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await agreementService.getAgreements({
          top: AGREEMENTS_PER_PAGE,
          skip: (pageNum - 1) * AGREEMENTS_PER_PAGE,
          sort: "desc",
        });

        const allAgreements = response.results || [];
        const userAgreements = filterUserAgreements(allAgreements);

        // Update agreements state
        if (reset || pageNum === 1) {
          setAgreements(userAgreements);
        } else {
          setAgreements((prev) => [...prev, ...userAgreements]);
        }

        // Check if we have more agreements to load
        setHasMore(userAgreements.length === AGREEMENTS_PER_PAGE);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching agreements:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load agreements",
        );
      } finally {
        setLoading(false);
      }
    },
    [userId, walletAddress, filterUserAgreements],
  );

  // Function to load more agreements
  const loadMore = useCallback(() => {
    if (!loading && hasMore && (userId || walletAddress)) {
      fetchAgreements(page + 1, false);
    }
  }, [loading, hasMore, page, userId, walletAddress, fetchAgreements]);

  // Function to refresh agreements
  const refetch = useCallback(() => {
    if (userId || walletAddress) {
      fetchAgreements(1, true);
    }
  }, [userId, walletAddress, fetchAgreements]);

  // Initial load
  useEffect(() => {
    if (userId || walletAddress) {
      fetchAgreements(1, true);
    } else {
      setAgreements([]);
      setHasMore(false);
    }
  }, [userId, walletAddress, fetchAgreements]);

  return {
    agreements,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
