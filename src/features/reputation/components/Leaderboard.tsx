// features/reputation/components/Leaderboard.tsx
import { TrendingDown, TrendingUp, Award } from "lucide-react";
import { UserAvatar } from "../../../components/UserAvatar";
import { formatUsername, getDisplayName } from "../utils/formatters";
import { DisputesBreakdown } from "./DisputesBreakdown";
import type { LeaderboardAccount, SortDirection } from "../types";
import { AppLink } from "../../../components/AppLink";

interface Props {
  data: LeaderboardAccount[];
  loading: boolean;
  sortDir: SortDirection;
  onSortToggle: () => void;
  onRowClick: (user: LeaderboardAccount) => void;
  selectedId?: number;
}

export function Leaderboard({
  data,
  loading,
  sortDir,
  onSortToggle,
  onRowClick,
  selectedId,
}: Props) {
  return (
    <section className="rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div>
          <h3 className="font-semibold text-white/90">
            Reputation Leaderboard
          </h3>
          <p className="text-xs text-white/50">
            Top users ranked by reputation score
          </p>
        </div>
        <button
          onClick={onSortToggle}
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

      <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-white/50">
              <th className="w-[5%] px-5 py-3">Rank</th>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Disputes</th>
              <th className="px-5 py-3 text-center">Agreements</th>
              <th className="px-5 py-3 text-right">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={5} message="Loading leaderboard..." />
            ) : data.length === 0 ? (
              <EmptyRow colSpan={5} message="No users found" />
            ) : (
              data.map((user) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  isSelected={selectedId === user.id}
                  onClick={() => onRowClick(user)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* {hasMore && (
        <div className="flex justify-center border-t border-white/10 p-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Spinner />
                Loading more users...
              </>
            ) : (
              "Load More Users"
            )}
          </button>
        </div>
      )} */}
    </section>
  );
}

function LeaderboardRow({
  user,
  isSelected,
  onClick,
}: {
  user: LeaderboardAccount;
  isSelected: boolean;
  onClick: () => void;
}) {
  const recentChange = (user.lastEvents ?? []).reduce(
    (sum, event) => sum + event.value,
    0,
  );
  const displayName = getDisplayName(user.username);
  const formattedUsername = formatUsername(user.username);

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-t border-white/10 transition hover:bg-white/5 ${
        isSelected ? "bg-cyan-500/10 ring-1 ring-cyan-400/30" : ""
      }`}
    >
      <td className="px-5 py-4 text-white/50">
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.rank}</span>
          {user.rank <= 3 && (
            <Award
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

      <td className="flex items-center gap-3 px-5 py-4">
        <UserAvatar
          userId={user.id.toString()}
          avatarId={user.avatarId ?? null}
          username={formattedUsername}
          size="md"
        />
        <div>
          <AppLink
            to={`/profile/${user.username}`} // full address, no slicing
            className="text-white transition hover:text-cyan-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {displayName} {/* truncated via getDisplayName */}
          </AppLink>
          {recentChange !== 0 && (
            <div
              className={`text-xs ${recentChange > 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {recentChange > 0 ? "↗ +" : "↘ "}
              {recentChange}
            </div>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <DisputesBreakdown disputes={user.disputes} />
      </td>

      <td className="px-5 py-4 text-center">
        <span className="font-medium">{user.agreementsTotal ?? 0}</span>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="font-semibold text-white/90">
          {user.finalScore ?? 0}
        </span>
      </td>
    </tr>
  );
}

function LoadingRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-8 text-center text-white/60">
        <div className="flex items-center justify-center gap-2">
          <Spinner />
          {message}
        </div>
      </td>
    </tr>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-8 text-center text-white/60">
        {message}
      </td>
    </tr>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
  );
}
