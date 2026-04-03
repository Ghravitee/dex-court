import { Button } from "../../../components/ui/button";

interface RevenueStatsProps {
  revenue: {
    "7d": number;
    "30d": number;
    "90d": number;
  };
}

export const RevenueStats = ({ revenue }: RevenueStatsProps) => {
  return (
    <div className="flex h-fit flex-col justify-between rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/25 to-transparent p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)] ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,211,238,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-white/90">Revenue Earned</h3>
      </div>

      <div className="space-y-3 text-lg">
        {Object.entries(revenue).map(([period, amount]) => (
          <div key={period} className="flex justify-between">
            <span className="text-muted-foreground">
              {period.toUpperCase()}
            </span>
            <span className="text-xl font-semibold text-cyan-300">
              ${Number(amount).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center space-y-3">
        <div className="text-muted-foreground text-sm">Unclaimed Reward</div>
        <div className="text-3xl font-bold text-emerald-400">($0)</div>
        <Button
          variant="neon"
          className="mt-2 w-full border border-cyan-400/40 bg-cyan-600/20 py-4 text-lg font-medium text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all hover:bg-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
        >
          Claim Revenue
        </Button>
      </div>
    </div>
  );
};
