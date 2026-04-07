/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { FaUser, FaHandshake } from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { LoginModal } from "../../components/LoginModal";
import { useDisputes } from "../../hooks/useDisputes";
import { useProfileAgreements } from "../..//hooks/useProfileAgreements";
import useTrustScore from "../../hooks/useTrustScore";
import { BentoCard } from "../profile/components/BentoCard";

// Components
import { UserProfileHeader } from "./components/UserProfileHeader";
import { StatsCards } from "./components/StatsCards";
import { AgreementStatusBadge } from "./components/AgreementStatusBadge";
import { DisputeStatusBadge } from "./components/DisputeStatusBadge";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";

// Hooks
import { useUserLoader } from "./hooks/useUserLoader";
import { useRoleLogic } from "./hooks/useRoleLogic";

// Utils
import {
  formatDate,
  formatDisputeParty,
  formatHandle,
  formatPartyUsername,
} from "./utils/formatters";

export default function UserProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const decodedHandle = useMemo(() => {
    if (!handle) return "";
    return decodeURIComponent(handle);
  }, [handle]);

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

  const {
    data: user,
    isLoading: loading,
    error: userError,
    refetch,
  } = useUserLoader(decodedHandle, isOwnProfile);

  const error = userError ? (userError as Error).message : null;

  const { trustScore, loading: trustScoreLoading } = useTrustScore(
    user?.id || null,
  );
  const { getUserRoleInAgreement, getUserRoleInDispute } = useRoleLogic();

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
  } = useProfileAgreements(user?.id, user?.walletAddress);

  const {
    disputes,
    loading: disputesLoading,
    error: disputesError,
    hasMore: hasMoreDisputes,
    totalUserDisputes,
    loadMore: loadMoreDisputes,
  } = useDisputes(user?.id);

  const agreementStats = useMemo(() => {
    return {
      total: totalReputationalAgreements,
      active: reputationalDisplay.filter(
        (agreement): any => agreement.status === 2,
      ).length,
      completed: reputationalDisplay.filter(
        (agreement): any => agreement.status === 3,
      ).length,
      disputed: reputationalDisplay.filter(
        (agreement): any => agreement.status === 4,
      ).length,
    };
  }, [reputationalDisplay, totalReputationalAgreements]);

  const escrowStats = useMemo(() => {
    return {
      total: totalEscrowAgreements,
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
    }),
    [disputes, totalUserDisputes],
  );

  const totalVolume = useMemo(() => {
    if (!user?.stats?.revenue) return 0;
    return Object.values(user.stats.revenue).reduce((a, b) => a + b, 0);
  }, [user]);

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

  const handleDisputeClick = useCallback(
    (disputeId: string) => {
      navigate(`/disputes/${disputeId}`);
    },
    [navigate],
  );

  const getUserRoleInEscrowDeal = useCallback(
    (agreement: any) => {
      return getUserRoleInAgreement(
        agreement,
        user?.id?.toString(),
        user?.walletAddress?.toLowerCase(),
        true,
      );
    },
    [user?.id, user?.walletAddress, getUserRoleInAgreement],
  );

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
    return <LoadingState handle={decodedHandle} />;
  }

  if (error || !user) {
    return (
      <ErrorState
        error={error || "User not found"}
        handle={decodedHandle}
        onRetry={() => refetch()}
        onGoToMyProfile={() => navigate("/profile")}
      />
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
            Joined {new Date(user.joinedDate).toLocaleDateString()}
          </div>
          {user.bio && (
            <div className="mt-2 max-w-md text-white/70">{user.bio}</div>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <UserProfileHeader
          user={user}
          trustScore={trustScore}
          trustScoreLoading={trustScoreLoading}
          isOwnProfile={isOwnProfile}
        />

        <StatsCards
          agreementStats={agreementStats}
          escrowStats={escrowStats}
          disputeStats={disputeStats}
          isOwnProfile={isOwnProfile}
          totalVolume={totalVolume}
          activeDeals={user.stats.deals}
        />
      </section>

      <section className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
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
                {isOwnProfile
                  ? "Your dispute cases will appear here when you're involved in disagreements."
                  : `${formatHandle(user.handle)} has not been involved in any disputes yet.`}
              </div>
            </div>
          ) : (
            <>
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
                                getUserRoleInDispute(dispute, user.id) ===
                                "Plaintiff"
                                  ? "text-blue-300"
                                  : getUserRoleInDispute(dispute, user.id) ===
                                      "Defendant"
                                    ? "text-pink-300"
                                    : "text-cyan-300"
                              }
                            >
                              {getUserRoleInDispute(dispute, user.id)}
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
                    {disputesLoading ? "Loading..." : "Load More Disputes"}
                  </Button>
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
                {isOwnProfile
                  ? "Your reputational agreements will appear here. Escrow-protected deals are shown separately."
                  : `${formatHandle(user.handle)} has no reputational agreements yet. Check their escrow deals for secured agreements.`}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-white/70">
                Showing {reputationalDisplay.length} of{" "}
                {totalReputationalAgreements} agreements
              </div>
              <div className="space-y-3">
                {reputationalDisplay.map((agreement) => {
                  const userRole = getUserRoleInAgreement(
                    agreement,
                    user.id?.toString(),
                    user.walletAddress?.toLowerCase(),
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
                                {formatPartyUsername(
                                  agreement.firstParty?.telegramUsername,
                                  agreement.firstParty?.wallet,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-pink-300">
                                Counter Party:
                              </span>
                              <span className="text-white/80">
                                {formatPartyUsername(
                                  agreement.counterParty?.telegramUsername,
                                  agreement.counterParty?.wallet,
                                )}
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
                {isOwnProfile
                  ? "Your escrow-protected deals will appear here once you start trading."
                  : `${formatHandle(user.handle)} has no escrow deals yet.`}
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
    </div>
  );
}
