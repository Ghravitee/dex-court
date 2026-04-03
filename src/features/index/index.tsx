import { WalletLoginDebug } from "../../components/WalletLoginDebug";
import { HeroSection } from "./components/HeroSection";
import { RevenueChart } from "./components/RevenueChart";
import { KPIChart } from "./components/KPIChart";
import { StatsGrid } from "./components/StatsGrid";
import { DisputesInfiniteCards } from "./components/DisputesInfiniteCards";
import { LiveVotingInfiniteCards } from "./components/LiveVotingInfiniteCards";
import { SignedAgreementsInfiniteCards } from "./components/SignedAgreementsInfiniteCards";
import { RenownedJudgesInfiniteCards } from "./components/RenownedJudgesInfiniteCards";

export default function Index() {
  return (
    <main className="relative overflow-hidden">
      <WalletLoginDebug />
      <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-x-4">
        <div className="col-span-2 mb-4 flex w-full flex-col gap-4">
          <HeroSection />
          <RevenueChart />
        </div>
        <div className="col-span-3 flex flex-col gap-4">
          <KPIChart />
          <StatsGrid />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2">
        <DisputesInfiniteCards />
        <LiveVotingInfiniteCards />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2">
        <SignedAgreementsInfiniteCards />
        <RenownedJudgesInfiniteCards />
      </div>
    </main>
  );
}
