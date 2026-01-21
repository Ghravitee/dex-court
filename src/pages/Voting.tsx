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
  Vote,
  MinusCircle,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { disputeService } from "../services/disputeServices";
import { toast } from "sonner";
import { UserAvatar } from "../components/UserAvatar";
import React from "react";
import {
  calculateVoteResults,
  type VoteCalculationResult,
} from "../lib/voteCalculations";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { ESCROW_ABI, ESCROW_CA } from "../web3/config";
import { parseEther } from "ethers";
import { getAgreement } from "../web3/readContract";
import { useAuth } from "../hooks/useAuth";
import { useVotingStatus } from "../hooks/useVotingStatus";

// Constants
const VOTING_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms
const FEE_AMOUNT = "0.01";

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
  agreement?: {
    type: number;
    id?: number;
  };
  contractAgreementId?: number;
  chainId?: number;
  txnhash?: string;
  type?: number;
  voteStartedAt?: string;
  rawDispute?: any; // Store the raw dispute data
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
  roleLabel, // Add roleLabel prop
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
  roleLabel?: string; // "Plaintiff" or "Defendant"
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

  // Get role label color
  const roleColor =
    optionType === "plaintiff" ? "text-cyan-300" : "text-pink-300";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-2 rounded-md border px-3 py-5 text-center text-xs shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-transform ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/5 opacity-50"
          : active
            ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200 hover:bg-cyan-500/40 active:scale-[0.98]"
            : "border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-cyan-500/20 active:scale-[0.98]"
      }`}
    >
      {showThumbsUp && <ThumbsUp className="h-4 w-4" />}
      {showThumbsDown && <ThumbsDown className="h-4 w-4" />}

      {/* Role Label - Always show for plaintiff/defendant */}
      {optionType !== "dismissed" && roleLabel && (
        <div className={`text-xs font-semibold uppercase ${roleColor}`}>
          {roleLabel}
        </div>
      )}

      {/* For dismissed case */}
      {optionType === "dismissed" && (
        <div className="text-xs font-semibold text-yellow-300 uppercase">
          Dismiss Case
        </div>
      )}

      {/* Username and Avatar */}
      {username && avatarId && userId && optionType !== "dismissed" ? (
        <div className="flex flex-col items-center gap-2">
          <UserAvatar
            userId={userId}
            avatarId={avatarId}
            username={username.replace("@", "")}
            size="sm"
          />
          <span className="text-xs">{displayLabel}</span>
        </div>
      ) : optionType === "dismissed" ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
            <span className="text-xl">
              <MinusCircle className="text-orange-400" />
            </span>
          </div>
          <span className="text-xs">No winner</span>
        </div>
      ) : (
        <span>{displayLabel}</span>
      )}
    </button>
  );
};

const MemoizedVoteOption = React.memo(VoteOption);

const LiveCaseCard = ({
  c,
  currentTime,
  refetchLiveDisputes,
  isVoteStarted,
  startingVote,
  handleOnchainStartVote,
  isJudge = false,
  isPending,
}: {
  c: LiveCase;
  currentTime: number;
  refetchLiveDisputes: () => void;
  isVoteStarted: (disputeId: string) => boolean;
  startingVote: string | null;
  handleOnchainStartVote: (
    dispute: LiveCase,
    probono: boolean,
  ) => Promise<void>;
  isPending: boolean;
  isJudge?: boolean;
}) => {
  const [choice, setChoice] = useState<
    "plaintiff" | "defendant" | "dismissed" | null
  >(null);
  const [comment, setComment] = useState("");
  const [isVoting, setIsVoting] = useState(false);

  // Use the useVotingStatus hook instead of local state
  const {
    hasVoted,
    canVote,
    reason,
    tier,
    weight,
    markAsVoted,
    refetch: refetchVotingStatus,
  } = useVotingStatus(parseInt(c.id), c.rawDispute);

  const [onChainAgreement, setOnChainAgreement] = useState<any | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);

  // Calculate remaining time based on current time from parent
  const remain = Math.max(0, c.endsAt - currentTime);
  const isExpired = remain <= 0;
  const formattedTime = fmtRemain(remain);

  // Check if vote has been started
  const voteStarted = isVoteStarted(c.id);

  // Fetch on-chain agreement data for escrow disputes
  useEffect(() => {
    if (c.agreement?.type === 2 && c.contractAgreementId && c.chainId) {
      const fetchOnChainData = async () => {
        try {
          setOnChainLoading(true);
          const res = await getAgreement(
            c.chainId!,
            BigInt(c.contractAgreementId!),
          );
          setOnChainAgreement(res);
        } catch (err) {
          console.error("Failed to fetch on-chain agreement:", err);
          setOnChainAgreement(null);
        } finally {
          setOnChainLoading(false);
        }
      };

      fetchOnChainData();
    }
  }, [c.agreement?.type, c.contractAgreementId, c.chainId]);

  // Check if on-chain vote can be started (for escrow disputes)
  const canStartOnChainVote = useMemo(() => {
    if (c.agreement?.type !== 2 || !onChainAgreement || onChainLoading) {
      return false;
    }

    // Check if vote hasn't been started yet (voteStartedAt === 0 means not started)
    return Number(onChainAgreement.voteStartedAt) === 0;
  }, [c.agreement?.type, onChainAgreement, onChainLoading]);

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
      markAsVoted(choice);
      setChoice(null);
      setComment("");

      // Refresh voting status
      refetchVotingStatus();

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
  }, [
    choice,
    comment,
    c.id,
    refetchLiveDisputes,
    markAsVoted,
    refetchVotingStatus,
  ]);

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= 1200) {
        setComment(e.target.value);
      }
    },
    [],
  );

  // Handle start vote click
  const handleStartVoteClick = useCallback(async () => {
    try {
      // For escrow disputes, always start as paid (probono = false)
      await handleOnchainStartVote(c, false);
    } catch (error) {
      console.error("Failed to start vote:", error);
    }
  }, [c, handleOnchainStartVote]);

  // Show tier and weight info in the UI
  const votingInfo = useMemo(() => {
    if (!canVote) return null;

    const info = [];
    if (tier) info.push(`Tier ${tier}`);
    if (weight && weight > 1) info.push(`${weight}x weight`);

    return info.length > 0 ? `(${info.join(", ")})` : "";
  }, [canVote, tier, weight]);

  return (
    <div
      className={`relative rounded-xl border p-0 ${
        isExpired ? "border-yellow-400/30 bg-yellow-500/5" : "border-white/10"
      }`}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          {/* Header */}
          <div className="flex flex-col justify-between px-4 pt-4 sm:flex-row sm:items-center">
            <div>
              <Link
                to={`/disputes/${c.id}`}
                className="inline-flex items-center hover:underline"
                prefetch="intent"
              >
                <h2 className="font-semibold text-white/90">{c.title}</h2>
              </Link>

              <div className="text-muted-foreground my-4 flex flex-col items-center gap-2 text-xs sm:flex-row">
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
                {hasVoted ? (
                  <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                    ✓ You have voted
                  </span>
                ) : canVote ? (
                  <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-300">
                    <Vote className="mr-1 h-3 w-3" />
                    Eligible to vote {votingInfo}
                  </span>
                ) : voteStarted ? (
                  <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-300">
                    <Shield className="mr-1 h-3 w-3" />
                    Not eligible to vote
                  </span>
                ) : c.agreement?.type === 1 ? (
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
                    <Clock className="mr-1 h-3 w-3" />
                    Reputational - Vote Now
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">
                    <Clock className="mr-1 h-3 w-3" />
                    Start Vote Required
                  </span>
                )}
                {/* Agreement Type Badge */}
                {c.agreement?.type && (
                  <span
                    className={`ml-2 inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${
                      c.agreement.type === 2
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        : "border-blue-400/30 bg-blue-500/10 text-blue-300"
                    }`}
                  >
                    {c.agreement.type === 2 ? "Escrow" : "Reputational"}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 flex items-center justify-end gap-2">
                <Clock
                  className={`mt-1 ml-10 size-3 lg:size-5 ${
                    isExpired ? "text-yellow-400" : "text-cyan-300"
                  }`}
                />
                <p className="text-muted-foreground text-sm sm:text-base">
                  {isExpired ? "Voting ended" : "Voting ends"}
                </p>
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

              {/* Start Vote Section - Show only for escrow disputes that haven't started voting */}
              {!isExpired && c.agreement?.type === 2 && !voteStarted && (
                <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-300">
                        Start Voting Phase
                      </h4>
                      <p className="text-xs text-green-200">
                        Click to initiate escrow voting on-chain. Once started,
                        the 24-hour voting timer will begin.
                      </p>
                      {onChainAgreement && (
                        <div className="mt-1 text-xs">
                          <div className="text-green-300">
                            Status:{" "}
                            {canStartOnChainVote
                              ? "Ready to start"
                              : "Cannot start yet"}
                          </div>
                          {c.contractAgreementId && (
                            <div className="text-green-300/70">
                              Agreement ID: {c.contractAgreementId}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="border-green-400/30 text-green-300 hover:bg-green-500/10"
                      onClick={handleStartVoteClick}
                      disabled={
                        startingVote === c.id ||
                        isPending ||
                        !canStartOnChainVote ||
                        onChainLoading
                      }
                      size="sm"
                    >
                      {startingVote === c.id || isPending || onChainLoading ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Vote className="mr-2 h-3 w-3" />
                      )}
                      {onChainLoading
                        ? "Loading..."
                        : startingVote === c.id || isPending
                          ? "Starting..."
                          : "Start Vote"}
                    </Button>
                  </div>
                </div>
              )}

              {/* For reputational disputes, show info message instead of Start Vote button */}
              {!isExpired && c.agreement?.type === 1 && !voteStarted && (
                <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                      <Info className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-300">
                        Reputational Dispute
                      </h4>
                      <p className="text-xs text-blue-200">
                        Voting starts automatically. You can cast your vote now.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Eligibility Message */}
              {voteStarted && !canVote && reason && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                      <Info className="h-4 w-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-300">
                        Not Eligible to Vote
                      </h4>
                      <p className="text-xs text-amber-200">{reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vote Counts Not Available Message - Only show if vote has started */}
              {voteStarted && (
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-center">
                  <div className="text-sm text-cyan-300">
                    Vote counts are hidden during voting to maintain fairness
                  </div>
                  <div className="mt-1 text-xs text-cyan-200">
                    Results will be visible after voting ends
                  </div>
                </div>
              )}

              {/* Voting Section - Only show if vote has started AND user can vote */}
              {!isExpired && voteStarted && canVote && (
                <div className="mt-2">
                  <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">
                    {hasVoted
                      ? "Your Vote Has Been Cast"
                      : isExpired
                        ? "Voting Completed"
                        : "Who is your vote for?"}
                  </h4>

                  {!hasVoted && !isExpired && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                        roleLabel="Plaintiff"
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
                        roleLabel="Defendant"
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

                  {hasVoted && (
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

                  {isExpired && !hasVoted && (
                    <div className="mt-3 rounded-md border border-yellow-400/30 bg-yellow-500/10 p-3 text-center">
                      <div className="text-sm text-yellow-300">
                        Voting has ended. Results will be available soon.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Comment Section - Only show if vote has started, user can vote, hasn't voted, AND user is a judge */}
              {!hasVoted && !isExpired && voteStarted && canVote && isJudge && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cyan-300">
                        Add Comment
                      </span>
                      <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                        Judges Only
                      </span>
                    </div>
                    <span className="text-xs text-cyan-300/70">max 1200</span>
                  </div>

                  <textarea
                    disabled={isVoting}
                    value={comment}
                    onChange={handleCommentChange}
                    className="min-h-28 w-full rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/40 disabled:opacity-60"
                    placeholder="Share your judicial reasoning..."
                  />

                  <div className="mt-1 flex justify-between text-xs">
                    <div className="text-cyan-300/70">
                      ⚖️ Judicial comments help explain the verdict
                    </div>
                    <div className="text-cyan-200">
                      {1200 - comment.length} characters left
                    </div>
                  </div>
                </div>
              )}

              {/* Show message for non-judges */}
              {!hasVoted &&
                !isExpired &&
                voteStarted &&
                canVote &&
                !isJudge && (
                  <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-cyan-300" />
                      <div>
                        <div className="text-sm text-cyan-200">
                          Comments are restricted to judges only
                        </div>
                        <div className="text-xs text-cyan-200/70">
                          Only judges can add comments to their votes
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Vote Button - Only show if vote has started, user can vote, and user hasn't voted */}
              {!hasVoted && !isExpired && voteStarted && canVote && (
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
                    Can Vote: {canVote ? "Yes" : "No"}
                    <br />
                    Has Voted: {hasVoted ? "Yes" : "No"}
                    <br />
                    Reason: {reason || "None"}
                    <br />
                    Tier: {tier || "None"}
                    <br />
                    Weight: {weight || "None"}
                    <br />
                    Agreement Type: {c.agreement?.type || "Unknown"}
                    <br />
                    Contract Agreement ID: {c.contractAgreementId || "None"}
                    <br />
                    Vote Started: {voteStarted ? "Yes" : "No"}
                    <br />
                    Can Start On-Chain: {canStartOnChainVote ? "Yes" : "No"}
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

              <div className="text-muted-foreground my-4 flex flex-col items-center gap-2 text-xs sm:flex-row">
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
    <div className="mb-2 text-sm font-medium text-white/90">Comments</div>
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
    <p className="text-muted-foreground mt-1 text-sm break-all">
      {c.description}
    </p>
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

// Custom hook for debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Main component
export default function Voting() {
  const [liveCases, setLiveCases] = useState<LiveCase[]>([]);
  const [concludedCases, setConcludedCases] = useState<DoneCase[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [concludedLoading, setConcludedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "done">("live");
  const [currentTime, setCurrentTime] = useState(now());
  const [votingStartedDisputes, setVotingStartedDisputes] = useState<
    Set<string>
  >(new Set());
  const [startingVote, setStartingVote] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [allLiveCases, setAllLiveCases] = useState<LiveCase[]>([]);
  const [allConcludedCases, setAllConcludedCases] = useState<DoneCase[]>([]);
  const [paginatedLiveCases, setPaginatedLiveCases] = useState<LiveCase[]>([]);
  const [paginatedConcludedCases, setPaginatedConcludedCases] = useState<
    DoneCase[]
  >([]);

  // Wagmi hooks for on-chain transactions
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { user } = useAuth(); // Get user from auth context
  const userRole = user?.role || 1; // Default to community (1) if no role

  const networkInfo = useNetworkEnvironment();
  const contractAddress = ESCROW_CA[networkInfo.chainId as number];

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Helper function to check if user is a judge
  const isUserJudge = useCallback(() => {
    return userRole === 2 || userRole === 3; // 2 = judge, 3 = admin
  }, [userRole]);

  // Single interval for all cards - better performance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      toast.error("Transaction failed", {
        description: writeError.message || "Please try again",
      });
      resetWrite();
    }
  }, [writeError, resetWrite]);

  // Helper function to check if vote has been started
  const isVoteStarted = useCallback(
    (disputeId: string): boolean => {
      const dispute = liveCases.find((d) => d.id === disputeId);
      if (!dispute) return false;

      // For reputational disputes (type 1), voting starts automatically
      if (dispute.agreement?.type === 1) {
        return true; // Always true for reputational disputes in "Vote in Progress"
      }

      // For escrow disputes (type 2), check local state
      if (dispute.agreement?.type === 2) {
        return votingStartedDisputes.has(disputeId) || !!dispute.voteStartedAt;
      }

      // Default fallback
      return votingStartedDisputes.has(disputeId) || !!dispute.voteStartedAt;
    },
    [liveCases, votingStartedDisputes],
  );

  // Optimized data fetching with useCallback
  const fetchLiveDisputes = useCallback(async () => {
    try {
      setLiveLoading(true);
      const response = await disputeService.getVoteInProgressDisputes();

      if (response?.results) {
        const liveDisputes = response.results.map((dispute: any) => {
          // For escrow disputes, check if vote has been started on-chain
          let endsAt;
          if (dispute.voteStartedAt) {
            // If vote has been started, use the actual start time
            const voteStartedAt = parseAPIDate(dispute.voteStartedAt);
            endsAt = voteStartedAt + VOTING_DURATION;
          } else if (dispute.agreement?.type === 2) {
            // For escrow disputes that haven't started voting yet, use a future date
            // that will be updated when voting starts
            endsAt = parseAPIDate(dispute.createdAt) + VOTING_DURATION;
          } else {
            // For reputational disputes, use created date
            endsAt = parseAPIDate(dispute.createdAt) + VOTING_DURATION;
          }

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
            agreement: dispute.agreement || { type: 1 },
            contractAgreementId: dispute.contractAgreementId,
            chainId: dispute.chainId,
            txnhash: dispute.txnhash,
            type: dispute.type,
            voteStartedAt: dispute.voteStartedAt,
            rawDispute: dispute, // Pass raw dispute data for eligibility check
          };
        });

        setLiveCases(liveDisputes);

        // Update votingStartedDisputes based on API data
        const startedDisputeIds = liveDisputes
          .filter((d) => d.voteStartedAt)
          .map((d) => d.id);

        setVotingStartedDisputes((prev) => {
          const newSet = new Set(prev);
          startedDisputeIds.forEach((id) => newSet.add(id));
          return newSet;
        });
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
        top: 1000,
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

  // On-chain start vote function (for escrow agreements)
  const handleOnchainStartVote = useCallback(
    async (dispute: LiveCase, probono: boolean) => {
      if (!dispute || !dispute.contractAgreementId) {
        toast.error("Cannot start vote: Contract agreement ID is missing");
        return;
      }

      if (!contractAddress) {
        toast.error(
          "Cannot start vote: Contract address not found for this network",
        );
        return;
      }

      setStartingVote(dispute.id);

      try {
        const fee = probono
          ? BigInt(0)
          : BigInt(parseEther(FEE_AMOUNT).toString());

        console.log("Starting escrow vote with params:", {
          contractAddress,
          contractAgreementId: dispute.contractAgreementId,
          probono,
          fee: fee.toString(),
        });

        // Call the smart contract to start the vote
        writeContract({
          address: contractAddress as `0x${string}`,
          abi: ESCROW_ABI.abi,
          functionName: "startVote",
          args: [BigInt(dispute.contractAgreementId), probono, fee],
          value: fee, // Send the fee with the transaction
        });

        toast.info("Transaction submitted! 🚀", {
          description:
            "Waiting for blockchain confirmation... The voting phase will begin shortly.",
        });
      } catch (error: any) {
        console.error("Error starting escrow vote:", error);
        toast.error("Failed to start escrow vote", {
          description:
            error.message || "Please check your wallet and try again",
        });
        setStartingVote(null);
      }
    },
    [contractAddress, writeContract],
  );

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Vote started successfully! 🗳️", {
        description:
          "The 24-hour voting timer has begun. Users can now cast their votes.",
      });

      // Update local state to indicate voting has started
      if (startingVote) {
        setVotingStartedDisputes((prev) => {
          const newSet = new Set(prev);
          newSet.add(startingVote);
          return newSet;
        });
      }

      // Refresh the data
      if (tab === "live") {
        fetchLiveDisputes();
      }

      resetWrite();
      setStartingVote(null);
    }
  }, [isSuccess, hash, startingVote, tab, resetWrite, fetchLiveDisputes]);

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
    setCurrentPage(1); // Reset to first page when changing tabs
    setError(null);
  }, []);

  // Filter cases based on search query
  const filteredLiveCases = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return liveCases;

    const searchTerm = debouncedSearchQuery.toLowerCase().trim();

    return liveCases.filter((c) => {
      // Search across multiple fields
      const searchableText = [
        c.title || "",
        c.parties.plaintiff || "",
        c.parties.defendant || "",
        c.description || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [liveCases, debouncedSearchQuery]);

  const filteredConcludedCases = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return concludedCases;

    const searchTerm = debouncedSearchQuery.toLowerCase().trim();

    return concludedCases.filter((c) => {
      // Search across multiple fields
      const searchableText = [
        c.title || "",
        c.parties.plaintiff || "",
        c.parties.defendant || "",
        c.description || "",
        c.winner || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [concludedCases, debouncedSearchQuery]);

  // Store all filtered cases
  useEffect(() => {
    setAllLiveCases(filteredLiveCases);
    setAllConcludedCases(filteredConcludedCases);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredLiveCases, filteredConcludedCases]);

  // Apply pagination
  const applyPagination = useCallback(() => {
    if (tab === "live") {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginated = allLiveCases.slice(startIndex, endIndex);
      setPaginatedLiveCases(paginated);
    } else {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginated = allConcludedCases.slice(startIndex, endIndex);
      setPaginatedConcludedCases(paginated);
    }
  }, [tab, allLiveCases, allConcludedCases, currentPage, pageSize]);

  // Apply pagination when dependencies change
  useEffect(() => {
    applyPagination();
  }, [applyPagination]);

  // Calculate pagination info
  const currentCases = tab === "live" ? allLiveCases : allConcludedCases;
  const totalPages = Math.ceil(currentCases.length / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, currentCases.length);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

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

      if (paginatedLiveCases.length === 0) {
        return (
          <div className="col-span-2 py-12 text-center">
            <div className="mb-4 text-4xl">🗳️</div>
            <h3 className="mb-2 text-lg font-semibold text-cyan-300">
              {debouncedSearchQuery.trim()
                ? "No Matching Active Votes"
                : "No Active Votes"}
            </h3>
            <p className="text-muted-foreground">
              {debouncedSearchQuery.trim()
                ? `No active votes found matching "${debouncedSearchQuery}"`
                : "There are currently no disputes in the voting phase."}
            </p>
            {debouncedSearchQuery.trim() && (
              <Button
                variant="outline"
                className="mt-4 border-cyan-400 text-cyan-300"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        );
      }

      return paginatedLiveCases.map((c) => (
        <MemoizedLiveCaseCard
          key={c.id}
          c={c}
          currentTime={currentTime}
          refetchLiveDisputes={fetchLiveDisputes}
          isVoteStarted={isVoteStarted}
          startingVote={startingVote}
          handleOnchainStartVote={handleOnchainStartVote}
          isPending={isPending}
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

      if (paginatedConcludedCases.length === 0) {
        return (
          <div className="col-span-2 py-12 text-center">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold text-cyan-300">
              {debouncedSearchQuery.trim()
                ? "No Matching Cases"
                : "No Concluded Cases"}
            </h3>
            <p className="text-muted-foreground">
              {debouncedSearchQuery.trim()
                ? `No concluded cases found matching "${debouncedSearchQuery}"`
                : "No voting results available yet."}
            </p>
            {debouncedSearchQuery.trim() && (
              <Button
                variant="outline"
                className="mt-4 border-cyan-400 text-cyan-300"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        );
      }

      return paginatedConcludedCases.map((c) => (
        <MemoizedDoneCaseCard key={c.id} c={c} />
      ));
    }
  }, [
    tab,
    error,
    liveLoading,
    concludedLoading,
    paginatedLiveCases,
    paginatedConcludedCases,
    currentTime,
    fetchLiveDisputes,
    isVoteStarted,
    startingVote,
    handleOnchainStartVote,
    isPending,
    isUserJudge,
    debouncedSearchQuery,
  ]);

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl" />

      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90">Voting Hub</h2>
        <div className="text-sm text-cyan-300">
          {tab === "live"
            ? `${allLiveCases.length} active case${allLiveCases.length !== 1 ? "s" : ""}`
            : `${allConcludedCases.length} concluded case${allConcludedCases.length !== 1 ? "s" : ""}`}
        </div>
      </header>

      {/* Custom Tabs and Search Bar */}
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

        {/* Search Bar */}
        <div className="relative grow sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting forms
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            placeholder="Search by title, username, or description"
            className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm ring-0 outline-none focus:border-cyan-400/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-cyan-300/70 hover:text-cyan-300"
            >
              ✕
            </button>
          )}
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

      {/* Page Size Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-cyan-300">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400/40"
          >
            <option className="text-black" value={5}>
              5
            </option>
            <option className="text-black" value={10}>
              10
            </option>
            <option className="text-black" value={20}>
              20
            </option>
            <option className="text-black" value={50}>
              50
            </option>
          </select>
          <span className="text-sm text-cyan-300">per page</span>
        </div>

        {/* Showing X to Y of Z cases */}
        {currentCases.length > 0 && (
          <div className="text-sm whitespace-nowrap text-cyan-300">
            Showing {startItem} to {endItem} of {currentCases.length}{" "}
            {tab === "live" ? "active" : "concluded"} cases
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="mx-auto mt-4 grid max-w-[1150px] grid-flow-row-dense grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {tabContent}
      </div>

      {/* Pagination Controls - Only show if we have cases */}
      {currentCases.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
          <div className="text-sm whitespace-nowrap text-cyan-300">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="order-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
            </Button>

            {/* Page Numbers - Hide on very small screens, show on sm+ */}
            <div className="xs:flex order-3 hidden items-center gap-1 sm:order-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "neon" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={`${
                      currentPage === pageNum
                        ? "neon-hover"
                        : "border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                    } h-8 min-w-[2rem] px-2 text-xs sm:h-9 sm:min-w-[2.5rem] sm:px-3 sm:text-sm`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            {/* Current Page Indicator (for very small screens) */}
            <div className="xs:hidden order-2 text-sm text-cyan-300 sm:order-3">
              Page {currentPage} of {totalPages}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="order-4 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-4"
            >
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
