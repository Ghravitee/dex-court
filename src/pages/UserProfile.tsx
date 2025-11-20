/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/UserProfile.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";

import type { User } from "../types/auth.types";
import { FaUser, FaHandshake } from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
import { Button } from "../components/ui/button";
import Judge from "../components/ui/svgcomponents/Judge";
import Community from "../components/ui/svgcomponents/Community";
import UserIcon from "../components/ui/svgcomponents/UserIcon";
import { BentoCard } from "./Profile";
import { LoginModal } from "../components/LoginModal";
import { UserAvatar } from "../components/UserAvatar";
import { usePublicAgreementsApi } from "../hooks/usePublicAgreementsApi";
import { useDisputesApi } from "../hooks/useDisputesApi"; // ADD THIS IMPORT
import type { AgreementSummaryDTO } from "../services/agreementServices"; // UPDATE IMPORT
import type { DisputeRow } from "../types"; // UPDATE IMPORT
import { Loader2, Wallet } from "lucide-react";

// Add AgreementStatusBadge component (same as in Profile)
const AgreementStatusBadge = ({ status }: { status: number }) => {
  const statusConfig = {
    1: {
      label: "Pending",
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
    },
    2: {
      label: "Signed",
      color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    },
    3: {
      label: "Completed",
      color: "bg-green-500/20 text-green-300 border-green-400/30",
    },
    4: {
      label: "Disputed",
      color: "bg-purple-800/20 text-purple-300 border-purple-800/30",
    },
    5: {
      label: "Cancelled",
      color: "bg-red-500/20 text-red-300 border-red-400/30",
    },
    6: {
      label: "Expired",
      color: "bg-orange-500/20 text-orange-300 border-orange-400/30",
    },
    7: {
      label: "Delivery Submitted",
      color: "bg-orange-500/20 text-orange-300 border-orange-400/30",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
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

// MiniTrust Component for UserProfile
function MiniTrust({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-28 w-28">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(rgba(16,185,129,.8) ${
            pct * 3.6
          }deg, rgba(244,63,94,.6) 0)`,
          filter: "drop-shadow(0 0 12px rgba(34,211,238,.25))",
        }}
      />
      <div className="absolute inset-1 grid place-items-center rounded-full bg-black/50 ring-1 ring-white/10">
        <div className="text-lg font-bold text-white">{pct}</div>
        <div className="text-[10px] text-cyan-300">Trust</div>
      </div>
    </div>
  );
}

// Helper function to convert API user to your User interface
// UserProfile.tsx - UPDATED TO PRIORITIZE TELEGRAM USERNAME
function mapApiUserToUser(apiUser: any): User {
  // Determine roles based on the role number from API
  const getRolesFromRoleNumber = (role: number) => {
    return {
      judge: role === 2 || role === 3,
      community: role === 1 || role === 3,
      user: true,
    };
  };

  // Calculate trust score based on verification and other factors
  const calculateTrustScore = (isVerified: boolean, role: number) => {
    let score = 50; // Base score
    if (isVerified) score += 20;
    if (role === 2 || role === 3) score += 15;
    if (role === 1 || role === 3) score += 10;
    return Math.min(score, 100);
  };

  const roles = getRolesFromRoleNumber(apiUser.role || 0);
  const trustScore = calculateTrustScore(apiUser.isVerified, apiUser.role || 0);

  const avatarUrl =
    apiUser.avatarId && apiUser.id
      ? `https://dev-api.dexcourt.com/accounts/${apiUser.id}/file/${apiUser.avatarId}`
      : undefined;

  // UPDATED: Use Telegram username as primary identifier
  const primaryUsername = apiUser.telegram?.username
    ? `@${apiUser.telegram.username}`
    : `@${apiUser.username || "user"}`;

  return {
    id: apiUser.id.toString(),
    username: apiUser.telegram?.username || apiUser.username || "", // Telegram username first
    bio: apiUser.bio || null,
    isVerified: apiUser.isVerified,
    telegram: apiUser.telegram
      ? {
          username: apiUser.telegram.username,
          id: apiUser.telegram.id,
        }
      : undefined,
    walletAddress: apiUser.walletAddress,
    role: apiUser.role || 0,
    avatarId: apiUser.avatarId || null,
    handle: primaryUsername, // Use Telegram username for display
    wallet: apiUser.walletAddress
      ? `${apiUser.walletAddress.slice(0, 6)}…${apiUser.walletAddress.slice(-4)}`
      : "Not connected",
    trustScore,
    roles,
    stats: {
      deals: 0,
      agreements: 0,
      disputes: 0,
      revenue: { "7d": 0, "30d": 0, "90d": 0 },
    },
    joinedDate: new Date().toISOString().split("T")[0],
    verified: apiUser.isVerified,
    avatarUrl: avatarUrl, // Use the correct URL pattern
  };
}

export default function UserProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { isAuthenticated, user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    agreements,
    agreementDetails,
    loading: agreementsLoading,
    error: agreementsError,
  } = usePublicAgreementsApi(user?.id);

  const {
    disputes,
    loading: disputesLoading,
    error: disputesError,
  } = useDisputesApi(user?.id);

  // Decode the URL parameter to handle spaces and special characters
  const decodedHandle = useMemo(() => {
    if (!handle) return "";
    // Decode URL-encoded characters (like %20 for spaces)
    return decodeURIComponent(handle);
  }, [handle]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get agreement title with fallbacks
  const getAgreementTitle = (agreement: AgreementSummaryDTO) => {
    const detailedAgreement = agreementDetails[agreement.id];
    if (detailedAgreement?.title) {
      return detailedAgreement.title;
    }
    if (agreement.title) {
      return agreement.title;
    }
    return `Agreement #${agreement.id}`;
  };

  // Handle agreement click to navigate to details
  const handleAgreementClick = (agreementId: number) => {
    navigate(`/agreements/${agreementId}`);
  };

  // ADD handle dispute click function
  const handleDisputeClick = (disputeId: string) => {
    navigate(`/disputes/${disputeId}`);
  };

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

  // Calculate agreement stats from real data
  const agreementStats = {
    total: agreements.length,
    active: agreements.filter((agreement) => agreement.status === 2).length,
    completed: agreements.filter((agreement) => agreement.status === 3).length,
    disputed: agreements.filter((agreement) => agreement.status === 4).length,
  };

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

  // Safe calculations for user stats
  const safeStats = user?.stats || {
    deals: 0,
    agreements: 0,
    disputes: disputeStats.total, // Use real dispute count from API
    revenue: { "7d": 0, "30d": 0, "90d": 0 },
  };

  const safeRoles = user?.roles || {
    judge: false,
    community: false,
    user: true,
  };

  const safeTrustScore = user?.trustScore || 50;
  const safeJoinedDate =
    user?.joinedDate || new Date().toISOString().split("T")[0];

  // Calculate rates safely to avoid division by zero
  const disputeRate =
    safeStats.deals > 0
      ? Math.round((disputeStats.total / safeStats.deals) * 100) // Use real dispute count
      : 0;

  const successRate =
    safeStats.deals > 0
      ? Math.round((safeStats.agreements / safeStats.deals) * 100)
      : 0;

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
        <div className="glass card-cyan flex justify-between rounded-2xl px-6 py-3 ring-1 ring-white/10">
          <div className="flex items-center gap-2">
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
              <MiniTrust score={safeTrustScore} />
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
        {/* User's Disputes - UPDATED WITH REAL DATA */}
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

        {/* User's Public Agreements - UPDATED WITH REAL DATA */}
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
          ) : agreements.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No public agreements yet
              </div>
              <div className="text-sm text-white/50">
                {isOwnProfile
                  ? "Your public agreements will appear here"
                  : `${user.handle} has no public agreements yet`}{" "}
                {/* Telegram username */}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {agreements.map((agreement) => (
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
                            @{agreement.firstParty.telegramUsername}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pink-300">Counter Party:</span>
                          <span className="text-white/80">
                            @{agreement.counterParty.telegramUsername}
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

        {/* Trust Assessment */}
        <BentoCard
          title="Trust Assessment"
          icon={<RiShieldCheckFill />}
          color="cyan"
          scrollable
          maxHeight="260px"
        >
          <div className="space-y-3 p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Trust Score</span>
              <span className="font-semibold text-cyan-300">
                {safeTrustScore}/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dispute Rate</span>
              <span
                className={`font-semibold ${disputeRate > 10 ? "text-rose-300" : "text-emerald-300"}`}
              >
                {disputeRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Success Rate</span>
              <span className="font-semibold text-emerald-300">
                {successRate}%
              </span>
            </div>
            <div className="pt-2 text-center text-xs text-white/50">
              Based on {safeStats.deals} completed deals
            </div>
          </div>
        </BentoCard>
      </section>
    </div>
  );
}
