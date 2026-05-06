/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Lock,
  UserCheck,
  X,
  ThumbsUp,
  ThumbsDown,
  Package,
  PackageCheck,
  Ban,
  Info,
  Wallet,
} from "lucide-react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { Button } from "../../components/ui/button";
import { UserAvatar } from "../../components/UserAvatar";
import { useAuth } from "../../hooks/useAuth";
import OpenDisputeModal from "../../components/OpenDisputeModal";
import EvidenceViewer from "../../components/disputes/modals/EvidenceViewer";
import { EvidenceDisplay } from "../../components/disputes/EvidenceDisplay";

import { useAgreementData } from "./hooks/useAgreementData";
import { useAgreementActions } from "./hooks/useAgreementActions";
import { LoadingScreen } from "./components/LoadingScreen";
import { RejectDeliveryModal } from "./components/modals/RejectDeliveryModal";
import { PendingDisputeModal } from "./components/modals/PendingDisputeModal";
import { AgreementTimeline } from "./components/AgreementTimeline";
import { AgreementSidebar } from "./components/AgreementSidebar";

import {
  formatNumberWithCommas,
  formatCreatorUsername,
  formatWalletAddress,
  formatDate,
  formatDateWithTime,
  getStatusColor,
  processAgreementFiles,
  getDisputeInfo,
  isDisputeTriggeredByRejection,
  getDisputeFiledByFromTimeline,
  getUltraSimpleSigningMessage,
  isCurrentUserCounterparty,
  isCurrentUserFirstParty,
  isCurrentUserCreator,
  canUserMarkAsDelivered,
  canUserRequestCancellation,
  shouldShowDeliveryReviewButtons,
  shouldShowCancellationResponseButtons,
  getDeliveryInitiatedBy,
  getCancellationInitiatedBy,
  isCancellationPending,
  getCompletionDate,
  getDeliverySubmittedDate,
  getSigningDate,
  getCancellationDate,
  normalizeUsername,
} from "./utils/helpers";
import { ActionInfoBlurb } from "../../components/ActionInfoBlurb";
import { NotFoundScreen } from "../../components/NotFoundScreen";
import { AppLink } from "../../components/AppLink";
import { useNavigation } from "../../hooks/useNavigation";

