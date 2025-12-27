/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Info,
  Loader2,
  Clock,
  ExternalLink,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { disputeService } from "../services/disputeServices";
// import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { UserAvatar } from "../components/UserAvatar";
import React from "react";
import {
  calculateVoteResults,
  type VoteCalculationResult,
} from "../lib/voteCalculations";
import { useAuth } from "../hooks/useAuth";

// Constants
const VOTING_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// Helper function to check if it's a wallet address
const isWalletAddress = (address: string): boolean => {
  if (!address) return false;
  return address.startsWith("0x") && address.length > 10;
};

// Helper function to slice wallet addresses
const sliceWalletAddress = (address: string): string => {
  if (!address) return "";

  // Check if it looks like a wallet address (starts with 0x and has length)
  if (isWalletAddress(address)) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // For non-wallet addresses (usernames), return as is
  return address;
};

// Helper function to format display name with @ symbol only for usernames
const formatDisplayName = (address: string): string => {
  if (!address) return "";

  const slicedAddress = sliceWalletAddress(address);

  // Only add @ for non-wallet addresses (Telegram usernames)
  if (isWalletAddress(address)) {
    return slicedAddress;
  } else {
    // Remove any existing @ and add it back if not present

    return `@${slicedAddress}`;
  }
};

// Memoized utility functions
const now = () => Date.now();

const fmtRemain = (ms: number) => {
  if (ms <= 0) return "00:00:00";

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");

  if (d > 0) {
    return `${d}d ${h}:${m}:${ss}`;
  }
  return `${h}:${m}:${ss}`;
};

const parseAPIDate = (dateString: string): number => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}, using current time`);
    return Date.now();
  }

  return date.getTime();
};

interface LiveCase {
  id: string;
  title: string;
  parties: {
    plaintiff: string;
    defendant: string;
    plaintiffAvatar?: number | null;
    defendantAvatar?: number | null;
    plaintiffId: string;
    defendantId: string;
  };
  description: string;
  endsAt: number;
  totalVotes: number;
  plaintiffVotes: number;
  defendantVotes: number;
  dismissedVotes: number;
  hasVoted: boolean | null;
  participants: {
    handle: string;
    commented: boolean;
    role: "judge" | "community";
    voted: boolean;
  }[];
}

interface DoneCase {
  id: string;
  title: string;
  parties: {
    plaintiff: string;
    defendant: string;
    plaintiffAvatar?: number | null;
    defendantAvatar?: number | null;
    plaintiffId: string;
    defendantId: string;
  };
  description: string;
  winner: "plaintiff" | "defendant" | "dismissed";
  judgeVotes: number;
  communityVotes: number;
  judgePct: number;
  communityPct: number;
  comments: { handle: string; text: string; avatarId?: number | null }[];
  rawData?: any;
}

// Optimized components with memoization
const UsernameWithAvatar = ({
  username,
  avatarId,
  userId,
}: {
  username: string;
  avatarId: number | null;
  userId: string;
}) => {
  const displayName = useMemo(() => {
    return formatDisplayName(username);
  }, [username]);

  const cleanUsername = useMemo(() => {
    return username.replace("@", "");
  }, [username]);

  return (
    <div className="flex items-center gap-2">
      <UserAvatar
        userId={userId}
        avatarId={avatarId}
        username={cleanUsername}
        size="sm"
      />
      <Link
        to={`/profile/${cleanUsername}`}
        className="transition-colors hover:text-cyan-300"
        prefetch="intent"
      >
        {displayName}
      </Link>
    </div>
  );
};

const VoteOption = ({
  label,
  active,
  onClick,
  choice,
  optionType,
  disabled = false,
  username,
  avatarId,
  userId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  choice: "plaintiff" | "defendant" | "dismissed" | null;
  optionType: "plaintiff" | "defendant" | "dismissed";
  disabled?: boolean;
  username?: string;
  avatarId?: number | null;
  userId?: string;
}) => {
  // Format the display name for wallet addresses
  const displayLabel = useMemo(() => {
    if (username) {
      const formattedName = formatDisplayName(username);
      return optionType === "dismissed" ? "Dismiss Case" : `${formattedName}`;
    }
    return label;
  }, [username, label, optionType]);

  // Show thumbs up only when this option is active
  const showThumbsUp = active;

  // Show thumbs down when:
  // - A choice has been made AND
  // - This option is not the chosen one AND
  // - This option is either plaintiff or defendant (not dismissed) AND
  // - The choice is also plaintiff or defendant (not dismissed)
  const showThumbsDown =
    choice !== null &&
    !active &&
    optionType !== "dismissed" &&
    choice !== "dismissed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-5 text-center text-xs shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-transform ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/5 opacity-50"
          : active
            ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200 hover:bg-cyan-500/40 active:scale-[0.98]"
            : "border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-cyan-500/20 active:scale-[0.98]"
      }`}
    >
      {showThumbsUp && <ThumbsUp className="h-4 w-4" />}
      {showThumbsDown && <ThumbsDown className="h-4 w-4" />}
      {username && avatarId && userId && optionType !== "dismissed" ? (
        <div className="flex items-center gap-2">
          <UserAvatar
            userId={userId}
            avatarId={avatarId}
            username={username.replace("@", "")}
            size="sm"
          />
          <span>{displayLabel}</span>
        </div>
      ) : (
        displayLabel
      )}
    </button>
  );
};

