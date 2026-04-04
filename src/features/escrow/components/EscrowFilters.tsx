import { Search, SortAsc, SortDesc, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { OnChainEscrowData } from "../types";

interface EscrowFiltersProps {
  // Search / sort
  query: string;
  setQuery: (q: string) => void;
  sortAsc: boolean;
  setSortAsc: (v: boolean) => void;
  // Status tabs
  statusTab: string;
  setStatusTab: (tab: string) => void;
  allEscrows: OnChainEscrowData[];
  // Refresh
  loading: boolean;
  onRefresh: () => Promise<void>;
  // Pagination
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  filteredCount: number;
  totalEscrows: number;
  onPageChange: (page: number) => void;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "signed", label: "Signed" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export function EscrowFilters({
  query,
  setQuery,
  sortAsc,
  setSortAsc,
  statusTab,
  setStatusTab,
  allEscrows,
  loading,
  onRefresh,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  startItem,
  endItem,
  filteredCount,
  totalEscrows,
  onPageChange,
}: EscrowFiltersProps) {
  return (
    <>
      {/* Search / sort / refresh row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative grow sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search escrows by title, party, or description"
            className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white outline-none ring-0 focus:border-cyan-400/40"
          />
        </div>

        <Button
          variant="outline"
          className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          onClick={() => setSortAsc(!sortAsc)}
        >
          {sortAsc ? (
            <SortAsc className="mr-2 h-4 w-4" />
          ) : (
            <SortDesc className="mr-2 h-4 w-4" />
          )}
          {sortAsc ? "Old → New" : "New → Old"}
        </Button>

        <Button
          variant="outline"
          className="group rounded-xl border-2 border-cyan-400/40 bg-cyan-500/5 px-4 py-3 font-semibold text-cyan-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-100 hover:shadow-lg hover:shadow-cyan-500/20 active:translate-y-0"
          onClick={async () => {
            try {
              await onRefresh();
            } catch {
              // handled inside hook
            }
          }}
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4" />
          {loading ? "Refetching..." : "Refetch Escrows"}
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? allEscrows.length
              : allEscrows.filter((e) => e.status === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              className={`relative flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 ${
                statusTab === tab.value
                  ? "border border-cyan-400/30 bg-cyan-500/20 text-cyan-200 shadow-lg shadow-cyan-500/20"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  statusTab === tab.value
                    ? "bg-cyan-400/30 text-cyan-200"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {count}
              </span>
              {statusTab === tab.value && (
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Page size + pagination */}
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-sm text-cyan-300">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400/40"
          >
            {[10, 20, 30, 40].map((n) => (
              <option key={n} className="text-black" value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-sm text-cyan-300">per page</span>
        </div>

        {!loading && totalEscrows > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
            <div className="text-sm whitespace-nowrap text-cyan-300">
              Showing {startItem} to {endItem} of {filteredCount} escrows
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="order-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
              </Button>

              <div className="xs:flex order-3 hidden items-center gap-1 sm:order-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "neon" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className={`${
                        currentPage === pageNum
                          ? "neon-hover"
                          : "border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                      } h-8 min-w-[2rem] px-2 text-xs sm:h-9 sm:min-w-[2.5rem] sm:px-3 sm:text-sm`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <div className="xs:hidden order-2 text-sm text-cyan-300 sm:order-3">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="order-4 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
              >
                <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
