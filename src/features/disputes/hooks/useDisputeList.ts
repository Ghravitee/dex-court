/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { disputeService } from "../../../services/disputeServices";
// import { DisputeStatusEnum } from "../../../types";
import type { DisputeRow } from "../../../types";
import type { DisputeFilters } from "./useDisputeFilters";
import { STATUS_MAP } from "../constants/filters";

export function useDisputeList(filters: DisputeFilters) {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  const { searchQuery, status, dateRange, sortOrder } = filters;

  const loadDisputes = useCallback(
    async (manualRetry = false) => {
      try {
        setLoading(manualRetry ? false : true);
        setIsRefetching(manualRetry);
        setFetchError(null);

        const queryParams: any = {
          top: pageSize,
          skip: (currentPage - 1) * pageSize,
          sort: sortOrder,
        };

        if (status !== "All" && STATUS_MAP[status]) {
          queryParams.status = STATUS_MAP[status];
        }

        if (dateRange !== "All") {
          const rangeMap: Record<string, string> = {
            "7d": "last7d",
            "30d": "last30d",
          };
          queryParams.range = rangeMap[dateRange];
        }

        if (searchQuery.trim()) {
          queryParams.search = searchQuery;
        }

        const disputesResponse = await disputeService.getDisputes(queryParams);
        const pageDisputes = disputesResponse.results || [];

        const transformed = pageDisputes.map((d: any) =>
          disputeService.transformDisputeListItemToRow(d),
        );

        setDisputes(transformed);
        setTotalDisputes(disputesResponse.totalDisputes || 0);
      } catch (error: any) {
        console.error("Failed to fetch disputes:", error);

        let errorMessage = "Failed to load disputes";
        let detailedMessage = error.message || "Unknown error occurred";
        let fetchErrorMsg = "Failed to load disputes. Please try again.";

        if (
          error.message?.includes("timeout") ||
          error.code === "ECONNABORTED"
        ) {
          errorMessage = "Request timed out";
          detailedMessage =
            "Please check your internet connection and try again";
          fetchErrorMsg =
            "Connection timeout. Please check your internet connection.";
        } else if (error.message?.includes("Network Error")) {
          errorMessage = "Network error";
          detailedMessage =
            "Unable to connect to the server. Please check your internet connection.";
          fetchErrorMsg = "Network error. Unable to connect to the server.";
        } else if (/50[0-9]/.test(error.message)) {
          errorMessage = "Server error";
          detailedMessage =
            "The server is temporarily unavailable. Please try again later.";
          fetchErrorMsg = "Server temporarily unavailable. Please try again.";
        }

        toast.error(errorMessage, { description: detailedMessage });
        setFetchError(fetchErrorMsg);
        setDisputes([]);
        setTotalDisputes(0);
      } finally {
        setLoading(false);
        setIsRefetching(false);
      }
    },
    [currentPage, pageSize, status, searchQuery, sortOrder, dateRange],
  );

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleRefetch = () => {
    setCurrentPage(1);
    loadDisputes(true);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const resetPage = () => setCurrentPage(1);

  return {
    disputes,
    loading,
    currentPage,
    pageSize,
    totalDisputes,
    fetchError,
    isRefetching,
    handleRefetch,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
    reload: loadDisputes,
  };
}
