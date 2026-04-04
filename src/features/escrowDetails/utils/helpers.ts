/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AgreementStatusEnum,
  AgreementVisibilityEnum,
  AgreementTypeEnum,
  DisputeStatusEnum,
} from "../types";
import type { EscrowDetailsData } from "../types";

// ─── Formatters ───────────────────────────────────────────────────────────────

export const getWalletAddressFromParty = (party: any): string => {
  if (!party) return "Unknown";
  const walletAddress =
    party?.walletAddress ||
    party?.username ||
    party?.wallet ||
    party?.WalletAddress ||
    party?.address;
  if (walletAddress) return walletAddress;
  const telegramUsername = party?.telegramUsername || party?.username;
  if (telegramUsername)
    return telegramUsername.startsWith("@")
      ? telegramUsername
      : `@${telegramUsername}`;
  return "Unknown";
};

export const getUserIdFromParty = (party: any): string =>
  party?.id?.toString() || "";
export const getAvatarIdFromParty = (party: any): number | null => {
  const avatarId = party?.avatarId || party?.avatar?.id;
  return avatarId ? Number(avatarId) : null;
};

export const formatWalletAddress = (address: string): string => {
  if (!address || address === "Unknown") return "Unknown";
  if (address.startsWith("@")) return address;
  if (address.startsWith("0x") && address.length === 42)
    return `${address.slice(0, 4)}...${address.slice(-6)}`;
  if (!address.includes("0x") && address.length <= 15) return `@${address}`;
  return address;
};

export const formatUsernameForDisplay = (username: string): string => {
  if (!username) return "Unknown";
  if (username.startsWith("0x") && username.length === 42)
    return `${username.slice(0, 5)}...${username.slice(-4)}`;
  const telegramPattern = /^[a-zA-Z0-9_]+$/;
  if (
    telegramPattern.test(username.replace(/^@/, "")) &&
    username.length <= 30
  ) {
    return username.startsWith("@") ? username : `@${username}`;
  }
  return username;
};

export const normalizeUsername = (username: string): string => {
  if (!username) return "";
  return username.replace(/^@/, "").toLowerCase().trim();
};

