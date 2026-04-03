/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Agreement, AgreementStatusFilter } from "../../../types";
import { agreementService } from "../../../services/agreementServices";
import { STATUS_TO_API_MAP } from "../constants/enums";
import { transformApiAgreement } from "../utils/formatters";

export function useAgreementList() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalAgreements, setTotalAgreements] = useState(0);
  const [, setTotalResults] = useState(0);

  // Filters
  const [tableFilter, setTableFilter] = useState<AgreementStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadAgreements = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: any = {
        top: pageSize,
        skip: (currentPage - 1) * pageSize,
        sort: sortOrder,
        type: 1,
      };

      if (tableFilter !== "all" && STATUS_TO_API_MAP[tableFilter]) {
        queryParams.status = STATUS_TO_API_MAP[tableFilter];
      }

      if (searchQuery.trim()) {
        queryParams.search = searchQuery;
      }

      const response = await agreementService.getAgreements(queryParams);
      const pageAgreements = response.results || [];

      setAgreements(pageAgreements.map(transformApiAgreement));
      setTotalAgreements(response.totalAgreements || 0);
      setTotalResults(response.totalResults || 0);
    } catch (error: any) {
      if (error.message?.includes("timeout") || error.code === "ECONNABORTED") {
        toast.error("Request timed out", {
          description:
            "Please try again with fewer results or a smaller page size",
        });
      } else {
        toast.error(error.message || "Failed to load agreements");
      }
      setAgreements([]);
      setTotalAgreements(0);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, tableFilter, searchQuery, sortOrder]);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tableFilter, searchQuery, sortOrder]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  return {
    agreements,
    loading,
    currentPage,
    pageSize,
    totalAgreements,
    tableFilter,
    setTableFilter,
    searchQuery,
    setSearchQuery,
    sortOrder,
    toggleSortOrder,
    handlePageChange,
    handlePageSizeChange,
    loadAgreements,
  };
}
