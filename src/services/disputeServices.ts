/* eslint-disable @typescript-eslint/no-explicit-any */
// services/disputeService.ts
//
// Pure async functions for the disputes API.
// No React. No hooks. No user-fetching (use accountService/useAccounts for that).
// TanStack Query hooks live in hooks/useDisputes.ts.

import { cleanTelegramUsername } from "../lib/usernameUtils";
import { api } from "../lib/apiClient";
import { DisputeTypeEnum, DisputeStatusEnum, ErrorCodeEnum } from "../types";
import type {
  DisputeListResponse,
  CreateDisputeRequest,
  CreateDisputeFromAgreementRequest,
  VoteRequest,
  DisputeDetails,
  ApiError,
  DisputeRow,
  EvidenceFile,
  VoteOutcomeData,
} from "../types";
import { VOTING_CA } from "../web3/config";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DisputeListParams {
  top?: number;
  skip?: number;
  status?: DisputeStatusEnum;
  sort?: "asc" | "desc";
  search?: string;
  range?: "all" | "last7d" | "last30d";
}

export interface CreateDisputeResult {
  id: number;
  votingId: string;
}

export interface VoteEligibility {
  canVote: boolean;
  reason?: string;
  tier?: number;
  weight?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateVotingId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildDisputeFormData(
  data: CreateDisputeRequest | CreateDisputeFromAgreementRequest,
  files: File[],
  chainId?: number,
): FormData {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("requestKind", String(data.requestKind));
  formData.append("defendant", cleanTelegramUsername(data.defendant));
  formData.append("claim", data.claim);
  formData.append("votingId", generateVotingId());

  if (chainId !== undefined) {
    formData.append("chainId", String(chainId));
    formData.append("disputeContractAddress", VOTING_CA[chainId] ?? "");
  }

  data.witnesses?.forEach((witness, i) => {
    formData.append(`witnesses[${i}]`, cleanTelegramUsername(witness));
  });

  files.forEach((file) => formData.append("files", file));

  return formData;
}

// ─── Error handling ────────────────────────────────────────────────────────────

const ERROR_CODE_MESSAGES: Record<ErrorCodeEnum, string> = {
  [ErrorCodeEnum.MissingData]:
    "Missing required fields. Please check: Title, Description, Defendant, Claim, and Evidence files.",
  [ErrorCodeEnum.InvalidEnum]: "Invalid dispute type selected.",
  [ErrorCodeEnum.MissingWallet]:
    "Wallet connection required for paid disputes.",
  [ErrorCodeEnum.AccountNotFound]: "Defendant account not found.",
  [ErrorCodeEnum.SameAccount]: "You cannot create a dispute against yourself.",
  [ErrorCodeEnum.WitnessesNotFound]: "One or more witnesses not found.",
  [ErrorCodeEnum.InvalidData]: "Invalid data provided.",
  [ErrorCodeEnum.InternalServerError]:
    "Dispute creation failed due to server error. Please try again.",
  [ErrorCodeEnum.Forbidden]: "You are not authorized to perform this action.",
  [ErrorCodeEnum.InvalidStatus]:
    "This action cannot be performed in the current dispute status.",
};

function handleDisputeError(error: any): never {
  if (error.response?.status === 500) {
    throw new Error(
      "Dispute creation failed due to server error. Please try again.",
    );
  }

  if (error.response?.status === 413) {
    throw new Error(
      "File too large. Please reduce file sizes or upload fewer files.",
    );
  }

  if (
    error.code === "ERR_NETWORK" ||
    error.message?.includes("CORS") ||
    (error.response === undefined && error.request !== undefined)
  ) {
    throw new Error(
      "Unable to connect to server. Please check your connection.",
    );
  }

  if (error.response?.data) {
    const apiError: ApiError = error.response.data;
    const message =
      ERROR_CODE_MESSAGES[apiError.error as ErrorCodeEnum] ??
      apiError.message ??
      "Dispute creation failed. Please try again.";
    throw new Error(message);
  }

  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    throw new Error("Request timeout. Please try again.");
  }

  throw new Error("Dispute creation failed. Please check your connection.");
}

// ─── Specific error handlers for create flows ──────────────────────────────────

