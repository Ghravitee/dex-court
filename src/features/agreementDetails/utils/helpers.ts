/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Agreement } from "../../../types";
import {
  AgreementStatusEnum,
  AgreementEventTypeEnum,
  AgreementVisibilityEnum,
} from "../types";
import { AgreementTypeEnum } from "../../../services/agreementServices";

// ─── Formatting ───────────────────────────────────────────────────────────────

export const formatNumberWithCommas = (value: string | undefined): string => {
  if (!value) return "";
  const numericValue = value.replace(/,/g, "");
  const parts = numericValue.split(".");
  let wholePart = parts[0];
  const decimalPart = parts[1] || "";
  if (wholePart) wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart;
};

export const formatCreatorUsername = (username: string | undefined): string => {
  if (!username) return "Unknown";
  const clean = username.startsWith("@") ? username.slice(1) : username;
  if (clean.startsWith("0x") && clean.length === 42) {
    return `${clean.slice(0, 5)}...${clean.slice(-4)}`;
  }
  return clean;
};

export const formatWalletAddress = (address: string | undefined): string => {
  if (!address) return "Unknown";
  const clean = address.startsWith("@") ? address.slice(1) : address;
  if (clean.startsWith("0x") && clean.length === 42) {
    return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
  }
  return clean;
};

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const formatDateWithTime = (
  dateString: string | null | undefined,
): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getTime() === 0) return "Not set";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const generateVotingId = (): string => {
  const min = 100000;
  const max = 999999;
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
};

// ─── Party helpers ────────────────────────────────────────────────────────────

export const getTelegramUsernameFromParty = (party: any): string => {
  if (!party) return "Unknown";
  const telegramUsername = party?.telegramUsername || party?.username;
  if (!telegramUsername) return "Unknown";
  return telegramUsername.startsWith("@")
    ? telegramUsername
    : `@${telegramUsername}`;
};

export const getUserIdFromParty = (party: any): string | undefined =>
  party?.id?.toString();

export const getAvatarIdFromParty = (party: any): number | null => {
  const avatarId = party?.avatarId || party?.avatar?.id;
  return avatarId ? Number(avatarId) : null;
};

export const normalizeUsername = (username: string): string => {
  if (!username) return "";
  return username.replace(/^@/, "").toLowerCase().trim();
};

export const isCurrentUserCounterparty = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (!agreement || !currentUser) return false;
  const currentUsername = currentUser?.username;
  if (!currentUsername) return false;
  const counterpartyUsername = agreement.counterParty?.username;
  if (!counterpartyUsername || counterpartyUsername === "Unknown") return false;
  return (
    normalizeUsername(currentUsername) ===
    normalizeUsername(counterpartyUsername)
  );
};

export const isCurrentUserFirstParty = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (!agreement || !currentUser) return false;
  const currentUsername = currentUser?.username;
  if (!currentUsername) return false;
  const firstPartyUsername = agreement.firstParty?.username;
  if (!firstPartyUsername || firstPartyUsername === "Unknown") return false;
  return (
    normalizeUsername(currentUsername) === normalizeUsername(firstPartyUsername)
  );
};

export const isCurrentUserCreator = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (!agreement || !currentUser) return false;
  const currentUsername = currentUser?.username;
  if (!currentUsername) return false;
  const creatorUsername = agreement.creator?.username;
  if (!creatorUsername || creatorUsername === "Unknown") return false;
  return (
    normalizeUsername(currentUsername) === normalizeUsername(creatorUsername)
  );
};

// ─── Timeline date extractors ─────────────────────────────────────────────────

export const getCompletionDate = (agreement: any): string | null => {
  if (!agreement) return null;
  if (agreement.completedAt) return agreement.completedAt;
  if (agreement.status === AgreementStatusEnum.COMPLETED) {
    if (agreement.timeline?.length > 0) {
      return [...agreement.timeline].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0].createdAt;
    }
    if (agreement.updatedAt) return agreement.updatedAt;
  }
  if (agreement.timeline) {
    const events = agreement.timeline
      .filter(
        (e: any) => e.eventType === AgreementEventTypeEnum.DELIVERY_CONFIRMED,
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    if (events.length > 0) return events[0].createdAt;
  }
  return null;
};

export const getSigningDate = (agreement: any): string | null => {
  if (!agreement) return null;
  if (agreement.timeline) {
    const events = agreement.timeline
      .filter((e: any) => e.eventType === AgreementEventTypeEnum.SIGNED)
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    if (events.length > 0) return events[0].createdAt;
  }
  if (
    agreement.status === AgreementStatusEnum.ACTIVE &&
    agreement.timeline?.length > 0
  ) {
    return [...agreement.timeline].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0].createdAt;
  }
  return null;
};

