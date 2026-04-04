import { Wallet } from "lucide-react";
import { UserAvatar } from "../../../components/UserAvatar";
import TrustMeter from "../../../components/TrustMeter";
import { RoleBadge } from "./RoleBadge";
import { formatHandle, formatWalletAddress } from "../utils/formatters";
import Judge from "../../../components/ui/svgcomponents/Judge";
import Community from "../../../components/ui/svgcomponents/Community";
import UserIcon from "../../../components/ui/svgcomponents/UserIcon";
import { type UserProfileData } from "../types";

interface UserProfileHeaderProps {
  user: UserProfileData;
  trustScore: number;
  trustScoreLoading: boolean;
  isOwnProfile: boolean;
}

export const UserProfileHeader = ({
  user,
  trustScore,
  trustScoreLoading,
  //   isOwnProfile,
}: UserProfileHeaderProps) => {
  return (
    <div className="card-cyan grid items-center rounded-2xl px-4 py-3 ring-1 ring-white/10 lg:px-6">
      <div className="flex items-center justify-between gap-2">
        <UserAvatar
          userId={user.id}
          avatarId={user.avatarId}
          username={user.telegram?.username || user.username}
          size="lg"
          className="h-14 w-14 border border-cyan-400/30"
          priority={true}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <RoleBadge
              role={user.roles.judge}
              icon={<Judge />}
              tooltip="Certified Judge"
            />
            <RoleBadge
              role={user.roles.community}
              icon={<Community />}
              tooltip="Community Member"
            />
            <RoleBadge
              role={
                user.roles.user && !user.roles.judge && !user.roles.community
              }
              icon={<UserIcon />}
              tooltip="Basic User"
            />
          </div>
          <div className="text-muted-foreground mt-2 text-xs">
            <div className="flex items-center gap-1 font-semibold text-white/90">
              {formatHandle(user.handle)}
            </div>
            <div className="mt-1">
              {user.walletAddress ? (
                <div className="flex items-center gap-1 text-cyan-300">
                  <Wallet className="h-3 w-3" />
                  <span className="text-xs">
                    {formatWalletAddress(user.walletAddress)}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-400">No wallet linked</div>
              )}
            </div>
          </div>
        </div>
        <div className="self-center">
          {trustScoreLoading ? (
            <div className="flex h-32 w-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-300"></div>
            </div>
          ) : (
            <TrustMeter score={trustScore} />
          )}
        </div>
      </div>
    </div>
  );
};
