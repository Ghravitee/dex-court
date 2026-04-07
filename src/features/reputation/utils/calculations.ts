// features/reputation/utils/calculations.ts
import type { ReputationEvent, DisputesStats } from "../types";

/**
 * Sums reputation event values from the last 30 days.
 */
export function calculate30DayChange(events: ReputationEvent[]): number {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return events.reduce((sum, event) => {
    return new Date(event.createdAt).getTime() >= cutoff
      ? sum + event.value
      : sum;
  }, 0);
}

/**
 * Returns the total number of disputes across all outcomes.
 */
export function getTotalDisputes(disputes: DisputesStats | undefined): number {
  if (!disputes) return 0;
  return disputes.won + disputes.lost + disputes.dismissed + disputes.tie + disputes.cancelled;
}

/**
 * Computes a running cumulative score for a sorted list of events.
 * Events are assumed to be in descending date order (newest first).
 * The cumulative is computed in reverse so it reflects chronological accumulation.
 */
export function computeCumulativeScores(
  events: ReputationEvent[],
): (ReputationEvent & { cumulative: number })[] {
  // Work chronologically (oldest first) to build cumulative, then reverse
  const chronological = [...events].reverse();
  let running = 0;
  const withCumulative = chronological.map((event) => {
    running += event.value;
    return { ...event, cumulative: running };
  });
  // Return in original order (newest first)
  return withCumulative.reverse();
}