function handleCreateError(error: any, chainId?: number): never {
  if (error.response?.status === 400) {
    const { error: code } = error.response.data ?? {};
    if (code === "MissingData") {
      throw new Error(
        "Missing required data." +
          (chainId === undefined
            ? " chainId may be required for paid disputes."
            : ""),
      );
    }
    if (code === "MissingChainId")
      throw new Error("Chain ID is required for creating a dispute.");
    if (code === "InvalidChainId")
      throw new Error("Invalid chain ID. Please check the network.");
    if (code === "InvalidData") throw new Error("Invalid data provided.");
  }
  if (error.response?.status === 404) throw new Error("Agreement not found.");
  if (error.response?.status === 409) {
    throw new Error("A dispute already exists for this agreement.");
  }

  handleDisputeError(error);
}

// ─── Eligibility reason codes ──────────────────────────────────────────────────

const ELIGIBILITY_REASON_MESSAGES: Partial<Record<number, string>> = {
  [ErrorCodeEnum.AccountNotFound]: "Account not found",
  [ErrorCodeEnum.MissingWallet]: "Wallet connection required to vote",
  [ErrorCodeEnum.InvalidEnum]: "Invalid dispute data",
  [ErrorCodeEnum.InvalidData]: "Invalid dispute data",
  [ErrorCodeEnum.InvalidStatus]: "Dispute is not in voting phase",
  [ErrorCodeEnum.Forbidden]: "You are a party in this dispute",
};

// Export for use in hooks
export const VOTE_ELIGIBILITY_REASONS = {
  ALREADY_VOTED: "User has already voted",
  NOT_IN_VOTING_PHASE: "Dispute is not in voting phase",
  IS_PARTY: "You are a party in this dispute",
  NO_WALLET: "Wallet connection required to vote",
  ACCOUNT_NOT_FOUND: "Account not found",
  INVALID_DISPUTE: "Invalid dispute",
} as const;

// ─── Status mapping ────────────────────────────────────────────────────────────

type FrontendStatus =
  | "Pending"
  | "Vote in Progress"
  | "Settled"
  | "Dismissed"
  | "Pending Payment"
  | "Pending Locking Funds";

function mapStatusToFrontend(status: DisputeStatusEnum): FrontendStatus {
  switch (status) {
    case DisputeStatusEnum.Pending:
      return "Pending";
    case DisputeStatusEnum.VoteInProgress:
      return "Vote in Progress";
    case DisputeStatusEnum.Settled:
      return "Settled";
    case DisputeStatusEnum.Dismissed:
      return "Dismissed";
    case DisputeStatusEnum.PendingPayment:
      return "Pending Payment";
    case DisputeStatusEnum.PendingLockingFunds:
      return "Pending Locking Funds";
    default:
      return "Pending";
  }
}

// ─── Transform helpers ─────────────────────────────────────────────────────────

function extractUserData(user: any) {
  return {
    username: user?.username ?? "Unknown",
    userId: user?.id?.toString() ?? "0",
    avatarId: user?.avatarId ?? user?.avatar?.id ?? null,
    telegramUsername:
      user?.telegramUsername ?? user?.telegram?.username ?? null,
  };
}

function transformEvidenceFiles(files: any[]): EvidenceFile[] {
  return (files ?? []).map((f) => ({
    id: f?.id ?? 0,
    fileName: f?.fileName ?? "Unknown file",
    fileSize: f?.fileSize ?? 0,
    side: f?.side ?? 0,
    mimeType: f?.mimeType ?? "application/octet-stream",
    uploadedAt: f?.uploadedAt ?? new Date().toISOString(),
    fileId: f?.id,
    url: f?.url,
  }));
}

function transformWitnesses(witnesses: any) {
  if (!witnesses) return { plaintiff: [], defendant: [] };

  const mapWitness = (w: any) => ({
    id: w?.id ?? 0,
    username: w?.username ?? "Unknown",
    avatarId: w?.avatarId ?? w?.avatar?.id ?? null,
  });

  if (Array.isArray(witnesses)) {
    return { plaintiff: witnesses.map(mapWitness), defendant: [] };
  }

  return {
    plaintiff: (witnesses.plaintiff ?? []).map(mapWitness),
    defendant: (witnesses.defendant ?? []).map(mapWitness),
  };
}

// ─── Query functions ───────────────────────────────────────────────────────────

export async function fetchDisputes(
  params?: DisputeListParams,
): Promise<DisputeListResponse> {
  const response = await api.get("/dispute", { params });
  return response.data;
}

export async function fetchDisputeDetails(
  disputeId: number,
): Promise<DisputeDetails> {
  const response = await api.get(`/dispute/${disputeId}`);
  return response.data;
}

