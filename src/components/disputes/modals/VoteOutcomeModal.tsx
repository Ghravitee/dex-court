// VoteOutcomeModal.tsx
import { disputeService } from "../../../services/disputeServices";
import { Button } from "../../../components/ui/button";
import { BarChart3, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { calculateVoteResults } from "../../../lib/voteCalculations";

interface VoteOutcomeData {
  winner: "plaintiff" | "defendant" | "dismissed";
  judgeVotes: number;
  communityVotes: number;
  judgePct: number;
  communityPct: number;
  comments: Array<{
    handle: string;
    text: string;
  }>;
}

interface VoteOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: number;
  voteOutcome?: VoteOutcomeData; // Optional prop if you want to pass data directly
}

// Vote Outcome Modal Component
const VoteOutcomeModal = ({
  isOpen,
  onClose,
  disputeId,
  voteOutcome: passedVoteOutcome,
}: VoteOutcomeModalProps) => {
  const [voteOutcome, setVoteOutcome] = useState<VoteOutcomeData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVoteOutcome = useCallback(async () => {
    setLoading(true);
    try {
      const outcome = await disputeService.getVoteOutcome(disputeId);
      setVoteOutcome(outcome);
    } catch (error) {
      console.error("Failed to fetch vote outcome:", error);
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  // Fetch vote outcome data if not passed as prop
  useEffect(() => {
    if (isOpen && !passedVoteOutcome) {
      fetchVoteOutcome();
    } else if (passedVoteOutcome) {
      setVoteOutcome(passedVoteOutcome);
    }
  }, [isOpen, disputeId, passedVoteOutcome, fetchVoteOutcome]);

  // Calculate vote results only when voteOutcome is available
  const voteResults = voteOutcome
    ? calculateVoteResults(
        voteOutcome.judgeVotes,
        voteOutcome.communityVotes,
        voteOutcome.judgePct,
        voteOutcome.communityPct,
        voteOutcome.winner,
      )
    : null;

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass card-cyan relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
            onClick={handleModalClick}
          >
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-2xl">⏳</div>
                <div className="text-lg text-cyan-300">
                  Loading vote results...
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show error state if no data
  if (!voteOutcome || !voteResults) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass card-cyan relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
            onClick={handleModalClick}
          >
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-2xl">❌</div>
                <div className="text-lg text-red-400">
                  Failed to load vote results
                </div>
                <Button
                  variant="outline"
                  className="mt-4 border-cyan-400 text-cyan-300"
                  onClick={fetchVoteOutcome}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Destructure voteOutcome here, after we've confirmed it's not null
  const {
    winner,
    judgeVotes,
    communityVotes,
    judgePct,
    communityPct,
    comments,
  } = voteOutcome;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-400/30 bg-emerald-500/10 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-300" />
              <h3 className="text-xl font-semibold text-emerald-300">
                Vote Outcome - Case Settled
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-6 text-center">
                <div className="mb-2 text-lg text-emerald-200">
                  Final Verdict
                </div>
                <div
                  className={`mb-2 text-2xl font-bold ${
                    winner === "plaintiff"
                      ? "text-cyan-300"
                      : winner === "defendant"
                        ? "text-pink-300"
                        : "text-yellow-300"
                  }`}
                >
                  {winner === "plaintiff"
                    ? "Plaintiff Wins"
                    : winner === "defendant"
                      ? "Defendant Wins"
                      : "Case Dismissed"}
                </div>
                <div className="text-emerald-200">
                  {voteResults.winPct}% weighted majority
                </div>
              </div>

              {/* Voting Breakdown */}
              <div className="space-y-4">
                <div className="text-lg font-medium text-white/90">
                  Voting Breakdown
                </div>

                {/* Judges Section */}
                <div className="mb-4">
                  <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                    <span>Judges — {judgeVotes} votes</span>
                    <span>{judgePct}% favor Plaintiff</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-800"
                      initial={{ width: 0 }}
                      animate={{ width: `${judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff: {voteResults.plaintiffJudgeVotes} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant: {voteResults.defendantJudgeVotes} votes
                    </span>
                  </div>
                </div>

                {/* Community Section */}
                <div className="mb-4">
                  <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                    <span>Community — {communityVotes} votes</span>
                    <span>{communityPct}% favor Plaintiff</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${communityPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-300/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - communityPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff: {voteResults.plaintiffCommunityVotes} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant: {voteResults.defendantCommunityVotes} votes
                    </span>
                  </div>
                </div>

                {/* Weighted Overall Section */}
                <div>
                  <div className="text-muted-foreground mb-2 flex justify-between text-sm">
                    <span>Weighted Total (70% Judges, 30% Community)</span>
                    <span>
                      {voteResults.weightedPlaintiffPct.toFixed(1)}% favor
                      Plaintiff
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${voteResults.weightedPlaintiffPct}%`,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.5,
                      }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-400/60"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${voteResults.weightedDefendantPct}%`,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.5,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff: {voteResults.plaintiffVotes} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant: {voteResults.defendantVotes} votes
                    </span>
                  </div>
                </div>
              </div>

              {/* Judges' Comments */}
              {comments.length > 0 && (
                <div>
                  <div className="mb-4 text-lg font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <div className="text-sm font-medium text-cyan-300">
                          {comment.handle}
                        </div>
                        <div className="mt-2 text-white/80">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoteOutcomeModal;
