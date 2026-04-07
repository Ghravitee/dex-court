/* eslint-disable @typescript-eslint/no-explicit-any */
// features/agreements/hooks/useAgreementList.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { AgreementStatusFilter } from "../../../types";
import { STATUS_TO_API_MAP } from "../constants/enums";
import { transformApiAgreement } from "../utils/formatters";
import { useAgreements } from "../../../hooks/useAgreements";

export function useAgreementList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableFilter, setTableFilter] = useState<AgreementStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const queryParams = {
    top: pageSize,
    skip: (currentPage - 1) * pageSize,
    sort: sortOrder,
    type: 1,
    ...(tableFilter !== "all" && STATUS_TO_API_MAP[tableFilter]
      ? { status: STATUS_TO_API_MAP[tableFilter] }
      : {}),
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
  };

  const { data, isLoading, error, refetch } = useAgreements(queryParams, {
    // Keep previous page data visible while next page loads
    // so the table doesn't flash empty between page changes
    placeholderData: (prev) => prev,
  });

  // Surface errors via toast — mirrors the old behaviour
  if (error) {
    const message = (error as any).message ?? "";
    if (message.includes("timeout") || (error as any).code === "ECONNABORTED") {
      toast.error("Request timed out", {
        description:
          "Please try again with fewer results or a smaller page size",
      });
    } else {
      toast.error(message || "Failed to load agreements");
    }
  }

  const agreements = (data?.results ?? []).map(transformApiAgreement);
  const totalAgreements = data?.totalAgreements ?? 0;

  // ─── Filter/sort setters — always reset to page 1 ─────────────────────────

  const handleSetTableFilter = useCallback((filter: AgreementStatusFilter) => {
    setTableFilter(filter);
    setCurrentPage(1);
  }, []);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    agreements,
    loading: isLoading,
    currentPage,
    pageSize,
    totalAgreements,
    tableFilter,
    setTableFilter: handleSetTableFilter,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    sortOrder,
    toggleSortOrder,
    handlePageChange,
    handlePageSizeChange,
    loadAgreements: refetch,
  };
}
