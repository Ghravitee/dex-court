// features/reputation/components/ReputationHistory.tsx
import { getEventTypeDetails } from "../utils/eventTypes";
import {
  formatShortDate,
  formatTime,
  getDisplayName,
} from "../utils/formatters";
import { ReputationTimeline } from "./ReputationTimeline";
import type { ReputationHistoryResponse, ReputationEvent } from "../types";

import { AppLink } from "../../../components/AppLink";

interface Props {
  profile: { username: string };
  history: ReputationHistoryResponse;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  eventsShown: number;
  viewMode: "timeline" | "table";
  onViewModeChange: (mode: "timeline" | "table") => void;
  onLoadMore: () => void;
}

export function ReputationHistory({
  profile,
  history,
  loading,
  loadingMore,
  hasMore,
  eventsShown,
  viewMode,
  onViewModeChange,
  onLoadMore,
}: Props) {
  const events = history.results ?? [];

  return (
    <section className="rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-3">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 p-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="">
            Reputation History for{" "}
            <AppLink
              to={`/profile/${profile.username}`}
              className="text-cyan-300 transition hover:text-cyan-400 hover:underline"
            >
              {getDisplayName(profile.username)}
            </AppLink>
          </h2>
          <p className="text-xs text-white/50">
            Showing {eventsShown} of {history.total} events · Base:{" "}
            {history.baseScore} → Final: {history.finalScore}
          </p>
        </div>

        <ViewToggle current={viewMode} onChange={onViewModeChange} />
      </div>

      {/* Body */}
      <div className="p-3">
        {loading ? (
          <CenteredSpinner label="Loading reputation history..." />
        ) : events.length === 0 ? (
          <EmptyHistory />
        ) : viewMode === "table" ? (
          <HistoryTable events={events} />
        ) : (
          <ReputationTimeline events={events} />
        )}

        {hasMore && !loading && (
          <LoadMoreButton loading={loadingMore} onClick={onLoadMore} />
        )}
      </div>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ViewToggle({
  current,
  onChange,
}: {
  current: "timeline" | "table";
  onChange: (mode: "timeline" | "table") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50">View:</span>
      <div className="flex rounded-lg border border-white/10 p-1">
        {(["timeline", "table"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`rounded px-3 py-1 text-xs capitalize transition ${
              current === mode
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-white/60 hover:text-white"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryTable({ events }: { events: ReputationEvent[] }) {
  return (
    <div className="max-h-[20rem] overflow-x-auto overflow-y-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-white/50">
            <th className="w-[5%] px-4 py-3">#</th>
            <th className="px-4 py-3">Event Type</th>
            {/* <th className="px-4 py-3">Event ID</th> */}
            <th className="px-4 py-3">Change</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => {
            const details = getEventTypeDetails(event.eventType);
            return (
              <tr
                key={event.id}
                className="border-t border-white/10 hover:bg-white/5"
              >
                <td className="px-4 py-4 text-white/50">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <details.icon className={`h-4 w-4 ${details.color}`} />
                    <span className="text-white/80">{details.text}</span>
                  </div>
                </td>
                {/* <td className="px-4 py-4 text-cyan-300">#{event.eventId}</td> */}
                <td className="px-4 py-4">
                  <span
                    className={`font-medium ${
                      details.isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {details.isPositive ? "+" : ""}
                    {event.value}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-white/50">
                  {formatShortDate(event.createdAt)}
                  <div className="text-white/40">
                    {formatTime(event.createdAt)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="py-8 text-center">
      <div className="mb-2 text-lg text-cyan-300">
        No reputation history yet
      </div>
      <p className="text-sm text-white/50">
        Complete agreements, participate in disputes, or verify your account to
        start building reputation.
      </p>
    </div>
  );
}

function LoadMoreButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-4 flex justify-center border-t border-white/10 pt-4">
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Spinner />
            Loading more events...
          </>
        ) : (
          "Load More Events"
        )}
      </button>
    </div>
  );
}

function CenteredSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Spinner />
      <span className="text-cyan-300">{label}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
  );
}
