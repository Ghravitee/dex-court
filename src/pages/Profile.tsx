// src/pages/Profile.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import { FaUser, FaInstagram, FaHandshake, FaEdit } from "react-icons/fa";
import { FaXTwitter, FaTiktok } from "react-icons/fa6";
import { VscVerifiedFilled } from "react-icons/vsc";
import { FiSend, FiAlertCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
import { Button } from "../components/ui/button";
import Judge from "../components/ui/svgcomponents/Judge";
import Community from "../components/ui/svgcomponents/Community";
import User from "../components/ui/svgcomponents/UserIcon";
import { useAuth } from "../hooks/useAuth";
import { LoginModal } from "../components/LoginModal";
import { useAccountUpdate, useAvatarUpload } from "../hooks/useAccountApi";
import type { AccountUpdateRequest } from "../services/apiService";
import { UserAvatar } from "../components/UserAvatar";
import { Loader2, UploadCloud, Wallet } from "lucide-react";
import { agreementService } from "../services/agreementServices";

import { useNavigate } from "react-router-dom";
import { useDisputesApi } from "../hooks/useDisputesApi";
import type { DisputeRow } from "../types";
import { WalletLinkingModal } from "../components/WalletLinkingModal";
import TrustMeter from "../components/TrustMeter";
import useTrustScore from "../hooks/useTrustScore";
import Admin from "../components/ui/svgcomponents/Admin";
import { useReputationHistory } from "../hooks/useReputation";

// Add AgreementStatusBadge component
const AgreementStatusBadge = ({ status }: { status: number }) => {
  const displayStatus = mapAgreementStatusToEscrow(status);

  const statusConfig = {
    pending: {
      label: "Pending",
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
    },
    signed: {
      label: "Signed",
      color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    },
    completed: {
      label: "Completed",
      color: "bg-green-500/20 text-green-300 border-green-400/30",
    },
    disputed: {
      label: "Disputed",
      color: "bg-purple-800/20 text-purple-300 border-purple-800/30",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-500/20 text-red-300 border-red-400/30",
    },
    expired: {
      label: "Expired",
      color: "bg-gray-500/20 text-gray-300 border-gray-400/30",
    },
    pending_approval: {
      label: "Pending Approval",
      color: "bg-orange-500/20 text-orange-300 border-orange-400/30",
    },
  };

  const config = statusConfig[displayStatus as keyof typeof statusConfig] || {
    label: "Unknown",
    color: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  };

  return (
    <span
      className={`ml-auto inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Toaster Component
const Toaster = ({
  message,
  type = "success",
  isVisible,
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-500/20 border-green-400/30 text-green-300"
      : "bg-red-500/20 border-red-400/30 text-red-300";

  const borderColor =
    type === "success" ? "border-green-400/30" : "border-red-400/30";

  return (
    <div className="animate-in slide-in-from-right-full fixed top-4 right-4 z-[100] duration-300">
      <div
        className={`glass rounded-lg border ${borderColor} ${bgColor} px-4 py-3 shadow-lg backdrop-blur-sm`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex-shrink-0 ${type === "success" ? "text-green-400" : "text-red-400"}`}
          >
            {type === "success" ? "✓" : "⚠"}
          </div>
          <div className="text-sm font-medium">{message}</div>
          <button
            onClick={onClose}
            className={`ml-4 flex-shrink-0 ${type === "success" ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this component near the top of your file
const Tooltip = ({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) => (
  <div className="group relative inline-block">
    {children}
    <div className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

// Verification Badge Component
const VerificationBadge = () => (
  <Tooltip content="Verified User">
    <VscVerifiedFilled className="h-4 w-4 text-emerald-400" />
  </Tooltip>
);

// Profile Update Modal Component
const ProfileUpdateModal = ({
  isOpen,
  onClose,
  user,
  onUpdate,
  updating,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (data: AccountUpdateRequest) => Promise<void>;
  updating: boolean;
}) => {
  const [formData, setFormData] = useState({
    bio: user?.bio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      bio: formData.bio || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-cyan w-[90%] max-w-md rounded-xl p-6 text-white shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Update Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              rows={3}
              className="w-full rounded-md border border-cyan-400/30 bg-black/20 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-500/30 text-gray-300 hover:bg-gray-700/40"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Role Badge Component
const RoleBadge = ({
  role,
  icon,
  tooltip,
}: {
  role: boolean;
  icon: React.ReactNode;
  tooltip: string;
}) => {
  if (!role) return null;

  return (
    <Tooltip content={tooltip}>
      <div className="flex cursor-pointer items-center gap-1">{icon}</div>
    </Tooltip>
  );
};

// Add the BentoCard component
export function BentoCard({
  title,
  icon,
  color,
  count,
  children,
  scrollable = false,
  maxHeight = "250px",
}: {
  title: string;
  icon: React.ReactNode;
  color: "rose" | "emerald" | "cyan";
  count?: number;
  children?: React.ReactNode;
  scrollable?: boolean;
  maxHeight?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan-500/20 border-cyan-400 text-cyan-200",
    emerald: "from-emerald-500/20 border-emerald-400/30 text-emerald-200",
    rose: "from-rose-500/20 border-rose-400/30 text-rose-200",
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 md:p-6 ${colorMap[color]} flex flex-col justify-between bg-gradient-to-br to-transparent`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold text-white/90">
          {icon}
          <span>{title}</span>
        </div>
        {count !== undefined && (
          <div className="text-2xl font-bold text-white/90">{count}</div>
        )}
      </div>

      <div
        className={`mt-4 ${
          scrollable
            ? "scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent overflow-y-auto pr-2"
            : ""
        }`}
        style={scrollable ? { maxHeight } : {}}
      >
        {children}
      </div>
    </div>
  );
}

type EscrowStatus =
  | "pending"
  | "signed"
  | "completed"
  | "cancelled"
  | "expired"
  | "disputed"
  | "pending_approval"
  | "pending_delivery";

// Enhanced status mapping for on-chain agreements
const mapAgreementStatusToEscrow = (status: number): EscrowStatus => {
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

// NEW: Helper function to extract roles from description
const extractRolesFromDescription = (description: string) => {
  if (!description) return { serviceProvider: null, serviceRecipient: null };

  // Look for Service Provider pattern
  const serviceProviderMatch = description.match(
    /Service Provider:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );
  // Look for Service Recipient pattern
  const serviceRecipientMatch = description.match(
    /Service Recipient:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );

  // Look for alternative patterns
  const alternativeProviderMatch = description.match(
    /Provider:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );
  const alternativeRecipientMatch = description.match(
    /Recipient:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );

  return {
    serviceProvider:
      serviceProviderMatch?.[1] || alternativeProviderMatch?.[1] || null,
    serviceRecipient:
      serviceRecipientMatch?.[1] || alternativeRecipientMatch?.[1] || null,
  };
};

// NEW: Helper function to determine user's role in agreement
const getUserRoleInAgreement = (
  agreement: any,
  userId: string | undefined,
  userWalletAddress: string | undefined,
  isEscrow: boolean = false,
): string => {
  if (!userId && !userWalletAddress) return "Unknown";

  // For escrow agreements, use the new payeeWalletAddress and payerWalletAddress fields
  if (isEscrow) {
    // Normalize wallet addresses for comparison
    const payeeWallet = agreement.payeeWalletAddress?.toLowerCase();
    const payerWallet = agreement.payerWalletAddress?.toLowerCase();
    const userWallet = userWalletAddress?.toLowerCase();

    if (userWallet) {
      // Check if user is Payee (Service Provider)
      if (payeeWallet && payeeWallet === userWallet) {
        return "Service Provider";
      }
      // Check if user is Payer (Service Recipient)
      if (payerWallet && payerWallet === userWallet) {
        return "Service Recipient";
      }
    }

    // Fallback: Check by user ID from firstParty/counterParty
    const userIdNum = userId ? Number(userId) : null;
    const firstPartyId = agreement.firstParty
      ? Number(agreement.firstParty.id)
      : null;
    const counterPartyId = agreement.counterParty
      ? Number(agreement.counterParty.id)
      : null;

    if (userIdNum) {
      if (firstPartyId === userIdNum) return "Service Provider";
      if (counterPartyId === userIdNum) return "Service Recipient";
    }

    // If no wallet match and no ID match, try to infer from description as fallback
    const roles = extractRolesFromDescription(agreement.description || "");

    if (userWallet) {
      const provider = roles.serviceProvider?.toLowerCase();
      const recipient = roles.serviceRecipient?.toLowerCase();

      if (provider && provider === userWallet) {
        return "Service Provider";
      }
      if (recipient && recipient === userWallet) {
        return "Service Recipient";
      }
    }

    // Check by Telegram username
    const userTelegram = userId ? `@user${userId}` : null;
    if (userTelegram) {
      if (
        roles.serviceProvider &&
        roles.serviceProvider.toLowerCase() === userTelegram.toLowerCase()
      ) {
        return "Service Provider";
      }
      if (
        roles.serviceRecipient &&
        roles.serviceRecipient.toLowerCase() === userTelegram.toLowerCase()
      ) {
        return "Service Recipient";
      }
    }
  }

  // For regular agreements, check by user ID
  const userIdNum = userId ? Number(userId) : null;
  const firstPartyId = agreement.firstParty
    ? Number(agreement.firstParty.id)
    : null;
  const counterPartyId = agreement.counterParty
    ? Number(agreement.counterParty.id)
    : null;

  if (userIdNum) {
    if (firstPartyId === userIdNum) return "First Party";
    if (counterPartyId === userIdNum) return "Counter Party";
  }

  return "Creator";
};

const ReputationEventTypeEnum = {
  TelegramVerified: 1,
  AgreementCompleted: 2,
  AgreementEscrowCompleted: 3,
  DisputeWon: 4,
  VotedWinningOutcome: 5,
  WitnessEvery5Comments: 6,
  JudgeWinningVote: 7,
  JudgeCommentAdded: 8,
  FirstJudgeToVote: 9,
  FirstCommunityToVote: 10,
  CommunityVoteLost: 50,
  JudgeVoteLost: 51,
  DisputeLostRegular: 52,
  DisputeLostEscrow: 53,
  LateDelivery: 54,
  FrequentCancellationsBanned: 55,
  SpamAgreementsTempBan: 56,
};

// Update the formatReputationEvent function:
const formatReputationEvent = (event: any) => {
  const getEventTypeDisplay = (eventType: number) => {
    switch (eventType) {
      case ReputationEventTypeEnum.TelegramVerified:
        return "Telegram Verified";
      case ReputationEventTypeEnum.AgreementCompleted:
        return "Agreement Completed";
      case ReputationEventTypeEnum.AgreementEscrowCompleted:
        return "Escrow Agreement Completed";
      case ReputationEventTypeEnum.DisputeWon:
        return "Dispute Won";
      case ReputationEventTypeEnum.VotedWinningOutcome:
        return "Voted Winning Outcome";
      case ReputationEventTypeEnum.WitnessEvery5Comments:
        return "Witness Contribution";
      case ReputationEventTypeEnum.JudgeWinningVote:
        return "Judge Winning Vote";
      case ReputationEventTypeEnum.JudgeCommentAdded:
        return "Judge Comment Added";
      case ReputationEventTypeEnum.FirstJudgeToVote:
        return "First Judge to Vote";
      case ReputationEventTypeEnum.FirstCommunityToVote:
        return "First Community to Vote";
      case ReputationEventTypeEnum.CommunityVoteLost:
        return "Community Vote Lost";
      case ReputationEventTypeEnum.JudgeVoteLost:
        return "Judge Vote Lost";
      case ReputationEventTypeEnum.DisputeLostRegular:
        return "Dispute Lost (Regular)";
      case ReputationEventTypeEnum.DisputeLostEscrow:
        return "Dispute Lost (Escrow)";
      case ReputationEventTypeEnum.LateDelivery:
        return "Late Delivery";
      case ReputationEventTypeEnum.FrequentCancellationsBanned:
        return "Frequent Cancellations";
      case ReputationEventTypeEnum.SpamAgreementsTempBan:
        return "Spam Agreements";
      default:
        return "Reputation Event";
    }
  };

  const getEventIcon = (eventType: number) => {
    // Positive events
    if (eventType <= 10) {
      return "🟢";
    }
    // Negative events (50+)
    if (eventType >= 50) {
      return "🔴";
    }
    return "⚪";
  };

  const isPositiveEvent = (eventType: number) => {
    return eventType <= 10; // Positive events are 1-10
  };

  return {
    id: event.id,
    eventType: getEventTypeDisplay(event.eventType),
    icon: getEventIcon(event.eventType),
    value: event.value,
    isPositive: isPositiveEvent(event.eventType),
    eventId: event.eventId,
    createdAt: event.createdAt,
  };
};

export default function Profile() {
  const { isAuthenticated, user, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);
  const { trustScore, loading: trustScoreLoading } = useTrustScore(
    user?.id?.toString() || null,
  );
  const [showLinkModal, setShowLinkModal] = useState<{
    type: "telegram" | "wallet";
    open: boolean;
  }>({ type: "telegram", open: false });

  const navigate = useNavigate();

  // NEW: State for agreements with type-based filtering
  const [reputationalAgreements, setReputationalAgreements] = useState<any[]>(
    [],
  );
  const [escrowAgreements, setEscrowAgreements] = useState<any[]>([]);
  const [agreementsLoading, setAgreementsLoading] = useState(true);
  const [agreementsError, setAgreementsError] = useState<string | null>(null);

  const {
    data: reputationHistory,
    loading: reputationLoading,
    error: reputationError,
  } = useReputationHistory(user?.id?.toString() || null);

  const {
    disputes,
    loading: disputesLoading,
    error: disputesError,
    hasMore,
    loadMore,
  } = useDisputesApi(user?.id);

  const {
    updateAccount,
    loading: updating,
    error: updateError,
    success: updateSuccess,
  } = useAccountUpdate();
  const {
    uploadAvatar,
    loading: uploading,
    error: uploadError,
    success: uploadSuccess,
  } = useAvatarUpload();

  // NEW: Load agreements with type-based filtering
  const loadAgreements = useCallback(async () => {
    try {
      setAgreementsLoading(true);
      setAgreementsError(null);

      // Fetch all agreements (we'll filter by type)
      const allAgreementsResponse = await agreementService.getAgreements({
        top: 100,
        skip: 0,
        sort: "desc",
      });

      const allAgreements = allAgreementsResponse.results || [];

      // Separate agreements by type
      const reputational = allAgreements.filter(
        (agreement: any) => agreement.type === 1, // Type 1 = Reputational
      );
      const escrow = allAgreements.filter(
        (agreement: any) => agreement.type === 2, // Type 2 = Escrow
      );

      console.log("🔍 Agreement types loaded:", {
        total: allAgreements.length,
        reputational: reputational.length,
        escrow: escrow.length,
      });

      setReputationalAgreements(reputational);
      setEscrowAgreements(escrow);
    } catch (error: any) {
      console.error("Failed to fetch agreements:", error);
      setAgreementsError(error.message || "Failed to load agreements");
      setReputationalAgreements([]);
      setEscrowAgreements([]);
    } finally {
      setAgreementsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAgreements();
    }
  }, [isAuthenticated, loadAgreements]);

  // Transform escrow agreement for display
  // Replace the current transformEscrowAgreement function (around line 156):
  // Transform escrow agreement for display
  const transformEscrowAgreement = (apiAgreement: any) => {
    const formatWalletAddress = (address: string): string => {
      if (!address) return "Unknown";
      if (address.startsWith("@")) return address;
      if (address.startsWith("0x") && address.length === 42) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      }
      return address;
    };

    // Use the new fields if available, otherwise fallback to description extraction
    const serviceProvider = apiAgreement.payeeWalletAddress
      ? formatWalletAddress(apiAgreement.payeeWalletAddress)
      : (() => {
          const roles = extractRolesFromDescription(
            apiAgreement.description || "",
          );
          return roles.serviceProvider
            ? formatWalletAddress(roles.serviceProvider)
            : "Unknown";
        })();

    const serviceRecipient = apiAgreement.payerWalletAddress
      ? formatWalletAddress(apiAgreement.payerWalletAddress)
      : (() => {
          const roles = extractRolesFromDescription(
            apiAgreement.description || "",
          );
          return roles.serviceRecipient
            ? formatWalletAddress(roles.serviceRecipient)
            : "Unknown";
        })();

    return {
      id: `${apiAgreement.id}`,
      title: apiAgreement.title || `Escrow Deal #${apiAgreement.id}`,
      serviceProvider,
      serviceRecipient,
      rawServiceProvider: apiAgreement.payeeWalletAddress,
      rawServiceRecipient: apiAgreement.payerWalletAddress,
      token: apiAgreement.tokenSymbol || "ETH",
      amount: apiAgreement.amount ? parseFloat(apiAgreement.amount) : 0,
      status: mapAgreementStatusToEscrow(apiAgreement.status),
      statusNumber: apiAgreement.status,
      deadline: apiAgreement.deadline
        ? new Date(apiAgreement.deadline).toISOString().split("T")[0]
        : "No deadline",
      description: apiAgreement.description || "",
      createdAt: apiAgreement.dateCreated || apiAgreement.createdAt,
      firstParty: apiAgreement.firstParty,
      counterParty: apiAgreement.counterParty,
      payeeWalletAddress: apiAgreement.payeeWalletAddress,
      payerWalletAddress: apiAgreement.payerWalletAddress,
    };
  };

  // Transform reputational agreement for display
  const transformReputationalAgreement = (apiAgreement: any) => {
    return {
      id: apiAgreement.id,
      title: apiAgreement.title || `Agreement #${apiAgreement.id}`,
      status: apiAgreement.status,
      dateCreated: apiAgreement.dateCreated || apiAgreement.createdAt,
      firstParty: apiAgreement.firstParty,
      counterParty: apiAgreement.counterParty,
      description: apiAgreement.description || "",
    };
  };

  // Filter agreements where user is involved
  const userReputationalAgreements = useMemo(() => {
    if (!user?.id) return [];

    return reputationalAgreements
      .filter((agreement: any) => {
        const userId = user.id.toString();
        const firstPartyId = agreement.firstParty?.id?.toString();
        const counterPartyId = agreement.counterParty?.id?.toString();

        return firstPartyId === userId || counterPartyId === userId;
      })
      .map(transformReputationalAgreement);
  }, [reputationalAgreements, user?.id]);

  // Replace the current userEscrowDeals filter (around line 189):
  const userEscrowDeals = useMemo(() => {
    if (!user?.id && !user?.walletAddress) return [];

    const userId = user.id?.toString();
    const userWallet = user.walletAddress?.toLowerCase();

    return escrowAgreements
      .filter((agreement: any) => {
        // Check by user ID
        const firstPartyId = agreement.firstParty?.id?.toString();
        const counterPartyId = agreement.counterParty?.id?.toString();

        if (userId && (firstPartyId === userId || counterPartyId === userId)) {
          return true;
        }

        // Check by wallet address using the new fields
        if (userWallet) {
          const payeeWallet = agreement.payeeWalletAddress?.toLowerCase();
          const payerWallet = agreement.payerWalletAddress?.toLowerCase();

          if (
            (payeeWallet && payeeWallet === userWallet) ||
            (payerWallet && payerWallet === userWallet)
          ) {
            return true;
          }
        }

        // Fallback to description extraction for backward compatibility
        if (userWallet) {
          const roles = extractRolesFromDescription(
            agreement.description || "",
          );
          const provider = roles.serviceProvider?.toLowerCase();
          const recipient = roles.serviceRecipient?.toLowerCase();

          return provider === userWallet || recipient === userWallet;
        }

        return false;
      })
      .map(transformEscrowAgreement);
  }, [escrowAgreements, user?.id, user?.walletAddress]);

  // Calculate stats
  const agreementStats = useMemo(() => {
    return {
      total: userReputationalAgreements.length,
      active: userReputationalAgreements.filter(
        (agreement) => agreement.status === 2,
      ).length,
      completed: userReputationalAgreements.filter(
        (agreement) => agreement.status === 3,
      ).length,
      disputed: userReputationalAgreements.filter(
        (agreement) => agreement.status === 4,
      ).length,
    };
  }, [userReputationalAgreements]);

  const escrowStats = useMemo(() => {
    return {
      total: userEscrowDeals.length,
      active: userEscrowDeals.filter(
        (agreement) => agreement.status === "signed",
      ).length,
      completed: userEscrowDeals.filter(
        (agreement) => agreement.status === "completed",
      ).length,
      disputed: userEscrowDeals.filter(
        (agreement) => agreement.status === "disputed",
      ).length,
      pending: userEscrowDeals.filter(
        (agreement) => agreement.status === "pending",
      ).length,
      pending_approval: userEscrowDeals.filter(
        (agreement) => agreement.status === "pending_approval",
      ).length,
      expired: userEscrowDeals.filter(
        (agreement) => agreement.status === "expired",
      ).length,
      cancelled: userEscrowDeals.filter(
        (agreement) => agreement.status === "cancelled",
      ).length,
    };
  }, [userEscrowDeals]);

  // Memoized disputes stats calculation
  // Memoized disputes stats calculation
  const disputesStats = useMemo(
    () => ({
      total: disputes.length,
      pending: disputes.filter((dispute) => dispute.status === "Pending")
        .length,
      inProgress: disputes.filter(
        (dispute) => dispute.status === "Vote in Progress",
      ).length,
      settled: disputes.filter((dispute) => dispute.status === "Settled")
        .length,
      dismissed: disputes.filter((dispute) => dispute.status === "Dismissed")
        .length,
      pendingPayment: disputes.filter(
        (dispute) => dispute.status === "Pending Payment",
      ).length,
    }),
    [disputes],
  );

  console.log("dispute stats", disputesStats);

  const getUserRoleInDispute = useCallback(
    (dispute: DisputeRow) => {
      const userId = user?.id?.toString();
      if (!userId) return "Unknown";

      if (dispute.plaintiffData?.userId === userId) return "Plaintiff";
      if (dispute.defendantData?.userId === userId) return "Defendant";

      let isPlaintiffWitness = false;
      let isDefendantWitness = false;

      if (dispute.witnesses) {
        if (
          typeof dispute.witnesses === "object" &&
          !Array.isArray(dispute.witnesses)
        ) {
          isPlaintiffWitness = (dispute.witnesses.plaintiff || []).some(
            (w: any) => w.id?.toString() === userId,
          );
          isDefendantWitness = (dispute.witnesses.defendant || []).some(
            (w: any) => w.id?.toString() === userId,
          );
        } else if (Array.isArray(dispute.witnesses)) {
          isPlaintiffWitness = dispute.witnesses.some(
            (w: any) => w.id?.toString() === userId,
          );
        }
      }

      if (isPlaintiffWitness) return "Witness (Plaintiff)";
      if (isDefendantWitness) return "Witness (Defendant)";

      return "Observer";
    },
    [user?.id],
  );

  // Handle dispute click
  const handleDisputeClick = useCallback(
    (disputeId: string) => {
      navigate(`/disputes/${disputeId}`);
    },
    [navigate],
  );

  // Handle agreement click - NEW: Route based on type
  const handleAgreementClick = useCallback(
    (agreementId: string, isEscrow: boolean = false) => {
      if (isEscrow) {
        navigate(`/escrow/${agreementId}`);
      } else {
        navigate(`/agreements/${agreementId}`);
      }
    },
    [navigate],
  );

  // Dispute Status Badge Component
  const DisputeStatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      Pending: {
        label: "Pending",
        color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
      },
      "Pending Payment": {
        // ✅ Fixed: Add the space
        label: "Pending Payment",
        color: "bg-orange-500/20 text-orange-300 border-orange-400/30",
      },
      "Vote in Progress": {
        label: "Voting",
        color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
      },
      Settled: {
        label: "Settled",
        color: "bg-green-500/20 text-green-300 border-green-400/30",
      },
      Dismissed: {
        label: "Dismissed",
        color: "bg-red-500/20 text-red-300 border-red-400/30",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-pink-500/20 text-gray-300 border-gray-400/30",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Memoized user data
  const userData = useMemo(() => {
    const formatHandle = (user: any) => {
      if (user?.telegram?.username) {
        return `@${user.telegram.username}`;
      }
      if (user?.walletAddress) {
        return `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`;
      }
      if (user?.username) {
        return `@${user.username}`;
      }
      return "@you";
    };

    const formatWallet = (user: any) => {
      if (user?.walletAddress) {
        return `${user.walletAddress.slice(0, 8)}…${user.walletAddress.slice(-6)}`;
      }
      return "Not connected";
    };

    return {
      handle: formatHandle(user),
      wallet: formatWallet(user),
      score: trustScore,
      roles: user?.roles || {
        admin: false,
        judge: false,
        community: false,
        user: true,
      },
      isVerified: user?.isVerified || false,
      stats: user?.stats || {
        deals: 0,
        agreements: 0,
        disputes: 0,
        revenue: { "7d": 0, "30d": 0, "90d": 0 },
      },
    };
  }, [user, trustScore]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Toaster states
  const [toaster, setToaster] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  // Show toaster when success or error occurs
  useEffect(() => {
    if (updateSuccess) {
      setToaster({
        message: "Profile updated successfully!",
        type: "success",
        isVisible: true,
      });
    }
  }, [updateSuccess]);

  useEffect(() => {
    if (uploadSuccess) {
      setToaster({
        message: "Avatar updated successfully!",
        type: "success",
        isVisible: true,
      });
    }
  }, [uploadSuccess]);

  useEffect(() => {
    if (updateError) {
      setToaster({
        message: updateError,
        type: "error",
        isVisible: true,
      });
    }
  }, [updateError]);

  useEffect(() => {
    if (uploadError) {
      setToaster({
        message: uploadError,
        type: "error",
        isVisible: true,
      });
    }
  }, [uploadError]);

  const closeToaster = useCallback(() => {
    setToaster((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Memoized handlers
  const handleUpdate = useCallback(
    async (updateData: AccountUpdateRequest) => {
      await updateAccount(updateData);
    },
    [updateAccount],
  );

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await uploadAvatar(file);
      }
    },
    [uploadAvatar],
  );

  const handleLogin = useCallback(async () => {
    try {
      await login("mock-otp");
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, [login]);

  // Log user data only when it actually changes
  useEffect(() => {
    if (user) {
      console.log("🔐 User data:", user);
    }
  }, [user]);

  const [otp, setOtp] = useState("");
  const [loading] = useState(false);

  useEffect(() => {
    console.log("🔍 Reputation history debug:", {
      hasUser: !!user,
      userId: user?.id,
      reputationHistory,
      reputationLoading,
      reputationError,
      totalResults: reputationHistory?.totalResults,
      resultsCount: reputationHistory?.results?.length,
    });
  }, [reputationHistory, reputationLoading, reputationError, user]);

  // Also add this to debug the BentoCard rendering
  useEffect(() => {
    console.log("🎨 BentoCard visibility:", {
      isAuthenticated,
      userRoles: userData.roles,
    });
  }, [isAuthenticated, userData.roles]);

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="relative space-y-8">
        <header className="flex items-center justify-between">
          <h2 className="space text-lg font-semibold text-white/90 lg:text-2xl">
            Profile
          </h2>
        </header>

        <div className="glass card-cyan mx-auto flex max-w-[50rem] flex-col items-center justify-center rounded-2xl border border-cyan-400/30 p-12 text-center">
          <div className="mb-6 grid h-20 w-20 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            <FaUser className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white/90">
            Please log in to view your profile
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your wallet or login via Telegram to access your DexCourt
            profile, view your agreements, disputes, and reputation.
          </p>
          <Button
            onClick={() => setShowLoginModal(true)}
            className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
          >
            Login to Continue
          </Button>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Toaster Component */}
      <Toaster
        message={toaster.message}
        type={toaster.type}
        isVisible={toaster.isVisible}
        onClose={closeToaster}
      />
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white/90">Profile</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowProfileUpdateModal(true)}
            className="flex items-center gap-2 border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
          >
            <FaEdit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </header>

      {/* ===== Top Summary Section ===== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Profile Summary */}
        <div className="space-y-4">
          <div className="card-cyan row-span-1 flex h-fit flex-col justify-between rounded-2xl px-6 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <UserAvatar
                  userId={user?.id || "unknown"}
                  avatarId={user?.avatarId || null}
                  username={
                    user?.telegram?.username || user?.username || "user"
                  }
                  size="lg"
                  className="h-14 w-14 border border-cyan-400/30"
                  priority={true}
                />

                <label className="absolute -right-1 -bottom-1 cursor-pointer rounded-full bg-cyan-500 p-1 text-xs text-white hover:bg-cyan-600">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                </label>
              </div>

              {uploading && (
                <div className="mt-2 text-xs text-cyan-300">
                  Uploading avatar...
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {/* ADMIN BADGE - Added first since it's highest role */}
                  <RoleBadge
                    role={userData.roles?.admin || false}
                    icon={<Admin className="size-7" />}
                    tooltip="Administrator"
                  />
                  <RoleBadge
                    role={userData.roles?.judge || false}
                    icon={<Judge />}
                    tooltip="Certified Judge"
                  />
                  <RoleBadge
                    role={userData.roles?.community || false}
                    icon={<Community />}
                    tooltip="Community Member"
                  />
                  <RoleBadge
                    role={
                      (userData.roles?.user || false) &&
                      !(userData.roles?.admin || false) &&
                      !(userData.roles?.judge || false) &&
                      !(userData.roles?.community || false)
                    }
                    icon={<User />}
                    tooltip="Basic User"
                  />
                </div>
                <div className="text-muted-foreground mt-2 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-white/90">
                    {userData.handle}
                    {userData.isVerified && <VerificationBadge />}
                  </div>
                  <div>{userData.wallet}</div>
                </div>
              </div>

              <div className="self-center">
                {trustScoreLoading ? (
                  <div className="flex h-32 w-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                  </div>
                ) : (
                  <TrustMeter score={trustScore} />
                )}
              </div>
            </div>
          </div>

          {/* Verifications Section */}
          <section className="card-cyan h-fit rounded-2xl p-4 lg:p-6">
            <div className="space text-muted-foreground mb-4 text-lg">
              Verifications
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* Telegram Verification */}
              <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <FiSend className="h-5 w-5 text-cyan-300" />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      Telegram
                      {user?.telegram?.username && <VerificationBadge />}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {user?.telegram?.username
                        ? `@${user.telegram.username}`
                        : "Not linked"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.telegram?.username ? (
                    <span className="text-xs text-green-400">✅ Linked</span>
                  ) : (
                    <Button
                      onClick={() =>
                        setShowLinkModal({ type: "telegram", open: true })
                      }
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Link
                    </Button>
                  )}
                </div>
              </div>

              {/* Wallet Verification */}
              <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-cyan-300" />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      Wallet
                      {user?.walletAddress && <VerificationBadge />}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {user?.walletAddress
                        ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`
                        : "Not linked"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.walletAddress ? (
                    <span className="text-xs text-green-400">✅ Linked</span>
                  ) : (
                    <Button
                      onClick={() =>
                        setShowLinkModal({ type: "wallet", open: true })
                      }
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Link
                    </Button>
                  )}
                </div>
              </div>
              {/* Twitter Verification */}
              <div className="flex cursor-not-allowed items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <FaXTwitter className="h-5 w-5 text-white" />
                  <div>
                    <div className="text-sm text-white/90">Twitter</div>
                    <div className="text-muted-foreground text-xs">
                      @you_web3
                    </div>
                  </div>
                </div>
                <Tooltip content="Coming soon in v2">
                  <Button
                    variant="outline"
                    disabled
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Connect
                  </Button>
                </Tooltip>
              </div>

              {/* Instagram Verification */}
              <div className="flex cursor-not-allowed items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <FaInstagram className="h-5 w-5 text-pink-400" />
                  <div>
                    <div className="text-sm text-white/90">Instagram</div>
                    <div className="text-muted-foreground text-xs">
                      Not linked
                    </div>
                  </div>
                </div>
                <Tooltip content="Coming soon in v2">
                  <Button
                    variant="outline"
                    disabled
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Connect
                  </Button>
                </Tooltip>
              </div>

              {/* TikTok Verification */}
              <div className="flex cursor-not-allowed items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <FaTiktok className="h-5 w-5 text-gray-200" />
                  <div>
                    <div className="text-sm text-white/90">TikTok</div>
                    <div className="text-muted-foreground text-xs">
                      Not linked
                    </div>
                  </div>
                </div>
                <Tooltip content="Coming soon in v2">
                  <Button
                    variant="outline"
                    disabled
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Connect
                  </Button>
                </Tooltip>
              </div>
            </div>
          </section>
        </div>

        {/* Revenue Stats */}
        <div className="space-y-4">
          <div className="flex flex-col justify-between rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/25 to-transparent p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)] ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,211,238,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white/90">
                Revenue Earned
              </h3>
            </div>

            <div className="space-y-3 text-lg">
              {Object.entries(userData.stats.revenue).map(
                ([period, amount]) => (
                  <div key={period} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {period.toUpperCase()}
                    </span>
                    <span className="text-xl font-semibold text-cyan-300">
                      ${Number(amount).toLocaleString()}
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="mt-8 flex flex-col items-center space-y-3">
              <div className="text-muted-foreground text-sm">
                Unclaimed Reward
              </div>
              <div className="text-3xl font-bold text-emerald-400">($0)</div>
              <Button
                variant="neon"
                className="mt-2 w-full border border-cyan-400/40 bg-cyan-600/20 py-4 text-lg font-medium text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all hover:bg-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
              >
                Claim Revenue
              </Button>
            </div>
          </div>

          <div className="hidden flex-col gap-4 sm:flex md:hidden">
            {/* Show Judged Disputes only for judges */}
            {/* Show Admin Panel Access for admins */}
            {userData.roles.admin && (
              <section className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-transparent p-6">
                <h3 className="mb-4 text-lg font-semibold text-white/90">
                  Administrator Access
                </h3>
                <div className="py-6 text-center">
                  <div className="mb-3 flex justify-center">
                    <Admin className="size-10" />
                  </div>
                  <div className="mb-2 text-lg text-yellow-300">
                    Platform Administrator
                  </div>
                  <div className="mb-4 text-sm text-white/50">
                    You have full access to the admin panel for user management
                    and platform analytics.
                  </div>
                  <Button
                    onClick={() => navigate("/admin")}
                    className="border-yellow-400/40 bg-yellow-600/20 text-yellow-100 hover:bg-yellow-500/30"
                  >
                    Access Admin Panel
                  </Button>
                </div>
              </section>
            )}

            {/* Show Judged Disputes only for judges (and not admins who aren't judges) */}
            {userData.roles.judge && !userData.roles.admin && (
              <section className="rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <h3 className="mb-4 text-lg font-semibold text-white/90">
                  Judged Disputes
                </h3>
                <div className="py-8 text-center">
                  <div className="mb-2 text-lg text-cyan-300">
                    No disputes judged yet
                  </div>
                  <div className="text-sm text-white/50">
                    As a certified judge, you'll be able to participate in
                    dispute resolution cases here.
                  </div>
                </div>
              </section>
            )}

            {/* Show Community Stats for community members (and not admins/judges) */}
            {userData.roles.community &&
              !userData.roles.judge &&
              !userData.roles.admin && (
                <section className="rounded-2xl border border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-transparent p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white/90">
                    Community Contributions
                  </h3>
                  <div className="py-8 text-center">
                    <div className="mb-2 text-lg text-emerald-300">
                      Active Community Member
                    </div>
                    <div className="text-sm text-white/50">
                      Thank you for being part of the DexCourt community!
                    </div>
                  </div>
                </section>
              )}

            {/* Show welcome for basic users (no special roles) */}
            {userData.roles.user &&
              !userData.roles.admin &&
              !userData.roles.judge &&
              !userData.roles.community && (
                <section className="rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white/90">
                    Get Started
                  </h3>
                  <div className="py-8 text-center">
                    <div className="mb-2 text-lg text-cyan-300">
                      Welcome to DexCourt!
                    </div>
                    <div className="text-sm text-white/50">
                      Start by creating agreements and participating in the
                      community to unlock more features.
                    </div>
                  </div>
                </section>
              )}

            {/* Reputation History - Show for all users */}
            {/* Replace the "My Reputation History" BentoCard section with this: */}
            <BentoCard
              title="My Reputation History"
              icon={<RiShieldCheckFill />}
              color="cyan"
              count={reputationHistory?.totalResults || 0}
              scrollable
              maxHeight="260px"
            >
              {reputationLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                  <span className="ml-2 text-cyan-300">
                    Loading reputation history...
                  </span>
                </div>
              ) : reputationError ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-lg text-red-300">
                    Error loading reputation history
                  </div>
                  <div className="text-sm text-white/50">{reputationError}</div>
                </div>
              ) : !reputationHistory?.results?.length ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-lg text-cyan-300">
                    {userData.roles.admin
                      ? "Administrator Reputation"
                      : userData.roles.judge
                        ? "Judge Reputation"
                        : userData.roles.community
                          ? "Community Reputation"
                          : "Building Reputation"}
                  </div>
                  <div className="text-sm text-white/50">
                    {userData.roles.admin
                      ? "Administrators maintain platform integrity. Your reputation score is based on oversight activities."
                      : userData.roles.judge
                        ? "Judges earn reputation through fair dispute resolution and timely decisions."
                        : userData.roles.community
                          ? "Community members build reputation by participating in agreements and disputes."
                          : "Complete agreements, resolve disputes, and participate in the community to build your reputation."}
                  </div>
                  <div className="mt-4 text-sm text-cyan-300">
                    Base Score: {reputationHistory?.baseScore || 50} → Final
                    Score: {reputationHistory?.finalScore || 50}
                  </div>
                </div>
              ) : (
                <>
                  {/* Reputation Summary */}
                  <div className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/80">
                        <div className="font-medium">Reputation Score</div>
                        <div className="text-xs text-white/60">
                          From {reputationHistory?.total || 0} total events
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyan-300">
                          {reputationHistory?.finalScore || 50}
                        </div>
                        <div className="text-xs text-white/60">
                          <span className="text-green-400">
                            +
                            {(reputationHistory?.finalScore || 50) -
                              (reputationHistory?.baseScore || 50)}
                          </span>{" "}
                          from base
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reputation Events List */}
                  <div className="space-y-2">
                    {reputationHistory.results.map((event) => {
                      const formattedEvent = formatReputationEvent(event);

                      return (
                        <div
                          key={event.id}
                          className="rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-cyan-400/30 hover:bg-white/10"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-xl">{formattedEvent.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-medium text-white/90">
                                    {formattedEvent.eventType}
                                  </div>
                                  <div className="mt-1 text-xs text-white/60">
                                    {new Date(
                                      event.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    formattedEvent.isPositive
                                      ? "bg-green-500/20 text-green-300"
                                      : "bg-red-500/20 text-red-300"
                                  }`}
                                >
                                  {formattedEvent.isPositive ? "+" : ""}
                                  {formattedEvent.value} pts
                                </span>
                              </div>

                              {/* Event-specific details */}
                              {(event.eventType ===
                                ReputationEventTypeEnum.AgreementCompleted ||
                                event.eventType ===
                                  ReputationEventTypeEnum.AgreementEscrowCompleted ||
                                event.eventType ===
                                  ReputationEventTypeEnum.DisputeWon ||
                                event.eventType ===
                                  ReputationEventTypeEnum.DisputeLostRegular ||
                                event.eventType ===
                                  ReputationEventTypeEnum.DisputeLostEscrow) && (
                                <div className="mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-cyan-300 hover:text-cyan-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const isEscrow =
                                        event.eventType ===
                                          ReputationEventTypeEnum.AgreementEscrowCompleted ||
                                        event.eventType ===
                                          ReputationEventTypeEnum.DisputeLostEscrow;
                                      handleAgreementClick(
                                        event.eventId.toString(),
                                        isEscrow,
                                      );
                                    }}
                                  >
                                    View Event #{event.eventId}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show more indicator if there are more events */}
                  {(reputationHistory?.totalResults || 0) >
                    (reputationHistory?.results?.length || 0) && (
                    <div className="mt-3 text-center">
                      <div className="text-xs text-white/60">
                        Showing {reputationHistory?.results?.length || 0} of{" "}
                        {reputationHistory?.totalResults || 0} events
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
                        onClick={() => {
                          // You could implement pagination here
                          console.log("Load more reputation events");
                        }}
                      >
                        Load More History
                      </Button>
                    </div>
                  )}
                </>
              )}
            </BentoCard>
            {showLoginModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="card-cyan w-[90%] max-w-sm rounded-xl p-6 text-white shadow-lg">
                  <h3 className="mb-4 text-lg font-semibold">Telegram Login</h3>

                  <label className="mb-2 block text-sm text-gray-300">
                    Enter your OTP from the DexCourt's Telegram bot:
                  </label>

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="e.g. 123456"
                    className="mb-4 w-full rounded-md border border-cyan-400/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowLoginModal(false)}
                      className="border-gray-500/30 text-gray-300 hover:bg-gray-700/40"
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={handleLogin}
                      className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Judged Disputes & Reputation */}
        <div className="flex flex-col gap-4 sm:hidden md:flex">
          {/* Show Judged Disputes only for judges */}
          {/* Show Admin Panel Access for admins */}
          {userData.roles.admin && (
            <section className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white/90">
                Administrator Access
              </h3>
              <div className="py-6 text-center">
                <div className="mb-3 flex justify-center">
                  <Admin className="size-10" />
                </div>
                <div className="mb-2 text-lg text-yellow-300">
                  Platform Administrator
                </div>
                <div className="mb-4 text-sm text-white/50">
                  You have full access to the admin panel for user management
                  and platform analytics.
                </div>
                <Button
                  onClick={() => navigate("/admin")}
                  className="border-yellow-400/40 bg-yellow-600/20 text-yellow-100 hover:bg-yellow-500/30"
                >
                  Access Admin Panel
                </Button>
              </div>
            </section>
          )}

          {/* Show Judged Disputes only for judges (and not admins who aren't judges) */}
          {userData.roles.judge && !userData.roles.admin && (
            <section className="rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white/90">
                Judged Disputes
              </h3>
              <div className="py-8 text-center">
                <div className="mb-2 text-lg text-cyan-300">
                  No disputes judged yet
                </div>
                <div className="text-sm text-white/50">
                  As a certified judge, you'll be able to participate in dispute
                  resolution cases here.
                </div>
              </div>
            </section>
          )}

          {/* Show Community Stats for community members (and not admins/judges) */}
          {userData.roles.community &&
            !userData.roles.judge &&
            !userData.roles.admin && (
              <section className="rounded-2xl border border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-transparent p-6">
                <h3 className="mb-4 text-lg font-semibold text-white/90">
                  Community Contributions
                </h3>
                <div className="py-8 text-center">
                  <div className="mb-2 text-lg text-emerald-300">
                    Active Community Member
                  </div>
                  <div className="text-sm text-white/50">
                    Thank you for being part of the DexCourt community!
                  </div>
                </div>
              </section>
            )}

          {/* Show welcome for basic users (no special roles) */}
          {userData.roles.user &&
            !userData.roles.admin &&
            !userData.roles.judge &&
            !userData.roles.community && (
              <section className="rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <h3 className="mb-4 text-lg font-semibold text-white/90">
                  Get Started
                </h3>
                <div className="py-8 text-center">
                  <div className="mb-2 text-lg text-cyan-300">
                    Welcome to DexCourt!
                  </div>
                  <div className="text-sm text-white/50">
                    Start by creating agreements and participating in the
                    community to unlock more features.
                  </div>
                </div>
              </section>
            )}

          {/* Reputation History - Show for all users */}
          <BentoCard
            title="My Reputation History"
            icon={<RiShieldCheckFill />}
            color="cyan"
            count={0}
            scrollable
            maxHeight="260px"
          >
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                {userData.roles.admin
                  ? "Administrator"
                  : userData.roles.judge
                    ? "Judge Reputation"
                    : userData.roles.community
                      ? "Community Reputation"
                      : "Building Reputation"}
              </div>
              <div className="text-sm text-white/50">
                {userData.roles.admin
                  ? "As an administrator, you have full platform access and oversight capabilities."
                  : userData.roles.judge
                    ? "Your reputation as a judge will grow with each fair dispute resolution."
                    : userData.roles.community
                      ? "Your community reputation builds with active participation."
                      : "Your reputation events will appear here as you participate in agreements and disputes."}
              </div>
            </div>
          </BentoCard>

          {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="card-cyan w-[90%] max-w-sm rounded-xl p-6 text-white shadow-lg">
                <h3 className="mb-4 text-lg font-semibold">Telegram Login</h3>

                <label className="mb-2 block text-sm text-gray-300">
                  Enter your OTP from the DexCourt's Telegram bot:
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  className="mb-4 w-full rounded-md border border-cyan-400/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowLoginModal(false)}
                    className="border-gray-500/30 text-gray-300 hover:bg-gray-700/40"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleLogin}
                    className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== Bento Grid Section ===== */}
      <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* My Disputes */}
        <BentoCard
          title="My Disputes"
          icon={<FiAlertCircle />}
          color="cyan"
          count={disputesStats.total}
          scrollable
          maxHeight="260px"
        >
          {disputesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
              <span className="ml-2 text-cyan-300">Loading disputes...</span>
            </div>
          ) : disputesError ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-red-300">
                Error loading disputes
              </div>
              <div className="text-sm text-white/50">{disputesError}</div>
            </div>
          ) : disputes.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">No disputes yet</div>
              <div className="text-sm text-white/50">
                Your dispute cases will appear here when you're involved in
                disagreements.
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    onClick={() => handleDisputeClick(dispute.id)}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-cyan-400/30 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className="max-w-[6rem] truncate text-sm font-medium text-white/90 sm:max-w-[10rem]">
                            {dispute.title}
                          </h4>

                          <DisputeStatusBadge status={dispute.status} />
                        </div>

                        <div className="mb-2 text-xs text-white/70">
                          Created: {formatDate(dispute.createdAt)}
                        </div>

                        <div className="space-y-1 text-xs text-white/60">
                          <div className="flex justify-between">
                            <span>Parties:</span>
                            <span className="text-white/80">
                              @{dispute.plaintiff} vs @{dispute.defendant}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Your Role:</span>
                            <span
                              className={
                                getUserRoleInDispute(dispute) === "Plaintiff"
                                  ? "text-blue-300"
                                  : getUserRoleInDispute(dispute) ===
                                      "Defendant"
                                    ? "text-pink-300"
                                    : "text-cyan-300"
                              }
                            >
                              {getUserRoleInDispute(dispute)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="text-white/80">
                              {dispute.request}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={loadMore}
                    disabled={disputesLoading}
                    className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                    size="sm"
                  >
                    {disputesLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Disputes"
                    )}
                  </Button>
                </div>
              )}

              {/* Show loading indicator when loading more */}
              {disputesLoading && disputes.length > 0 && (
                <div className="mt-2 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                </div>
              )}
            </>
          )}
        </BentoCard>

        {/* My Agreements (Reputational) */}
        <BentoCard
          title="My Agreements"
          icon={<FaHandshake />}
          color="cyan"
          count={agreementStats.total}
          scrollable
          maxHeight="260px"
        >
          {agreementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
              <span className="ml-2 text-cyan-300">Loading agreements...</span>
            </div>
          ) : agreementsError ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-red-300">
                Error loading agreements
              </div>
              <div className="text-sm text-white/50">{agreementsError}</div>
            </div>
          ) : userReputationalAgreements.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No reputational agreements yet
              </div>
              <div className="text-sm text-white/50">
                Create your first reputational agreement to get started.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {userReputationalAgreements.map((agreement) => {
                const userRole = getUserRoleInAgreement(
                  agreement,
                  user?.id?.toString(),
                  user?.walletAddress?.toLowerCase(),
                  false,
                );

                return (
                  <div
                    key={agreement.id}
                    onClick={() =>
                      handleAgreementClick(agreement.id.toString(), false)
                    }
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-cyan-400/30 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-col justify-between sm:flex-row sm:items-center">
                          <h4 className="truncate text-sm font-medium text-white/90 sm:max-w-[180px]">
                            {agreement.title}
                          </h4>

                          <AgreementStatusBadge status={agreement.status} />
                        </div>

                        <div className="mb-2 text-xs text-white/70">
                          Created: {formatDate(agreement.dateCreated)}
                        </div>

                        <div className="space-y-1 text-xs text-white/60">
                          <div className="flex justify-between">
                            <span>First Party:</span>
                            <span className="text-white/80">
                              {agreement.firstParty?.telegramUsername
                                ? `@${agreement.firstParty.telegramUsername}`
                                : agreement.firstParty?.wallet
                                  ? `${agreement.firstParty.wallet.slice(0, 6)}…${agreement.firstParty.wallet.slice(-4)}`
                                  : "Unknown User"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Counter Party:</span>
                            <span className="text-white/80">
                              {agreement.counterParty?.telegramUsername
                                ? `@${agreement.counterParty.telegramUsername}`
                                : agreement.counterParty?.wallet
                                  ? `${agreement.counterParty.wallet.slice(0, 6)}…${agreement.counterParty.wallet.slice(-4)}`
                                  : "Unknown User"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Your Role:</span>
                            <span
                              className={
                                userRole === "First Party"
                                  ? "text-blue-300"
                                  : userRole === "Counter Party"
                                    ? "text-pink-300"
                                    : "text-purple-300"
                              }
                            >
                              {userRole}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>

        {/* Escrow Deals */}
        <BentoCard
          title="Escrow Deals"
          icon={<FaHandshake />}
          color="cyan"
          count={escrowStats.total}
          scrollable
          maxHeight="260px"
        >
          {agreementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
              <span className="ml-2 text-cyan-300">
                Loading escrow deals...
              </span>
            </div>
          ) : agreementsError ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-red-300">
                Error loading escrow deals
              </div>
              <div className="text-sm text-white/50">{agreementsError}</div>
            </div>
          ) : userEscrowDeals.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No escrow deals yet
              </div>
              <div className="text-sm text-white/50">
                Your escrow-protected deals will appear here once you start
                trading.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {userEscrowDeals.map((agreement) => {
                const userRole = getUserRoleInAgreement(
                  agreement,
                  user?.id?.toString(),
                  user?.walletAddress?.toLowerCase(),
                  true,
                );

                const roleColor =
                  userRole === "Service Recipient"
                    ? "text-blue-300"
                    : userRole === "Service Provider"
                      ? "text-pink-300"
                      : userRole === "Creator"
                        ? "text-purple-300"
                        : "text-gray-300";

                return (
                  <div
                    key={agreement.id}
                    onClick={() =>
                      handleAgreementClick(agreement.id.toString(), true)
                    }
                    className="cursor-pointer rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-col justify-between sm:flex-row sm:items-center">
                          <h4 className="truncate text-sm font-medium text-white/90 sm:max-w-[180px]">
                            {agreement.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <AgreementStatusBadge
                              status={agreement.statusNumber || 1}
                            />
                          </div>
                        </div>
                        <div className="mb-2 text-xs text-white/70">
                          Created: {formatDate(agreement.createdAt)}
                        </div>

                        <div className="space-y-1 text-xs text-white/60">
                          <div className="flex justify-between">
                            <span>Service Provider:</span>
                            <span className="text-white/80">
                              {agreement.serviceProvider}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Recipient:</span>
                            <span className="text-white/80">
                              {agreement.serviceRecipient}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="text-emerald-300">
                              {agreement.amount} {agreement.token}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your Role:</span>
                            <span className={roleColor}>{userRole}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>
      </section>

      {/* Profile Update Modal */}
      <ProfileUpdateModal
        isOpen={showProfileUpdateModal}
        onClose={() => setShowProfileUpdateModal(false)}
        user={user}
        onUpdate={handleUpdate}
        updating={updating}
      />

      {showLinkModal.type === "telegram" && (
        <LoginModal
          isOpen={showLinkModal.open}
          onClose={() => setShowLinkModal({ type: "telegram", open: false })}
          mode="link"
        />
      )}

      {showLinkModal.type === "wallet" && (
        <WalletLinkingModal
          isOpen={showLinkModal.open}
          onClose={() => setShowLinkModal({ type: "wallet", open: false })}
        />
      )}
    </div>
  );
}
