// src/features/admin/components/UserCard.tsx
import { Wallet } from "lucide-react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { UserAvatar } from "../../../components/UserAvatar"; // adjust path
import { RoleBadge } from "./RoleBadge";
import type { AdminUser } from "../types";
import type { AdminRoleValue } from "../types";

interface UserCardProps {
  user: AdminUser;
  isSelected: boolean;
  onToggle: (id: number) => void;
}

function formatDisplayName(username?: string): string {
  if (!username) return "user";
  if (username.startsWith("0x"))
    return `${username.slice(0, 6)}…${username.slice(-4)}`;
  return username.replace(/^@/, "");
}

export function UserCard({ user, isSelected, onToggle }: UserCardProps) {
  const displayName = formatDisplayName(user.username);

  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onToggle(user.id)}
      onKeyDown={(e) => e.key === " " && onToggle(user.id)}
      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
        isSelected
          ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 shadow-lg shadow-cyan-500/20"
          : "border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-white/[0.06]"
      } `}
    >
      {/* Checkbox */}
      <div className="absolute top-3 right-3 z-10">
        <div
          className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
            isSelected
              ? "border-cyan-400 bg-cyan-400"
              : "border-white/30 bg-white/5"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {isSelected && (
            <svg
              className="h-2.5 w-2.5 text-gray-900"
              fill="none"
              viewBox="0 0 10 10"
            >
              <path
                d="M1.5 5l2.5 2.5 4.5-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Avatar + identity */}
      <div className="flex items-start gap-3">
        <UserAvatar
          userId={user.id.toString()}
          avatarId={user.avatarId ?? null}
          username={user.username ?? "user"}
          size="lg"
          className="shrink-0 rounded-xl border border-white/10"
          priority={false}
        />

        <div className="min-w-0 flex-1 pr-6">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-white/90">
              {displayName}
            </span>
            {user.isVerified && (
              <VscVerifiedFilled className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1">
            <RoleBadge role={(user.role ?? 0) as AdminRoleValue} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-white/50">
          <span className="font-medium text-white/30">ID</span>
          <span className="font-mono text-white/70">{user.id}</span>
        </div>

        {user.telegram?.username && (
          <div className="flex items-center gap-1.5 text-white">
            <span className="text-[10px] text-white">TG</span>
            <span>@{user.telegram.username}</span>
          </div>
        )}

        {user.walletAddress && (
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3 w-3 shrink-0 text-purple-400" />
            <span className="truncate font-mono text-white">
              {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
            </span>
          </div>
        )}

        {user.bio && <p className="mt-2 line-clamp-2 text-white">{user.bio}</p>}
      </div>

      {/* Selected glow ring */}
      {isSelected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-400/30 ring-inset" />
      )}
    </div>
  );
}
