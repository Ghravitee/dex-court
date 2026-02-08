/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/usePaginatedEscrowAgreements.ts
import { useState, useEffect, useCallback } from "react";
import { agreementService } from "../services/agreementServices";

export function usePaginatedEscrowAgreements(
  userId?: string,
  walletAddress?: string,
) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const AGREEMENTS_PER_PAGE = 10;

  // Filter escrow agreements where user is involved
  const filterUserEscrowAgreements = useCallback(
    (allAgreements: any[]) => {
      if (!userId && !walletAddress) return [];

      return allAgreements.filter((agreement: any) => {
        // Only escrow agreements (type === 2)
        if (agreement.type !== 2) return false;

        // Check by user ID (firstParty or counterParty)
        const firstPartyId = agreement.firstParty?.id?.toString();
        const counterPartyId = agreement.counterParty?.id?.toString();

        if (userId && (firstPartyId === userId || counterPartyId === userId)) {
          return true;
        }

        // Check by wallet address (payeeWalletAddress or payerWalletAddress)
        if (walletAddress) {
          const payeeWallet = agreement.payeeWalletAddress?.toLowerCase();
          const payerWallet = agreement.payerWalletAddress?.toLowerCase();
          const userWallet = walletAddress.toLowerCase();

          return payeeWallet === userWallet || payerWallet === userWallet;
        }

        return false;
      });
    },
    [userId, walletAddress],
  );

  // Fetch escrow agreements with pagination
  const fetchEscrowAgreements = useCallback(
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
        const userAgreements = filterUserEscrowAgreements(allAgreements);

        // Transform escrow agreements for display
        const transformedAgreements = userAgreements.map((agreement: any) => {
          const formatWalletAddress = (address: string | null): string => {
            if (!address) return "Unknown";
            if (address.startsWith("@")) return address;
            if (address.startsWith("0x") && address.length === 42) {
              return `${address.slice(0, 6)}...${address.slice(-4)}`;
            }
            return address;
          };

          // Determine roles based on wallet addresses
          let serviceProvider = "Unknown";
          let serviceRecipient = "Unknown";
          let userRole = "Unknown";

          if (agreement.payeeWalletAddress && agreement.payerWalletAddress) {
            // If both wallet addresses exist, use them
            serviceProvider = formatWalletAddress(agreement.payeeWalletAddress);
            serviceRecipient = formatWalletAddress(
              agreement.payerWalletAddress,
            );

            // Determine user's role
            if (walletAddress) {
              const userWallet = walletAddress.toLowerCase();
              if (agreement.payeeWalletAddress.toLowerCase() === userWallet) {
                userRole = "Service Provider";
              } else if (
                agreement.payerWalletAddress.toLowerCase() === userWallet
              ) {
                userRole = "Service Recipient";
              }
            }
          } else if (agreement.firstParty && agreement.counterParty) {
            // Fallback to firstParty/counterParty if wallet addresses don't exist
            serviceProvider = agreement.firstParty.telegramUsername
              ? `@${agreement.firstParty.telegramUsername}`
              : formatWalletAddress(agreement.firstParty.wallet);

            serviceRecipient = agreement.counterParty.telegramUsername
              ? `@${agreement.counterParty.telegramUsername}`
              : formatWalletAddress(agreement.counterParty.wallet);

            // Determine user's role by ID
            if (userId) {
              if (agreement.firstParty.id?.toString() === userId) {
                userRole = "First Party";
              } else if (agreement.counterParty.id?.toString() === userId) {
                userRole = "Counter Party";
              }
            }
          }

          return {
            ...agreement,
            id: `${agreement.id}`,
            title: agreement.title || `Escrow Deal #${agreement.id}`,
            serviceProvider,
            serviceRecipient,
            userRole, // Store the user's role for easy access
            token: agreement.tokenSymbol || "ETH",
            amount: agreement.amount ? parseFloat(agreement.amount) : 0,
            statusNumber: agreement.status,
            createdAt: agreement.dateCreated || agreement.createdAt,
            deadline: agreement.deadline,
            payeeWalletAddress: agreement.payeeWalletAddress,
            payerWalletAddress: agreement.payerWalletAddress,
            contractAgreementId: agreement.contractAgreementId,
            chainId: agreement.chainId,
          };
        });

        // Update agreements state
        if (reset || pageNum === 1) {
          setAgreements(transformedAgreements);
        } else {
          setAgreements((prev) => [...prev, ...transformedAgreements]);
        }

        // Check if we have more agreements to load
        setHasMore(userAgreements.length === AGREEMENTS_PER_PAGE);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching escrow agreements:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load escrow deals",
        );
      } finally {
        setLoading(false);
      }
    },
    [userId, walletAddress, filterUserEscrowAgreements],
  );

  // Function to load more escrow agreements
  const loadMore = useCallback(() => {
    if (!loading && hasMore && (userId || walletAddress)) {
      fetchEscrowAgreements(page + 1, false);
    }
  }, [loading, hasMore, page, userId, walletAddress, fetchEscrowAgreements]);

  // Function to refresh escrow agreements
  const refetch = useCallback(() => {
    if (userId || walletAddress) {
      fetchEscrowAgreements(1, true);
    }
  }, [userId, walletAddress, fetchEscrowAgreements]);

  // Initial load
  useEffect(() => {
    if (userId || walletAddress) {
      fetchEscrowAgreements(1, true);
    } else {
      setAgreements([]);
      setHasMore(false);
    }
  }, [userId, walletAddress, fetchEscrowAgreements]);

  return {
    agreements,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
