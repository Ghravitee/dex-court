/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { FaUser, FaInstagram, FaHandshake, FaEdit } from "react-icons/fa";
import { FaXTwitter, FaTiktok } from "react-icons/fa6";
import { VscVerifiedFilled } from "react-icons/vsc";
import { FiSend, FiAlertCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
import { Button } from "../components/ui/button";
import Judge from "../components/ui/svgcomponents/Judge";
import Community from "../components/ui/svgcomponents/Community";
import User from "../components/ui/svgcomponents/UserIcon";
import { useAuth } from "../context/AuthContext";
import { LoginModal } from "../components/LoginModal";
import { useAccountUpdate, useAvatarUpload } from "../hooks/useAccountApi";
import type { AccountUpdateRequest } from "../services/apiService";
import { UserAvatar } from "../components/UserAvatar";
import { Loader2, UploadCloud } from "lucide-react";

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
    username: user?.username || "",
    bio: user?.bio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      username: formData.username?.replace("@", "") || undefined,
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
            <label className="mb-2 block text-sm text-white/70">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              className="w-full rounded-md border border-cyan-400/30 bg-black/20 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
              placeholder="Enter username"
            />
          </div>
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

// Update the MiniTrust component to handle undefined roles
function MiniTrust({
  score,
  roles = { judge: false, community: false, user: true },
}: {
  score: number;
  roles?: { judge: boolean; community: boolean; user: boolean };
}) {
  const pct = Math.max(0, Math.min(100, score));

  const getTrustBreakdown = () => {
    // Ensure roles is defined
    const safeRoles = roles || { judge: false, community: false, user: true };

    let breakdown = "Base Score: 50";
    if (safeRoles.judge) breakdown += " + Judge Bonus: 15";
    if (safeRoles.community) breakdown += " + Community Bonus: 10";
    if (!safeRoles.judge && !safeRoles.community)
      breakdown += " (No role bonuses)";
    return breakdown;
  };

  return (
    <Tooltip content={getTrustBreakdown()}>
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
    </Tooltip>
  );
}

// Add the BentoCard component here since it's used in this file
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
    cyan: "from-cyan-500/20 border-cyan-400/30 text-cyan-200",
    emerald: "from-emerald-500/20 border-emerald-400/30 text-emerald-200",
    rose: "from-rose-500/20 border-rose-400/30 text-rose-200",
  };

  return (
    <div
      className={`glass rounded-2xl border p-6 ring-1 ring-white/10 ${colorMap[color]} flex flex-col justify-between bg-gradient-to-br to-transparent`}
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

export default function Profile() {
  const { isAuthenticated, logout, user, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);

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

  // Use the API hooks
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

  const closeToaster = () => {
    setToaster((prev) => ({ ...prev, isVisible: false }));
  };

  // Use actual user data from context
  const handle = user?.handle || "@you";
  const wallet = user?.wallet || "0xABCD…1234";
  const score = user?.trustScore || 72;
  const roles = user?.roles || { judge: false, community: false, user: true };
  const isVerified = user?.isVerified || false;

  // Use real stats from user context - these will be empty initially until API provides data
  const stats = user?.stats || {
    deals: 0,
    agreements: 0,
    disputes: 0,
    revenue: { "7d": 0, "30d": 0, "90d": 0 },
  };

  const handleUpdate = async (updateData: AccountUpdateRequest) => {
    await updateAccount(updateData);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleLogin = async () => {
    // You'll need to implement the OTP logic here
    // For now, we'll use a mock implementation
    try {
      await login("mock-otp"); // Replace with actual OTP logic
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  console.log("🔐 User data:", user);

  const [otp, setOtp] = useState("");
  const [loading] = useState(false);

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
        <Button
          onClick={() => setShowProfileUpdateModal(true)}
          className="flex items-center gap-2 border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
        >
          <FaEdit className="h-4 w-4" />
          Edit Profile
        </Button>
      </header>

      {/* ===== Top Summary Section ===== */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="space-y-4">
          <div className="glass card-cyan row-span-1 flex h-fit flex-col justify-between rounded-2xl px-6 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <UserAvatar
                  userId={user?.id || "unknown"}
                  avatarId={user?.avatarId || null}
                  username={user?.username || "user"}
                  size="lg" // Use the new xl size
                  className="h-14 w-14 border border-cyan-400/30"
                  priority={true} // Important avatar, load eagerly
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
                  <RoleBadge
                    role={roles?.judge || false}
                    icon={<Judge />}
                    tooltip="Certified Judge - You can participate in dispute resolution"
                  />
                  <RoleBadge
                    role={roles?.community || false}
                    icon={<Community />}
                    tooltip="Community Member - Active participant in the DexCourt ecosystem"
                  />
                  <RoleBadge
                    role={
                      (roles?.user || false) &&
                      !(roles?.judge || false) &&
                      !(roles?.community || false)
                    }
                    icon={<User />}
                    tooltip="Basic User - Welcome to DexCourt!"
                  />
                </div>
                <div className="text-muted-foreground mt-2 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-white/90">
                    {handle}
                    {isVerified && <VerificationBadge />}
                  </div>
                  <div>{wallet}</div>
                </div>
              </div>

              <div className="self-center">
                <MiniTrust score={score} roles={roles} />
              </div>
            </div>
          </div>

          {/* Verifications Section */}
          <section className="glass card-cyan h-fit rounded-2xl p-4 lg:p-6">
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
                  {isAuthenticated ? (
                    <>
                      {/* {user?.isVerified ? <VerificationBadge /> : "Connect"} */}

                      <Button
                        onClick={logout}
                        variant="ghost"
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setShowLoginModal(true)}
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Connect
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
          <div className="glass flex flex-col justify-between rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-transparent p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)] ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,211,238,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white/90">
                Revenue Earned
              </h3>
            </div>

            <div className="space-y-3 text-lg">
              {Object.entries(stats.revenue).map(([period, amount]) => (
                <div key={period} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {period.toUpperCase()}
                  </span>
                  <span className="text-xl font-semibold text-cyan-300">
                    ${amount.toLocaleString()}
                  </span>
                </div>
              ))}
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
        </div>

        {/* Judged Disputes & Reputation */}
        <div className="flex flex-col gap-4">
          {/* Show Judged Disputes only for judges */}
          {roles.judge && (
            <section className="glass rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
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

          {/* Show Community Stats for community members */}
          {roles.community && !roles.judge && (
            <section className="glass rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-transparent p-6">
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

          {/* Show welcome for basic users */}
          {roles.user && !roles.judge && !roles.community && (
            <section className="glass rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
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
                {roles.judge
                  ? "Judge Reputation"
                  : roles.community
                    ? "Community Reputation"
                    : "Building Reputation"}
              </div>
              <div className="text-sm text-white/50">
                {roles.judge
                  ? "Your reputation as a judge will grow with each fair dispute resolution."
                  : roles.community
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
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        {/* My Disputes */}
        <BentoCard
          title="My Disputes"
          icon={<FiAlertCircle />}
          color="cyan"
          count={0}
          scrollable
          maxHeight="260px"
        >
          <div className="py-8 text-center">
            <div className="mb-2 text-lg text-cyan-300">No disputes yet</div>
            <div className="text-sm text-white/50">
              Your dispute cases will appear here when you're involved in
              disagreements.
            </div>
          </div>
        </BentoCard>

        {/* My Agreements */}
        <BentoCard
          title="My Agreements"
          icon={<FaHandshake />}
          color="cyan"
          count={0}
          scrollable
          maxHeight="260px"
        >
          <div className="py-8 text-center">
            <div className="mb-2 text-lg text-cyan-300">No agreements yet</div>
            <div className="text-sm text-white/50">
              Create your first agreement to get started with secure deals.
            </div>
          </div>
        </BentoCard>

        {/* Escrow Deals */}
        <BentoCard
          title="Escrow Deals"
          icon={<FaHandshake />}
          color="cyan"
          count={0}
          scrollable
          maxHeight="260px"
        >
          <div className="py-8 text-center">
            <div className="mb-2 text-lg text-cyan-300">
              No escrow deals yet
            </div>
            <div className="text-sm text-white/50">
              Your escrow-protected deals will appear here once you start
              trading.
            </div>
          </div>
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
    </div>
  );
}