const MemoizedVoteOption = React.memo(VoteOption);

const LiveCaseCard = ({
  c,
  currentTime,
  refetchLiveDisputes,
  isJudge = false,
}: {
  c: LiveCase;
  currentTime: number;
  refetchLiveDisputes: () => void;
  isJudge?: boolean;
}) => {
  const [choice, setChoice] = useState<
    "plaintiff" | "defendant" | "dismissed" | null
  >(null);
  const [comment, setComment] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(c.hasVoted || false);

  // Calculate remaining time based on current time from parent
  const remain = Math.max(0, c.endsAt - currentTime);
  const isExpired = remain <= 0;
  const formattedTime = fmtRemain(remain);

  // Enhanced voting function with proper data refresh
  const handleCastVote = useCallback(async () => {
    if (!choice) return;

    setIsVoting(true);
    let loadingToast: string | number | undefined;

    try {
      const disputeId = parseInt(c.id);
      if (isNaN(disputeId)) {
        toast.error("Invalid dispute ID");
        return;
      }

      loadingToast = toast.loading("Casting your vote...", {
        description: "Your vote is being securely submitted",
      });

      // Call the vote API
      await disputeService.castVote(disputeId, {
        voteType: choice === "plaintiff" ? 1 : choice === "defendant" ? 2 : 3,
        comment: comment,
      });

      toast.dismiss(loadingToast);

      const voteAction =
        choice === "plaintiff"
          ? "Plaintiff"
          : choice === "defendant"
            ? "Defendant"
            : "Dismiss Case";

      toast.success("Vote Cast! ✅", {
        description: `You voted for ${voteAction}. Thank you for participating!`,
        duration: 4000,
      });

      // Update local state immediately for better UX
      setLocalHasVoted(true);
      setChoice(null);
      setComment("");

      // Use requestIdleCallback for non-urgent refresh
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          refetchLiveDisputes();
        });
      } else {
        setTimeout(refetchLiveDisputes, 1000);
      }
    } catch (error: any) {
      console.error("❌ Vote failed:", error);

      // Dismiss the loading toast if it exists
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      toast.error("Vote Submission Failed", {
        description:
          error.message || "Unable to submit vote. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsVoting(false);
    }
  }, [choice, comment, c.id, refetchLiveDisputes]);

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= 1200) {
        setComment(e.target.value);
      }
    },
    [],
  );

  return (
    <div
      className={`relative rounded-xl border p-0 ${
        isExpired ? "border-yellow-400/30 bg-yellow-500/5" : "border-white/10"
      }`}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4">
            <div>
              <div className="font-semibold text-white/90">{c.title}</div>

              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cyan-300">Plaintiff: </span>{" "}
                  <UsernameWithAvatar
                    username={c.parties.plaintiff}
                    avatarId={c.parties.plaintiffAvatar || null}
                    userId={c.parties.plaintiffId}
                  />
                </div>
                vs{" "}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-pink-300">Defendant: </span>
                  <UsernameWithAvatar
                    username={c.parties.defendant}
                    avatarId={c.parties.defendantAvatar || null}
                    userId={c.parties.defendantId}
                  />
                </div>
              </div>
              {/* Vote Status Badge */}
              <div className="mt-1">
                {localHasVoted ? (
                  <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                    ✓ You have voted
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-300">
                    <ThumbsUp className="mr-1 h-3 w-3" />
                    Voting in progress
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground mb-1 flex justify-end gap-2 text-xl">
                <Clock
                  className={`mt-2 ml-10 h-5 w-5 ${
                    isExpired ? "text-yellow-400" : "text-cyan-300"
                  }`}
                />
                {isExpired ? "Voting ended" : "Voting ends"}
              </div>
              <div
                className={`font-mono text-lg ${
                  isExpired ? "text-yellow-400" : "text-cyan-300"
                }`}
              >
                {isExpired ? "00:00:00" : formattedTime}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5" />

          <AccordionContent className="mt-3 px-5">
            <div className="space-y-3">
              <Link
                to={`/disputes/${c.id}`}
                className="inline-flex items-center text-xs text-cyan-300 hover:underline"
                prefetch="intent"
              >
                <ExternalLink className="mr-1 h-5 w-5" />
                <span className="mt-1">Details</span>
              </Link>

              {/* Case Description */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-2 text-sm font-medium text-white/90">
                  Case Description
                </div>
                <p className="text-sm text-white/80">{c.description}</p>
              </div>

              {/* Vote Counts Not Available Message */}
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-center">
                <div className="text-sm text-cyan-300">
                  Vote counts are hidden during voting to maintain fairness
                </div>
                <div className="mt-1 text-xs text-cyan-200">
                  Results will be visible after voting ends
                </div>
              </div>

              {/* Voting Section */}
              <div className="mt-2">
                <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">
                  {localHasVoted
                    ? "Your Vote Has Been Cast"
                    : isExpired
                      ? "Voting Completed"
                      : "Who is your vote for?"}
                </h4>

                {!localHasVoted && !isExpired && (
                  <div className="grid grid-cols-3 gap-3">
                    <MemoizedVoteOption
                      label={`Plaintiff (${c.parties.plaintiff})`}
                      active={choice === "plaintiff"}
                      onClick={() => setChoice("plaintiff")}
                      choice={choice}
                      optionType="plaintiff"
                      disabled={isExpired}
                      username={c.parties.plaintiff}
                      avatarId={c.parties.plaintiffAvatar || null}
                      userId={c.parties.plaintiffId}
                    />
                    <MemoizedVoteOption
                      label={`Defendant (${c.parties.defendant})`}
                      active={choice === "defendant"}
                      onClick={() => setChoice("defendant")}
                      choice={choice}
                      optionType="defendant"
                      disabled={isExpired}
                      username={c.parties.defendant}
                      avatarId={c.parties.defendantAvatar || null}
                      userId={c.parties.defendantId}
                    />
                    <MemoizedVoteOption
                      label="Dismiss Case"
                      active={choice === "dismissed"}
                      onClick={() => setChoice("dismissed")}
                      choice={choice}
                      optionType="dismissed"
                      disabled={isExpired}
                    />
                  </div>
                )}

                {localHasVoted && (
                  <div className="rounded-md border border-green-400/30 bg-green-500/10 p-4 text-center">
                    <div className="mb-2 text-lg text-green-300">
                      ✓ Vote Submitted
                    </div>
                    <div className="text-sm text-green-200">
                      Thank you for participating! Your vote has been recorded
                      and will be counted when voting ends.
                    </div>
                  </div>
                )}

                {isExpired && !localHasVoted && (
                  <div className="mt-3 rounded-md border border-yellow-400/30 bg-yellow-500/10 p-3 text-center">
                    <div className="text-sm text-yellow-300">
                      Voting has ended. Results will be available soon.
                    </div>
                  </div>
                )}
              </div>

              {/* Comment Section */}
              {!localHasVoted && !isExpired && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Comment{" "}
                      {isJudge && <span className="text-xs">(max 1200)</span>}
                    </span>
                    {!isJudge && (
                      <span className="text-muted-foreground text-xs">
                        Only judges can comment
                      </span>
                    )}
                  </div>

                  <textarea
                    disabled={!isJudge || isVoting}
                    value={comment}
                    onChange={handleCommentChange}
                    className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40 disabled:opacity-60"
                    placeholder={
                      isJudge
                        ? "Add your reasoning as a judge..."
                        : "Comments are restricted to judges only"
                    }
                  />

                  {isJudge && (
                    <div className="text-muted-foreground mt-1 text-right text-xs">
                      {1200 - comment.length} characters left
                    </div>
                  )}
                </div>
              )}

              {/* Vote Button */}
              {!localHasVoted && !isExpired && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Button
                    variant="neon"
                    className="neon-hover"
                    disabled={!choice || isVoting}
                    onClick={handleCastVote}
                  >
                    {isVoting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Voting...
                      </>
                    ) : (
                      "Cast Vote"
                    )}
                  </Button>

                  <div className="group relative cursor-pointer">
                    <Info className="h-4 w-4 text-cyan-300/70 transition group-hover:text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      Your vote remains private until the voting period ends.
                      During this time, only your participation status ("voted")
                      is visible — not your decision.
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Info - Only in development */}
              {process.env.NODE_ENV === "development" && (
                <div className="rounded-lg border border-gray-400/30 bg-gray-500/10 p-3">
                  <div className="text-xs text-gray-300">
                    <strong>Debug Info:</strong>
                    <br />
                    Dispute ID: {c.id}
                    <br />
                    Has Voted (API): {c.hasVoted?.toString() || "false"}
                    <br />
                    Has Voted (Local): {localHasVoted.toString()}
                    <br />
                    Voting Ends: {new Date(c.endsAt).toLocaleString()}
                    <br />
                    Current Time: {new Date(currentTime).toLocaleString()}
                    <br />
                    Remaining: {remain}ms
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const MemoizedLiveCaseCard = React.memo(LiveCaseCard);

const DoneCaseCard = ({ c }: { c: DoneCase }) => {
  // Memoized calculations
  const voteResults = useMemo(() => {
    return calculateVoteResults(
      c.judgeVotes,
      c.communityVotes,
      c.judgePct,
      c.communityPct,
      c.winner,
    );
  }, [c.judgeVotes, c.communityVotes, c.judgePct, c.communityPct, c.winner]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10">
      <Accordion type="single" collapsible>
        <AccordionItem value="case">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <div>
              <div className="font-semibold text-white/90">{c.title}</div>

              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cyan-300">Plaintiff: </span>{" "}
                  <UsernameWithAvatar
                    username={c.parties.plaintiff}
                    avatarId={c.parties.plaintiffAvatar || null}
                    userId={c.parties.plaintiffId}
                  />
                </div>
                vs{" "}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-pink-300">Defendant: </span>
                  <UsernameWithAvatar
                    username={c.parties.defendant}
                    avatarId={c.parties.defendantAvatar || null}
                    userId={c.parties.defendantId}
                  />
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-white/90">
                Verdict:{" "}
                <span
                  className={`${
                    c.winner === "dismissed"
                      ? "text-yellow-400"
                      : c.winner === "plaintiff"
                        ? "text-cyan-300"
                        : "text-pink-300"
                  }`}
                >
                  {c.winner === "dismissed"
                    ? "Dismissed"
                    : c.winner === "plaintiff"
                      ? "Plaintiff"
                      : "Defendant"}
                </span>
              </div>
              <div className="text-muted-foreground text-xs">
                Total votes: {voteResults.totalVotes}
                {voteResults.isDismissedDueToNoVotes && (
                  <div className="mt-1 text-xs text-yellow-400">
                    No votes cast
                  </div>
                )}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5"></AccordionTrigger>

          <AccordionContent className="mt-3 px-5">
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-4 text-center">
                <div className="mb-2 text-lg text-emerald-200">
                  Final Verdict
                </div>
                <div
                  className={`mb-2 text-2xl font-bold ${
                    c.winner === "plaintiff"
                      ? "text-cyan-300"
                      : c.winner === "defendant"
                        ? "text-pink-300"
                        : "text-yellow-300"
                  }`}
                >
                  {c.winner === "plaintiff"
                    ? "Plaintiff Wins"
                    : c.winner === "defendant"
                      ? "Defendant Wins"
                      : "Case Dismissed"}
                </div>
                <div className="text-emerald-200">
                  {voteResults.isDismissedDueToNoVotes
                    ? "No votes were cast during the voting period"
                    : `${voteResults.winPct}% weighted majority`}
                </div>
              </div>

              {!voteResults.isDismissedDueToNoVotes && (
                <VotingBreakdown c={c} voteResults={voteResults} />
              )}

              {/* Judges' Comments */}
              {c.comments && c.comments.length > 0 && (
                <CommentsSection comments={c.comments} />
              )}

              {/* Case Description */}
              <CaseDescription c={c} />

              {/* Debug Info */}
              {process.env.NODE_ENV === "development" && c.rawData && (
                <DebugInfo c={c} />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// Extracted components for better performance
const VotingBreakdown = ({
  c,
  voteResults,
}: {
  c: DoneCase;
  voteResults: VoteCalculationResult;
}) => {
  return (
    <div className="glass rounded-lg border border-cyan-400/30 bg-white/5 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
      <div className="mb-2 text-sm font-medium text-white/90">
        Voting Breakdown
      </div>

      {/* Judges Section */}
      <VotingSection
        title="Judges"
        votes={c.judgeVotes}
        percentage={c.judgePct}
        plaintiffVotes={voteResults.plaintiffJudgeVotes}
        defendantVotes={voteResults.defendantJudgeVotes}
        delay={0}
      />

      {/* Community Section */}
      <VotingSection
        title="Community"
        votes={c.communityVotes}
        percentage={c.communityPct}
        plaintiffVotes={voteResults.plaintiffCommunityVotes}
        defendantVotes={voteResults.defendantCommunityVotes}
        delay={0.3}
      />

      {/* Weighted Overall Section */}
      <div>
        <div className="text-muted-foreground mb-1 flex justify-between text-xs">
          <span>Weighted Total (70% Judges, 30% Community)</span>
          <span>
            {voteResults.weightedPlaintiffPct.toFixed(1)}% favor Plaintiff
          </span>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${voteResults.weightedPlaintiffPct}%` }}
            transition={{
              duration: 1,
              ease: "easeOut",
              delay: 0.5,
            }}
          />
          <motion.div
            className="absolute top-0 right-0 h-full rounded-r-full bg-pink-400/60"
            initial={{ width: 0 }}
            animate={{ width: `${voteResults.weightedDefendantPct}%` }}
            transition={{
              duration: 1,
              ease: "easeOut",
              delay: 0.5,
            }}
          />
        </div>

        <div className="mt-1 flex justify-between text-[11px]">
          <span className="text-cyan-300">
            Plaintiff: {voteResults.plaintiffVotes} votes
          </span>
          <span className="text-pink-300">
            Defendant: {voteResults.defendantVotes} votes
          </span>
        </div>
      </div>
    </div>
  );
};

const VotingSection = ({
  title,
  votes,
  percentage,
  plaintiffVotes,
  defendantVotes,
  delay,
}: {
  title: string;
  votes: number;
  percentage: number;
  plaintiffVotes: number;
  defendantVotes: number;
  delay: number;
}) => (
  <div className="mb-4">
    <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
      <span>
        {title} — {votes} votes
      </span>
      <span>{percentage}% favor Plaintiff</span>
    </div>

    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={`absolute top-0 left-0 h-full rounded-l-full ${
          title === "Judges" ? "bg-cyan-800" : "bg-cyan-300"
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
      <motion.div
        className={`absolute top-0 right-0 h-full rounded-r-full ${
          title === "Judges" ? "bg-pink-600" : "bg-pink-300/60"
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${100 - percentage}%` }}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
    </div>

    <div className="mt-1 flex justify-between text-[11px]">
      <span className="text-cyan-300">Plaintiff: {plaintiffVotes} votes</span>
      <span className="text-pink-300">Defendant: {defendantVotes} votes</span>
    </div>
  </div>
);

const CommentsSection = ({ comments }: { comments: any[] }) => (
  <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
    <div className="mb-2 text-sm font-medium text-white/90">
      Judges' Comments
    </div>
    <div className="space-y-2 text-sm">
      {comments.map((comment: any, index: number) => (
        <div
          key={index}
          className="rounded-lg border border-white/10 bg-white/5 p-3"
        >
          <div className="flex items-center gap-2">
            <UserAvatar
              userId={comment.handle.replace("@", "")}
              avatarId={comment.avatarId || null}
              username={comment.handle}
              size="sm"
            />
            <div className="text-sm font-medium text-cyan-300">
              {formatDisplayName(comment.handle)}
            </div>
          </div>
          <div className="mt-2 text-white/80">{comment.text}</div>
        </div>
      ))}
    </div>
  </div>
);

const CaseDescription = ({ c }: { c: DoneCase }) => (
  <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
    <div className="text-sm font-medium text-white/90">Case Description</div>
    <p className="text-muted-foreground mt-1 text-sm">{c.description}</p>
    <Link
      to={`/disputes/${c.id}`}
      className="mt-3 inline-flex items-center text-xs text-cyan-300 hover:underline"
      prefetch="intent"
    >
      <ExternalLink className="mr-1 h-3.5 w-3.5" /> View on Disputes
    </Link>
  </div>
);

const DebugInfo = ({ c }: { c: DoneCase }) => (
  <div className="rounded-lg border border-gray-400/30 bg-gray-500/10 p-3">
    <div className="text-xs text-gray-300">
      <strong>Debug Info:</strong>
      <br />
      Raw Weighted: {JSON.stringify(c.rawData?.weighted)}
      <br />
      Result Code: {c.rawData?.result}
      <br />
      Total Votes: {c.rawData?.totalVotes}
    </div>
  </div>
);

const MemoizedDoneCaseCard = React.memo(DoneCaseCard);

// Main component
export default function Voting() {
  const [liveCases, setLiveCases] = useState<LiveCase[]>([]);
  const [concludedCases, setConcludedCases] = useState<DoneCase[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [concludedLoading, setConcludedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "done">("live");
  const [currentTime, setCurrentTime] = useState(now()); // Single time source for all cards
  const { user } = useAuth();

  // Add these helper functions inside the Voting component (before the return statement)
  const getUserRoleNumber = useCallback((): number => {
    return user?.role || 1; // Default to Community (1) if no role
  }, [user?.role]);

  const isUserJudge = useCallback((): boolean => {
    return getUserRoleNumber() === 2; // 2 = Judge
  }, [getUserRoleNumber]);

  // Single interval for all cards - better performance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Optimized data fetching with useCallback
  const fetchLiveDisputes = useCallback(async () => {
    try {
      setLiveLoading(true);
      const response = await disputeService.getVoteInProgressDisputes();

      if (response?.results) {
        const liveDisputes = response.results.map((dispute: any) => {
          const voteStartedAt = dispute.voteStartedAt
            ? parseAPIDate(dispute.voteStartedAt)
            : parseAPIDate(dispute.createdAt);
          const endsAt = voteStartedAt + VOTING_DURATION;

          return {
            id: dispute.id.toString(),
            title: dispute.title || "Untitled Dispute",
            parties: {
              plaintiff: dispute.parties?.plaintiff?.username || "@plaintiff",
              defendant: dispute.parties?.defendant?.username || "@defendant",
              plaintiffAvatar: dispute.parties?.plaintiff?.avatarId || null,
              defendantAvatar: dispute.parties?.defendant?.avatarId || null,
              plaintiffId: dispute.parties?.plaintiff?.id?.toString() || "",
              defendantId: dispute.parties?.defendant?.id?.toString() || "",
            },
            description:
              dispute.claim || dispute.description || "No description provided",
            endsAt,
            totalVotes: 0,
            plaintiffVotes: 0,
            defendantVotes: 0,
            dismissedVotes: 0,
            hasVoted: dispute.hasVoted || false,
            participants: [],
          };
        });

        setLiveCases(liveDisputes);
      }
    } catch (err) {
      console.error("Failed to fetch live disputes:", err);
      setError("Failed to load voting disputes");
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const fetchConcludedDisputes = useCallback(async () => {
    try {
      setConcludedLoading(true);
      const response = await disputeService.getSettledDisputes({
        top: 10,
        sort: "desc",
      });

      if (response?.results) {
        const concludedDisputes = response.results.map((dispute: any) => {
          let winner: "plaintiff" | "defendant" | "dismissed" = "dismissed";

          if (dispute.result === 1) winner = "plaintiff";
          else if (dispute.result === 2) winner = "defendant";
          else if (dispute.result === 3) winner = "dismissed";
          else if (dispute.weighted) {
            const {
              plaintiff = 0,
              defendant = 0,
              dismiss = 0,
            } = dispute.weighted;
            if (plaintiff > defendant && plaintiff > dismiss)
              winner = "plaintiff";
            else if (defendant > plaintiff && defendant > dismiss)
              winner = "defendant";
            else winner = "dismissed";
          }

          const judgeVotes = dispute.votesPerGroup?.judges?.total || 0;
          const communityVotes =
            (dispute.votesPerGroup?.communityTierOne?.total || 0) +
            (dispute.votesPerGroup?.communityTierTwo?.total || 0);
          const judgePct = dispute.percentagesPerGroup?.judges?.plaintiff || 0;
          const communityPct =
            dispute.percentagesPerGroup?.communityTierOne?.plaintiff || 0;

          const comments = (dispute.comments || []).map((comment: any) => ({
            handle: comment.username || "Anonymous",
            text: comment.text || comment.content || "No comment text",
            avatarId: comment.avatarId || null,
          }));

          return {
            id: dispute.id.toString(),
            title: dispute.title || "Untitled Dispute",
            parties: {
              plaintiff: dispute.parties?.plaintiff?.username || "@plaintiff",
              defendant: dispute.parties?.defendant?.username || "@defendant",
              plaintiffAvatar: dispute.parties?.plaintiff?.avatarId || null,
              defendantAvatar: dispute.parties?.defendant?.avatarId || null,
              plaintiffId: dispute.parties?.plaintiff?.id?.toString() || "",
              defendantId: dispute.parties?.defendant?.id?.toString() || "",
            },
            description:
              dispute.claim || dispute.description || "No description provided",
            winner,
            judgeVotes,
            communityVotes,
            judgePct,
            communityPct,
            comments,
            rawData: {
              weighted: dispute.weighted,
              result: dispute.result,
              totalVotes: dispute.totalVotes,
              votesPerGroup: dispute.votesPerGroup,
              percentagesPerGroup: dispute.percentagesPerGroup,
            },
          };
        });

        setConcludedCases(concludedDisputes);
      } else {
        setConcludedCases([]);
      }
    } catch (err) {
      console.error("Failed to fetch concluded disputes:", err);
      setError("Failed to load concluded disputes");
    } finally {
      setConcludedLoading(false);
    }
  }, []);

  // Optimized useEffect with dependency cleanup
  useEffect(() => {
    if (tab === "live") {
      fetchLiveDisputes();
    } else {
      fetchConcludedDisputes();
    }
  }, [tab, fetchLiveDisputes, fetchConcludedDisputes]);

  const handleTabChange = useCallback((newTab: "live" | "done") => {
    setTab(newTab);
    setError(null);
  }, []);

  // Memoized tab content
  const tabContent = useMemo(() => {
    if (error) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl">❌</div>
            <div className="text-lg text-red-400">{error}</div>
            <Button
              variant="outline"
              className="mt-4 border-cyan-400 text-cyan-300"
              onClick={fetchLiveDisputes}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (tab === "live") {
      if (liveLoading) {
        return (
          <div className="col-span-2 py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-muted-foreground">Loading active votes...</p>
            </div>
          </div>
        );
      }

      if (liveCases.length === 0) {
        return (
          <div className="col-span-2 py-12 text-center">
            <div className="mb-4 text-4xl">🗳️</div>
            <h3 className="mb-2 text-lg font-semibold text-cyan-300">
              No Active Votes
            </h3>
            <p className="text-muted-foreground">
              There are currently no disputes in the voting phase.
            </p>
          </div>
        );
      }

      return liveCases.map((c) => (
        <MemoizedLiveCaseCard
          key={c.id}
          c={c}
          currentTime={currentTime}
          refetchLiveDisputes={fetchLiveDisputes}
          isJudge={isUserJudge()}
        />
      ));
    } else {
      if (concludedLoading) {
        return (
          <div className="col-span-2 py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-muted-foreground">
                Loading concluded cases...
              </p>
            </div>
          </div>
        );
      }

      if (concludedCases.length === 0) {
        return (
          <div className="col-span-2 py-12 text-center">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold text-cyan-300">
              No Concluded Cases
            </h3>
            <p className="text-muted-foreground">
              No voting results available yet.
            </p>
          </div>
        );
      }

      return concludedCases.map((c) => (
        <MemoizedDoneCaseCard key={c.id} c={c} />
      ));
    }
  }, [
    tab,
    error,
    liveLoading,
    concludedLoading,
    liveCases,
    concludedCases,
    currentTime,
    fetchLiveDisputes,
    isUserJudge,
  ]);

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl" />

      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90">Voting Hub</h2>
      </header>

      {/* Custom Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit rounded-md bg-white/5 p-1">
          <button
            onClick={() => handleTabChange("live")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              tab === "live"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-muted-foreground hover:text-white/80"
            }`}
          >
            LIVE
          </button>
          <button
            onClick={() => handleTabChange("done")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              tab === "done"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-muted-foreground hover:text-white/80"
            }`}
          >
            CONCLUDED
          </button>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-4 text-xs text-white/70">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-cyan-400/80" />
            <span>Plaintiff</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-pink-400/80" />
            <span>Defendant</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <span>Dismissed</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto mt-4 grid max-w-[1150px] grid-flow-row-dense grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {tabContent}
      </div>
    </div>
  );
}
