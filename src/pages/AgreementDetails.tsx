/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  // XCircle,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Image,
  Paperclip,
  UserCheck,
  X,
  ThumbsUp,
  ThumbsDown,
  Package,
  PackageCheck,
  Ban,
  Info,
  Download,
  Wallet,
  Scale,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { VscVerifiedFilled } from "react-icons/vsc";
import { Button } from "../components/ui/button";
import {
  agreementService,
  AgreementTypeEnum,
  type AgreementDeliveryRejectedRequest,
} from "../services/agreementServices";
import type { Agreement } from "../types";
import { toast } from "sonner";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/apiClient";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import OpenDisputeModal from "../components/OpenDisputeModal";
import EvidenceViewer from "../components/disputes/modals/EvidenceViewer";
import { EvidenceDisplay } from "../components/disputes/EvidenceDisplay";
import { disputeService } from "../services/disputeServices";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useDisputeTransaction } from "../hooks/useDisputeTransaction";
// import { TransactionStatus } from "../components/TransactionStatus";
import { connectSocket } from "../services/socket";
import { Socket } from "socket.io-client";

// ============= WEBSOCKET TYPES =============
// Replace your existing AgreementEventType definition with this
export type AgreementEventType =
  | 1 // Created
  | 2 // Signed
  | 3 // Rejected
  | 4 // Delivered
  | 5 // DeliveryConfirmed
  | 6 // DeliveryRejected
  | 7 // CancelRequested
  | 8 // CancelConfirmed
  | 9 // CancelRejected
  | 10 // Expired
  | 11 // AutoCancelled
  | 13 // Completed
  | 14 // FundDeposited
  | 15 // MilestoneClaimed
  | 16 // MilestoneHoldUpdated
  | 17 // DisputeRaised
  | 18 // DisputeSettled
  | 19; // DisputeUpdated - NEW: Dispute status updated (e.g., from Pending Payment to active)

interface ServerToClientEvents {
  "agreement:event": (payload: AgreementSocketEventPayload) => void;
}

interface ClientToServerEvents {
  "agreement:join": (
    payload: AgreementSocketJoinRequest,
    ack: (res: AgreementSocketJoinDTO) => void,
  ) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface AgreementSocketEventPayload {
  agreementId: number;
  type: AgreementEventType;
  eventId: number | null;
}

export interface AgreementSocketJoinRequest {
  agreementId: number;
}

export interface AgreementSocketJoinDTO {
  ok: boolean;
  error?: number;
}

// API Enum Mappings
const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
  PARTY_SUBMITTED_DELIVERY: 7,
} as const;

// Event Timeline Enum (from backend)
const AgreementEventTypeEnum = {
  CREATED: 1,
  SIGNED: 2,
  REJECTED: 3,
  DELIVERED: 4,
  DELIVERY_CONFIRMED: 5,
  DELIVERY_REJECTED: 6,
  CANCEL_REQUESTED: 7,
  CANCEL_CONFIRMED: 8,
  CANCEL_REJECTED: 9,
  EXPIRED: 10,
  AUTO_CANCELLED: 11,
  DISPUTED: 12,
  COMPLETED: 13,
  DISPUTERAISED: 17,
} as const;

const DisputeTypeEnum = {
  ProBono: 1,
  Paid: 2,
} as const;

type DisputeTypeEnumValue =
  (typeof DisputeTypeEnum)[keyof typeof DisputeTypeEnum];

// Helper function to convert API status to frontend status
const apiStatusToFrontend = (status: number): Agreement["status"] => {
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
      return "cancelled"; // Keep as "cancelled"
    case AgreementStatusEnum.EXPIRED: // Add this case
      return "expired"; // Return "expired" instead of "cancelled"
    case AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY:
      return "pending_approval";
    default:
      return "pending";
  }
};

const formatNumberWithCommas = (value: string | undefined): string => {
  if (!value) return "";

  // Remove any existing commas and format with new commas
  const numericValue = value.replace(/,/g, "");

  // Split into whole and decimal parts
  const parts = numericValue.split(".");
  let wholePart = parts[0];
  const decimalPart = parts[1] || "";

  // Format whole part with commas
  if (wholePart) {
    wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Combine parts
  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart;
};

// Helper function to format creator username
const formatCreatorUsername = (username: string | undefined): string => {
  if (!username) return "Unknown";

  // Remove @ symbol if present
  const cleanUsername = username.startsWith("@") ? username.slice(1) : username;

  // Check if it's a wallet address (starts with 0x and is hex)
  if (cleanUsername.startsWith("0x") && cleanUsername.length === 42) {
    // Slice the wallet address: first 5 chars + "..." + last 4 chars
    return `${cleanUsername.slice(0, 5)}...${cleanUsername.slice(-4)}`;
  }

  // Return as-is without @ symbol
  return cleanUsername;
};

// Helper function to format wallet addresses consistently
const formatWalletAddress = (address: string | undefined): string => {
  if (!address) return "Unknown";

  // Remove @ symbol if present
  const cleanAddress = address.startsWith("@") ? address.slice(1) : address;

  // Check if it's a wallet address (starts with 0x and is hex)
  if (cleanAddress.startsWith("0x") && cleanAddress.length === 42) {
    // Slice the wallet address: first 5 chars + "..." + last 4 chars
    return `${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`;
  }

  // Return as-is
  return cleanAddress;
};

// Add this function to generate a voting ID
const generateVotingId = (): string => {
  // Generate a random 6-digit number between 100000 and 999999
  const min = 100000;
  const max = 999999;
  const votingId = Math.floor(Math.random() * (max - min + 1)) + min;
  return votingId.toString();
};

// Add this helper function (similar to the one in DisputeDetails)
const processAgreementFiles = (files: any[], agreementId: number): any[] => {
  return files.map((file) => {
    const name = file.fileName;

    // Function to get file URL
    const getFileUrl = (): string => {
      // Use the same API endpoint pattern as in DisputeDetails
      const API_BASE = import.meta.env.VITE_API_URL;
      return `${API_BASE}/agreement/${agreementId}/file/${file.id}`;
    };

    const fileUrl = getFileUrl();

    // Determine file type
    if (/\.(webp|jpg|jpeg|png|gif)$/i.test(name)) {
      return {
        name,
        type: "image",
        url: fileUrl,
        preview: fileUrl,
      };
    } else if (/\.pdf($|\?)/i.test(name)) {
      return {
        name,
        type: "pdf",
        url: fileUrl,
        preview: "https://placehold.co/600x800/059669/white?text=PDF+Document",
      };
    } else if (name.match(/chat|screenshot|conversation/i)) {
      return {
        name,
        type: "chat",
        url: fileUrl,
        preview:
          "https://placehold.co/600x800/1f2937/white?text=Chat+Screenshot",
      };
    } else {
      return {
        name,
        type: "document",
        url: fileUrl,
        preview: "https://placehold.co/600x800/059669/white?text=Document",
      };
    }
  });
};

const getTelegramUsernameFromParty = (party: any): string => {
  if (!party) return "Unknown";

  // Priority 1: Check for telegramUsername field (if available in API)
  const telegramUsername = party?.telegramUsername || party?.username;

  if (!telegramUsername) return "Unknown";

  // Ensure it starts with @ for display consistency
  return telegramUsername.startsWith("@")
    ? telegramUsername
    : `@${telegramUsername}`;
};

// Helper function to get user ID from party data
const getUserIdFromParty = (party: any) => {
  return party?.id?.toString();
};

// Helper function to normalize usernames (remove @ prefix for comparison)
const normalizeUsername = (username: string): string => {
  if (!username) return "";
  return username.replace(/^@/, "").toLowerCase().trim();
};

// Helper to check if current user is counterparty
const isCurrentUserCounterparty = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return false;

  // Use username for comparison (not Telegram username)
  const currentUsername = currentUser?.username;
  if (!currentUsername) return false;

  const counterpartyUsername = agreement.counterParty?.username;
  if (!counterpartyUsername || counterpartyUsername === "Unknown") return false;

  return (
    normalizeUsername(currentUsername) ===
    normalizeUsername(counterpartyUsername)
  );
};

// Helper to check if current user is first party
const isCurrentUserFirstParty = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return false;

  // Use username for comparison (not Telegram username)
  const currentUsername = currentUser?.username;
  if (!currentUsername) return false;

  const firstPartyUsername = agreement.firstParty?.username;
  if (!firstPartyUsername || firstPartyUsername === "Unknown") return false;

  return (
    normalizeUsername(currentUsername) === normalizeUsername(firstPartyUsername)
  );
};

// Helper to check if current user is creator
const isCurrentUserCreator = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return false;

  // Use username for comparison (not Telegram username)
  const currentUsername = currentUser?.username;
  if (!currentUsername) return false;

  const creatorUsername = agreement.creator?.username;
  if (!creatorUsername || creatorUsername === "Unknown") return false;

  return (
    normalizeUsername(currentUsername) === normalizeUsername(creatorUsername)
  );
};

// NEW: Enhanced helper to check who initiated delivery using context
// Timeline-based helper to check who initiated delivery
const getDeliveryInitiatedByFromTimeline = (
  agreement: any,
  currentUser: any,
) => {
  if (!agreement || !currentUser) return null;

  const timeline = agreement.timeline || agreement._raw?.timeline || [];

  // Find the most recent DELIVERED event (type 4)
  const deliveryEvents = timeline.filter(
    (event: any) =>
      event.type === AgreementEventTypeEnum.DELIVERED ||
      event.eventType === AgreementEventTypeEnum.DELIVERED,
  );

  if (deliveryEvents.length === 0) {
    return null;
  }

  // Get the most recent delivery event
  const latestDelivery = deliveryEvents.sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  // console.log("📊 Timeline-based delivery check:", {
  //   deliveryEvent: latestDelivery,
  //   actorId: latestDelivery.actor?.id,
  //   actorUsername: latestDelivery.actor?.username,
  //   currentUserId: currentUser.id,
  //   currentUsername: currentUser.username,
  //   actorIsCurrentUser:
  //     latestDelivery.actor?.id?.toString() === currentUser.id?.toString(),
  // });

  // Check if current user is the actor who delivered
  const currentUserId = currentUser.id?.toString();
  const actorId = latestDelivery.actor?.id?.toString();

  if (currentUserId === actorId) {
    return "user"; // Current user initiated delivery
  } else {
    return "other"; // Other party initiated delivery
  }
};

// Enhanced getDeliveryInitiatedBy that uses timeline as primary source
const getDeliveryInitiatedBy = (agreement: any, currentUser: any) => {
  // Priority 1: Use timeline (most reliable)
  const timelineResult = getDeliveryInitiatedByFromTimeline(
    agreement,
    currentUser,
  );
  if (timelineResult) {
    // console.log("✅ Using timeline result:", timelineResult);
    return timelineResult;
  }

  // Priority 3: Ultimate fallback
  // console.log("❌ No delivery initiation info found");
  return null;
};

// NEW: Enhanced helper to check who initiated cancellation using context
const getCancellationInitiatedBy = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return null;

  // Priority 1: Check context.cancelPending from API
  if (agreement.context?.cancelPending) {
    const { initiatedByUser, initiatedByOther } =
      agreement.context.cancelPending;

    if (initiatedByUser) return "user";
    if (initiatedByOther) return "other";
  }

  // Priority 2: Fallback to existing logic
  const cancellationRequestedBy = getCancellationRequestedBy(agreement);
  if (!cancellationRequestedBy) return null;

  const currentUserId = currentUser.id || currentUser.userId;
  const requestedById = cancellationRequestedBy.id || cancellationRequestedBy;

  return currentUserId === requestedById ? "user" : "other";
};

// Add this helper function to check who filed the dispute using timeline
const getDisputeFiledByFromTimeline = (
  agreement: any,
  currentUser: any,
): boolean => {
  if (!agreement || !currentUser || !agreement._raw?.timeline) return false;

  const timeline = agreement._raw.timeline;
  const currentUserId = currentUser.id?.toString();

  // Look for dispute filing events
  const disputeEvents = timeline.filter((event: any) => {
    // Check for events that lead to DISPUTED status
    return (
      (event.eventType === AgreementEventTypeEnum.DELIVERY_REJECTED ||
        event.eventType === AgreementEventTypeEnum.DISPUTERAISED ||
        event.type === 6 ||
        event.type === 17) && // Type 1 is "raised a dispute"
      event.toStatus === AgreementStatusEnum.DISPUTED
    );
  });

  if (disputeEvents.length === 0) return false;

  // Get the most recent dispute event
  const latestDisputeEvent = disputeEvents.sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  // Check if current user is the one who filed the dispute
  const actorId = latestDisputeEvent.actor?.id?.toString();

  return currentUserId === actorId;
};

// Helper to check who submitted the delivery
// const getDeliverySubmittedBy = (agreement: any) => {
//   if (!agreement) return null;

