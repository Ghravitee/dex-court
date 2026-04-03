import { useMemo } from "react";
import {
  Trophy,
  Scale,
  Users,
  Handshake,
  Landmark,
  Banknote,
  User,
  Coins,
  Wallet,
} from "lucide-react";
import CountUp from "../../../components/ui/CountUp";
import { DottedSpinner } from "./DottedSpinner";
import { useAllAgreementsCount } from "../../../hooks/useAllAgreementsCount";
import { useSettledDisputesCount } from "../../../hooks/useSettledDisputesCount";
import { useUsersCount } from "../../../hooks/useUsersCount";
import { useJudgesCount } from "../../../hooks/useJudgesCounts";
import { type Stat } from "../types";

export const StatsGrid = () => {
  const { agreementsCount, loading: agreementsLoading } =
    useAllAgreementsCount();
  const { settledCount, loading: settledLoading } = useSettledDisputesCount();
  const { usersCount, loading: usersLoading } = useUsersCount();
  const { judgesCount, loading: judgesLoading } = useJudgesCount();

  const stats: Stat[] = useMemo(
    () => [
      {
        label: "Settled Disputes",
        value: settledLoading ? 0 : settledCount,
        icon: Trophy,
      },
      { label: "Judges", value: judgesLoading ? 0 : judgesCount, icon: Scale },
      { label: "Eligible Voters", value: 12400, icon: Users },
      {
        label: "Agreements",
        value: agreementsLoading ? 0 : agreementsCount,
        icon: Handshake,
      },
      { label: "Platform Revenue", value: 214000, icon: Landmark, prefix: "$" },
      { label: "Escrow TVL", value: 3100000, icon: Banknote, prefix: "$" },
      {
        label: "Active Users",
        value: usersLoading ? 7902 : usersCount,
        icon: User,
      },
      { label: "Paid to Judges", value: 68000, icon: Coins, prefix: "$" },
      { label: "Paid to Community", value: 112000, icon: Wallet, prefix: "$" },
    ],
    [
      agreementsCount,
      agreementsLoading,
      settledCount,
      settledLoading,
      usersCount,
      usersLoading,
      judgesCount,
      judgesLoading,
    ],
  );

  const getIsLoading = (label: string) => {
    if (label === "Settled Disputes") return settledLoading;
    if (label === "Active Users") return usersLoading;
    return false;
  };

  return (
    <section className="card-cyan justify-center gap-8 rounded-2xl border border-cyan-400/60 px-4 py-4 lg:p-6">
      <h3 className="space mb-6 text-center text-xl font-semibold text-white/90 lg:text-xl">
        Statistics
      </h3>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4">
            <div className="rounded-2xl border p-2 ring-1 ring-white/10">
              <s.icon className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm text-white/60">{s.label}</div>
              <CountUp
                to={s.value}
                from={0}
                duration={2}
                delay={0.2}
                separator={s.value > 1000 ? "," : ""}
                prefix={s.prefix || ""}
                className="font-bold text-white lg:text-[20px] xl:text-[24px]"
              />
              {getIsLoading(s.label) && (
                <div className="mt-1 flex items-center gap-2 text-xs text-cyan-300">
                  <DottedSpinner size="small" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
