// features/reputation/components/DisputesBreakdown.tsx
import type { DisputesStats } from "../types";

interface TooltipStatProps {
  value: number;
  label: string;
  color: string;
  prefix?: string;
}

function TooltipStat({ value, label, color, prefix = "" }: TooltipStatProps) {
  return (
    <div className="group relative">
      <span className={`text-sm ${color}`}>
        {prefix}
        {value}
      </span>
      <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-20 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-center text-[10px] text-white shadow-lg group-hover:block">
        {label}
      </div>
    </div>
  );
}

export function DisputesBreakdown({
  disputes,
}: {
  disputes: DisputesStats | undefined;
}) {
  if (!disputes) return null;
  return (
    <div className="flex gap-2">
      <TooltipStat
        value={disputes.won ?? 0}
        label="Won"
        color="text-emerald-300"
        prefix="+"
      />
      <TooltipStat
        value={disputes.lost ?? 0}
        label="Lost"
        color="text-red-400"
        prefix="-"
      />
      <TooltipStat
        value={disputes.dismissed ?? 0}
        label="Dismissed"
        color="text-amber-300"
      />
      <TooltipStat
        value={disputes.tie ?? 0}
        label="Tie"
        color="text-cyan-300"
      />
      <TooltipStat
        value={disputes.cancelled ?? 0}
        label="Cancelled"
        color="text-gray-400"
      />
    </div>
  );
}

export function DisputesGrid({ disputes }: { disputes: DisputesStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <Tile label="Won" value={disputes.won ?? 0} color="emerald" />
      <Tile label="Lost" value={disputes.lost ?? 0} color="red" />
      <Tile label="Dismissed" value={disputes.dismissed ?? 0} color="amber" />
      <Tile label="Tie" value={disputes.tie ?? 0} color="cyan" />
      <div className="col-span-2">
        <Tile label="Cancelled" value={disputes.cancelled ?? 0} color="gray" />
      </div>
    </div>
  );
}

type TileColor = "emerald" | "red" | "amber" | "cyan" | "gray";

const colorMap: Record<TileColor, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  red: { bg: "bg-red-500/10", text: "text-red-400" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  gray: { bg: "bg-gray-500/10", text: "text-gray-400" },
};

function Tile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: TileColor;
}) {
  const { bg, text } = colorMap[color];
  return (
    <div
      className={`flex items-center justify-between rounded ${bg} px-3 py-2`}
    >
      <span className={text}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
