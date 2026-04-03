export type EscrowStatus =
  | "pending"
  | "signed"
  | "completed"
  | "cancelled"
  | "expired"
  | "disputed"
  | "pending_approval"
  | "pending_delivery";

export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  },
  signed: {
    label: "Signed",
    color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  },
  completed: {
    label: "Completed",
    color: "bg-green-500/20 text-green-300 border-green-400/30",
  },
  disputed: {
    label: "Disputed",
    color: "bg-purple-800/20 text-purple-300 border-purple-800/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/20 text-red-300 border-red-400/30",
  },
  expired: {
    label: "Expired",
    color: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  },
  pending_approval: {
    label: "Pending Approval",
    color: "bg-orange-500/20 text-orange-300 border-orange-400/30",
  },
  Pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  },
  "Pending Payment": {
    label: "Pending Payment",
    color: "bg-orange-500/20 text-orange-300 border-orange-400/30",
  },
  "Vote in Progress": {
    label: "Voting",
    color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  },
  Settled: {
    label: "Settled",
    color: "bg-green-500/20 text-green-300 border-green-400/30",
  },
  Dismissed: {
    label: "Dismissed",
    color: "bg-red-500/20 text-red-300 border-red-400/30",
  },
} as const;
