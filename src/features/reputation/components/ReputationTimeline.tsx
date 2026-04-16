// // features/reputation/components/ReputationTimeline.tsx
// import { useMemo } from "react";
// import { getEventTypeDetails } from "../utils/eventTypes";
// import { computeCumulativeScores } from "../utils/calculations";
// import { formatDateTime } from "../utils/formatters";
// import type { ReputationEvent } from "../types";

// interface Props {
//   events: ReputationEvent[];
// }

// export function ReputationTimeline({ events }: Props) {
//   // Memoized — only recomputes when the events array reference changes
//   const eventsWithCumulative = useMemo(
//     () => computeCumulativeScores(events),
//     [events],
//   );

//   return (
//     <div className="relative max-h-[20rem] overflow-y-auto">
//       {/* Vertical timeline rail */}
//       <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-cyan-500/20" />

//       <div className="space-y-6">
//         {eventsWithCumulative.map((event) => {
//           const details = getEventTypeDetails(event.eventType);
//           const EventIcon = details.icon;

//           return (
//             <div key={event.id} className="relative flex gap-4">
//               {/* Timeline dot */}
//               <div
//                 className={`relative z-0 mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${details.bgColor} ${details.borderColor}`}
//               >
//                 <EventIcon className={`h-5 w-5 ${details.color}`} />
//               </div>

//               {/* Content */}
//               <div className="flex-1 pb-6">
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <h4 className="font-medium text-white/90">
//                       {details.text}
//                     </h4>
//                     <p className="mt-1 text-sm text-white/60">
//                       {details.description}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <span
//                       className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
//                         details.isPositive
//                           ? "bg-emerald-500/20 text-emerald-300"
//                           : "bg-red-500/20 text-red-300"
//                       }`}
//                     >
//                       {details.isPositive ? "+" : ""}
//                       {event.value}
//                     </span>
//                     <div className="mt-1 text-xs text-white/50">
//                       Total: {event.cumulative}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
//                   <span>
//                     Event ID:{" "}
//                     <span className="text-cyan-300">#{event.eventId}</span>
//                   </span>
//                   <span>•</span>
//                   <span>{formatDateTime(event.createdAt)}</span>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// features/reputation/components/ReputationTimeline.tsx
import { useMemo } from "react";
import { getEventTypeDetails } from "../utils/eventTypes";
import { computeCumulativeScores } from "../utils/calculations";
import { formatShortDate, formatTime } from "../utils/formatters";
import type { ReputationEvent } from "../types";

interface Props {
  events: ReputationEvent[];
}

export function ReputationTimeline({ events }: Props) {
  const eventsWithCumulative = useMemo(
    () => computeCumulativeScores(events),
    [events],
  );

  return (
    <div className="relative max-h-[20rem] overflow-y-auto">
      <div className="tl-wrap relative pl-10">
        {/* Rail — spans full content height, not the scroll window */}
        <div className="absolute top-6 bottom-0 left-[1.375rem] w-0.5 bg-gradient-to-b from-cyan-500/40 to-cyan-500/5" />

        <div className="space-y-0">
          {eventsWithCumulative.map((event, index) => {
            const details = getEventTypeDetails(event.eventType);
            const EventIcon = details.icon;
            const isLast = index === eventsWithCumulative.length - 1;

            return (
              <div
                key={event.id}
                className={`relative ${isLast ? "pb-0" : "pb-5"}`}
              >
                {/* Dot */}
                <div
                  className={`absolute top-0.5 -left-10 z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${details.bgColor} ${details.borderColor}`}
                >
                  <EventIcon className={`h-5 w-5 ${details.color}`} />
                </div>

                {/* Card */}
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-white/90">
                        {details.text}
                      </h4>
                      <p className="mt-0.5 text-xs text-white/50">
                        {details.description}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        details.isPositive
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {details.isPositive ? "+" : ""}
                      {event.value}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                    <span>
                      Total:{" "}
                      <span className="text-white/60">{event.cumulative}</span>
                    </span>
                    {/* <span>•</span>
                    <span>
                      Event ID:{" "}
                      <span className="text-cyan-300">#{event.eventId}</span>
                    </span> */}
                    <span>•</span>
                    <span>
                      {formatShortDate(event.createdAt)} ·{" "}
                      {formatTime(event.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
