// utils/reputationHelpers.ts
export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getEventTypeText(eventType: number): string {
  const eventTypes: { [key: number]: string } = {
    1: "Agreement completed",
    2: "Dispute won",
    3: "Dispute lost",
    4: "Ruling ignored",
    5: "Successful trade",
    6: "Positive feedback",
    // Add more event types as needed
  };
  return eventTypes[eventType] || `Event ${eventType}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculate30DayChange(events: any[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return events
    .filter((event) => new Date(event.createdAt) >= thirtyDaysAgo)
    .reduce((sum, event) => sum + event.value, 0);
}
