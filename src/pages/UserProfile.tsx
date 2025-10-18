// pages/UserProfile.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserByHandle, type User } from "../lib/mockUsers";
import { FaUser, FaHandshake, FaFlag } from "react-icons/fa";
import { FiAlertCircle, FiMessageCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
import { Button } from "../components/ui/button";
import Judge from "../components/ui/svgcomponents/Judge";
import Community from "../components/ui/svgcomponents/Community";
import UserIcon from "../components/ui/svgcomponents/UserIcon";
import { MiniTrust } from "../components/MiniTrust";
import { BentoCard } from "./Profile";
import { LoginModal } from "../components/LoginModal";

export default function UserProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { isAuthenticated, user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isOwnProfile = currentUser?.handle === user?.handle;

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const cleanHandle = handle?.startsWith("@") ? handle.slice(1) : handle;
        const userData = await getUserByHandle(`@${cleanHandle}`);
        setUser(userData || null);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (handle && isAuthenticated) {
      loadUserData();
    }
  }, [handle, isAuthenticated]);

  // Calculate total volume safely
  const totalVolume = user
    ? Object.values(user.stats.revenue).reduce(
        (total: number, amount: number) => total + amount,
        0,
      )
    : 0;

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

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-2xl text-white/70">User Not Found</div>
          <div className="text-white/50">
            User {handle} doesn't exist or has been removed.
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
            {user.handle}
            {user.verified && (
              <span className="ml-2 rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                Verified
              </span>
            )}
          </h2>
          <div className="text-muted-foreground mt-1 text-sm">
            Joined {new Date(user.joinedDate).toLocaleDateString()}
          </div>
        </div>

        <div className="flex gap-3">
          {!isOwnProfile && (
            <>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
              >
                <FiMessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
              >
                <FaFlag className="h-4 w-4" />
                Report
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Profile Summary */}
      <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <div className="glass card-cyan flex justify-between rounded-2xl px-6 py-3 ring-1 ring-white/10">
          <div className="flex items-center gap-2">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
              <FaUser className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {user.roles.judge && <Judge />}
                {user.roles.community && <Community />}
                {user.roles.user && <UserIcon />}
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                <div className="font-semibold text-white/90">{user.handle}</div>
                {user.wallet}
              </div>
            </div>
            <div className="self-center">
              <MiniTrust score={user.trustScore} />
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
                  {user.stats.deals}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agreements</span>
                <span className="font-semibold text-cyan-300">
                  {user.stats.agreements}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disputes</span>
                <span className="font-semibold text-cyan-300">
                  {user.stats.disputes}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Volume (Limited for others) */}
        <div className="space-y-4">
          <div className="glass flex flex-col justify-between rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-transparent p-6">
            <h3 className="mb-4 text-lg font-semibold text-white/90">
              Trading Volume
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-semibold text-cyan-300">
                  ${totalVolume.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Deals</span>
                <span className="font-semibold text-cyan-300">3</span>
              </div>
              <div className="pt-2 text-center text-xs text-white/50">
                Detailed revenue visible only to profile owner
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
          count={user.stats.disputes}
          scrollable
          maxHeight="260px"
        >
          <div className="py-4 text-center text-white/50">
            Dispute history coming soon
          </div>
        </BentoCard>

        {/* User's Public Agreements */}
        <BentoCard
          title={`${user.handle}'s Agreements`}
          icon={<FaHandshake />}
          color="cyan"
          count={user.stats.agreements}
          scrollable
          maxHeight="260px"
        >
          <div className="py-4 text-center text-white/50">
            Agreement history coming soon
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
                {user.trustScore}/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dispute Rate</span>
              <span className="font-semibold text-emerald-300">
                {Math.round((user.stats.disputes / user.stats.deals) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Success Rate</span>
              <span className="font-semibold text-emerald-300">
                {Math.round((user.stats.agreements / user.stats.deals) * 100)}%
              </span>
            </div>
            <div className="pt-2 text-center text-xs text-white/50">
              Based on {user.stats.deals} completed deals
            </div>
          </div>
        </BentoCard>
      </section>
    </div>
  );
}
