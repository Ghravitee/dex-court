import { DisputeStatusEnum } from "../../../types";

export const FILTER_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Vote in Progress", value: "Vote in Progress" },
  { label: "Settled", value: "Settled" },
  { label: "Dismissed", value: "Dismissed" },
  { label: "Pending Payment", value: "pendingPayment" },
  { label: "Pending Locking Funds", value: "pendingLockingFunds" },
];

export const STATUS_MAP: Record<string, number> = {
  Pending: DisputeStatusEnum.Pending,
  "Vote in Progress": DisputeStatusEnum.VoteInProgress,
  Settled: DisputeStatusEnum.Settled,
  Dismissed: DisputeStatusEnum.Dismissed,
  pendingPayment: DisputeStatusEnum.PendingPayment,
  pendingLockingFunds: DisputeStatusEnum.PendingLockingFunds,
};

export const DATE_RANGE_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
];

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
