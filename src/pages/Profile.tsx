/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaUser,
  FaInstagram,
  FaHandshake,
  FaEdit,
  FaCrown,
} from "react-icons/fa";
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
import { useAgreementsApi } from "../hooks/useAgreementsApi";
import type { AgreementSummaryDTO } from "../services/agreementServices";
import { useNavigate } from "react-router-dom";
import { useDisputesApi } from "../hooks/useDisputesApi";
import type { DisputeRow } from "../types";
import { WalletLinkingModal } from "../components/WalletLinkingModal";
import TrustMeter from "../components/TrustMeter";
import useTrustScore from "../hooks/useTrustScore";

// Add AgreementStatusBadge component
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

// Profile Update Modal Component - REMOVED USERNAME FIELD
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
          {/* REMOVED USERNAME FIELD */}
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
// Role Badge Component - UPDATED WITH ADMIN
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

  const {
    agreements,
    agreementDetails,
    loading: agreementsLoading,
    error: agreementsError,
  } = useAgreementsApi();
  const {
    disputes,
    loading: disputesLoading,
    error: disputesError,
  } = useDisputesApi(user?.id?.toString() || "");
  // const { updateAccount, updating } = useAccountUpdate();
  // const { uploadAvatar, uploading } = useAvatarUpload();
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

  // Memoized agreement stats calculation
  const agreementStats = useMemo(
    () => ({
      total: agreements.length,
      active: agreements.filter((agreement) => agreement.status === 2).length,
      completed: agreements.filter((agreement) => agreement.status === 3)
        .length,
      disputed: agreements.filter((agreement) => agreement.status === 4).length,
    }),
    [agreements],
  );

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
    }),
    [disputes],
  );

  const getUserRoleInDispute = useCallback(
    (dispute: DisputeRow) => {
      const userId = user?.id?.toString();
      if (!userId) return "Unknown";

      if (dispute.plaintiffData?.userId === userId) return "Plaintiff";
      if (dispute.defendantData?.userId === userId) return "Defendant";

      // Check if user is a witness - handle different witness structures safely
      let isPlaintiffWitness = false;
      let isDefendantWitness = false;

      if (dispute.witnesses) {
        if (
          typeof dispute.witnesses === "object" &&
          !Array.isArray(dispute.witnesses)
        ) {
          // Handle object structure { plaintiff: [], defendant: [] }
          isPlaintiffWitness = (dispute.witnesses.plaintiff || []).some(
            (w: any) => w.id?.toString() === userId,
          );
          isDefendantWitness = (dispute.witnesses.defendant || []).some(
            (w: any) => w.id?.toString() === userId,
          );
        } else if (Array.isArray(dispute.witnesses)) {
          // Handle array structure
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

  // Dispute Status Badge Component
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

  // Memoized user data - UPDATED TO USE TELEGRAM USERNAME
  // In the Profile component, replace the userData memo with this:

  // Memoized user data - UPDATED TO HANDLE BOTH TELEGRAM AND WALLET ADDRESSES
  const userData = useMemo(() => {
    // Helper function to format handle based on type
    const formatHandle = (user: any) => {
      // If user has Telegram username, use it with @
      if (user?.telegram?.username) {
        return `@${user.telegram.username}`;
      }

      // If user has wallet address, truncate it
      if (user?.walletAddress) {
        return `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`;
      }

      // If user has regular username, use it with @
      if (user?.username) {
        return `@${user.username}`;
      }

      // Fallback
      return "@you";
    };

    // Helper function to format wallet display
    const formatWallet = (user: any) => {
      if (user?.walletAddress) {
        return `${user.walletAddress.slice(0, 8)}…${user.walletAddress.slice(-6)}`;
      }
      return "Not connected";
    };

    return {
      // Use the formatted handle that works for both Telegram and wallet
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

  // Format date for display - memoized callback
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Check if user is involved in agreement as first party or counter party - memoized
  const getUserRoleInAgreement = useCallback(
    (agreement: AgreementSummaryDTO) => {
      const userId = user?.id;
      if (!userId) return "Unknown";

      // Convert both to numbers for comparison to ensure type safety
      const userIdNum = Number(userId);
      const firstPartyId = Number(agreement.firstParty.id);
      const counterPartyId = Number(agreement.counterParty.id);

      if (firstPartyId === userIdNum) return "First Party";
      if (counterPartyId === userIdNum) return "Counter Party";
      return "Creator"; // Assuming creator is different from parties
    },
    [user?.id],
  );

  // Helper function to get agreement title with fallbacks - memoized
  const getAgreementTitle = useCallback(
    (agreement: AgreementSummaryDTO) => {
      // First try to get title from detailed agreement data
      const detailedAgreement = agreementDetails[agreement.id];
      if (detailedAgreement?.title) {
        return detailedAgreement.title;
      }

      // Fallback to summary title if available
      if (agreement.title) {
        return agreement.title;
      }

      // Final fallback
      return `Agreement #${agreement.id}`;
    },
    [agreementDetails],
  );

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

  // Show toaster when success or error occurs - optimized with proper dependencies
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

  const handleAgreementClick = useCallback(
    (agreementId: number) => {
      navigate(`/agreements/${agreementId}`);
    },
    [navigate],
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
          {/* <Button
            onClick={logout}
            variant="outline"
            className="border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          >
            Logout
          </Button> */}
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
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="space-y-4">
          <div className="glass card-cyan row-span-1 flex h-fit flex-col justify-between rounded-2xl px-6 py-3 ring-1 ring-white/10">
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
                    icon={<FaCrown className="h-4 w-4 text-yellow-400" />}
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
          <div className="glass flex flex-col justify-between rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-transparent p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)] ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,211,238,0.35)]">
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
        </div>

        {/* Judged Disputes & Reputation */}
        <div className="flex flex-col gap-4">
          {/* Show Judged Disputes only for judges */}
          {/* Show Admin Panel Access for admins */}
          {userData.roles.admin && (
            <section className="glass rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white/90">
                Administrator Access
              </h3>
              <div className="py-6 text-center">
                <div className="mb-3 flex justify-center">
                  <FaCrown className="h-8 w-8 text-yellow-400" />
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

          {/* Show Community Stats for community members (and not admins/judges) */}
          {userData.roles.community &&
            !userData.roles.judge &&
            !userData.roles.admin && (
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

          {/* Show welcome for basic users (no special roles) */}
          {userData.roles.user &&
            !userData.roles.admin &&
            !userData.roles.judge &&
            !userData.roles.community && (
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
      <section className="mt-6 grid gap-6 md:grid-cols-3">
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
          ) : agreements.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-lg text-cyan-300">
                No agreements yet
              </div>
              <div className="text-sm text-white/50">
                Create your first agreement to get started with secure deals.
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
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className="truncate text-sm font-medium text-white/90">
                          {getAgreementTitle(agreement)}
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
                            {agreement.firstParty.telegramUsername
                              ? `@${agreement.firstParty.telegramUsername}`
                              : agreement.firstParty.wallet
                                ? `${agreement.firstParty.wallet.slice(0, 6)}…${agreement.firstParty.wallet.slice(-4)}`
                                : "Unknown User"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Counter Party:</span>
                          <span className="text-white/80">
                            {agreement.counterParty.telegramUsername
                              ? `@${agreement.counterParty.telegramUsername}`
                              : agreement.counterParty.wallet
                                ? `${agreement.counterParty.wallet.slice(0, 6)}…${agreement.counterParty.wallet.slice(-4)}`
                                : "Unknown User"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Your Role:</span>
                          <span
                            className={
                              getUserRoleInAgreement(agreement) ===
                              "First Party"
                                ? "text-blue-300"
                                : getUserRoleInAgreement(agreement) ===
                                    "Counter Party"
                                  ? "text-pink-300"
                                  : "text-purple-300"
                            }
                          >
                            {getUserRoleInAgreement(agreement)}
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
