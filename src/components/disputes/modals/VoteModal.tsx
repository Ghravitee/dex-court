import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
// import {
//   cleanTelegramUsername,
//   formatTelegramUsernameForDisplay,
// } from "../../../lib/usernameUtils";
import {
  Info,
  MinusCircle,
  Scale,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { VscVerifiedFilled } from "react-icons/vsc";

import type { VoteData, DisputeRow } from "../../../types";
import { Loader2 } from "lucide-react";

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  voteData: VoteData;
  onVoteChange: (
    choice: "plaintiff" | "defendant" | "dismissed" | null,
    comment: string,
  ) => void;
  onCastVote: () => void;
  hasVoted: boolean;
  isSubmitting: boolean;
  dispute: DisputeRow | null;
  canUserVote: () => Promise<{ canVote: boolean; reason?: string }>;
  isCurrentUserPlaintiff: () => boolean;
  isCurrentUserDefendant: () => boolean;
  isJudge?: boolean;
}

// usernameUtils.ts
const isWalletAddress = (username: string): boolean => {
  if (!username) return false;

  const clean = username.replace(/^@/, "");

  // Ethereum addresses (0x + 40 hex chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(clean)) {
    return true;
  }

  // Solana addresses (32-44 base58 chars)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) {
    return true;
  }

  // Arbitrary long strings (could be other EVM chains)
  if (clean.length >= 32 && clean.length <= 64) {
    return true;
  }

  return false;
};

const formatWalletAddress = (address: string): string => {
  if (!address) return "";

  // Remove @ symbol if present
  const cleanAddress = address.replace(/^@/, "");

  // If it's short enough, return as is
  if (cleanAddress.length <= 16) return cleanAddress;

  // Show first 6 and last 4 characters for typical wallet addresses
  const start = cleanAddress.slice(0, 6);
  const end = cleanAddress.slice(-4);
  return `${start}...${end}`;
};

const cleanTelegramUsername = (username: string): string => {
  if (!username) return "";

  // Remove @ symbol
  const clean = username.replace(/^@/, "");

  // If it's a wallet address, return the full address without @
  if (isWalletAddress(clean)) {
    return clean;
  }

  return clean;
};

const formatTelegramUsernameForDisplay = (username: string): string => {
  if (!username) return "";

  const clean = cleanTelegramUsername(username);

  // If it's a wallet address, format it with ellipsis (no @ symbol)
  if (isWalletAddress(clean)) {
    return formatWalletAddress(clean);
  }

  // For Telegram usernames, add @ symbol
  // Check if it already has @, if not add it
  return clean.startsWith("@") ? clean : `@${clean}`;
};

