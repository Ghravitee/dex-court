/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserAvatar } from "../../../components/UserAvatar";

interface Props {
  user: any;
  onSelect: (username: string) => void;
  field: "defendant" | "witness";
  currentUsername?: string;
  defendantUsername?: string;
}

export const UserSearchResult = ({
  user,
  onSelect,
  field,
  currentUsername,
  defendantUsername,
}: Props) => {
  const telegramUsername = user.telegramUsername || user.username || "";
  const displayUsername = telegramUsername.startsWith("@")
    ? telegramUsername
    : `@${telegramUsername}`;
  const isCurrentUser =
    telegramUsername.toLowerCase() === (currentUsername || "").toLowerCase();
  const isDefendant =
    defendantUsername &&
    telegramUsername.toLowerCase() === defendantUsername.toLowerCase();
  const isInvalid = field === "witness" && (isCurrentUser || isDefendant);

  return (
    <div
      onClick={() => !isInvalid && onSelect(telegramUsername)}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border border-purple-500/20 px-4 py-3 transition-colors ${
        isInvalid
          ? "cursor-not-allowed border-red-500/30 bg-red-500/10 opacity-60 hover:bg-red-500/20"
          : "bg-purple-500/10 hover:bg-purple-500/20"
      }`}
    >
      <UserAvatar
        userId={user.id}
        avatarId={user.avatarId || user.avatar?.id}
        username={telegramUsername}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">
          {displayUsername}
        </div>
        {user.bio && (
          <div className="mt-1 truncate text-xs text-purple-200/70">
            {user.bio}
          </div>
        )}
        {isInvalid && (
          <div className="mt-1 text-xs text-red-300">
            {isCurrentUser ? "Cannot add yourself" : "Cannot add defendant"}
          </div>
        )}
      </div>
    </div>
  );
};
