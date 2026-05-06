// features/reputation/components/ReputationPage.tsx
import { useState, useMemo } from "react";
import { Search, User, AlertCircle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useLeaderboard } from "../hooks/useLeaderboard";
import { useGlobalUpdates } from "../hooks/useGlobalUpdates";
import { useReputationHistory } from "../hooks/useReputationHistory";

import { Leaderboard } from "./Leaderboard";
import { ReputationHistory } from "./ReputationHistory";
import { GlobalUpdates } from "./GlobalUpdates";
import { SelectedProfilePanel } from "./SelectedProfilePanel";

import { calculate30DayChange } from "../utils/calculations";
import { formatUsername } from "../utils/formatters";

import type { LeaderboardAccount, SortDirection } from "../types";
import { ReputationPageLoadingScreen } from "./ReputationPageLoadingScreen";

export default function ReputationPage() {
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectedProfile, setSelectedProfile] =
    useState<LeaderboardAccount | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  const queryClient = useQueryClient();
  const leaderboard = useLeaderboard(sortDir, query);
  const globalUpdates = useGlobalUpdates(5);
  const history = useReputationHistory(
    selectedProfile ? selectedProfile.id.toString() : null,
  );

  const delta = useMemo(
    () => calculate30DayChange(history.data?.results ?? []),
    [history.data?.results],
  );

  const anyError = leaderboard.error ?? globalUpdates.error;

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["global-updates"] });
  };

  if (leaderboard.loading && leaderboard.data.length === 0 && !anyError) {
    return <ReputationPageLoadingScreen />;
  }

  if (anyError) {
    return (
      <div className="relative space-y-6">
        <div className="absolute inset-0 -z-[50] bg-cyan-500/13 blur-3xl" />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white/90">
            Failed to load reputation data
          </h3>
          <p className="mb-5 max-w-[280px] text-sm leading-relaxed text-slate-500">
            {anyError}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-0 -z-[50] bg-cyan-500/13 blur-3xl" />

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white/90">
            Reputation Explorer
          </h2>
          <p className="text-sm text-white/60">
            Track user reputation scores and activity history
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or wallet address"
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm outline-none placeholder:text-white/40 focus:border-cyan-400/40"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Leaderboard
            data={leaderboard.data}
            loading={leaderboard.loading}
            sortDir={sortDir}
            onSortToggle={() =>
              setSortDir((d) => (d === "desc" ? "asc" : "desc"))
            }
            onRowClick={setSelectedProfile}
            selectedId={selectedProfile?.id}
          />

          {selectedProfile && history.data && (
            <ReputationHistory
              profile={{ username: formatUsername(selectedProfile.username) }}
              history={history.data}
              loading={history.loading}
              loadingMore={history.loadingMore}
              hasMore={history.hasMore}
              eventsShown={history.eventsShown}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onLoadMore={history.loadMore}
            />
          )}
        </div>

        {/* Right column */}
        <aside className="space-y-2">
          <GlobalUpdates
            data={globalUpdates.data}
            loading={globalUpdates.loading}
            loadingMore={globalUpdates.loadingMore}
            hasMore={globalUpdates.hasMore}
            total={globalUpdates.total}
            onLoadMore={globalUpdates.loadMore}
          />

          {selectedProfile ? (
            <SelectedProfilePanel profile={selectedProfile} delta={delta} />
          ) : (
            <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-8 text-center">
              <User className="mx-auto mb-3 h-10 w-10 text-cyan-300" />
              <h4 className="mb-2 font-medium text-white/90">Select a User</h4>
              <p className="text-sm text-white/50">
                Click any row in the leaderboard to view a detailed reputation
                profile and history.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
