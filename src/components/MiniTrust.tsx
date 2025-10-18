// components/MiniTrust.tsx
export function MiniTrust({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-28 w-28">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(rgba(16,185,129,.8) ${
            pct * 3.6
          }deg, rgba(244,63,94,.6) 0)`,
          filter: "drop-shadow(0 0 12px rgba(34,211,238,.25))",
        }}
      />
      <div className="absolute inset-1 grid place-items-center rounded-full bg-black/50 ring-1 ring-white/10">
        <div className="text-lg font-bold text-white">{pct}</div>
        <div className="text-[10px] text-cyan-300">Trust</div>
      </div>
    </div>
  );
}
