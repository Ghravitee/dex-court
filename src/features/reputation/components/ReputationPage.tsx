// features/reputation/components/ReputationPage.tsx
import { useState, useMemo } from "react";
import { Search, User, AlertTriangle } from "lucide-react";

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

export default function ReputationPage() {
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectedProfile, setSelectedProfile] = useState<LeaderboardAccount | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  const leaderboard = useLeaderboard(sortDir, query);
  const globalUpdates = useGlobalUpdates(5);
  const history = useReputationHistory(
    selectedProfile ? selectedProfile.id.toString() : null,
  );

  // Memoized so it doesn't re-run on every keystroke
  const delta = useMemo(
    () => calculate30DayChange(history.data?.results ?? []),
    [history.data?.results],
  );

  const anyError = leaderboard.error ?? globalUpdates.error ?? history.error;
  if (anyError) {
    return (
      <div className="relative space-y-6">
        <div className="absolute inset-0 -z-[50] bg-cyan-500/13 blur-3xl" />
        <div className="rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-400" />
          <h3 className="mb-2 text-lg font-semibold text-white/90">Error Loading Data</h3>
          <p className="text-white/70">{anyError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600"
          >
            Retry
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
          <h2 className="text-xl font-semibold text-white/90">Reputation Explorer</h2>
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
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm outline-none focus:border-cyan-400/40 placeholder:text-white/40"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Leaderboard
            data={leaderboard.data}
            loading={leaderboard.loading}
            loadingMore={leaderboard.loadingMore}
            hasMore={leaderboard.hasMore}
            sortDir={sortDir}
            onSortToggle={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            onRowClick={setSelectedProfile}
            onLoadMore={leaderboard.loadMore}
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
