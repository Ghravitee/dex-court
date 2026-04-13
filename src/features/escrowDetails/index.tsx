/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
  Globe,
  Lock,
  Package,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Ban,
  Upload,
  Wallet,
  Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { UserAvatar } from "../../components/UserAvatar";
import { VscVerifiedFilled } from "react-icons/vsc";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import EvidenceViewer from "../../components/disputes/modals/EvidenceViewer";
import { EvidenceDisplay } from "../../components/disputes/EvidenceDisplay";
import EscrowPendingDisputeModal from "../../components/EscrowPendingDisputeModal";
import { MilestoneTableRow } from "../../web3/MilestoneTableRow";
import { CountdownTimer } from "../../web3/Timer";
// import { type DisputeTypeEnum } from "../../types";
import { SUPPORTED_CHAINS, ZERO_ADDRESS } from "../../web3/config";
import {
  formatAmount,
  formatDateWithTime,
  formatNumberWithCommas,
} from "../../web3/helper";

import { useEscrowData } from "./hooks/useEscrowData";
import { useOnChainActions } from "./hooks/useOnChainActions";
import { useTokenData } from "./hooks/useTokenData";
import { RaiseDisputeModal } from "./components/modals/RaiseDisputeModal";
import { EscrowRejectDeliveryModal } from "./components/modals/EscrowRejectDeliveryModal";
import { StatusBadge, SafetyBadge } from "./components/Badges";
import {
  formatWalletAddress,
  formatUsernameForDisplay,
  processEscrowFiles,
  getDisputeInfo,
  getDisputeEvents,
  getEventActorInfo,
  getEventNote,
  getDisputeStatusFromAgreement,
  STATUS_CONFIG,
  normalizeUsername,
} from "./utils/helpers";
import { toast } from "sonner";
import { ActionInfoBlurb } from "../../components/ActionInfoBlurb";

