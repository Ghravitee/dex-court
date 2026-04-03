import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "./hooks/useDebounce";
import { useLiveDisputes } from "./hooks/useLiveDisputes";
import { useConcludedDisputes } from "./hooks/useConcludedDisputes";
import { MemoizedLiveCaseCard } from "./components/LiveCaseCard";
import { MemoizedDoneCaseCard } from "./components/DoneCaseCard";
import { now } from "./utils/dateUtils";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "./constants";

export default function Voting() {
  const [tab, setTab] = useState<"live" | "done">("live");
  const [currentTime, setCurrentTime] = useState(now());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const userRole = user?.role || 1;

  const { liveCases, liveLoading, fetchLiveDisputes, isVoteStarted } =
    useLiveDisputes();

  const { concludedCases, concludedLoading, fetchConcludedDisputes } =
    useConcludedDisputes();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const isUserJudge = useCallback(() => {
    return userRole === 2 || userRole === 3;
  }, [userRole]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === "live") {
      fetchLiveDisputes().catch((err) => {
        setError("Failed to load voting disputes");
        console.error(err);
      });
    } else {
      fetchConcludedDisputes().catch((err) => {
        setError("Failed to load concluded disputes");
        console.error(err);
      });
    }
  }, [tab, fetchLiveDisputes, fetchConcludedDisputes]);

  const handleTabChange = useCallback((newTab: "live" | "done") => {
    setTab(newTab);
    setCurrentPage(1);
    setError(null);
  }, []);

  const filteredLiveCases = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return liveCases;

    const searchTerm = debouncedSearchQuery.toLowerCase().trim();

    return liveCases.filter((c) => {
      const searchableText = [
        c.title || "",
        c.parties.plaintiff || "",
        c.parties.defendant || "",
        c.description || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [liveCases, debouncedSearchQuery]);

  const filteredConcludedCases = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return concludedCases;

    const searchTerm = debouncedSearchQuery.toLowerCase().trim();

    return concludedCases.filter((c) => {
      const searchableText = [
        c.title || "",
        c.parties.plaintiff || "",
        c.parties.defendant || "",
        c.description || "",
        c.winner || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [concludedCases, debouncedSearchQuery]);

  // Separate paginated cases for live and concluded
  const paginatedLiveCases = useMemo(() => {
    return filteredLiveCases.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );
  }, [filteredLiveCases, currentPage, pageSize]);

  const paginatedConcludedCases = useMemo(() => {
    return filteredConcludedCases.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );
  }, [filteredConcludedCases, currentPage, pageSize]);

  const totalLivePages = Math.ceil(filteredLiveCases.length / pageSize);
  const totalConcludedPages = Math.ceil(
    filteredConcludedCases.length / pageSize,
  );

  const totalPages = tab === "live" ? totalLivePages : totalConcludedPages;
  const currentCases =
    tab === "live" ? filteredLiveCases : filteredConcludedCases;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, currentCases.length);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const renderLiveContent = useMemo(() => {
    if (error) {
      return (
        <div className="col-span-2 mt-10 h-[20rem]">
          <div className="text-center">
            <div className="mb-4 text-2xl">❌</div>
            <div className="text-lg text-red-400">{error}</div>
            <Button
              variant="outline"
              className="mt-4 border-cyan-400 text-cyan-300"
              onClick={() => fetchLiveDisputes()}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (liveLoading) {
      return (
        <div className="col-span-2 py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-muted-foreground">Loading active votes...</p>
          </div>
        </div>
      );
    }

    if (paginatedLiveCases.length === 0) {
      return (
        <div className="col-span-2 py-12 text-center">
          <div className="mb-4 text-4xl">🗳️</div>
          <h3 className="mb-2 text-lg font-semibold text-cyan-300">
            {debouncedSearchQuery.trim()
              ? "No Matching Active Votes"
              : "No Active Votes"}
          </h3>
          <p className="text-muted-foreground">
            {debouncedSearchQuery.trim()
              ? `No active votes found matching "${debouncedSearchQuery}"`
              : "There are currently no disputes in the voting phase."}
          </p>
          {debouncedSearchQuery.trim() && (
            <Button
              variant="outline"
              className="mt-4 border-cyan-400 text-cyan-300"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          )}
        </div>
      );
    }

    return paginatedLiveCases.map((c) => (
      <MemoizedLiveCaseCard
        key={c.id}
        c={c}
        currentTime={currentTime}
        refetchLiveDisputes={fetchLiveDisputes}
        isVoteStarted={isVoteStarted}
        isJudge={isUserJudge()}
      />
    ));
  }, [
    error,
    liveLoading,
    paginatedLiveCases,
    currentTime,
    fetchLiveDisputes,
    isVoteStarted,
    isUserJudge,
    debouncedSearchQuery,
  ]);

  const renderConcludedContent = useMemo(() => {
    if (error) {
      return (
        <div className="col-span-2 mt-10 h-[20rem]">
          <div className="text-center">
            <div className="mb-4 text-2xl">❌</div>
            <div className="text-lg text-red-400">{error}</div>
            <Button
              variant="outline"
              className="mt-4 border-cyan-400 text-cyan-300"
              onClick={() => fetchConcludedDisputes()}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (concludedLoading) {
      return (
        <div className="col-span-2 py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-muted-foreground">Loading concluded cases...</p>
          </div>
        </div>
      );
    }

    if (paginatedConcludedCases.length === 0) {
      return (
        <div className="col-span-2 py-12 text-center">
          <div className="mb-4 text-4xl">📊</div>
          <h3 className="mb-2 text-lg font-semibold text-cyan-300">
            {debouncedSearchQuery.trim()
              ? "No Matching Cases"
              : "No Concluded Cases"}
          </h3>
          <p className="text-muted-foreground">
            {debouncedSearchQuery.trim()
              ? `No concluded cases found matching "${debouncedSearchQuery}"`
              : "No voting results available yet."}
          </p>
          {debouncedSearchQuery.trim() && (
            <Button
              variant="outline"
              className="mt-4 border-cyan-400 text-cyan-300"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          )}
        </div>
      );
    }

    return paginatedConcludedCases.map((c) => (
      <MemoizedDoneCaseCard key={c.id} c={c} />
    ));
  }, [
    error,
    concludedLoading,
    paginatedConcludedCases,
    fetchConcludedDisputes,
    debouncedSearchQuery,
  ]);

  const tabContent =
    tab === "live" ? renderLiveContent : renderConcludedContent;

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl" />

      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90">Voting Hub</h2>
        <div className="text-sm text-cyan-300">
          {tab === "live"
            ? `${filteredLiveCases.length} active case${filteredLiveCases.length !== 1 ? "s" : ""}`
            : `${filteredConcludedCases.length} concluded case${filteredConcludedCases.length !== 1 ? "s" : ""}`}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit rounded-md bg-white/5 p-1">
          <button
            onClick={() => handleTabChange("live")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              tab === "live"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-muted-foreground hover:text-white/80"
            }`}
          >
            LIVE
          </button>
          <button
            onClick={() => handleTabChange("done")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              tab === "done"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-muted-foreground hover:text-white/80"
            }`}
          >
            CONCLUDED
          </button>
        </div>

        <div className="relative grow sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            placeholder="Search by title, username, or description"
            className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm ring-0 outline-none focus:border-cyan-400/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-cyan-300/70 hover:text-cyan-300"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-white/70">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-cyan-400/80" />
            <span>Plaintiff</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-pink-400/80" />
            <span>Defendant</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <span>Dismissed</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-cyan-300">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400/40"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} className="text-black" value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-cyan-300">per page</span>
        </div>

        {currentCases.length > 0 && (
          <div className="text-sm whitespace-nowrap text-cyan-300">
            Showing {startItem} to {endItem} of {currentCases.length}{" "}
            {tab === "live" ? "active" : "concluded"} cases
          </div>
        )}
      </div>

      <div className="mx-auto mt-4 grid max-w-[1150px] grid-flow-row-dense grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {tabContent}
      </div>

      {currentCases.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
          <div className="text-sm whitespace-nowrap text-cyan-300">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="order-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
            </Button>

            <div className="xs:flex order-3 hidden items-center gap-1 sm:order-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
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
                    onClick={() => handlePageChange(pageNum)}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="order-4 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-4"
            >
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
