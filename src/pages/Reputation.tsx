/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/Reputation.tsx
import { useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  User,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

// Import our separated modules
import TrustMeter from "../components/TrustMeter";
import { UserAvatar } from "../components/UserAvatar"; // Import the UserAvatar component
import {
  useLeaderboard,
  useGlobalUpdates,
  useReputationHistory,
  type DisputesStats,
} from "../services/ReputationServices";
import {
  formatDate,
  getEventTypeText,
  calculate30DayChange,
} from "../lib/reputationHelpers";

// Helper function to calculate total disputes
const getTotalDisputes = (disputes: DisputesStats | undefined): number => {
  if (!disputes) return 0;
  return (
    disputes.won +
    disputes.lost +
    disputes.dismissed +
    disputes.tie +
    disputes.cancelled
  );
};

// Helper function to render disputes breakdown
const renderDisputesBreakdown = (disputes: DisputesStats | undefined) => {
  if (!disputes) return null;

  return (
    <div className="flex gap-2">
      {/* Won */}
      <div className="group relative">
        <span className="text-sm text-emerald-300">+{disputes.won || 0}</span>
        <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-20 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
          Won
        </div>
      </div>

      {/* Lost */}
      <div className="group relative">
        <span className="text-sm text-red-400">-{disputes.lost || 0}</span>
        <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-20 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
          Lost
        </div>
      </div>

      {/* Dismissed */}
      <div className="group relative">
        <span className="text-sm text-amber-300">
          {disputes.dismissed || 0}
        </span>
        <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-24 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
          Dismissed
        </div>
      </div>

      {/* Tie */}
      <div className="group relative">
        <span className="text-sm text-cyan-300">{disputes.tie || 0}</span>
        <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-16 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
          Tie
        </div>
      </div>

      {/* Cancelled */}
      <div className="group relative">
        <span className="text-sm text-gray-400">{disputes.cancelled || 0}</span>
        <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-24 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
          Cancelled
        </div>
      </div>
    </div>
  );
};

export default function Reputation() {
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // Use TanStack Query hooks directly from service
  const {
    data: leaderboardData = [],
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useLeaderboard(sortDir, query);

  const {
    data: globalUpdatesData,
    isLoading: updatesLoading,
    error: updatesError,
  } = useGlobalUpdates();

  const {
    data: selectedUserHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useReputationHistory(selectedProfile?.id?.toString() || null);

  const globalUpdates = globalUpdatesData?.results || [];

  const handleRowClick = (user: any) => {
    setSelectedProfile(user);
  };

  const delta = selectedUserHistory
    ? calculate30DayChange(selectedUserHistory.results || [])
    : 0;

  // Error handling
  const error = leaderboardError || updatesError || historyError;
  if (error) {
    return (
      <div className="relative space-y-6">
        <div className="absolute inset-0 -z-[50] bg-cyan-500/13 blur-3xl"></div>
        <div className="glass card-cyan p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-400" />
          <h3 className="mb-2 text-lg font-semibold text-white/90">
            Error Loading Data
          </h3>
          <p className="text-white/70">{error.message}</p>
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
      <div className="absolute inset-0 -z-[50] bg-cyan-500/13 blur-3xl"></div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="space text-xl font-semibold text-white/90">
          Reputation Explorer
        </h2>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search handle or address"
            className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm outline-none focus:border-cyan-400/40"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leaderboard */}
          <section className="glass card-cyan">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3 className="space font-semibold text-white/90">
                  Leaderboard
                </h3>
                <div className="text-muted-foreground text-xs">
                  Top users by reputation
                </div>
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() =>
                  setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
                }
                className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-white/5"
              >
                {sortDir === "desc" ? (
                  <>
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>Lowest first</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Highest first</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="w-[5%] px-5 py-3">Rank</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Disputes</th>
                    <th className="px-5 py-3 text-center">Agreements</th>
                    <th className="px-5 py-3 text-right">Reputation</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-white/60"
                      >
                        Loading leaderboard...
                      </td>
                    </tr>
                  ) : leaderboardData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-white/60"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    leaderboardData.map((user) => {
                      const recentChange = (user.lastEvents || []).reduce(
                        (sum: number, event: any) => sum + event.value,
                        0,
                      );
                      const isSelected = selectedProfile?.id === user.id;

                      const formattedUsername = user.username.startsWith("@")
                        ? user.username
                        : `@${user.username}`;

                      return (
                        <tr
                          key={user.id}
                          className={`cursor-pointer border-t border-white/10 transition hover:bg-white/5 ${
                            isSelected
                              ? "bg-cyan-500/10 ring-1 ring-cyan-400/30"
                              : ""
                          }`}
                          onClick={() => handleRowClick(user)}
                        >
                          <td className="text-muted-foreground px-5 py-4">
                            {user.rank}
                          </td>

                          <td className="hover flex items-center gap-3 px-5 py-4">
                            <UserAvatar
                              userId={user.id.toString()}
                              avatarId={user.avatarId || null}
                              username={user.username}
                              size="md"
                            />
                            <Link
                              to={`/profile/${user.username.replace("@", "")}`}
                              className="text-white transition hover:text-cyan-500 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {formattedUsername}
                            </Link>
                          </td>
                          <td className="px-5 py-4">
                            {renderDisputesBreakdown(user.disputes)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {user.agreementsTotal || 0}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="relative font-semibold text-white/90">
                              {user.finalScore || 0}
                              <sup
                                className={`ml-1 text-[10px] font-medium ${
                                  recentChange >= 0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {recentChange >= 0
                                  ? `+${recentChange}`
                                  : recentChange}
                              </sup>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reputation History - Only show when a profile is selected */}
          {selectedProfile && selectedUserHistory && (
            <section className="glass card-cyan">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <h3 className="text-sm font-semibold text-white/90">
                  Reputation History for{" "}
                  {selectedProfile.username.startsWith("@")
                    ? selectedProfile.username
                    : `@${selectedProfile.username}`}{" "}
                  {/* Format here too */}
                </h3>
                <div className="text-muted-foreground text-xs">
                  Base Score: {selectedUserHistory.baseScore} | Final Score:{" "}
                  {selectedUserHistory.finalScore}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left">
                      <th className="w-[5%] px-5 py-3">#</th>
                      <th className="px-5 py-3">Event Type</th>
                      <th className="px-5 py-3">Event ID</th>
                      <th className="px-5 py-3">Reputation Change</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-white/60"
                        >
                          Loading history...
                        </td>
                      </tr>
                    ) : (selectedUserHistory.results || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-white/60"
                        >
                          No reputation history found
                        </td>
                      </tr>
                    ) : (
                      (selectedUserHistory.results || []).map(
                        (event: any, i: number) => (
                          <tr
                            key={event.id}
                            className="border-t border-white/10 transition hover:bg-white/5"
                          >
                            <td className="text-muted-foreground px-5 py-4">
                              {i + 1}
                            </td>

                            <td className="px-5 py-4 text-white/80">
                              {getEventTypeText(event.eventType)}
                            </td>

                            <td className="px-5 py-4 text-cyan-300">
                              {event.eventId}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`font-medium ${
                                  event.value >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {event.value >= 0 ? "+" : ""}
                                {event.value}
                              </span>
                            </td>

                            <td className="text-muted-foreground px-5 py-4 text-xs">
                              {formatDate(event.createdAt)}
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <aside className="space-y-2">
          <section className="glass card-cyan max-h-[500px] overflow-y-auto p-5 ring-1 ring-white/10">
            <h3 className="border-b border-white/10 pb-2 text-sm font-semibold text-white/90">
              Reputation Updates
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              {updatesLoading ? (
                <div className="text-center text-white/60">
                  Loading updates...
                </div>
              ) : globalUpdates.length === 0 ? (
                <div className="text-center text-white/60">
                  No recent updates
                </div>
              ) : (
                globalUpdates.map((update) => (
                  <div key={update.id} className="flex items-start gap-2">
                    {update.value >= 0 ? (
                      <Award className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    )}
                    <p>
                      <span className="text-cyan-300">
                        @{update.account.username}
                      </span>
                      {update.value >= 0 ? " earned " : " lost "}
                      <span
                        className={`font-semibold ${update.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {update.value >= 0 ? `+${update.value}` : update.value}
                      </span>
                      {" reputation for "}
                      {getEventTypeText(update.eventType).toLowerCase()}.
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Profile, Trust score, Reputation - Only show when a profile is selected */}
          {selectedProfile ? (
            <>
              <div className="glass card-cyan flex items-center gap-4 p-6 ring-1 ring-white/10">
                {/* Replaced dummy avatar in profile section */}
                <UserAvatar
                  userId={selectedProfile.id.toString()}
                  avatarId={selectedProfile.avatarId || null}
                  username={selectedProfile.username}
                  size="lg"
                />
                <div>
                  <div className="text-muted-foreground text-sm">Profile</div>
                  <div className="font-semibold text-white/90">
                    {selectedProfile.username.startsWith("@")
                      ? selectedProfile.username
                      : `@${selectedProfile.username}`}
                  </div>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-2">
                <div className="glass card-cyan flex items-center justify-between px-6 py-2 ring-1 ring-white/10">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      30d Change
                    </div>
                    <div
                      className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                        delta >= 0
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {delta >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {delta >= 0 ? "+" : ""}
                      {delta}
                    </div>
                  </div>

                  <TrustMeter score={selectedProfile.finalScore || 0} />
                </div>

                <div className="glass card-cyan p-6">
                  <div className="text-muted-foreground">Summary</div>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Agreements
                        </div>
                        <div className="text-lg font-semibold text-white/90">
                          {selectedProfile.agreementsTotal || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Final Score
                        </div>
                        <div className="text-lg font-semibold text-emerald-300">
                          {selectedProfile.finalScore || 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Rank
                        </div>
                        <div className="text-lg font-semibold text-cyan-300">
                          #{selectedProfile.rank || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Total Disputes
                        </div>
                        <div className="text-lg font-semibold text-amber-300">
                          {getTotalDisputes(selectedProfile.disputes)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disputes Breakdown */}
                  {selectedProfile.disputes && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="text-muted-foreground mb-2 text-sm">
                        Disputes Breakdown
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-emerald-400">Won:</span>
                          <span>{selectedProfile.disputes.won || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-400">Lost:</span>
                          <span>{selectedProfile.disputes.lost || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-400">Dismissed:</span>
                          <span>{selectedProfile.disputes.dismissed || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-400">Tie:</span>
                          <span>{selectedProfile.disputes.tie || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cancelled:</span>
                          <span>{selectedProfile.disputes.cancelled || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="glass bg-gradient-to-br from-cyan-500/10 p-8 text-center ring-1 ring-white/10">
              <User className="mx-auto mb-2 h-8 w-8 text-cyan-300" />
              <div className="text-muted-foreground text-sm">
                Select a user from the leaderboard to view their profile
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
