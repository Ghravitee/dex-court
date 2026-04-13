// ─── Action Info Blurb ────────────────────────────────────────────────────────
// Renders a small contextual hint beneath an action. Color-matched to the
// action's severity so it feels native to the existing card palette.

import { Info } from "lucide-react";

type InfoBlurbProps = {
  color: "cyan" | "green" | "orange" | "red" | "purple" | "yellow";
  children: React.ReactNode;
};

export function ActionInfoBlurb({ color, children }: InfoBlurbProps) {
  const palette: Record<InfoBlurbProps["color"], string> = {
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300/80",
    green: "border-green-500/20 bg-green-500/10 text-green-300/80",
    orange: "border-orange-500/20 bg-orange-500/10 text-orange-300/80",
    red: "border-red-500/20 bg-red-500/10 text-red-300/80",
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-300/80",
    yellow: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300/80",
  };

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${palette[color]}`}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-70" />
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}
