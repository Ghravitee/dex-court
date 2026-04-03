import type { AgreementStats, EscrowStats, DisputeStats } from "../types";

interface StatsCardsProps {
  agreementStats: AgreementStats;
  escrowStats: EscrowStats;
  disputeStats: DisputeStats;
  isOwnProfile: boolean;
  totalVolume: number;
  activeDeals: number;
}

export const StatsCards = ({
  agreementStats,
  escrowStats,
  disputeStats,
  isOwnProfile,
  totalVolume,
  activeDeals,
}: StatsCardsProps) => {
  return (
    <>
      <div className="space-y-4">
        <div className="card-cyan flex flex-col justify-between rounded-2xl p-6">
          <h3 className="mb-4 text-lg font-semibold text-white/90">
            Activity Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agreements</span>
              <span className="font-semibold text-cyan-300">
                {agreementStats.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escrow Deals</span>
              <span className="font-semibold text-cyan-300">
                {escrowStats.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Disputes</span>
              <span className="font-semibold text-cyan-300">
                {disputeStats.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card-cyan flex flex-col justify-between rounded-2xl p-6">
          <h3 className="mb-4 text-lg font-semibold text-white/90">
            Trading Volume
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Volume</span>
              <span className="text-lg font-semibold text-green-500">
                ${totalVolume.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Deals</span>
              <span className="font-semibold text-cyan-300">{activeDeals}</span>
            </div>
            <div className="pt-2 text-center text-xs text-white/50">
              {isOwnProfile
                ? "Your detailed revenue"
                : "Detailed revenue visible only to profile owner"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
