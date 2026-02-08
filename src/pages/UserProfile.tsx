// pages/UserProfile.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";
// import { agreementService } from "../services/agreementServices";
import type { User } from "../types/auth.types";
import { FaUser, FaHandshake } from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";
import { Button } from "../components/ui/button";
import Judge from "../components/ui/svgcomponents/Judge";
import Community from "../components/ui/svgcomponents/Community";
import UserIcon from "../components/ui/svgcomponents/UserIcon";
import { BentoCard } from "./Profile";
import { LoginModal } from "../components/LoginModal";
import { UserAvatar } from "../components/UserAvatar";
import { useDisputesApi } from "../hooks/useDisputesApi";
import { useProfileAgreementsApi } from "../hooks/useProfileAgreementsApi";
import type { DisputeRow } from "../types";
import { Loader2, Wallet } from "lucide-react";
import TrustMeter from "../components/TrustMeter";
import useTrustScore from "../hooks/useTrustScore";

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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color} max-w-[80px] truncate`}
      title={config.label}
    >
      {config.label}
    </span>
  );
};

// Helper function to format dispute parties (plaintiff/defendant)
const formatDisputeParty = (party: string): string => {
  if (!party) return "Unknown";

  // Clean the party string
  const cleaned = party.replace(/^@/, "");

  // Check if it's a wallet address (0x + 40 hex chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(cleaned)) {
    return `${cleaned.slice(0, 6)}…${cleaned.slice(-4)}`;
  }

  // For Telegram usernames, add @ prefix
  return `@${cleaned}`;
};

// Add DisputeStatusBadge component
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
    <div className="flex items-center gap-1" title={tooltip}>
      {icon}
    </div>
  );
};

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

// Helper function to format handle (username or wallet address)
const formatHandle = (handle: string | null | undefined): string => {
  if (!handle) return "Unknown User";

  // Remove @ prefix if present for checking
  const cleanHandle = handle.replace(/^@/, "");

  // Check if it's a wallet address (0x + 40 hex chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(cleanHandle)) {
    return `${cleanHandle.slice(0, 6)}…${cleanHandle.slice(-4)}`;
  }

  // Otherwise, return the handle as-is (with @ if it was originally there)
  return handle.startsWith("@") ? handle : `@${handle}`;
};

export default function UserProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { isAuthenticated, user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { trustScore, loading: trustScoreLoading } = useTrustScore(
    user?.id || null,
  );

  // Use the agreements hook
  const {
    reputationalDisplay,
    escrowDisplay,
    loading: agreementsLoading,
    error: agreementsError,
    hasMoreReputational,
    hasMoreEscrow,
    loadMoreReputational,
    loadMoreEscrow,
    totalReputationalAgreements,
    totalEscrowAgreements,
  } = useProfileAgreementsApi(user?.id, user?.walletAddress);

  // Use the disputes hook
  const {
    disputes,
    loading: disputesLoading,
    error: disputesError,
    hasMore: hasMoreDisputes,
    totalUserDisputes,
    loadMore: loadMoreDisputes,
  } = useDisputesApi(user?.id);

  // Decode the URL parameter to handle spaces and special characters
  const decodedHandle = useMemo(() => {
    if (!handle) return "";
    return decodeURIComponent(handle);
  }, [handle]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Update these stats calculations:
  const agreementStats = useMemo(() => {
    return {
      total: totalReputationalAgreements, // Use from hook
      active: reputationalDisplay.filter((agreement) => agreement.status === 2)
        .length,
      completed: reputationalDisplay.filter(
        (agreement) => agreement.status === 3,
      ).length,
      disputed: reputationalDisplay.filter(
        (agreement) => agreement.status === 4,
      ).length,
    };
  }, [reputationalDisplay, totalReputationalAgreements]);

  const escrowStats = useMemo(() => {
    return {
      total: totalEscrowAgreements, // Use from hook
      active: escrowDisplay.filter((agreement) => agreement.statusNumber === 2)
        .length,
      completed: escrowDisplay.filter(
        (agreement) => agreement.statusNumber === 3,
      ).length,
      disputed: escrowDisplay.filter(
        (agreement) => agreement.statusNumber === 4,
      ).length,
      pending: escrowDisplay.filter((agreement) => agreement.statusNumber === 1)
        .length,
      pending_approval: escrowDisplay.filter(
        (agreement) => agreement.statusNumber === 7,
      ).length,
      expired: escrowDisplay.filter((agreement) => agreement.statusNumber === 6)
        .length,
      cancelled: escrowDisplay.filter(
        (agreement) => agreement.statusNumber === 5,
      ).length,
    };
  }, [escrowDisplay, totalEscrowAgreements]);

  const disputeStats = useMemo(
    () => ({
      total: totalUserDisputes, // Use from hook instead of disputes.length
      pending: disputes.filter((dispute) => dispute.status === "Pending")
        .length,
      inProgress: disputes.filter(
        (dispute) => dispute.status === "Vote in Progress",
      ).length,
      settled: disputes.filter((dispute) => dispute.status === "Settled")
        .length,
      dismissed: disputes.filter((dispute) => dispute.status === "Dismissed")
        .length,
    }),
    [disputes, totalUserDisputes], // Add totalUserDisputes as dependency
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

  // Handle dispute click
  const handleDisputeClick = useCallback(
    (disputeId: string) => {
      navigate(`/disputes/${disputeId}`);
    },
    [navigate],
  );

  // Helper function to get user role in dispute
  const getUserRoleInDispute = useMemo(() => {
    return (dispute: DisputeRow) => {
      const userId = user?.id;
      if (!userId) return "Unknown";

      if (dispute.plaintiffData?.userId === userId) return "Plaintiff";
      if (dispute.defendantData?.userId === userId) return "Defendant";

      let isPlaintiffWitness = false;
      let isDefendantWitness = false;

      if (dispute.witnesses && typeof dispute.witnesses === "object") {
        const plaintiffWitnesses = dispute.witnesses.plaintiff || [];
        const defendantWitnesses = dispute.witnesses.defendant || [];

        isPlaintiffWitness = plaintiffWitnesses.some(
          (w: any) => w.id?.toString() === userId,
        );
        isDefendantWitness = defendantWitnesses.some(
          (w: any) => w.id?.toString() === userId,
        );
      }

      if (isPlaintiffWitness) return "Witness (Plaintiff)";
      if (isDefendantWitness) return "Witness (Defendant)";

      return "Observer";
    };
  }, [user?.id]);

  // Helper function to get user role in escrow deal
  const getUserRoleInEscrowDeal = useCallback(
    (agreement: any) => {
      const userRole = getUserRoleInAgreement(
        agreement,
        user?.id?.toString(),
        user?.walletAddress?.toLowerCase(),
        true,
      );
      return userRole;
    },
    [user?.id, user?.walletAddress],
  );

  function mapApiUserToUser(apiUser: any): User {
    const getRolesFromRoleNumber = (role: number, isAdmin: boolean) => {
      return {
        admin: isAdmin,
        judge: role === 2,
        community: role === 1,
        user: true,
      };
    };

    const roles = getRolesFromRoleNumber(
      apiUser.role || 0,
      apiUser.isAdmin || false,
    );

    const avatarUrl =
      apiUser.avatarId && apiUser.id
        ? `https://dev-api.dexcourt.com/accounts/${apiUser.id}/file/${apiUser.avatarId}`
        : undefined;

    const primaryUsername = apiUser.telegram?.username
      ? `@${apiUser.telegram.username}`
      : `@${apiUser.username || "user"}`;

    return {
      id: apiUser.id.toString(),
      username: apiUser.telegram?.username || apiUser.username || "",
      bio: apiUser.bio || null,
      isVerified: apiUser.isVerified,
      isAdmin: apiUser.isAdmin || false,
      telegram: apiUser.telegram
        ? {
            username: apiUser.telegram.username,
            id: apiUser.telegram.id,
          }
        : undefined,
      walletAddress: apiUser.walletAddress,
      role: apiUser.role || 0,
      avatarId: apiUser.avatarId || null,
      handle: primaryUsername,
      wallet: apiUser.walletAddress
        ? `${apiUser.walletAddress.slice(0, 6)}…${apiUser.walletAddress.slice(-4)}`
        : "Not connected",
      trustScore: 0,
      roles,
      stats: {
        deals: 0,
        agreements: 0,
        disputes: 0,
        revenue: { "7d": 0, "30d": 0, "90d": 0 },
      },
      joinedDate: new Date().toISOString().split("T")[0],
      verified: apiUser.isVerified,
      avatarUrl: avatarUrl,
    };
  }

  // Safe calculations for user stats
  const safeStats = user?.stats || {
    deals: 0,
    agreements: 0,
    disputes: disputeStats.total,
    revenue: { "7d": 0, "30d": 0, "90d": 0 },
  };

  const safeRoles = user?.roles || {
    judge: false,
    community: false,
    user: true,
  };

  const safeTrustScore = trustScore;
  const safeJoinedDate =
    user?.joinedDate || new Date().toISOString().split("T")[0];

  // Check if this is the current user's profile
  const isOwnProfile = useMemo(() => {
    if (!currentUser || !decodedHandle) return false;

    const cleanHandle = decodedHandle.replace(/^@/, "");
    const currentUserTelegramUsername = currentUser.telegram?.username;
    const currentUserUsername = currentUser.username?.replace(/^@/, "") || "";

    return (
      cleanHandle === currentUserTelegramUsername ||
      cleanHandle === currentUserUsername
    );
  }, [currentUser, decodedHandle]);

  // Add this function inside the component, before the useEffect
  const loadUserData = useCallback(async () => {
    if (!decodedHandle) {
      setError("No user handle provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let userData: User | null = null;

      if (isOwnProfile) {
        console.log("🔐 Loading current user's profile");
        const apiUser = await apiService.getMyAccount();
        userData = mapApiUserToUser(apiUser);
      } else {
        const cleanHandle = decodedHandle.replace(/^@/, "");
        const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(cleanHandle);
        const isNumericId = !isNaN(Number(cleanHandle));

        if (isWalletAddress) {
          console.log(`🔐 Handle appears to be wallet address: ${cleanHandle}`);

          try {
            const apiUser =
              await apiService.getUserByWalletAddress(cleanHandle);
            userData = mapApiUserToUser(apiUser);
          } catch (walletError) {
            console.log("🔐 Wallet address lookup failed:", walletError);
            try {
              const apiUser = await apiService.getUserByUsername(cleanHandle);
              userData = mapApiUserToUser(apiUser);
            } catch (usernameError) {
              console.log("🔐 Username lookup also failed:", usernameError);
              throw new Error(
                `User with wallet address ${cleanHandle} not found`,
              );
            }
          }
        } else if (isNumericId) {
          console.log(`🔐 Handle appears to be numeric ID: ${cleanHandle}`);
          try {
            const apiUser = await apiService.getUserById(cleanHandle);
            userData = mapApiUserToUser(apiUser);
          } catch (idError) {
            console.log("🔐 ID lookup failed:", idError);
            throw new Error(`User with ID ${cleanHandle} not found`);
          }
        } else {
          console.log(`🔐 Handle appears to be username: ${cleanHandle}`);
          try {
            const apiUser = await apiService.getUserByUsername(cleanHandle);
            userData = mapApiUserToUser(apiUser);
          } catch (usernameError) {
            console.log("🔐 Username lookup failed:", usernameError);
            throw new Error(`User "${cleanHandle}" not found`);
          }
        }
      }

      setUser(userData);

      if (!userData) {
        setError("User not found");
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load user profile",
      );
    } finally {
      setLoading(false);
    }
  }, [decodedHandle, isOwnProfile]);

  // Then update the useEffect to use this function
  useEffect(() => {
    if (decodedHandle && isAuthenticated) {
      loadUserData();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [decodedHandle, isAuthenticated, loadUserData]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!decodedHandle) {
        setError("No user handle provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let userData: User | null = null;

        if (isOwnProfile) {
          console.log("🔐 Loading current user's profile");
          const apiUser = await apiService.getMyAccount();
          userData = mapApiUserToUser(apiUser);
        } else {
          const cleanHandle = decodedHandle.replace(/^@/, "");
          const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(cleanHandle);
          const isNumericId = !isNaN(Number(cleanHandle));

          if (isWalletAddress) {
            console.log(
              `🔐 Handle appears to be wallet address: ${cleanHandle}`,
            );

            try {
              const apiUser =
                await apiService.getUserByWalletAddress(cleanHandle);
              userData = mapApiUserToUser(apiUser);
            } catch (walletError) {
              console.log("🔐 Wallet address lookup failed:", walletError);
              try {
                const apiUser = await apiService.getUserByUsername(cleanHandle);
                userData = mapApiUserToUser(apiUser);
              } catch (usernameError) {
                console.log("🔐 Username lookup also failed:", usernameError);
                throw new Error(
                  `User with wallet address ${cleanHandle} not found`,
                );
              }
            }
          } else if (isNumericId) {
            console.log(`🔐 Handle appears to be numeric ID: ${cleanHandle}`);
            try {
              const apiUser = await apiService.getUserById(cleanHandle);
              userData = mapApiUserToUser(apiUser);
            } catch (idError) {
              console.log("🔐 ID lookup failed:", idError);
              throw new Error(`User with ID ${cleanHandle} not found`);
            }
          } else {
            console.log(`🔐 Handle appears to be username: ${cleanHandle}`);
            try {
              const apiUser = await apiService.getUserByUsername(cleanHandle);
              userData = mapApiUserToUser(apiUser);
            } catch (usernameError) {
              console.log("🔐 Username lookup failed:", usernameError);
              throw new Error(`User "${cleanHandle}" not found`);
            }
          }
        }

        setUser(userData);

        if (!userData) {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user profile",
        );
      } finally {
        setLoading(false);
      }
    };

    if (decodedHandle && isAuthenticated) {
      loadUserData();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [decodedHandle, isAuthenticated, isOwnProfile, currentUser]);

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="relative space-y-8">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/90 lg:text-2xl">
            User Profile
          </h2>
        </header>

        <div className="glass card-cyan mx-auto flex max-w-[50rem] flex-col items-center justify-center rounded-2xl border border-cyan-400/30 p-12 text-center">
          <div className="mb-6 grid h-20 w-20 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            <FaUser className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white/90">
            Please log in to view user profiles
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your wallet or login via Telegram to access DexCourt
            profiles, view user agreements, disputes, and reputation scores.
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
              Loading Profile
            </h3>
            <p className="text-sm text-cyan-200/70">
              Preparing {handle ? `${handle}'s` : "user"} profile...
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

  if (error || !user) {
    return (
      <div className="flex min-h-screen justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
              <FiAlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              {error?.includes("not found")
                ? "User Profile Not Found"
                : "Unable to Load Profile"}
            </h2>
            <div className="mb-6 max-w-md text-cyan-200/80">
              {error?.includes("not found") ? (
                <p>
                  The user profile for "{handle}" doesn't exist or may have been
                  removed. Please check the details and try again.
                </p>
              ) : (
                <p>
                  We encountered an issue loading this profile. Please try again
                  or check the troubleshooting tips below.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                // Try to refetch the user data
                setLoading(true);
                setError(null);
                // Trigger a reload after a short delay
                setTimeout(() => {
                  loadUserData();
                }, 500);
              }}
              variant="outline"
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Retry Loading Profile
            </Button>
            <Button
              onClick={() => navigate("/profile")}
              className="border-white/15 bg-cyan-600/20 text-cyan-200 hover:bg-cyan-500/30"
            >
              Go to My Profile
            </Button>
          </div>
          <div className="mt-8 flex w-fit justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="text-sm text-cyan-300">
              <p className="mb-1 font-medium">Troubleshooting tips:</p>
              <ul className="space-y-1">
                <li>• Check if the username/wallet address is correct</li>
                <li>• Verify your internet connection</li>
                <li>• The profile may have been deleted or made private</li>
                <li>• Try refreshing the page</li>
              </ul>
            </div>
          </div>
          {/* <div className="mt-6 flex w-fit justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="text-sm text-cyan-300">
              <p className="mb-1 font-medium">Supported Profile URL formats:</p>
              <ul className="space-y-1">
                <li>
                  • Username:{" "}
                  <code className="ml-1 rounded bg-black/30 px-1.5 py-0.5">
                    /profile/username
                  </code>
                </li>
                <li>
                  • Telegram:{" "}
                  <code className="ml-1 rounded bg-black/30 px-1.5 py-0.5">
                    /profile/@telegramUsername
                  </code>
                </li>
                <li>
                  • User ID:{" "}
                  <code className="ml-1 rounded bg-black/30 px-1.5 py-0.5">
                    /profile/123
                  </code>
                </li>
                <li>
                  • Wallet:{" "}
                  <code className="ml-1 rounded bg-black/30 px-1.5 py-0.5">
                    /profile/0x123...abc
                  </code>
                </li>
              </ul>
            </div>
          </div> */}
          {/* {currentUser && (
            <div className="mt-6 flex w-fit justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
              <div className="text-sm text-cyan-300">
                <p className="mb-1 font-medium">Quick links to your profile:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    <button
                      onClick={() =>
                        navigate(
                          `/profile/${
                            currentUser?.telegram?.username ||
                            currentUser?.username
                          }`,
                        )
                      }
                      className="text-cyan-200 hover:text-cyan-100 hover:underline"
                    >
                      • Your profile: /profile/
                      {currentUser?.telegram?.username || currentUser?.username}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate(`/profile/${currentUser?.id}`)}
                      className="text-cyan-200 hover:text-cyan-100 hover:underline"
                    >
                      • Your profile by ID: /profile/{currentUser?.id}
                    </button>
                  </li>
                  {currentUser?.walletAddress && (
                    <li>
                      <button
                        onClick={() =>
                          navigate(`/profile/${currentUser.walletAddress}`)
                        }
                        className="text-cyan-200 hover:text-cyan-100 hover:underline"
                      >
                        • Your profile by wallet: /profile/
                        {currentUser.walletAddress}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )} */}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white/90">
            {formatHandle(user.handle)}
            {user.isVerified && (
              <span className="ml-2 rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                Verified
              </span>
            )}
          </h2>
          <div className="text-muted-foreground mt-1 text-sm">
            Joined {new Date(safeJoinedDate).toLocaleDateString()}
          </div>
          {user.bio && (
            <div className="mt-2 max-w-md text-white/70">{user.bio}</div>
          )}
        </div>
      </header>

      {/* Profile Summary */}
      <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="card-cyan grid items-center rounded-2xl px-6 py-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-2">
            <UserAvatar
              userId={user.id}
              avatarId={user.avatarId}
              username={user.telegram?.username || user.username}
              size="lg"
              className="h-14 w-14 border border-cyan-400/30"
              priority={true}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <RoleBadge
                  role={safeRoles.judge}
                  icon={<Judge />}
                  tooltip="Certified Judge"
                />
                <RoleBadge
                  role={safeRoles.community}
                  icon={<Community />}
                  tooltip="Community Member"
                />
                <RoleBadge
                  role={
                    safeRoles.user && !safeRoles.judge && !safeRoles.community
                  }
                  icon={<UserIcon />}
                  tooltip="Basic User"
                />
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                <div className="flex items-center gap-1 font-semibold text-white/90">
                  {formatHandle(user.handle)}
                </div>
                <div className="mt-1">
                  {user.walletAddress ? (
                    <div className="flex items-center gap-1 text-cyan-300">
                      <Wallet className="h-3 w-3" />
                      <span className="text-xs">
                        {user.walletAddress.slice(0, 8)}...
                        {user.walletAddress.slice(-6)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      No wallet linked
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="self-center">
              {trustScoreLoading ? (
                <div className="flex h-32 w-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
                </div>
              ) : (
                <TrustMeter score={safeTrustScore} />
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-4">
          <div className="card-cyan flex flex-col justify-between rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white/90">
              Activity Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agreements</span>
                <span className="font-semibold text-cyan-300">
                  {agreementStats.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escrow Deals</span>
                <span className="font-semibold text-cyan-300">
                  {escrowStats.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disputes</span>
                <span className="font-semibold text-cyan-300">
                  {disputeStats.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Volume */}
        <div className="space-y-4">
          <div className="card-cyan flex flex-col justify-between rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white/90">
              Trading Volume
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="text-lg font-semibold text-green-500">
                  $
                  {safeStats.revenue
                    ? Object.values(safeStats.revenue)
                        .reduce((a, b) => a + b, 0)
                        .toLocaleString()
                    : "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Deals</span>
                <span className="font-semibold text-cyan-300">
                  {safeStats.deals || 0}
                </span>
              </div>
              <div className="pt-2 text-center text-xs text-white/50">
                {isOwnProfile
                  ? "Your detailed revenue"
                  : "Detailed revenue visible only to profile owner"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User's Public Content */}
      <section className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
        {/* User's Disputes */}

        <BentoCard
          title={`${formatHandle(user.handle)}'s Disputes`}
          icon={<FiAlertCircle />}
          color="cyan"
          count={disputeStats.total}
          scrollable
          maxHeight="260px"
        >
          {disputesLoading && disputes.length === 0 ? (
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
                {isOwnProfile
                  ? "Your dispute cases will appear here when you're involved in disagreements."
                  : `${formatHandle(user.handle)} has not been involved in any disputes yet.`}
              </div>
            </div>
          ) : (
            <>
              {/* Add count display */}
              <div className="mb-4 text-sm text-white/70">
                Showing {disputes.length} of {totalUserDisputes} disputes
              </div>

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
                              {formatDisputeParty(dispute.plaintiff)} vs{" "}
                              {formatDisputeParty(dispute.defendant)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Their Role:</span>
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

              {/* Update the load more section */}
              {hasMoreDisputes && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="mb-2 text-sm text-white/60">
                    Showing {disputes.length} of {totalUserDisputes} disputes
                  </div>
                  <Button
                    onClick={loadMoreDisputes}
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

        <BentoCard
          title={`${formatHandle(user.handle)}'s Agreements`}
          icon={<FaHandshake />}
          color="cyan"
          count={agreementStats.total}
          scrollable
          maxHeight="260px"
        >
          {agreementsLoading && reputationalDisplay.length === 0 ? (
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
          ) : reputationalDisplay.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No reputational agreements yet
              </div>
              <div className="text-sm text-white/50">
                {isOwnProfile
                  ? "Your reputational agreements will appear here. Escrow-protected deals are shown separately."
                  : `${formatHandle(user.handle)} has no reputational agreements yet. Check their escrow deals for secured agreements.`}
              </div>
            </div>
          ) : (
            <>
              {/* Add count display */}
              <div className="mb-4 text-sm text-white/70">
                Showing {reputationalDisplay.length} of{" "}
                {totalReputationalAgreements} agreements
              </div>

              <div className="space-y-3">
                {reputationalDisplay.map((agreement) => {
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
                              <span className="text-cyan-300">
                                First Party:
                              </span>
                              <span className="text-white/80">
                                {agreement.firstParty?.telegramUsername
                                  ? agreement.firstParty.telegramUsername.startsWith(
                                      "0x",
                                    )
                                    ? `${agreement.firstParty.telegramUsername.slice(0, 6)}…${agreement.firstParty.telegramUsername.slice(-4)}`
                                    : `@${agreement.firstParty.telegramUsername}`
                                  : agreement.firstParty?.wallet
                                    ? `${agreement.firstParty.wallet.slice(0, 6)}…${agreement.firstParty.wallet.slice(-4)}`
                                    : "Unknown User"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-pink-300">
                                Counter Party:
                              </span>
                              <span className="text-white/80">
                                {agreement.counterParty?.telegramUsername
                                  ? agreement.counterParty.telegramUsername.startsWith(
                                      "0x",
                                    )
                                    ? `${agreement.counterParty.telegramUsername.slice(0, 6)}…${agreement.counterParty.telegramUsername.slice(-4)}`
                                    : `@${agreement.counterParty.telegramUsername}`
                                  : agreement.counterParty?.wallet
                                    ? `${agreement.counterParty.wallet.slice(0, 6)}…${agreement.counterParty.wallet.slice(-4)}`
                                    : "Unknown User"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Their Role:</span>
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

              {/* Add Load More button for reputational agreements */}
              {hasMoreReputational && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="mb-2 text-sm text-white/60">
                    Showing {reputationalDisplay.length} of{" "}
                    {totalReputationalAgreements} agreements
                  </div>
                  <Button
                    onClick={loadMoreReputational}
                    disabled={agreementsLoading}
                    className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                    size="sm"
                  >
                    {agreementsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Agreements"
                    )}
                  </Button>
                </div>
              )}

              {/* Show loading indicator when loading more */}
              {agreementsLoading && reputationalDisplay.length > 0 && (
                <div className="mt-2 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                </div>
              )}
            </>
          )}
        </BentoCard>

        <BentoCard
          title={`${formatHandle(user.handle)}'s Escrow Deals`}
          icon={<FaHandshake />}
          color="cyan"
          count={escrowStats.total}
          scrollable
          maxHeight="260px"
        >
          {agreementsLoading && escrowDisplay.length === 0 ? (
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
          ) : escrowDisplay.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No escrow deals yet
              </div>
              <div className="text-sm text-white/50">
                {isOwnProfile
                  ? "Your escrow-protected deals will appear here once you start trading."
                  : `${formatHandle(user.handle)} has no escrow deals yet.`}
              </div>
            </div>
          ) : (
            <>
              {/* Add count display */}
              <div className="mb-4 text-sm text-white/70">
                Showing {escrowDisplay.length} of {totalEscrowAgreements} escrow
                deals
              </div>

              <div className="space-y-3">
                {escrowDisplay.map((agreement: any) => {
                  const userRole = getUserRoleInEscrowDeal(agreement);
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
                              <span>Their Role:</span>
                              <span className={roleColor}>{userRole}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Load More button for escrow deals */}
              {hasMoreEscrow && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="mb-2 text-sm text-white/60">
                    Showing {escrowDisplay.length} of {totalEscrowAgreements}{" "}
                    escrow deals
                  </div>
                  <Button
                    onClick={loadMoreEscrow}
                    disabled={agreementsLoading}
                    className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                    size="sm"
                  >
                    {agreementsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Escrow Deals"
                    )}
                  </Button>
                </div>
              )}

              {/* Show loading indicator when loading more */}
              {agreementsLoading && escrowDisplay.length > 0 && (
                <div className="mt-2 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                </div>
              )}
            </>
          )}
        </BentoCard>
      </section>
    </div>
  );
}
