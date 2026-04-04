// ─── API Enum Mappings ────────────────────────────────────────────────────────

export const AgreementTypeEnum = {
  REPUTATION: 1,
  ESCROW: 2,
} as const;

export const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

// ─── File upload limits ───────────────────────────────────────────────────────

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_DOCUMENT_SIZE = 3 * 1024 * 1024; // 3MB
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// ─── Smart contract error patterns ───────────────────────────────────────────

export const CONTRACT_ERRORS = {
  NOT_PARTY: "NotParty",
  NOT_ACTIVE: "NotActive",
  INVALID_AMOUNT: "InvalidAmount",
  CANNOT_BE_SAME: "CannotBeTheSame",
  ZERO_ADDRESS: "ZeroAddress",
  NOT_YET_FUNDED: "NotYetFunded",
  ALREADY_SIGNED: "AlreadySigned",
  ALREADY_ACCEPTED: "AlreadyAccepted",
  ALREADY_FUNDED: "AlreadyFunded",
  GRACE_NOT_ENDED: "Grace1NotEnded",
  GRACE_PERIOD_ENDED: "Grace1PeriodEnded",
  ALREADY_IN_GRACE: "AlreadyInGracePeriod",
  NO_ACTION_MADE: "NoActionMade",
  NOT_SIGNED: "NotSigned",
  INITIATOR_CANNOT_RESPOND: "InitiatorCannotRespond",
  ALREADY_PENDING_CANCELLATION: "AlreadyPendingCancellation",
  IN_VESTING_STAGE: "InVestingStage",
  NO_VESTING_STAGE: "NoVestingStage",
  MILESTONE_HELD: "MilestoneHeld",
  MILESTONE_ALREADY_CLAIMED: "MilestoneAlreadyClaimed",
  INVALID_MILESTONE_CONFIG: "InvalidMilestoneConfig",
  MILESTONE_NOT_UNLOCKED: "MilestoneNotUnlocked",
  OFFSET_EXCEEDS_DEADLINE: "OffsetExceedsDeadline",
};

// ─── Dropdown options ─────────────────────────────────────────────────────────

export const TYPE_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

export const TOKEN_OPTIONS = [
  { value: "USDC", label: "USDC" },
  { value: "DAI", label: "DAI" },
  { value: "ETH", label: "ETH" },
  { value: "custom", label: "Custom Token" },
];
