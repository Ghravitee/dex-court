// features/reputation/index.ts
// Public API for the reputation feature — import from here, not from internals

export { default as ReputationPage } from "./components/ReputationPage";

// Hooks (if other features need them)
export { useLeaderboard } from "./hooks/useLeaderboard";
export { useGlobalUpdates } from "./hooks/useGlobalUpdates";
export { useReputationHistory } from "./hooks/useReputationHistory";

// Utils (if needed outside the feature)
export { getEventTypeDetails } from "./utils/eventTypes";
export { formatUsername, getDisplayName, isWalletAddress } from "./utils/formatters";
export { calculate30DayChange, getTotalDisputes } from "./utils/calculations";

// Types
export type {
  ReputationEvent,
  ReputationHistoryResponse,
  LeaderboardAccount,
  GlobalUpdate,
  GlobalUpdatesResponse,
  DisputesStats,
  SortDirection,
} from "./types";
