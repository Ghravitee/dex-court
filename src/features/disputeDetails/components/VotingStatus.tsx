import { Loader2, Shield, Vote } from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { DisputeRow } from "../../../types";
import type { DisputeChatRole } from "@/pages/DisputeChat/types";

interface Props {
  dispute: DisputeRow | null;
  votingStatusLoading: boolean;
  getUserRole: () => DisputeChatRole | undefined;
  isUserJudge: () => boolean;
  isUserCommunity: () => boolean;
  canVote: boolean;
  reason?: string;
  hasVoted: boolean;
  handleOpenVoteModal: () => void;
  isVoteStarted: boolean;
  tier?: number;
  weight?: number;
}

export const VotingStatus = ({
  dispute,
  votingStatusLoading,
  getUserRole,
  isUserJudge,
  isUserCommunity,
  canVote,
  reason,
  hasVoted,
  handleOpenVoteModal,
  tier,
  weight,
}: Props) => {
  if (!dispute || dispute.status !== "Vote in Progress") return null;

  if (votingStatusLoading) {
    return (
      <div className="animate-fade-in card-cyan rounded-2xl p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          <p className="text-sm text-cyan-200">Checking voting status...</p>
        </div>
      </div>
    );
  }

  const userRole = getUserRole();
  const isJudge = isUserJudge();
  const isCommunity = isUserCommunity();
  const isParty = userRole === "plaintiff" || userRole === "defendant";

  if (isParty) {
    return (
      <div className="animate-fade-in card-amber mx-auto w-fit rounded-2xl p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <Shield className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-bold text-amber-300">
              Case Participant
            </h3>
            <p className="text-sm text-amber-200">
              {userRole === "plaintiff"
                ? "As the plaintiff, you cannot vote in your own dispute."
                : "As the defendant, you cannot vote in your own dispute."}
            </p>
            <p className="mt-2 text-xs text-amber-300/70">
              Voting is for community members and judges only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="animate-fade-in card-emerald mx-auto w-fit rounded-2xl p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <h3 className="mb-1 text-lg font-bold text-emerald-300">
              Vote Submitted!
            </h3>
            <p className="text-sm text-emerald-200">
              Thank you for participating in this dispute.
              {isJudge && (
                <span className="mt-1 block text-emerald-300">
                  ⚖️ Your vote carries judge weight
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-emerald-300/70">
              Results will be revealed when voting ends.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (canVote) {
    return (
      <div className="animate-fade-in card-cyan mx-auto w-fit rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20">
            <Vote className="h-6 w-6 text-cyan-300" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <h3 className="mb-1 text-lg font-bold text-cyan-300">
              Cast Your Vote
            </h3>
            <p className="text-center text-sm text-cyan-200">
              Your vote will help resolve this dispute fairly.
              {tier && (
                <span className="mt-1 block text-cyan-300">
                  Tier {tier} Voter
                </span>
              )}
              {weight && weight > 1 && (
                <span className="mt-1 block font-semibold text-cyan-300">
                  Voting Weight: {weight}x
                </span>
              )}
              {isJudge && (
                <span className="mt-1 block font-semibold text-cyan-300">
                  Judge Vote - Carries Higher Weight
                </span>
              )}
              {isCommunity && (
                <span className="mt-1 block text-cyan-300">Community Vote</span>
              )}
            </p>
          </div>
          <Button
            variant="neon"
            className="neon-hover mt-2"
            onClick={handleOpenVoteModal}
            size="lg"
          >
            <Vote className="mr-2 h-4 w-4" />
            Cast {isJudge ? "Judge" : "Community"} Vote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in card-amber mx-auto rounded-2xl p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
          <Shield className="h-6 w-6 text-amber-300" />
        </div>
        <div>
          <h3 className="mb-1 text-lg font-bold text-amber-300">
            Voting in Progress
          </h3>
          <p className="text-sm text-amber-200">
            This dispute is currently being voted on by eligible community
            members.
          </p>
          {reason && <p className="mt-2 text-xs text-amber-300/70">{reason}</p>}
        </div>
      </div>
    </div>
  );
};
