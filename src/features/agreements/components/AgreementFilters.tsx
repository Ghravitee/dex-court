import { useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  SortAsc,
  SortDesc,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { TABLE_FILTER_OPTIONS } from "../constants/enums";
import type { AgreementStatusFilter } from "../../../types";

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  tableFilter: AgreementStatusFilter;
  onFilterChange: (f: AgreementStatusFilter) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  loading: boolean;
  onRefetch: () => void;
}

export const AgreementFilters = ({
  searchQuery,
  onSearchChange,
  tableFilter,
  onFilterChange,
  sortOrder,
  onToggleSort,
  loading,
  onRefetch,
}: Props) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-10 mb-5 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative grow sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or parties"
          className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white outline-none focus:border-cyan-400/40"
        />
      </div>

      {/* Refetch */}
      <Button
        onClick={onRefetch}
        variant="outline"
        className="flex items-center gap-2 border-white/15 text-cyan-200 hover:bg-cyan-500/10"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Refetch Agreements</span>
      </Button>

      {/* Status filter */}
      <div className="relative w-48" ref={filterRef}>
        <div
          onClick={() => setIsFilterOpen((p) => !p)}
          className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-cyan-400/30"
        >
          <span className="capitalize">
            {TABLE_FILTER_OPTIONS.find((f) => f.value === tableFilter)?.label ||
              "All"}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
          />
        </div>
        {isFilterOpen && (
          <div className="absolute top-[110%] right-0 z-50 w-full overflow-hidden rounded-md border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
            {TABLE_FILTER_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onFilterChange(option.value);
                  setIsFilterOpen(false);
                }}
                className={`cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white ${
                  tableFilter === option.value
                    ? "bg-cyan-500/20 text-cyan-200"
                    : ""
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="ml-auto">
        <Button
          variant="outline"
          className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          onClick={onToggleSort}
        >
          {sortOrder === "asc" ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
          Sort
        </Button>
      </div>
    </div>
  );
};