export const getTotalFileSize = (files: File[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  return `${(totalBytes / 1024 / 1024).toFixed(2)} MB`;
};

// ─── API status converter ─────────────────────────────────────────────────────

export const apiStatusToFrontend = (status: number): string => {
  switch (status) {
    case AgreementStatusEnum.PENDING_ACCEPTANCE:
      return "pending";
    case AgreementStatusEnum.ACTIVE:
      return "active";
    case AgreementStatusEnum.COMPLETED:
      return "completed";
    case AgreementStatusEnum.DISPUTED:
      return "disputed";
    case AgreementStatusEnum.CANCELLED:
    case AgreementStatusEnum.EXPIRED:
      return "cancelled";
    case AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY:
      return "pending_approval";
    default:
      return "pending";
  }
};

export const getDisputeStatusFromAgreement = (
  agreement: any,
): string | null => {
  if (!agreement?._raw?.disputes?.length) return null;
  const latestDispute = agreement._raw.disputes[0];
  if (!latestDispute.status) return "disputed";
  switch (latestDispute.status) {
    case DisputeStatusEnum.Pending:
      return "pending";
    case DisputeStatusEnum.VoteInProgress:
      return "voting";
    case DisputeStatusEnum.Settled:
      return "settled";
    case DisputeStatusEnum.Dismissed:
      return "dismissed";
    case DisputeStatusEnum.PendingPayment:
      return "pending_payment";
    case DisputeStatusEnum.PendingLockingFunds:
      return "pending_locking_funds";
    default:
      return "disputed";
  }
};

// ─── Agreement transformer ────────────────────────────────────────────────────

export const transformApiToEscrow = (
  agreementData: any,
): EscrowDetailsData => ({
  id: `${agreementData.id}`,
  title: agreementData.title,
  description: agreementData.description,
  type:
    agreementData.visibility === AgreementVisibilityEnum.PRIVATE
      ? "private"
      : "public",
  from: getWalletAddressFromParty(agreementData.firstParty),
  to: getWalletAddressFromParty(agreementData.counterParty),
  status: apiStatusToFrontend(agreementData.status),
  dateCreated: agreementData.createdAt,
  deadline: agreementData.deadline,
  amount: agreementData.amount ? agreementData.amount.toString() : undefined,
  token: agreementData.tokenSymbol || undefined,
  includeFunds: agreementData.includesFunds ? "yes" : "no",
  useEscrow: agreementData.type === AgreementTypeEnum.ESCROW,
  secureTheFunds: agreementData.hasSecuredFunds || false,
  escrowAddress: agreementData.escrowContractAddress || undefined,
  files: agreementData.files?.length || 0,
  images: agreementData.files?.map((f: any) => f.fileName) || [],
  fromAvatarId: getAvatarIdFromParty(agreementData.firstParty),
  toAvatarId: getAvatarIdFromParty(agreementData.counterParty),
  fromUserId: getUserIdFromParty(agreementData.firstParty),
  toUserId: getUserIdFromParty(agreementData.counterParty),
  creator: getWalletAddressFromParty(agreementData.creator),
  creatorUserId: getUserIdFromParty(agreementData.creator),
  creatorAvatarId: getAvatarIdFromParty(agreementData.creator),
  _raw: agreementData,
});

// ─── File helpers ─────────────────────────────────────────────────────────────

export const processEscrowFiles = (files: any[], escrowId: string): any[] =>
  files
    .filter((f) => !f.fileName.toLowerCase().includes("escrow-draft"))
    .map((file) => {
      const name = file.fileName;
      const API_BASE = import.meta.env.VITE_API_URL;
      const fileUrl = `${API_BASE}/agreement/${escrowId}/file/${file.id}`;
      if (/\.(webp|jpg|jpeg|png|gif)$/i.test(name))
        return { name, type: "image", url: fileUrl, preview: fileUrl };
      if (/\.pdf($|\?)/i.test(name))
        return {
          name,
          type: "pdf",
          url: fileUrl,
          preview:
            "https://placehold.co/600x800/059669/white?text=PDF+Document",
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

// ─── Dispute timeline helpers ─────────────────────────────────────────────────

export const getDisputeEvents = (timeline: any[] | undefined) => {
  if (!timeline || !Array.isArray(timeline)) return null;
  const disputeEvents = timeline.filter(
    (event) => event.type === 6 || (event.type === 17 && event.toStatus === 4),
  );
  if (disputeEvents.length === 0) return null;
  const hasRejectionEvent = disputeEvents.some((e) => e.type === 6);
  const raiseEvent =
    disputeEvents.find((e) => e.type === 17) || disputeEvents[0];
  return { ...raiseEvent, filedViaRejection: hasRejectionEvent };
};

export const getEventActorInfo = (event: any) => {
  if (!event?.actor) return null;
  return {
    username: event.actor.username || getWalletAddressFromParty(event.actor),
    avatarId: event.actor.avatarId || getAvatarIdFromParty(event.actor),
    userId: event.actor.id?.toString(),
  };
};

export const getEventNote = (event: any) =>
  event?.note || event?.description || null;

export const getDisputeInfo = (
  escrowData: any,
): {
  filedAt: string | null;
  filedBy: string | null;
  filedById: number | null;
  filedByAvatarId: number | null;
  filedViaRejection: boolean;
} => {
  if (!escrowData?._raw?.timeline)
    return {
      filedAt: null,
      filedBy: null,
      filedById: null,
      filedByAvatarId: null,
      filedViaRejection: false,
    };

  const disputeEvents = escrowData._raw.timeline.filter(
    (e: any) =>
      e.type === 6 ||
      (e.type === 17 && e.toStatus === AgreementStatusEnum.DISPUTED),
  );
  if (disputeEvents.length === 0)
    return {
      filedAt: null,
      filedBy: null,
      filedById: null,
      filedByAvatarId: null,
      filedViaRejection: false,
    };

  const raiseEvent =
    disputeEvents.find((e: any) => e.type === 17) || disputeEvents[0];
  const hasRejectionEvent = disputeEvents.some((e: any) => e.type === 6);

  return {
    filedAt: raiseEvent.createdAt || null,
    filedBy: raiseEvent.actor?.username || null,
    filedById: raiseEvent.actor?.id || null,
    filedByAvatarId: raiseEvent.actor?.avatarId || null,
    filedViaRejection: hasRejectionEvent,
  };
};

// ─── Status config ────────────────────────────────────────────────────────────

// In your utils/helpers.ts file
export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bgColor: "bg-yellow-700/20",
    borderColor: "border-yellow-400/30",
    textColor: "text-yellow-500",
  },
  signed: {
    label: "Signed",
    bgColor: "bg-blue-700/20",
    borderColor: "border-blue-400/30",
    textColor: "text-blue-500",
  },
  pending_approval: {
    label: "Pending Approval",
    bgColor: "bg-orange-700/20",
    borderColor: "border-orange-400/30",
    textColor: "text-orange-500",
  },
  completed: {
    label: "Completed",
    bgColor: "bg-emerald-700/20",
    borderColor: "border-emerald-400/30",
    textColor: "text-emerald-500",
  },
  disputed: {
    label: "Disputed",
    bgColor: "bg-purple-700/20",
    borderColor: "border-purple-400/30",
    textColor: "text-purple-500",
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "bg-red-700/20",
    borderColor: "border-red-400/30",
    textColor: "text-red-500",
  },
  pending_payment: {
    label: "Pending Payment",
    bgColor: "bg-orange-700/20",
    borderColor: "border-orange-400/30",
    textColor: "text-orange-500",
  },
  pending_locking_funds: {
    label: "Pending Fund Locking",
    bgColor: "bg-orange-700/20",
    borderColor: "border-orange-400/30",
    textColor: "text-orange-500",
  },
} as const;