//   // Priority 1: Check if we have delivery submission info in the API response
//   if (agreement.deliverySubmittedBy) {
//     return agreement.deliverySubmittedBy;
//   }

//   // Priority 2: Check in _raw data
//   if (agreement._raw?.deliverySubmittedBy) {
//     return agreement._raw.deliverySubmittedBy;
//   }

//   // Priority 3: Check context for delivery initiator
//   if (agreement.context?.pendingApproval) {
//     // If context shows who initiated, use that to determine the user
//     const { initiatedByUser, initiatedByOther } =
//       agreement.context.pendingApproval;

//     if (initiatedByUser) {
//       // Current user initiated - return current user's ID
//       return { id: agreement._raw?.currentUserId };
//     }
//     if (initiatedByOther) {
//       // Other party initiated - return the other party's ID
//       const currentUserId = agreement._raw?.currentUserId;
//       const firstPartyId = agreement._raw?.firstParty?.id;
//       const counterpartyId = agreement._raw?.counterParty?.id;

//       // Return the ID of the party that is NOT the current user
//       return currentUserId === firstPartyId
//         ? { id: counterpartyId }
//         : { id: firstPartyId };
//     }
//   }

//   // Priority 4: Fallback: check timeline events for delivery submission
//   if (agreement._raw?.timeline) {
//     const deliveryEvent = agreement._raw.timeline.find(
//       (event: any) => event.eventType === AgreementEventTypeEnum.DELIVERED,
//     );
//     if (deliveryEvent) {
//       return deliveryEvent.createdBy || deliveryEvent.userId;
//     }
//   }

//   return null;
// };

// NEW: Helper to check which parties have signed the agreement
// ULTRA SIMPLE: Status-based message display
const getUltraSimpleSigningMessage = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return null;

  // Only for pending agreements
  const isPendingAgreement =
    agreement.status === "pending" ||
    agreement._raw?.status === AgreementStatusEnum.PENDING_ACCEPTANCE;

  if (!isPendingAgreement) {
    return null;
  }

  // Check if current user is creator
  const currentUserId =
    currentUser.id?.toString() || currentUser.userId?.toString();
  const creatorId =
    agreement.creator?.id?.toString() ||
    agreement._raw?.creator?.id?.toString();
  const isCreator = currentUserId === creatorId;

  // Check if current user is first party
  const firstPartyId =
    agreement.firstParty?.id?.toString() ||
    agreement._raw?.firstParty?.id?.toString();
  const isFirstParty = currentUserId === firstPartyId;

  // Check if current user is counterparty
  const counterpartyId =
    agreement.counterParty?.id?.toString() ||
    agreement._raw?.counterParty?.id?.toString();
  const isCounterparty = currentUserId === counterpartyId;

  // SIMPLE LOGIC:
  if (isCreator && isFirstParty) {
    // Creator is first party (auto-signed scenario)
    return "Counterparty needs to sign.";
  } else if (isFirstParty) {
    // First party (not creator or creator didn't auto-sign)
    return "You need to sign as first party. You will receive a notification once the counterparty signs.";
  } else if (isCounterparty) {
    // Counterparty
    return "You need to sign as counterparty. The agreement will be active once you sign";
  }

  // Fallback
  return "Agreement is pending signatures.";
};
// Enhanced helper to check who requested cancellation with fallbacks
const getCancellationRequestedBy = (agreement: any) => {
  if (!agreement) return null;

  // Priority 1: Check if we have cancellation request info in the API response
  if (agreement.cancelRequestedBy) {
    return agreement.cancelRequestedBy;
  }

  // Priority 2: Check cancelRequestedById (THIS IS THE KEY FIELD!)
  if (agreement.cancelRequestedById) {
    return { id: agreement.cancelRequestedById };
  }

  // Priority 3: Check in _raw data
  if (agreement._raw?.cancelRequestedBy) {
    return agreement._raw.cancelRequestedBy;
  }

  if (agreement._raw?.cancelRequestedById) {
    return { id: agreement._raw.cancelRequestedById };
  }

  // Priority 4: Fallback: check timeline events for cancellation request
  const timeline = agreement.timeline || agreement._raw?.timeline || [];
  const cancelEvent = timeline.find(
    (event: any) =>
      event.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED ||
      event.type === 7,
  );

  if (cancelEvent) {
    return (
      cancelEvent.actor || cancelEvent.createdBy || { id: cancelEvent.userId }
    );
  }

  return null;
};

// Enhanced helper to check if cancellation is pending using multiple methods
const isCancellationPending = (agreement: any): boolean => {
  if (!agreement) return false;

  // Method 1: Direct flag from API
  if (agreement.cancelPending) {
    return true;
  }

  // Method 2: Check _raw data
  if (agreement._raw?.cancelPending) {
    return true;
  }

  // Method 3: Check context.cancelPending
  if (agreement.context?.cancelPending?.active) {
    return true;
  }

  // Method 4: Check if there's a cancelRequestedById (this is crucial!)
  if (agreement.cancelRequestedById || agreement._raw?.cancelRequestedById) {
    return true;
  }

  // Method 5: Check timeline for pending cancellation request (as fallback)
  const timeline = agreement.timeline || agreement._raw?.timeline || [];

  const hasPendingCancellation = timeline.some(
    (event: any) =>
      (event.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED ||
        event.type === 7) &&
      // Check if there's no corresponding confirm/reject event yet
      !timeline.some(
        (followup: any) =>
          (followup.eventType === AgreementEventTypeEnum.CANCEL_CONFIRMED ||
            followup.eventType === AgreementEventTypeEnum.CANCEL_REJECTED ||
            followup.type === 8 || // CANCEL_CONFIRMED
            followup.type === 9) && // CANCEL_REJECTED
          new Date(followup.createdAt) > new Date(event.createdAt),
      ),
  );

  return hasPendingCancellation;
};

const shouldShowDeliveryReviewButtons = (agreement: any, currentUser: any) => {
  if (
    !agreement ||
    !currentUser ||
    agreement.status !== AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY
  ) {
    return false;
  }

  // Check if delivery is pending approval using context
  const isDeliveryPending = agreement.context?.pendingApproval?.active;
  if (!isDeliveryPending) {
    return false;
  }

  const initiatedBy = getDeliveryInitiatedBy(agreement, currentUser);

  // Show review buttons to the party that did NOT initiate delivery
  return initiatedBy === "other";
};

// NEW: Fixed helper to check if current user should see cancellation response buttons
const shouldShowCancellationResponseButtons = (
  agreement: any,
  currentUser: any,
) => {
  if (!agreement || !currentUser) {
    return false;
  }

  // Check if cancellation is pending using context
  const isCancellationPending = agreement.context?.cancelPending?.active;
  if (!isCancellationPending) {
    return false;
  }

  // Use the new context-based initiatedBy check
  const initiatedBy = getCancellationInitiatedBy(agreement, currentUser);

  // Only show response buttons to the OTHER party (the one who didn't request cancellation)
  return initiatedBy === "other";
};

// Helper to check if current user can mark as delivered
const canUserMarkAsDelivered = (agreement: any, currentUser: any) => {
  if (
    !agreement ||
    !currentUser ||
    agreement.status !== AgreementStatusEnum.ACTIVE
  ) {
    return false;
  }

  const isFirstParty = isCurrentUserFirstParty(agreement, currentUser);
  const isCounterparty = isCurrentUserCounterparty(agreement, currentUser);

  // Both parties can mark as delivered when agreement is active
  return isFirstParty || isCounterparty;
};

// Enhanced helper to check if current user can request cancellation
const canUserRequestCancellation = (agreement: any, currentUser: any) => {
  if (
    !agreement ||
    !currentUser ||
    agreement.status !== AgreementStatusEnum.ACTIVE
  ) {
    return false;
  }

  const isFirstParty = isCurrentUserFirstParty(agreement, currentUser);
  const isCounterparty = isCurrentUserCounterparty(agreement, currentUser);

  // Check if there's already a pending cancellation
  const hasPendingCancellation = isCancellationPending(agreement);

  // Both parties can request cancellation ONLY if no cancellation request exists
  return (isFirstParty || isCounterparty) && !hasPendingCancellation;
};

// Helper to get completion date from timeline
const getCompletionDate = (agreement: any): string | null => {
  if (!agreement) return null;

  // Priority 1: Direct completion date field
  if (agreement.completedAt) {
    return agreement.completedAt;
  }

  // Priority 2: Check if status is completed and use logic based on timeline
  if (agreement.status === AgreementStatusEnum.COMPLETED) {
    // Use the most recent timeline event
    if (agreement.timeline && agreement.timeline.length > 0) {
      const sortedTimeline = [...agreement.timeline].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedTimeline[0].createdAt;
    }

    // Fallback to updatedAt
    if (agreement.updatedAt) {
      return agreement.updatedAt;
    }
  }

  // Priority 3: Look for specific event types
  if (agreement.timeline) {
    const completionEvents = agreement.timeline.filter(
      (event: any) =>
        event.eventType === AgreementEventTypeEnum.DELIVERY_CONFIRMED,
    );

    if (completionEvents.length > 0) {
      const sortedEvents = completionEvents.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedEvents[0].createdAt;
    }
  }

  return null;
};

// Helper to get agreement signing date from timeline
const getSigningDate = (agreement: any): string | null => {
  if (!agreement) return null;

  // Priority 1: Look for signing events (SIGNED = 2)
  if (agreement.timeline) {
    const signingEvents = agreement.timeline.filter(
      (event: any) => event.eventType === AgreementEventTypeEnum.SIGNED,
    );

    if (signingEvents.length > 0) {
      // Get the most recent signing event (when both parties have signed)
      const sortedEvents = signingEvents.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedEvents[0].createdAt;
    }
  }

  // Priority 2: If status is active/signed but no specific event, use timeline logic
  if (agreement.status === AgreementStatusEnum.ACTIVE) {
    // Use the most recent timeline event date as signing date
    if (agreement.timeline && agreement.timeline.length > 0) {
      const sortedTimeline = [...agreement.timeline].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedTimeline[0].createdAt;
    }
  }

  return null;
};

// Helper to get cancellation date from timeline
const getCancellationDate = (agreement: any): string | null => {
  if (!agreement) return null;

  // Priority 1: Look for cancellation events
  if (agreement.timeline) {
    const cancellationEvents = agreement.timeline.filter(
      (event: any) =>
        // event.eventType === AgreementEventTypeEnum.CANCELLED ||
        event.eventType === AgreementEventTypeEnum.CANCEL_CONFIRMED ||
        event.eventType === AgreementEventTypeEnum.REJECTED ||
        event.eventType === AgreementEventTypeEnum.EXPIRED ||
        event.eventType === AgreementEventTypeEnum.AUTO_CANCELLED,
    );

    if (cancellationEvents.length > 0) {
      // Get the most recent cancellation event
      const sortedEvents = cancellationEvents.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedEvents[0].createdAt;
    }
  }

  // Priority 2: If status is cancelled but no specific event, use timeline logic
  if (
    agreement.status === AgreementStatusEnum.CANCELLED ||
    agreement.status === AgreementStatusEnum.EXPIRED
  ) {
    // Use the most recent timeline event date as cancellation date
    if (agreement.timeline && agreement.timeline.length > 0) {
      const sortedTimeline = [...agreement.timeline].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedTimeline[0].createdAt;
    }
  }

  return null;
};

// Helper to get delivery submission date from timeline
const getDeliverySubmittedDate = (agreement: any): string | null => {
  if (!agreement) return null;

  // Priority 1: Look for delivery submission event (DELIVERED = 4)
  if (agreement.timeline) {
    const deliveryEvents = agreement.timeline.filter(
      (event: any) => event.eventType === AgreementEventTypeEnum.DELIVERED,
    );

    if (deliveryEvents.length > 0) {
      const sortedEvents = deliveryEvents.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedEvents[0].createdAt;
    }
  }

  // Priority 2: If status is pending approval but no specific event, use timeline logic
  if (agreement.status === AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY) {
    // Use the most recent timeline event date as delivery submission date
    if (agreement.timeline && agreement.timeline.length > 0) {
      const sortedTimeline = [...agreement.timeline].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return sortedTimeline[0].createdAt;
    }
  }

  return null;
};

// helper function to check if dispute was triggered by delivery rejection
const isDisputeTriggeredByRejection = (agreement: any): boolean => {
  if (!agreement?._raw?.timeline) return false;

  // Look specifically for DELIVERY_REJECTED event (type 6) that leads to DISPUTED status
  const deliveryRejectionEvent = agreement._raw.timeline.find(
    (event: any) =>
      event.eventType === AgreementEventTypeEnum.DELIVERY_REJECTED ||
      event.type === 6,
  );

  return !!deliveryRejectionEvent;
};

