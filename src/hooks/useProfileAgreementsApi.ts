/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef } from "react";
import { agreementService } from "../services/agreementServices";

export function useProfileAgreementsApi(
  userId?: string,
  userWalletAddress?: string | null,
) {
  const [reputationalAgreements, setReputationalAgreements] = useState<any[]>(
    [],
  );
  const [escrowAgreements, setEscrowAgreements] = useState<any[]>([]);
  const [reputationalDisplay, setReputationalDisplay] = useState<any[]>([]);
  const [escrowDisplay, setEscrowDisplay] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReputational, setHasMoreReputational] = useState(true);
  const [hasMoreEscrow, setHasMoreEscrow] = useState(true);
  const [pageReputational, setPageReputational] = useState(1);
  const [pageEscrow, setPageEscrow] = useState(1);
  const [totalReputationalAgreements, setTotalReputationalAgreements] =
    useState(0);
  const [totalEscrowAgreements, setTotalEscrowAgreements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Use refs for stable references
  const allReputationalRef = useRef<any[]>([]);
  const allEscrowRef = useRef<any[]>([]);
  const hasFetchedRef = useRef(false);

  // Helper function to extract roles from description (moved inside useCallback)
  const extractRolesFromDescription = useCallback((description: string) => {
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
  }, []);

  // Transform functions wrapped in useCallback
  const transformEscrowAgreement = useCallback(
    (apiAgreement: any) => {
      const formatWalletAddress = (address: string): string => {
        if (!address) return "Unknown";
        if (address.startsWith("@")) return address;
        if (address.startsWith("0x") && address.length === 42) {
          return `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
        return address;
      };

      const serviceProvider = apiAgreement.payeeWalletAddress
        ? formatWalletAddress(apiAgreement.payeeWalletAddress)
        : (() => {
            const roles = extractRolesFromDescription(
              apiAgreement.description || "",
            );
            return roles.serviceProvider
              ? formatWalletAddress(roles.serviceProvider)
              : "Unknown";
          })();

      const serviceRecipient = apiAgreement.payerWalletAddress
        ? formatWalletAddress(apiAgreement.payerWalletAddress)
        : (() => {
            const roles = extractRolesFromDescription(
              apiAgreement.description || "",
            );
            return roles.serviceRecipient
              ? formatWalletAddress(roles.serviceRecipient)
              : "Unknown";
          })();

      return {
        id: `${apiAgreement.id}`,
        title: apiAgreement.title || `Escrow Deal #${apiAgreement.id}`,
        serviceProvider,
        serviceRecipient,
        rawServiceProvider: apiAgreement.payeeWalletAddress,
        rawServiceRecipient: apiAgreement.payerWalletAddress,
        token: apiAgreement.tokenSymbol || "ETH",
        amount: apiAgreement.amount ? parseFloat(apiAgreement.amount) : 0,
        status: apiAgreement.status,
        statusNumber: apiAgreement.status,
        deadline: apiAgreement.deadline
          ? new Date(apiAgreement.deadline).toISOString().split("T")[0]
          : "No deadline",
        description: apiAgreement.description || "",
        createdAt: apiAgreement.dateCreated || apiAgreement.createdAt,
        firstParty: apiAgreement.firstParty,
        counterParty: apiAgreement.counterParty,
        payeeWalletAddress: apiAgreement.payeeWalletAddress,
        payerWalletAddress: apiAgreement.payerWalletAddress,
        type: apiAgreement.type,
      };
    },
    [extractRolesFromDescription],
  ); // Add dependency

  const transformReputationalAgreement = useCallback((apiAgreement: any) => {
    return {
      id: apiAgreement.id,
      title: apiAgreement.title || `Agreement #${apiAgreement.id}`,
      status: apiAgreement.status,
      dateCreated: apiAgreement.dateCreated || apiAgreement.createdAt,
      firstParty: apiAgreement.firstParty,
      counterParty: apiAgreement.counterParty,
      description: apiAgreement.description || "",
      type: apiAgreement.type,
    };
  }, []);

  // Function to fetch ALL user agreements once
  const fetchAllUserAgreements = useCallback(async () => {
    if (!userId && !userWalletAddress) return { reputational: [], escrow: [] };

    try {
      // Fetch all agreements without pagination
      const response = await agreementService.getAgreements({
        top: 1000,
        skip: 0,
        sort: "desc",
      });

      const allAgreementsData: any[] = response.results || [];

      // Separate by type
      const allReputational = allAgreementsData.filter(
        (agreement: any) => agreement.type === 1,
      );
      const allEscrow = allAgreementsData.filter(
        (agreement: any) => agreement.type === 2,
      );

      // Filter reputational agreements by user involvement
      const userReputational = allReputational
        .filter((agreement: any) => {
          if (!userId) return false;
          const userStrId = userId.toString();
          const firstPartyId = agreement.firstParty?.id?.toString();
          const counterPartyId = agreement.counterParty?.id?.toString();

          return firstPartyId === userStrId || counterPartyId === userStrId;
        })
        .map(transformReputationalAgreement);

      // Filter escrow agreements by user involvement
      const userEscrow = allEscrow
        .filter((agreement: any) => {
          const userWallet = userWalletAddress?.toLowerCase();

          // Check by user ID
          if (userId) {
            const userStrId = userId.toString();
            const firstPartyId = agreement.firstParty?.id?.toString();
            const counterPartyId = agreement.counterParty?.id?.toString();

            if (firstPartyId === userStrId || counterPartyId === userStrId) {
              return true;
            }
          }

          // Check by wallet address
          if (userWallet) {
            const payeeWallet = agreement.payeeWalletAddress?.toLowerCase();
            const payerWallet = agreement.payerWalletAddress?.toLowerCase();

            if (
              (payeeWallet && payeeWallet === userWallet) ||
              (payerWallet && payerWallet === userWallet)
            ) {
              return true;
            }

            // Fallback to description extraction
            const roles = extractRolesFromDescription(
              agreement.description || "",
            );
            const provider = roles.serviceProvider?.toLowerCase();
            const recipient = roles.serviceRecipient?.toLowerCase();

            return provider === userWallet || recipient === userWallet;
          }

          return false;
        })
        .map(transformEscrowAgreement);

      return {
        reputational: userReputational,
        escrow: userEscrow,
      };
    } catch (err) {
      console.error("Error fetching user agreements:", err);
      return { reputational: [], escrow: [] };
    }
  }, [
    userId,
    userWalletAddress,
    transformReputationalAgreement,
    transformEscrowAgreement,
    extractRolesFromDescription,
  ]); // Add all dependencies

  // Initial load
  useEffect(() => {
    const fetchInitialAgreements = async () => {
      if ((!userId && !userWalletAddress) || hasFetchedRef.current) return;

      hasFetchedRef.current = true;
      setLoading(true);

      try {
        const { reputational, escrow } = await fetchAllUserAgreements();

        // Store in refs and state
        allReputationalRef.current = reputational;
        allEscrowRef.current = escrow;

        setReputationalAgreements(reputational);
        setEscrowAgreements(escrow);
        setTotalReputationalAgreements(reputational.length);
        setTotalEscrowAgreements(escrow.length);

        // Get first page for display
        const firstPageReputational = reputational.slice(0, ITEMS_PER_PAGE);
        const firstPageEscrow = escrow.slice(0, ITEMS_PER_PAGE);

        setReputationalDisplay(firstPageReputational);
        setEscrowDisplay(firstPageEscrow);
        setHasMoreReputational(reputational.length > ITEMS_PER_PAGE);
        setHasMoreEscrow(escrow.length > ITEMS_PER_PAGE);
      } catch (err) {
        console.error("Error fetching agreements:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load agreements",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialAgreements();

    // Reset when user changes
    return () => {
      hasFetchedRef.current = false;
    };
  }, [userId, userWalletAddress, fetchAllUserAgreements]);

  // Function to load more reputational agreements
  const loadMoreReputational = useCallback(() => {
    if (!loading && hasMoreReputational) {
      const nextPage = pageReputational + 1;
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const nextAgreements = allReputationalRef.current.slice(
        startIndex,
        endIndex,
      );

      setReputationalDisplay((prev) => [...prev, ...nextAgreements]);
      setHasMoreReputational(endIndex < allReputationalRef.current.length);
      setPageReputational(nextPage);
    }
  }, [loading, hasMoreReputational, pageReputational]);

  // Function to load more escrow agreements
  const loadMoreEscrow = useCallback(() => {
    if (!loading && hasMoreEscrow) {
      const nextPage = pageEscrow + 1;
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const nextAgreements = allEscrowRef.current.slice(startIndex, endIndex);

      setEscrowDisplay((prev) => [...prev, ...nextAgreements]);
      setHasMoreEscrow(endIndex < allEscrowRef.current.length);
      setPageEscrow(nextPage);
    }
  }, [loading, hasMoreEscrow, pageEscrow]);

  // Function to refresh agreements
  const refetch = useCallback(async () => {
    if (!userId && !userWalletAddress) return;

    setLoading(true);
    hasFetchedRef.current = false;

    try {
      const { reputational, escrow } = await fetchAllUserAgreements();

      allReputationalRef.current = reputational;
      allEscrowRef.current = escrow;

      setReputationalAgreements(reputational);
      setEscrowAgreements(escrow);
      setTotalReputationalAgreements(reputational.length);
      setTotalEscrowAgreements(escrow.length);

      // Reset to first page
      const firstPageReputational = reputational.slice(0, ITEMS_PER_PAGE);
      const firstPageEscrow = escrow.slice(0, ITEMS_PER_PAGE);

      setReputationalDisplay(firstPageReputational);
      setEscrowDisplay(firstPageEscrow);
      setHasMoreReputational(reputational.length > ITEMS_PER_PAGE);
      setHasMoreEscrow(escrow.length > ITEMS_PER_PAGE);
      setPageReputational(1);
      setPageEscrow(1);
    } catch (err) {
      console.error("Error refetching agreements:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refetch agreements",
      );
    } finally {
      setLoading(false);
    }
  }, [userId, userWalletAddress, fetchAllUserAgreements]);

  return {
    // All agreements (for stats)
    reputationalAgreements,
    escrowAgreements,

    // Display agreements (paginated)
    reputationalDisplay,
    escrowDisplay,

    // Loading states
    loading,
    error,

    // Pagination controls
    hasMoreReputational,
    hasMoreEscrow,
    loadMoreReputational,
    loadMoreEscrow,

    // Totals
    totalReputationalAgreements,
    totalEscrowAgreements,

    // Refresh function
    refetch,
  };
}
