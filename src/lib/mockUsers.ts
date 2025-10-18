// lib/mockUsers.ts
export interface User {
  id: string;
  handle: string;
  wallet: string;
  trustScore: number;
  roles: {
    judge: boolean;
    community: boolean;
    user: boolean;
  };
  stats: {
    deals: number;
    agreements: number;
    disputes: number;
    disputesWon: number;
    disputesLost: number;
    ignoredRulings: number;
    revenue: {
      "7d": number;
      "30d": number;
      "90d": number;
    };
  };
  joinedDate: string;
  verified: boolean;
  reputationHistory: {
    type: "Agreement" | "Dispute" | "Ruling";
    counterparty: string;
    outcome: "Completed" | "Won" | "Lost" | "Ignored" | "Resolved";
    date: string;
    impact: number;
  }[];
}

// Unified mock users data that includes reputation history
export const mockUsers: User[] = [
  {
    id: "1",
    handle: "@0xAlfa",
    wallet: "0xAlfa123456789...",
    trustScore: 78,
    roles: { judge: true, community: true, user: true },
    stats: {
      deals: 24,
      agreements: 24,
      disputes: 8,
      disputesWon: 6,
      disputesLost: 2,
      ignoredRulings: 1,
      revenue: { "7d": 420, "30d": 1760, "90d": 5030 },
    },
    joinedDate: "2024-01-15",
    verified: true,
    reputationHistory: [
      {
        type: "Agreement",
        counterparty: "@0xBeta",
        outcome: "Completed",
        date: "2025-09-20",
        impact: +4,
      },
      {
        type: "Dispute",
        counterparty: "@0xBeta",
        outcome: "Won",
        date: "2025-09-13",
        impact: +8,
      },
      {
        type: "Dispute",
        counterparty: "@0xEcho",
        outcome: "Lost",
        date: "2025-08-30",
        impact: -6,
      },
      {
        type: "Ruling",
        counterparty: "Court",
        outcome: "Ignored",
        date: "2025-08-05",
        impact: -8,
      },
    ],
  },
  {
    id: "2",
    handle: "@0xAstra",
    wallet: "0xAstra987654321...",
    trustScore: 64,
    roles: { judge: false, community: true, user: true },
    stats: {
      deals: 12,
      agreements: 12,
      disputes: 5,
      disputesWon: 2,
      disputesLost: 3,
      ignoredRulings: 0,
      revenue: { "7d": 120, "30d": 680, "90d": 2100 },
    },
    joinedDate: "2024-02-20",
    verified: false,
    reputationHistory: [
      {
        type: "Agreement",
        counterparty: "@0xNova",
        outcome: "Completed",
        date: "2025-09-11",
        impact: +3,
      },
      {
        type: "Dispute",
        counterparty: "@0xNova",
        outcome: "Resolved",
        date: "2025-09-10",
        impact: +2,
      },
    ],
  },
  {
    id: "3",
    handle: "@0xNova",
    wallet: "0xNova135792468...",
    trustScore: 92,
    roles: { judge: true, community: false, user: true },
    stats: {
      deals: 42,
      agreements: 35,
      disputes: 11,
      disputesWon: 10,
      disputesLost: 1,
      ignoredRulings: 0,
      revenue: { "7d": 890, "30d": 3200, "90d": 8900 },
    },
    joinedDate: "2023-11-05",
    verified: true,
    reputationHistory: [
      {
        type: "Dispute",
        counterparty: "@0xAstra",
        outcome: "Won",
        date: "2025-09-28",
        impact: +6,
      },
      {
        type: "Agreement",
        counterparty: "@0xEcho",
        outcome: "Completed",
        date: "2025-09-25",
        impact: +5,
      },
      {
        type: "Dispute",
        counterparty: "@0xOrion",
        outcome: "Won",
        date: "2025-09-10",
        impact: +8,
      },
    ],
  },
  {
    id: "4",
    handle: "@0xEcho",
    wallet: "0xEcho246813579...",
    trustScore: 51,
    roles: { judge: false, community: true, user: true },
    stats: {
      deals: 8,
      agreements: 8,
      disputes: 6,
      disputesWon: 1,
      disputesLost: 4,
      ignoredRulings: 2,
      revenue: { "7d": 80, "30d": 450, "90d": 1200 },
    },
    joinedDate: "2024-03-10",
    verified: false,
    reputationHistory: [
      {
        type: "Dispute",
        counterparty: "@0xAlfa",
        outcome: "Lost",
        date: "2025-09-13",
        impact: -6,
      },
      {
        type: "Ruling",
        counterparty: "Court",
        outcome: "Ignored",
        date: "2025-08-05",
        impact: -5,
      },
    ],
  },
  {
    id: "5",
    handle: "@0xOrion",
    wallet: "0xOrion112233445...",
    trustScore: 71,
    roles: { judge: true, community: true, user: true },
    stats: {
      deals: 19,
      agreements: 19,
      disputes: 8,
      disputesWon: 5,
      disputesLost: 3,
      ignoredRulings: 1,
      revenue: { "7d": 320, "30d": 1450, "90d": 4200 },
    },
    joinedDate: "2024-01-30",
    verified: true,
    reputationHistory: [
      {
        type: "Agreement",
        counterparty: "@0xNova",
        outcome: "Completed",
        date: "2025-09-18",
        impact: +4,
      },
      {
        type: "Dispute",
        counterparty: "@0xEcho",
        outcome: "Won",
        date: "2025-09-15",
        impact: +6,
      },
      {
        type: "Dispute",
        counterparty: "@0xNova",
        outcome: "Lost",
        date: "2025-09-10",
        impact: -3,
      },
    ],
  },
  {
    id: "6",
    handle: "@0xLumen",
    wallet: "0xLumen556677889...",
    trustScore: 83,
    roles: { judge: false, community: true, user: true },
    stats: {
      deals: 27,
      agreements: 27,
      disputes: 9,
      disputesWon: 7,
      disputesLost: 2,
      ignoredRulings: 0,
      revenue: { "7d": 580, "30d": 2450, "90d": 7200 },
    },
    joinedDate: "2023-12-15",
    verified: true,
    reputationHistory: [
      {
        type: "Dispute",
        counterparty: "@0xOrion",
        outcome: "Won",
        date: "2025-09-22",
        impact: +7,
      },
      {
        type: "Agreement",
        counterparty: "@0xEcho",
        outcome: "Completed",
        date: "2025-09-20",
        impact: +4,
      },
    ],
  },
  {
    id: "7",
    handle: "@0xZephyr",
    wallet: "0xZephyr998877665...",
    trustScore: 58,
    roles: { judge: false, community: false, user: true },
    stats: {
      deals: 14,
      agreements: 14,
      disputes: 8,
      disputesWon: 3,
      disputesLost: 5,
      ignoredRulings: 1,
      revenue: { "7d": 190, "30d": 850, "90d": 2300 },
    },
    joinedDate: "2024-04-05",
    verified: false,
    reputationHistory: [
      {
        type: "Dispute",
        counterparty: "@0xAlfa",
        outcome: "Lost",
        date: "2025-09-18",
        impact: -4,
      },
      {
        type: "Agreement",
        counterparty: "@0xNova",
        outcome: "Completed",
        date: "2025-09-10",
        impact: +3,
      },
    ],
  },
  {
    id: "8",
    handle: "@0xRogue",
    wallet: "0xRogue443322116...",
    trustScore: 37,
    roles: { judge: false, community: false, user: true },
    stats: {
      deals: 5,
      agreements: 5,
      disputes: 9,
      disputesWon: 0,
      disputesLost: 6,
      ignoredRulings: 3,
      revenue: { "7d": 45, "30d": 200, "90d": 600 },
    },
    joinedDate: "2024-05-20",
    verified: false,
    reputationHistory: [
      {
        type: "Dispute",
        counterparty: "@0xOrion",
        outcome: "Lost",
        date: "2025-09-02",
        impact: -8,
      },
      {
        type: "Ruling",
        counterparty: "Court",
        outcome: "Ignored",
        date: "2025-08-20",
        impact: -5,
      },
    ],
  },
  {
    id: "9",
    handle: "@0xAether",
    wallet: "0xAether775533119...",
    trustScore: 89,
    roles: { judge: true, community: true, user: true },
    stats: {
      deals: 30,
      agreements: 30,
      disputes: 10,
      disputesWon: 9,
      disputesLost: 1,
      ignoredRulings: 0,
      revenue: { "7d": 720, "30d": 3100, "90d": 8900 },
    },
    joinedDate: "2023-10-12",
    verified: true,
    reputationHistory: [
      {
        type: "Dispute",
        counterparty: "@0xEcho",
        outcome: "Won",
        date: "2025-09-25",
        impact: +7,
      },
      {
        type: "Agreement",
        counterparty: "@0xNova",
        outcome: "Completed",
        date: "2025-09-20",
        impact: +5,
      },
    ],
  },
];

// API functions
export function getUsers(): Promise<User[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockUsers), 300);
  });
}

export function getUserById(id: string): Promise<User | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.id === id);
      resolve(user);
    }, 200);
  });
}

export function getUserByHandle(handle: string): Promise<User | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.handle.toLowerCase() === handle.toLowerCase(),
      );
      resolve(user);
    }, 200);
  });
}

// Helper function to get user stats for reputation page
export function getUserStatsForReputation(): Array<{
  handle: string;
  score: number;
  agreements: number;
  disputesWon: number;
  disputesLost: number;
  ignoredRulings: number;
  history: User["reputationHistory"];
}> {
  return mockUsers.map((user) => ({
    handle: user.handle,
    score: user.trustScore,
    agreements: user.stats.agreements,
    disputesWon: user.stats.disputesWon,
    disputesLost: user.stats.disputesLost,
    ignoredRulings: user.stats.ignoredRulings,
    history: user.reputationHistory,
  }));
}
