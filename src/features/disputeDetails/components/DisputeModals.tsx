import type {
  EvidenceItem,
  DisputeRow,
  VoteData,
  UploadedFile,
} from "../../../types";
import PlaintiffReplyModal from "../../../components/disputes/modals/PlaintiffReplyModal";
import { DefendantReplyModal } from "../../../components/disputes/modals/DefendantReplyModal";
import EvidenceViewer from "../../../components/disputes/modals/EvidenceViewer";
import { VoteModal } from "../../../components/disputes/modals/VoteModal";
import VoteOutcomeModal from "../../../components/disputes/modals/VoteOutcomeModal";
import SettleConfirmationModal from "../../../components/disputes/modals/SettleConfirmationModal";
import type { NavigateFunction } from "react-router-dom";

interface Props {
  id: string;
  dispute: DisputeRow;
  // Evidence viewer
  evidenceViewerOpen: boolean;
  selectedEvidence: EvidenceItem | null;
  onCloseEvidenceViewer: () => void;
  // Vote outcome
  voteOutcomeModalOpen: boolean;
  onCloseVoteOutcomeModal: () => void;
  // Vote modal
  voteModalOpen: boolean;
  voteData: VoteData;
  hasVoted: boolean;
  isJudge: boolean;
  onCloseVoteModal: () => void;
  onVoteChange: (
    choice: "plaintiff" | "defendant" | "dismissed" | null,
    comment: string,
  ) => void;
  onCastVote: () => Promise<void>;
  canUserVote: () => Promise<{
    canVote: boolean;
    reason?: string;
    hasVoted?: boolean;
    isJudge?: boolean;
  }>;
  isCurrentUserPlaintiff: () => boolean;
  isCurrentUserDefendant: () => boolean;
  // Reply modals
  plaintiffReplyModalOpen: boolean;
  onClosePlaintiffModal: () => void;
  onPlaintiffReply: (
    title: string,
    description: string,
    claim: string,
    requestKind: number,
    files: UploadedFile[],
    witnesses: string[],
  ) => Promise<void>;
  defendantReplyModalOpen: boolean;
  onCloseDefendantModal: () => void;
  onDefendantReply: (
    description: string,
    files: UploadedFile[],
    witnesses: string[],
  ) => Promise<void>;
  // Settle modal
  settleModalOpen: boolean;
  onCloseSettleModal: () => void;
  onConfirmSettle: () => Promise<void>;
  onConfirmOnchainSettle: () => Promise<void>;
  settlingDispute: boolean;
  isPending: boolean;
  navigate: NavigateFunction;
}

export const DisputeModals = ({
  id,
  dispute,
  evidenceViewerOpen,
  selectedEvidence,
  onCloseEvidenceViewer,
  voteOutcomeModalOpen,
  onCloseVoteOutcomeModal,
  voteModalOpen,
  voteData,
  hasVoted,
  isJudge,
  onCloseVoteModal,
  onVoteChange,
  onCastVote,
  canUserVote,
  isCurrentUserPlaintiff,
  isCurrentUserDefendant,
  plaintiffReplyModalOpen,
  onClosePlaintiffModal,
  onPlaintiffReply,
  defendantReplyModalOpen,
  onCloseDefendantModal,
  onDefendantReply,
  settleModalOpen,
  onCloseSettleModal,
  onConfirmSettle,
  onConfirmOnchainSettle,
  settlingDispute,
  isPending,
  navigate,
}: Props) => (
  <>
    <EvidenceViewer
      isOpen={evidenceViewerOpen}
      onClose={onCloseEvidenceViewer}
      selectedEvidence={selectedEvidence}
    />

    <VoteOutcomeModal
      isOpen={voteOutcomeModalOpen}
      onClose={onCloseVoteOutcomeModal}
      disputeId={parseInt(id)}
    />

    <VoteModal
      isOpen={voteModalOpen}
      onClose={onCloseVoteModal}
      voteData={voteData}
      onVoteChange={onVoteChange}
      onCastVote={onCastVote}
      hasVoted={hasVoted}
      isSubmitting={false}
      dispute={dispute}
      canUserVote={canUserVote}
      isCurrentUserPlaintiff={isCurrentUserPlaintiff}
      isCurrentUserDefendant={isCurrentUserDefendant}
      isJudge={isJudge}
    />

    <PlaintiffReplyModal
      isOpen={plaintiffReplyModalOpen}
      onClose={onClosePlaintiffModal}
      dispute={dispute}
      onSubmit={onPlaintiffReply}
      navigate={navigate}
    />

    <DefendantReplyModal
      isOpen={defendantReplyModalOpen}
      onClose={onCloseDefendantModal}
      dispute={dispute}
      onSubmit={onDefendantReply}
      navigate={navigate}
    />

    {dispute.agreement?.type === 1 && (
      <SettleConfirmationModal
        isOpen={settleModalOpen}
        onClose={onCloseSettleModal}
        onConfirm={onConfirmSettle}
        disable={settlingDispute}
        disputeTitle={dispute.title}
      />
    )}
    {dispute.agreement?.type === 2 && (
      <SettleConfirmationModal
        isOpen={settleModalOpen}
        onClose={onCloseSettleModal}
        onConfirm={onConfirmOnchainSettle}
        disable={isPending}
        disputeTitle={dispute.title}
      />
    )}
  </>
);
