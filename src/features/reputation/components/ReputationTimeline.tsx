// features/reputation/components/ReputationTimeline.tsx
import { useMemo } from "react";
import { getEventTypeDetails } from "../utils/eventTypes";
import { computeCumulativeScores } from "../utils/calculations";
import { formatDateTime } from "../utils/formatters";
import type { ReputationEvent } from "../types";

interface Props {
  events: ReputationEvent[];
}

export function ReputationTimeline({ events }: Props) {
  // Memoized — only recomputes when the events array reference changes
  const eventsWithCumulative = useMemo(
    () => computeCumulativeScores(events),
    [events],
  );

  return (
    <div className="relative max-h-[20rem] overflow-y-auto">
      {/* Vertical timeline rail */}
      <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-cyan-500/20" />

      <div className="space-y-6">
        {eventsWithCumulative.map((event) => {
          const details = getEventTypeDetails(event.eventType);
          const EventIcon = details.icon;

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div
                className={`relative z-10 mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${details.bgColor} ${details.borderColor}`}
              >
                <EventIcon className={`h-5 w-5 ${details.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white/90">{details.text}</h4>
                    <p className="mt-1 text-sm text-white/60">{details.description}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                        details.isPositive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {details.isPositive ? "+" : ""}
                      {event.value}
                    </span>
                    <div className="mt-1 text-xs text-white/50">
                      Total: {event.cumulative}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
                  <span>
                    Event ID: <span className="text-cyan-300">#{event.eventId}</span>
                  </span>
                  <span>•</span>
                  <span>{formatDateTime(event.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
