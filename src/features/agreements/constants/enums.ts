import type { AgreementStatus, AgreementStatusFilter } from "../../../types";

export const AgreementTypeEnum = {
  REPUTATION: 1,
  ESCROW: 2,
} as const;

export const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

export const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
  PARTY_SUBMITTED_DELIVERY: 7,
} as const;

export const apiStatusToFrontend = (status: number): AgreementStatus => {
  switch (status) {
    case AgreementStatusEnum.PENDING_ACCEPTANCE:
      return "pending";
    case AgreementStatusEnum.ACTIVE:
      return "signed";
    case AgreementStatusEnum.COMPLETED:
      return "completed";
    case AgreementStatusEnum.DISPUTED:
      return "disputed";
    case AgreementStatusEnum.CANCELLED:
      return "cancelled";
    case AgreementStatusEnum.EXPIRED:
      return "expired";
    case AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY:
      return "pending_approval";
    default:
      return "pending";
  }
};

export const STATUS_TO_API_MAP: Record<string, number> = {
  pending: AgreementStatusEnum.PENDING_ACCEPTANCE,
  signed: AgreementStatusEnum.ACTIVE,
  completed: AgreementStatusEnum.COMPLETED,
  disputed: AgreementStatusEnum.DISPUTED,
  cancelled: AgreementStatusEnum.CANCELLED,
  expired: AgreementStatusEnum.EXPIRED,
  pending_approval: AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY,
};

export const TABLE_FILTER_OPTIONS: {
  value: AgreementStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "signed", label: "Signed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "pending_approval", label: "Pending Approval" },
];

export const TOKEN_OPTIONS = [
  { value: "USDC", label: "USDC" },
  { value: "DAI", label: "DAI" },
  { value: "ETH", label: "ETH" },
  { value: "custom", label: "Custom Token" },
];

export const TYPE_OPTIONS = [
  { value: "Public", label: "Public" },
  { value: "Private", label: "Private" },
];

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