export const getCancellationDate = (agreement: any): string | null => {
  if (!agreement) return null;
  if (agreement.timeline) {
    const events = agreement.timeline
      .filter(
        (e: any) =>
          e.eventType === AgreementEventTypeEnum.CANCEL_CONFIRMED ||
          e.eventType === AgreementEventTypeEnum.REJECTED ||
          e.eventType === AgreementEventTypeEnum.EXPIRED ||
          e.eventType === AgreementEventTypeEnum.AUTO_CANCELLED,
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    if (events.length > 0) return events[0].createdAt;
  }
  if (
    agreement.status === AgreementStatusEnum.CANCELLED ||
    agreement.status === AgreementStatusEnum.EXPIRED
  ) {
    if (agreement.timeline?.length > 0) {
      return [...agreement.timeline].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0].createdAt;
    }
  }
  return null;
};

export const getDeliverySubmittedDate = (agreement: any): string | null => {
  if (!agreement) return null;
  if (agreement.timeline) {
    const events = agreement.timeline
      .filter((e: any) => e.eventType === AgreementEventTypeEnum.DELIVERED)
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    if (events.length > 0) return events[0].createdAt;
  }
  if (
    agreement.status === AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY &&
    agreement.timeline?.length > 0
  ) {
    return [...agreement.timeline].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0].createdAt;
  }
  return null;
};

// ─── Permission helpers ───────────────────────────────────────────────────────

export const getCancellationRequestedBy = (agreement: any): any => {
  if (!agreement) return null;
  if (agreement.cancelRequestedBy) return agreement.cancelRequestedBy;
  if (agreement.cancelRequestedById)
    return { id: agreement.cancelRequestedById };
  if (agreement._raw?.cancelRequestedBy)
    return agreement._raw.cancelRequestedBy;
  if (agreement._raw?.cancelRequestedById)
    return { id: agreement._raw.cancelRequestedById };
  const timeline = agreement.timeline || agreement._raw?.timeline || [];
  const cancelEvent = timeline.find(
    (e: any) =>
      e.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED || e.type === 7,
  );
  return cancelEvent
    ? cancelEvent.actor || cancelEvent.createdBy || { id: cancelEvent.userId }
    : null;
};

export const isCancellationPending = (agreement: any): boolean => {
  if (!agreement) return false;
  if (agreement.cancelPending) return true;
  if (agreement._raw?.cancelPending) return true;
  if (agreement.context?.cancelPending?.active) return true;
  if (agreement.cancelRequestedById || agreement._raw?.cancelRequestedById)
    return true;
  const timeline = agreement.timeline || agreement._raw?.timeline || [];
  return timeline.some(
    (event: any) =>
      (event.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED ||
        event.type === 7) &&
      !timeline.some(
        (f: any) =>
          (f.eventType === AgreementEventTypeEnum.CANCEL_CONFIRMED ||
            f.eventType === AgreementEventTypeEnum.CANCEL_REJECTED ||
            f.type === 8 ||
            f.type === 9) &&
          new Date(f.createdAt) > new Date(event.createdAt),
      ),
  );
};

export const getDeliveryInitiatedByFromTimeline = (
  agreement: any,
  currentUser: any,
): string | null => {
  if (!agreement || !currentUser) return null;
  const timeline = agreement.timeline || agreement._raw?.timeline || [];
  const deliveryEvents = timeline
    .filter(
      (e: any) =>
        e.type === AgreementEventTypeEnum.DELIVERED ||
        e.eventType === AgreementEventTypeEnum.DELIVERED,
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  if (deliveryEvents.length === 0) return null;
  const latest = deliveryEvents[0];
  return currentUser.id?.toString() === latest.actor?.id?.toString()
    ? "user"
    : "other";
};

export const getDeliveryInitiatedBy = (
  agreement: any,
  currentUser: any,
): string | null => getDeliveryInitiatedByFromTimeline(agreement, currentUser);

export const getCancellationInitiatedBy = (
  agreement: any,
  currentUser: any,
): string | null => {
  if (!agreement || !currentUser) return null;
  if (agreement.context?.cancelPending) {
    const { initiatedByUser, initiatedByOther } =
      agreement.context.cancelPending;
    if (initiatedByUser) return "user";
    if (initiatedByOther) return "other";
  }
  const cancellationRequestedBy = getCancellationRequestedBy(agreement);
  if (!cancellationRequestedBy) return null;
  const currentUserId = currentUser.id || currentUser.userId;
  const requestedById = cancellationRequestedBy.id || cancellationRequestedBy;
  return currentUserId === requestedById ? "user" : "other";
};

export const shouldShowDeliveryReviewButtons = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (
    !agreement ||
    !currentUser ||
    agreement.status !== AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY
  )
    return false;
  if (!agreement.context?.pendingApproval?.active) return false;
  return getDeliveryInitiatedBy(agreement, currentUser) === "other";
};

