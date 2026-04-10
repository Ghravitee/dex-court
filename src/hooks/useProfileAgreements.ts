/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAgreements } from "../services/agreementServices";
import { AgreementTypeEnum } from "../services/agreementServices";
import { getAgreementExistOnchain } from "../web3/readContract";

export function useProfileAgreements(
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
  const [verifyingOnChain, setVerifyingOnChain] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const allReputationalRef = useRef<any[]>([]);
  const allEscrowRef = useRef<any[]>([]);
  const hasFetchedRef = useRef(false);

  // ─── Helpers ───────────────────────────────────────────────────────────────

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
        serviceProviderMatch?.[1] ?? alternativeProviderMatch?.[1] ?? null,
      serviceRecipient:
        serviceRecipientMatch?.[1] ?? alternativeRecipientMatch?.[1] ?? null,
    };
  }, []);

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
        onChainId: apiAgreement.contractAgreementId,
        escrowAddress: apiAgreement.escrowContractAddress,
        chainId: apiAgreement.chainId,
        onChainVerified: false,
      };
    },
    [extractRolesFromDescription],
  );

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

  // ─── On-chain verification ─────────────────────────────────────────────────

  const verifyEscrowAgreementsOnChain = useCallback(
    async (escrows: any[]) => {
      if (!escrows.length) return [];

      const confirmedAgreements = escrows.filter(
        (e) => e.status !== 1 && e.status !== 7,
      );
      const pendingAgreements = escrows.filter(
        (e) => e.status === 1 || e.status === 7,
      );

      const groupedPending: Record<
        string,
        {
          chainId: number;
          escrowAddress: string;
          agreements: any[];
          onChainIds: bigint[];
        }
      > = {};

      pendingAgreements.forEach((agreement) => {
        if (!agreement.onChainId || !agreement.escrowAddress) return;

        const chainId = agreement.chainId || null;
        const escrowAddr = agreement.escrowAddress.toLowerCase();
        const key = `${chainId}-${escrowAddr}`;

        if (!groupedPending[key]) {
          groupedPending[key] = {
            chainId,
            escrowAddress: escrowAddr,
            agreements: [],
            onChainIds: [],
          };
        }

        groupedPending[key].agreements.push(agreement);
        groupedPending[key].onChainIds.push(BigInt(agreement.onChainId));
      });

      const verifiedPendingAgreements: any[] = [];

      await Promise.all(
        Object.entries(groupedPending).map(async ([, group]) => {
          try {
            if (group.onChainIds.length === 0) return;

            const existOnChain = await getAgreementExistOnchain(
              group.chainId,
              group.onChainIds,
              group.escrowAddress as `0x${string}`,
            );

            group.agreements.forEach((agreement, index) => {
              if (existOnChain[index]) {
                verifiedPendingAgreements.push({
                  ...agreement,
                  onChainVerified: true,
                });
              }
            });
          } catch {
            // Skip group on error — don't surface unverified pending agreements
          }
        }),
      );

      return [
        ...confirmedAgreements.map((a) => ({ ...a, onChainVerified: true })),
        ...verifiedPendingAgreements,
      ];
    },
    [],
  );

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  // NOTE: The API has no per-user filter endpoint. We fetch type-specific
  // pages (capped at 100) and filter client-side by userId/walletAddress.
  // For users with more than 100 agreements of a given type, results will
  // be incomplete. TODO: Ask backend to add GET /agreement?userId=:id

  const fetchAllUserAgreements = useCallback(async () => {
    if (!userId && !userWalletAddress) return { reputational: [], escrow: [] };

    try {
      // Two targeted requests instead of one 1000-record fetch
      const [reputationalResponse, escrowResponse] = await Promise.all([
        fetchAgreements({
          top: 100,
          skip: 0,
          sort: "desc",
          type: AgreementTypeEnum.REPUTATION,
        }),
        fetchAgreements({
          top: 100,
          skip: 0,
          sort: "desc",
          type: AgreementTypeEnum.ESCROW,
        }),
      ]);

      const allReputational = reputationalResponse.results ?? [];
      const allEscrow = escrowResponse.results ?? [];

      // Filter reputational by user ID
      const userReputational = allReputational
        .filter((agreement) => {
          if (!userId) return false;
          return (
            agreement.firstParty?.id?.toString() === userId ||
            agreement.counterParty?.id?.toString() === userId
          );
        })
        .map(transformReputationalAgreement);

      // Filter escrow by user ID or wallet address
      const userEscrow = allEscrow
        .filter((agreement) => {
          if (userId) {
            if (
              agreement.firstParty?.id?.toString() === userId ||
              agreement.counterParty?.id?.toString() === userId
            ) {
              return true;
            }
          }

          const userWallet = userWalletAddress?.toLowerCase();
          if (userWallet) {
            const payee = agreement.payeeWalletAddress?.toLowerCase();
            const payer = agreement.payerWalletAddress?.toLowerCase();
            if (
              (payee && payee === userWallet) ||
              (payer && payer === userWallet)
            ) {
              return true;
            }

            // Fallback: extract from description
            const roles = extractRolesFromDescription(
              agreement.description || "",
            );
            return (
              roles.serviceProvider?.toLowerCase() === userWallet ||
              roles.serviceRecipient?.toLowerCase() === userWallet
            );
          }

          return false;
        })
        .map(transformEscrowAgreement);

      setVerifyingOnChain(true);
      const verifiedEscrowAgreements =
        await verifyEscrowAgreementsOnChain(userEscrow);
      setVerifyingOnChain(false);

      return {
        reputational: userReputational,
        escrow: verifiedEscrowAgreements,
      };
    } catch (err) {
      setVerifyingOnChain(false);
      throw err;
    }
  }, [
    userId,
    userWalletAddress,
    transformReputationalAgreement,
    transformEscrowAgreement,
    extractRolesFromDescription,
    verifyEscrowAgreementsOnChain,
  ]);

  // ─── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchInitialAgreements = async () => {
      if ((!userId && !userWalletAddress) || hasFetchedRef.current) return;

      hasFetchedRef.current = true;
      setLoading(true);

      try {
        const { reputational, escrow } = await fetchAllUserAgreements();

        allReputationalRef.current = reputational;
        allEscrowRef.current = escrow;

        setReputationalAgreements(reputational);
        setEscrowAgreements(escrow);
        setTotalReputationalAgreements(reputational.length);
        setTotalEscrowAgreements(escrow.length);

        setReputationalDisplay(reputational.slice(0, ITEMS_PER_PAGE));
        setEscrowDisplay(escrow.slice(0, ITEMS_PER_PAGE));
        setHasMoreReputational(reputational.length > ITEMS_PER_PAGE);
        setHasMoreEscrow(escrow.length > ITEMS_PER_PAGE);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load agreements",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialAgreements();

    return () => {
      hasFetchedRef.current = false;
    };
  }, [userId, userWalletAddress, fetchAllUserAgreements]);

  // ─── Load more ─────────────────────────────────────────────────────────────

  const loadingMoreReputationalRef = useRef(false);

  const loadMoreReputational = useCallback(() => {
    if (loadingMoreReputationalRef.current || !hasMoreReputational) return;
    loadingMoreReputationalRef.current = true;

    const nextPage = pageReputational + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setReputationalDisplay((prev) => [
      ...prev,
      ...allReputationalRef.current.slice(start, end),
    ]);
    setHasMoreReputational(end < allReputationalRef.current.length);
    setPageReputational(nextPage);

    loadingMoreReputationalRef.current = false;
  }, [hasMoreReputational, pageReputational]);

  const loadingMoreEscrowRef = useRef(false);

  const loadMoreEscrow = useCallback(() => {
    if (loadingMoreEscrowRef.current || !hasMoreEscrow) return;
    loadingMoreEscrowRef.current = true;

    const nextPage = pageEscrow + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setEscrowDisplay((prev) => [
      ...prev,
      ...allEscrowRef.current.slice(start, end),
    ]);
    setHasMoreEscrow(end < allEscrowRef.current.length);
    setPageEscrow(nextPage);

    loadingMoreEscrowRef.current = false;
  }, [hasMoreEscrow, pageEscrow]);

  // ─── Refetch ───────────────────────────────────────────────────────────────

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
      setReputationalDisplay(reputational.slice(0, ITEMS_PER_PAGE));
      setEscrowDisplay(escrow.slice(0, ITEMS_PER_PAGE));
      setHasMoreReputational(reputational.length > ITEMS_PER_PAGE);
      setHasMoreEscrow(escrow.length > ITEMS_PER_PAGE);
      setPageReputational(1);
      setPageEscrow(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refetch agreements",
      );
    } finally {
      setLoading(false);
    }
  }, [userId, userWalletAddress, fetchAllUserAgreements]);

  return {
    reputationalAgreements,
    escrowAgreements,
    reputationalDisplay,
    escrowDisplay,
    loading,
    verifyingOnChain,
    error,
    hasMoreReputational,
    hasMoreEscrow,
    loadMoreReputational,
    loadMoreEscrow,
    totalReputationalAgreements,
    totalEscrowAgreements,
    refetch,
  };
}
