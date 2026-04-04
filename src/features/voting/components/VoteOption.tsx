import React, { useMemo } from "react";
import { ThumbsUp, ThumbsDown, MinusCircle } from "lucide-react";
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
      return optionType === "dismissed" ? "Dismiss Case" : `${formattedName}`;
    }
    return label;
  }, [username, label, optionType]);

  const showThumbsUp = active;
  const showThumbsDown =
    choice !== null &&
    !active &&
    optionType !== "dismissed" &&
    choice !== "dismissed";

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

      {optionType !== "dismissed" && roleLabel && (
        <div className={`text-xs font-semibold uppercase ${roleColor}`}>
          {roleLabel}
        </div>
      )}

      {optionType === "dismissed" && (
        <div className="text-xs font-semibold text-yellow-300 uppercase">
          Dismiss Case
        </div>
      )}

      {username && avatarId && userId && optionType !== "dismissed" ? (
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

export const MemoizedVoteOption = React.memo(VoteOption);
