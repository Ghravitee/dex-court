/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/UserProfile.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/apiService";

import type { User } from "../context/AuthContext";
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

// Add these components to UserProfile.tsx

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
// UserProfile.tsx - Update the mapApiUserToUser function
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

  return {
    id: apiUser.id.toString(),
    username: apiUser.username || "",
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
    handle: `@${apiUser.username || "user"}`,
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

  // Decode the URL parameter to handle spaces and special characters
  const decodedHandle = useMemo(() => {
    if (!handle) return "";
    // Decode URL-encoded characters (like %20 for spaces)
    return decodeURIComponent(handle);
  }, [handle]);

  // Check if this is the current user's profile
  const isOwnProfile = useMemo(() => {
    if (!currentUser || !decodedHandle) return false;

    // Clean the handle for comparison (remove @ symbol and handle URL encoding)
    const cleanHandle = decodedHandle.replace(/^@/, "");
    const cleanCurrentUsername = currentUser.username?.replace(/^@/, "") || "";

    // Check if handle matches current user's username
    return cleanHandle === cleanCurrentUsername;
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
                  <p>• Your profile: /profile/{currentUser?.username}</p>
                  <p>• Your profile by ID: /profile/{currentUser?.id}</p>
                  <p>
                    • Other users: /profile/[username] or /profile/[user-id]
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
  const safeStats = user.stats || {
    deals: 0,
    agreements: 0,
    disputes: 0,
    revenue: { "7d": 0, "30d": 0, "90d": 0 },
  };

  const safeRoles = user.roles || {
    judge: false,
    community: false,
    user: true,
  };

  const safeTrustScore = user.trustScore || 50;
  const safeJoinedDate =
    user.joinedDate || new Date().toISOString().split("T")[0];

  // Calculate rates safely to avoid division by zero
  const disputeRate =
    safeStats.deals > 0
      ? Math.round((safeStats.disputes / safeStats.deals) * 100)
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
            {user.handle}
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
              username={user.username}
              size="lg"
              className="h-14 w-14 border border-cyan-400/30"
              priority={true} // Profile pages get priority
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
                <div className="font-semibold text-white/90">{user.handle}</div>
                {user.wallet}
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
                  {safeStats.agreements}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disputes</span>
                <span className="font-semibold text-cyan-300">
                  {safeStats.disputes}
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
                <span className="font-semibold text-cyan-300">
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
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User's Disputes */}
        <BentoCard
          title={`${user.handle}'s Disputes`}
          icon={<FiAlertCircle />}
          color="cyan"
          count={safeStats.disputes}
          scrollable
          maxHeight="260px"
        >
          <div className="py-8 text-center">
            <div className="mb-2 text-lg text-cyan-300">
              {safeStats.disputes > 0
                ? `${safeStats.disputes} disputes`
                : "No disputes yet"}
            </div>
            <div className="text-sm text-white/50">
              {isOwnProfile
                ? "Your dispute cases will appear here"
                : `${user.handle}'s dispute history`}
            </div>
          </div>
        </BentoCard>

        {/* User's Public Agreements */}
        <BentoCard
          title={`${user.handle}'s Agreements`}
          icon={<FaHandshake />}
          color="cyan"
          count={safeStats.agreements}
          scrollable
          maxHeight="260px"
        >
          <div className="py-8 text-center">
            <div className="mb-2 text-lg text-cyan-300">
              {safeStats.agreements > 0
                ? `${safeStats.agreements} agreements`
                : "No agreements yet"}
            </div>
            <div className="text-sm text-white/50">
              {isOwnProfile
                ? "Create your first agreement to get started"
                : `${user.handle}'s agreement history`}
            </div>
          </div>
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
