import React, { useMemo } from "react";
import { UserAvatar } from "../../../components/UserAvatar";
import { formatDisplayName, formatUsername } from "../utils/formatting";
import { type UsernameWithAvatarProps } from "../types";
import { AppLink } from "../../../components/AppLink";

export const UsernameWithAvatar: React.FC<UsernameWithAvatarProps> = ({
  username,
  avatarId,
  userId,
}) => {
  const displayName = useMemo(() => {
    return formatDisplayName(username);
  }, [username]);

  const cleanUsername = useMemo(() => {
    return formatUsername(username);
  }, [username]);

  return (
    <div className="flex items-center gap-2">
      <UserAvatar
        userId={userId}
        avatarId={avatarId}
        username={cleanUsername}
        size="sm"
      />
      <AppLink
        to={`/profile/${cleanUsername}`}
        className="transition-colors hover:text-cyan-300"
        prefetch="intent"
      >
        {displayName}
      </AppLink>
    </div>
  );
};
