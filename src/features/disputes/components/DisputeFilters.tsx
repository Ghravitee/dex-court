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
import { FILTER_OPTIONS } from "../constants/filters";
import type { DisputeRow } from "../../../types";

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  status: DisputeRow["status"] | "All";
  onStatusChange: (s: DisputeRow["status"] | "All") => void;
  dateRange: string;
  onDateRangeChange: (d: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  onRefetch: () => void;
  isRefetching: boolean;
}

export const DisputeFilters = ({
  searchQuery,
  onSearchChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  sortOrder,
  onToggleSort,
  onRefetch,
  isRefetching,
}: Props) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative grow sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          placeholder="Search by username, title, or claim"
          className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm ring-0 outline-none focus:border-cyan-400/40"
        />
      </div>

      {/* Status dropdown */}
      <div className="relative w-48" ref={dropdownRef}>
        <div
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-cyan-400/30"
        >
          <span>
            {FILTER_OPTIONS.find((f) => f.value === status)?.label ?? "All"}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </div>

        {isDropdownOpen && (
          <div className="absolute top-[110%] right-0 z-50 w-full overflow-hidden rounded-md border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
            {FILTER_OPTIONS.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value as DisputeRow["status"] | "All");
                  setIsDropdownOpen(false);
                }}
                className={`cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white ${
                  status === option.value ? "bg-cyan-500/20 text-cyan-200" : ""
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refetch */}
      <Button
        variant="outline"
        onClick={onRefetch}
        disabled={isRefetching}
        className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
      >
        {isRefetching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refetching...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refetch Disputes
          </>
        )}
      </Button>

      {/* Date range + sort */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="appearance-none rounded-md border border-white/10 bg-white/5 px-3 py-1.5 pr-8 text-xs text-white outline-none focus:border-cyan-400/40 focus:ring-0"
          >
            <option className="text-black" value="All">
              All
            </option>
            <option className="text-black" value="7d">
              Last 7d
            </option>
            <option className="text-black" value="30d">
              Last 30d
            </option>
          </select>
          <svg
            className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-white/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <Button
          variant="outline"
          className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          onClick={(e) => {
            e.preventDefault();
            onToggleSort();
          }}
        >
          {sortOrder === "asc" ? (
            <SortAsc className="mr-2 h-4 w-4" />
          ) : (
            <SortDesc className="mr-2 h-4 w-4" />
          )}
          Sort
        </Button>
      </div>
    </div>
  );
};
