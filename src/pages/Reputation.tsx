/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/Reputation.tsx
import { useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  User,
  // Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Shield,
  Star,
  Ban,
  Award as AwardIcon,
  FileCheck,
  Wallet,
  // Handshake,
  ThumbsUp,
  ThumbsDown,
  // Timer,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

// Import our separated modules
import TrustMeter from "../components/TrustMeter";
import { UserAvatar } from "../components/UserAvatar";
import {
  useLeaderboard as useCustomLeaderboard,
  useGlobalUpdates as useCustomGlobalUpdates,
  useReputationHistory as useCustomReputationHistory,
} from "../hooks/useReputation";
import type { DisputesStats } from "../services/ReputationServices";
import { calculate30DayChange } from "../lib/reputationHelpers";

// Reputation Event Type Enum
const ReputationEventTypeEnum = {
  TelegramVerified: 1,
  AgreementCompleted: 2,
  AgreementEscrowCompleted: 3,
  DisputeWon: 4,
  VotedWinningOutcome: 5,
  WitnessEvery5Comments: 6,
  JudgeWinningVote: 7,
  JudgeCommentAdded: 8,
  FirstJudgeToVote: 9,
  FirstCommunityToVote: 10,
  CommunityVoteLost: 50,
  JudgeVoteLost: 51,
  DisputeLostRegular: 52,
  DisputeLostEscrow: 53,
  LateDelivery: 54,
  FrequentCancellationsBanned: 55,
  SpamAgreementsTempBan: 56,
};

// Helper function to get event type details
const getEventTypeDetails = (eventType: number) => {
  switch (eventType) {
    // POSITIVE EVENTS (1-10)
    case ReputationEventTypeEnum.TelegramVerified:
      return {
        text: "Telegram Verified",
        icon: CheckCircle,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-400/30",
        description: "Linked and verified Telegram account",
        isPositive: true,
      };
    case ReputationEventTypeEnum.AgreementCompleted:
      return {
        text: "Agreement Completed",
        icon: FileCheck,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-400/30",
        description: "Successfully completed a reputational agreement",
        isPositive: true,
      };
    case ReputationEventTypeEnum.AgreementEscrowCompleted:
      return {
        text: "Escrow Agreement Completed",
        icon: Wallet,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-400/30",
        description: "Successfully completed an escrow-protected agreement",
        isPositive: true,
      };
    case ReputationEventTypeEnum.DisputeWon:
      return {
        text: "Dispute Won",
        icon: AwardIcon,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-400/30",
        description: "Won a dispute resolution",
        isPositive: true,
      };
    case ReputationEventTypeEnum.VotedWinningOutcome:
      return {
        text: "Voted Winning Outcome",
        icon: ThumbsUp,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-400/30",
        description: "Voted for the winning outcome in a dispute",
        isPositive: true,
      };
    case ReputationEventTypeEnum.WitnessEvery5Comments:
      return {
        text: "Witness Contribution",
        icon: MessageSquare,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-400/30",
        description: "Provided valuable witness comments (every 5 comments)",
        isPositive: true,
      };
    case ReputationEventTypeEnum.JudgeWinningVote:
      return {
        text: "Judge Winning Vote",
        icon: Shield,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-400/30",
        description: "As a judge, voted for the winning outcome",
        isPositive: true,
      };
    case ReputationEventTypeEnum.JudgeCommentAdded:
      return {
        text: "Judge Comment Added",
        icon: MessageSquare,
        color: "text-violet-400",
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-400/30",
        description: "Added insightful comments as a judge",
        isPositive: true,
      };
    case ReputationEventTypeEnum.FirstJudgeToVote:
      return {
        text: "First Judge to Vote",
        icon: Star,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-400/30",
        description: "Was the first judge to vote in a dispute",
        isPositive: true,
      };
    case ReputationEventTypeEnum.FirstCommunityToVote:
      return {
        text: "First Community to Vote",
        icon: Star,
        color: "text-pink-400",
        bgColor: "bg-pink-500/10",
        borderColor: "border-pink-400/30",
        description: "Was the first community member to vote in a dispute",
        isPositive: true,
      };

    // NEGATIVE EVENTS (50+)
    case ReputationEventTypeEnum.CommunityVoteLost:
      return {
        text: "Community Vote Lost",
        icon: ThumbsDown,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-400/30",
        description: "Voted for losing outcome as community member",
        isPositive: false,
      };
    case ReputationEventTypeEnum.JudgeVoteLost:
      return {
        text: "Judge Vote Lost",
        icon: ThumbsDown,
        color: "text-rose-400",
        bgColor: "bg-rose-500/10",
        borderColor: "border-rose-400/30",
        description: "Voted for losing outcome as judge",
        isPositive: false,
      };
    case ReputationEventTypeEnum.DisputeLostRegular:
      return {
        text: "Dispute Lost (Regular)",
        icon: XCircle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-400/30",
        description: "Lost a regular dispute",
        isPositive: false,
      };
    case ReputationEventTypeEnum.DisputeLostEscrow:
      return {
        text: "Dispute Lost (Escrow)",
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-600/10",
        borderColor: "border-red-500/30",
        description: "Lost an escrow dispute",
        isPositive: false,
      };
    case ReputationEventTypeEnum.LateDelivery:
      return {
        text: "Late Delivery",
        icon: Clock,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-400/30",
        description: "Delivered agreement services late",
        isPositive: false,
      };
    case ReputationEventTypeEnum.FrequentCancellationsBanned:
      return {
        text: "Frequent Cancellations",
        icon: Ban,
        color: "text-gray-400",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-400/30",
        description: "Temporarily banned for frequent agreement cancellations",
        isPositive: false,
      };
    case ReputationEventTypeEnum.SpamAgreementsTempBan:
      return {
        text: "Spam Agreements",
        icon: AlertCircle,
        color: "text-gray-500",
        bgColor: "bg-gray-600/10",
        borderColor: "border-gray-500/30",
        description: "Temporarily banned for creating spam agreements",
        isPositive: false,
      };
    default:
      return {
        text: "Unknown Event",
        icon: AlertTriangle,
        color: "text-gray-400",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-400/30",
        description: "Unknown reputation event",
        isPositive: eventType <= 10, // Assume positive if 1-10
      };
  }
};

// Helper function to format username
const formatUsername = (username: string): string => {
  if (!username) return "Anonymous";

  // Check if it's a wallet address (starts with 0x and has length)
  if (username.startsWith("0x") && username.length >= 42) {
    // Truncate wallet address: first 6 chars + ... + last 4 chars
    return `${username.slice(0, 6)}...${username.slice(-4)}`;
  }

  // For regular usernames, remove @ if present at the beginning
  const cleanUsername = username.startsWith("@") ? username.slice(1) : username;

  // Return without @ prefix as requested
  return cleanUsername;
};

// Helper function to get display name with @ for non-wallet usernames
const getDisplayName = (username: string): string => {
  if (!username) return "@Anonymous";

  // Check if it's a wallet address
  if (username.startsWith("0x") && username.length >= 42) {
    // Return truncated without @
    return formatUsername(username);
  }

  // For regular usernames, add @ if not already present
  return username.startsWith("@") ? username : `@${username}`;
};

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

// Reputation History Timeline Component
const ReputationTimeline = ({ events }: { events: any[] }) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const calculateCumulativeScore = () => {
    let cumulative = 0;
    return sortedEvents.map((event) => {
      cumulative += event.value;
      return { ...event, cumulative };
    });
  };

  const eventsWithCumulative = calculateCumulativeScore();

  return (
    <div className="relative max-h-[20rem] overflow-y-auto">
      {/* Timeline line */}
      <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-cyan-500/20" />

      <div className="space-y-6">
        {eventsWithCumulative.map((event) => {
          const eventDetails = getEventTypeDetails(event.eventType);
          const EventIcon = eventDetails.icon;
          const isPositive = eventDetails.isPositive;

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div
                className={`relative z-10 mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${eventDetails.bgColor} border-2 ${eventDetails.borderColor}`}
              >
                <EventIcon className={`h-5 w-5 ${eventDetails.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white/90">
                      {eventDetails.text}
                    </h4>
                    <p className="mt-1 text-sm text-white/60">
                      {eventDetails.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                        isPositive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {event.value}
                    </span>
                    <div className="mt-1 text-xs text-white/50">
                      Total: {event.cumulative}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
                  <span>
                    Event ID:{" "}
                    <span className="text-cyan-300">#{event.eventId}</span>
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(event.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Reputation() {
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("timeline");

  const {
    data: leaderboardData = [],
    loading: leaderboardLoading,
    loadingMore: leaderboardLoadingMore,
    error: leaderboardError,
    loadMore: loadMoreLeaderboard,
    hasMore: leaderboardHasMore,
  } = useCustomLeaderboard(sortDir, query, 10); // Added limit parameter

  const {
    data: globalUpdatesData = [],
    loading: updatesLoading,
    loadingMore: updatesLoadingMore,
    error: updatesError,
    loadMore: loadMoreGlobalUpdates,
    hasMore: updatesHasMore,
    total: updatesTotal,
  } = useCustomGlobalUpdates(5);

  // Use your custom reputation history hook with load more functionality
  const {
    data: selectedUserHistory,
    loading: historyLoading,
    loadingMore: historyLoadingMore,
    error: historyError,
    loadMoreHistory,
    hasMore: historyHasMore,
  } = useCustomReputationHistory(selectedProfile?.id?.toString() || null);

  // const globalUpdates = globalUpdatesData?.results || [];

  const getEventsShownInfo = () => {
    if (!selectedUserHistory) return "";
    const totalShown = selectedUserHistory.results?.length || 0;
    const total = selectedUserHistory.total || 0;
    return `Showing ${totalShown} of ${total} events`;
  };

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
        <div className="card-cyan p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-400" />
          <h3 className="mb-2 text-lg font-semibold text-white/90">
            Error Loading Data
          </h3>
          <p className="text-white/70">{error}</p>
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
        <div>
          <h2 className="space text-xl font-semibold text-white/90">
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
            className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm outline-none focus:border-cyan-400/40"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leaderboard */}
          <section className="rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3 className="space font-semibold text-white/90">
                  Reputation Leaderboard
                </h3>
                <div className="text-muted-foreground text-xs">
                  Top users ranked by reputation score
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
                        <div className="flex items-center justify-center">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                          <span className="ml-2">Loading leaderboard...</span>
                        </div>
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

                      const displayName = getDisplayName(user.username);
                      const formattedUsername = formatUsername(user.username);

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
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.rank}</span>
                              {user.rank <= 3 && (
                                <AwardIcon
                                  className={`h-4 w-4 ${
                                    user.rank === 1
                                      ? "text-yellow-400"
                                      : user.rank === 2
                                        ? "text-gray-300"
                                        : "text-amber-600"
                                  }`}
                                />
                              )}
                            </div>
                          </td>

                          <td className="hover flex items-center gap-3 px-5 py-4">
                            <UserAvatar
                              userId={user.id.toString()}
                              avatarId={user.avatarId || null}
                              username={formattedUsername}
                              size="md"
                            />
                            <div>
                              <Link
                                to={`/profile/${formattedUsername.replace("@", "")}`}
                                className="text-white transition hover:text-cyan-500 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                                title={
                                  user.username.startsWith("0x")
                                    ? user.username
                                    : undefined
                                }
                              >
                                {displayName}
                              </Link>
                              {recentChange !== 0 && (
                                <div
                                  className={`text-xs ${
                                    recentChange > 0
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {recentChange > 0 ? "↗" : "↘"}{" "}
                                  {recentChange > 0 ? "+" : ""}
                                  {recentChange} recently
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {renderDisputesBreakdown(user.disputes)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.agreementsTotal || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="relative font-semibold text-white/90">
                                {user.finalScore || 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {leaderboardHasMore && (
              <div className="flex justify-center border-t border-white/10 p-4">
                <button
                  onClick={loadMoreLeaderboard}
                  disabled={leaderboardLoadingMore}
                  className="flex items-center gap-2 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
                >
                  {leaderboardLoadingMore ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                      Loading more users...
                    </>
                  ) : (
                    "Load More Users"
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Reputation History - Only show when a profile is selected */}
          {selectedProfile && selectedUserHistory && (
            <section className="rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-5">
              <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-semibold text-white/90">
                    Reputation History for{" "}
                    {getDisplayName(selectedProfile.username)}
                  </h3>
                  <div className="text-muted-foreground text-xs">
                    {getEventsShownInfo()} • Base Score:{" "}
                    {selectedUserHistory.baseScore} → Final Score:{" "}
                    {selectedUserHistory.finalScore}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-white/50">View:</div>
                  <div className="flex rounded-lg border border-white/10 p-1">
                    <button
                      onClick={() => setViewMode("timeline")}
                      className={`rounded px-3 py-1 text-xs ${
                        viewMode === "timeline"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Timeline
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`rounded px-3 py-1 text-xs ${
                        viewMode === "table"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                    <span className="ml-2 text-cyan-300">
                      Loading reputation history...
                    </span>
                  </div>
                ) : (selectedUserHistory.results || []).length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mb-2 text-lg text-cyan-300">
                      No reputation history yet
                    </div>
                    <div className="text-sm text-white/50">
                      Complete agreements, participate in disputes, or verify
                      your account to start building reputation.
                    </div>
                  </div>
                ) : viewMode === "table" ? (
                  <>
                    <div className="max-h-[20rem] overflow-x-auto overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-left">
                            <th className="w-[5%] px-4 py-3">#</th>
                            <th className="px-4 py-3">Event Type</th>
                            <th className="px-4 py-3">Event ID</th>
                            <th className="px-4 py-3">Reputation Change</th>
                            <th className="px-4 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedUserHistory.results || []).map(
                            (event: any, i: number) => {
                              const eventDetails = getEventTypeDetails(
                                event.eventType,
                              );
                              const isPositive = eventDetails.isPositive;

                              return (
                                <tr
                                  key={event.id}
                                  className="border-t border-white/10 transition hover:bg-white/5"
                                >
                                  <td className="text-muted-foreground px-4 py-4">
                                    {i + 1}
                                  </td>

                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                      <eventDetails.icon
                                        className={`h-4 w-4 ${eventDetails.color}`}
                                      />
                                      <span className="text-white/80">
                                        {eventDetails.text}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="px-4 py-4 text-cyan-300">
                                    #{event.eventId}
                                  </td>

                                  <td className="px-4 py-4">
                                    <span
                                      className={`font-medium ${
                                        isPositive
                                          ? "text-emerald-400"
                                          : "text-rose-400"
                                      }`}
                                    >
                                      {isPositive ? "+" : ""}
                                      {event.value}
                                    </span>
                                  </td>

                                  <td className="text-muted-foreground px-4 py-4 text-xs">
                                    {new Date(
                                      event.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                    <div className="text-white/40">
                                      {new Date(
                                        event.createdAt,
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Load More Button for Table View */}
                    {historyHasMore && (
                      <div className="mt-4 flex justify-center border-t border-white/10 pt-4">
                        <button
                          onClick={loadMoreHistory}
                          disabled={historyLoadingMore}
                          className="flex items-center gap-2 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
                        >
                          {historyLoadingMore ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                              Loading more events...
                            </>
                          ) : (
                            "Load More Events"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <ReputationTimeline
                      events={selectedUserHistory.results || []}
                    />

                    {/* Load More Button for Timeline View */}
                    {historyHasMore && (
                      <div className="mt-4 flex justify-center border-t border-white/10 pt-4">
                        <button
                          onClick={loadMoreHistory}
                          disabled={historyLoadingMore}
                          className="flex items-center gap-2 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
                        >
                          {historyLoadingMore ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                              Loading more events...
                            </>
                          ) : (
                            "Load More Events"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <aside className="space-y-2">
          {/* <section className="glass card-cyan max-h-[500px] overflow-y-auto p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-semibold text-white/90">
                Recent Reputation Updates
              </h3>
              <span className="text-xs text-white/50">Live updates</span>
            </div>

            <div className="mt-4 space-y-4">
              {updatesLoading && !updatesLoadingMore ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-white/60">
                    Loading updates...
                  </span>
                </div>
              ) : globalUpdatesData.length === 0 ? (
                <div className="py-8 text-center text-white/60">
                  No recent updates
                </div>
              ) : (
                globalUpdatesData.map((update) => {
                  const eventDetails = getEventTypeDetails(update.eventType);
                  const EventIcon = eventDetails.icon;
                  const isPositive = eventDetails.isPositive;
                  const displayName = getDisplayName(update.account.username);

                  return (
                    <div
                      key={update.id}
                      className="rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-lg ${eventDetails.bgColor} p-2`}
                        >
                          <EventIcon
                            className={`h-4 w-4 ${eventDetails.color}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div
                              className="font-medium text-cyan-300"
                              title={
                                update.account.username.startsWith("0x")
                                  ? update.account.username
                                  : undefined
                              }
                            >
                              {displayName}
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                isPositive
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {update.value}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-white/60">
                            {eventDetails.text}
                          </p>
                          <div className="mt-2 text-xs text-white/40">
                            {new Date(update.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section> */}

          <section className="max-h-[500px] overflow-y-auto rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-white/90">
                  Recent Reputation Updates
                </h3>
                <div className="text-xs text-white/50">
                  {updatesTotal > 0 && `Total: ${updatesTotal} updates`}
                </div>
              </div>
              <span className="text-xs text-white/50">Live updates</span>
            </div>

            <div className="mt-4 space-y-4">
              {updatesLoading && !updatesLoadingMore ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-white/60">
                    Loading updates...
                  </span>
                </div>
              ) : globalUpdatesData.length === 0 ? (
                <div className="py-8 text-center text-white/60">
                  No recent updates
                </div>
              ) : (
                <>
                  {globalUpdatesData.map((update) => {
                    const eventDetails = getEventTypeDetails(update.eventType);
                    const EventIcon = eventDetails.icon;
                    const isPositive = eventDetails.isPositive;
                    const displayName = getDisplayName(update.account.username);

                    return (
                      <div
                        key={update.id}
                        className="rounded-lg border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-lg ${eventDetails.bgColor} p-2`}
                          >
                            <EventIcon
                              className={`h-4 w-4 ${eventDetails.color}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div
                                className="font-medium text-cyan-300"
                                title={
                                  update.account.username.startsWith("0x")
                                    ? update.account.username
                                    : undefined
                                }
                              >
                                {displayName}
                              </div>
                              <span
                                className={`text-sm font-semibold ${
                                  isPositive
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {isPositive ? "+" : ""}
                                {update.value}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-white/60">
                              {eventDetails.text}
                            </p>
                            <div className="mt-2 text-xs text-white/40">
                              {new Date(update.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Load More button for global updates */}
                  {updatesHasMore && (
                    <div className="border-t border-white/10 pt-4">
                      <button
                        onClick={loadMoreGlobalUpdates}
                        disabled={updatesLoadingMore}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
                      >
                        {updatesLoadingMore ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                            Loading more updates...
                          </>
                        ) : (
                          "Load More Updates"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Profile, Trust score, Reputation - Only show when a profile is selected */}
          {selectedProfile ? (
            <>
              <div className="flex items-center gap-4 rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <UserAvatar
                  userId={selectedProfile.id.toString()}
                  avatarId={selectedProfile.avatarId || null}
                  username={formatUsername(selectedProfile.username)}
                  size="lg"
                />
                <div className="flex-1">
                  <div className="text-muted-foreground text-sm">
                    Selected Profile
                  </div>
                  <div
                    className="truncate font-semibold text-white/90"
                    title={
                      selectedProfile.username.startsWith("0x")
                        ? selectedProfile.username
                        : undefined
                    }
                  >
                    {getDisplayName(selectedProfile.username)}
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Rank #{selectedProfile.rank || "N/A"}
                  </div>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent px-6 py-2">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      30-Day Change
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

                <div className="rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                  <div className="text-muted-foreground">Profile Summary</div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Agreements
                        </div>
                        <div className="text-lg font-semibold text-white/90">
                          {selectedProfile.agreementsTotal || 0}
                        </div>
                        {/* <div className="text-xs text-white/50">
                          {selectedProfile.agreementsCompleted || 0} completed
                        </div> */}
                      </div>
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Final Score
                        </div>
                        <div className="text-lg font-semibold text-emerald-300">
                          {selectedProfile.finalScore || 0}
                        </div>
                        <div className="text-xs text-white/50">
                          Base: {selectedProfile.baseScore || 50}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Rank
                        </div>
                        <div className="text-lg font-semibold text-cyan-300">
                          #{selectedProfile.rank || "N/A"}
                        </div>
                        <div className="text-xs text-white/50">
                          Global position
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Total Disputes
                        </div>
                        <div className="text-lg font-semibold text-amber-300">
                          {getTotalDisputes(selectedProfile.disputes)}
                        </div>
                        <div className="text-xs text-white/50">
                          Resolved cases
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disputes Breakdown */}
                  {selectedProfile.disputes && (
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <div className="text-muted-foreground mb-3 text-sm">
                        Disputes Breakdown
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center justify-between rounded bg-emerald-500/10 px-3 py-2">
                          <span className="text-emerald-400">Won</span>
                          <span className="font-medium">
                            {selectedProfile.disputes.won || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded bg-red-500/10 px-3 py-2">
                          <span className="text-red-400">Lost</span>
                          <span className="font-medium">
                            {selectedProfile.disputes.lost || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded bg-amber-500/10 px-3 py-2">
                          <span className="text-amber-400">Dismissed</span>
                          <span className="font-medium">
                            {selectedProfile.disputes.dismissed || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded bg-cyan-500/10 px-3 py-2">
                          <span className="text-cyan-400">Tie</span>
                          <span className="font-medium">
                            {selectedProfile.disputes.tie || 0}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between rounded bg-gray-500/10 px-3 py-2">
                          <span className="text-gray-400">Cancelled</span>
                          <span className="font-medium">
                            {selectedProfile.disputes.cancelled || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="glass bg-gradient-to-br from-cyan-500/10 p-8 text-center ring-1 ring-white/10">
              <User className="mx-auto mb-3 h-10 w-10 text-cyan-300" />
              <h4 className="mb-2 font-medium text-white/90">Select a User</h4>
              <p className="text-muted-foreground text-sm">
                Click on any user from the leaderboard to view their detailed
                reputation profile and history
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
