import {
  ArrowLeft,
  Vote,
  Scale,
  BarChart3,
  Gavel,
  Users,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import type { DisputeRow } from "../../../types";
import { DisputeStatusBadge } from "./DisputeStatusBadge";

interface Props {
  dispute: DisputeRow;
  isUserJudge: () => boolean;
  isUserCommunity: () => boolean;
  isCurrentUserPlaintiff: () => boolean;
  isCurrentUserDefendant: () => boolean;
  canVote: boolean;
  hasVoted: boolean;
  isVoteStarted: boolean;
  canFinalize: boolean;
  escalating: boolean;
  finalizing: boolean;
  settlingDispute: boolean;
  isPending: boolean;
  pendingTransactionType: "settle" | "startVote" | null;
  escrowContractAddress: `0x${string}` | null;
  onOpenVoteModal: () => void;
  onOpenVoteOutcomeModal: () => void;
  onEscalateToVote: () => void;
  onFinalizeVote: () => void;
  onOpenSettleModal: () => void;
}

export const DisputeHeader = ({
  dispute,
  isUserJudge,
  isUserCommunity,
  isCurrentUserPlaintiff,
  isCurrentUserDefendant,
  canVote,
  hasVoted,
  isVoteStarted,
  canFinalize,
  escalating,
  finalizing,
  settlingDispute,
  isPending,
  pendingTransactionType,
  escrowContractAddress,
  onOpenVoteModal,
  onOpenVoteOutcomeModal,
  onEscalateToVote,
  onFinalizeVote,
  onOpenSettleModal,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row">
      {/* Left: back + status + role badges */}
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
        <Button
          onClick={() => navigate("/disputes")}
          variant="outline"
          className="w-fit self-start border-white/15 text-cyan-200 hover:bg-cyan-500/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <p className="flex items-center gap-1">
            Back<span className="hidden sm:block"> to Disputes</span>
          </p>
        </Button>

        <div className="flex items-center gap-2">
          <DisputeStatusBadge status={dispute.status} />
          {isUserJudge() && (
            <span className="flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
              <Gavel className="h-3 w-3" />
              Judge
            </span>
          )}
          {isUserCommunity() && (
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
              <Users className="h-3 w-3" />
              <p className="block">Community</p>
            </span>
          )}
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        {(dispute.status === "Settled" || dispute.status === "Dismissed") && (
          <Button
            variant="neon"
            className="neon-hover"
            onClick={onOpenVoteOutcomeModal}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            See Vote Outcome
          </Button>
        )}

        {dispute.status === "Pending" && (
          <Button
            variant="outline"
            className="hidden border-purple-400/30 text-purple-300 hover:bg-purple-500/10"
            onClick={onEscalateToVote}
            disabled={escalating}
          >
            {escalating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Vote className="mr-2 h-4 w-4" />
            )}
            {escalating ? "Escalating..." : "Escalate to Vote"}
          </Button>
        )}

        {canFinalize && (
          <Button
            variant="outline"
            className="hidden border-purple-400/30 text-purple-300 hover:bg-purple-500/10"
            onClick={onFinalizeVote}
            disabled={finalizing}
          >
            {finalizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Gavel className="mr-2 h-4 w-4" />
            )}
            {finalizing ? "Finalizing..." : "Finalize Votes"}
          </Button>
        )}

        <div className="flex flex-wrap gap-3">
          {dispute.status === "Vote in Progress" &&
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
                Cast {isUserJudge() ? "Judge" : "Community"} Vote
              </Button>
            )}

          <div className="flex flex-wrap gap-2">
            {/* Escrow settle (hidden per original) */}
            {dispute.status === "Pending" &&
              isCurrentUserPlaintiff() &&
              dispute.agreement?.type === 2 && (
                <Button
                  variant="outline"
                  className="hidden border-green-400/30 text-green-300 hover:bg-green-500/10"
                  onClick={onOpenSettleModal}
                  disabled={
                    !escrowContractAddress ||
                    (pendingTransactionType === "settle" && isPending)
                  }
                >
                  {pendingTransactionType === "settle" && isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Scale className="mr-2 h-4 w-4" />
                  )}
                  {pendingTransactionType === "settle" && isPending
                    ? "Settling..."
                    : !escrowContractAddress
                      ? "Loading contract..."
                      : "Settle Escrow Dispute"}
                </Button>
              )}

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
          </div>
        </div>

        {dispute.status === "Vote in Progress" &&
          isVoteStarted &&
          hasVoted &&
          !isCurrentUserPlaintiff() &&
          !isCurrentUserDefendant() && (
            <div className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2">
              <span className="text-emerald-300">
                ✅ {isUserJudge() ? "Judge " : ""}Vote Submitted
                {isUserJudge() && " ⚖️"}
              </span>
            </div>
          )}
      </div>
    </div>
  );
};
