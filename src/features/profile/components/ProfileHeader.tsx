/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaEdit } from "react-icons/fa";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
import { Loader2, UploadCloud, User } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { VerificationBadge } from "./VerificationBadge";
import TrustMeter from "../../../components/TrustMeter";

import { type UserData } from "../types";
import Admin from "../../../components/ui/svgcomponents/Admin";
import Judge from "../../../components/ui/svgcomponents/Judge";
import Community from "../../../components/ui/svgcomponents/Community";

interface ProfileHeaderProps {
  user: any;
  userData: UserData;
  trustScore: number;
  trustScoreLoading: boolean;
  uploading: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditProfile: () => void;
}

export const ProfileHeader = ({
  user,
  userData,
  trustScore,
  trustScoreLoading,
  uploading,
  onAvatarChange,
  onEditProfile,
}: ProfileHeaderProps) => {
  return (
    <div className="row-span-1 flex h-fit flex-col justify-between rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent px-4 py-3 lg:px-6">
      {/* Top row — avatar + info + trust meter */}
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
        {/* Avatar — fixed size, never shrinks */}
        <div className="relative shrink-0">
          <UserAvatar
            userId={user?.id || "unknown"}
            avatarId={user?.avatarId || null}
            username={user?.telegram?.username || user?.username || "user"}
            size="lg"
            className="h-14 w-14 border border-cyan-400/30"
            priority={true}
          />
          <label className="absolute -right-1 -bottom-1 cursor-pointer rounded-full bg-cyan-500 p-1 text-xs text-white hover:bg-cyan-600">
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png"
              onChange={onAvatarChange}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
          </label>
        </div>

        {/* Identity — takes remaining space */}
        <div className="min-w-0 flex-1">
          {uploading && (
            <div className="mb-1 text-xs text-cyan-300">
              Uploading avatar...
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <RoleBadge
              role={userData.roles?.admin || false}
              icon={<Admin className="size-7" />}
              tooltip="Administrator"
            />
            <RoleBadge
              role={userData.roles?.judge || false}
              icon={<Judge />}
              tooltip="Certified Judge"
            />
            <RoleBadge
              role={userData.roles?.community || false}
              icon={<Community />}
              tooltip="Community Member"
            />
            <RoleBadge
              role={
                (userData.roles?.user || false) &&
                !(userData.roles?.admin || false) &&
                !(userData.roles?.judge || false) &&
                !(userData.roles?.community || false)
              }
              icon={<User />}
              tooltip="Basic User"
            />
          </div>
          <div className="mt-1.5 text-xs">
            <div className="flex items-center gap-1 truncate font-semibold text-white/90">
              {userData.handle}
              {userData.isVerified && <VerificationBadge />}
            </div>
            <div className="text-muted-foreground truncate">
              {userData.wallet}
            </div>
          </div>
        </div>

        {/* Trust meter — drops to its own row on very small screens */}
        <div className="shrink-0 self-center">
          {trustScoreLoading ? (
            <div className="flex h-32 w-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
            </div>
          ) : (
            <TrustMeter score={trustScore} />
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={onEditProfile}
          className="flex items-center gap-2 border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
        >
          <FaEdit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>
    </div>
  );
};
