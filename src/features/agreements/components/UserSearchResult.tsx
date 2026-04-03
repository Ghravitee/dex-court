/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from "lucide-react";
import { UserAvatar } from "../../../components/UserAvatar";
import { cleanTelegramUsername } from "../../../lib/usernameUtils";

interface Props {
  user: any;
  onSelect: (
    username: string,
    field: "counterparty" | "partyA" | "partyB",
  ) => void;
  field: "counterparty" | "partyA" | "partyB";
}

export const UserSearchResult = ({ user, onSelect, field }: Props) => {
  const telegramUsername = cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );

  if (!telegramUsername) return null;

  return (
    <div
      onClick={() => onSelect(`@${telegramUsername}`, field)}
      className="glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60"
    >
      <UserAvatar
        userId={user.id}
        avatarId={user.avatarId || user.avatar?.id}
        username={telegramUsername}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        {telegramUsername && (
          <div className="truncate text-sm text-cyan-300">
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