// Enhanced date formatting with time for all displays
// Enhanced date formatting with time for all displays - with null handling
const formatDateWithTime = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return "Not set";
  }

  const date = new Date(dateString);

  // Check if date is valid (not January 1, 1970 which indicates null/undefined/unix epoch)
  if (isNaN(date.getTime()) || date.getTime() === 0) {
    return "Not set";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDisputeInfo = (
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

  // Look for dispute events (type 17 or DELIVERY_REJECTED type 6 that leads to DISPUTED status)
  const disputeEvent = agreement._raw.timeline.find(
    (event: any) =>
      (event.eventType === AgreementEventTypeEnum.DELIVERY_REJECTED ||
        event.type === 6 ||
        event.type === 17) && // Type 17 is "raised a dispute"
      event.toStatus === AgreementStatusEnum.DISPUTED,
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

const RejectDeliveryModal = ({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  isSubmitting,
  agreement,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    claim: string,
    requestKind: DisputeTypeEnumValue,
    chainId?: number,
    votingId?: string,
    transactionHash?: string,
  ) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  isSubmitting: boolean;
  agreement: any;
}) => {
  const [requestKind, setRequestKind] = useState<DisputeTypeEnumValue | null>(
    null,
  );
  const networkInfo = useNetworkEnvironment();
  const { user: currentUser } = useAuth();

  // Generate voting ID
  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  // In RejectDeliveryModal.tsx
  const handleSubmit = async () => {
    if (!requestKind) {
      toast.error("Please select a dispute type");
      return;
    }
    if (!claim.trim()) {
      toast.error("Claim description is required");
      return;
    }

    console.log("🚀 [RejectDeliveryModal] Starting rejection flow:", {
      claim: claim.trim(),
      requestKind:
        requestKind === DisputeTypeEnum.ProBono ? "Pro Bono" : "Paid",
      chainId: networkInfo.chainId,
      votingId: votingIdToUse, // This is the generated ID
    });

    try {
      // Pass the votingId to onConfirm
      await onConfirm(
        claim,
        requestKind,
        networkInfo.chainId,
        votingIdToUse.toString(), // Make sure this is passed correctly
      );

      setClaim("");
      onClose();
    } catch (error: any) {
      console.error("❌ [RejectDeliveryModal] Submit error:", error);
      toast.error("Failed to create dispute", {
        description: error.message || "Please try again.",
        duration: 5000,
      });
    }
  };

  // Determine the other party as defendant
  const getDefendant = () => {
    if (!agreement || !currentUser) return "Unknown";

    // Helper to check if current user is first party
    const normalizeUsername = (username: string): string => {
      if (!username) return "";
      return username.replace(/^@/, "").toLowerCase().trim();
    };

    const isCurrentUserFirstParty = () => {
      if (!agreement || !currentUser) return false;
      const currentUsername = currentUser?.username;
      if (!currentUsername) return false;
      const firstPartyUsername = agreement.firstParty?.username;
      if (!firstPartyUsername || firstPartyUsername === "Unknown") return false;
      return (
        normalizeUsername(currentUsername) ===
        normalizeUsername(firstPartyUsername)
      );
    };

    const isFirstParty = isCurrentUserFirstParty();
    return isFirstParty ? agreement.counterparty : agreement.createdBy;
  };

  const defendant = getDefendant();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl sm:max-w-[40rem]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
            <AlertTriangle className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Reject Delivery & Open Dispute
            </h2>
            <p className="text-sm text-red-300">
              This will create a dispute with the other party
            </p>
          </div>
        </div>

        {/* Dispute Info Summary */}
        <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
          <h4 className="mb-2 text-base font-medium text-purple-300">
            Summary
          </h4>
          <div className="space-y-3">
            {/* Agreement Title */}
            <div className="space-y-1">
              <span className="mb-2 text-sm text-purple-200/80">
                Agreement Title:
              </span>
              <p className="text-sm font-medium break-words text-white">
                {agreement?.title || "No title"}
              </p>
            </div>

            {/* Agreement Description */}
            <div className="space-y-1">
              <span className="mb-3 text-sm text-purple-200/80">
                Agreement Description:
              </span>
              <p className="text-sm break-words whitespace-pre-line text-white/90">
                {agreement?.description || "No description provided"}
              </p>
            </div>

            {/* Defendant */}
            <div className="space-y-1">
              <span className="mb-3 text-sm text-purple-200/80">Defendant</span>
              <p className="text-sm break-words whitespace-pre-line text-white/90">
                {defendant}
              </p>
            </div>
          </div>
        </div>

        {/* Dispute Type Selection */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-purple-300">
            Dispute Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-4 text-center transition ${
                requestKind === DisputeTypeEnum.ProBono
                  ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="disputeType"
                className="hidden"
                checked={requestKind === DisputeTypeEnum.ProBono}
                onChange={() => {
                  console.log("📝 [RejectDeliveryModal] Selected Pro Bono");
                  setRequestKind(DisputeTypeEnum.ProBono);
                }}
              />
              <Scale className="h-5 w-5" />
              <div>
                <div className="font-medium">Pro Bono</div>
                <div className="text-xs opacity-80">
                  Free dispute resolution
                </div>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-4 text-center transition ${
                requestKind === DisputeTypeEnum.Paid
                  ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="disputeType"
                className="hidden"
                checked={requestKind === DisputeTypeEnum.Paid}
                onChange={() => {
                  console.log("📝 [RejectDeliveryModal] Selected Paid");
                  setRequestKind(DisputeTypeEnum.Paid);
                }}
              />
              <Wallet className="h-5 w-5" />
              <div>
                <div className="font-medium">Paid</div>
                <div className="text-xs opacity-80">Priority resolution</div>
              </div>
            </label>
          </div>

          {/* Dispute Type Info */}
          <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
              <div className="text-xs text-cyan-200">
                {requestKind === DisputeTypeEnum.ProBono ? (
                  <span>
                    <span className="font-medium">Pro Bono:</span> No fee
                    required. Judges will handle your case when available. May
                    have longer wait times.
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">Paid:</span> A fee is required
                    to initiate your dispute. This fee helps prioritize your
                    case and notifies all judges to begin reviewing it
                    immediately.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Contract Info for Paid Disputes */}
        {requestKind === DisputeTypeEnum.Paid && (
          <div className="mb-6 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-300" />
              <h4 className="text-sm font-medium text-emerald-200">
                Smart Contract Transaction Required
              </h4>
            </div>
            <p className="mt-2 text-xs text-emerald-300/80">
              For paid disputes, you'll need to confirm a transaction in your
              wallet to record the dispute on-chain. You'll be prompted to
              complete the payment after creating the dispute.
            </p>
            <div className="mt-3 text-xs text-emerald-400">
              <div className="flex items-center gap-1">
                <span>•</span>
                <span>Network: {networkInfo.chainName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Claim input */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-muted-foreground text-sm">
              Claim <span className="text-red-500">*</span>
            </label>
            <div className="group relative cursor-help">
              <Info className="h-4 w-4 text-cyan-300" />
              <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                Make sure it's reasonable, as that might help your case when the
                judges look into it.
              </div>
            </div>
          </div>
          <textarea
            value={claim}
            onChange={(e) => {
              setClaim(e.target.value);
            }}
            placeholder="Describe why you're rejecting this delivery (optional)"
            className="h-32 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            required
          />

          <p className="mt-1 text-xs text-gray-400">
            You can add more details and evidence on the dispute page.
          </p>
        </div>

        {/* Log Preview */}
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
            <div className="text-xs">
              <p className="font-medium text-yellow-300">What will happen:</p>
              <ul className="mt-1 space-y-1 text-yellow-200/80">
                <li>• Dispute will be created with {defendant}</li>
                <li>
                  • Type:{" "}
                  {requestKind === DisputeTypeEnum.ProBono
                    ? "Pro Bono"
                    : "Paid"}
                </li>
                {requestKind === DisputeTypeEnum.Paid && (
                  <li>
                    • Smart contract transaction will be required after creation
                  </li>
                )}
                <li>• You can add evidence, witnesses in the Dispute page</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className={`w-full py-2 sm:w-auto ${
              requestKind === DisputeTypeEnum.Paid
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20"
            }`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Creating Dispute...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Reject & Open Dispute
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Unified Pending Dispute Modal - Works for both Open Dispute and Reject Delivery flows
const PendingDisputeModal = ({
  isOpen,
  onClose,
  votingId,
  agreement,
  onDisputeCreated,
  flow = "reject",
}: {
  isOpen: boolean;
  onClose: () => void;
  votingId: number;
  agreement: any;
  onDisputeCreated: () => void;
  flow?: "reject" | "open";
}) => {
  const networkInfo = useNetworkEnvironment();
  const [userInitiated, setUserInitiated] = useState(false);
  const [modalState, setModalState] = useState<
    "initializing" | "active" | "closing"
  >("initializing");

  // Add ref to prevent double transaction initiation
  const hasStartedTransaction = useRef(false);

  const {
    transactionStep,
    isProcessing,
    transactionHash,
    transactionError,
    createDisputeOnchain,
    retryTransaction,
    resetTransaction,
    isSuccess,
    isError,
  } = useDisputeTransaction(networkInfo.chainId);

  useEffect(() => {
    if (isSuccess && transactionHash) {
      console.log(
        `✅ [PendingDisputeModal] Transaction successful! Hash: ${transactionHash}, Flow: ${flow}, Voting ID: ${votingId}`,
      );

      setModalState("closing");

      // Don't close immediately - wait for WebSocket event
      // The modal will close when WebSocket receives DisputeUpdated event

      // Just show success message
      toast.success("Payment successful! Waiting for confirmation...", {
        description: "Your dispute will be activated momentarily.",
        duration: 3000,
      });

      // We'll let the WebSocket event handle closing the modal
      // The onDisputeCreated will be called when WebSocket event arrives
    }
  }, [isSuccess, transactionHash, flow, onDisputeCreated, votingId]);

  // Handle transaction error
  useEffect(() => {
    if (isError) {
      console.error(`❌ [PendingDisputeModal] Transaction failed:`, {
        error: transactionError,
        votingId,
        chainId: networkInfo.chainId,
        flow,
      });

      setModalState("active");
      setUserInitiated(false);
      // Don't reset hasStartedTransaction on error to prevent auto-retry
    }
  }, [isError, transactionError, votingId, networkInfo.chainId, flow]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log(
        `♻️ [PendingDisputeModal] Modal closed, resetting state, Flow: ${flow}`,
      );
      resetTransaction();
      setUserInitiated(false);
      setModalState("initializing");
      hasStartedTransaction.current = false; // Reset ref when modal closes
    }
  }, [isOpen, resetTransaction, flow]);

  const handleStartPayment = useCallback(async () => {
    if (!votingId || userInitiated || isProcessing) return;

    console.log(
      `🚀 [PendingDisputeModal] User initiated payment for voting ID: ${votingId}, Flow: ${flow}`,
    );

    setUserInitiated(true);
    setModalState("active");

    try {
      await createDisputeOnchain(votingId);
      console.log(
        `✅ [PendingDisputeModal] Transaction initiated, Flow: ${flow}`,
      );
    } catch (error) {
      console.error(
        `❌ [PendingDisputeModal] Failed to start transaction:`,
        error,
      );
      setUserInitiated(false);
    }
  }, [votingId, userInitiated, isProcessing, flow, createDisputeOnchain]);

  const handleRetryPayment = useCallback(async () => {
    console.log(
      `🔄 [PendingDisputeModal] Retrying payment for voting ID: ${votingId}, Flow: ${flow}`,
    );

    setUserInitiated(false);
    await retryTransaction(votingId);
  }, [votingId, flow, retryTransaction]);

  // Get custom status messages and icons based on modal state and flow
  const getStatusConfig = () => {
    // Initial state - waiting for user to click (for both flows)
    if (
      modalState === "initializing" &&
      transactionStep === "idle" &&
      !userInitiated
    ) {
      return {
        title: "Ready to Pay",
        description:
          "Click the button below to start the payment process for your dispute.",
        icon: <Wallet className="h-12 w-12 text-yellow-400" />,
        spinner: false,
        className: "text-yellow-400",
      };
    }

    switch (transactionStep) {
      case "pending":
        return {
          title: "Processing Payment...",
          description:
            "Confirm the transaction in your wallet to complete payment.",
          icon: <Loader2 className="h-12 w-12 animate-spin text-blue-400" />,
          spinner: true,
          className: "text-blue-400",
        };
      case "success":
        return {
          title: "Payment Successful!",
          description:
            flow === "reject"
              ? "Your dispute is now active."
              : "Your dispute is now active.",
          icon: <CheckCircle className="h-12 w-12 text-green-400" />,
          spinner: false,
          className: "text-green-400",
        };
      case "error":
        return {
          title: "Payment Failed",
          description:
            transactionError?.message ||
            "The transaction could not be completed.",
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          spinner: false,
          className: "text-red-400",
        };
      default:
        return {
          title: "Ready for Payment",
          description: "Please confirm the transaction in your wallet.",
          icon: <Wallet className="h-12 w-12 text-yellow-400" />,
          spinner: false,
          className: "text-yellow-400",
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Show transaction hash when available
  const showTransactionHash = transactionHash && (
    <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <span className="text-xs font-medium text-green-300">
          Transaction Hash:
        </span>
      </div>
      <div className="mt-1 font-mono text-xs break-all text-green-200">
        {transactionHash}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          disabled={
            isProcessing ||
            transactionStep === "pending" ||
            transactionStep === "success"
          }
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
            <AlertTriangle className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {transactionStep === "success"
                ? "Payment Complete!"
                : "Complete Payment"}
            </h2>
            <p className="text-sm text-purple-300">
              {transactionStep === "success"
                ? "Your dispute is now active"
                : "Complete the transaction to activate your dispute"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-6">
          {/* <div className="mb-6">
            <TransactionStatus
              status={transactionStep}
              onRetry={handleRetryPayment}
              title={statusConfig.title}
              description={statusConfig.description}
              showRetryButton={true}
              className={statusConfig.className}
            />
          </div> */}

          {/* Status Icon and Message */}
          <div className="mb-8 flex flex-col items-center justify-center text-center">
            <div className="mb-4">{statusConfig.icon}</div>
            <div>
              <h3
                className={`mb-2 text-lg font-semibold ${statusConfig.className}`}
              >
                {statusConfig.title}
              </h3>
              <p
                className={`max-w-md truncate text-sm ${statusConfig.className}`}
              >
                {statusConfig.description}
              </p>
            </div>
          </div>

          {/* Progress Indicator for pending state */}
          {transactionStep === "pending" && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-purple-300">Processing Transaction</span>
                <span className="font-medium text-purple-200">
                  Waiting for confirmation...
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-500/20">
                <div
                  className="h-full animate-pulse bg-gradient-to-r from-purple-400 to-purple-500"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          )}

          {/* Transaction Hash Display - This will now show for both flows */}
          <div className="mb-2">{transactionHash && showTransactionHash}</div>

          {/* Transaction Information */}
          <div className="space-y-4">
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <h4 className="mb-2 text-sm font-medium text-purple-300">
                Transaction Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Agreement:</span>
                  <span className="text-white">
                    {agreement?.title || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Type:</span>
                  <span className="text-white">Paid Dispute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Flow:</span>
                  <span className="text-white capitalize">{flow}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Voting ID:</span>
                  <span className="font-mono text-white">{votingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Network:</span>
                  <span className="text-white">{networkInfo.chainName}</span>
                </div>
              </div>
            </div>

            {/* Smart Contract Info */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <div className="text-xs text-blue-200">
                  This transaction records your dispute on the blockchain for
                  transparency and security. Please confirm the transaction in
                  your wallet when prompted.
                </div>
              </div>
            </div>

            {/* Error details for debugging */}
            {/* {transactionError && (
              <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <div className="text-xs">
                    <p className="font-medium text-red-300">Error Details:</p>
                    <p className="mt-1 max-h-[6rem] overflow-y-scroll text-sm break-all text-red-200/80 opacity-90">
                      {transactionError.message || "Unknown error occurred"}
                    </p>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* Action Buttons - Now both flows show the Pay button */}
        <div className="flex justify-end space-x-3">
          {transactionStep === "idle" && !userInitiated && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="neon"
                onClick={handleStartPayment}
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                disabled={isProcessing}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Pay & Activate Dispute
              </Button>
            </>
          )}

          {transactionStep === "error" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={handleRetryPayment}
                className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  "Retry Payment"
                )}
              </Button>
            </>
          )}

          {transactionStep === "success" && (
            <Button
              variant="outline"
              onClick={() => {
                console.log(
                  `🎯 [PendingDisputeModal] Continue button clicked, Flow: ${flow}`,
                );
                onDisputeCreated();
                onClose();
              }}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              Continue to Dispute
            </Button>
          )}
        </div>

        {/* Footer with helpful info */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info className="h-3 w-3" />
            <span>
              If you encounter issues, try refreshing the page or check your
              wallet connection.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AgreementDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  // const networkInfo = useNetworkEnvironment();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [disputeStatus, setDisputeStatus] = useState<any | null>(null);
  const [disputeVotingId, setDisputeVotingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEscrowAddress, setShowEscrowAddress] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting] = useState(false);
  const [isRespondingToCancel, setIsRespondingToCancel] = useState(false);
  const [isOpeningDispute] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectClaim, setRejectClaim] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [rejectDisputeStatus, setRejectDisputeStatus] = useState<any | null>(
    null,
  );
  // ADD THESE NEW STATE VARIABLES
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const [pendingModalState, setPendingModalState] = useState<{
    isOpen: boolean;
    votingId: number | null;
    flow: "reject" | "open";
  }>({
    isOpen: false,
    votingId: null,
    flow: "reject",
  });

  // ============= WEBSOCKET REF =============
  const socketRef = useRef<TypedSocket | null>(null);

  // Get dispute information
  const disputeInfo = agreement
    ? getDisputeInfo(agreement)
    : { filedAt: null, filedBy: null, filedById: null };

  // Wrap fetchAgreementDetails in useCallback to prevent unnecessary re-renders
  const fetchAgreementDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const agreementId = parseInt(id);
      // Remove .data here - the service returns the data directly
      const agreementData =
        await agreementService.getAgreementDetails(agreementId);

      console.log("📋 AgreementDetails API Response:", agreementData);

      // Helper function to extract avatar ID from party data and convert to number
      const getAvatarIdFromParty = (party: any): number | null => {
        const avatarId = party?.avatarId || party?.avatar?.id;
        return avatarId ? Number(avatarId) : null;
      };

      // TEMPORARY: Use username fields as Telegram usernames during transition
      const firstPartyUsername = getTelegramUsernameFromParty(
        agreementData.firstParty,
      );

      const disputeId = agreementData.disputes?.[0]?.disputeId || null;
      console.log("📋 Dispute ID:", disputeId);

      const counterPartyUsername = getTelegramUsernameFromParty(
        agreementData.counterParty,
      );
      const creatorUsername = getTelegramUsernameFromParty(
        agreementData.creator,
      );

      // 🆕 FIXED: Detect funds inclusion based on amount/token presence since API doesn't return includesFunds
      const hasAmountOrToken =
        agreementData.amount || agreementData.tokenSymbol;
      const includeFunds = hasAmountOrToken ? "yes" : "no";

      // 🆕 FIXED: Detect escrow usage based on type since API doesn't return secureTheFunds
      const useEscrow = agreementData.type === AgreementTypeEnum.ESCROW;

      // Determine if funds are included but escrow is not used
      const hasFundsWithoutEscrow = includeFunds === "yes" && !useEscrow;

      const completionDate = getCompletionDate(agreementData);
      const deliverySubmittedDate = getDeliverySubmittedDate(agreementData);
      const signingDate = getSigningDate(agreementData);
      const cancellationDate = getCancellationDate(agreementData);

      // Transform API data to frontend format
      const transformedAgreement: Agreement = {
        id: agreementData.id,
        title: agreementData.title,
        disputeId: disputeId ? disputeId.toString() : null,
        disputeVotingId: disputeVotingId ? disputeVotingId : null,
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
        amount: agreementData.amount
          ? agreementData.amount.toString()
          : undefined,
        token: agreementData.tokenSymbol || undefined,
        includeFunds: includeFunds,
        hasFundsWithoutEscrow: hasFundsWithoutEscrow,
        useEscrow: useEscrow,
        secureTheFunds: agreementData.hasSecuredFunds || false,
        escrowAddress: agreementData.customTokenAddress || undefined,
        files: agreementData.files?.length || 0,
        images: agreementData.files?.map((file: any) => file.fileName) || [],

        // Store completion date
        completionDate: completionDate || undefined,
        deliverySubmittedDate: deliverySubmittedDate || undefined,
        signingDate: signingDate || undefined,
        cancellationDate: cancellationDate || undefined,

        // Avatar and user IDs
        createdByAvatarId: getAvatarIdFromParty(agreementData.firstParty),
        counterpartyAvatarId: getAvatarIdFromParty(agreementData.counterParty),
        createdByUserId: getUserIdFromParty(agreementData.firstParty),
        counterpartyUserId: getUserIdFromParty(agreementData.counterParty),

        // Creator information
        creator: creatorUsername,
        creatorUserId: getUserIdFromParty(agreementData.creator),
        creatorAvatarId: getAvatarIdFromParty(agreementData.creator),

        // Cancellation properties
        cancelPending: agreementData.cancelPending || false,
        cancelRequestedById:
          agreementData.cancelRequestedById?.toString() || null,

        // Store raw API data for role checking
        _raw: agreementData,
      };

      setAgreement(transformedAgreement);
    } catch (error) {
      console.error("Failed to fetch agreement:", error);
      toast.error("Failed to load agreement details");
      setAgreement(null);
    } finally {
      setLoading(false);
    }
  }, [id, disputeVotingId]);

  // Wrap fetchAgreementDetailsBackground in useCallback to stabilize the reference
  const fetchAgreementDetailsBackground = useCallback(async () => {
    if (isRefreshing || !id) return;

    setIsRefreshing(true);
    try {
      const agreementId = parseInt(id);
      // Remove .data here too
      const agreementData =
        await agreementService.getAgreementDetails(agreementId);

      // Use the same transformation logic but WITHOUT setting loading state
      const getAvatarIdFromParty = (party: any): number | null => {
        const avatarId = party?.avatarId || party?.avatar?.id;
        return avatarId ? Number(avatarId) : null;
      };

      // TEMPORARY: Use username fields as Telegram usernames during transition
      const firstPartyUsername = getTelegramUsernameFromParty(
        agreementData.firstParty,
      );
      const counterPartyUsername = getTelegramUsernameFromParty(
        agreementData.counterParty,
      );
      const creatorUsername = getTelegramUsernameFromParty(
        agreementData.creator,
      );

      const disputeId = agreementData.disputes?.[0]?.disputeId || null;
      console.log("📋 Dispute ID:", disputeId);

      // 🆕 FIXED: Detect funds inclusion based on amount/token presence since API doesn't return includesFunds
      const hasAmountOrToken =
        agreementData.amount || agreementData.tokenSymbol;
      const includeFunds = hasAmountOrToken ? "yes" : "no";

      // 🆕 FIXED: Detect escrow usage based on type since API doesn't return secureTheFunds
      const useEscrow = agreementData.type === AgreementTypeEnum.ESCROW;
      const hasFundsWithoutEscrow = includeFunds === "yes" && !useEscrow;

      const completionDate = getCompletionDate(agreementData);
      const deliverySubmittedDate = getDeliverySubmittedDate(agreementData);
      const signingDate = getSigningDate(agreementData);
      const cancellationDate = getCancellationDate(agreementData);

      const transformedAgreement: Agreement = {
        id: agreementData.id,
        title: agreementData.title,
        disputeId: disputeId ? disputeId.toString() : null,
        disputeVotingId: disputeVotingId ? disputeVotingId : null,
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
        amount: agreementData.amount
          ? agreementData.amount.toString()
          : undefined,
        token: agreementData.tokenSymbol || undefined,
        includeFunds: includeFunds,
        hasFundsWithoutEscrow: hasFundsWithoutEscrow,
        useEscrow: useEscrow,
        escrowAddress: agreementData.customTokenAddress || undefined,
        files: agreementData.files?.length || 0,
        images: agreementData.files?.map((file: any) => file.fileName) || [],
        completionDate: completionDate || undefined,
        deliverySubmittedDate: deliverySubmittedDate || undefined,
        signingDate: signingDate || undefined,
        cancellationDate: cancellationDate || undefined,
        createdByAvatarId: getAvatarIdFromParty(agreementData.firstParty),
        counterpartyAvatarId: getAvatarIdFromParty(agreementData.counterParty),
        createdByUserId: getUserIdFromParty(agreementData.firstParty),
        counterpartyUserId: getUserIdFromParty(agreementData.counterParty),
        creator: creatorUsername,
        creatorUserId: getUserIdFromParty(agreementData.creator),
        creatorAvatarId: getAvatarIdFromParty(agreementData.creator),
        cancelPending: agreementData.cancelPending || false,
        cancelRequestedById:
          agreementData.cancelRequestedById?.toString() || null,
        _raw: agreementData,
      };

      // Update the agreement state WITHOUT triggering loading state
      setAgreement(transformedAgreement);
    } catch (error) {
      console.error("Background agreement fetch failed:", error);
      // Don't show toast for background failures to avoid annoying the user
    } finally {
      setIsRefreshing(false);
      setLastUpdate(Date.now());
    }
  }, [id, isRefreshing, disputeVotingId]);

  // Fetch dispute details - UPDATED WITH BETTER ERROR HANDLING
  useEffect(() => {
    if (!agreement?.disputeId) return;

    const disputeId = parseInt(agreement?.disputeId);
    if (isNaN(disputeId)) {
      return;
    }

    const fetchDisputeDetails = async () => {
      try {
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        console.log("✅ Received dispute details:", disputeDetails);

        const transformedDispute =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        console.log(
          "✅ Transformed dispute Status:",
          transformedDispute.status,
        );

        setDisputeStatus(transformedDispute.status);
        if (transformedDispute.votingId !== undefined) {
          setDisputeVotingId(transformedDispute.votingId);
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch dispute details:", error);
      }
    };

    fetchDisputeDetails();
  }, [agreement?.disputeId]);

  // Initial fetch
  useEffect(() => {
    fetchAgreementDetails();
  }, [id, fetchAgreementDetails]);

  // ============= WEBSOCKET EFFECT =============
  useEffect(() => {
    const token = localStorage.getItem("authToken") ?? "";
    if (!token || !id) return;

    const agreementId = Number(id);
    const socket = connectSocket(token) as TypedSocket;
    socketRef.current = socket;

    socket.emit("agreement:join", { agreementId }, (ack) => {
      console.log("[WS] agreement:join ack", ack);
      if (!ack.ok) console.warn("[WS] join failed", ack);
    });

    socket.on("agreement:event", async (event) => {
      if (event.agreementId !== agreementId) return;

      console.log("📡 Agreement event received:", event);

      // Handle DisputeUpdated event (type 19)
      if (event.type === 19) {
        console.log("⚖️ Dispute status updated! Refreshing dispute data...");

        // Close the pending modal if open
        setPendingModalState({
          isOpen: false,
          votingId: null,
          flow: "reject",
        });

        // Refresh dispute details if we have a dispute ID
        if (agreement?.disputeId) {
          const disputeIdNum = parseInt(agreement.disputeId);
          if (!isNaN(disputeIdNum)) {
            try {
              const disputeDetails =
                await disputeService.getDisputeDetails(disputeIdNum);
              const transformedDispute =
                disputeService.transformDisputeDetailsToRow(disputeDetails);

              console.log(
                "✅ Updated dispute status:",
                transformedDispute.status,
              );

              // Update dispute status
              setDisputeStatus(transformedDispute.status);

              // Also update rejectDisputeStatus if applicable
              if (isDisputeTriggeredByRejection(agreement)) {
                setRejectDisputeStatus(transformedDispute.status);
              }

              // Show success toast if status changed from Pending Payment
              if (
                disputeStatus === "Pending Payment" &&
                transformedDispute.status !== "Pending Payment"
              ) {
                toast.success("Dispute is now active!", {
                  description: `Status: ${transformedDispute.status}`,
                  duration: 3000,
                });
              }
            } catch (error) {
              console.error(
                "❌ Failed to fetch updated dispute details:",
                error,
              );
            }
          }
        }
      }

      // Always refresh agreement data for any event
      fetchAgreementDetailsBackground();
    });

    return () => {
      socket.off("agreement:event");
      socket.disconnect();
    };
  }, [
    id,
    fetchAgreementDetailsBackground,
    agreement?.disputeId,
    disputeStatus,
    agreement,
  ]);

  // ADD THIS EVENT LISTENER FOR CROSS-TAB UPDATES (keep this as backup)
  useEffect(() => {
    const handleAgreementUpdate = (event: CustomEvent) => {
      if (event.detail.agreementId === parseInt(id || "")) {
        fetchAgreementDetailsBackground();
      }
    };

    window.addEventListener(
      "agreementUpdated",
      handleAgreementUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "agreementUpdated",
        handleAgreementUpdate as EventListener,
      );
    };
  }, [id, fetchAgreementDetailsBackground]);

  const handleSignAgreement = async () => {
    if (!id || !agreement) return;

    console.log("🔍 DEBUG Sign Agreement:", {
      agreementId: id,
      currentUser: user,
      isCounterparty,
      isFirstParty,
      isCreator,
      agreementStatus: agreement.status,
      rawAgreement: agreement._raw,
      hasFunds: agreement.includeFunds === "yes",
      useEscrow: agreement.useEscrow,
      // 🆕 ADD THIS: Check the actual backend secureTheFunds field
      secureTheFunds: agreement._raw?.secureTheFunds,
      userWallet: user?.walletAddress,
    });

    // 🆕 FIXED: Check both frontend AND backend indicators for escrow requirement
    const requiresEscrow =
      agreement.useEscrow || agreement._raw?.secureTheFunds;

    if (
      agreement.includeFunds === "yes" &&
      requiresEscrow &&
      !user?.walletAddress
    ) {
      toast.error(
        "Wallet connection required for agreements secured with escrow",
      );
      return;
    }

    // ✅ For agreements with funds but NO escrow/secureTheFunds, allow signing without wallet

    setIsSigning(true);
    try {
      const agreementId = parseInt(id);

      // 🆕 ADD DEBUG LOG BEFORE API CALL
      console.log("🚀 Making API call to sign agreement:", {
        agreementId,
        hasFunds: agreement.includeFunds === "yes",
        useEscrow: agreement.useEscrow,
        secureTheFunds: agreement._raw?.secureTheFunds,
        requiresEscrow,
        hasWallet: !!user?.walletAddress,
      });

      const response = await agreementService.signAgreement(agreementId, true);
      console.log("✅ Sign agreement response:", response);

      toast.success("Agreement signed successfully!");
      await fetchAgreementDetailsBackground();
    } catch (error: any) {
      console.error("❌ Failed to sign agreement:", error);

      // Enhanced error logging
      console.error("📋 FULL ERROR DETAILS:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Handle specific error codes
      if (error.response?.data) {
        const errorCode = error.response.data.error;
        const errorMessage = error.response.data.message;

        switch (errorCode) {
          case 12: // MissingWallet
            // 🆕 IMPROVED: Provide more specific guidance based on agreement type
            if (
              agreement.includeFunds === "yes" &&
              (agreement.useEscrow || agreement._raw?.secureTheFunds)
            ) {
              toast.error(
                "Wallet connection required for escrow-secured agreements",
              );
            } else {
              toast.error(
                "Unexpected wallet requirement. Please contact support.",
              );
            }
            break;
          case 16: // InvalidStatus
            toast.error("Agreement is not in a signable state");
            break;
          case 17: // Forbidden
            toast.error("You are not authorized to sign this agreement");
            break;
          default:
            toast.error(errorMessage || "Failed to sign agreement");
        }
      } else {
        toast.error("Failed to sign agreement. Please try again.");
      }
    } finally {
      setIsSigning(false);
    }
  };

  // Cancel Agreement Handler - UPDATED
  const handleCancelAgreement = async () => {
    if (!id || !agreement) return;

    // SIMPLE CHECK: Use the same logic as the permission check
    const hasCancellationRequest =
      agreement.cancelPending ||
      agreement._raw?.cancelPending ||
      agreement.cancelRequestedById ||
      agreement._raw?.cancelRequestedById ||
      (agreement._raw?.timeline?.some(
        (event: any) =>
          event.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED,
      ) ??
        false);

    if (hasCancellationRequest) {
      toast.error("There is already a pending cancellation request.");
      return;
    }

    if (!confirm("Are you sure you want to cancel this agreement?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const agreementId = parseInt(id);

      if (agreement.status === "pending") {
        await agreementService.deleteAgreement(agreementId);
        toast.success("Agreement cancelled successfully!");
        navigate("/agreements");
      } else {
        const response = await agreementService.requestCancelation(agreementId);
        console.log("✅ requestCancelation API response:", response);

        toast.success(
          "Cancellation requested! Waiting for counterparty confirmation.",
        );

        // Use enhanced fetch instead of manual timeouts
        await fetchAgreementDetailsBackground();
      }
    } catch (error: any) {
      console.error("❌ Failed to cancel agreement:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to cancel agreement. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  // Respond to Cancelation Request
  const handleRespondToCancelation = async (accepted: boolean) => {
    if (!id || !agreement) return;

    // SIMPLE CHECK: Look for any cancellation request in ANY timeline location
    const timeline = agreement.timeline || agreement._raw?.timeline || [];
    const hasCancelRequest = timeline.some(
      (event: any) =>
        event.type === 7 ||
        event.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED,
    );

    if (!hasCancelRequest) {
      toast.error("No pending cancellation request found.");
      return;
    }

    setIsRespondingToCancel(true);
    try {
      const agreementId = parseInt(id);
      await agreementService.respondToCancelation(agreementId, accepted);

      if (accepted) {
        toast.success("Cancellation accepted! Agreement has been cancelled.");
      } else {
        toast.success("Cancellation rejected! Agreement remains active.");
      }

      await fetchAgreementDetailsBackground();
    } catch (error: any) {
      console.error("Failed to respond to cancellation:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to respond to cancellation. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsRespondingToCancel(false);
    }
  };

  // Mark as Delivered Handler - BIDIRECTIONAL
  const handleMarkAsDelivered = async () => {
    if (!id || !agreement) return;

    setIsCompleting(true);
    try {
      const agreementId = parseInt(id);
      await agreementService.markAsDelivered(agreementId);

      toast.success("Delivery marked! Waiting for the other party's approval.");
      await fetchAgreementDetailsBackground();
    } catch (error: any) {
      console.error("Failed to mark as delivered:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to mark as delivered. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  // Confirm Delivery Handler - BIDIRECTIONAL
  const handleConfirmDelivery = async () => {
    if (!id || !agreement) return;

    setIsConfirming(true);
    try {
      const agreementId = parseInt(id);
      await agreementService.confirmDelivery(agreementId);

      toast.success("Delivery confirmed! Agreement completed.");
      await fetchAgreementDetailsBackground();
    } catch (error: any) {
      console.error("Failed to confirm delivery:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to confirm delivery. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  // Reject Delivery Handler - BIDIRECTIONAL with dispute logic

  // Open the reject modal instead of immediately rejecting
  const handleRejectDelivery = () => {
    if (!id || !agreement) return;
    setIsRejectModalOpen(true);
  };

  // In AgreementDetails.tsx - Update handleConfirmReject
  const handleConfirmReject = async (
    claim: string,
    requestKind: DisputeTypeEnumValue,
    chainId?: number,
    votingId?: string, // This comes from RejectDeliveryModal
    transactionHash?: string,
  ) => {
    if (!id || !agreement) return;

    setIsSubmittingReject(true);
    try {
      const agreementId = parseInt(id);
      // Use the votingId passed from the modal, NOT generate a new one
      const votingIdToUse = votingId || generateVotingId(); // Fallback just in case

      console.log("📝 [handleConfirmReject] Using voting ID:", votingIdToUse);

      const payload: AgreementDeliveryRejectedRequest = {
        votingId: votingIdToUse.toString(),
        claim: claim.trim(),
        requestKind: requestKind,
        ...(chainId && { chainId: chainId }),
      };

      // Create the dispute via API
      const response = await agreementService.rejectDelivery(
        agreementId,
        payload,
      );
      console.log(
        response,
        "✅ Dispute created with voting ID:",
        votingIdToUse,
      );

      // Store the voting ID and show pending modal for paid disputes
      if (requestKind === DisputeTypeEnum.Paid && !transactionHash) {
        setIsRejectModalOpen(false);
        setRejectClaim("");

        // Set both statuses to "Pending Payment" immediately
        setRejectDisputeStatus("Pending Payment");
        setDisputeStatus("Pending Payment");

        setPendingModalState({
          isOpen: true,
          votingId: parseInt(votingIdToUse), // Use the SAME voting ID
          flow: "reject",
        });

        toast.success(
          "Dispute created! Please confirm the transaction in your wallet.",
          {
            description: "Your paid dispute is being created.",
            duration: 5000,
          },
        );
      } else {
        // For pro bono disputes
        toast.success(`Delivery rejected! Dispute created.`, {
          description: `Voting ID: ${votingIdToUse}.`,
          duration: 5000,
        });

        setIsRejectModalOpen(false);
        setRejectClaim("");
        await fetchAgreementDetailsBackground();
      }
    } catch (error: any) {
      console.error("❌ Failed to reject delivery:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to reject delivery. Please try again.";

      toast.error("Failed to reject delivery", {
        description: errorMessage,
        duration: 5000,
      });

      setIsRejectModalOpen(false);
      setRejectClaim("");
      throw error;
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Open Dispute Handler
  const handleOpenDispute = () => {
    if (!id || !agreement) return;

    console.log("🔄 Opening dispute modal with status:", disputeStatus);
    console.log("📋 Agreement disputeId:", agreement.disputeId);
    console.log("💰 Dispute voting ID:", agreement.disputeVotingId);

    setIsDisputeModalOpen(true);
  };

  const handleCompletePayment = () => {
    if (!id || !agreement) return;

    // Get voting ID (could be number from disputeVotingId or string from elsewhere)
    const votingId = agreement.disputeVotingId;
    if (!votingId) {
      console.error("No voting ID found for dispute");
      toast.error("Unable to process payment: Missing voting ID");
      return;
    }

    console.log("💰 Opening payment modal for dispute:", {
      votingId,
      disputeStatus,
    });

    // Convert to number if it's a string (for the pending modal which expects number)
    const votingIdAsNumber =
      typeof votingId === "string" ? parseInt(votingId, 10) : votingId;

    if (isNaN(votingIdAsNumber)) {
      console.error("Invalid voting ID format:", votingId);
      toast.error("Unable to process payment: Invalid voting ID format");
      return;
    }

    // REMOVE THE TRANSITION LOADER AND OPEN MODAL IMMEDIATELY
    setPendingModalState({
      isOpen: true,
      votingId: votingIdAsNumber,
      flow: "open",
    });
  };

  const handleDisputeCreated = useCallback(() => {
    console.log("🔄 handleDisputeCreated called");
  }, []);

  const handlePaidDisputeCreated = useCallback(
    (votingId: string | number, flow: "open") => {
      console.log(
        `💰 Paid dispute created with voting ID: ${votingId}, flow: ${flow}`,
      );

      // Convert to number if it's a string
      const votingIdAsNumber =
        typeof votingId === "string" ? parseInt(votingId, 10) : votingId;

      if (isNaN(votingIdAsNumber)) {
        console.error("❌ Invalid voting ID format:", votingId);
        toast.error("Invalid voting ID received");
        return;
      }

      console.log("📝 Storing voting ID for payment:", votingIdAsNumber);

      // Store the voting ID from the API response
      setDisputeVotingId(votingIdAsNumber);

      // Also update the agreement object to include this voting ID
      setAgreement((prev) =>
        prev
          ? {
              ...prev,
              disputeVotingId: votingIdAsNumber,
            }
          : null,
      );

      // Set dispute status to Pending Payment
      setDisputeStatus("Pending Payment");
      setRejectDisputeStatus("Pending Payment");

      // REMOVE THE TRANSITION LOADER AND OPEN MODAL IMMEDIATELY
      setPendingModalState({
        isOpen: true,
        votingId: votingIdAsNumber, // Use the API's voting ID
        flow,
      });
    },
    [],
  );
  // For the "Mark as Delivered" button condition:

  const disputeTriggeredByRejection = agreement
    ? isDisputeTriggeredByRejection(agreement)
    : false;

  const getStatusColor = (status: Agreement["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "signed":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "expired": // Add this case
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      case "disputed":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      case "pending_approval":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  // const getDisputeStatusIcon = () => {
  //   return <CheckCircle className="h-5 w-5 text-green-400" />;
  // };

  const getDisputeStatusColor = () => {
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDownloadFile = async (fileIndex: number) => {
    if (!id || !agreement) return;

    try {
      const agreementId = parseInt(id);

      // Show loading state
      toast.info("Downloading file...");

      // Get file information from agreement data
      const files = agreement._raw?.files || [];
      if (files.length === 0 || fileIndex >= files.length) {
        toast.error("File not found in agreement data");
        return;
      }

      const file = files[fileIndex];
      const fileId = file.id;

      if (!fileId) {
        toast.error("File ID not found");
        return;
      }

      // Create a custom download function that preserves the original filename
      await downloadFileWithOriginalName(agreementId, fileId, file.fileName);
      toast.success("File downloaded successfully!");
    } catch (error: any) {
      console.error("Failed to download file:", error);
      const errorMessage =
        error.message || "Failed to download file. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Enhanced download function that preserves original filename
  const downloadFileWithOriginalName = async (
    agreementId: number,
    fileId: number,
    originalFileName: string,
  ) => {
    try {
      const response = await api.get(
        `/agreement/${agreementId}/file/${fileId}`,
        {
          responseType: "blob",
        },
      );

      // Use the original filename from the file data
      let filename = originalFileName;

      // If the original filename doesn't have an extension, try to get it from headers
      if (!filename.includes(".")) {
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
      }

      // Create blob with proper MIME type
      const contentType = response.headers["content-type"];
      const blob = contentType
        ? new Blob([response.data], { type: contentType })
        : new Blob([response.data]);

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  };
  // Add these handler functions
  const handleViewEvidence = (evidence: any) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
  };

  // Helper function to determine file type
  const getFileType = (filename: string): string => {
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

  // Helper function to get appropriate file icon
  const getFileIcon = (fileType: string) => {
    const className = "h-5 w-5";

    switch (fileType) {
      case "pdf":
        return <FileText className={`${className} text-red-400`} />;
      case "image":
        return <Image className={`${className} text-green-400`} />;
      case "word":
        return <FileText className={`${className} text-blue-400`} />;
      case "excel":
        return <FileText className={`${className} text-green-500`} />;
      case "archive":
        return <Paperclip className={`${className} text-yellow-400`} />;
      case "text":
        return <FileText className={`${className} text-gray-400`} />;
      default:
        return <Paperclip className={`${className} text-cyan-400`} />;
    }
  };

  // Helper function to format file size
  // const getFileSizeDisplay = (fileSize?: number): string => {
  //   if (!fileSize) return "Unknown size";

  //   const sizes = ["Bytes", "KB", "MB", "GB"];
  //   const i = Math.floor(Math.log(fileSize) / Math.log(1024));
  //   return (
  //     Math.round((fileSize / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  //   );
  // };

  // FIXED: Enhanced counterparty detection
  const isCounterparty =
    agreement && user ? isCurrentUserCounterparty(agreement._raw, user) : false;

  // FIXED: Enhanced first party detection
  const isFirstParty =
    agreement && user ? isCurrentUserFirstParty(agreement._raw, user) : false;

  // FIXED: Enhanced creator detection
  const isCreator =
    agreement && user ? isCurrentUserCreator(agreement._raw, user) : false;

  // Check if user is a participant (either first party or counterparty)
  const isParticipant = isFirstParty || isCounterparty;

  // Check if user can view the agreement (participants, creator, or public agreement)
  const canViewAgreement =
    isParticipant || isCreator || (agreement && agreement.type === "Public");

  // FIXED: Enhanced signing permissions
  // First party should only auto-sign if they are the creator
  // Otherwise, both parties need to sign manually
  const canSign =
    agreement?.status === "pending" &&
    (isCounterparty || (isFirstParty && !isCreator));

  const signingStatusMessage = getUltraSimpleSigningMessage(agreement, user);

  // FIXED: Only the creator can cancel pending agreements
  const canCancel = agreement?.status === "pending" && isCreator;

  // FIXED: Request Cancellation Permissions
  const canRequestCancellation = canUserRequestCancellation(
    agreement?._raw,
    user,
  );

  // NEW: Use the fixed context-based helpers for response buttons
  const canRespondToCancellation = shouldShowCancellationResponseButtons(
    agreement?._raw,
    user,
  );

  // BIDIRECTIONAL DELIVERY PERMISSIONS
  const canMarkDelivered = canUserMarkAsDelivered(agreement?._raw, user);

  // NEW: Use the fixed context-based helper for delivery review
  const canReviewDelivery = shouldShowDeliveryReviewButtons(
    agreement?._raw,
    user,
  );

  // NEW: Check who initiated delivery using context
  const deliveryInitiatedBy = getDeliveryInitiatedBy(agreement?._raw, user);
  const isCurrentUserInitiatedDelivery = deliveryInitiatedBy === "user";

  // NEW: Check who initiated cancellation using context
  const cancellationInitiatedBy = getCancellationInitiatedBy(
    agreement?._raw,
    user,
  );
  const isCurrentUserInitiatedCancellation = cancellationInitiatedBy === "user";

  // Dispute permissions
  const canOpenDispute =
    (agreement?.status === "signed" ||
      agreement?.status === "pending_approval") &&
    isParticipant;
  const canCancelDispute = agreement?.status === "disputed" && isParticipant;

  const completionDate = getCompletionDate(agreement?._raw);
  const deliverySubmittedDate = getDeliverySubmittedDate(agreement?._raw);
  const signingDate = getSigningDate(agreement?._raw);
  const cancellationDate = getCancellationDate(agreement?._raw);

  // Check if cancellation is pending using enhanced detection
  const cancellationPending = isCancellationPending(agreement?._raw);

  const getDeliveryStatusMessage = () => {
    if (!agreement || agreement.status !== "pending_approval") return null;

    const initiatedBy = getDeliveryInitiatedBy(agreement._raw, user);

    if (initiatedBy === "user") {
      // ✅ FIXED: Current user initiated delivery
      return "You have marked your work as delivered and are waiting for the other party to review it.";
    } else if (initiatedBy === "other") {
      // ✅ FIXED: Other party initiated delivery
      return "The other party has marked their work as delivered and is waiting for your review. You can accept the delivery or reject it (which will open a dispute).";
    } else {
      return "Work has been marked as delivered. Please review and accept or reject the delivery.";
    }
  };
  const getCancellationStatusMessage = () => {
    if (!agreement || !cancellationPending) return null;

    const initiatedBy = getCancellationInitiatedBy(agreement._raw, user);

    if (initiatedBy === "user") {
      return "You have requested cancellation. Waiting for the other party to respond.";
    } else if (initiatedBy === "other") {
      return "The other party has requested cancellation. Waiting for your response.";
    } else {
      return "A cancellation request has been initiated. Waiting for response.";
    }
  };

  const shouldShowMarkAsDelivered =
    canMarkDelivered && !isCurrentUserInitiatedDelivery;

  console.log("🔍 Mark as Delivered Check:", {
    canMarkDelivered,
    isCurrentUserInitiatedDelivery,
    shouldShow: shouldShowMarkAsDelivered,
    agreementStatus: agreement?.status,
    isActive: agreement?.status === "signed",
  });

  // Add this debug block right before the button condition (around line where the button JSX starts)
  console.log("🔍 Dispute Payment Button Debug:", {
    agreementStatus: agreement?.status,
    agreementStatusRaw: agreement?._raw?.status,
    disputeStatus,
    isUserInitiator: getDisputeFiledByFromTimeline(agreement, user),
    user: {
      id: user?.id,
      username: user?.username,
    },
    timeline: agreement?._raw?.timeline?.map((event: any) => ({
      type: event.type,
      eventType: event.eventType,
      toStatus: event.toStatus,
      actorId: event.actor?.id,
      actorUsername: event.actor?.username,
      createdAt: event.createdAt,
    })),
  });

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-8">
            <div className="mx-auto size-32 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400"></div>
            <div className="absolute inset-0 mx-auto size-32 animate-ping rounded-full border-2 border-cyan-400/40"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-cyan-300">
              Loading Agreement
            </h3>
            <p className="text-sm text-cyan-200/70">
              Preparing your agreement details...
            </p>
          </div>
          <div className="mt-4 flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!agreement || !canViewAgreement) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              {!agreement ? "Agreement Not Found" : "Access Restricted"}
            </h2>
            <div className="mb-6 max-w-md text-cyan-200/80">
              {!agreement ? (
                <p>
                  The agreement you're looking for doesn't exist or may have
                  been removed. Please check the agreement ID and try again.
                </p>
              ) : (
                <p>
                  You don't have permission to view this agreement. Only
                  participants and the creator can view private agreements.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {!agreement && (
              <Button
                onClick={() => {
                  // Refresh the page
                  window.location.reload();
                }}
                variant="outline"
                className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
              >
                <Loader2 className="mr-2 h-4 w-4" />
                Refresh & Retry
              </Button>
            )}
            <Button
              onClick={() => navigate("/agreements")}
              className="border-white/15 bg-cyan-600/20 text-cyan-200 hover:bg-cyan-500/30"
            >
              Back to Agreements
            </Button>
          </div>
          {!agreement && (
            <div className="mt-8 flex w-fit justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
              <div className="text-sm text-cyan-300">
                <p className="mb-1 font-medium">Troubleshooting tips:</p>
                <ul className="space-y-1">
                  <li>• Check if the agreement ID is correct</li>
                  <li>• Verify your internet connection</li>
                  <li>• The agreement may have been deleted</li>
                  <li>• Try refreshing the page</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 lg:px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center space-y-4 space-x-4 sm:flex-row sm:space-y-0">
            <Button
              variant="outline"
              onClick={() => navigate("/agreements")}
              className="w-fit self-start border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreements
            </Button>

            <div className="flex items-center space-x-2">
              <div className="flex justify-between">
                {disputeStatus !== "Pending Payment" && (
                  <span
                    className={`font-medium ${getStatusColor(agreement.status)} rounded-full px-4 py-1 text-sm`}
                  >
                    {agreement.status.replace("_", " ")}
                  </span>
                )}
                {disputeStatus === "Pending Payment" && (
                  <span
                    className={`font-medium ${getDisputeStatusColor()} rounded-full px-4 py-1 text-sm`}
                  >
                    Dispute Pending Payment
                  </span>
                )}
              </div>

              {/* View Dispute link - only show when dispute exists and NOT in Pending Payment */}
              {agreement._raw?.disputes &&
                agreement._raw.disputes.length > 0 &&
                disputeStatus !== "Pending Payment" &&
                rejectDisputeStatus !== "Pending Payment" && (
                  <Link
                    to={`/disputes/${agreement._raw.disputes[0].disputeId}`}
                    className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/20 hover:text-purple-200"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    View Dispute
                  </Link>
                )}
            </div>
          </div>

          {/* ADD THIS SUBTLE UPDATE INDICATOR */}
          <div className="flex space-x-2 self-center text-xs text-cyan-400/60 sm:self-end">
            {isRefreshing && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            )}
            <span>
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Agreement Overview Card */}
            <div className="card-cyan rounded-xl px-4 py-6 sm:px-4">
              <div className="mb-6 flex flex-col items-start justify-between sm:flex-row">
                <div>
                  <h1 className="mb-2 max-w-[30rem] text-2xl font-bold text-white lg:text-[1.5rem]">
                    {agreement.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-cyan-300">
                    {agreement.type === "Public" ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public Agreement</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Private Agreement</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-cyan-300">Created by</div>
                  <div className="flex items-center justify-end gap-2 font-medium text-white">
                    <UserAvatar
                      userId={
                        agreement.creatorUserId || agreement.creator || ""
                      }
                      avatarId={agreement.creatorAvatarId || null}
                      username={agreement.creator || ""}
                      size="sm"
                    />
                    <button
                      onClick={() => {
                        const cleanUsername = (agreement.creator || "").replace(
                          /^@/,
                          "",
                        );
                        navigate(`/profile/${cleanUsername}`);
                      }}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200 hover:underline sm:text-base"
                    >
                      {formatCreatorUsername(agreement.creator)}
                    </button>
                    {isCreator && (
                      <VscVerifiedFilled className="size-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>
              {/* Key Details Grid */}
              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[.6fr_.4fr]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Parties</div>
                      <div className="flex items-center gap-2 text-white">
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={
                              agreement.createdByUserId || agreement.createdBy
                            }
                            avatarId={agreement.createdByAvatarId || null}
                            username={agreement.createdBy}
                            size="sm"
                          />
                          <button
                            onClick={() => {
                              const cleanUsername = agreement.createdBy.replace(
                                /^@/,
                                "",
                              );
                              const encodedUsername =
                                encodeURIComponent(cleanUsername);
                              navigate(`/profile/${encodedUsername}`);
                            }}
                            className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline sm:text-base"
                          >
                            {agreement.createdBy.startsWith("@0x")
                              ? `${agreement.createdBy.slice(1, 5)}..${agreement.createdBy.slice(-6)}`
                              : agreement.createdBy}
                          </button>
                          {isFirstParty && (
                            <VscVerifiedFilled className="size-5 text-green-400" />
                          )}
                        </div>
                        <span className="text-sm text-cyan-400 sm:text-base">
                          <FaArrowRightArrowLeft />
                        </span>
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={
                              agreement.counterpartyUserId ||
                              agreement.counterparty
                            }
                            avatarId={agreement.counterpartyAvatarId || null}
                            username={agreement.counterparty}
                            size="sm"
                          />
                          <button
                            onClick={() => {
                              const cleanUsername =
                                agreement.counterparty.replace(/^@/, "");
                              const encodedUsername =
                                encodeURIComponent(cleanUsername);
                              navigate(`/profile/${encodedUsername}`);
                            }}
                            className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline sm:text-base"
                          >
                            {agreement.counterparty.startsWith("@0x")
                              ? `${agreement.counterparty.slice(1, 5)}..${agreement.counterparty.slice(-6)}`
                              : agreement.counterparty}
                          </button>
                          {isCounterparty && (
                            <VscVerifiedFilled className="size-5 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Date Created</div>
                      <div className="text-white">
                        {formatDate(agreement.dateCreated)}
                      </div>
                    </div>
                  </div>
                  {agreement.includeFunds === "yes" && agreement.useEscrow && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Amount</div>
                        <div className="text-white">
                          {agreement.amount} {agreement.token}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Deadline</div>
                      <div className="text-white">
                        {agreement.deadline
                          ? formatDate(agreement.deadline)
                          : "Not set"}
                      </div>
                    </div>
                  </div>

                  {completionDate && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-sm text-cyan-300">
                          Completed On
                        </div>
                        <div className="text-white">
                          {formatDate(completionDate)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-cyan-300">
                        Agreement Type
                      </div>
                      <div className="text-white">{agreement.type}</div>
                    </div>
                  </div>

                  {agreement.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Escrow Used</div>
                        <div className="text-white">
                          {agreement.useEscrow ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Description & Scope
                </h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="leading-relaxed whitespace-pre-line text-white/80">
                    {agreement.description}
                  </p>
                </div>
              </div>
              {/* Attached Files */}
              {agreement._raw?.files && agreement._raw.files.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    Supporting Documents
                  </h3>

                  {/* Preview Section */}
                  <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      <h4 className="font-medium text-cyan-300">
                        Preview Files
                      </h4>
                    </div>

                    <EvidenceDisplay
                      evidence={processAgreementFiles(
                        agreement._raw.files,
                        agreement.id,
                      )}
                      color="cyan"
                      onViewEvidence={handleViewEvidence}
                    />
                  </div>

                  {/* Download Section (keep your old download buttons) */}
                  <div className="space-y-2">
                    {(agreement.images || []).map((file, index) => {
                      const fileType = getFileType(file);
                      const fileIcon = getFileIcon(fileType);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                        >
                          <div className="flex min-w-0 flex-1 items-center space-x-3">
                            {fileIcon}
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-white">
                                {file}
                              </span>
                              <span className="text-xs text-cyan-300/70 capitalize">
                                {fileType}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/15 whitespace-nowrap text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                            onClick={() => handleDownloadFile(index)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Financial Details */}
              {/* Financial Details */}
              <div>
                {/* Financial Details */}
                <div>
                  {agreement.includeFunds === "yes" && (
                    <div
                      className={`rounded-lg border ${
                        agreement.useEscrow
                          ? "border-emerald-400/30 bg-emerald-500/10"
                          : "border-cyan-400/30 bg-cyan-500/10"
                      } p-4`}
                    >
                      <h3
                        className={`mb-3 text-lg font-semibold ${
                          agreement.useEscrow
                            ? "text-emerald-300"
                            : "text-cyan-300"
                        }`}
                      >
                        Financial Details
                      </h3>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Funds included */}
                        <div>
                          <div
                            className={`text-sm ${
                              agreement.useEscrow
                                ? "text-emerald-300"
                                : "text-cyan-300"
                            }`}
                          >
                            Funds Included
                          </div>
                          <div className="text-lg font-semibold text-white">
                            Yes
                          </div>
                        </div>

                        {/* Escrow Status */}
                        <div>
                          <div
                            className={`text-sm ${
                              agreement.useEscrow
                                ? "text-emerald-300"
                                : "text-cyan-300"
                            }`}
                          >
                            Escrow Protection
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {agreement.useEscrow ? "Enabled" : "Not Used"}
                          </div>
                        </div>

                        {/* Amount + Token - Show for both escrow and non-escrow if available */}
                        {agreement.amount && (
                          <div className="md:col-span-2">
                            <div
                              className={`text-sm ${
                                agreement.useEscrow
                                  ? "text-emerald-300"
                                  : "text-cyan-300"
                              }`}
                            >
                              Amount
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {formatNumberWithCommas(agreement.amount)}{" "}
                              {agreement.token || ""}
                            </div>
                          </div>
                        )}

                        {/* Show Escrow Contract Address if exists */}
                        {agreement.useEscrow && agreement.escrowAddress && (
                          <div className="md:col-span-2">
                            <div className="mb-2 text-sm text-emerald-300">
                              Escrow Contract Address
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 rounded bg-black/20 px-2 py-1 font-mono text-sm break-all text-white">
                                {showEscrowAddress
                                  ? agreement.escrowAddress
                                  : `${agreement.escrowAddress.slice(0, 10)}...${agreement.escrowAddress.slice(-8)}`}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setShowEscrowAddress(!showEscrowAddress)
                                }
                                className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                              >
                                {showEscrowAddress ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Information for non-escrow funds */}
                        {!agreement.useEscrow &&
                          agreement.includeFunds === "yes" && (
                            <div className="md:col-span-2">
                              <div className="flex items-start gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
                                <div>
                                  <p className="text-sm text-cyan-300">
                                    Funds information is for reference only and
                                    not secured in escrow.
                                  </p>
                                  <p className="mt-1 text-xs text-cyan-300/70">
                                    The amount and token details help track the
                                    financial scope without automated fund
                                    handling.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {signingStatusMessage && agreement?.status === "pending" && (
                <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-300">
                        Signing Status
                      </h4>
                      <p className="mt-1 text-sm text-yellow-200">
                        {signingStatusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dispute Information Section */}

              {/* Dispute Information Section */}
              {agreement._raw?.disputes &&
                agreement._raw.disputes.length > 0 &&
                disputeStatus !== "Pending Payment" && (
                  <div className="mt-6 rounded-xl border border-purple-400/60 bg-gradient-to-br from-purple-500/20 to-transparent p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Active Dispute
                    </h3>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            {/* DISPUTE FILING INFORMATION */}
                            {disputeInfo.filedAt && (
                              <div className="mt-2 space-y-3">
                                <div className="flex items-center gap-2 text-xs text-purple-300/80">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    Filed on{" "}
                                    {formatDateWithTime(disputeInfo.filedAt)}
                                  </span>
                                </div>
                                {disputeInfo.filedBy && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-xs text-purple-300/80">
                                      <Users className="h-3 w-3" />
                                      <span>Filed by:</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {disputeInfo.filedById && (
                                        <UserAvatar
                                          userId={disputeInfo.filedById.toString()}
                                          avatarId={disputeInfo.filedByAvatarId}
                                          username={disputeInfo.filedBy}
                                          size="sm"
                                        />
                                      )}
                                      <button
                                        onClick={() => {
                                          const cleanUsername =
                                            disputeInfo.filedBy?.replace(
                                              /^@/,
                                              "",
                                            ) || "";
                                          navigate(`/profile/${cleanUsername}`);
                                        }}
                                        className="text-xs font-medium text-purple-200 hover:text-purple-100 hover:underline"
                                      >
                                        {disputeInfo.filedBy.startsWith("0x")
                                          ? formatWalletAddress(
                                              disputeInfo.filedBy,
                                            )
                                          : disputeInfo.filedBy}
                                      </button>
                                      {user &&
                                        disputeInfo.filedBy &&
                                        normalizeUsername(user.username) ===
                                          normalizeUsername(
                                            disputeInfo.filedBy,
                                          ) && (
                                          <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                                        )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/disputes/${agreement._raw.disputes[0].disputeId}`}
                            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-200 transition-colors hover:bg-purple-500/30 hover:text-white"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Go to Dispute
                          </Link>
                        </div>
                      </div>

                      {/* CONDITIONAL: Only show this if dispute was triggered by delivery rejection */}
                      {disputeTriggeredByRejection && (
                        <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
                          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                          <div>
                            <p className="text-sm text-amber-300">
                              This dispute was filed when the delivery was
                              rejected. Please visit the dispute page to view
                              evidence, participate in voting, or see the
                              resolution process.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* BIDIRECTIONAL Action Buttons Section */}
            {/* BIDIRECTIONAL Action Buttons Section */}
            {(canSign ||
              canCancel ||
              canRequestCancellation ||
              canRespondToCancellation ||
              canMarkDelivered ||
              canReviewDelivery ||
              canOpenDispute ||
              canCancelDispute) &&
              agreement?.status !== "completed" &&
              agreement?.status !== "disputed" &&
              agreement?.status !== "cancelled" &&
              agreement?.status !== "expired" && ( // Add this line to hide when disputed
                <div className="card-cyan rounded-xl p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Agreement Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {/* All your existing buttons remain the same */}
                    {/* Sign Agreement Button */}
                    {canSign && (
                      <Button
                        variant="neon"
                        className="neon-hover"
                        onClick={handleSignAgreement}
                        disabled={isSigning || isRefreshing}
                      >
                        {isSigning ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Signing...
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            {isCounterparty
                              ? "Sign as Counterparty"
                              : "Sign as First Party"}
                          </>
                        )}
                      </Button>
                    )}

                    {/* Cancel Agreement Button - For first party when pending */}
                    {canCancel && (
                      <Button
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={handleCancelAgreement}
                        disabled={isCancelling || isRefreshing}
                      >
                        {isCancelling ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Cancel Agreement
                          </>
                        )}
                      </Button>
                    )}

                    {/* Request Cancellation Button - For both parties when active, but ONLY if no pending cancellation */}
                    {canRequestCancellation && (
                      <Button
                        variant="outline"
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        onClick={handleCancelAgreement}
                        disabled={isCancelling || isRefreshing}
                      >
                        {isCancelling ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <Ban className="mr-2 h-4 w-4" />
                            Request Cancellation
                          </>
                        )}
                      </Button>
                    )}

                    {/* NEW: Respond to Cancellation Buttons - Only show to the OTHER party */}
                    {canRespondToCancellation && (
                      <>
                        <Button
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => handleRespondToCancelation(true)}
                          disabled={isRespondingToCancel || isRefreshing}
                        >
                          {isRespondingToCancel ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Accept Cancellation
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleRespondToCancelation(false)}
                          disabled={isRespondingToCancel || isRefreshing}
                        >
                          {isRespondingToCancel ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              Reject Cancellation
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {/* BIDIRECTIONAL: Mark as Delivered Button - Only show if user didn't initiate delivery */}
                    {canMarkDelivered && !isCurrentUserInitiatedDelivery && (
                      <Button
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={handleMarkAsDelivered}
                        disabled={isCompleting || isRefreshing}
                      >
                        {isCompleting ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Package className="mr-2 h-4 w-4" />
                            Mark Work as Delivered
                          </>
                        )}
                      </Button>
                    )}

                    {/* NEW: Delivery Review Buttons - Only show to the OTHER party */}
                    {canReviewDelivery && (
                      <>
                        <Button
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={handleConfirmDelivery}
                          disabled={isConfirming || isRefreshing}
                        >
                          {isConfirming ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <PackageCheck className="mr-2 h-4 w-4" />
                              Accept Delivery
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={handleRejectDelivery} // Changed from handleRejectDelivery to just open modal
                          disabled={isSubmittingReject || isRefreshing}
                        >
                          {isRejecting ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Reject Delivery
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {canOpenDispute && (
                      <Button
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        onClick={handleOpenDispute}
                        disabled={isOpeningDispute || isRefreshing}
                      >
                        {isOpeningDispute ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Open Dispute
                          </>
                        )}
                      </Button>
                    )}

                    {/* NEW: Show appropriate message if user initiated cancellation */}
                    {isCurrentUserInitiatedCancellation &&
                      cancellationPending && (
                        <div className="hidden items-center gap-2 rounded-lg bg-orange-500/10 px-4 py-2">
                          <Clock className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-orange-300">
                            You have requested cancellation. Waiting for the
                            other party to respond.
                          </span>
                        </div>
                      )}
                  </div>

                  {/* NEW: Enhanced Status Display with Context Messages */}
                  {cancellationPending && (
                    <div className="mt-4 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-300">
                            Cancellation Request Pending
                          </h4>
                          <p className="mt-1 text-sm text-orange-200">
                            {getCancellationStatusMessage()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* NEW: Enhanced Delivery Status Information with Context */}
            {agreement?.status === "pending_approval" && (
              <div className="card-cyan rounded-xl p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Delivery Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-orange-400" />
                      <div>
                        <div className="font-medium text-white">
                          Delivery Submitted
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-orange-500/10 p-3">
                    <div className="text-sm text-orange-300">
                      {getDeliveryStatusMessage()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Action for Disputes */}
            {agreement?.status === "disputed" &&
              disputeStatus === "Pending Payment" &&
              getDisputeFiledByFromTimeline(agreement, user) && (
                <div className="card-cyan rounded-xl p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Payment Action Required
                  </h3>
                  <Button
                    variant="outline"
                    className="w-fit border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
                    onClick={handleCompletePayment}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Complete Payment for Dispute
                  </Button>
                  <p className="mt-3 text-sm text-yellow-300/80">
                    Payment required to activate your dispute. Click the button
                    above to complete the transaction.
                  </p>
                </div>
              )}

            {/* Activity Timeline */}
            <div className="card-cyan rounded-xl p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">
                Agreement Timeline
              </h3>

              <div className="flex items-start space-x-8 overflow-x-auto pb-4">
                {/* Step 1 - Agreement Created */}
                <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                  <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300"></div>
                  <div className="mt-3 font-medium text-white">
                    Agreement Created
                  </div>
                  <div className="text-sm text-cyan-300">
                    {formatDateWithTime(agreement.dateCreated)}
                  </div>
                  <div className="mt-1 text-xs text-blue-400/70">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        userId={
                          agreement.creatorUserId || agreement.creator || ""
                        }
                        avatarId={agreement.creatorAvatarId || null}
                        username={agreement.creator || ""}
                        size="sm"
                      />
                      {formatCreatorUsername(agreement.creator)}
                      {isCreator && (
                        <VscVerifiedFilled className="size-5 text-green-400" />
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-blue-400/50"></div>
                </div>
                {/* Step 2 - Signed (if signed) */}
                {[
                  "signed",
                  "completed",
                  "disputed",
                  "pending_approval",
                ].includes(agreement.status) && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Agreement Signed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {signingDate
                        ? formatDateWithTime(signingDate)
                        : formatDateWithTime(agreement.dateCreated)}
                    </div>
                    <div className="mt-1 text-xs text-emerald-400/70">
                      by both parties
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-emerald-400/50"></div>
                  </div>
                )}
                {/* Step 3 - Delivery Submitted (if pending approval) */}
                {agreement.status === "pending_approval" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-orange-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Delivery Submitted
                    </div>
                    <div className="text-sm text-cyan-300">
                      {deliverySubmittedDate
                        ? formatDateWithTime(deliverySubmittedDate)
                        : "Date not available"}
                    </div>
                    <div className="mt-1 text-xs text-amber-400/70">
                      Waiting for approval
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-amber-400/50"></div>
                  </div>
                )}
                {/* Step 4 - Completed */}
                {agreement.status === "completed" && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Work Completed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {completionDate
                        ? formatDateWithTime(completionDate)
                        : "Date not available"}
                    </div>
                  </div>
                )}
                {/* Disputed State */}

                {/* Disputed State */}
                {/* Disputed State */}
                {agreement.status === "disputed" &&
                  disputeStatus !== "Pending Payment" && (
                    <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                      <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-violet-400"></div>
                      <div className="mt-3 font-medium text-white">
                        Dispute Filed
                      </div>

                      {/* DISPUTE FILING DETAILS */}
                      <div className="text-sm text-cyan-300">
                        {disputeInfo.filedAt
                          ? formatDateWithTime(disputeInfo.filedAt)
                          : "Recently"}
                      </div>

                      {disputeInfo.filedBy && (
                        <div className="mt-1 flex items-center gap-1">
                          {disputeInfo.filedById && (
                            <UserAvatar
                              userId={disputeInfo.filedById.toString()}
                              avatarId={disputeInfo.filedByAvatarId}
                              username={disputeInfo.filedBy}
                              size="sm"
                            />
                          )}
                          <button
                            onClick={() => {
                              const cleanUsername =
                                disputeInfo.filedBy?.replace(/^@/, "") || "";
                              navigate(`/profile/${cleanUsername}`);
                            }}
                            className="text-xs text-violet-300/70 hover:text-violet-200 hover:underline"
                          >
                            {/* APPLY THE SLICING HERE */}
                            by{" "}
                            {disputeInfo.filedBy.startsWith("0x")
                              ? formatWalletAddress(disputeInfo.filedBy)
                              : disputeInfo.filedBy}
                          </button>
                          {user &&
                            disputeInfo.filedBy &&
                            normalizeUsername(user.username) ===
                              normalizeUsername(disputeInfo.filedBy) && (
                              <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                            )}
                        </div>
                      )}

                      {/* ADD DISPUTE LINK IN TIMELINE */}
                      {agreement._raw?.disputes &&
                        agreement._raw.disputes.length > 0 && (
                          <Link
                            to={`/disputes/${agreement._raw.disputes[0].disputeId}`}
                            className="mt-2 text-xs text-violet-300 underline hover:text-violet-200"
                          >
                            View Dispute Details
                          </Link>
                        )}
                    </div>
                  )}
                {/* Cancelled State */}
                {agreement.status === "cancelled" && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Agreement Cancelled
                    </div>
                    <div className="text-sm text-cyan-300">
                      {cancellationDate
                        ? formatDateWithTime(cancellationDate)
                        : "Date not available"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agreement Summary */}
            <div className="card-cyan rounded-xl p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Agreement Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Agreement ID</span>
                  <span className="text-white">#{agreement.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Type</span>
                  <span className="text-white">{agreement.type}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-cyan-300">Status</span>
                  {disputeStatus !== "Pending Payment" && (
                    <span
                      className={`font-medium ${getStatusColor(agreement.status)} rounded px-2 py-1 text-xs`}
                    >
                      {agreement.status.replace("_", " ")}
                    </span>
                  )}
                  {disputeStatus === "Pending Payment" && (
                    <span
                      className={`font-medium ${getDisputeStatusColor()} rounded px-2 py-1 text-xs`}
                    >
                      Dispute Pending Payment
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Files Attached</span>
                  <span className="text-white">
                    {agreement.images?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Funds Involved</span>
                  <span className="text-white">
                    {agreement.includeFunds === "yes" ? "Yes" : "No"}
                  </span>
                </div>
                {agreement.includeFunds === "yes" && (
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Escrow Used</span>
                    <span className="text-white">
                      {agreement.useEscrow ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Your Role Information */}
            <div className="card-cyan rounded-xl p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Your Role
              </h3>
              <div className="space-y-3">
                {isFirstParty && (
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-blue-300">
                        First Party
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-200/80">
                      You initiated this agreement. Both parties can mark work
                      as delivered if the agreement warrants it.
                    </p>
                  </div>
                )}
                {isCounterparty && (
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-300">
                        Counterparty
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-green-200/80">
                      Both parties can mark work as delivered if the agreement
                      warrants it.
                    </p>
                  </div>
                )}
                {isCreator && !isFirstParty && !isCounterparty && (
                  <div className="rounded-lg bg-purple-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span className="font-medium text-purple-300">
                        Creator
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-purple-200/80">
                      You created this agreement in the system.
                    </p>
                  </div>
                )}
                {!isFirstParty && !isCounterparty && !isCreator && (
                  <div className="rounded-lg bg-gray-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-300">Viewer</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-200/80">
                      You are viewing this agreement.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Contract Information */}

            <div className="card-cyan rounded-xl p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Contract Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Created</span>
                  <span className="text-white">
                    {formatDateWithTime(agreement.dateCreated)}
                  </span>
                </div>
                {signingDate && (
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Signed</span>
                    <span className="text-white">
                      {formatDateWithTime(signingDate)}
                    </span>
                  </div>
                )}

                {/* ADD DISPUTE FILED DATE */}
                {/* DISPUTE FILED INFORMATION */}
                {agreement.status === "disputed" &&
                  disputeInfo.filedAt &&
                  disputeStatus !== "Pending Payment" && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-purple-300">Dispute Filed</span>
                        <span className="text-purple-300">
                          {formatDateWithTime(disputeInfo.filedAt)}
                        </span>
                      </div>
                    </div>
                  )}

                <div className="flex justify-between">
                  <span className="text-cyan-300">Deadline</span>
                  <span className="text-white">
                    {formatDateWithTime(agreement.deadline)}
                  </span>
                </div>
                {/* ... rest of the dates ... */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDisputeModalOpen && disputeStatus !== "Pending Payment" && (
        <OpenDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          agreement={agreement}
          onDisputeCreated={handleDisputeCreated}
          onPaidDisputeCreated={handlePaidDisputeCreated}
        />
      )}

      {/* Evidence Viewer Modal */}
      <EvidenceViewer
        isOpen={evidenceViewerOpen}
        onClose={() => {
          setEvidenceViewerOpen(false);
        }}
        selectedEvidence={selectedEvidence}
      />

      {/* Reject Delivery Modal */}
      {isRejectModalOpen && !disputeStatus && !rejectDisputeStatus && (
        <RejectDeliveryModal
          isOpen={isRejectModalOpen}
          onClose={() => {
            setIsRejectModalOpen(false);
            setRejectClaim("");
          }}
          onConfirm={handleConfirmReject}
          claim={rejectClaim}
          setClaim={setRejectClaim}
          isSubmitting={isSubmittingReject}
          agreement={agreement}
        />
      )}

      {/* Unified Pending Dispute Modal */}
      {pendingModalState.isOpen &&
        disputeStatus === "Pending Payment" &&
        getDisputeFiledByFromTimeline(agreement, user) && (
          <PendingDisputeModal
            key={`pending-modal-${pendingModalState.votingId}`}
            isOpen={pendingModalState.isOpen}
            onClose={() => {
              setPendingModalState({
                isOpen: false,
                votingId: null,
                flow: "reject",
              });
            }}
            votingId={
              pendingModalState.votingId ?? agreement?.disputeVotingId ?? 0
            }
            agreement={agreement}
            onDisputeCreated={handleDisputeCreated}
            flow={pendingModalState.flow}
          />
        )}
    </div>
  );
}