export async function fetchVoteInProgressDisputes(): Promise<{
  results: any[];
}> {
  const response = await api.get("/dispute/vote-in-progress");
  return response.data;
}

export async function fetchSettledDisputes(params?: {
  top?: number;
  skip?: number;
  sort?: "asc" | "desc";
  search?: string;
  range?: string;
}): Promise<any> {
  const response = await api.get("/dispute/vote-settled", { params });
  return response.data;
}

export async function fetchVoteOutcome(
  disputeId: number,
): Promise<VoteOutcomeData> {
  const response = await api.get(`/dispute/${disputeId}/vote-outcome`);
  const d = response.data;

  return {
    winner:
      d.result === 1 ? "plaintiff" : d.result === 2 ? "defendant" : "dismissed",
    judgeVotes: d.votesPerGroup?.judges?.total ?? 0,
    communityVotes:
      (d.votesPerGroup?.communityTierOne?.total ?? 0) +
      (d.votesPerGroup?.communityTierTwo?.total ?? 0),
    judgePct: d.percentagesPerGroup?.judges?.plaintiff ?? 0,
    communityPct: d.percentagesPerGroup?.communityTierOne?.plaintiff ?? 0,
    comments: d.comments ?? [],
    weighted: d.weighted,
    votesPerGroup: d.votesPerGroup,
    percentagesPerGroup: d.percentagesPerGroup,
  };
}

export async function checkVoteEligibility(
  disputeId: number,
): Promise<VoteEligibility> {
  try {
    const response = await api.post(`/dispute/${disputeId}/check-eligibility`);
    const { isEligible, reason, tier, weight } = response.data;

    if (isEligible) {
      return { canVote: true, tier, weight };
    }

    // Map the numeric error code to a user-friendly message
    let userMessage: string;

    switch (reason) {
      case ErrorCodeEnum.AccountNotFound: // 7
        userMessage = VOTE_ELIGIBILITY_REASONS.ACCOUNT_NOT_FOUND;
        break;
      case ErrorCodeEnum.MissingWallet: // 12
        userMessage = VOTE_ELIGIBILITY_REASONS.NO_WALLET;
        break;
      case ErrorCodeEnum.InvalidEnum: // 13
      case ErrorCodeEnum.InvalidData: // 14
        userMessage = VOTE_ELIGIBILITY_REASONS.INVALID_DISPUTE;
        break;
      case ErrorCodeEnum.InvalidStatus: // 16
        userMessage = VOTE_ELIGIBILITY_REASONS.NOT_IN_VOTING_PHASE;
        break;
      case ErrorCodeEnum.Forbidden: // 17
        userMessage = VOTE_ELIGIBILITY_REASONS.IS_PARTY;
        break;
      default:
        userMessage =
          ELIGIBILITY_REASON_MESSAGES[reason] ??
          `Not eligible (code: ${reason})`;
    }

    return {
      canVote: false,
      reason: userMessage,
      tier,
      weight,
    };
  } catch (error: any) {
    if (error.response?.data?.error) {
      const code = error.response.data.error;
      const reasonMap: Partial<Record<ErrorCodeEnum, string>> = {
        [ErrorCodeEnum.InvalidData]: "Invalid dispute data",
        [ErrorCodeEnum.InvalidStatus]: "Dispute is not in voting phase",
        [ErrorCodeEnum.AccountNotFound]: "User account not found",
        [ErrorCodeEnum.Forbidden]: "User is not allowed to vote",
      };
      return {
        canVote: false,
        reason: reasonMap[code as ErrorCodeEnum] ?? "Not eligible",
      };
    }
    return { canVote: false, reason: "Error checking eligibility" };
  }
}

// ─── Mutation functions ────────────────────────────────────────────────────────

export async function createDispute(
  data: CreateDisputeRequest,
  files: File[],
  chainId?: number,
): Promise<CreateDisputeResult> {
  const formData = buildDisputeFormData(data, files, chainId);
  // Read the generated votingId back out of the formData
  const votingId = formData.get("votingId") as string;

  try {
    const response = await api.post("/dispute", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30_000,
    });

    const disputeId = response.data?.id;
    if (!disputeId || typeof disputeId !== "number") {
      throw new Error("Server response missing dispute ID.");
    }

    return { id: disputeId, votingId };
  } catch (error: any) {
    handleCreateError(error, chainId);
  }
}

