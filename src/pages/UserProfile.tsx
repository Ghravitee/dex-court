/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/UserProfile.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";

import type { User } from "../types/auth.types";
import { FaUser, FaHandshake } from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";
// import { RiShieldCheckFill } from "react-icons/ri";
import { Button } from "../components/ui/button";
import Judge from "../components/ui/svgcomponents/Judge";
import Community from "../components/ui/svgcomponents/Community";
import UserIcon from "../components/ui/svgcomponents/UserIcon";
import { BentoCard } from "./Profile";
import { LoginModal } from "../components/LoginModal";
import { UserAvatar } from "../components/UserAvatar";
import { usePublicAgreementsApi } from "../hooks/usePublicAgreementsApi";
import { useDisputesApi } from "../hooks/useDisputesApi";
// import type { AgreementSummaryDTO } from "../services/agreementServices";
import type { DisputeRow } from "../types";
import { Loader2, Wallet } from "lucide-react";
import TrustMeter from "../components/TrustMeter";
import useTrustScore from "../hooks/useTrustScore";
// ADD THIS IMPORT
import { useAgreementsWithDetailsAndFundsFilter } from "../hooks/useAgreementsWithDetails";
import { useChainId, useContractReads } from "wagmi";
import { ESCROW_ABI, ESCROW_CA } from "../web3/config";
import { cleanTelegramUsername } from "../lib/usernameUtils";

// Add AgreementStatusBadge component (same as in Profile)
// Replace the existing AgreementStatusBadge component with this enhanced version
const AgreementStatusBadge = ({
  status,
  agreement,
}: {
  status: number;
  agreement?: any;
}) => {
  // Use on-chain status if available, otherwise use API status
  const displayStatus =
    agreement?.onChainStatus || mapAgreementStatusToEscrow(status);

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
    pending_delivery: {
      label: "Pending Delivery",
      color: "bg-orange-500/20 text-orange-300 border-orange-400/30",
    },
    pending_approval: {
      label: "Pending Approval",
      color: "bg-purple-500/20 text-purple-300 border-purple-400/30",
    },
  };

  const config = statusConfig[displayStatus as keyof typeof statusConfig] || {
    label: "Unknown",
    color: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// ADD DisputeStatusBadge component
const DisputeStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    Pending: {
      label: "Pending",
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
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
    color: "bg-gray-500/20 text-gray-300 border-gray-400/30",
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

// Add these types near the top with your other types
type EscrowStatus =
  | "pending"
  | "signed"
  | "completed"
  | "cancelled"
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
      return "cancelled";
    case 7:
      return "pending_delivery";
    default:
      return "pending";
  }
};

// Enhanced status mapping from on-chain data
const mapOnChainStatusFromArray = (agreementData: any[]): EscrowStatus => {
  if (!agreementData || !Array.isArray(agreementData)) return "pending";

  if (agreementData[18]) return "completed";
  if (agreementData[19]) return "disputed";
  if (agreementData[21]) return "cancelled";
  if (agreementData[23]) return "pending_approval";
  if (agreementData[15] && agreementData[16] && agreementData[17]) {
    return "signed";
  }
  if (agreementData[15]) return "pending_delivery";

  return "pending";
};

