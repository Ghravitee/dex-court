/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { FaUser, FaHandshake } from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { LoginModal } from "../../components/LoginModal";
import { useAccountUpdate, useAvatarUpload } from "../../hooks/useAccountApi";
import type { AccountUpdateRequest } from "../../services/apiService";
import { useNavigate } from "react-router-dom";
import { useDisputesApi } from "../../hooks/useDisputesApi";
import type { DisputeRow } from "../../types";
import { WalletLinkingModal } from "../../components/WalletLinkingModal";
import useTrustScore from "../../hooks/useTrustScore";
import { useReputationHistory } from "../../hooks/useReputation";
import { useProfileAgreementsApi } from "../../hooks/useProfileAgreementsApi";

// Components
import { Toaster } from "./components/Toaster";
import { ProfileHeader } from "./components/ProfileHeader";
import { RevenueStats } from "./components/RevenueStats";
import { VerificationSection } from "./components/VerificationSection";
import { RoleSection } from "./components/RoleSection";
import { ReputationHistory } from "./components/ReputationHistory";
import { BentoCard } from "./components/BentoCard";
import { ProfileUpdateModal } from "./components/ProfileUpdateModal";
import { DisputeStatusBadge } from "./components/DisputeStatusBadge";
import { AgreementStatusBadge } from "./components/AgreementStatusBadge";

// Hooks
import { useUserData } from "./hooks/useUserData";
import { useRoleLogic } from "./hooks/useRoleLogic";

// Utils
import {
  formatDate,
  formatParty,
  formatShortWallet,
  formatUsername,
} from "./utils/formatters";

