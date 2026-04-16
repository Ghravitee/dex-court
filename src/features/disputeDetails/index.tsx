import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import type { EvidenceItem } from "@/types";
import DisputeChat from "../../pages/DisputeChat";
import { DisputeModals } from "./components/DisputeModals";

import { useDisputeData } from "./hooks/useDisputeData";
import { useDisputeRole } from "./hooks/useDisputeRole";
import { useDisputeActions } from "./hooks/useDisputeActions";
import { processEvidence } from "./utils/formatter";

import { LoadingScreen } from "./components/LoadingScreen";
import { NotFoundScreen } from "./components/NotFoundScreen";
import { DisputeHeader } from "./components/DisputeHeader";
import { DisputeOverviewCard } from "./components/DisputeOverviewCard";
import { SourceAgreementCard } from "./components/SourceAgreementCard";
import { VotingStatus } from "./components/VotingStatus";
import { PlaintiffColumn } from "./components/PlaintiffColumn";
import { DefendantColumn } from "./components/DefendantColumn";
import { ActionBar } from "./components/ActionBar";
import { devLog } from "../../utils/logger";

export default function DisputeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ─── Data ──────────────────────────────────────────────────────────────────
  const {
    dispute,
    setDispute,
    loading,
    escrowContractAddress,
    refreshDispute,
  } = useDisputeData(id);

  // ─── Role ──────────────────────────────────────────────────────────────────
  const {
    isUserJudge,
    isUserAdmin,
    isUserCommunity,
    isCurrentUserPlaintiff,
    isCurrentUserDefendant,
    getUserRole,
  } = useDisputeRole(dispute);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const {
    isPending,
    hasVoted,
    canVote,
    reason,
    votingStatusLoading,
    tier,
    weight,
    voteData,
    isVoteStarted,
    canFinalize,
    handleVoteChange,
    handleCastVote,
    handleDefendantReply,
    handlePlaintiffReply,
    handleOnchainSettleDispute,
    handleSettleDispute,
    handleEscalateToVote,
    handleFinalizeVote,
    canUserVote,
    escalating,
    finalizing,
    settlingDispute,
    pendingTransactionType,
  } = useDisputeActions({
    id,
    dispute,
    escrowContractAddress,
    refreshDispute: async (dId) => {
      const updated = await refreshDispute(dId);
      setDispute(updated);
      return updated;
    },
    isUserAdmin,
    isUserJudge,
  });

  // ─── Local UI state ────────────────────────────────────────────────────────
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    null,
  );
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [voteOutcomeModalOpen, setVoteOutcomeModalOpen] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [defendantReplyModalOpen, setDefendantReplyModalOpen] = useState(false);
  const [plaintiffReplyModalOpen, setPlaintiffReplyModalOpen] = useState(false);

  const handleViewEvidence = useCallback((evidence: EvidenceItem) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
  }, []);

  const handleOpenVoteModal = useCallback(() => {
    setVoteModalOpen(true);
  }, []);

  // ─── Early returns ─────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!dispute) return <NotFoundScreen />;

  // ─── Derived data ──────────────────────────────────────────────────────────
  const safeEvidence = processEvidence(
    dispute.evidence || [],
    dispute.id || id || "",
  );

  devLog("dispute", dispute);
  const defendantEvidence = dispute.defendantResponse
    ? processEvidence(
        dispute.defendantResponse.evidence || [],
        dispute.id || id || "",
      )
    : [];
  const plaintiffWitnesses =
    dispute.witnesses?.plaintiff?.map((w) => w.username) || [];
  const defendantWitnesses =
    dispute.witnesses?.defendant?.map((w) => w.username) || [];
  const safeDescription = dispute.description || "No description provided.";
  const safeClaim = dispute.claim || "No claim specified.";

  return (
    <div className="animate-fade-in space-y-6 py-6 text-white">
      {/* Top bar */}
      <DisputeHeader
        dispute={dispute}
        isUserJudge={isUserJudge}
        isUserCommunity={isUserCommunity}
        isCurrentUserPlaintiff={isCurrentUserPlaintiff}
        isCurrentUserDefendant={isCurrentUserDefendant}
        canVote={canVote}
        hasVoted={hasVoted}
        isVoteStarted={isVoteStarted()}
        canFinalize={canFinalize}
        escalating={escalating}
        finalizing={finalizing}
        settlingDispute={settlingDispute}
        isPending={isPending}
        pendingTransactionType={pendingTransactionType}
        escrowContractAddress={escrowContractAddress}
        onOpenVoteModal={handleOpenVoteModal}
        onOpenVoteOutcomeModal={() => setVoteOutcomeModalOpen(true)}
        onEscalateToVote={handleEscalateToVote}
        onFinalizeVote={handleFinalizeVote}
        onOpenSettleModal={() => setSettleModalOpen(true)}
      />

      {/* Overview + agreement */}
      <div className="flex grid-cols-2 flex-col gap-6 lg:grid">
        <DisputeOverviewCard
          dispute={dispute}
          isCurrentUserPlaintiff={isCurrentUserPlaintiff}
          isCurrentUserDefendant={isCurrentUserDefendant}
        />
        {dispute.agreement && (
          <SourceAgreementCard agreement={dispute.agreement} />
        )}
      </div>

      {/* Voting status banner */}
      {dispute.status === "Vote in Progress" && (
        <VotingStatus
          dispute={dispute}
          votingStatusLoading={votingStatusLoading}
          getUserRole={getUserRole}
          isUserJudge={isUserJudge}
          isUserCommunity={isUserCommunity}
          canVote={canVote}
          reason={reason}
          hasVoted={hasVoted}
          handleOpenVoteModal={handleOpenVoteModal}
          isVoteStarted={isVoteStarted()}
          tier={tier}
          weight={weight}
        />
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlaintiffColumn
          dispute={dispute}
          safeEvidence={safeEvidence}
          plaintiffWitnesses={plaintiffWitnesses}
          safeDescription={safeDescription}
          safeClaim={safeClaim}
          isCurrentUserPlaintiff={isCurrentUserPlaintiff}
          onViewEvidence={handleViewEvidence}
        />
        <DefendantColumn
          dispute={dispute}
          defendantEvidence={defendantEvidence}
          defendantWitnesses={defendantWitnesses}
          isCurrentUserDefendant={isCurrentUserDefendant}
          onViewEvidence={handleViewEvidence}
        />
      </div>

      {/* Action bar */}
      <ActionBar
        dispute={dispute}
        isCurrentUserPlaintiff={isCurrentUserPlaintiff}
        isCurrentUserDefendant={isCurrentUserDefendant}
        canVote={canVote}
        hasVoted={hasVoted}
        isVoteStarted={isVoteStarted()}
        isPending={isPending}
        settlingDispute={settlingDispute}
        onOpenPlaintiffModal={() => setPlaintiffReplyModalOpen(true)}
        onOpenDefendantModal={() => setDefendantReplyModalOpen(true)}
        onOpenSettleModal={() => setSettleModalOpen(true)}
        onOpenVoteModal={handleOpenVoteModal}
      />

      {/* Chat */}
      <div className="mt-8">
        <DisputeChat disputeId={parseInt(id!)} userRole={getUserRole()} />
      </div>

      {/* ─── Modals ────────────────────────────────────────────────────────── */}
      <DisputeModals
        id={id!}
        dispute={dispute}
        evidenceViewerOpen={evidenceViewerOpen}
        selectedEvidence={selectedEvidence}
        onCloseEvidenceViewer={() => setEvidenceViewerOpen(false)}
        voteOutcomeModalOpen={voteOutcomeModalOpen}
        onCloseVoteOutcomeModal={() => setVoteOutcomeModalOpen(false)}
        voteModalOpen={voteModalOpen}
        voteData={voteData}
        hasVoted={hasVoted}
        isJudge={isUserJudge()}
        onCloseVoteModal={() => setVoteModalOpen(false)}
        onVoteChange={handleVoteChange}
        onCastVote={handleCastVote}
        canUserVote={canUserVote}
        isCurrentUserPlaintiff={isCurrentUserPlaintiff}
        isCurrentUserDefendant={isCurrentUserDefendant}
        plaintiffReplyModalOpen={plaintiffReplyModalOpen}
        onClosePlaintiffModal={() => setPlaintiffReplyModalOpen(false)}
        onPlaintiffReply={handlePlaintiffReply}
        defendantReplyModalOpen={defendantReplyModalOpen}
        onCloseDefendantModal={() => setDefendantReplyModalOpen(false)}
        onDefendantReply={handleDefendantReply}
        settleModalOpen={settleModalOpen}
        onCloseSettleModal={() => setSettleModalOpen(false)}
        onConfirmSettle={handleSettleDispute}
        onConfirmOnchainSettle={handleOnchainSettleDispute}
        settlingDispute={settlingDispute}
        isPending={isPending}
        navigate={navigate}
      />
    </div>
  );
}
