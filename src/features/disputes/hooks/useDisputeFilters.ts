import { useState, useEffect } from "react";
import type { DisputeRow } from "../../../types";

export interface DisputeFilters {
  searchQuery: string;
  status: DisputeRow["status"] | "All";
  dateRange: string;
  sortOrder: "asc" | "desc";
}

export interface DisputeFiltersActions {
  setSearchQuery: (q: string) => void;
  setStatus: (s: DisputeRow["status"] | "All") => void;
  setDateRange: (d: string) => void;
  setSortOrder: (o: "asc" | "desc") => void;
  toggleSortOrder: () => void;
  resetPage: () => void;
}

export function useDisputeFilters(onPageReset: () => void) {
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<DisputeRow["status"] | "All">("All");
  const [dateRange, setDateRange] = useState("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Reset to page 1 whenever filters change
  useEffect(() => {
    onPageReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, searchQuery, sortOrder, dateRange]);

  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  return {
    filters: { searchQuery, status, dateRange, sortOrder },
    actions: {
      setSearchQuery,
      setStatus,
      setDateRange,
      setSortOrder,
      toggleSortOrder,
      resetPage: onPageReset,
    },
  };
}