export default function Profile() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();

  // State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState<{
    type: "telegram" | "wallet";
    open: boolean;
  }>({ type: "telegram", open: false });
  const [toaster, setToaster] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [otp, setOtp] = useState("");
  const [loading] = useState(false);

  // Hooks
  const { trustScore, loading: trustScoreLoading } = useTrustScore(
    user?.id?.toString() || null,
  );
  const {
    data: reputationHistory,
    loading: reputationLoading,
    error: reputationError,
    loadingMore: reputationLoadingMore,
    loadMoreHistory,
  } = useReputationHistory(user?.id?.toString() || null);
  const {
    disputes,
    loading: disputesLoading,
    error: disputesError,
    hasMore,
    totalUserDisputes,
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

  // Custom hooks
  const userData = useUserData(user, trustScore);
  const { getUserRoleInAgreement, getUserRoleInDispute } = useRoleLogic();

  // Memoized stats
  const agreementStats = useMemo(() => {
    return {
      total: totalReputationalAgreements,
      active: reputationalDisplay.filter(
        (agreement: any) => agreement.status === 2,
      ).length,
      completed: reputationalDisplay.filter(
        (agreement: any) => agreement.status === 3,
      ).length,
      disputed: reputationalDisplay.filter(
        (agreement: any) => agreement.status === 4,
      ).length,
    };
  }, [reputationalDisplay, totalReputationalAgreements]);

  const escrowStats = useMemo(() => {
    return {
      total: totalEscrowAgreements,
      active: escrowDisplay.filter(
        (agreement: any) => agreement.statusNumber === 2,
      ).length,
      completed: escrowDisplay.filter(
        (agreement: any) => agreement.statusNumber === 3,
      ).length,
      disputed: escrowDisplay.filter(
        (agreement: any) => agreement.statusNumber === 4,
      ).length,
      pending: escrowDisplay.filter(
        (agreement: any) => agreement.statusNumber === 1,
      ).length,
      pending_approval: escrowDisplay.filter(
        (agreement: any) => agreement.statusNumber === 7,
      ).length,
      expired: escrowDisplay.filter(
        (agreement: any) => agreement.statusNumber === 6,
      ).length,
      cancelled: escrowDisplay.filter(
        (agreement: any) => agreement.statusNumber === 5,
      ).length,
    };
  }, [escrowDisplay, totalEscrowAgreements]);

  const disputesStats = useMemo(
    () => ({
      total: totalUserDisputes,
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
    [disputes, totalUserDisputes],
  );

  // Handlers
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

  const handleDisputeClick = useCallback(
    (disputeId: string) => {
      navigate(`/disputes/${disputeId}`);
    },
    [navigate],
  );

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

  const handleLogin = useCallback(async () => {
    try {
      await login("mock-otp");
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, [login]);

  const closeToaster = useCallback(() => {
    setToaster((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Effects for toaster
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

  // Debug logs
  useEffect(() => {
    if (user) {
      console.log("🔐 User data:", user);
    }
  }, [user]);

  // Not authenticated view
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
      <Toaster
        message={toaster.message}
        type={toaster.type}
        isVisible={toaster.isVisible}
        onClose={closeToaster}
      />

      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white/90">Profile</h2>
      </header>

      {/* Top Summary Section */}
      <section className="mx-auto w-full max-w-7xl py-6">
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {/* Responsive 3-column layout that stacks on mobile */}
          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
            {/* Profile Summary */}
            <div className="space-y-6">
              <ProfileHeader
                user={user}
                userData={userData}
                trustScore={trustScore}
                trustScoreLoading={trustScoreLoading}
                uploading={uploading}
                onAvatarChange={handleAvatarChange}
                onEditProfile={() => setShowProfileUpdateModal(true)}
              />

              <VerificationSection
                user={user}
                onLinkTelegram={() =>
                  setShowLinkModal({ type: "telegram", open: true })
                }
                onLinkWallet={() =>
                  setShowLinkModal({ type: "wallet", open: true })
                }
              />
            </div>

            {/* Revenue Stats */}
            <div>
              <RevenueStats revenue={userData.stats.revenue} />
            </div>

            {/* Role Section and Reputation combined */}
            <div className="space-y-6">
              <RoleSection roles={userData.roles} />

              <BentoCard
                title="My Reputation History"
                icon={<RiShieldCheckFill />}
                color="cyan"
                count={reputationHistory?.total || 0}
                scrollable
                maxHeight="330px"
              >
                <ReputationHistory
                  reputationHistory={reputationHistory}
                  loading={reputationLoading}
                  error={reputationError}
                  loadingMore={reputationLoadingMore}
                  userRoles={userData.roles}
                  onLoadMore={loadMoreHistory}
                  onViewEvent={handleAgreementClick}
                />
              </BentoCard>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
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
          {disputesLoading && disputes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-300"></div>
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
              <div className="mb-4 text-sm text-white/70">
                Showing {disputes.length} of {totalUserDisputes} disputes
              </div>
              <div className="space-y-3">
                {disputes.map((dispute: DisputeRow) => (
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
                              {formatParty(dispute.plaintiff)} vs{" "}
                              {formatParty(dispute.defendant)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your Role:</span>
                            <span
                              className={
                                getUserRoleInDispute(
                                  dispute,
                                  user?.id?.toString(),
                                ) === "Plaintiff"
                                  ? "text-blue-300"
                                  : getUserRoleInDispute(
                                        dispute,
                                        user?.id?.toString(),
                                      ) === "Defendant"
                                    ? "text-pink-300"
                                    : "text-cyan-300"
                              }
                            >
                              {getUserRoleInDispute(
                                dispute,
                                user?.id?.toString(),
                              )}
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
                <div className="mt-4 flex flex-col items-center">
                  <div className="mb-2 text-sm text-white/60">
                    Showing {disputes.length} of {totalUserDisputes} disputes
                  </div>
                  <Button
                    onClick={loadMore}
                    disabled={disputesLoading}
                    className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                    size="sm"
                  >
                    {disputesLoading ? "Loading..." : "Load More Disputes"}
                  </Button>
                </div>
              )}
            </>
          )}
        </BentoCard>

        {/* My Agreements */}
        <BentoCard
          title="My Agreements"
          icon={<FaHandshake />}
          color="cyan"
          count={agreementStats.total}
          scrollable
          maxHeight="260px"
        >
          {agreementsLoading && reputationalDisplay.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-300"></div>
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
                Create your first reputational agreement to get started.
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-white/70">
                Showing {reputationalDisplay.length} of{" "}
                {totalReputationalAgreements} agreements
              </div>
              <div className="space-y-3">
                {reputationalDisplay.map((agreement: any) => {
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
                                  ? formatUsername(
                                      agreement.firstParty.telegramUsername,
                                    )
                                  : agreement.firstParty?.wallet
                                    ? formatShortWallet(
                                        agreement.firstParty.wallet,
                                      )
                                    : "Unknown User"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Counter Party:</span>
                              <span className="text-white/80">
                                {agreement.counterParty?.telegramUsername
                                  ? formatUsername(
                                      agreement.counterParty.telegramUsername,
                                    )
                                  : agreement.counterParty?.wallet
                                    ? formatShortWallet(
                                        agreement.counterParty.wallet,
                                      )
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
                    {agreementsLoading ? "Loading..." : "Load More Agreements"}
                  </Button>
                </div>
              )}
            </>
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
          {agreementsLoading && escrowDisplay.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-300"></div>
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
                Your escrow-protected deals will appear here once you start
                trading.
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-white/70">
                Showing {escrowDisplay.length} of {totalEscrowAgreements} escrow
                deals
              </div>
              <div className="space-y-3">
                {escrowDisplay.map((agreement: any) => {
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
                    {agreementsLoading
                      ? "Loading..."
                      : "Load More Escrow Deals"}
                  </Button>
                </div>
              )}
            </>
          )}
        </BentoCard>
      </section>

      {/* Modals */}
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

      {/* OTP Login Modal */}
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
  );
}