export const shouldShowCancellationResponseButtons = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (!agreement || !currentUser) return false;
  if (!agreement.context?.cancelPending?.active) return false;
  return getCancellationInitiatedBy(agreement, currentUser) === "other";
};

export const canUserMarkAsDelivered = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (
    !agreement ||
    !currentUser ||
    agreement.status !== AgreementStatusEnum.ACTIVE
  )
    return false;
  return (
    isCurrentUserFirstParty(agreement, currentUser) ||
    isCurrentUserCounterparty(agreement, currentUser)
  );
};

export const canUserRequestCancellation = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (
    !agreement ||
    !currentUser ||
    agreement.status !== AgreementStatusEnum.ACTIVE
  )
    return false;
  const isParty =
    isCurrentUserFirstParty(agreement, currentUser) ||
    isCurrentUserCounterparty(agreement, currentUser);
  return isParty && !isCancellationPending(agreement);
};

// ─── Dispute helpers ──────────────────────────────────────────────────────────

export const getDisputeInfo = (
  agreement: any,
): {
  filedAt: string | null;
  filedBy: string | null;
  filedById: number | null;
  filedByAvatarId: number | null;
} => {
  if (!agreement?._raw?.timeline)
    return {
      filedAt: null,
      filedBy: null,
      filedById: null,
      filedByAvatarId: null,
    };
  const disputeEvent = agreement._raw.timeline.find(
    (e: any) =>
      (e.eventType === AgreementEventTypeEnum.DELIVERY_REJECTED ||
        e.type === 6 ||
        e.type === 17) &&
      e.toStatus === AgreementStatusEnum.DISPUTED,
  );
  if (!disputeEvent)
    return {
      filedAt: null,
      filedBy: null,
      filedById: null,
      filedByAvatarId: null,
    };
  return {
    filedAt: disputeEvent.createdAt || null,
    filedBy: disputeEvent.actor?.username || null,
    filedById: disputeEvent.actor?.id || null,
    filedByAvatarId: disputeEvent.actor?.avatarId || null,
  };
};

export const isDisputeTriggeredByRejection = (agreement: any): boolean => {
  if (!agreement?._raw?.timeline) return false;
  return agreement._raw.timeline.some(
    (e: any) =>
      e.eventType === AgreementEventTypeEnum.DELIVERY_REJECTED || e.type === 6,
  );
};

export const getDisputeFiledByFromTimeline = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (!agreement || !currentUser || !agreement._raw?.timeline) return false;
  const currentUserId = currentUser.id?.toString();
  const disputeEvents = agreement._raw.timeline.filter(
    (e: any) =>
      (e.eventType === AgreementEventTypeEnum.DELIVERY_REJECTED ||
        e.eventType === AgreementEventTypeEnum.DISPUTERAISED ||
        e.type === 6 ||
        e.type === 17) &&
      e.toStatus === AgreementStatusEnum.DISPUTED,
  );
  if (disputeEvents.length === 0) return false;
  const latest = disputeEvents.sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  return currentUserId === latest.actor?.id?.toString();
};

// ─── Status color ─────────────────────────────────────────────────────────────

export const getStatusColor = (status: Agreement["status"]): string => {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "signed":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "expired":
      return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    case "disputed":
      return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    case "pending_approval":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  }
};

// ─── File helpers ─────────────────────────────────────────────────────────────

export const processAgreementFiles = (
  files: any[],
  agreementId: number,
): any[] =>
  files.map((file) => {
    const name = file.fileName;
    const API_BASE =
      import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";
    const fileUrl = `${API_BASE}/agreement/${agreementId}/file/${file.id}`;

    if (/\.(webp|jpg|jpeg|png|gif)$/i.test(name))
      return { name, type: "image", url: fileUrl, preview: fileUrl };
    if (/\.pdf($|\?)/i.test(name))
      return {
        name,
        type: "pdf",
        url: fileUrl,
        preview: "https://placehold.co/600x800/059669/white?text=PDF+Document",
      };
    if (name.match(/chat|screenshot|conversation/i))
      return {
        name,
        type: "chat",
        url: fileUrl,
        preview:
          "https://placehold.co/600x800/1f2937/white?text=Chat+Screenshot",
      };
    return {
      name,
      type: "document",
      url: fileUrl,
      preview: "https://placehold.co/600x800/059669/white?text=Document",
    };
  });

