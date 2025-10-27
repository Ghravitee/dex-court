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
  Upload,
  UserCheck,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Package,
  PackageCheck,
  Ban,
  CheckSquare,
  // Square,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { agreementService } from "../services/agreementServices";
import type { Agreement } from "../types";
import { toast } from "sonner";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/apiClient";

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
    case AgreementStatusEnum.EXPIRED:
      return "cancelled";
    case AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY:
      return "pending_approval";
    default:
      return "pending";
  }
};

// Helper function to normalize usernames (remove @ prefix for comparison)
const normalizeUsername = (username: string): string => {
  if (!username) return "";
  return username.replace(/^@/, "").toLowerCase().trim();
};

// Helper to check if current user is counterparty
const isCurrentUserCounterparty = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return false;

  const currentUsername = normalizeUsername(
    currentUser.handle || currentUser.username,
  );
  const counterpartyUsername = normalizeUsername(
    agreement.counterParty?.username || agreement.counterparty,
  );

  return currentUsername === counterpartyUsername;
};

// Helper to check if current user is first party
const isCurrentUserFirstParty = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return false;

  const currentUsername = normalizeUsername(
    currentUser.handle || currentUser.username,
  );
  const firstPartyUsername = normalizeUsername(
    agreement.firstParty?.username || agreement.createdBy,
  );

  return currentUsername === firstPartyUsername;
};

// Helper to check if current user is creator
const isCurrentUserCreator = (agreement: any, currentUser: any) => {
  if (!agreement || !currentUser) return false;

  const currentUsername = normalizeUsername(
    currentUser.handle || currentUser.username,
  );
  const creatorUsername = normalizeUsername(
    agreement.creator?.username || agreement.creator,
  );

  return currentUsername === creatorUsername;
};

