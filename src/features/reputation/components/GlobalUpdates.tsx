// features/reputation/components/GlobalUpdates.tsx
import { getEventTypeDetails } from "../utils/eventTypes";
import { getDisplayName, isWalletAddress, formatTime } from "../utils/formatters";
import type { GlobalUpdate } from "../types";

interface Props {
  data: GlobalUpdate[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  onLoadMore: () => void;
}

export function GlobalUpdates({ data, loading, loadingMore, hasMore, total, onLoadMore }: Props) {
  return (
    <section className="max-h-[500px] overflow-y-auto rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Recent Reputation Updates</h3>
          {total > 0 && <p className="text-xs text-white/50">Total: {total} updates</p>}
        </div>
        <span className="text-xs text-white/50">Live updates</span>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Spinner />
            <span className="text-sm text-white/60">Loading updates...</span>
          </div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-white/60">No recent updates</p>
        ) : (
          <>
            {data.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}

            {hasMore && (
              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Spinner />
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
  );
}

function UpdateCard({ update }: { update: GlobalUpdate }) {
  const details = getEventTypeDetails(update.eventType);
  const EventIcon = details.icon;
  const displayName = getDisplayName(update.account.username);
  const isWallet = isWalletAddress(update.account.username);

  return (
    <div className="rounded-lg border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-3">
      <div className="flex items-start gap-3">
        <div className={`rounded-lg ${details.bgColor} p-2`}>
          <EventIcon className={`h-4 w-4 ${details.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className="font-medium text-cyan-300 truncate"
              title={isWallet ? update.account.username : undefined}
            >
              {displayName}
            </span>
            <span
              className={`shrink-0 text-sm font-semibold ${
                details.isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {details.isPositive ? "+" : ""}
              {update.value}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/60">{details.text}</p>
          <p className="mt-2 text-xs text-white/40">{formatTime(update.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
  );
}
