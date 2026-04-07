// features/reputation/types.ts

export interface ReputationEvent {
  id: number;
  eventType: number;
  value: number;
  eventId: string;
  createdAt: string;
}

export interface AccountReputation {
  id: number;
  username: string;
  avatarId: number;
}

export interface ReputationHistoryResponse {
  total: number;
  totalResults: number;
  baseScore: number;
  finalScore: number;
  results: ReputationEvent[];
  hasMore: boolean;
}

export interface DisputesStats {
  won: number;
  lost: number;
  dismissed: number;
  tie: number;
  cancelled: number;
}

export interface LeaderboardAccount {
  id: number;
  username: string;
  avatarId: number;
  finalScore: number;
  baseScore: number;
  rank: number;
  agreementsTotal: number;
  disputes: DisputesStats;
  lastEvents: ReputationEvent[];
}

export interface GlobalUpdate {
  id: number;
  account: AccountReputation;
  eventType: number;
  value: number;
  eventId: number;
  createdAt: string;
}

export interface GlobalUpdatesResponse {
  total: number;
  totalResults: number;
  results: GlobalUpdate[];
}

export type SortDirection = "asc" | "desc";