export const getFileType = (filename: string): string => {
  if (!filename) return "document";
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "svg":
      return "image";
    case "doc":
    case "docx":
      return "word";
    case "xls":
    case "xlsx":
      return "excel";
    case "zip":
    case "rar":
    case "7z":
      return "archive";
    case "txt":
      return "text";
    default:
      return "document";
  }
};

// ─── Agreement transformer ────────────────────────────────────────────────────

export const apiStatusToFrontend = (status: number): Agreement["status"] => {
  switch (status) {
    case 1:
      return "pending";
    case 2:
      return "signed";
    case 3:
      return "completed";
    case 4:
      return "disputed";
    case 5:
      return "cancelled";
    case 6:
      return "expired";
    case 7:
      return "pending_approval";
    default:
      return "pending";
  }
};

export const transformApiAgreement = (
  agreementData: any,
  disputeVotingId: number | null,
): Agreement => {
  const firstPartyUsername = getTelegramUsernameFromParty(
    agreementData.firstParty,
  );
  const counterPartyUsername = getTelegramUsernameFromParty(
    agreementData.counterParty,
  );
  const creatorUsername = getTelegramUsernameFromParty(agreementData.creator);
  const disputeId = agreementData.disputes?.[0]?.disputeId || null;
  const hasAmountOrToken = agreementData.amount || agreementData.tokenSymbol;
  const includeFunds = hasAmountOrToken ? "yes" : "no";
  const useEscrow = agreementData.type === AgreementTypeEnum.ESCROW;
  const hasFundsWithoutEscrow = includeFunds === "yes" && !useEscrow;

  return {
    id: agreementData.id,
    title: agreementData.title,
    disputeId: disputeId ? disputeId.toString() : null,
    disputeVotingId: disputeVotingId ?? null,
    description: agreementData.description,
    type:
      agreementData.visibility === AgreementVisibilityEnum.PRIVATE
        ? "Private"
        : "Public",
    counterparty: counterPartyUsername,
    createdBy: firstPartyUsername,
    status: apiStatusToFrontend(agreementData.status),
    dateCreated: agreementData.createdAt,
    deadline: agreementData.deadline,
    amount: agreementData.amount ? agreementData.amount.toString() : undefined,
    token: agreementData.tokenSymbol || undefined,
    includeFunds,
    hasFundsWithoutEscrow,
    useEscrow,
    secureTheFunds: agreementData.hasSecuredFunds || false,
    escrowAddress: agreementData.customTokenAddress || undefined,
    files: agreementData.files?.length || 0,
    images: agreementData.files?.map((f: any) => f.fileName) || [],
    completionDate: getCompletionDate(agreementData) || undefined,
    deliverySubmittedDate: getDeliverySubmittedDate(agreementData) || undefined,
    signingDate: getSigningDate(agreementData) || undefined,
    cancellationDate: getCancellationDate(agreementData) || undefined,
    createdByAvatarId: getAvatarIdFromParty(agreementData.firstParty),
    counterpartyAvatarId: getAvatarIdFromParty(agreementData.counterParty),
    createdByUserId: getUserIdFromParty(agreementData.firstParty),
    counterpartyUserId: getUserIdFromParty(agreementData.counterParty),
    creator: creatorUsername,
    creatorUserId: getUserIdFromParty(agreementData.creator),
    creatorAvatarId: getAvatarIdFromParty(agreementData.creator),
    cancelPending: agreementData.cancelPending || false,
    cancelRequestedById: agreementData.cancelRequestedById?.toString() || null,
    _raw: agreementData,
  };
};

// ─── Signing message ──────────────────────────────────────────────────────────

export const getUltraSimpleSigningMessage = (
  agreement: any,
  currentUser: any,
): string | null => {
  if (!agreement || !currentUser) return null;
  const isPending =
    agreement.status === "pending" || agreement._raw?.status === 1;
  if (!isPending) return null;

  const currentUserId =
    currentUser.id?.toString() || currentUser.userId?.toString();
  const creatorId =
    agreement.creator?.id?.toString() ||
    agreement._raw?.creator?.id?.toString();
  const firstPartyId =
    agreement.firstParty?.id?.toString() ||
    agreement._raw?.firstParty?.id?.toString();
  const counterpartyId =
    agreement.counterParty?.id?.toString() ||
    agreement._raw?.counterParty?.id?.toString();

  const isCreator = currentUserId === creatorId;
  const isFirstParty = currentUserId === firstPartyId;
  const isCounterparty = currentUserId === counterpartyId;

  if (isCreator && isFirstParty) return "Counterparty needs to sign.";
  if (isFirstParty)
    return "You need to sign as first party. You will receive a notification once the counterparty signs.";
  if (isCounterparty)
    return "You need to sign as counterparty. The agreement will be active once you sign";
  return "Agreement is pending signatures.";
};