export default function EscrowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── Data ──────────────────────────────────────────────────────────────────
  const {
    escrow,
    initialLoading,
    isRefreshing,
    lastUpdate,
    onChainAgreement,
    onChainLoading,
    disputeStatus,
    setDisputeStatus,
    disputeVotingId,
    // setDisputeVotingId,
    isDisputeFiler,
    setIsDisputeFiler,
    pendingDisputeModal,
    setPendingDisputeModal,
    fetchEscrowDetailsBackground,
  } = useEscrowData(id);

  // ─── On-chain actions ──────────────────────────────────────────────────────
  const {
    loadingStates,
    isSubmittingDispute,
    isSubmittingReject,
    uiError,
    uiSuccess,
    isPending,
    isApprovalPending,
    depositState,
    // isLoadedAgreement,
    isServiceProvider,
    isServiceRecipient,
    isFirstParty,
    isCounterparty,
    isCreator,
    // votingId,
    votingIdToUse,
    handleSignAgreement,
    handleSubmitDelivery,
    handleApproveDelivery,
    handleDepositFunds,
    handleCancelOrder,
    handleApproveCancellation,
    handlePartialRelease,
    handleFinalRelease,
    handleCancellationTimeout,
    handleClaimMilestone,
    handleSetMilestoneHold,
    handleRaiseDispute,
    handleConfirmRejectDelivery,
    // resetWrite,
  } = useOnChainActions({
    id,
    escrow,
    onChainAgreement,
    fetchBackground: fetchEscrowDetailsBackground,
    setDisputeStatus,
    setPendingDisputeModal,
  });

  // ─── Token data ────────────────────────────────────────────────────────────
  const {
    decimalsNumber,
    tokenSymbol,
    manageMilestoneCount,
    milestones,
    // triggerMilestoneRefetch,
  } = useTokenData(onChainAgreement, escrow);

  // ─── Local UI state ────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(
    BigInt(Math.floor(Date.now() / 1000)),
  );
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeClaim, setDisputeClaim] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectClaim, setRejectClaim] = useState("");

  useEffect(() => {
    const interval = setInterval(
      () => setCurrentTime(BigInt(Math.floor(Date.now() / 1000))),
      1000,
    );
    return () => clearInterval(interval);
  }, []);

  const now = currentTime;

  // ─── Derived memos ─────────────────────────────────────────────────────────

  const disputeInfo = useMemo(
    () =>
      escrow
        ? getDisputeInfo(escrow)
        : {
            filedAt: null,
            filedBy: null,
            filedById: null,
            filedByAvatarId: null,
            filedViaRejection: false,
          },
    [escrow],
  );
  const disputeEvent = useMemo(
    () =>
      escrow?._raw?.timeline ? getDisputeEvents(escrow._raw.timeline) : null,
    [escrow?._raw?.timeline],
  );

  const isDisputePending = useMemo(
    () =>
      disputeStatus === "pending_payment" ||
      disputeStatus === "pending_locking_funds",
    [disputeStatus],
  );

  // Track dispute filer
  useEffect(() => {
    if (!user || !escrow?._raw?.timeline || !disputeVotingId) return;
    const currentUserId = user.id?.toString();
    const disputeEvents = escrow._raw.timeline.filter(
      (e: any) => (e.type === 6 || e.type === 17) && e.toStatus === 4,
    );
    setIsDisputeFiler(
      disputeEvents.some((e: any) => e.actor?.id?.toString() === currentUserId),
    );
  }, [user, escrow, disputeVotingId, setIsDisputeFiler]);

  const getCurrentStatus = () => {
    if (!onChainAgreement) return escrow?.status || "pending";

    const dStatus = getDisputeStatusFromAgreement(escrow);
    if (dStatus === "pending_payment" || dStatus === "pending_locking_funds")
      return dStatus;

    if (onChainAgreement.completed) return "completed";
    if (onChainAgreement.disputed) return "disputed";
    if (onChainAgreement.orderCancelled) return "cancelled";

    if (
      onChainAgreement.signed &&
      onChainAgreement.acceptedByServiceProvider &&
      onChainAgreement.acceptedByServiceRecipient
    ) {
      // Show "pending_approval" only if delivery is submitted, otherwise "signed"
      if (onChainAgreement.deliverySubmited) return "pending_approval";
      return "signed";
    }

    return "pending";
  };

  const getStatusInfo = (status: string) => {
    return (
      STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
      STATUS_CONFIG.pending
    );
  };

  const daysRemaining = escrow
    ? Math.ceil(
        (new Date(escrow.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

  const formatOnChainAmount = (amt: bigint | number | string | undefined) => {
    try {
      if (amt === undefined || amt === null) return "";
      const a = typeof amt === "bigint" ? amt : BigInt(amt as any);
      return formatAmount(a, decimalsNumber);
    } catch {
      return String(amt);
    }
  };

  const handleOpenPendingDisputeModal = useCallback(() => {
    if (!escrow?._raw || !onChainAgreement || !disputeVotingId) {
      return;
    }
    if (!isDisputeFiler) {
      return;
    }
    const timelineEvents = escrow._raw.timeline || [];
    const hasRejectionEvent = timelineEvents.some((e: any) => e.type === 6);
    setPendingDisputeModal({
      isOpen: true,
      data: {
        contractAgreementId: BigInt(onChainAgreement.id),
        votingId: disputeVotingId,
        isProBono: disputeStatus === "pending_locking_funds",
        action: hasRejectionEvent ? "reject" : "raise",
      },
    });
  }, [
    escrow,
    onChainAgreement,
    disputeVotingId,
    isDisputeFiler,
    disputeStatus,
    setPendingDisputeModal,
  ]);

  const handleViewEvidence = (evidence: any) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
  };

  // ─── Early returns ─────────────────────────────────────────────────────────

  if (initialLoading || loadingStates.loadAgreement) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-8">
            <div className="mx-auto size-32 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400" />
            <div className="absolute inset-0 mx-auto size-32 animate-ping rounded-full border-2 border-cyan-400/40" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-cyan-300">
              Loading Escrow
            </h3>
            <p className="text-sm text-cyan-200/70">
              Preparing your escrow details...
            </p>
          </div>
          <div className="mt-4 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
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

  if (!escrow) {
    return (
      <div className="relative min-h-screen p-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="card-cyan rounded-2xl border border-white/10 p-8">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
            <h2 className="mb-2 text-2xl font-semibold text-white/90">
              Escrow Not Found
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              The escrow you're looking for doesn't exist or may have been
              removed.
            </p>
            <Link to="/escrow">
              <Button variant="neon" className="neon-hover">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Escrows
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = getCurrentStatus();

  const actionInfoItems: React.ReactNode[] = [];

  // Sign
  if (
    (isServiceProvider && !onChainAgreement?.acceptedByServiceProvider) ||
    (isServiceRecipient && !onChainAgreement?.acceptedByServiceRecipient)
  ) {
    if (onChainAgreement?.funded) {
      actionInfoItems.push(
        <ActionInfoBlurb key="sign" color="cyan">
          {isServiceProvider
            ? "Sign to confirm you accept the terms as the service provider. The agreement becomes active once both parties have signed."
            : "Sign to confirm you accept the terms as the service recipient. The agreement becomes active once both parties have signed."}
        </ActionInfoBlurb>,
      );
    }
  }

  // Deposit funds
  if (
    isServiceRecipient &&
    !onChainAgreement?.funded &&
    !onChainAgreement?.signed
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="deposit" color="green">
        Locks the agreed amount into the escrow smart contract. The service
        provider can only sign and begin work after funds are deposited.{" "}
        <strong className="font-medium text-green-200">
          ERC-20 tokens require a separate approval transaction first.
        </strong>
      </ActionInfoBlurb>,
    );
  }

  // Submit delivery
  if (
    onChainAgreement?.signed &&
    isServiceProvider &&
    !onChainAgreement?.frozen &&
    !onChainAgreement?.pendingCancellation &&
    !onChainAgreement?.deliverySubmited
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="submit-delivery" color="green">
        Signals that your work is complete and starts the grace period. The
        service recipient will then be able to approve or reject the delivery.
      </ActionInfoBlurb>,
    );
  }

  // Approve / Reject delivery
  if (
    onChainAgreement?.signed &&
    isServiceRecipient &&
    !onChainAgreement?.pendingCancellation &&
    onChainAgreement?.deliverySubmited &&
    !onChainAgreement?.completed
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="review-delivery" color="green">
        <strong className="font-medium text-green-200">Approve</strong> to
        confirm the work is complete and release escrowed funds to the provider.{" "}
        <strong className="font-medium text-red-200">Reject</strong> if the
        delivery doesn't meet the agreed terms — this will open a dispute for
        arbitration review.
      </ActionInfoBlurb>,
    );
  }

  // Cancel order
  if (
    onChainAgreement?.signed &&
    !onChainAgreement?.pendingCancellation &&
    !onChainAgreement?.deliverySubmited &&
    !onChainAgreement?.frozen
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="cancel-order" color="orange">
        Sends a cancellation request to the other party. The agreement stays
        active until they approve or reject it within the grace period.{" "}
        <strong className="font-medium text-orange-200">
          Not available once delivery has been submitted or the agreement is
          frozen.
        </strong>
      </ActionInfoBlurb>,
    );
  }

  // Approve / Reject cancellation
  if (
    now < onChainAgreement?.grace1Ends &&
    onChainAgreement?.signed &&
    onChainAgreement?.pendingCancellation &&
    escrow?._raw?.firstParty?.walletAddress &&
    escrow._raw.firstParty.walletAddress.toLowerCase() !==
      String(onChainAgreement.grace1EndsCalledBy).toLowerCase() &&
    !onChainAgreement?.deliverySubmited
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="respond-cancel" color="orange">
        The other party has requested to cancel this agreement.{" "}
        <strong className="font-medium text-green-200">Approve</strong> to close
        it and return funds.{" "}
        <strong className="font-medium text-red-200">Reject</strong> to keep the
        agreement active. You must respond before the grace period countdown
        expires.
      </ActionInfoBlurb>,
    );
  }

  // Partial release
  if (
    onChainAgreement?.grace1Ends !== BigInt(0) &&
    !onChainAgreement?.vesting &&
    now > onChainAgreement?.grace1Ends &&
    onChainAgreement?.funded &&
    !onChainAgreement?.pendingCancellation &&
    onChainAgreement?.signed
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="partial-release" color="yellow">
        Grace period 1 has elapsed. You can release a portion of the escrowed
        funds to the service provider without a formal delivery approval. Not
        available when vesting milestones are in use.
      </ActionInfoBlurb>,
    );
  }

  // Final release
  if (
    onChainAgreement?.signed &&
    !onChainAgreement?.vesting &&
    now > onChainAgreement?.grace2Ends &&
    onChainAgreement?.grace2Ends !== BigInt(0) &&
    onChainAgreement?.funded &&
    onChainAgreement?.pendingCancellation
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="final-release" color="yellow">
        Grace period 2 has expired on the pending cancellation. Triggering final
        release will close the agreement and return remaining funds to the
        service recipient.
      </ActionInfoBlurb>,
    );
  }

  // Cancellation timeout
  if (
    onChainAgreement?.signed &&
    now > onChainAgreement?.grace1Ends &&
    onChainAgreement?.pendingCancellation &&
    onChainAgreement?.grace1Ends !== BigInt(0)
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="cancel-timeout" color="yellow">
        The grace period for the cancellation request has expired without a
        response. You can now trigger the timeout to automatically resolve the
        cancellation on-chain.
      </ActionInfoBlurb>,
    );
  }

  // Raise dispute
  if (
    onChainAgreement?.funded &&
    onChainAgreement?.signed &&
    !onChainAgreement?.disputed &&
    !onChainAgreement?.completed &&
    !onChainAgreement?.frozen &&
    !onChainAgreement?.pendingCancellation
  ) {
    actionInfoItems.push(
      <ActionInfoBlurb key="raise-dispute" color="purple">
        Open a dispute if the other party is not fulfilling their obligations. A
        fee may be required to file, and the case will be reviewed by community
        arbitrators. Ensure you have supporting evidence ready before
        proceeding.
      </ActionInfoBlurb>,
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-2 lg:px-4 lg:py-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center justify-between space-y-4 sm:flex-row">
          <div className="flex space-x-4 self-start lg:mr-4">
            <Button
              variant="outline"
              onClick={() => navigate("/escrow")}
              className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Escrows
            </Button>
          </div>

          <div className="flex items-center space-x-2 md:mr-auto">
            {(() => {
              const statusKey =
                disputeStatus === "pending_locking_funds" ||
                disputeStatus === "pending_payment"
                  ? disputeStatus
                  : currentStatus;
              const info = getStatusInfo(statusKey);
              return (
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${info.bgColor} ${info.borderColor} ${info.textColor}`}
                >
                  {info.label}
                </span>
              );
            })()}

            {!onChainAgreement?.completed &&
              !onChainAgreement?.disputed &&
              !isDisputePending && (
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${isOverdue ? "border border-rose-400/30 bg-rose-500/20 text-rose-300" : isUrgent ? "border border-yellow-400/30 bg-yellow-500/20 text-yellow-300" : "border border-cyan-400/30 bg-cyan-500/20 text-cyan-300"}`}
                >
                  {isOverdue ? "Overdue" : `${daysRemaining} days left`}
                </span>
              )}

            {escrow._raw?.disputes?.length > 0 && (
              <Link
                to={`/disputes/${escrow._raw.disputes[0].disputeId}`}
                className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/20 hover:text-purple-200"
              >
                <AlertTriangle className="h-4 w-4" />
                View Dispute
              </Link>
            )}
          </div>

          <div className="flex items-end space-x-2 text-xs text-cyan-400/60 sm:self-end">
            {isRefreshing && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            )}
            <span>
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── Main Content ─────────────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overview card */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 px-4 py-6 sm:px-4">
              <div className="mb-6 flex flex-col items-start justify-between sm:flex-row">
                <div>
                  <h1 className="mb-2 max-w-[30rem] text-2xl font-bold text-white lg:text-[1.5rem]">
                    {escrow.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-cyan-300">
                    {escrow.type === "public" ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public Escrow</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Private Escrow</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-cyan-300">Created by</div>
                  <div className="flex items-center justify-end gap-2 font-medium text-white">
                    <UserAvatar
                      userId={escrow.creatorUserId || escrow.creator || ""}
                      avatarId={escrow.creatorAvatarId || null}
                      username={escrow.creator || ""}
                      size="sm"
                    />
                    <span className="text-[11px] text-cyan-300 sm:text-base">
                      {formatWalletAddress(escrow.creator)}
                    </span>
                    {isCreator && (
                      <VscVerifiedFilled className="size-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Parties + dates */}
              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[.6fr_.4fr]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Parties</div>
                      <div className="flex items-center gap-2 text-white">
                        {[
                          {
                            username: escrow.from,
                            userId: escrow.fromUserId,
                            avatarId: escrow.fromAvatarId,
                            isMe: isFirstParty,
                          },
                          {
                            username: escrow.to,
                            userId: escrow.toUserId,
                            avatarId: escrow.toAvatarId,
                            isMe: isCounterparty,
                          },
                        ].map((party, idx) => (
                          <>
                            {idx === 1 && (
                              <span className="text-sm text-cyan-400 sm:text-base">
                                <FaArrowRightArrowLeft />
                              </span>
                            )}
                            <div key={idx} className="flex items-center gap-1">
                              <UserAvatar
                                userId={party.userId || party.username}
                                avatarId={party.avatarId || null}
                                username={party.username}
                                size="sm"
                              />
                              <span className="text-xs text-cyan-300 sm:text-base">
                                {formatWalletAddress(party.username)}
                              </span>
                              {party.isMe && (
                                <VscVerifiedFilled className="size-5 text-green-400" />
                              )}
                            </div>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Date Created</div>
                      <div className="text-white">
                        {formatDateWithTime(escrow.dateCreated)}
                      </div>
                    </div>
                  </div>
                  {escrow.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Amount</div>
                        <div className="text-white">
                          {formatNumberWithCommas(escrow.amount)}{" "}
                          {escrow.token === "ETH"
                            ? (SUPPORTED_CHAINS.find(
                                (c) =>
                                  c.mainnetId === escrow._raw?.chainId ||
                                  c.testnetId === escrow._raw?.chainId,
                              )?.symbol ?? "ETH")
                            : escrow.token}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Deadline</div>
                      <div className="text-white">
                        {formatDateWithTime(escrow.deadline)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Escrow Type</div>
                      <div className="text-white capitalize">{escrow.type}</div>
                    </div>
                  </div>
                  {escrow.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Escrow Used</div>
                        <div className="text-white">
                          {escrow.useEscrow ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Description & Scope
                </h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="leading-relaxed wrap-break-word whitespace-pre-line text-white/80">
                    {escrow.description}
                  </p>
                </div>
              </div>

              {/* Files */}
              {escrow._raw?.files?.length > 0 &&
                (() => {
                  const filteredFiles = escrow._raw.files.filter(
                    (f: any) =>
                      !f.fileName.toLowerCase().includes("escrow-draft"),
                  );
                  if (filteredFiles.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <h3 className="mb-3 text-lg font-semibold text-white">
                        Supporting Documents
                      </h3>
                      <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-cyan-400" />
                          <h4 className="font-medium text-cyan-300">
                            Preview Files ({filteredFiles.length})
                          </h4>
                        </div>
                        <EvidenceDisplay
                          evidence={processEscrowFiles(
                            filteredFiles,
                            escrow.id,
                          )}
                          color="cyan"
                          onViewEvidence={handleViewEvidence}
                        />
                      </div>
                    </div>
                  );
                })()}

              {/* On-chain details */}
              {onChainAgreement && (
                <div className="mt-6 rounded-2xl border border-cyan-500/60 p-2 lg:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                        On-Chain Agreement Details
                      </h3>
                      <p className="mt-1 text-sm text-cyan-300/80">
                        Live blockchain data • Contract ID:{" "}
                        {escrow?._raw?.contractAgreementId || "N/A"}
                      </p>
                    </div>
                    <div className="text-xs text-cyan-400/60">
                      {onChainLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        "Live"
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Parties */}
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold text-cyan-300">
                          Parties & Basic Info
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          ["Creator", onChainAgreement.creator],
                          [
                            "Service Provider",
                            onChainAgreement.serviceProvider,
                          ],
                          [
                            "Service Recipient",
                            onChainAgreement.serviceRecipient,
                          ],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <div className="mb-1 text-xs text-cyan-300/80">
                              {label}
                            </div>
                            <div className="rounded bg-cyan-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                              {value || "N/A"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial */}
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-emerald-300">
                          Financial Details
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-emerald-300/80">
                            Token
                          </div>
                          <div className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.token === ZERO_ADDRESS
                              ? tokenSymbol
                              : onChainAgreement.token}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-emerald-300/80">
                              Amount
                            </div>
                            <div className="font-mono text-sm text-white">
                              {formatOnChainAmount(onChainAgreement.amount)}{" "}
                              {tokenSymbol}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-emerald-300/80">
                              Remaining
                            </div>
                            <div className="font-mono text-sm text-white">
                              {formatOnChainAmount(
                                onChainAgreement.remainingAmount,
                              )}{" "}
                              {tokenSymbol}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-emerald-300/80">
                            Funded
                          </div>
                          <StatusBadge value={onChainAgreement.funded} />
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <h4 className="text-sm font-semibold text-blue-300">
                          Agreement Status
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Signed
                            </div>
                            <StatusBadge value={onChainAgreement.signed} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Completed
                            </div>
                            <StatusBadge value={onChainAgreement.completed} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Provider Accepted
                            </div>
                            <StatusBadge
                              value={onChainAgreement.acceptedByServiceProvider}
                            />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Recipient Accepted
                            </div>
                            <StatusBadge
                              value={
                                onChainAgreement.acceptedByServiceRecipient
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Features */}
                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <h4 className="text-sm font-semibold text-purple-300">
                          Timeline & Features
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-purple-300/80">
                            Deadline Duration
                          </div>
                          <div className="rounded bg-purple-500/10 px-2 py-1 font-mono text-sm text-white">
                            {onChainAgreement.deadlineDuration?.toString() ||
                              "N/A"}{" "}
                            seconds
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-purple-300/80">
                              Vesting
                            </div>
                            <StatusBadge value={onChainAgreement.vesting} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-purple-300/80">
                              Private
                            </div>
                            <StatusBadge value={onChainAgreement.privateMode} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-purple-300/80">
                            Delivery Submitted
                          </div>
                          <StatusBadge
                            value={onChainAgreement.deliverySubmitted}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dispute & Safety */}
                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        <h4 className="text-sm font-semibold text-rose-300">
                          Dispute & Safety
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Disputed
                            </div>
                            <SafetyBadge value={onChainAgreement.disputed} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Frozen
                            </div>
                            <SafetyBadge value={onChainAgreement.frozen} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Pending Cancel
                            </div>
                            <SafetyBadge
                              value={onChainAgreement.pendingCancellation}
                            />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Cancelled
                            </div>
                            <SafetyBadge
                              value={onChainAgreement.orderCancelled}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-rose-300/80">
                            Voting ID
                          </div>
                          <div className="w-fit rounded bg-rose-500/10 px-2 py-1 font-mono text-sm text-white">
                            {onChainAgreement.votingId?.toString() || "0"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {onChainAgreement && (
              <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-4 backdrop-blur-sm lg:p-6">
                {/* Status indicators */}
                <div className="mt-4 space-y-2">
                  {onChainAgreement.grace1Ends > 0n &&
                    onChainAgreement.pendingCancellation && (
                      <div className="flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-orange-300">
                          Pending Order Cancellation:{" "}
                          <CountdownTimer
                            targetTimestamp={onChainAgreement.grace1Ends}
                          />
                        </span>
                      </div>
                    )}
                  {onChainAgreement.frozen && (
                    <div className="flex w-fit items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-red-300">Agreement is Frozen!</span>
                    </div>
                  )}
                  {onChainAgreement.grace1Ends > 0n &&
                    !onChainAgreement?.disputed &&
                    onChainAgreement.deliverySubmited &&
                    !onChainAgreement.vesting &&
                    !onChainAgreement.completed &&
                    !onChainAgreement.frozen && (
                      <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-300">
                          Pending Delivery [Grace period 1]:{" "}
                          <CountdownTimer
                            targetTimestamp={onChainAgreement.grace1Ends}
                          />
                        </span>
                      </div>
                    )}
                  {onChainAgreement.grace1Ends > 0n &&
                    !onChainAgreement?.disputed &&
                    onChainAgreement.deliverySubmited &&
                    !onChainAgreement.completed &&
                    !onChainAgreement.frozen && (
                      <div className="flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                        <Package className="h-4 w-4 text-green-400" />
                        <span className="text-green-300">
                          Delivery submitted, waiting for service recipient
                        </span>
                      </div>
                    )}
                  <div className="mb-2 flex flex-col items-center gap-4 sm:flex-row">
                    {!onChainAgreement.acceptedByServiceProvider && (
                      <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                        <UserCheck className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-300">
                          Waiting for Service Provider Signature
                        </span>
                      </div>
                    )}
                    {!onChainAgreement.acceptedByServiceRecipient && (
                      <div className="flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 p-3">
                        <UserCheck className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-300">
                          Waiting for Service Recipient Signature
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons grid */}
                {(isServiceProvider || isServiceRecipient) &&
                  !isDisputePending &&
                  !onChainAgreement?.disputed && (
                    <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Agreement Actions
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Sign */}
                        {((isServiceProvider &&
                          !onChainAgreement.acceptedByServiceProvider) ||
                          (isServiceRecipient &&
                            !onChainAgreement.acceptedByServiceRecipient)) &&
                          onChainAgreement.funded && (
                            <Button
                              onClick={handleSignAgreement}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                loadingStates.signAgreement
                              }
                              variant="outline"
                              className="w-fit border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                            >
                              {loadingStates.signAgreement ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                                  Signing Agreement...
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Sign Agreement
                                </>
                              )}
                            </Button>
                          )}

                        {/* Deposit */}
                        {isServiceRecipient &&
                          !onChainAgreement.funded &&
                          !onChainAgreement.signed && (
                            <Button
                              onClick={handleDepositFunds}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                isApprovalPending ||
                                loadingStates.depositFunds
                              }
                              variant="outline"
                              className="neon-hover w-fit border-green-500/50 bg-green-500/20 text-green-300 hover:bg-green-500/30"
                            >
                              {loadingStates.depositFunds ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
                                  Depositing...
                                </>
                              ) : depositState.isApprovingToken ? (
                                isApprovalPending ? (
                                  "Approving..."
                                ) : (
                                  "Confirming..."
                                )
                              ) : (
                                <>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Deposit Funds
                                </>
                              )}
                            </Button>
                          )}

                        {/* Submit Delivery */}
                        {onChainAgreement.signed &&
                          isServiceProvider &&
                          !onChainAgreement.frozen &&
                          !onChainAgreement.pendingCancellation &&
                          !onChainAgreement.deliverySubmited && (
                            <Button
                              onClick={handleSubmitDelivery}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                loadingStates.submitDelivery
                              }
                              variant="outline"
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                            >
                              {loadingStates.submitDelivery ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Package className="mr-2 h-4 w-4" />
                                  Submit Delivery
                                </>
                              )}
                            </Button>
                          )}

                        {/* Approve Delivery */}
                        {onChainAgreement.signed &&
                          isServiceRecipient &&
                          !onChainAgreement.pendingCancellation &&
                          onChainAgreement.deliverySubmited &&
                          !onChainAgreement.completed && (
                            <Button
                              onClick={() => handleApproveDelivery(true)}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                loadingStates.approveDelivery
                              }
                              variant="outline"
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              {loadingStates.approveDelivery ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <PackageCheck className="mr-2 h-4 w-4" />
                                  Approve Delivery
                                </>
                              )}
                            </Button>
                          )}

                        {/* Reject Delivery */}
                        {onChainAgreement.signed &&
                          isServiceRecipient &&
                          !onChainAgreement.pendingCancellation &&
                          onChainAgreement.deliverySubmited &&
                          !onChainAgreement.completed && (
                            <Button
                              onClick={() => setIsRejectModalOpen(true)}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                loadingStates.rejectDelivery
                              }
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              {loadingStates.rejectDelivery ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Reject Delivery
                                </>
                              )}
                            </Button>
                          )}

                        {/* Approve Cancellation */}
                        {now < onChainAgreement.grace1Ends &&
                          onChainAgreement.signed &&
                          onChainAgreement.pendingCancellation &&
                          escrow &&
                          escrow._raw?.firstParty?.walletAddress &&
                          escrow._raw.firstParty.walletAddress.toLowerCase() !==
                            String(
                              onChainAgreement.grace1EndsCalledBy,
                            ).toLowerCase() &&
                          !onChainAgreement.deliverySubmited && (
                            <>
                              <Button
                                onClick={() => handleApproveCancellation(true)}
                                disabled={
                                  !onChainAgreement?.id ||
                                  isPending ||
                                  loadingStates.approveCancellation
                                }
                                variant="outline"
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                {loadingStates.approveCancellation ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve Cancellation
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() => handleApproveCancellation(false)}
                                disabled={
                                  !onChainAgreement?.id ||
                                  isPending ||
                                  loadingStates.approveCancellation
                                }
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                {loadingStates.approveCancellation ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject Cancellation
                                  </>
                                )}
                              </Button>
                            </>
                          )}

                        {/* Cancel Order */}
                        {onChainAgreement.signed &&
                          !onChainAgreement.pendingCancellation &&
                          !onChainAgreement.deliverySubmited &&
                          !onChainAgreement.frozen && (
                            <Button
                              onClick={handleCancelOrder}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                loadingStates.cancelOrder
                              }
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              {loadingStates.cancelOrder ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Cancel Order
                                </>
                              )}
                            </Button>
                          )}

                        {/* Partial Release */}
                        {onChainAgreement.grace1Ends !== BigInt(0) &&
                          !onChainAgreement.vesting &&
                          now > onChainAgreement.grace1Ends &&
                          onChainAgreement.funded &&
                          !onChainAgreement.pendingCancellation &&
                          onChainAgreement.signed && (
                            <Button
                              onClick={handlePartialRelease}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                onChainAgreement.vesting ||
                                loadingStates.partialRelease
                              }
                              variant="outline"
                              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                            >
                              {loadingStates.partialRelease ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                                  Releasing...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Partial Release
                                </>
                              )}
                            </Button>
                          )}

                        {/* Final Release */}
                        {onChainAgreement.signed &&
                          !onChainAgreement.vesting &&
                          now > onChainAgreement.grace2Ends &&
                          onChainAgreement.grace2Ends !== BigInt(0) &&
                          onChainAgreement.funded &&
                          onChainAgreement.pendingCancellation && (
                            <Button
                              onClick={handleFinalRelease}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                onChainAgreement.vesting ||
                                loadingStates.finalRelease
                              }
                              variant="outline"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                            >
                              {loadingStates.finalRelease ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                                  Releasing...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Final Release
                                </>
                              )}
                            </Button>
                          )}

                        {/* Cancellation Timeout */}
                        {onChainAgreement.signed &&
                          now > onChainAgreement.grace1Ends &&
                          onChainAgreement.pendingCancellation &&
                          onChainAgreement.grace1Ends !== BigInt(0) && (
                            <Button
                              onClick={handleCancellationTimeout}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                loadingStates.cancellationTimeout
                              }
                              variant="outline"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                            >
                              {loadingStates.cancellationTimeout ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Cancellation Timeout
                                </>
                              )}
                            </Button>
                          )}

                        {/* Raise Dispute */}
                        {onChainAgreement.funded &&
                          onChainAgreement.signed &&
                          !onChainAgreement.disputed &&
                          !onChainAgreement.completed &&
                          !onChainAgreement.frozen &&
                          !onChainAgreement.pendingCancellation && (
                            <Button
                              onClick={() => setIsDisputeModalOpen(true)}
                              disabled={
                                !onChainAgreement?.id ||
                                isPending ||
                                loadingStates.raiseDispute
                              }
                              variant="outline"
                              className="border-purple-500/30 text-purple-400 hover:bg-purple-300/15"
                            >
                              {loadingStates.raiseDispute ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                                  Raising Dispute...
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Raise Dispute
                                </>
                              )}
                            </Button>
                          )}

                        {/* Milestones */}
                        {onChainAgreement.vesting &&
                          manageMilestoneCount! > 0 &&
                          onChainAgreement.signed && (
                            <div className="glass col-span-full mt-6 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                              <h3 className="mb-4 text-xl font-bold text-white">
                                Vesting Milestones
                              </h3>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse rounded-lg bg-white/5">
                                  <thead>
                                    <tr className="border-b border-cyan-400/30">
                                      {[
                                        "Milestone",
                                        "Percentage",
                                        "Amount",
                                        "Unlock Time",
                                        "Time Remaining",
                                        "Status",
                                        "Actions",
                                      ].map((h) => (
                                        <th
                                          key={h}
                                          className="p-4 text-left text-cyan-300"
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {milestones.map((milestone, index) => (
                                      <MilestoneTableRow
                                        key={index}
                                        milestone={milestone}
                                        index={index}
                                        manageTokenDecimals={decimalsNumber}
                                        manageTokenSymbol={tokenSymbol}
                                        isServiceProvider={
                                          isServiceProvider as boolean
                                        }
                                        isServiceRecipient={
                                          isServiceRecipient as boolean
                                        }
                                        onClaimMilestone={handleClaimMilestone}
                                        onSetMilestoneHold={
                                          handleSetMilestoneHold
                                        }
                                        isLoadingClaim={
                                          loadingStates.claimMilestone
                                        }
                                        isLoadingHold={
                                          loadingStates.setMilestoneHold
                                        }
                                      />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                {/* ── Contextual info blurbs ──────────────────────────────── */}
                {actionInfoItems.length > 0 && (
                  <div className="mt-4 space-y-2">{actionInfoItems}</div>
                )}
              </div>
            )}

            {/* Pending dispute payment CTA */}
            {isDisputePending && (
              <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-4 lg:p-6">
                <h3
                  className={`mb-4 text-lg font-semibold ${disputeStatus === "pending_payment" ? "text-yellow-500" : "text-blue-400"}`}
                >
                  {disputeStatus === "pending_payment"
                    ? "Complete Payment for Dispute"
                    : "Complete Fund Locking for Dispute"}
                </h3>
                {isDisputeFiler ? (
                  <>
                    <p className="mb-4 text-sm text-cyan-200/80">
                      {disputeStatus === "pending_payment"
                        ? "Your dispute requires payment to become active."
                        : "Your pro bono dispute requires fund locking on the blockchain."}
                    </p>
                    <Button
                      onClick={handleOpenPendingDisputeModal}
                      disabled={!onChainAgreement?.id || !disputeVotingId}
                      variant="outline"
                      className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                    >
                      {disputeStatus === "pending_payment" ? (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Complete Payment
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Lock Funds Now
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-500/30 bg-gray-500/10 p-4">
                    <p className="text-sm text-gray-400">
                      The other party needs to complete the{" "}
                      {disputeStatus === "pending_payment"
                        ? "payment"
                        : "fund locking"}{" "}
                      for this dispute.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dispute info */}
            {escrow._raw?.disputes?.length > 0 && (
              <div className="mt-6 rounded-xl border border-purple-400/60 bg-gradient-to-br from-purple-500/20 to-transparent p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  {(() => {
                    const ds = getDisputeStatusFromAgreement(escrow);
                    if (ds === "pending_payment")
                      return "Dispute - Pending Payment";
                    if (ds === "pending_locking_funds")
                      return "Dispute - Pending Fund Locking";
                    return "Active Dispute";
                  })()}
                </h3>
                <div className="space-y-4">
                  <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {disputeInfo.filedAt && (
                          <div className="mt-2 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-purple-300/80">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Filed on{" "}
                                {formatDateWithTime(disputeInfo.filedAt)}
                              </span>
                            </div>
                            {disputeInfo.filedBy && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-purple-300/80">
                                  <Users className="h-3 w-3" />
                                  <span>Filed by:</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {disputeInfo.filedById && (
                                    <UserAvatar
                                      userId={disputeInfo.filedById.toString()}
                                      avatarId={disputeInfo.filedByAvatarId}
                                      username={disputeInfo.filedBy}
                                      size="sm"
                                    />
                                  )}
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/profile/${disputeInfo.filedBy?.replace(/^@/, "") || ""}`,
                                      )
                                    }
                                    className="text-xs font-medium text-purple-200 hover:text-purple-100 hover:underline"
                                  >
                                    {formatUsernameForDisplay(
                                      disputeInfo.filedBy,
                                    )}
                                  </button>
                                  {user &&
                                    disputeInfo.filedBy &&
                                    normalizeUsername(user.username) ===
                                      normalizeUsername(
                                        disputeInfo.filedBy,
                                      ) && (
                                      <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {getDisputeStatusFromAgreement(escrow) !==
                        "pending_payment" &&
                        getDisputeStatusFromAgreement(escrow) !==
                          "pending_locking_funds" && (
                          <Link
                            to={`/disputes/${escrow._raw.disputes[0].disputeId}`}
                            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-200 transition-colors hover:bg-purple-500/30 hover:text-white"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Go to Dispute
                          </Link>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UI feedback */}
            {uiError && (
              <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <p className="text-red-400">{uiError}</p>
              </div>
            )}
            {uiSuccess && (
              <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                <p className="text-green-400">{uiSuccess}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">
                Escrow Timeline
              </h3>
              <div className="flex items-start space-x-8 overflow-x-auto pb-4">
                {/* Created */}
                <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                  <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300" />
                  <div className="mt-3 font-medium text-white">
                    Escrow Created
                  </div>
                  <div className="text-sm text-cyan-300">
                    {formatDateWithTime(escrow.dateCreated)}
                  </div>
                  <div className="mt-1 flex flex-col items-center gap-2 text-xs text-blue-400/70">
                    Created by{" "}
                    <div className="flex items-center gap-1">
                      <UserAvatar
                        userId={escrow.creatorUserId || escrow.creator || ""}
                        avatarId={escrow.creatorAvatarId || null}
                        username={escrow.creator || ""}
                        size="sm"
                      />
                      {formatWalletAddress(escrow.creator)}
                      {isCreator && (
                        <VscVerifiedFilled className="size-5 text-green-400" />
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-blue-400/50" />
                </div>

                {/* Signed */}
                {onChainAgreement?.signed && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue-400" />
                    <div className="mt-3 font-medium text-white">
                      Both Parties Signed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {(() => {
                        const e = escrow._raw?.timeline?.find(
                          (ev: any) =>
                            (ev.type === 2 || ev.type === 1) &&
                            ev.toStatus === 2,
                        );
                        return e?.createdAt
                          ? formatDateWithTime(e.createdAt)
                          : "Recently";
                      })()}
                    </div>
                    <div className="mt-1 space-y-2 text-xs text-emerald-400/70">
                      {onChainAgreement.acceptedByServiceProvider && (
                        <div className="flex flex-col items-center gap-1">
                          Signed by{" "}
                          <div className="flex items-center gap-1">
                            <UserAvatar
                              userId={escrow.fromUserId || escrow.from}
                              avatarId={escrow.fromAvatarId || null}
                              username={escrow.from}
                              size="sm"
                            />
                            {formatWalletAddress(escrow.from)}
                          </div>
                        </div>
                      )}
                      {onChainAgreement.acceptedByServiceRecipient && (
                        <div className="flex flex-col items-center gap-1 text-blue-400/70">
                          Signed by{" "}
                          <div className="flex items-center gap-1">
                            <UserAvatar
                              userId={escrow.toUserId || escrow.to}
                              avatarId={escrow.toAvatarId || null}
                              username={escrow.to}
                              size="sm"
                            />
                            {formatWalletAddress(escrow.to)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-emerald-400/50" />
                  </div>
                )}

                {/* Delivered */}
                {onChainAgreement?.deliverySubmited && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400" />
                    <div className="mt-3 font-medium text-white">
                      Work Delivered
                    </div>
                    <div className="text-sm text-cyan-300">
                      {(() => {
                        const e = escrow._raw?.timeline?.find(
                          (ev: any) =>
                            ev.type === 11 ||
                            (ev.toStatus === 7 && ev.fromStatus === 2),
                        );
                        return e?.createdAt
                          ? formatDateWithTime(e.createdAt)
                          : "Recently";
                      })()}
                    </div>
                    <div className="mt-1 text-xs text-blue-400/70">
                      <div className="flex flex-col items-center gap-1">
                        Delivered by{" "}
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={escrow.toUserId || escrow.to}
                            avatarId={escrow.toAvatarId || null}
                            username={escrow.to}
                            size="sm"
                          />
                          {formatWalletAddress(escrow.to)}
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-blue-400/50" />
                  </div>
                )}

                {/* Completed */}
                {onChainAgreement?.completed && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400" />
                    <div className="mt-3 font-medium text-white">
                      Completed & Approved
                    </div>
                    <div className="text-sm text-cyan-300">
                      {(() => {
                        const e = escrow._raw?.timeline?.find(
                          (ev: any) => ev.toStatus === 3,
                        );
                        return e?.createdAt
                          ? formatDateWithTime(e.createdAt)
                          : "Recently";
                      })()}
                    </div>
                    <div className="mt-1 text-xs text-purple-400/70">
                      <div className="flex items-center gap-1">
                        <UserAvatar
                          userId={escrow.toUserId || escrow.to}
                          avatarId={escrow.toAvatarId || null}
                          username={escrow.to}
                          size="sm"
                        />
                        Approved by {formatWalletAddress(escrow.to)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Disputed */}
                {(onChainAgreement?.disputed ||
                  escrow._raw?.timeline?.some((e: any) => e.type === 17)) &&
                  (() => {
                    const actorInfo = disputeEvent
                      ? getEventActorInfo(disputeEvent)
                      : null;
                    const eventNote = disputeEvent
                      ? getEventNote(disputeEvent)
                      : null;
                    const eventTime = (disputeEvent as any)?.createdAt;
                    return (
                      <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                        <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-purple-400" />
                        <div className="mt-3 font-medium text-white">
                          Dispute Raised
                        </div>
                        <div className="text-sm text-cyan-300">
                          {eventTime
                            ? formatDateWithTime(eventTime)
                            : "Recently"}
                        </div>
                        <div className="mt-1 text-xs text-purple-400/70">
                          {actorInfo ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <UserAvatar
                                  userId={actorInfo.userId || ""}
                                  avatarId={actorInfo.avatarId}
                                  username={actorInfo.username}
                                  size="sm"
                                />
                                Raised by{" "}
                                {formatWalletAddress(actorInfo.username)}
                              </div>
                            </div>
                          ) : eventNote ? (
                            <div className="max-w-[10rem]">{eventNote}</div>
                          ) : (
                            "Agreement moved to Disputed status"
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {/* Cancelled */}
                {onChainAgreement?.orderCancelled && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-400" />
                    <div className="mt-3 font-medium text-white">Cancelled</div>
                    <div className="text-sm text-cyan-300">
                      {(() => {
                        const e = escrow._raw?.timeline?.find(
                          (ev: any) => ev.toStatus === 5,
                        );
                        return e?.createdAt
                          ? formatDateWithTime(e.createdAt)
                          : "Recently";
                      })()}
                    </div>
                    <div className="mt-1 text-xs text-red-400/70">
                      Agreement Terminated
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Your Role */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Your Role
              </h3>
              <div className="space-y-3">
                {isCreator && (
                  <div className="rounded-lg bg-purple-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span className="font-medium text-purple-300">
                        Creator
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-purple-200/80">
                      You created this escrow agreement in the system.
                    </p>
                  </div>
                )}
                {isServiceProvider && (
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-300">
                        Service Provider (Payee)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-green-200/80">
                      You provide the service and receive payment upon
                      completion.
                    </p>
                  </div>
                )}
                {isServiceRecipient && (
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-blue-300">
                        Service Recipient (Payer)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-200/80">
                      You receive the service and provide payment secured in
                      escrow.
                    </p>
                  </div>
                )}
                {(isFirstParty || isCounterparty) &&
                  !isServiceProvider &&
                  !isServiceRecipient && (
                    <div className="rounded-lg bg-yellow-500/10 p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium text-yellow-300">
                          {isFirstParty ? "First Party" : "Counterparty"}
                        </span>
                      </div>
                    </div>
                  )}
                {!isServiceProvider && !isServiceRecipient && !isCreator && (
                  <div className="rounded-lg bg-gray-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-300">Viewer</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Info */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Contract Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Created</span>
                  <span className="text-white">
                    {formatDateWithTime(escrow.dateCreated)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Deadline</span>
                  <span className="text-white">
                    {formatDateWithTime(escrow.deadline)}
                  </span>
                </div>
                {(escrow.status === "disputed" || onChainAgreement?.disputed) &&
                  disputeInfo.filedAt && (
                    <div className="flex justify-between">
                      <span className="text-purple-300">Dispute Filed</span>
                      <span className="text-purple-300">
                        {formatDateWithTime(disputeInfo.filedAt)}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <EvidenceViewer
        isOpen={evidenceViewerOpen}
        onClose={() => {
          setEvidenceViewerOpen(false);
          setSelectedEvidence(null);
        }}
        selectedEvidence={selectedEvidence}
      />

      {pendingDisputeModal.isOpen &&
        pendingDisputeModal.data &&
        escrow?.escrowAddress && (
          <EscrowPendingDisputeModal
            isOpen={pendingDisputeModal.isOpen}
            onClose={() =>
              setPendingDisputeModal({ isOpen: false, data: null })
            }
            onDisputeCreated={() => {
              fetchEscrowDetailsBackground();
              toast.success(
                pendingDisputeModal.data?.action === "raise"
                  ? "Dispute created successfully!"
                  : "Delivery rejected and dispute created!",
              );
            }}
            contractAgreementId={pendingDisputeModal.data.contractAgreementId}
            votingId={pendingDisputeModal.data.votingId}
            escrowAddress={escrow.escrowAddress as `0x${string}`}
            isProBono={pendingDisputeModal.data.isProBono}
            agreement={escrow?._raw}
            action={pendingDisputeModal.data.action}
          />
        )}

      {isDisputeModalOpen && (
        <RaiseDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => {
            setIsDisputeModalOpen(false);
            setDisputeClaim("");
          }}
          onConfirm={handleRaiseDispute}
          claim={disputeClaim}
          setClaim={setDisputeClaim}
          agreement={escrow?._raw}
          currentUser={user}
          isSubmitting={isSubmittingDispute || loadingStates.raiseDispute}
        />
      )}

      <EscrowRejectDeliveryModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectClaim("");
        }}
        votingId={votingIdToUse.toString()}
        onConfirm={handleConfirmRejectDelivery}
        claim={rejectClaim}
        setClaim={setRejectClaim}
        isSubmitting={isSubmittingReject || loadingStates.rejectDelivery}
        agreement={escrow?._raw}
      />
    </div>
  );
}
