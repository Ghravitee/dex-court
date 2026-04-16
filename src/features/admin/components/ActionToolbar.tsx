// src/features/admin/components/ActionToolbar.tsx
import { Loader2, Shield, Users, CheckSquare, Square } from "lucide-react";
import { Button } from "../../../components/ui/button"; // adjust path

interface ActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  isJudgePending: boolean;
  isCommunityPending: boolean;
  onMakeJudge: () => void;
  onMakeCommunity: () => void;
  onToggleSelectAll: () => void;
}

export function ActionToolbar({
  selectedCount,
  totalCount,
  isJudgePending,
  isCommunityPending,
  onMakeJudge,
  onMakeCommunity,
  onToggleSelectAll,
}: ActionToolbarProps) {
  const allSelected = selectedCount > 0 && selectedCount === totalCount;
  const noneSelected = selectedCount === 0;
  const isBusy = isJudgePending || isCommunityPending;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Select all toggle */}
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/90"
      >
        {allSelected ? (
          <CheckSquare className="h-4 w-4 text-cyan-400" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        {allSelected ? "Deselect All" : "Select All"}
      </button>

      <div className="h-6 w-px bg-white/10" />

      {/* Make Judge */}
      <Button
        onClick={onMakeJudge}
        disabled={noneSelected || isBusy}
        className="border-blue-400/40 bg-gradient-to-br from-blue-600/20 to-blue-500/10 text-blue-100 shadow-lg shadow-blue-500/10 hover:from-blue-500/30 hover:to-blue-400/20 disabled:opacity-40"
      >
        {isJudgePending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Shield className="mr-2 h-4 w-4" />
        )}
        Make Judge
        {selectedCount > 0 && (
          <span className="ml-1.5 rounded-full bg-blue-400/20 px-1.5 py-0.5 text-xs tabular-nums">
            {selectedCount}
          </span>
        )}
      </Button>

      {/* Make Community */}
      <Button
        onClick={onMakeCommunity}
        disabled={noneSelected || isBusy}
        className="border-emerald-400/40 bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 text-emerald-100 shadow-lg shadow-emerald-500/10 hover:from-emerald-500/30 hover:to-emerald-400/20 disabled:opacity-40"
      >
        {isCommunityPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Users className="mr-2 h-4 w-4" />
        )}
        Make Community
        {selectedCount > 0 && (
          <span className="ml-1.5 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-xs tabular-nums">
            {selectedCount}
          </span>
        )}
      </Button>

      {/* Busy overlay label */}
      {isBusy && (
        <span className="ml-1 flex items-center gap-1.5 text-sm text-white/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating…
        </span>
      )}
    </div>
  );
}