// Custom hook to fetch on-chain data for agreements
const useOnChainAgreementData = (agreements: any[]) => {
  const chainId = useChainId();
  const contractAddress =
    (chainId && ESCROW_CA[chainId as number]) || undefined;

  // Create contract calls for each agreement that has a contractAgreementId
  const contracts = useMemo(() => {
    return agreements
      .filter((agreement) => {
        const contractAgreementId = agreement.contractAgreementId;
        return contractAgreementId && contractAddress;
      })
      .map((agreement) => {
        const contractAgreementId = agreement.contractAgreementId;
        return {
          address: contractAddress as `0x${string}`,
          abi: ESCROW_ABI.abi,
          functionName: "getAgreement" as const,
          args: [BigInt(contractAgreementId)],
        };
      });
  }, [agreements, contractAddress]);

  // Fetch on-chain data
  const { data: onChainData, isLoading } = useContractReads({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  return { onChainData, isLoading };
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

  const {
    agreements,
    // agreementDetails,
    loading: agreementsLoading,
    error: agreementsError,
  } = usePublicAgreementsApi(user?.id);

  const {
    disputes,
    loading: disputesLoading,
    error: disputesError,
  } = useDisputesApi(user?.id);

  // ADD ESCROW HOOK
  const {
    data: agreementsWithSecuredFunds,
    isLoading: escrowAgreementsLoading,
    error: escrowAgreementsError,
  } = useAgreementsWithDetailsAndFundsFilter({
    includesFunds: true,
    hasSecuredFunds: true,
  });

  // Add this transform function (similar to Profile.tsx)
  const transformApiAgreementToEscrow = (apiAgreement: any) => {
    // Extract from on-chain metadata in description
    const extractServiceProviderFromDescription = (
      description: string,
    ): string | undefined => {
      const match = description?.match(
        /Service Provider: (0x[a-fA-F0-9]{40})/i,
      );
      return match?.[1];
    };

    const extractServiceRecipientFromDescription = (
      description: string,
    ): string | undefined => {
      const match = description?.match(
        /Service Recipient: (0x[a-fA-F0-9]{40})/i,
      );
      return match?.[1];
    };

    const serviceProvider = extractServiceProviderFromDescription(
      apiAgreement.description,
    );
    const serviceRecipient = extractServiceRecipientFromDescription(
      apiAgreement.description,
    );

    // Fallback to API party data
    const getPartyIdentifier = (party: any): string => {
      return (
        party?.walletAddress ||
        party?.wallet ||
        party?.WalletAddress ||
        cleanTelegramUsername(party?.telegramUsername) ||
        "@unknown"
      );
    };

    const fallbackServiceProvider = getPartyIdentifier(apiAgreement.firstParty);
    const fallbackServiceRecipient = getPartyIdentifier(
      apiAgreement.counterParty,
    );

    const finalServiceProvider = serviceProvider || fallbackServiceProvider;
    const finalServiceRecipient = serviceRecipient || fallbackServiceRecipient;

    return {
      id: `${apiAgreement.id}`,
      title: apiAgreement.title,
      from: finalServiceRecipient,
      to: finalServiceProvider,
      token: apiAgreement.tokenSymbol || "ETH",
      amount: apiAgreement.amount ? parseFloat(apiAgreement.amount) : 0,
      status: mapAgreementStatusToEscrow(apiAgreement.status),
      deadline: apiAgreement.deadline
        ? new Date(apiAgreement.deadline).toISOString().split("T")[0]
        : "No deadline",
      type: apiAgreement.visibility === 1 ? "private" : "public",
      description: apiAgreement.description || "",
      createdAt: new Date(
        apiAgreement.dateCreated || apiAgreement.createdAt,
      ).getTime(),
      contractAgreementId: apiAgreement.contractAgreementId,
      firstParty: apiAgreement.firstParty,
      counterParty: apiAgreement.counterParty,
    };
  };

  // Transform escrow agreements
  const escrowAgreements = useMemo(() => {
    if (!agreementsWithSecuredFunds) return [];

    return agreementsWithSecuredFunds
      .filter((agreement: any) => agreement.type === 2) // ESCROW type
      .map(transformApiAgreementToEscrow);
  }, [agreementsWithSecuredFunds]);

  // Fetch on-chain data for escrow agreements
  const { onChainData } = useOnChainAgreementData(escrowAgreements);

  // Merge API data with on-chain data for escrow deals
  const escrowDealsWithOnChainData = useMemo(() => {
    if (escrowAgreements.length === 0) return [];

    // If we have on-chain data, merge it
    if (onChainData && onChainData.length > 0) {
      return escrowAgreements.map((escrow, index) => {
        const onChainAgreement = onChainData[index];

        if (onChainAgreement && onChainAgreement.status === "success") {
          const agreementData = [
            ...(onChainAgreement.result as readonly any[]),
          ];

          const onChainStatus = mapOnChainStatusFromArray(agreementData);

          return {
            ...escrow,
            // Override the status with on-chain status when available
            status: onChainStatus,
            onChainStatus: onChainStatus,
            onChainAmount: agreementData[5]?.toString(),
            onChainDeadline: Number(agreementData[8]),
            onChainParties: {
              serviceProvider: agreementData[2],
              serviceRecipient: agreementData[3],
            },
            onChainToken: agreementData[4],
            isOnChainActive:
              agreementData[15] === true && agreementData[14] === true,
            isFunded: agreementData[14] === true,
            isSigned: agreementData[15] === true,
            isCompleted: agreementData[18] === true,
            isDisputed: agreementData[19] === true,
            isCancelled: agreementData[21] === true,
            deliverySubmitted: agreementData[16] === true,
            lastUpdated: Date.now(),
          };
        }

        return escrow;
      });
    }

    // Fallback to API data only
    return escrowAgreements;
  }, [escrowAgreements, onChainData]);

  // Memoized escrow deals calculation - FILTER FOR CURRENT USER PROFILE
  const escrowDeals = useMemo(() => {
    if (!escrowDealsWithOnChainData || !user?.id) return [];

    return escrowDealsWithOnChainData.filter((agreement: any) => {
      const userId = user.id.toString();

      // Handle different possible party structures
      const firstPartyId =
        agreement.firstParty?.id?.toString() ||
        agreement.firstPartyId?.toString();
      const counterPartyId =
        agreement.counterParty?.id?.toString() ||
        agreement.counterPartyId?.toString();

      // Also check wallet addresses if available
      const firstPartyWallet =
        agreement.firstParty?.walletAddress || agreement.firstParty?.wallet;
      const counterPartyWallet =
        agreement.counterParty?.walletAddress || agreement.counterParty?.wallet;
      const userWallet = user.walletAddress;

      return (
        firstPartyId === userId ||
        counterPartyId === userId ||
        firstPartyWallet === userWallet ||
        counterPartyWallet === userWallet
      );
    });
  }, [escrowDealsWithOnChainData, user?.id, user?.walletAddress]);

  // Memoized escrow stats
  const escrowStats = useMemo(
    () => ({
      total: escrowDeals.length,
      active: escrowDeals.filter(
        (agreement: any) =>
          agreement.status === "signed" || agreement.status === 2,
      ).length,
      completed: escrowDeals.filter(
        (agreement: any) =>
          agreement.status === "completed" || agreement.status === 3,
      ).length,
      disputed: escrowDeals.filter(
        (agreement: any) =>
          agreement.status === "disputed" || agreement.status === 4,
      ).length,
    }),
    [escrowDeals],
  );

  // Decode the URL parameter to handle spaces and special characters
  const decodedHandle = useMemo(() => {
    if (!handle) return "";
    // Decode URL-encoded characters (like %20 for spaces)
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

  // Helper function to get agreement title with fallbacks
  const getAgreementTitle = useCallback((agreement: any) => {
    if (agreement.title) {
      return agreement.title;
    }
    return `Agreement #${agreement.id}`;
  }, []);

  // Handle agreement click to navigate to details
  const handleAgreementClick = useCallback(
    (agreementId: number) => {
      // Check if this is an escrow agreement or regular agreement
      const isEscrowAgreement = agreementsWithSecuredFunds?.some(
        (agreement: any) => agreement.id === agreementId,
      );

      if (isEscrowAgreement) {
        navigate(`/escrow/${agreementId}`);
      } else {
        navigate(`/agreements/${agreementId}`);
      }
    },
    [navigate, agreementsWithSecuredFunds],
  );

  // ADD handle escrow click function
  const handleEscrowClick = useCallback(
    (agreementId: number) => {
      navigate(`/escrow/${agreementId}`);
    },
    [navigate],
  );

  // ADD handle dispute click function
  const handleDisputeClick = useCallback(
    (disputeId: string) => {
      navigate(`/disputes/${disputeId}`);
    },
    [navigate],
  );

  // ADD helper function to get user role in dispute
  const getUserRoleInDispute = useMemo(() => {
    return (dispute: DisputeRow) => {
      const userId = user?.id;
      if (!userId) return "Unknown";

      if (dispute.plaintiffData?.userId === userId) return "Plaintiff";
      if (dispute.defendantData?.userId === userId) return "Defendant";

      // Check if user is a witness
      let isPlaintiffWitness = false;
      let isDefendantWitness = false;

      if (dispute.witnesses && typeof dispute.witnesses === "object") {
        const plaintiffWitnesses = dispute.witnesses.plaintiff || [];
        const defendantWitnesses = dispute.witnesses.defendant || [];

        isPlaintiffWitness = plaintiffWitnesses.some(
          (w) => w.id?.toString() === userId,
        );
        isDefendantWitness = defendantWitnesses.some(
          (w) => w.id?.toString() === userId,
        );
      }

      if (isPlaintiffWitness) return "Witness (Plaintiff)";
      if (isDefendantWitness) return "Witness (Defendant)";

      return "Observer";
    };
  }, [user?.id]);

  // ADD helper function to get user role in escrow deal
  const getUserRoleInEscrowDeal = useCallback(
    (agreement: any) => {
      const userId = user?.id;
      if (!userId) return "Unknown";

      // Convert both to strings for comparison to ensure type safety
      const userIdStr = userId.toString();
      const firstPartyId = agreement.firstParty?.id?.toString();
      const counterPartyId = agreement.counterParty?.id?.toString();
      const creatorId = agreement.creator?.id?.toString();

      if (firstPartyId === userIdStr) return "Service Recipient";
      if (counterPartyId === userIdStr) return "Service Provider";
      if (creatorId === userIdStr) return "Creator";

      return "Unknown";
    },
    [user?.id],
  );

  const disputeStats = useMemo(
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
    }),
    [disputes],
  );

  // pages/UserProfile.tsx - Update mapApiUserToUser
  function mapApiUserToUser(apiUser: any): User {
    const getRolesFromRoleNumber = (role: number, isAdmin: boolean) => {
      return {
        admin: isAdmin, // Use isAdmin field
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
      isAdmin: apiUser.isAdmin || false, // ADD THIS
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

  // Safe calculations for user stats - use real trust score
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

  // Use the real trust score from the hook instead of the mock one
  const safeTrustScore = trustScore; // This is the real trust score from API
  const safeJoinedDate =
    user?.joinedDate || new Date().toISOString().split("T")[0];

  // Calculate rates safely to avoid division by zero
  // const disputeRate =
  //   safeStats.deals > 0
  //     ? Math.round((disputeStats.total / safeStats.deals) * 100)
  //     : 0;

  // const successRate =
  //   safeStats.deals > 0
  //     ? Math.round((safeStats.agreements / safeStats.deals) * 100)
  //     : 0;

  // Check if this is the current user's profile - UPDATED TO USE TELEGRAM USERNAME
  const isOwnProfile = useMemo(() => {
    if (!currentUser || !decodedHandle) return false;

    // Clean the handle for comparison (remove @ symbol and handle URL encoding)
    const cleanHandle = decodedHandle.replace(/^@/, "");

    // Use Telegram username for comparison if available
    const currentUserTelegramUsername = currentUser.telegram?.username;
    const currentUserUsername = currentUser.username?.replace(/^@/, "") || "";

    // Check if handle matches current user's Telegram username or fallback username
    return (
      cleanHandle === currentUserTelegramUsername ||
      cleanHandle === currentUserUsername
    );
  }, [currentUser, decodedHandle]);

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
          // Clean the handle (remove @ symbol)
          const cleanHandle = decodedHandle.replace(/^@/, "");

          console.log(`🔐 Loading other user by username: "${cleanHandle}"`);
          try {
            // Use the new username endpoint
            const apiUser = await apiService.getUserByUsername(cleanHandle);
            userData = mapApiUserToUser(apiUser);
          } catch (usernameError) {
            console.log("🔐 Username lookup failed:", usernameError);

            // If username lookup fails, try ID as fallback
            if (!isNaN(Number(cleanHandle))) {
              try {
                const apiUser = await apiService.getUserById(cleanHandle);
                userData = mapApiUserToUser(apiUser);
              } catch (idError) {
                console.error(
                  "🔐 Both username and ID lookup failed:",
                  idError,
                );
                throw new Error(`User "${cleanHandle}" not found`);
              }
            } else {
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

  useEffect(() => {
    console.log(
      "🔍 UserProfile Debug - agreementsWithSecuredFunds:",
      agreementsWithSecuredFunds,
    );
    console.log("🔍 UserProfile Debug - escrowAgreements:", escrowAgreements);
    console.log(
      "🔍 UserProfile Debug - escrowDealsWithOnChainData:",
      escrowDealsWithOnChainData,
    );
    console.log("🔍 UserProfile Debug - escrowDeals:", escrowDeals);
    console.log("🔍 UserProfile Debug - onChainData:", onChainData);
  }, [
    agreementsWithSecuredFunds,
    escrowAgreements,
    escrowDealsWithOnChainData,
    escrowDeals,
    onChainData,
  ]);

  // Calculate agreement stats from real data
  // Add this memo to filter out escrow agreements from regular agreements
  const regularAgreements = useMemo(() => {
    return agreements.filter((agreement) => {
      // Filter out agreements that have secured funds (escrow deals)
      const hasSecuredFunds = agreementsWithSecuredFunds?.some(
        (securedAgreement: any) => securedAgreement.id === agreement.id,
      );
      return !hasSecuredFunds;
    });
  }, [agreements, agreementsWithSecuredFunds]);

  // Update the agreement stats to use regular agreements
  const agreementStats = useMemo(() => {
    return {
      total: regularAgreements.length,
      active: regularAgreements.filter((agreement) => agreement.status === 2)
        .length,
      completed: regularAgreements.filter((agreement) => agreement.status === 3)
        .length,
      disputed: regularAgreements.filter((agreement) => agreement.status === 4)
        .length,
    };
  }, [regularAgreements]);

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
      <div className="flex items-center justify-center py-12">
        <div className="text-cyan-300">Loading profile...</div>
      </div>
    );
  }

  // pages/UserProfile.tsx - Update the error section

  if (error || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="mb-4 text-2xl text-white/70">
            {error || "Profile Not Available"}
          </div>
          <div className="mb-4 text-white/50">
            {error?.includes("not found") ? (
              <div>
                <p>User {handle} was not found.</p>
                <p className="mt-2 text-sm">
                  Make sure you're using the correct username or user ID.
                </p>
              </div>
            ) : (
              <div>
                <p>Unable to load user profile for {handle}.</p>
                <div className="mt-4 text-sm text-cyan-300">
                  <p>Try these URLs instead:</p>
                  <p>
                    • Your profile: /profile/
                    {currentUser?.telegram?.username || currentUser?.username}
                  </p>
                  <p>• Your profile by ID: /profile/{currentUser?.id}</p>
                  <p>
                    • Other users: /profile/[telegram-username] or
                    /profile/[user-id]
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white/90">
            {user.handle} {/* This now shows Telegram username */}
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
        <div className="glass card-cyan grid items-center rounded-2xl px-6 py-3 ring-1 ring-white/10">
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
                  {user.handle}
                </div>
                {/* ADD WALLET ADDRESS DISPLAY */}
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
          <div className="glass flex flex-col justify-between rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-transparent p-6">
            <h3 className="mb-4 text-lg font-semibold text-white/90">
              Activity Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deals</span>
                <span className="font-semibold text-cyan-300">
                  {safeStats.deals}
                </span>
              </div>

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
          <div className="glass flex flex-col justify-between rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-transparent p-6">
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
          title={`${user?.handle}'s Disputes`}
          icon={<FiAlertCircle />}
          color="cyan"
          count={disputeStats.total}
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
                {isOwnProfile
                  ? "Your dispute cases will appear here when you're involved in disagreements."
                  : `${user?.handle} has not been involved in any disputes yet.`}
              </div>
            </div>
          ) : (
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
                        <h4 className="truncate text-sm font-medium text-white/90">
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
                                : getUserRoleInDispute(dispute) === "Defendant"
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
          )}
        </BentoCard>
        {/* User's Public Agreements */}
        <BentoCard
          title={`${user.handle}'s Public Agreements`}
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
          ) : regularAgreements.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No regular agreements yet
              </div>
              <div className="text-sm text-white/50">
                {isOwnProfile
                  ? "Your regular agreements will appear here. Escrow-protected deals are shown separately."
                  : `${user.handle} has no regular agreements yet. Check their escrow deals for secured agreements.`}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {regularAgreements.map((agreement) => (
                <div
                  key={agreement.id}
                  onClick={() => handleAgreementClick(agreement.id)}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-cyan-400/30 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="truncate text-sm font-medium text-white/90">
                          {getAgreementTitle(agreement)}
                        </h4>
                        <div className="ml-auto">
                          <AgreementStatusBadge status={agreement.status} />
                        </div>
                      </div>

                      <div className="mb-2 text-xs text-white/70">
                        Created: {formatDate(agreement.dateCreated)}
                      </div>

                      <div className="space-y-1 text-xs text-white/60">
                        <div className="flex justify-between">
                          <span className="text-cyan-300">First Party:</span>
                          <span className="text-white/80">
                            {agreement.firstParty.telegramUsername
                              ? agreement.firstParty.telegramUsername.startsWith(
                                  "0x",
                                )
                                ? `${agreement.firstParty.telegramUsername.slice(0, 6)}…${agreement.firstParty.telegramUsername.slice(-4)}`
                                : `@${agreement.firstParty.telegramUsername}`
                              : agreement.firstParty.wallet
                                ? `${agreement.firstParty.wallet.slice(0, 6)}…${agreement.firstParty.wallet.slice(-4)}`
                                : "Unknown User"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pink-300">Counter Party:</span>
                          <span className="text-white/80">
                            {agreement.counterParty.telegramUsername
                              ? agreement.counterParty.telegramUsername.startsWith(
                                  "0x",
                                )
                                ? `${agreement.counterParty.telegramUsername.slice(0, 6)}…${agreement.counterParty.telegramUsername.slice(-4)}`
                                : `@${agreement.counterParty.telegramUsername}`
                              : agreement.counterParty.wallet
                                ? `${agreement.counterParty.wallet.slice(0, 6)}…${agreement.counterParty.wallet.slice(-4)}`
                                : "Unknown User"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BentoCard>{" "}
        {/* ADD ESCROW DEALS SECTION */}
        <BentoCard
          title={`${user.handle}'s Escrow Deals`}
          icon={<FaHandshake />}
          color="cyan"
          count={escrowStats.total}
          scrollable
          maxHeight="260px"
        >
          {escrowAgreementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
              <span className="ml-2 text-cyan-300">
                Loading escrow deals...
              </span>
            </div>
          ) : escrowAgreementsError ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-red-300">
                Error loading escrow deals
              </div>
              <div className="text-sm text-white/50">
                {escrowAgreementsError.message}
              </div>
            </div>
          ) : escrowDeals.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No escrow deals yet
              </div>
              <div className="text-sm text-white/50">
                {isOwnProfile
                  ? "Your escrow-protected deals will appear here once you start trading."
                  : `${user.handle} has no escrow deals yet.`}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {escrowDeals.map((agreement: any) => {
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
                    onClick={() => handleEscrowClick(agreement.id)}
                    className="cursor-pointer rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className="truncate text-sm font-medium text-white/90">
                            {getAgreementTitle(agreement)}
                          </h4>
                          <div className="flex items-center gap-1">
                            <AgreementStatusBadge
                              status={agreement.status}
                              agreement={agreement}
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
                              {agreement.counterParty?.username
                                ? agreement.counterParty.username.startsWith(
                                    "0x",
                                  )
                                  ? `${agreement.counterParty.username.slice(0, 6)}…${agreement.counterParty.username.slice(-4)}`
                                  : `@${agreement.counterParty.username}`
                                : agreement.counterParty?.id
                                  ? `User ${agreement.counterParty.id}`
                                  : "Unknown User"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Recipient:</span>
                            <span className="text-white/80">
                              {agreement.firstParty?.username
                                ? agreement.firstParty.username.startsWith("0x")
                                  ? `${agreement.firstParty.username.slice(0, 6)}…${agreement.firstParty.username.slice(-4)}`
                                  : `@${agreement.firstParty.username}`
                                : agreement.firstParty?.id
                                  ? `User ${agreement.firstParty.id}`
                                  : "Unknown User"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Creator:</span>
                            <span className="text-white/80">
                              {agreement.creator?.username
                                ? agreement.creator.username.startsWith("0x")
                                  ? `${agreement.creator.username.slice(0, 6)}…${agreement.creator.username.slice(-4)}`
                                  : `@${agreement.creator.username}`
                                : agreement.creator?.id
                                  ? `User ${agreement.creator.id}`
                                  : "Unknown User"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="text-emerald-300">
                              {agreement.amount}{" "}
                              {agreement.tokenSymbol || "ETH"}
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
          )}
        </BentoCard>
      </section>
    </div>
  );
}
