import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
import {
  cleanTelegramUsername,
  formatTelegramUsernameForDisplay,
} from "../../../lib/usernameUtils";
import { Info, Minus, Scale, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { VoteOption } from "../VoteOption";
import { useNavigate } from "react-router-dom";
import type { VoteData, DisputeRow } from "../../../types";

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
  dispute: DisputeRow | null;
  canUserVote: () => Promise<{ canVote: boolean; reason?: string }>;
  isCurrentUserPlaintiff: () => boolean;
  isCurrentUserDefendant: () => boolean;
  isJudge?: boolean;
}

export const VoteModal = ({
  isOpen,
  onClose,
  voteData,
  onVoteChange,
  onCastVote,
  hasVoted,
  dispute,
  canUserVote,
  isCurrentUserPlaintiff,
  isCurrentUserDefendant,
  isJudge = true, // Default to true for mock
}: VoteModalProps) => {
  const navigate = useNavigate();

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
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
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
                <div className="mb-2 text-lg font-semibold text-emerald-400">
                  ✓ Vote Submitted
                </div>
                <div className="text-sm text-cyan-200">
                  Thank you for participating. Your vote will be revealed when
                  the voting period ends.
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
                <div>
                  <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200">
                    Who is your vote for?
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                          <div className="text-left">
                            <div>Plaintiff</div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cleanUsername = cleanTelegramUsername(
                                    dispute?.plaintiff || "",
                                  );
                                  const encodedUsername =
                                    encodeURIComponent(cleanUsername);
                                  navigate(`/profile/${encodedUsername}`);
                                }}
                                className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                              >
                                {formatTelegramUsernameForDisplay(
                                  dispute?.plaintiff || "",
                                )}
                              </button>
                              {isCurrentUserPlaintiff() && (
                                <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      }
                      active={voteData.choice === "plaintiff"}
                      onClick={() => handleVoteChoice("plaintiff")}
                      icon={<ThumbsUp className="h-4 w-4" />}
                    />
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
                          <div className="text-left">
                            <div>Defendant</div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cleanUsername = cleanTelegramUsername(
                                    dispute?.defendant || "",
                                  );
                                  const encodedUsername =
                                    encodeURIComponent(cleanUsername);
                                  navigate(`/profile/${encodedUsername}`);
                                }}
                                className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                              >
                                {formatTelegramUsernameForDisplay(
                                  dispute?.defendant || "",
                                )}
                              </button>
                              {isCurrentUserDefendant() && (
                                <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      }
                      active={voteData.choice === "defendant"}
                      onClick={() => handleVoteChoice("defendant")}
                      icon={<ThumbsDown className="h-4 w-4" />}
                    />
                    <VoteOption
                      label="Dismiss Case"
                      active={voteData.choice === "dismissed"}
                      onClick={() => handleVoteChoice("dismissed")}
                      icon={<Minus className="h-4 w-4" />}
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
                    disabled={!isJudge}
                    value={voteData.comment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40 disabled:opacity-60"
                    placeholder={
                      isJudge
                        ? "Add your reasoning..."
                        : "Comments restricted to judges"
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
                    className="neon-hover"
                    disabled={!voteData.choice}
                    onClick={onCastVote}
                  >
                    Cast Vote
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
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