// Updated VoteOption component with clear role labels
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
  label: string | React.ReactNode;
  active: boolean;
  onClick: () => void;
  choice: "plaintiff" | "defendant" | "dismissed" | null;
  optionType: "plaintiff" | "defendant" | "dismissed";
  disabled?: boolean;
  username?: string;
  avatarId?: number | null;
  userId?: string;
}) => {
  const showThumbsUp = active && choice === optionType;
  const showThumbsDown =
    choice &&
    choice !== optionType &&
    choice !== "dismissed" &&
    optionType !== "dismissed";

  // Get role-specific styling
  const roleColor =
    optionType === "plaintiff"
      ? "text-cyan-300"
      : optionType === "defendant"
        ? "text-pink-300"
        : "text-yellow-300";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-start gap-3 rounded-lg border px-4 py-4 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/5 opacity-50"
          : active
            ? "border-cyan-400/40 bg-cyan-500/30"
            : "border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-cyan-500/20"
      }`}
    >
      <div className="flex items-center">
        {showThumbsUp && <ThumbsUp className="mr-2 h-4 w-4" />}
        {showThumbsDown && <ThumbsDown className="mr-2 h-4 w-4" />}
      </div>

      {typeof label === "string" ? (
        username && avatarId && userId ? (
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={userId}
              avatarId={avatarId}
              username={username}
              size="sm"
            />
            <div>
              <div className={`text-sm font-semibold ${roleColor}`}>
                {optionType === "dismissed" ? "Dismiss Case" : optionType}
              </div>
              <div className="text-xs text-white/80">{label}</div>
            </div>
          </div>
        ) : (
          <div>
            <div className={`text-sm font-semibold ${roleColor}`}>
              {optionType === "dismissed" ? "Dismiss Case" : optionType}
            </div>
            <div className="text-xs text-white/80">{label}</div>
          </div>
        )
      ) : (
        label
      )}
    </button>
  );
};

export const VoteModal = ({
  isOpen,
  onClose,
  voteData,
  onVoteChange,
  onCastVote,
  hasVoted,
  isSubmitting,
  dispute,
  canUserVote,
  isCurrentUserPlaintiff,
  isCurrentUserDefendant,
  isJudge = true,
}: VoteModalProps) => {
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleVoteChoice = useCallback(
    (choice: "plaintiff" | "defendant" | "dismissed") => {
      onVoteChange(choice, voteData.comment);
    },
    [onVoteChange, voteData.comment],
  );

  const handleCommentChange = useCallback(
    (comment: string) => {
      if (comment.length <= 1200) {
        onVoteChange(voteData.choice, comment);
      }
    },
    [onVoteChange, voteData.choice],
  );

  const handleCastVoteWithFeedback = useCallback(async () => {
    if (!voteData.choice || !dispute) return;

    try {
      await onCastVote();
    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  }, [voteData.choice, dispute, onCastVote]);

  if (!isOpen) return null;

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
          className="glass card-cyan relative top-5 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl sm:max-h-[90vh]"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-cyan-300" />
              <h3 className="text-xl font-semibold text-cyan-300">
                Cast Your Vote
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            {!canUserVote ? (
              <div className="py-8 text-center">
                <div className="mb-4 text-2xl">🚫</div>
                <div className="mb-2 text-lg font-semibold text-red-400">
                  Cannot Vote
                </div>
                <div className="text-sm text-cyan-200">
                  {isCurrentUserPlaintiff() || isCurrentUserDefendant()
                    ? "Plaintiffs and defendants cannot vote in their own disputes."
                    : "You do not have voting privileges for this dispute."}
                </div>
              </div>
            ) : hasVoted ? (
              <div className="py-8 text-center">
                <div className="mb-4 text-6xl">✅</div>
                <div className="mb-2 text-lg font-semibold text-emerald-400">
                  Vote Successfully Submitted!
                </div>
                <div className="mb-4 text-sm text-cyan-200">
                  Thank you for participating in the democratic process. Your
                  vote helps maintain fairness and transparency in dispute
                  resolution.
                </div>
                <div className="rounded-lg bg-cyan-500/10 p-3 text-xs text-cyan-300/70">
                  <div className="mb-1 font-semibold">What happens next?</div>
                  <ul className="space-y-1 text-left">
                    <li>• Your vote remains confidential until voting ends</li>
                    <li>
                      • Results will be revealed when the voting period
                      concludes
                    </li>
                    <li>
                      • You can view the final outcome in the "Concluded" tab
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Case Info */}
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <h4 className="mb-2 font-semibold text-cyan-300">
                    {dispute?.title}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-cyan-200">
                    {/* Plaintiff */}
                    <div className="flex items-center gap-1">
                      <UserAvatar
                        userId={
                          dispute?.plaintiffData?.userId ||
                          cleanTelegramUsername(dispute?.plaintiff || "")
                        }
                        avatarId={dispute?.plaintiffData?.avatarId || null}
                        username={cleanTelegramUsername(
                          dispute?.plaintiff || "",
                        )}
                        size="sm"
                      />
                      <span className="font-medium">
                        {formatTelegramUsernameForDisplay(
                          dispute?.plaintiff || "",
                        )}
                      </span>
                    </div>

                    <span>vs</span>

                    {/* Defendant */}
                    <div className="flex items-center gap-1">
                      <UserAvatar
                        userId={
                          dispute?.defendantData?.userId ||
                          cleanTelegramUsername(dispute?.defendant || "")
                        }
                        avatarId={dispute?.defendantData?.avatarId || null}
                        username={cleanTelegramUsername(
                          dispute?.defendant || "",
                        )}
                        size="sm"
                      />
                      <span className="font-medium">
                        {formatTelegramUsernameForDisplay(
                          dispute?.defendant || "",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Voting Options */}
                {/* Voting Options */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">
                    Who is your vote for?
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {/* Plaintiff Option */}
                    <VoteOption
                      label={
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            userId={
                              dispute?.plaintiffData?.userId ||
                              cleanTelegramUsername(dispute?.plaintiff || "")
                            }
                            avatarId={dispute?.plaintiffData?.avatarId || null}
                            username={cleanTelegramUsername(
                              dispute?.plaintiff || "",
                            )}
                            size="sm"
                          />
                          <div>
                            <div className="text-xs text-cyan-300">
                              {formatTelegramUsernameForDisplay(
                                dispute?.plaintiff || "",
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-cyan-200/70">
                              Plaintiff
                              {isCurrentUserPlaintiff() && (
                                <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      }
                      active={voteData.choice === "plaintiff"}
                      onClick={() => handleVoteChoice("plaintiff")}
                      choice={voteData.choice}
                      optionType="plaintiff"
                      disabled={isSubmitting}
                      username={cleanTelegramUsername(dispute?.plaintiff || "")}
                      avatarId={dispute?.plaintiffData?.avatarId || null}
                      userId={
                        dispute?.plaintiffData?.userId ||
                        cleanTelegramUsername(dispute?.plaintiff || "")
                      }
                    />

                    {/* Defendant Option */}
                    <VoteOption
                      label={
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            userId={
                              dispute?.defendantData?.userId ||
                              cleanTelegramUsername(dispute?.defendant || "")
                            }
                            avatarId={dispute?.defendantData?.avatarId || null}
                            username={cleanTelegramUsername(
                              dispute?.defendant || "",
                            )}
                            size="sm"
                          />
                          <div>
                            <div className="text-xs text-pink-300">
                              {formatTelegramUsernameForDisplay(
                                dispute?.defendant || "",
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-pink-200/70">
                              Defendant
                              {isCurrentUserDefendant() && (
                                <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      }
                      active={voteData.choice === "defendant"}
                      onClick={() => handleVoteChoice("defendant")}
                      choice={voteData.choice}
                      optionType="defendant"
                      disabled={isSubmitting}
                      username={cleanTelegramUsername(dispute?.defendant || "")}
                      avatarId={dispute?.defendantData?.avatarId || null}
                      userId={
                        dispute?.defendantData?.userId ||
                        cleanTelegramUsername(dispute?.defendant || "")
                      }
                    />

                    {/* Dismiss Option */}
                    <VoteOption
                      label={
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20">
                            <span className="text-xl">
                              <MinusCircle className="text-orange-400" />
                            </span>
                          </div>
                          <div>
                            <div className="text-xs text-yellow-300">
                              No Winner
                            </div>
                            <div className="text-xs text-yellow-200/70">
                              Case dismissed
                            </div>
                          </div>
                        </div>
                      }
                      active={voteData.choice === "dismissed"}
                      onClick={() => handleVoteChoice("dismissed")}
                      choice={voteData.choice}
                      optionType="dismissed"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                {/* Comment Section */}
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
                    disabled={!isJudge || isSubmitting}
                    value={voteData.comment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40 disabled:opacity-60"
                    placeholder={
                      isJudge
                        ? "Add your reasoning as a judge..."
                        : "Comments are restricted to judges only"
                    }
                  />
                  {isJudge && (
                    <div className="text-muted-foreground mt-1 text-right text-xs">
                      {1200 - voteData.comment.length} characters left
                    </div>
                  )}
                </div>
                {/* Vote Button + Info */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="neon"
                    className="neon-hover relative"
                    disabled={!voteData.choice || isSubmitting}
                    onClick={handleCastVoteWithFeedback}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Vote...
                      </>
                    ) : (
                      "Cast Vote"
                    )}
                  </Button>
                  <div className="group relative cursor-pointer">
                    <Info className="h-4 w-4 text-cyan-300/70 transition group-hover:text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      Your vote remains private until the voting period ends.
                      During this time, only your participation status is
                      visible — not your decision.
                    </div>
                  </div>
                </div>
                {/* Voting Progress */}
                {isSubmitting && (
                  <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                      <div className="text-sm text-cyan-200">
                        Securely submitting your vote...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
