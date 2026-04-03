/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from "lucide-react";
import { UserAvatar } from "../../../components/UserAvatar";
import { useAuth } from "../../../hooks/useAuth";
import { cleanTelegramUsername } from "../../../lib/usernameUtils";

interface Props {
  user: any;
  onSelect: (
    username: string,
    field: "defendant" | "witness",
    index?: number,
  ) => void;
  field: "defendant" | "witness";
  index?: number;
}

export const UserSearchResult = ({ user, onSelect, field, index }: Props) => {
  const { user: currentUser } = useAuth();

  const telegramUsername = cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );
  const wallet = user.walletAddress;

  if (!telegramUsername && !wallet) return null;

  const displayUsername = telegramUsername
    ? `@${telegramUsername}`
    : `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;

  const displayName = user.displayName || displayUsername;
  const isCurrentUser = user.id === currentUser?.id;

  return (
    <div
      onClick={() => onSelect(telegramUsername, field, index)}
      className={`glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60 ${
        isCurrentUser ? "opacity-80" : ""
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
          {displayName}
        </div>
        {telegramUsername && (
          <div className="truncate text-xs text-cyan-300">
            @{telegramUsername}
          </div>
        )}
        {user.bio && (
          <div className="mt-1 truncate text-xs text-cyan-200/70">
            {user.bio}
          </div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-cyan-400" />
    </div>
  );
};