// Helper to check who submitted the delivery (FIXED with correct event type)
const getDeliverySubmittedBy = (agreement: any) => {
  if (!agreement) return null;

  // Check if we have delivery submission info in the API response
  if (agreement.deliverySubmittedBy) {
    return agreement.deliverySubmittedBy;
  }

  // Check in _raw data
  if (agreement._raw?.deliverySubmittedBy) {
    return agreement._raw.deliverySubmittedBy;
  }

  // Fallback: check timeline events for delivery submission (FIXED: using DELIVERED = 4)
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

// Helper to check if current user should see delivery review buttons (FIXED)
const shouldShowDeliveryReviewButtons = (agreement: any, currentUser: any) => {
  if (
    !agreement ||
    !currentUser ||
    agreement.status !== AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY
  ) {
    return false;
  }

  const isFirstParty = isCurrentUserFirstParty(agreement, currentUser);
  const isCounterparty = isCurrentUserCounterparty(agreement, currentUser);

  // Get who submitted the delivery
  const deliverySubmittedBy = getDeliverySubmittedBy(agreement);

  // If we can't determine who submitted, show review buttons to BOTH parties
  // This ensures that at least someone can review the delivery
  if (!deliverySubmittedBy) {
    console.warn(
      "⚠️ Could not determine who submitted delivery - showing review buttons to both parties",
    );
    return isFirstParty || isCounterparty;
  }

  // Current user should ONLY review if they DID NOT submit the delivery
  const currentUserId = currentUser.id || currentUser.userId;
  const submittedById = deliverySubmittedBy.id || deliverySubmittedBy;

  // Only show review buttons to the party who did NOT submit the delivery
  return currentUserId !== submittedById && (isFirstParty || isCounterparty);
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

// Helper to get completion date from timeline (FIXED with correct event types)
const getCompletionDate = (agreement: any): string | null => {
  if (!agreement?._raw?.timeline) return null;

  // Look for completion events - use DELIVERY_CONFIRMED = 5
  const completionEvents = agreement._raw.timeline.filter(
    (event: any) =>
      event.eventType === AgreementEventTypeEnum.DELIVERY_CONFIRMED,
  );

  // Return the most recent completion event
  if (completionEvents.length > 0) {
    const sortedEvents = completionEvents.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sortedEvents[0].createdAt;
  }

  return null;
};

// Helper to check if this is the second rejection (FIXED with correct event type)
const isSecondRejection = (agreement: any): boolean => {
  if (!agreement?._raw?.timeline) return false;

  const rejectionEvents = agreement._raw.timeline.filter(
    (event: any) =>
      event.eventType === AgreementEventTypeEnum.DELIVERY_REJECTED,
  );

  return rejectionEvents.length >= 1; // Second rejection triggers dispute
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
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRespondingToCancel, setIsRespondingToCancel] = useState(false);
  const [isOpeningDispute, setIsOpeningDispute] = useState(false);

  // Wrap fetchAgreementDetails in useCallback to prevent unnecessary re-renders
  const fetchAgreementDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const agreementId = parseInt(id);
      const response = await agreementService.getAgreementDetails(agreementId);
      const agreementData = response.data;

      console.log("📋 AgreementDetails API Response:", agreementData);

      // Helper function to extract avatar ID from party data and convert to number
      const getAvatarIdFromParty = (party: any): number | null => {
        const avatarId = party?.avatarId || party?.avatar?.id;
        return avatarId ? Number(avatarId) : null;
      };

      // Helper function to get username from party data with @ prefix
      const getUsernameFromParty = (party: any) => {
        const username = party?.username || party?.handle || "Unknown";
        // Add @ prefix if it doesn't already have one
        return username.startsWith("@") ? username : `@${username}`;
      };

      // Helper function to get user ID from party data
      const getUserIdFromParty = (party: any) => {
        return party?.id?.toString();
      };

      const firstPartyUsername = getUsernameFromParty(agreementData.firstParty);
      const counterPartyUsername = getUsernameFromParty(
        agreementData.counterParty,
      );
      const creatorUsername = getUsernameFromParty(agreementData.creator);

      const completionDate = getCompletionDate(agreementData);

      console.log("📋 AgreementDetails API Response:", agreementData);
      console.log("📅 Timeline events:", agreementData.timeline);
      console.log("✅ Completion date found:", completionDate);

      // Transform API data to frontend format
      const transformedAgreement: Agreement & { completionDate?: string } = {
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
        includeFunds: agreementData.type === 2 ? "yes" : "no",
        useEscrow: agreementData.type === 2,
        escrowAddress: agreementData.escrowContract || undefined,
        files: agreementData.files?.length || 0,
        images: agreementData.files?.map((file: any) => file.fileName) || [],

        // Store completion date
        completionDate: completionDate || undefined,

        // Avatar and user IDs
        createdByAvatarId: getAvatarIdFromParty(agreementData.firstParty),
        counterpartyAvatarId: getAvatarIdFromParty(agreementData.counterParty),
        createdByUserId: getUserIdFromParty(agreementData.firstParty),
        counterpartyUserId: getUserIdFromParty(agreementData.counterParty),

        // Creator information
        creator: creatorUsername,
        creatorUserId: getUserIdFromParty(agreementData.creator),
        creatorAvatarId: getAvatarIdFromParty(agreementData.creator),

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

  useEffect(() => {
    fetchAgreementDetails();
  }, [id, fetchAgreementDetails]);

  // Sign Agreement Handler
  const handleSignAgreement = async () => {
    if (!id || !agreement) return;

    setIsSigning(true);
    try {
      const agreementId = parseInt(id);
      await agreementService.signAgreement(agreementId, true);

      toast.success("Agreement signed successfully!");
      await fetchAgreementDetails(); // Refresh data
    } catch (error: any) {
      console.error("Failed to sign agreement:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to sign agreement. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSigning(false);
    }
  };

  // Cancel Agreement Handler
  const handleCancelAgreement = async () => {
    if (!id || !agreement) return;

    if (!confirm("Are you sure you want to cancel this agreement?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const agreementId = parseInt(id);

      // For pending agreements, use sign with false to reject
      if (agreement.status === "pending") {
        await agreementService.signAgreement(agreementId, false);
        toast.success("Agreement cancelled successfully!");
      } else {
        // For active agreements, use cancel request
        await agreementService.requestCancelation(agreementId);
        toast.success(
          "Cancellation requested! Waiting for counterparty confirmation.",
        );
      }

      await fetchAgreementDetails(); // Refresh data
    } catch (error: any) {
      console.error("Failed to cancel agreement:", error);
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

    setIsRespondingToCancel(true);
    try {
      const agreementId = parseInt(id);
      await agreementService.respondToCancelation(agreementId, accepted);

      if (accepted) {
        toast.success("Cancellation accepted! Agreement has been cancelled.");
      } else {
        toast.success("Cancellation rejected! Agreement remains active.");
      }

      await fetchAgreementDetails();
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
      await fetchAgreementDetails();
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
      await fetchAgreementDetails();
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
  const handleRejectDelivery = async () => {
    if (!id || !agreement) return;

    const isSecondRejectionAttempt = isSecondRejection(agreement?._raw);

    if (isSecondRejectionAttempt) {
      // Second rejection automatically triggers dispute
      if (
        !confirm(
          "This is the second rejection. This will automatically open a dispute. Are you sure?",
        )
      ) {
        return;
      }

      setIsRejecting(true);
      try {
        const agreementId = parseInt(id);
        await agreementService.rejectDelivery(agreementId);

        toast.success(
          "Delivery rejected! Dispute has been automatically opened due to second rejection.",
        );
        await fetchAgreementDetails();
      } catch (error: any) {
        console.error("Failed to reject delivery:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Failed to reject delivery. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsRejecting(false);
      }
    } else {
      // First rejection
      if (
        !confirm(
          "Are you sure you want to reject this delivery? The agreement will return to signed status.",
        )
      ) {
        return;
      }

      setIsRejecting(true);
      try {
        const agreementId = parseInt(id);
        await agreementService.rejectDelivery(agreementId);

        toast.success(
          "Delivery rejected! Agreement returned to signed status.",
        );
        await fetchAgreementDetails();
      } catch (error: any) {
        console.error("Failed to reject delivery:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Failed to reject delivery. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsRejecting(false);
      }
    }
  };

  // Open Dispute Handler
  const handleOpenDispute = async () => {
    if (!id || !agreement) return;

    if (
      !confirm(
        "Are you sure you want to open a dispute? This will escalate the agreement to dispute resolution.",
      )
    ) {
      return;
    }

    setIsOpeningDispute(true);
    try {
      // Since dispute API is not built, we'll simulate it for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        "Dispute opened successfully! The agreement is now in dispute resolution.",
      );

      setAgreement((prev) => (prev ? { ...prev, status: "disputed" } : null));
    } catch (error: any) {
      console.error("Failed to open dispute:", error);
      toast.error("Failed to open dispute. Please try again.");
    } finally {
      setIsOpeningDispute(false);
    }
  };

  // Cancel Dispute Handler
  const handleCancelDispute = async () => {
    if (!id || !agreement) return;

    if (
      !confirm(
        "Are you sure you want to cancel this dispute? This will return the agreement to its previous status.",
      )
    ) {
      return;
    }

    try {
      // Since dispute API is not built, we'll simulate it for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Dispute cancelled successfully!");

      // Refresh agreement data to get actual status
      await fetchAgreementDetails();
    } catch (error: any) {
      console.error("Failed to cancel dispute:", error);
      toast.error("Failed to cancel dispute. Please try again.");
    }
  };

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

      console.log(`📥 Downloading file:`, {
        agreementId,
        fileId,
        originalFileName: file.fileName,
        fileIndex,
        mimeType: file.mimeType,
      });

      // Create a custom download function that preserves the original filename
      await downloadFileWithOriginalName(agreementId, fileId, file.fileName);
      toast.success("File downloaded successfully!");
    } catch (error: any) {
      console.error("Failed to download file:", error);

      // Use the specific error message from the service
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

      console.log("📁 Final filename for download:", filename);

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
  const getFileSizeDisplay = (fileSize?: number): string => {
    if (!fileSize) return "Unknown size";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(fileSize) / Math.log(1024));
    return (
      Math.round((fileSize / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
    );
  };

  // Check user roles and permissions
  const isCounterparty =
    agreement && user ? isCurrentUserCounterparty(agreement._raw, user) : false;
  const isFirstParty =
    agreement && user ? isCurrentUserFirstParty(agreement._raw, user) : false;
  const isCreator =
    agreement && user ? isCurrentUserCreator(agreement._raw, user) : false;

  // Check if user is a participant (either first party or counterparty)
  const isParticipant = isFirstParty || isCounterparty;

  // Check if user can view the agreement (participants, creator, or public agreement)
  const canViewAgreement =
    isParticipant || isCreator || (agreement && agreement.type === "Public");

  // BIDIRECTIONAL ACTION PERMISSIONS
  const canSign =
    agreement?.status === "pending" &&
    (isCounterparty || (isFirstParty && !isCreator));
  const canCancel = agreement?.status === "pending" && isFirstParty;
  const canRequestCancel = agreement?.status === "signed" && isParticipant;
  const canRespondToCancel =
    agreement?.status === "signed" &&
    agreement._raw?.cancelPending &&
    ((isFirstParty &&
      agreement._raw.cancelRequestedById === agreement._raw.counterParty?.id) ||
      (isCounterparty &&
        agreement._raw.cancelRequestedById === agreement._raw.firstParty?.id));

  // BIDIRECTIONAL DELIVERY PERMISSIONS
  // Both parties can mark as delivered when agreement is signed
  const canMarkDelivered = canUserMarkAsDelivered(agreement?._raw, user);

  // The other party can review delivery when status is pending_approval (FIXED)
  const canReviewDelivery = shouldShowDeliveryReviewButtons(
    agreement?._raw,
    user,
  );

  // Check who submitted the delivery
  const deliverySubmittedBy = getDeliverySubmittedBy(agreement?._raw);
  const isCurrentUserSubmittedDelivery =
    deliverySubmittedBy &&
    ((deliverySubmittedBy.id && deliverySubmittedBy.id === user?.id) ||
      deliverySubmittedBy === user?.id);

  // Dispute permissions
  const canOpenDispute = agreement?.status === "signed" && isParticipant;
  const canCancelDispute = agreement?.status === "disputed" && isParticipant;

  // Get completion date for display
  const completionDate = getCompletionDate(agreement?._raw);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="absolute inset-0 z-[50] rounded-full bg-cyan-500/10 blur-3xl"></div>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/agreements")}
              className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreements
            </Button>
            <div className="flex items-center space-x-2">
              {getStatusIcon(agreement.status)}
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(agreement.status)}`}
              >
                {agreement.status.charAt(0).toUpperCase() +
                  agreement.status.slice(1).replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Agreement Overview Card */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-white">
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
                      className="text-cyan-300 hover:text-cyan-200 hover:underline"
                    >
                      {agreement.creator}
                    </button>
                    {isCreator && (
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
                        you
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
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
                            className="text-cyan-300 hover:text-cyan-200 hover:underline"
                          >
                            {agreement.createdBy}
                          </button>
                          {isFirstParty && (
                            <span className="ml-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
                              you
                            </span>
                          )}
                        </div>
                        <span className="text-cyan-400">↔</span>
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
                            className="text-cyan-300 hover:text-cyan-200 hover:underline"
                          >
                            {agreement.counterparty}
                          </button>
                          {isCounterparty && (
                            <span className="ml-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
                              you
                            </span>
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
                  {agreement.includeFunds === "yes" && (
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
                        {formatDate(agreement.deadline)}
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
                        <div className="text-sm text-cyan-300">Escrow</div>
                        <div className="text-white">
                          {agreement.useEscrow ? "Enabled" : "Not Used"}
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
              {agreement.images && agreement.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    Supporting Documents
                  </h3>
                  <div className="space-y-2">
                    {agreement.images.map((file, index) => {
                      // Get file type for better icon display
                      const fileType = getFileType(file);
                      const fileIcon = getFileIcon(fileType);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-colors duration-200 hover:bg-white/10"
                        >
                          <div className="flex min-w-0 flex-1 items-center space-x-3">
                            {fileIcon}
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-white">
                                {file}
                              </span>
                              <span className="text-xs text-cyan-300/70 capitalize">
                                {fileType} •{" "}
                                {getFileSizeDisplay(
                                  agreement._raw?.files?.[index]?.fileSize,
                                )}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/15 whitespace-nowrap text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                            onClick={() => handleDownloadFile(index)}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Financial Details */}
              {agreement.includeFunds === "yes" && (
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-emerald-300">
                    Financial Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-emerald-300">
                        Funds Included
                      </div>
                      <div className="text-lg font-semibold text-white">
                        Yes
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-emerald-300">Amount</div>
                      <div className="text-lg font-semibold text-white">
                        {agreement.amount} {agreement.token}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-emerald-300">
                        Escrow Protection
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {agreement.useEscrow ? "Enabled" : "Not Used"}
                      </div>
                    </div>
                    {agreement.useEscrow && agreement.escrowAddress && (
                      <div className="md:col-span-2">
                        <div className="mb-2 text-sm text-emerald-300">
                          Escrow Contract
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
                  </div>
                </div>
              )}
            </div>

            {/* BIDIRECTIONAL Action Buttons Section */}
            {(canSign ||
              canCancel ||
              canRequestCancel ||
              canRespondToCancel ||
              canMarkDelivered ||
              canReviewDelivery ||
              canOpenDispute ||
              canCancelDispute) && (
              <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Agreement Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  {/* Sign Agreement Button - Only for counterparty when pending */}
                  {canSign && (
                    <Button
                      variant="neon"
                      className="neon-hover"
                      onClick={handleSignAgreement}
                      disabled={isSigning}
                    >
                      {isSigning ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Signing...
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          {isFirstParty && !isCreator
                            ? "Sign as First Party"
                            : "Sign as Counterparty"}
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
                      disabled={isCancelling}
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

                  {/* Request Cancelation Button - For both parties when active */}
                  {canRequestCancel && (
                    <Button
                      variant="outline"
                      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                      onClick={handleCancelAgreement}
                      disabled={isCancelling}
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

                  {/* Respond to Cancelation Buttons */}
                  {canRespondToCancel && (
                    <>
                      <Button
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => handleRespondToCancelation(true)}
                        disabled={isRespondingToCancel}
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
                        disabled={isRespondingToCancel}
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

                  {/* BIDIRECTIONAL: Mark as Delivered Button - For both parties when active */}
                  {canMarkDelivered && !isCurrentUserSubmittedDelivery && (
                    <Button
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={handleMarkAsDelivered}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Mark My Work as Delivered
                        </>
                      )}
                    </Button>
                  )}

                  {/* BIDIRECTIONAL: Delivery Review Buttons - For the OTHER party when pending approval */}
                  {canReviewDelivery && (
                    <>
                      <Button
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={handleConfirmDelivery}
                        disabled={isConfirming}
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
                        onClick={handleRejectDelivery}
                        disabled={isRejecting}
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
                      disabled={isOpeningDispute}
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

                  {/* Cancel Dispute Button */}
                  {canCancelDispute && (
                    <Button
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={handleCancelDispute}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Cancel Dispute
                    </Button>
                  )}

                  {/* Show status if user has already submitted delivery */}
                  {isCurrentUserSubmittedDelivery && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2">
                      <CheckSquare className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-blue-300">
                        Your delivery has been submitted and is awaiting review
                      </span>
                    </div>
                  )}
                </div>

                {/* Action descriptions */}
                <div className="mt-4 space-y-2 text-sm text-cyan-300">
                  {canSign && (
                    <p>
                      {isFirstParty && !isCreator
                        ? "As the first party (but not the creator), you need to sign this agreement."
                        : "As the counterparty, you need to sign this agreement to make it active."}
                    </p>
                  )}
                  {canCancel && (
                    <p>You can cancel this agreement before it's signed.</p>
                  )}
                  {canRequestCancel && (
                    <p>
                      Request cancellation of this agreement. The other party
                      will need to confirm.
                    </p>
                  )}
                  {canRespondToCancel && (
                    <p>
                      Respond to the cancellation request from the other party.
                    </p>
                  )}
                  {canMarkDelivered && !isCurrentUserSubmittedDelivery && (
                    <p>
                      Mark your work as delivered when you've completed your
                      part of the agreement.
                    </p>
                  )}
                  {canReviewDelivery && (
                    <div>
                      <p>
                        Review the other party's delivery and either accept or
                        reject it. Please keep in mind that if you marked work
                        as delivered, you won't be able to accpet or reject
                        delivery. Only the other party can.
                      </p>
                    </div>
                  )}
                  {canOpenDispute && (
                    <p>
                      Open a dispute if there are issues with the agreement that
                      need resolution.
                    </p>
                  )}
                  {canCancelDispute && (
                    <p>
                      Cancel the dispute if you've resolved the issues mutually.
                    </p>
                  )}
                  {isCurrentUserSubmittedDelivery && (
                    <p>
                      You've submitted your delivery. Waiting for the other
                      party to review it.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Status Information */}
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

                  {deliverySubmittedBy ? (
                    <div className="rounded-lg bg-orange-500/10 p-3">
                      <div className="text-sm text-orange-300">
                        {isCurrentUserSubmittedDelivery ? (
                          <>
                            <strong>You</strong> have marked your work as
                            delivered and are waiting for{" "}
                            <strong>the other party</strong> to review it.
                          </>
                        ) : (
                          <>
                            <strong>
                              {deliverySubmittedBy.username
                                ? deliverySubmittedBy.username.startsWith("@")
                                  ? deliverySubmittedBy.username
                                  : `@${deliverySubmittedBy.username}`
                                : deliverySubmittedBy.name || "The other party"}
                            </strong>{" "}
                            {isCounterparty || isFirstParty ? "(you)" : ""} has
                            marked their work as delivered and is waiting for{" "}
                            <strong>your</strong> review.
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-orange-500/10 p-3">
                      <div className="text-sm text-orange-300">
                        <strong>Work has been marked as delivered.</strong>{" "}
                        Please review and accept or reject the delivery.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
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
                    {formatDate(agreement.dateCreated)}
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
                      {agreement.creator}
                      {isCreator && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                          you
                        </span>
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
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Agreement Signed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {formatDate(agreement.dateCreated)}
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
                    <div className="text-sm text-cyan-300">Recently</div>
                    <div className="mt-1 text-xs text-amber-400/70">
                      Waiting for approval
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-amber-400/50"></div>
                  </div>
                )}

                {/* Step 4 - Completed */}
                {agreement.status === "completed" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Work Completed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {completionDate ? formatDate(completionDate) : "Recently"}
                    </div>
                  </div>
                )}

                {/* Disputed State */}
                {agreement.status === "disputed" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-violet-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Dispute Filed
                    </div>
                    <div className="text-sm text-cyan-300">Recently</div>
                    <div className="mt-1 text-xs text-violet-400/70">
                      Under review
                    </div>
                  </div>
                )}

                {/* Cancelled State */}
                {agreement.status === "cancelled" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Agreement Cancelled
                    </div>
                    <div className="text-sm text-cyan-300">Recently</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agreement Summary */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
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
                  <span className="text-cyan-300">Visibility</span>
                  <span className="text-white">
                    {agreement.type === "Public" ? "Public" : "Private"}
                  </span>
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
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
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
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Contract Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Created</span>
                  <span className="text-white">
                    {formatDate(agreement.dateCreated)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Deadline</span>
                  <span className="text-white">
                    {formatDate(agreement.deadline)}
                  </span>
                </div>
                {completionDate && (
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Completed</span>
                    <span className="text-white">
                      {formatDate(completionDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
