/* eslint-disable @typescript-eslint/no-explicit-any */
// services/agreementService.ts
//
// Pure async functions for the agreements API.
// No React. No hooks. No user-fetching (that belongs to accountService).
// TanStack Query hooks live in hooks/useAgreements.ts.

import { api } from "../lib/apiClient";
import { devLog } from "../utils/logger";
import type { DisputeTypeEnum } from "../types";

// ─── Enums ─────────────────────────────────────────────────────────────────────

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

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AgreementsRequest {
  title: string;
  description: string;
  type: number;
  visibility: number;
  firstParty: string;
  counterParty: string;
  deadline?: string;
  includesFunds?: boolean;
  secureTheFunds?: boolean;
  tokenSymbol?: string;
  customTokenAddress?: string;
  amount?: number;
  chainId?: number;
  contractAgreementId?: string;
  txHash?: string;
  payeeWalletAddress?: string;
  payerWalletAddress?: string;
  escrowContractAddress?: string;
}

export interface AgreementDeliveryRejectedRequest {
  votingId: string;
  claim: string;
  contractAgreementId?: string;
  chainId?: number;
  requestKind: DisputeTypeEnum;
  txHash?: string;
}

export interface AgreementSignRequest {
  accepted: boolean;
}

export interface AgreementCancelRespondRequest {
  accepted: boolean;
}

export interface AgreementsEditRequest {
  title?: string;
  description?: string;
  type?: number;
  visibility?: number;
  deadline?: string;
  amount?: number;
  tokenSymbol?: string;
  contractAddress?: string;
}

export interface PartyDTO {
  id: number;
  username: string;
  telegramUsername?: string;
  wallet?: string | null;
  avatarId?: number | null;
  avatar?: { id: number; fileName: string } | null;
}

