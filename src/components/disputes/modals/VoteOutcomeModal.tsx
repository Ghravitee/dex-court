// VoteOutcomeModal.tsx
import { disputeService } from "../../../services/disputeServices";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
import { BarChart3, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateVoteResults } from "../../../lib/voteCalculations";
import type { VoteOutcomeData } from "@/types";

interface VoteOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: number;
  voteOutcome?: VoteOutcomeData;
}

/** Truncates an Ethereum wallet address to 0x1234…abcd. Leaves normal usernames untouched. */
const formatUsername = (username: string): string => {
  if (/^0x[a-fA-F0-9]{40}$/.test(username)) {
    return `${username.slice(0, 6)}…${username.slice(-4)}`;
  }
  return username.startsWith("@") ? username : `@${username}`;
};

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

  useEffect(() => {
    if (isOpen && !passedVoteOutcome) {
      fetchVoteOutcome();
    } else if (passedVoteOutcome) {
      setVoteOutcome(passedVoteOutcome);
    }
  }, [isOpen, disputeId, passedVoteOutcome, fetchVoteOutcome]);

  const voteResults = voteOutcome ? calculateVoteResults(voteOutcome) : null;

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // ── Judges dismiss percentage (from API percentagesPerGroup, same as DoneCaseCard) ──
  const judgesDismissPct = useMemo(() => {
    return voteOutcome?.percentagesPerGroup?.judges?.dismiss || 0;
  }, [voteOutcome]);

  // ── All community stats computed from raw votesPerGroup counts ──
  // Using the flat communityPct/communityVotes API fields for community caused
  // the bar to be wrong — those fields don't reliably reflect the merged
  // Tier 1 + Tier 2 split. Computing from raw counts is the only safe source.
  const communityMerged = useMemo(() => {
    if (!voteOutcome) {
      return {
        plaintiff: 0,
        defendant: 0,
        dismiss: 0,
        total: 0,
        plaintiffPct: 0,
        defendantPct: 0,
        dismissPct: 0,
      };
    }
    const plaintiff =
      (voteOutcome.votesPerGroup?.communityTierOne?.plaintiff || 0) +
      (voteOutcome.votesPerGroup?.communityTierTwo?.plaintiff || 0);
    const defendant =
      (voteOutcome.votesPerGroup?.communityTierOne?.defendant || 0) +
      (voteOutcome.votesPerGroup?.communityTierTwo?.defendant || 0);
    const dismiss =
      (voteOutcome.votesPerGroup?.communityTierOne?.dismiss || 0) +
      (voteOutcome.votesPerGroup?.communityTierTwo?.dismiss || 0);
    const total = plaintiff + defendant + dismiss;

    // Each percentage computed independently — dismiss votes don't bleed into defendant.
    const plaintiffPct = total > 0 ? Math.round((plaintiff / total) * 100) : 0;
    const defendantPct = total > 0 ? Math.round((defendant / total) * 100) : 0;
    const dismissPct = total > 0 ? 100 - plaintiffPct - defendantPct : 0;

    return {
      plaintiff,
      defendant,
      dismiss,
      total,
      plaintiffPct,
      defendantPct,
      dismissPct,
    };
  }, [voteOutcome]);

  // ── Judges dismiss vote count (for the label below the judges bar) ──
  const judgesDismissVotes = useMemo(() => {
    return voteOutcome?.votesPerGroup?.judges?.dismiss || 0;
  }, [voteOutcome]);

  const totalDismissVotes = judgesDismissVotes + communityMerged.dismiss;

  // ── Plain-English verdict summary — uses communityMerged (raw counts),
  // NOT the flat communityPct/communityVotes API fields which don't reliably
  // reflect the merged Tier 1 + Tier 2 split. This keeps it in sync with DoneCaseCard.
  const verdictSummary = useMemo(() => {
    if (!voteOutcome) return "";

    const { winner, judgeVotes, judgePct } = voteOutcome;

    const isDismissedNoVotes =
      winner === "dismissed" &&
      (judgeVotes || 0) === 0 &&
      communityMerged.total === 0;

    if (isDismissedNoVotes) return "Nobody voted, so the case was closed";
    if (winner === "dismissed")
      return "The case was closed without a clear winner";

    const judgesVoted = (judgeVotes || 0) > 0;
    const communityVoted = communityMerged.total > 0;

    if (!judgesVoted && !communityVoted) {
      return "The case was decided automatically — no one voted";
    }
    if (!judgesVoted) {
      return `Only community members voted — they sided with the ${winner}`;
    }
    if (!communityVoted) {
      return `Only judges voted — they sided with the ${winner}`;
    }

    const judgesFavor = (judgePct || 0) >= 50 ? "plaintiff" : "defendant";
    const communityFavor =
      communityMerged.plaintiffPct >= 50 ? "plaintiff" : "defendant";

    if (judgesFavor === communityFavor) {
      return `Both judges and community members agreed — the ${winner} wins`;
    }
    return `Judges overruled the community — the ${winner} wins`;
  }, [voteOutcome, communityMerged]);

  if (!isOpen) return null;

  // ── Loading state ───────────────────────────────────────────────────────────
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
            className="glass card-cyan relative max-h-[75vh] w-full max-w-2xl overflow-y-auto rounded-2xl"
            onClick={handleModalClick}
          >
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-2xl">⏳</div>
                <div className="text-lg text-blue-300">
                  Loading vote results...
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Error / no-data state ───────────────────────────────────────────────────
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
            className="glass card-cyan relative max-h-[75vh] w-full max-w-2xl overflow-y-auto rounded-2xl"
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
                  className="mt-4 border-blue-400 text-blue-300"
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

  const {
    winner,
    judgeVotes,
    // communityVotes,
    judgePct,
    // communityPct,
    comments,
  } = voteOutcome;

  const judgesVoted = (judgeVotes || 0) > 0;
  const communityVoted = communityMerged.total > 0;
  const hasAnyVotes = judgesVoted || communityVoted;

  // Judges defendant % = whatever remains after plaintiff + dismiss.
  const judgesDefendantPct = 100 - (judgePct || 0) - judgesDismissPct;

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
          className="glass card-cyan relative max-h-[75vh] w-full max-w-2xl overflow-y-auto rounded-2xl"
          onClick={handleModalClick}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-emerald-400/30 bg-emerald-500/10 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-300" />
              <h3 className="text-xl font-semibold text-emerald-300">
                Vote Outcome — Case Settled
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

          {/* ── Scrollable content ── */}
          <div className="p-6">
            <div className="space-y-6">
              {/* ── Final Verdict ── */}
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-6 text-center">
                <div className="mb-2 text-sm tracking-wide text-emerald-200 uppercase">
                  Final Verdict
                </div>
                <div
                  className={`mb-2 text-2xl font-bold ${
                    winner === "plaintiff"
                      ? "text-blue-400"
                      : winner === "defendant"
                        ? "text-yellow-400"
                        : "text-slate-300"
                  }`}
                >
                  {winner === "plaintiff"
                    ? "Plaintiff Wins"
                    : winner === "defendant"
                      ? "Defendant Wins"
                      : "Case Dismissed"}
                </div>
                <div className="text-sm text-emerald-200">{verdictSummary}</div>
              </div>

              {/* ── Voting Breakdown ── */}
              {hasAnyVotes && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-sm font-medium text-white/90">
                    How people voted
                  </div>

                  {/* Color legend */}
                  <div className="mb-5 flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
                      <span className="text-blue-300">Plaintiff</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-yellow-500" />
                      <span className="text-yellow-300">Defendant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-slate-500" />
                      <span className="text-slate-400">Dismissed</span>
                    </div>
                  </div>

                  {/* ── Judges bar ── */}
                  {judgesVoted && (
                    <div className="mb-5">
                      <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                        <span className="font-medium">
                          ⚖️ Judges
                          <span className="ml-1 text-white/40">
                            ({judgeVotes} {judgeVotes === 1 ? "vote" : "votes"})
                          </span>
                        </span>
                      </div>

                      {/* 3-segment flex bar: Plaintiff | Dismiss | Defendant */}
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${judgePct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                        <motion.div
                          className="h-full bg-slate-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${judgesDismissPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.1,
                          }}
                        />
                        <motion.div
                          className="h-full bg-yellow-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${judgesDefendantPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.2,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px]">
                        <span className="text-blue-300">
                          {voteResults.plaintiffJudgeVotes} Plaintiff
                        </span>
                        {judgesDismissVotes > 0 && (
                          <span className="text-slate-400">
                            {judgesDismissVotes} Dismissed
                          </span>
                        )}
                        <span className="text-yellow-300">
                          {voteResults.defendantJudgeVotes} Defendant
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── Community bar ── */}
                  {communityVoted && (
                    <div className="mb-5">
                      <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                        <span className="font-medium">
                          👥 Community Members
                          <span className="ml-1 text-white/40">
                            ({communityMerged.total}{" "}
                            {communityMerged.total === 1 ? "vote" : "votes"})
                          </span>
                        </span>
                      </div>

                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-blue-400"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${communityMerged.plaintiffPct}%`,
                          }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.15,
                          }}
                        />
                        <motion.div
                          className="h-full bg-slate-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${communityMerged.dismissPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.25,
                          }}
                        />
                        <motion.div
                          className="h-full bg-yellow-400"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${communityMerged.defendantPct}%`,
                          }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.35,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px]">
                        <span className="text-blue-300">
                          {voteResults.plaintiffCommunityVotes} Plaintiff
                        </span>
                        {communityMerged.dismiss > 0 && (
                          <span className="text-slate-400">
                            {communityMerged.dismiss} Dismissed
                          </span>
                        )}
                        <span className="text-yellow-300">
                          {voteResults.defendantCommunityVotes} Defendant
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total row */}
                  <div className="mt-2 rounded-md bg-white/5 px-3 py-2 text-xs text-white/60">
                    Total:{" "}
                    <span className="font-medium text-blue-300">
                      {voteResults.plaintiffVotes} Plaintiff
                    </span>
                    {" · "}
                    <span className="font-medium text-yellow-300">
                      {voteResults.defendantVotes} Defendant
                    </span>
                    {totalDismissVotes > 0 && (
                      <>
                        {" · "}
                        <span className="font-medium text-slate-400">
                          {totalDismissVotes} Dismissed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Judges' Comments ── */}
              {comments && comments.length > 0 ? (
                <div>
                  <div className="mb-4 text-sm font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <div className="space-y-3">
                    {comments.map((comment, index) => {
                      const rawUsername = comment.username || "Anonymous";
                      const displayName = formatUsername(rawUsername);
                      // accountId is the numeric account identifier useAvatar
                      // needs to build the avatar URL. The username string was
                      // being passed before, which caused the fetch to fail.
                      const userId = String(comment.accountId ?? "");

                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              userId={userId}
                              avatarId={comment.avatarId || null}
                              username={rawUsername}
                              size="sm"
                            />
                            <div className="text-sm font-medium text-blue-300">
                              {displayName}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-white/80">
                            {comment.comment || "No comment"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    No judges' comments were provided for this case.
                  </p>
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
