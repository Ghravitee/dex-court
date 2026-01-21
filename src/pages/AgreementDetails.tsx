/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
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
  XCircle,
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
  Hourglass,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { VscVerifiedFilled } from "react-icons/vsc";
import { Button } from "../components/ui/button";
import {
  agreementService,
  AgreementTypeEnum,
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
  CANCELLED: 12,
} as const;

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
const processAgreementFiles = (files: any[], agreementId: string): any[] => {
  return files.map((file) => {
    const name = file.fileName;

    // Function to get file URL
    const getFileUrl = (): string => {
      // Use the same API endpoint pattern as in DisputeDetails
      const API_BASE =
        import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";
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
// FIXED: Enhanced helper to check who initiated delivery using context
const getDeliveryInitiatedBy = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return null;

  // Priority 1: Check context.pendingApproval from API
  if (agreement.context?.pendingApproval) {
    const { initiatedByUser, initiatedByOther } =
      agreement.context.pendingApproval;

    // FIXED: The logic was inverted - initiatedByUser means current user initiated
    if (initiatedByUser) return "user";
    if (initiatedByOther) return "other";
  }

  // Priority 2: Fallback to existing logic
  const deliverySubmittedBy = getDeliverySubmittedBy(agreement);
  if (!deliverySubmittedBy) return null;

  const currentUserId = currentUser.id || currentUser.userId;
  const submittedById = deliverySubmittedBy.id || deliverySubmittedBy;

  // FIXED: This logic was correct, but the context logic above was the issue
  return currentUserId === submittedById ? "user" : "other";
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

// Helper to check who submitted the delivery
const getDeliverySubmittedBy = (agreement: any) => {
  if (!agreement) return null;

  // Priority 1: Check if we have delivery submission info in the API response
  if (agreement.deliverySubmittedBy) {
    return agreement.deliverySubmittedBy;
  }

  // Priority 2: Check in _raw data
  if (agreement._raw?.deliverySubmittedBy) {
    return agreement._raw.deliverySubmittedBy;
  }

  // Priority 3: Check context for delivery initiator
  if (agreement.context?.pendingApproval) {
    // If context shows who initiated, use that to determine the user
    const { initiatedByUser, initiatedByOther } =
      agreement.context.pendingApproval;

    if (initiatedByUser) {
      // Current user initiated - return current user's ID
      return { id: agreement._raw?.currentUserId };
    }
    if (initiatedByOther) {
      // Other party initiated - return the other party's ID
      const currentUserId = agreement._raw?.currentUserId;
      const firstPartyId = agreement._raw?.firstParty?.id;
      const counterpartyId = agreement._raw?.counterParty?.id;

      // Return the ID of the party that is NOT the current user
      return currentUserId === firstPartyId
        ? { id: counterpartyId }
        : { id: firstPartyId };
    }
  }

  // Priority 4: Fallback: check timeline events for delivery submission
  if (agreement._raw?.timeline) {
    const deliveryEvent = agreement._raw.timeline.find(
      (event: any) => event.eventType === AgreementEventTypeEnum.DELIVERED,
    );
    if (deliveryEvent) {
      return deliveryEvent.createdBy || deliveryEvent.userId;
    }
  }

  return null;
};

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

// NEW: Fixed helper to check if current user should see delivery review buttons
// FIXED: Helper to check if current user should see delivery review buttons
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

  // Use the new context-based initiatedBy check
  const initiatedBy = getDeliveryInitiatedBy(agreement, currentUser);

  // (the one who marked their work as delivered should see Accept/Reject buttons)
  return initiatedBy === "user";
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
        event.eventType === AgreementEventTypeEnum.CANCELLED ||
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

// Reject Delivery Modal Component
const RejectDeliveryModal = ({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (claim: string) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  isSubmitting: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      {/* Make container responsive and scrollable */}
      <div className="relative max-h-[90vh] w-full max-w-[20rem] overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-4 shadow-2xl sm:max-w-md sm:p-6">
        {/* Close button - make it more accessible on mobile */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          disabled={isSubmitting}
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 sm:h-10 sm:w-10">
            <AlertTriangle className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white sm:text-xl">
              Reject Delivery
            </h2>
            <p className="text-xs text-red-300 sm:text-sm">
              This will open a dispute immediately
            </p>
          </div>
        </div>

        {/* Warning message */}
        <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 sm:mb-6 sm:p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
            <div className="min-w-0">
              <p className="text-xs text-red-200 sm:text-sm">
                <span className="font-semibold">Important:</span> Rejecting the
                delivery will:
              </p>
              <ul className="mt-1 space-y-1 text-xs text-red-200/80 sm:mt-2">
                <li>• Immediately create a dispute</li>
                <li>
                  • Require dispute resolution through voting or manually
                  settling the dispute by you.
                </li>
                <li>• You can add more evidence on the dispute page later</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Claim input */}
        <div className="mb-4 sm:mb-6">
          <label className="mb-1 block text-sm font-medium text-purple-300 sm:mb-2">
            <div className="flex items-center gap-2">
              <span>Claim Description (Optional)</span>
              <div className="group relative hidden sm:inline-block">
                <Info className="h-4 w-4 text-gray-400 hover:text-purple-300" />
                <div className="invisible absolute top-1/2 left-6 z-10 w-64 -translate-y-1/2 rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-200 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <p className="font-medium text-white">What is a Claim?</p>
                  <p className="mt-1">
                    A claim is your formal statement explaining why you're
                    rejecting the delivery. This helps voters understand your
                    position. You can leave this empty if you prefer to add
                    details later on the dispute page.
                  </p>
                  <p className="mt-2 font-medium text-white">Examples:</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    <li>"Work does not meet quality standards"</li>
                    <li>"Delivered after deadline"</li>
                    <li>"Incomplete deliverables"</li>
                  </ul>
                </div>
              </div>
            </div>
          </label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Briefly describe why you're rejecting this delivery (optional)"
            className="purple-red-500/30 h-24 w-full rounded-lg border bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none sm:h-32"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-400">
            You can add more details and evidence on the dispute page.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-600 py-2 text-sm text-gray-300 hover:bg-gray-800 sm:w-auto sm:text-base"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="w-full border-purple-500/30 bg-purple-500/10 py-2 text-sm text-purple-300 hover:border-purple-400 hover:bg-purple-500/20 sm:w-auto sm:text-base"
            onClick={() => onConfirm(claim)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Creating Dispute...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Reject Delivery & Open Dispute
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AgreementDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
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

  // ADD THESE NEW STATE VARIABLES FOR POLLING
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

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
        id: agreementData.id.toString(),
        title: agreementData.title,
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
        escrowAddress: agreementData.escrowContract || undefined,
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
  }, [id]);

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
        id: agreementData.id.toString(),
        title: agreementData.title,
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
        escrowAddress: agreementData.escrowContract || undefined,
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
  }, [id, isRefreshing]);

  useEffect(() => {
    fetchAgreementDetails();
  }, [id, fetchAgreementDetails]);

  // ADD THIS POLLING EFFECT
  useEffect(() => {
    if (!id) return;

    const pollInterval = setInterval(() => {
      // Only poll if the tab is visible and not already refreshing
      if (document.visibilityState === "visible" && !isRefreshing) {
        fetchAgreementDetailsBackground();
      }
    }, 15000); // Increased to 15 seconds to be even less intrusive

    return () => clearInterval(pollInterval);
  }, [id, isRefreshing, fetchAgreementDetailsBackground]);

  // ADD THIS EVENT LISTENER FOR CROSS-TAB UPDATES
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

  // New function to actually reject with the claim
  // New function to actually reject with the claim
  const handleConfirmReject = async (claim: string) => {
    if (!id || !agreement) return;

    setIsSubmittingReject(true);
    try {
      const agreementId = parseInt(id);
      const votingId = generateVotingId(); // Generate the voting ID

      console.log("🚀 Calling rejectDelivery with:", {
        agreementId,
        votingId, // Include votingId in the request
        claim: claim.trim(),
        hasClaim: !!claim.trim(),
        claimLength: claim.trim().length,
      });

      // Pass the claim AND votingId to the rejectDelivery function
      await agreementService.rejectDelivery(
        agreementId,
        claim.trim(),
        votingId,
      );

      // Show success message with voting ID
      toast.success("Delivery rejected! A dispute has been created.", {
        description: `Voting ID: ${votingId}. Use this ID to track the dispute resolution.`,
        duration: 5000,
      });

      // Close modal and refresh
      setIsRejectModalOpen(false);
      setRejectClaim(""); // Reset claim
      await fetchAgreementDetailsBackground();
    } catch (error: any) {
      console.error("❌ Failed to reject delivery:", error);

      // Enhanced error handling
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to reject delivery. Please try again.";

      toast.error("Failed to reject delivery", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmittingReject(false);
    }
  };
  // Open Dispute Handler
  const handleOpenDispute = () => {
    if (!id || !agreement) return;
    setIsDisputeModalOpen(true);
  };

  const handleDisputeCreated = () => {
    toast.success("Dispute created successfully!");
    // Optionally refresh the agreement data to show disputed status
    fetchAgreementDetailsBackground();
  };

  // Or create a direct dispute creation modal:

  const getStatusIcon = (status: Agreement["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case "signed":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-400" />;
      case "expired": // Add this case
        return <Hourglass className="h-5 w-5 text-gray-400" />; // Or another appropriate icon
      case "disputed":
        return <AlertTriangle className="h-5 w-5 text-purple-400" />;
      case "pending_approval":
        return <Package className="h-5 w-5 text-orange-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Agreement["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "signed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "expired": // Add this case
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "disputed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "pending_approval":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
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
  const canOpenDispute = agreement?.status === "signed" && isParticipant;
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
      return "The other party has marked their work as delivered and is waiting for your review. You can accept the delivery or reject it (which will open a dispute).";
    } else if (initiatedBy === "other") {
      return "You have marked your work as delivered and are waiting for the other party to review it.";
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
      <div className="justify-center0 flex min-h-screen items-center">
        <div className="text-center">
          <div className="mb-4 text-lg text-white">
            {!agreement
              ? "Agreement not found"
              : "You don't have permission to view this agreement"}
          </div>
          <Button
            onClick={() => navigate("/agreements")}
            className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          >
            Back to Agreements
          </Button>
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
              <div className="flex items-center space-x-2">
                {getStatusIcon(agreement.status)}
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(agreement.status)}`}
                >
                  {agreement.status.charAt(0).toUpperCase() +
                    agreement.status.slice(1).replace("_", " ")}
                </span>
              </div>
              {/* ADD THIS: Dispute Link when agreement has disputes */}
              {agreement._raw?.disputes &&
                agreement._raw.disputes.length > 0 && (
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
              {/* Dispute Information Section */}
              {agreement._raw?.disputes &&
                agreement._raw.disputes.length > 0 && (
                  <div className="mt-6 rounded-xl border border-purple-400/60 bg-gradient-to-br from-purple-500/20 to-transparent p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Active Dispute
                    </h3>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            {/* DISPUTE FILING INFORMATION */}
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
                                        {/* APPLY THE SLICING HERE */}
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

                    {/* Open Dispute Button */}
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
              <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
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
                {agreement.status === "disputed" && (
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
                  <span
                    className={`font-medium ${getStatusColor(agreement.status)} rounded px-2 py-1 text-xs`}
                  >
                    {agreement.status.replace("_", " ")}
                  </span>
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
                {agreement.status === "disputed" && disputeInfo.filedAt && (
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
      {isDisputeModalOpen && (
        <OpenDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          agreement={agreement}
          onDisputeCreated={handleDisputeCreated}
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
      />
    </div>
  );
}
