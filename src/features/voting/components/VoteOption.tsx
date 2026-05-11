import React, { useMemo } from "react";
import { ThumbsUp, ThumbsDown, MinusCircle, GitMerge } from "lucide-react";
import { UserAvatar } from "../../../components/UserAvatar";
import { formatDisplayName, formatUsername } from "../utils/formatting";
import { type VoteOptionProps } from "../types";

export const VoteOption: React.FC<VoteOptionProps> = ({
  label,
  active,
  onClick,
  choice,
  optionType,
  disabled = false,
  username,
  avatarId,
  userId,
  roleLabel,
}) => {
  const displayLabel = useMemo(() => {
    if (username) {
      const formattedName = formatDisplayName(username);
      if (optionType === "dismissed") return "Dismiss Case";
      if (optionType === "split") return "Split";
      return formattedName;
    }
    return label;
  }, [username, label, optionType]);

  const showThumbsUp = active;
  const showThumbsDown =
    choice !== null &&
    !active &&
    optionType !== "dismissed" &&
    optionType !== "split" &&
    choice !== "dismissed";

  const roleColor =
    optionType === "plaintiff"
      ? "text-blue-400"
      : optionType === "split"
        ? "text-purple-400"
        : "text-yellow-400";

  const isSpecialOption = optionType === "dismissed" || optionType === "split";

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

      {/* Role label — only for plaintiff/defendant */}
      {!isSpecialOption && roleLabel && (
        <div className={`text-xs font-semibold uppercase ${roleColor}`}>
          {roleLabel}
        </div>
      )}

      {/* Dismissed header label */}
      {optionType === "dismissed" && (
        <div className="text-xs font-semibold text-slate-300 uppercase">
          Dismiss Case
        </div>
      )}

      {/* Split header label */}
      {optionType === "split" && (
        <div className="text-xs font-semibold text-purple-300 uppercase">
          Split
        </div>
      )}

      {/* Plaintiff / Defendant — with avatar */}
      {username && avatarId && userId && !isSpecialOption ? (
        <div className="flex flex-col items-center gap-2">
          <UserAvatar
            userId={userId}
            avatarId={avatarId}
            username={formatUsername(username)}
            size="sm"
          />
          <span className="text-xs">{displayLabel}</span>
        </div>
      ) : optionType === "dismissed" ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500/20">
            <MinusCircle className="text-slate-400" />
          </div>
          <span className="text-xs">No winner</span>
        </div>
      ) : optionType === "split" ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
            <GitMerge className="text-purple-400" />
          </div>
          <span className="text-xs">Both parties</span>
        </div>
      ) : (
        <span>{displayLabel}</span>
      )}
    </button>
  );
};

export const MemoizedVoteOption = React.memo(VoteOption);