export async function createDisputeFromAgreement(
  agreementId: number,
  data: CreateDisputeFromAgreementRequest,
  files: File[],
  chainId?: number,
): Promise<CreateDisputeResult> {
  const formData = buildDisputeFormData(data, files, chainId);
  const votingId = formData.get("votingId") as string;

  try {
    const response = await api.post(`/dispute/${agreementId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30_000,
    });

    const disputeId = response.data?.id;
    if (!disputeId || typeof disputeId !== "number") {
      throw new Error("Server response missing dispute ID.");
    }

    return { id: disputeId, votingId };
  } catch (error: any) {
    handleCreateError(error, chainId);
  }
}

export async function castVote(
  disputeId: number,
  data: VoteRequest,
): Promise<void> {
  await api.post(`/dispute/${disputeId}/vote`, data);
}

export async function submitDefendantClaim(
  disputeId: number,
  data: { defendantClaim: string; witnesses?: string[] },
  files?: File[],
): Promise<void> {
  const formData = new FormData();
  formData.append("defendantClaim", data.defendantClaim);
  data.witnesses?.forEach((w, i) =>
    formData.append(`witnesses[${i}]`, w.trim()),
  );
  files?.forEach((file) => formData.append("files", file));

  try {
    await api.post(`/dispute/${disputeId}/defendant-claim`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error: any) {
    handleDisputeError(error);
  }
}

export async function editDefendantClaim(
  disputeId: number,
  data: { defendantClaim: string; witnesses?: string[] },
  files?: File[],
): Promise<void> {
  const formData = new FormData();
  formData.append("defendantClaim", data.defendantClaim);
  data.witnesses?.forEach((w, i) =>
    formData.append(`witnesses[${i}]`, cleanTelegramUsername(w)),
  );
  files?.forEach((file) => formData.append("files", file));

  try {
    await api.patch(`/dispute/${disputeId}/defendant-claim`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error: any) {
    handleDisputeError(error);
  }
}

export async function editPlaintiffClaim(
  disputeId: number,
  data: {
    title?: string;
    description?: string;
    claim?: string;
    requestKind?: number;
    defendant?: string;
    witnesses?: string[];
  },
  files?: File[],
): Promise<void> {
  const formData = new FormData();
  if (data.title) formData.append("title", data.title);
  if (data.description) formData.append("description", data.description);
  if (data.claim) formData.append("claim", data.claim);
  if (data.requestKind !== undefined)
    formData.append("requestKind", String(data.requestKind));
  if (data.defendant) formData.append("defendant", data.defendant);
  data.witnesses?.forEach((w, i) =>
    formData.append(`witnesses[${i}]`, cleanTelegramUsername(w.trim())),
  );
  files?.forEach((file) => formData.append("files", file));

  try {
    await api.patch(`/dispute/${disputeId}/plaintiff-claim`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error: any) {
    handleDisputeError(error);
  }
}

export async function settleDispute(disputeId: number): Promise<void> {
  try {
    await api.patch(`/dispute/${disputeId}/settled`);
  } catch (error: any) {
    handleDisputeError(error);
  }
}

export async function escalateDisputesToVote(
  disputeIds: number[],
): Promise<void> {
  try {
    await api.patch(
      "/testing/escalate-votes",
      { disputeIds },
      { timeout: 60_000 },
    );
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      throw new Error(
        "Request timed out. Please refresh to check if it succeeded.",
      );
    }
    handleDisputeError(error);
  }
}

export async function finalizeDisputes(disputeIds: number[]): Promise<void> {
  try {
    await api.patch(
      "/testing/finalize-votes",
      { disputeIds },
      { timeout: 60_000 },
    );
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      throw new Error(
        "Request timed out. Please refresh to check if it succeeded.",
      );
    }
    if (error.response?.status === 400) {
      const code = error.response.data?.error;
      if (code === "InvalidData")
        throw new Error("Invalid dispute data provided.");
      if (code === "InvalidStatus")
        throw new Error(
          "One or more disputes are not in VoteInProgress status.",
        );
    }
    if (error.response?.status === 404)
      throw new Error("One or more disputes not found.");
    handleDisputeError(error);
  }
}

export async function downloadDisputeFile(
  disputeId: number,
  fileId: number,
): Promise<Blob> {
  const response = await api.get(`/dispute/${disputeId}/file/${fileId}`, {
    responseType: "blob",
  });
  return response.data;
}

export async function deleteDisputeFile(
  disputeId: number,
  fileId: number,
): Promise<void> {
  await api.delete(`/dispute/${disputeId}/file/${fileId}`);
}

// ─── Transform functions ───────────────────────────────────────────────────────
// Kept as named exports so existing callers via disputeService.transformX still work
// through the backwards-compatible singleton below.

export function transformDisputeDetailsToRow(
  dispute: DisputeDetails,
): DisputeRow {
  const plaintiffData = extractUserData(dispute.plaintiff);
  const defendantData = extractUserData(dispute.defendant);

  return {
    id: dispute.id?.toString() ?? "0",
    createdAt: dispute.createdAt ?? new Date().toISOString(),
    title: dispute.title ?? "Untitled Dispute",
    request: dispute.type === DisputeTypeEnum.ProBono ? "Pro Bono" : "Paid",
    parties: `${plaintiffData.username} vs ${defendantData.username}`,
    status: mapStatusToFrontend(dispute.status),
    claim: dispute.plaintiffComplaint?.formalClaim ?? "No claim specified",
    plaintiff: plaintiffData.username,
    defendant: defendantData.username,
    description:
      dispute.plaintiffComplaint?.description ?? "No description provided",
    witnesses: transformWitnesses(dispute.witnesses),
    evidence: transformEvidenceFiles(
      dispute.plaintiffComplaint?.evidenceFiles ?? [],
    ),
    defendantResponse: dispute.defendantResponse
      ? {
          description:
            dispute.defendantResponse.formalClaim ?? "No response description",
          evidence: transformEvidenceFiles(
            dispute.defendantResponse.evidenceFiles ?? [],
          ),
          createdAt:
            dispute.defendantResponse.createdAt ?? new Date().toISOString(),
        }
      : undefined,
    plaintiffData,
    defendantData,
    hasVoted: dispute.hasVoted,
    agreementId: dispute.agreementId,
    agreementTitle: dispute.agreementTitle,
    votingId: dispute.votingId,
    contractAgreementId: dispute.contractAgreementId,
    chainId: dispute.chainId,
    txnhash: dispute.txnhash,
    type: dispute.type,
    result: dispute.result,
    votePendingAt: dispute.votePendingAt,
    voteStartedAt: dispute.voteStartedAt,
    voteEndedAt: dispute.voteEndedAt,
    agreement: dispute.agreement
      ? {
          id: dispute.agreement.id,
          type: dispute.agreement.type,
          status: dispute.agreement.status,
          title: dispute.agreement.title,
        }
      : null,
  };
}

export function transformDisputeListItemToRow(item: any): DisputeRow {
  const plaintiffData = extractUserData(item.parties?.plaintiff);
  const defendantData = extractUserData(item.parties?.defendant);

  return {
    id: item.id?.toString() ?? "0",
    createdAt: item.createdAt ?? new Date().toISOString(),
    title: item.title ?? "Untitled Dispute",
    request: item.requestType === DisputeTypeEnum.ProBono ? "Pro Bono" : "Paid",
    parties: `${plaintiffData.username} vs ${defendantData.username}`,
    status: mapStatusToFrontend(item.status),
    claim: item.claim ?? "No claim specified",
    plaintiff: plaintiffData.username,
    defendant: defendantData.username,
    description: item.description ?? "No description provided",
    witnesses: transformWitnesses(item.witnesses),
    evidence: [],
    plaintiffData,
    defendantData,
  };
}

// ─── Backwards-compatible singleton ───────────────────────────────────────────
// Keeps existing callers using `disputeService.xyz()` working during migration.
// Migrate callers to named imports above, then remove this.

export const disputeService = {
  // Query
  getDisputes: fetchDisputes,
  getDisputeDetails: fetchDisputeDetails,
  getVoteInProgressDisputes: fetchVoteInProgressDisputes,
  getSettledDisputes: fetchSettledDisputes,
  getVoteOutcome: fetchVoteOutcome,
  canUserVote: checkVoteEligibility,

  // Mutations
  createDispute,
  createDisputeFromAgreement,
  castVote,
  submitDefendantClaim,
  editDefendantClaim,
  editPlaintiffClaim,
  settleDispute,
  escalateDisputesToVote,
  finalizeDisputes,
  downloadFile: downloadDisputeFile,
  deleteFile: deleteDisputeFile,

  // Transforms
  transformDisputeDetailsToRow,
  transformDisputeListItemToRow,

  // These were on the old service but are now removed.
  // User search belongs in useAccounts / useAllAccounts.
  // getAllUsers: removed — use fetchAllAccounts from accountService
  // searchUsers: removed — use useAllAccounts + client-side filter
  // clearUserCache: removed — TanStack Query handles cache invalidation
};
