// features/reputation/components/SelectedProfilePanel.tsx
import { TrendingUp, TrendingDown } from "lucide-react";
import { UserAvatar } from "../../../components/UserAvatar";
import TrustMeter from "../../../components/TrustMeter";
import { formatUsername, getDisplayName, isWalletAddress } from "../utils/formatters";
import { getTotalDisputes } from "../utils/calculations";
import { DisputesGrid } from "./DisputesBreakdown";
import type { LeaderboardAccount } from "../types";

interface Props {
  profile: LeaderboardAccount;
  delta: number;
}

export function SelectedProfilePanel({ profile, delta }: Props) {
  const displayName = getDisplayName(profile.username);
  const formattedUsername = formatUsername(profile.username);

  return (
    <>
      {/* Avatar + name card */}
      <div className="flex items-center gap-4 rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
        <UserAvatar
          userId={profile.id.toString()}
          avatarId={profile.avatarId ?? null}
          username={formattedUsername}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50">Selected Profile</p>
          <p
            className="truncate font-semibold text-white/90"
            title={isWalletAddress(profile.username) ? profile.username : undefined}
          >
            {displayName}
          </p>
          <p className="mt-1 text-xs text-white/50">Rank #{profile.rank ?? "N/A"}</p>
        </div>
      </div>

      {/* 30-day change + trust meter */}
      <div className="flex items-center justify-between rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent px-6 py-4">
        <div>
          <p className="text-xs text-white/50">30-Day Change</p>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              delta >= 0
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-400/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            {delta >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        </div>
        <TrustMeter score={profile.finalScore ?? 0} />
      </div>

      {/* Profile summary */}
      <div className="rounded-xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
        <p className="text-sm text-white/50">Profile Summary</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Stat label="Agreements" value={profile.agreementsTotal ?? 0} color="text-white/90" />
          <Stat label="Rank" value={`#${profile.rank ?? "N/A"}`} color="text-cyan-300" sub="Global position" />
          <Stat
            label="Final Score"
            value={profile.finalScore ?? 0}
            color="text-emerald-300"
            sub={`Base: ${profile.baseScore ?? 50}`}
          />
          <Stat
            label="Total Disputes"
            value={getTotalDisputes(profile.disputes)}
            color="text-amber-300"
            sub="Resolved cases"
          />
        </div>

        {profile.disputes && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-3 text-sm text-white/50">Disputes Breakdown</p>
            <DisputesGrid disputes={profile.disputes} />
          </div>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-sm text-white/50">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}
