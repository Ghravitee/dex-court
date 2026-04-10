import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { fetchAgreements } from "../../../services/agreementServices";
import { getAgreementExistOnchain } from "../../../web3/readContract";
import { AgreementTypeEnum } from "../constants";
import { transformApiAgreementToEscrow } from "../utils/transformers";
import { normalizeContractAddress } from "../utils/formatters";
import type { OnChainEscrowData } from "../types";

interface UseEscrowListOptions {
  contractAddress?: `0x${string}`;
  networkChainId?: number;
}

export function useEscrowList({
  contractAddress,
  networkChainId,
}: UseEscrowListOptions) {
  const [allEscrows, setAllEscrows] = useState<OnChainEscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleEscrows, setVisibleEscrows] = useState<OnChainEscrowData[]>([]);

  // ─── Filters ──────────────────────────────────────────────────────────────
  const [statusTab, setStatusTab] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");

  // ─── Load ─────────────────────────────────────────────────────────────────
  const loadEscrowAgreements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAgreements({
        top: 200,
        skip: 0,
        sort: "desc",
        type: AgreementTypeEnum.ESCROW,
      });

      const list = response.results || [];
      const transformed = list.map(transformApiAgreementToEscrow);

      const confirmed = transformed.filter(
        (e) => e.status !== "pending" && e.status !== "pending_approval",
      );

      const pending = transformed.filter(
        (e) => e.status === "pending" || e.status === "pending_approval",
      );

      // Group pending by (chainId, escrowContractAddress) for batch on-chain checks
      const groups: Record<
        string,
        {
          chainId: number;
          escrowContractAddress: string;
          agreements: OnChainEscrowData[];
          onChainIds: bigint[];
        }
      > = {};

      pending.forEach((agreement) => {
        if (!agreement.onChainId || !agreement.escrowAddress) return;

        const chainId = agreement.chainId || networkChainId;
        if (!chainId) return;

        const escrowAddr = agreement.escrowAddress.toLowerCase();
        const key = `${chainId}-${escrowAddr}`;

        if (!groups[key]) {
          groups[key] = {
            chainId,
            escrowContractAddress: escrowAddr,
            agreements: [],
            onChainIds: [],
          };
        }

        groups[key].agreements.push(agreement);
        groups[key].onChainIds.push(BigInt(agreement.onChainId));
      });

      const verifiedPending: OnChainEscrowData[] = [];

      await Promise.all(
        Object.entries(groups).map(async ([, group]) => {
          try {
            if (group.onChainIds.length === 0) return;

            const existOnChain = await getAgreementExistOnchain(
              group.chainId,
              group.onChainIds,
              group.escrowContractAddress as `0x${string}`,
            );

            group.agreements.forEach((agreement, i) => {
              if (existOnChain[i]) verifiedPending.push(agreement);
            });
          } catch {
            // Skip group on error — don't surface unverified pending agreements
          }
        }),
      );

      const final = [...confirmed, ...verifiedPending].sort(
        (a, b) => b.createdAt - a.createdAt,
      );

      setAllEscrows(final);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load escrow agreements";
      toast.error(message);
      setError(message); //
      setAllEscrows([]);
    } finally {
      setLoading(false);
    }
  }, [networkChainId]);

  useEffect(() => {
    loadEscrowAgreements();
  }, [loadEscrowAgreements]);

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filteredEscrows = useMemo(() => {
    if (allEscrows.length === 0) return [];

    const normalizedContract = contractAddress
      ? normalizeContractAddress(contractAddress)
      : null;

    let result = allEscrows.filter((e) => {
      if (normalizedContract) {
        if (normalizeContractAddress(e.escrowAddress) !== normalizedContract)
          return false;
      }

      if (statusTab !== "all" && e.status !== statusTab) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.from.toLowerCase().includes(q) ||
          e.to.toLowerCase().includes(q)
        );
      }

      return true;
    });

    result = result.sort((a, b) =>
      sortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt,
    );

    return result;
  }, [allEscrows, statusTab, query, sortAsc, contractAddress]);

  // ─── Pagination application ───────────────────────────────────────────────
  const applyPagination = useCallback(
    (list: OnChainEscrowData[], page: number, size: number) => {
      const start = (page - 1) * size;
      setVisibleEscrows(list.slice(start, start + size));
    },
    [],
  );

  useEffect(() => {
    applyPagination(filteredEscrows, currentPage, pageSize);
  }, [filteredEscrows, currentPage, pageSize, applyPagination]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, query, sortAsc]);

  const totalPages = Math.ceil(filteredEscrows.length / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredEscrows.length);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    applyPagination(filteredEscrows, page, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    applyPagination(filteredEscrows, 1, size);
  };

  return {
    // Data
    allEscrows,
    visibleEscrows,
    filteredEscrows,
    loading,
    error,
    loadEscrowAgreements,
    // Filters
    statusTab,
    setStatusTab,
    sortAsc,
    setSortAsc,
    query,
    setQuery,
    // Pagination
    currentPage,
    totalPages,
    startItem,
    endItem,
    handlePageChange,
    handlePageSizeChange,
    pageSize,
  };
}