export default function AgreementDetails() {
  const { id } = useParams<{ id: string }>();
  const { navigateTo } = useNavigation();

  const { user } = useAuth();

  // ─── Data ──────────────────────────────────────────────────────────────────
  const {
    agreement,
    setAgreement,
    loading,
    disputeStatus,
    setDisputeStatus,
    // disputeVotingId,
    setDisputeVotingId,
    isRefreshing,
    // lastUpdate,
    rejectDisputeStatus,
    setRejectDisputeStatus,
    pendingModalState,
    setPendingModalState,
    fetchAgreementDetailsBackground,
    disputeChainId,
  } = useAgreementData(id);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const {
    isSigning,
    isCancelling,
    isCompleting,
    isConfirming,
    isRespondingToCancel,
    isSubmittingReject,
    handleSignAgreement,
    handleCancelAgreement,
    handleRespondToCancelation,
    handleMarkAsDelivered,
    handleConfirmDelivery,
    handleConfirmReject,
    handleCompletePayment,
    handlePaidDisputeCreated,
  } = useAgreementActions({
    id,
    agreement,
    fetchBackground: fetchAgreementDetailsBackground,
    setDisputeStatus,
    setDisputeVotingId,
    setRejectDisputeStatus,
    setAgreement,
    setPendingModalState,
  });

  // ─── Local UI state ────────────────────────────────────────────────────────
  const [showEscrowAddress, setShowEscrowAddress] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectClaim, setRejectClaim] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);

  const handleViewEvidence = useCallback((evidence: any) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
  }, []);

  const handleDisputeCreated = useCallback(() => {}, []);

  // ─── Early returns ─────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  // ─── Derived permissions ───────────────────────────────────────────────────
  const isCounterparty =
    agreement && user ? isCurrentUserCounterparty(agreement._raw, user) : false;
  const isFirstParty =
    agreement && user ? isCurrentUserFirstParty(agreement._raw, user) : false;
  const isCreator =
    agreement && user ? isCurrentUserCreator(agreement._raw, user) : false;
  const isParticipant = isFirstParty || isCounterparty;
  const canViewAgreement =
    isParticipant || isCreator || (agreement && agreement.type === "Public");

  if (!agreement || !canViewAgreement) {
    return (
      <NotFoundScreen isAccessRestricted={!!agreement && !canViewAgreement} />
    );
  }

  // ─── Derived state ─────────────────────────────────────────────────────────
  const canSign =
    agreement.status === "pending" &&
    (isCounterparty || (isFirstParty && !isCreator));
  const canCancel = agreement.status === "pending" && isCreator;
  const canRequestCancellation = canUserRequestCancellation(
    agreement._raw,
    user,
  );
  const canRespondToCancellation = shouldShowCancellationResponseButtons(
    agreement._raw,
    user,
  );
  const canMarkDelivered = canUserMarkAsDelivered(agreement._raw, user);
  const canReviewDelivery = shouldShowDeliveryReviewButtons(
    agreement._raw,
    user,
  );
  const canOpenDispute =
    (agreement.status === "signed" ||
      agreement.status === "pending_approval") &&
    isParticipant;
  const canCancelDispute = agreement.status === "disputed" && isParticipant;
  const deliveryInitiatedBy = getDeliveryInitiatedBy(agreement._raw, user);
  const isCurrentUserInitiatedDelivery = deliveryInitiatedBy === "user";
  const cancellationInitiatedBy = getCancellationInitiatedBy(
    agreement._raw,
    user,
  );
  const isCurrentUserInitiatedCancellation = cancellationInitiatedBy === "user";
  const cancellationPending = isCancellationPending(agreement._raw);
  const disputeTriggeredByRejection = isDisputeTriggeredByRejection(agreement);
  const disputeInfo = getDisputeInfo(agreement);
  const signingStatusMessage = getUltraSimpleSigningMessage(agreement, user);
  const completionDate = getCompletionDate(agreement._raw);
  const deliverySubmittedDate = getDeliverySubmittedDate(agreement._raw);
  const signingDate = getSigningDate(agreement._raw);
  const cancellationDate = getCancellationDate(agreement._raw);

  const showActions =
    (canSign ||
      canCancel ||
      canRequestCancellation ||
      canRespondToCancellation ||
      canMarkDelivered ||
      canReviewDelivery ||
      canOpenDispute ||
      canCancelDispute) &&
    !["completed", "disputed", "cancelled", "expired"].includes(
      agreement.status,
    );

  // ─── Per-action contextual blurbs ─────────────────────────────────────────
  // Collected here so the JSX below stays readable. Each entry mirrors the
  // condition that gates its corresponding button.

  const actionInfoItems: React.ReactNode[] = [];

  if (canSign) {
    actionInfoItems.push(
      <ActionInfoBlurb key="sign" color="cyan">
        {isCounterparty
          ? "By signing you accept all terms and conditions of this agreement. Both parties will be bound once signed."
          : "Sign to confirm your participation as the first party. The counterparty will also need to sign before the agreement becomes active."}
      </ActionInfoBlurb>,
    );
  }

  if (canCancel) {
    actionInfoItems.push(
      <ActionInfoBlurb key="cancel" color="red">
        Cancelling removes this agreement permanently. This action cannot be
        undone — only do this before the counterparty has signed.
      </ActionInfoBlurb>,
    );
  }

  if (canRequestCancellation) {
    actionInfoItems.push(
      <ActionInfoBlurb key="req-cancel" color="orange">
        A cancellation request will be sent to the other party for their
        approval. The agreement remains active until they respond.
      </ActionInfoBlurb>,
    );
  }

  if (canRespondToCancellation) {
    actionInfoItems.push(
      <ActionInfoBlurb key="respond-cancel" color="orange">
        The other party has requested to cancel this agreement.{" "}
        <strong className="font-medium text-orange-300">Accepting</strong>{" "}
        closes it immediately.{" "}
        <strong className="font-medium text-orange-300">Rejecting</strong> keeps
        the agreement active.
      </ActionInfoBlurb>,
    );
  }

  if (canMarkDelivered && !isCurrentUserInitiatedDelivery) {
    actionInfoItems.push(
      <ActionInfoBlurb key="deliver" color="green">
        Mark your work as delivered to notify the other party. They will then
        have the opportunity to accept or reject the delivery.
      </ActionInfoBlurb>,
    );
  }

  if (canReviewDelivery) {
    actionInfoItems.push(
      <ActionInfoBlurb key="review-delivery" color="green">
        <strong className="font-medium text-green-300">Accept</strong> to
        confirm the work is complete.{" "}
        <strong className="font-medium text-red-300">Reject</strong> if the
        delivery doesn't meet the agreed terms — this will automatically open a
        dispute for resolution.
      </ActionInfoBlurb>,
    );
  }

  if (canOpenDispute) {
    actionInfoItems.push(
      <ActionInfoBlurb key="dispute" color="purple">
        Open a dispute if the other party is not fulfilling their obligations. A
        small fee might be required to file if you choose a paid option, and the
        case will be reviewed by Judges and the community.
      </ActionInfoBlurb>,
    );
  }

  if (canCancelDispute) {
    actionInfoItems.push(
      <ActionInfoBlurb key="cancel-dispute" color="purple">
        You can withdraw the active dispute if the issue has been resolved
        directly with the other party.
      </ActionInfoBlurb>,
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 lg:px-4">
        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center space-y-4 space-x-4 sm:flex-row sm:space-y-0">
            <Button
              variant="outline"
              onClick={() => navigateTo("/agreements")}
              className="w-fit self-start border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agreements
            </Button>

            <div className="flex items-center space-x-2">
              {disputeStatus !== "Pending Payment" ? (
                <span
                  className={`font-medium ${getStatusColor(agreement.status)} rounded-full px-4 py-1 text-sm`}
                >
                  {agreement.status.replace("_", " ")}
                </span>
              ) : (
                <span className="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-4 py-1 text-sm font-medium text-yellow-400">
                  Dispute Pending Payment
                </span>
              )}

              {agreement._raw?.disputes?.length > 0 &&
                disputeStatus !== "Pending Payment" &&
                rejectDisputeStatus !== "Pending Payment" && (
                  <AppLink
                    to={`/disputes/${agreement._raw.disputes[0].disputeId}`}
                    className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/20 hover:text-purple-200"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    View Dispute
                  </AppLink>
                )}
            </div>
          </div>

          <div className="flex space-x-2 self-center text-xs text-cyan-400/60 sm:self-end">
            {isRefreshing && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overview card */}
            <div className="card-cyan rounded-xl px-4 py-6 sm:px-4">
              <div className="mb-6 flex flex-col items-start justify-between sm:flex-row">
                <div>
                  <h1 className="mb-2 max-w-[30rem] text-2xl font-bold text-white lg:text-[1.5rem]">
                    {agreement.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-cyan-300">
                    {agreement.type === "Public" ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public Agreement</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Private Agreement</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-cyan-300">Created by</div>
                  <div className="flex items-center justify-end gap-2 font-medium text-white">
                    <UserAvatar
                      userId={
                        agreement.creatorUserId || agreement.creator || ""
                      }
                      avatarId={agreement.creatorAvatarId || null}
                      username={agreement.creator || ""}
                      size="sm"
                    />
                    <AppLink
                      to={`/profile/${(agreement.creator || "").replace(/^@/, "")}`}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200 hover:underline sm:text-base"
                    >
                      {formatCreatorUsername(agreement.creator)}
                    </AppLink>
                    {isCreator && (
                      <VscVerifiedFilled className="size-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Key details grid */}
              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[.6fr_.4fr]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-1 md:space-x-3">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Parties</div>
                      <div className="flex items-center gap-2 text-white">
                        {[
                          {
                            username: agreement.createdBy,
                            userId: agreement.createdByUserId,
                            avatarId: agreement.createdByAvatarId,
                            isMe: isFirstParty,
                          },
                          {
                            username: agreement.counterparty,
                            userId: agreement.counterpartyUserId,
                            avatarId: agreement.counterpartyAvatarId,
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
                              <AppLink
                                to={`/profile/${encodeURIComponent(party.username.replace(/^@/, ""))}`}
                                className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline sm:text-base"
                              >
                                {party.username.startsWith("@0x")
                                  ? `${party.username.slice(1, 7)}..${party.username.slice(-4)}`
                                  : party.username}
                              </AppLink>
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
                        {formatDate(agreement.dateCreated)}
                      </div>
                    </div>
                  </div>

                  {agreement.includeFunds === "yes" && agreement.useEscrow && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Amount</div>
                        <div className="text-white">
                          {agreement.amount} {agreement.token}
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
                        {agreement.deadline
                          ? formatDate(agreement.deadline)
                          : "Not set"}
                      </div>
                    </div>
                  </div>
                  {completionDate && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-sm text-cyan-300">
                          Completed On
                        </div>
                        <div className="text-white">
                          {formatDate(completionDate)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-cyan-300">
                        Agreement Type
                      </div>
                      <div className="text-white">{agreement.type}</div>
                    </div>
                  </div>
                  {agreement.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Escrow Used</div>
                        <div className="text-white">
                          {agreement.useEscrow ? "Yes" : "No"}
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
                  <p className="leading-relaxed whitespace-pre-line text-white/80">
                    {agreement.description}
                  </p>
                </div>
              </div>

              {/* Files */}
              {agreement._raw?.files?.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    Supporting Documents
                  </h3>
                  <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      <h4 className="font-medium text-cyan-300">
                        Preview Files
                      </h4>
                    </div>
                    <EvidenceDisplay
                      evidence={processAgreementFiles(
                        agreement._raw.files,
                        agreement.id,
                      )}
                      color="cyan"
                      onViewEvidence={handleViewEvidence}
                    />
                  </div>
                </div>
              )}

              {/* Financial details */}
              {agreement.includeFunds === "yes" && (
                <div
                  className={`rounded-lg border ${agreement.useEscrow ? "border-emerald-400/30 bg-emerald-500/10" : "border-cyan-400/30 bg-cyan-500/10"} p-4`}
                >
                  <h3
                    className={`mb-3 text-lg font-semibold ${agreement.useEscrow ? "text-emerald-300" : "text-cyan-300"}`}
                  >
                    Financial Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div
                        className={`text-sm ${agreement.useEscrow ? "text-emerald-300" : "text-cyan-300"}`}
                      >
                        Funds Included
                      </div>
                      <div className="text-lg font-semibold text-white">
                        Yes
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-sm ${agreement.useEscrow ? "text-emerald-300" : "text-cyan-300"}`}
                      >
                        Escrow Protection
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {agreement.useEscrow ? "Enabled" : "Not Used"}
                      </div>
                    </div>
                    {agreement.amount && (
                      <div className="md:col-span-2">
                        <div
                          className={`text-sm ${agreement.useEscrow ? "text-emerald-300" : "text-cyan-300"}`}
                        >
                          Amount
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {formatNumberWithCommas(agreement.amount)}{" "}
                          {agreement.token || ""}
                        </div>
                      </div>
                    )}
                    {agreement.useEscrow && agreement.escrowAddress && (
                      <div className="md:col-span-2">
                        <div className="mb-2 text-sm text-emerald-300">
                          Escrow Contract Address
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 rounded bg-black/20 px-2 py-1 font-mono text-sm break-all text-white">
                            {showEscrowAddress
                              ? agreement.escrowAddress
                              : `${agreement.escrowAddress.slice(0, 10)}...${agreement.escrowAddress.slice(-8)}`}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowEscrowAddress(!showEscrowAddress)
                            }
                            className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                          >
                            {showEscrowAddress ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    {!agreement.useEscrow && (
                      <div className="md:col-span-2">
                        <div className="flex items-start gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
                          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
                          <div>
                            <p className="text-sm text-cyan-300">
                              Funds information is for reference only and not
                              secured in escrow.
                            </p>
                            <p className="mt-1 text-xs text-cyan-300/70">
                              The amount and token details help track the
                              financial scope without automated fund handling.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signing status */}
              {signingStatusMessage && agreement.status === "pending" && (
                <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-yellow-300">
                        Signing Status
                      </h4>
                      <p className="mt-1 text-sm text-yellow-200">
                        {signingStatusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dispute info */}
              {agreement._raw?.disputes?.length > 0 &&
                disputeStatus !== "Pending Payment" && (
                  <div className="mt-6 rounded-xl border border-purple-400/60 bg-gradient-to-br from-purple-500/20 to-transparent p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Active Dispute
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
                                      <AppLink
                                        to={`/profile/${disputeInfo.filedBy?.replace(/^@/, "") || ""}`}
                                        className="text-xs font-medium text-purple-200 hover:text-purple-100 hover:underline"
                                      >
                                        {disputeInfo.filedBy.startsWith("0x")
                                          ? formatWalletAddress(
                                              disputeInfo.filedBy,
                                            )
                                          : disputeInfo.filedBy}
                                      </AppLink>
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
                          <AppLink
                            to={`/disputes/${agreement._raw.disputes[0].disputeId}`}
                            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-200 transition-colors hover:bg-purple-500/30 hover:text-white"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Go to Dispute
                          </AppLink>
                        </div>
                      </div>
                      {disputeTriggeredByRejection && (
                        <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
                          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                          <p className="text-sm text-amber-300">
                            This dispute was filed when the delivery was
                            rejected. Please visit the dispute page to view
                            evidence, participate in voting, or see the
                            resolution process.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* ── Action buttons ───────────────────────────────────────────── */}
            {showActions && (
              <div className="card-cyan rounded-xl p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Agreement Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                  {canSign && (
                    <Button
                      variant="neon"
                      className="neon-hover"
                      onClick={handleSignAgreement}
                      disabled={isSigning || isRefreshing}
                    >
                      {isSigning ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Signing...
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          {isCounterparty
                            ? "Sign as Counterparty"
                            : "Sign as First Party"}
                        </>
                      )}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={handleCancelAgreement}
                      disabled={isCancelling || isRefreshing}
                    >
                      {isCancelling ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Cancel Agreement
                        </>
                      )}
                    </Button>
                  )}
                  {canRequestCancellation && (
                    <Button
                      variant="outline"
                      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                      onClick={handleCancelAgreement}
                      disabled={isCancelling || isRefreshing}
                    >
                      {isCancelling ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        <>
                          <Ban className="mr-2 h-4 w-4" />
                          Request Cancellation
                        </>
                      )}
                    </Button>
                  )}
                  {canRespondToCancellation && (
                    <>
                      <Button
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => handleRespondToCancelation(true)}
                        disabled={isRespondingToCancel || isRefreshing}
                      >
                        {isRespondingToCancel ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Accept Cancellation
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleRespondToCancelation(false)}
                        disabled={isRespondingToCancel || isRefreshing}
                      >
                        {isRespondingToCancel ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Reject Cancellation
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  {canMarkDelivered && !isCurrentUserInitiatedDelivery && (
                    <Button
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={handleMarkAsDelivered}
                      disabled={isCompleting || isRefreshing}
                    >
                      {isCompleting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Package className="mr-2 h-4 w-4" />
                          Mark Work as Delivered
                        </>
                      )}
                    </Button>
                  )}
                  {canReviewDelivery && (
                    <>
                      <Button
                        variant="outline"
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={handleConfirmDelivery}
                        disabled={isConfirming || isRefreshing}
                      >
                        {isConfirming ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Accept Delivery
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => setIsRejectModalOpen(true)}
                        disabled={isSubmittingReject || isRefreshing}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Reject Delivery
                      </Button>
                    </>
                  )}
                  {canOpenDispute && (
                    <Button
                      variant="outline"
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      onClick={() => setIsDisputeModalOpen(true)}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Open Dispute
                    </Button>
                  )}
                </div>

                {/* ── Contextual info blurbs ──────────────────────────────── */}
                {actionInfoItems.length > 0 && (
                  <div className="mt-4 space-y-2">{actionInfoItems}</div>
                )}

                {cancellationPending && (
                  <div className="mt-4 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
                      <div>
                        <h4 className="font-medium text-orange-300">
                          Cancellation Request Pending
                        </h4>
                        <p className="mt-1 text-sm text-orange-200">
                          {isCurrentUserInitiatedCancellation
                            ? "You have requested cancellation. Waiting for the other party to respond."
                            : "The other party has requested cancellation. Waiting for your response."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery status */}
            {agreement.status === "pending_approval" && isParticipant && (
              <div className="card-cyan rounded-xl p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Delivery Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-orange-400" />
                    <div className="font-medium text-white">
                      Delivery Submitted
                    </div>
                  </div>
                  <div className="rounded-lg bg-orange-500/10 p-3 text-sm text-orange-300">
                    {deliveryInitiatedBy === "user"
                      ? "You have marked your work as delivered and are waiting for the other party to review it."
                      : deliveryInitiatedBy === "other"
                        ? "The other party has marked their work as delivered and is waiting for your review. You can accept the delivery or reject it (which will open a dispute)."
                        : "Work has been marked as delivered. Please review and accept or reject the delivery."}
                  </div>
                </div>
              </div>
            )}

            {/* Payment action */}
            {agreement.status === "disputed" &&
              isParticipant &&
              disputeStatus === "Pending Payment" &&
              getDisputeFiledByFromTimeline(agreement, user) && (
                <div className="card-cyan rounded-xl p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Payment Action Required
                  </h3>
                  <Button
                    variant="outline"
                    className="w-fit border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
                    onClick={handleCompletePayment}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Complete Payment for Dispute
                  </Button>
                  <p className="mt-3 text-sm text-yellow-300/80">
                    Payment required to activate your dispute. Click the button
                    above to complete the transaction.
                  </p>
                </div>
              )}

            {/* Timeline */}
            <AgreementTimeline
              agreement={agreement}
              isCreator={isCreator}
              disputeStatus={disputeStatus}
              signingDate={signingDate}
              deliverySubmittedDate={deliverySubmittedDate}
              completionDate={completionDate}
              cancellationDate={cancellationDate}
            />
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <AgreementSidebar
            agreement={agreement}
            isFirstParty={isFirstParty}
            isCounterparty={isCounterparty}
            isCreator={isCreator}
            disputeStatus={disputeStatus}
            signingDate={signingDate}
          />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {isDisputeModalOpen && disputeStatus !== "Pending Payment" && (
        <OpenDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          agreement={agreement}
          onDisputeCreated={handleDisputeCreated}
          onPaidDisputeCreated={handlePaidDisputeCreated}
        />
      )}

      <EvidenceViewer
        isOpen={evidenceViewerOpen}
        onClose={() => setEvidenceViewerOpen(false)}
        selectedEvidence={selectedEvidence}
      />

      {isRejectModalOpen && !disputeStatus && !rejectDisputeStatus && (
        <RejectDeliveryModal
          isOpen={isRejectModalOpen}
          onClose={() => {
            setIsRejectModalOpen(false);
            setRejectClaim("");
          }}
          onConfirm={handleConfirmReject}
          claim={rejectClaim}
          setClaim={setRejectClaim}
          isSubmitting={isSubmittingReject}
          agreement={agreement}
        />
      )}

      {pendingModalState.isOpen &&
        (disputeStatus === "Pending Payment" ||
          rejectDisputeStatus === "Pending Payment") &&
        getDisputeFiledByFromTimeline(agreement, user) && (
          <PendingDisputeModal
            key={`pending-modal-${pendingModalState.votingId}`}
            isOpen={pendingModalState.isOpen}
            onClose={() =>
              setPendingModalState({
                isOpen: false,
                votingId: null,
                flow: "reject",
                chainId: null,
              })
            }
            votingId={
              pendingModalState.votingId ?? agreement?.disputeVotingId ?? 0
            }
            agreement={agreement}
            onDisputeCreated={handleDisputeCreated}
            flow={pendingModalState.flow}
            chainId={pendingModalState.chainId ?? disputeChainId ?? 0}
          />
        )}
    </div>
  );
}
