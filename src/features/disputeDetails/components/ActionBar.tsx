import { MessageCircle, Scale, Shield, Vote, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { DisputeRow } from "../../../types";
import { hasValidDefendantResponse } from "../utils/formatter";

interface Props {
  dispute: DisputeRow;
  isCurrentUserPlaintiff: () => boolean;
  isCurrentUserDefendant: () => boolean;
  canVote: boolean;
  hasVoted: boolean;
  isVoteStarted: boolean;
  isPending: boolean;
  settlingDispute: boolean;
  onOpenPlaintiffModal: () => void;
  onOpenDefendantModal: () => void;
  onOpenSettleModal: () => void;
  onOpenVoteModal: () => void;
}

export const ActionBar = ({
  dispute,
  isCurrentUserPlaintiff,
  isCurrentUserDefendant,
  canVote,
  hasVoted,
  isVoteStarted,
  isPending,
  settlingDispute,
  onOpenPlaintiffModal,
  onOpenDefendantModal,
  onOpenSettleModal,
  onOpenVoteModal,
}: Props) => (
  <div className="flex flex-wrap gap-3 border-b border-white/10 py-6">
    {/* Plaintiff edit */}
    {dispute.status === "Pending" && isCurrentUserPlaintiff() && (
      <Button
        variant="outline"
        className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
        onClick={onOpenPlaintiffModal}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Edit as Plaintiff
      </Button>
    )}

    {/* Settle escrow */}
    {dispute.status === "Pending" &&
      isCurrentUserPlaintiff() &&
      dispute.agreement?.type === 2 && (
        <Button
          variant="outline"
          className="border-green-400/30 text-green-300 hover:bg-green-500/10"
          onClick={onOpenSettleModal}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Scale className="mr-2 h-4 w-4" />
          )}
          {isPending ? "Settling..." : "Settle Escrow Dispute"}
        </Button>
      )}

    {/* Settle reputational */}
    {dispute.status === "Pending" &&
      isCurrentUserPlaintiff() &&
      dispute.agreement?.type === 1 && (
        <Button
          variant="outline"
          className="border-green-400/30 text-green-300 hover:bg-green-500/10"
          onClick={onOpenSettleModal}
          disabled={settlingDispute}
        >
          {settlingDispute ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Scale className="mr-2 h-4 w-4" />
          )}
          {settlingDispute ? "Settling..." : "Settle Rep Dispute"}
        </Button>
      )}

    {/* Defendant respond / edit */}
    {dispute.status === "Pending" &&
      isCurrentUserDefendant() &&
      !hasValidDefendantResponse(dispute.defendantResponse) && (
        <Button
          variant="outline"
          className="ml-auto border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
          onClick={onOpenDefendantModal}
        >
          <Shield className="mr-2 h-4 w-4" />
          Respond as Defendant
        </Button>
      )}

    {dispute.status === "Pending" &&
      isCurrentUserDefendant() &&
      hasValidDefendantResponse(dispute.defendantResponse) && (
        <Button
          variant="outline"
          className="ml-auto border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
          onClick={onOpenDefendantModal}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Edit as Defendant
        </Button>
      )}

    {/* Cast vote */}
    {dispute.status === "Vote in Progress" &&
      isVoteStarted &&
      canVote &&
      !hasVoted &&
      !isCurrentUserPlaintiff() &&
      !isCurrentUserDefendant() && (
        <Button
          variant="neon"
          className="neon-hover ml-auto"
          onClick={onOpenVoteModal}
        >
          <Vote className="mr-2 h-4 w-4" />
          Cast Vote
        </Button>
      )}

    {/* Voted indicator */}
    {dispute.status === "Vote in Progress" &&
      isVoteStarted &&
      hasVoted &&
      !isCurrentUserPlaintiff() &&
      !isCurrentUserDefendant() && (
        <div className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2">
          <span className="text-emerald-300">✅ Vote Submitted</span>
        </div>
      )}
  </div>
);