export interface FileDTO {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface TimelineEventDTO {
  id: number;
  eventType: number;
  createdAt: string;
  description?: string;
}

export interface DisputeSummaryDTO {
  disputeId: number;
}

export interface AgreementSummaryDTO {
  id: number;
  contractAgreementId: number;
  chainId: number;
  dateCreated: string;
  description: string;
  visibility: number;
  title: string;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  amount?: number;
  type?: number;
  tokenSymbol?: string;
  deadline: string;
  status: number;
  escrowContractAddress?: string;
  payeeWalletAddress?: string;
  payerWalletAddress?: string;
  data?: any;
}

export interface AgreementMineListDTO {
  results: AgreementSummaryDTO[];
}

export interface AgreementListDTO {
  totalAgreements: number;
  totalResults: number;
  results: AgreementSummaryDTO[];
}

export interface AgreementDetailsDTO {
  id: number;
  title: string;
  description: string;
  type: number;
  visibility: number;
  status: number;
  amount?: number;
  tokenSymbol?: string;
  deadline: string;
  disputes: DisputeSummaryDTO[];
  createdAt: string;
  contractAgreementId?: string;
  includesFunds?: boolean;
  hasSecuredFunds?: boolean;
  customTokenAddress?: string;
  creator: PartyDTO;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  files: FileDTO[];
  timeline: TimelineEventDTO[];
  cancelPending?: boolean;
  cancelRequestedById?: number | null;
  cancelRequestedBy?: PartyDTO | null;
  deliverySubmittedBy?: PartyDTO | null;
  deliverySubmittedById?: number | null;
  completedAt?: string;
  updatedAt?: string;
  escrowContractAddress?: string;
}

export interface UserDTO {
  id: number;
  username: string;
  bio: string;
  isVerified: boolean;
  telegram: { username?: string; id?: string };
  walletAddress: string;
  role: number;
  avatarId: number;
}

export interface AgreementListParams {
  top?: number;
  skip?: number;
  status?: number;
  sort?: string;
  search?: string;
  type?: number;
}

// ─── Query functions ───────────────────────────────────────────────────────────

export async function fetchAgreements(
  params?: AgreementListParams,
): Promise<AgreementListDTO> {
  const sanitised: Record<string, any> = {
    top: Math.min(params?.top ?? 10, 100), // Hard cap — prevents timeout on huge requests
    skip: params?.skip ?? 0,
    sort: params?.sort ?? "desc",
  };

  // Only include defined optional params
  if (params?.status !== undefined) sanitised.status = params.status;
  if (params?.search) sanitised.search = params.search;
  if (params?.type !== undefined) sanitised.type = params.type;

  const response = await api.get("/agreement", {
    params: sanitised,
    timeout: 30_000,
  });

  return response.data;
}

export async function fetchMyAgreements(): Promise<AgreementMineListDTO> {
  const response = await api.get("/agreement/mine");
  return response.data;
}

export async function fetchAgreementDetails(
  agreementId: number,
): Promise<AgreementDetailsDTO> {
  const response = await api.get(`/agreement/${agreementId}`);
  return response.data;
}

/**
 * Fetches agreements for a specific user.
 *
 * NOTE: The API has no per-user filter endpoint, so this fetches a page of
 * agreements and filters client-side. This only works reliably for users
 * with fewer agreements than `top`. For high-volume users results will be
 * incomplete.
 *
 * TODO: Ask backend to add GET /agreement?userId=:id
 */
export async function fetchUserAgreements(
  userId: string,
  params?: Pick<AgreementListParams, "status" | "search" | "sort">,
): Promise<AgreementSummaryDTO[]> {
  devLog(
    `[agreementService] Fetching agreements for user ${userId} — client-side filter`,
  );

  const response = await fetchAgreements({ top: 100, skip: 0, ...params });
  const all = response.results ?? [];

  return all.filter(
    (a) =>
      a.firstParty?.id?.toString() === userId ||
      a.counterParty?.id?.toString() === userId,
  );
}

/**
 * Fetches the total count of agreements without loading all records.
 * Uses top=1 so the response is minimal — only totalAgreements is needed.
 */
export async function fetchAgreementsCount(): Promise<number> {
  const response = await fetchAgreements({ top: 1, skip: 0 });
  return response.totalAgreements ?? 0;
}

// ─── Mutation functions ────────────────────────────────────────────────────────

export async function createAgreement(
  data: AgreementsRequest,
  files: File[],
): Promise<any> {
  const formData = new FormData();

  // Required fields
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("type", data.type.toString());
  formData.append("visibility", data.visibility.toString());
  formData.append("firstParty", data.firstParty);
  formData.append("counterParty", data.counterParty);

  // Optional fields — only append if defined
  if (data.deadline?.trim()) formData.append("deadline", data.deadline);
  if (data.includesFunds !== undefined)
    formData.append("includesFunds", data.includesFunds.toString());
  if (data.secureTheFunds !== undefined)
    formData.append("secureTheFunds", data.secureTheFunds.toString());
  if (data.tokenSymbol) formData.append("tokenSymbol", data.tokenSymbol);
  if (data.amount) formData.append("amount", data.amount.toString());
  if (data.chainId) formData.append("chainId", data.chainId.toString());
  if (data.contractAgreementId)
    formData.append("contractAgreementId", data.contractAgreementId);
  if (data.txHash) formData.append("txHash", data.txHash);
  if (data.payeeWalletAddress)
    formData.append("payeeWalletAddress", data.payeeWalletAddress);
  if (data.payerWalletAddress)
    formData.append("payerWalletAddress", data.payerWalletAddress);
  if (data.escrowContractAddress)
    formData.append("escrowContractAddress", data.escrowContractAddress);

  files.forEach((file) => formData.append("files", file));

  const response = await api.post("/agreement", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function signAgreement(
  agreementId: number,
  accepted: boolean,
): Promise<void> {
  await api.patch(`/agreement/sign/${agreementId}`, { accepted });
}

export async function editAgreement(
  agreementId: number,
  data: AgreementsEditRequest,
): Promise<void> {
  await api.patch(`/agreement/${agreementId}`, data);
}

export async function deleteAgreement(agreementId: number): Promise<void> {
  await api.delete(`/agreement/${agreementId}`);
}

export async function uploadAgreementFiles(
  agreementId: number,
  files: File[],
): Promise<void> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  await api.post(`/agreement/${agreementId}/files`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function downloadAgreementFile(
  agreementId: number,
  fileId: number,
): Promise<void> {
  const response = await api.get(`/agreement/${agreementId}/file/${fileId}`, {
    responseType: "blob",
  });

  // Extract filename from Content-Disposition header if present
  const disposition = response.headers["content-disposition"];
  const match = disposition?.match(/filename="?(.+)"?/);
  const filename = match?.[1] ?? `document-${fileId}`;

  const contentType = response.headers["content-type"];
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function deleteAgreementFile(
  agreementId: number,
  fileId: number,
): Promise<void> {
  await api.delete(`/agreement/${agreementId}/file/${fileId}`);
}

export async function markAsDelivered(agreementId: number): Promise<void> {
  await api.patch(`/agreement/${agreementId}/delivery/send`);
}

export async function confirmDelivery(agreementId: number): Promise<void> {
  await api.patch(`/agreement/${agreementId}/delivery/confirm`);
}

export async function rejectDelivery(
  agreementId: number,
  data: AgreementDeliveryRejectedRequest | FormData,
): Promise<void> {
  if (data instanceof FormData) {
    await api.patch(`/agreement/${agreementId}/delivery/reject`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    const payload: AgreementDeliveryRejectedRequest = {
      votingId: data.votingId,
      claim: data.claim.trim(),
      requestKind: data.requestKind,
      ...(data.contractAgreementId && {
        contractAgreementId: data.contractAgreementId,
      }),
      ...(data.chainId && { chainId: data.chainId }),
      ...(data.txHash && { txHash: data.txHash }),
    };
    await api.patch(`/agreement/${agreementId}/delivery/reject`, payload);
  }
}

export async function requestCancellation(agreementId: number): Promise<void> {
  try {
    await api.patch(`/agreement/${agreementId}/cancel/request`);
  } catch (error: any) {
    if (error.response?.data?.error === 16) {
      throw new Error("Cannot request cancellation: Invalid agreement state.");
    }
    throw error;
  }
}

export async function respondToCancellation(
  agreementId: number,
  accepted: boolean,
): Promise<void> {
  try {
    await api.patch(`/agreement/${agreementId}/cancel/response`, { accepted });
  } catch (error: any) {
    if (error.response?.data?.error === 16) {
      throw new Error(
        "Cannot respond to cancellation: Invalid agreement state.",
      );
    }
    throw error;
  }
}

// ─── Backwards-compatible singleton ───────────────────────────────────────────
// Kept so existing callers using `agreementService.xyz()` don't break
// while being migrated to the named function exports above.

export const agreementService = {
  createAgreement,
  getAgreements: fetchAgreements,
  getMyAgreements: fetchMyAgreements,
  getAgreementDetails: fetchAgreementDetails,
  getUserAgreements: fetchUserAgreements,
  getAllAgreementsCount: fetchAgreementsCount,
  signAgreement,
  editAgreement,
  deleteAgreement,
  uploadFiles: uploadAgreementFiles,
  downloadFile: downloadAgreementFile,
  deleteFile: deleteAgreementFile,
  markAsDelivered,
  confirmDelivery,
  rejectDelivery,
  requestCancelation: requestCancellation,
  respondToCancelation: respondToCancellation,
};
