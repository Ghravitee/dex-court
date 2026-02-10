/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../components/ui/button";
import {
  Scale,
  User,
  Trophy,
  Coins,
  Handshake,
  Banknote,
  Wallet,
  Landmark,
  Users,
  Vote,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Legend,
} from "recharts";
import CountUp from "../components/ui/CountUp";
import { Link } from "react-router-dom";
import avatar1 from "../assets/avatar-1.svg";
import avatar2 from "../assets/avatar-2.webp";
import avatar3 from "../assets/avatar-3.webp";
import avatar4 from "../assets/avatar4.webp";

import { useAllAgreementsCount } from "../hooks/useAllAgreementsCount";
import { usePublicAgreements } from "../hooks/usePublicAgreements";
import { InfiniteMovingJudges } from "../components/ui/infinite-moving-judges";
import { InfiniteMovingAgreements } from "../components/ui/infinite-moving-agreements";
import { InfiniteMovingCardsWithAvatars } from "../components/ui/infinite-moving-cards-with-avatars";
import { disputeService } from "../services/disputeServices";
import type { DisputeListItem, DisputeRow } from "../types";
import { useSettledDisputesCount } from "../hooks/useSettledDisputesCount";
import { useUsersCount } from "../hooks/useUsersCount";
import { WalletLoginDebug } from "../components/WalletLoginDebug";
import { useJudgesCount } from "../hooks/useJudgesCounts";
import { useAllAgreementsForGrowth } from "../hooks/useAllAgreementsForGrowth";
import type { GrowthDataPoint } from "../hooks/useAllAgreementsForGrowth";

// Cache for expensive calculations
const revenueCache = new Map();

interface TimeframeGroupedData {
  period: string;
  newAgreements: number;
  totalAgreements: number;
}

// Helper to group data by timeframe
// Helper to group data by timeframe
const groupByTimeframe = (
  data: GrowthDataPoint[],
  timeframe: "daily" | "weekly" | "monthly",
): TimeframeGroupedData[] => {
  if (data.length === 0) return [];

  if (timeframe === "daily") {
    return data.map((d) => ({
      period: d.date,
      newAgreements: d.newAgreements,
      totalAgreements: d.totalAgreements,
    }));
  }

  const grouped = new Map<
    string,
    { new: number; total: number; rawDate: string }
  >();

  data.forEach((point) => {
    const date = new Date(point.rawDate);
    let key: string;

    if (timeframe === "weekly") {
      // Get week of year
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) /
          7,
      );
      key = `${date.getFullYear()}-W${weekNumber}`;
    } else {
      // Monthly
      key = `${date.getFullYear()}-${date.getMonth()}`;
    }

    const existing = grouped.get(key) || {
      new: 0,
      total: 0,
      rawDate: point.rawDate,
    };
    existing.new += point.newAgreements;
    // For cumulative total, we take the last totalAgreements value of the period
    existing.total = point.totalAgreements;
    grouped.set(key, existing);
  });

  // Convert to array, sort, and recalculate cumulative
  const sorted = Array.from(grouped.entries()).sort(([, a], [, b]) =>
    a.rawDate.localeCompare(b.rawDate),
  );

  let cumulative = 0;
  const result: TimeframeGroupedData[] = [];

  sorted.forEach(([key, { new: newCount }]) => {
    cumulative += newCount;

    // Determine period label
    let period: string;
    if (key.includes("W")) {
      period = `W${key.split("-W")[1]}`;
    } else {
      const parts = key.split("-");
      if (parts.length >= 2) {
        const monthIndex = parseInt(parts[1]);
        if (!isNaN(monthIndex)) {
          period = new Date(2000, monthIndex, 1).toLocaleString("default", {
            month: "short",
          });
        } else {
          period = "Unknown";
        }
      } else {
        period = "Unknown";
      }
    }

    result.push({
      period,
      newAgreements: newCount,
      totalAgreements: cumulative,
    });
  });

  return result;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-cyan-500/50 bg-gray-900 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-1 font-bold text-cyan-300">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="ml-1 font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Dotted Spinner Component
const DottedSpinner = ({
  size = "medium",
}: {
  size?: "small" | "medium" | "large";
}) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8",
    large: "h-10 w-10",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 rounded-full border-4 border-dotted border-cyan-400/30"></div>
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-dotted border-cyan-400 border-t-transparent"></div>
    </div>
  );
};

export default function Index() {
  return (
    <main className="relative overflow-hidden">
      {/* <div className="absolute top-[10px] left-0 block rounded-md bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div>
      <div className="absolute top-[300px] right-0 block rounded-md bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div>
      <div className="absolute inset-0 -z-[50] bg-cyan-300/1 blur-3xl"></div> */}
      <WalletLoginDebug />
      {/* <AgreementsDebug /> */}
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

function HeroSection() {
  return (
    <section className="w-full">
      <div className="relative items-center gap-6 rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-transparent px-6 py-6">
        <div className="relative z-[1]">
          <h1 className="space text-3xl font-bold tracking-tight text-white">
            DexCourt dApp
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            A decentralized platform for trustless agreements, transparent
            dispute resolution, and on-chain reputation. Govern your deals and
            votes with full cryptographic assurance.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/agreements">
              <Button variant="neon" className="neon-hover">
                Create Agreement
              </Button>
            </Link>
            <Link to="/disputes">
              <Button
                variant="outline"
                className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
              >
                Create Dispute
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function RevenueChart() {
  const daily = useMemo(() => genRevenue("daily"), []);
  const weekly = useMemo(() => genRevenue("weekly"), []);
  const monthly = useMemo(() => genRevenue("monthly"), []);

  const [tab, setTab] = useState("daily");
  const data = tab === "daily" ? daily : tab === "weekly" ? weekly : monthly;

  return (
    <section className="card-cyan relative rounded-2xl border border-cyan-400/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="space font-semibold text-white/90 lg:text-xl">
          Platform Revenue
        </h3>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-72 min-h-[200px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={200}
          minWidth={0}
          aspect={undefined}
        >
          <ComposedChart
            data={data}
            margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="t"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,.9)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8,
                color: "#e2e8f0",
              }}
              formatter={(value) => [`$${value}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="#22d3ee30" radius={[8, 8, 0, 0]} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22d3ee"
              strokeWidth={1}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function genRevenue(type: "daily" | "weekly" | "monthly"): any[] {
  const cacheKey = `revenue-${type}`;
  if (revenueCache.has(cacheKey)) {
    return revenueCache.get(cacheKey);
  }

  const out: any[] = [];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (type === "daily") {
    for (let i = 1; i <= 30; i++) {
      out.push({
        t: i,
        revenue: 15000 + Math.random() * 4000 + i * 200,
      });
    }
  } else if (type === "weekly") {
    for (let m = 0; m < 12; m++) {
      for (let w = 0; w < 4; w++) {
        out.push({
          t: m === 0 ? "" : months[m],
          revenue: 15000 + Math.random() * 4000 + (m * 4 + w) * 300,
        });
      }
    }
  } else {
    for (let m = 0; m < 12; m++) {
      out.push({
        t: months[m],
        revenue: 20000 + Math.random() * 6000 + m * 1000,
      });
    }
  }

  revenueCache.set(cacheKey, out);
  return out;
}

function StatsGrid() {
  const { agreementsCount, loading: agreementsLoading } =
    useAllAgreementsCount();
  const { settledCount, loading: settledLoading } = useSettledDisputesCount();
  const { usersCount, loading: usersLoading } = useUsersCount();
  const { judgesCount, loading: judgesLoading } = useJudgesCount();

  console.log("Judges count:", judgesCount);

  const stats = useMemo(
    () => [
      {
        label: "Settled Disputes",
        value: settledLoading ? 0 : settledCount,
        icon: Trophy,
      },
      {
        label: "Judges",
        value: judgesLoading ? 0 : judgesCount, // Update this line
        icon: Scale,
      },
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
              {/* Show loading indicators */}
              {s.label === "Settled Disputes" && settledLoading && (
                <div className="mt-1 flex items-center gap-2 text-xs text-cyan-300">
                  <DottedSpinner size="small" />
                  <span>Loading...</span>
                </div>
              )}
              {s.label === "Active Users" && usersLoading && (
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
}

// Enhanced KPIChart component
export function KPIChart() {
  const { data: rawData, loading } = useAllAgreementsForGrowth();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );

  const chartData = useMemo(() => {
    return groupByTimeframe(rawData, timeframe);
  }, [rawData, timeframe]);

  if (loading) {
    return (
      <div className="card-cyan relative flex h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-4 flex flex-col items-center justify-between">
          <div>
            <h3 className="font-bold text-white lg:text-xl">Network Growth</h3>
            <p className="text-sm text-cyan-200/60">
              Cumulative agreements over time
            </p>
          </div>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <DottedSpinner size="large" />
          <span className="ml-4 text-cyan-300">Loading growth data...</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card-cyan relative flex h-[400px] flex-col rounded-2xl border border-cyan-400/60 p-5">
        <div className="mb-4 flex flex-col items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Network Growth</h3>
            <p className="text-sm text-cyan-200/60">
              Cumulative agreements over time
            </p>
          </div>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-4xl text-cyan-400">📊</div>
            <h4 className="text-lg font-semibold text-cyan-300">No Data Yet</h4>
            <p className="mt-1 text-sm text-cyan-200/70">
              Create your first agreement to see growth!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // const first = chartData[0];
  // const last = chartData[chartData.length - 1];
  // const growth = last.totalAgreements - first.totalAgreements;
  // const growthPercent =
  //   first.totalAgreements > 0
  //     ? Math.round((growth / first.totalAgreements) * 100)
  //     : 100;

  return (
    <div className="card-cyan relative flex min-h-[400px] flex-col rounded-2xl border border-cyan-400/60 sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center sm:p-0">
        <div className="">
          <h3 className="text-xl font-bold text-white">Network Growth</h3>
          {/* <p className="text-sm text-cyan-200/60">
            Cumulative agreements over time
          </p> */}
          {/* <div className="flex items-center">
            <div className="text-xs text-cyan-200/60">
              {growthPercent}% increase from the first agreement
            </div>
          </div> */}
        </div>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-[300px] flex-1 p-4 sm:p-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={300}
          minWidth={0}
          aspect={undefined}
        >
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(34, 211, 238, 0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Bar for new agreements */}
            <Bar
              dataKey="newAgreements"
              name="New Agreements"
              fill="rgba(34, 211, 238, 0.6)"
              radius={[2, 2, 0, 0]}
              barSize={timeframe === "daily" ? 15 : 25}
            />

            {/* Line for cumulative total */}
            <Line
              type="monotone"
              dataKey="totalAgreements"
              name="Total Agreements"
              stroke="#facc15"
              strokeWidth={2}
              dot={{ r: 3, fill: "#facc15" }}
              activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DisputesInfiniteCards() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDisputes = async () => {
      try {
        setLoading(true);

        const response = await disputeService.getDisputes({
          top: 10,
          sort: "desc", // Get newest first
        });
        const recentDisputes = response.results || [];

        // Transform to DisputeRow format
        const transformedDisputes = recentDisputes.map(
          (dispute: DisputeListItem) =>
            disputeService.transformDisputeListItemToRow(dispute),
        );

        setDisputes(transformedDisputes);
      } catch (error) {
        console.error("Error fetching recent disputes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDisputes();
  }, []);

  // In DisputesInfiniteCards component, update the transformation:
  const disputeItems = useMemo(
    () =>
      disputes.map((dispute) => ({
        id: dispute.id,
        quote:
          dispute.claim || dispute.description || `Dispute: ${dispute.title}`,
        name: dispute.parties,
        title: dispute.title,
        // title: `${dispute.status} • ${dispute.request}`,
        plaintiff: dispute.plaintiff,
        defendant: dispute.defendant,
        plaintiffData: dispute.plaintiffData,
        defendantData: dispute.defendantData,
        // Ensure we're using actual user IDs
        plaintiffUserId:
          dispute.plaintiffData?.userId || dispute.plaintiffData?.id || "",
        defendantUserId:
          dispute.defendantData?.userId || dispute.defendantData?.id || "",
        evidenceCount: dispute.evidence?.length || 0,
      })),
    [disputes],
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="glow-text text-xl font-semibold text-cyan-100">
            Recent Disputes
          </h3>
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
            disabled
          >
            <Scale className="mr-2 h-4 w-4" />
            View All Disputes
          </Button>
        </div>
        <div className="flex h-32 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-cyan-300">
            <DottedSpinner size="medium" />
            <span>Loading disputes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="glow-text text-xl font-semibold text-cyan-100">
          Recent Disputes
        </h3>
        <Link to="/disputes">
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
          >
            <Scale className="mr-2 h-4 w-4" />
            View All Disputes
          </Button>
        </Link>
      </div>
      <InfiniteMovingCardsWithAvatars
        items={disputeItems}
        direction="left"
        speed="normal"
        pauseOnHover={true}
        type="disputes" // New type for disputes
      />
    </div>
  );
}

// NEW: Live Voting Infinite Cards Component
// NEW: Live Voting Infinite Cards Component WITH REAL DATA
function LiveVotingInfiniteCards() {
  const [liveDisputes, setLiveDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveVotingDisputes = async () => {
      try {
        setLoading(true);
        const response = await disputeService.getVoteInProgressDisputes();

        if (response?.results) {
          console.log(
            "🔍 Raw API response for live voting disputes:",
            response.results,
          );

          // In LiveVotingInfiniteCards component, update the transformation:
          const transformedDisputes = response.results.map((dispute: any) => {
            // Calculate time remaining
            let endsAt: number;
            if (dispute.voteStartedAt) {
              const voteStartedAt = parseAPIDate(dispute.voteStartedAt);
              const votingDuration = 24 * 60 * 60 * 1000; // 24 hours
              endsAt = voteStartedAt + votingDuration;
            } else {
              const createdAt = parseAPIDate(dispute.createdAt);
              const votingDuration = 24 * 60 * 60 * 1000;
              endsAt = createdAt + votingDuration;
            }

            const remain = Math.max(0, endsAt - now());
            const daysLeft = Math.ceil(remain / (24 * 60 * 60 * 1000));

            return {
              id: dispute.id.toString(),
              quote:
                dispute.claim ||
                dispute.description ||
                `Dispute: ${dispute.title}`,
              name: `${dispute.parties?.plaintiff?.username || "@plaintiff"} vs ${dispute.parties?.defendant?.username || "@defendant"}`,
              title: `Community Voting • ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`,
              plaintiff: dispute.parties?.plaintiff?.username || "@plaintiff",
              defendant: dispute.parties?.defendant?.username || "@defendant",
              plaintiffData: dispute.parties?.plaintiff,
              defendantData: dispute.parties?.defendant,
              // ADD THESE - Extract actual user IDs
              plaintiffUserId:
                dispute.parties?.plaintiff?.id?.toString() ||
                dispute.parties?.plaintiff?.userId ||
                "",
              defendantUserId:
                dispute.parties?.defendant?.id?.toString() ||
                dispute.parties?.defendant?.userId ||
                "",
              endsAt: endsAt,
              hasVoted: dispute.hasVoted || false,
            };
          });

          setLiveDisputes(transformedDisputes);
          console.log(
            "✅ Live voting disputes loaded:",
            transformedDisputes.length,
          );
        } else {
          setLiveDisputes([]);
        }
      } catch (error) {
        console.error("Error fetching live voting disputes:", error);
        setLiveDisputes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveVotingDisputes();
  }, []);

  // Helper function to parse API dates (same as in Voting component)
  const parseAPIDate = (dateString: string): number => {
    const date = new Date(dateString);
    if (!dateString.endsWith("Z")) {
      return new Date(dateString + "Z").getTime();
    }
    return date.getTime();
  };

  const now = () => Date.now();

  if (loading) {
    return (
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="glow-text text-xl font-semibold text-cyan-100">
            Live Voting Sessions
          </h3>
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
            disabled
          >
            <Scale className="mr-2 h-4 w-4" />
            Participate in Voting
          </Button>
        </div>
        <div className="flex h-32 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4 text-cyan-300">
            <DottedSpinner size="medium" />
            <span>Loading live voting sessions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-cyan rounded-2xl border border-cyan-400/30 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="glow-text text-xl font-semibold text-cyan-100">
          Live Voting Sessions
        </h3>
        <Link to="/voting">
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
          >
            <Vote className="mr-2 h-4 w-4" />
            Participate in Voting
          </Button>
        </Link>
      </div>

      {liveDisputes.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center">
            <h4 className="mb-1 text-lg font-semibold text-cyan-300">
              No Active Votes
            </h4>
            <p className="text-sm text-cyan-200/70">
              There are currently no disputes in the voting phase.
            </p>
          </div>
        </div>
      ) : (
        <InfiniteMovingCardsWithAvatars
          items={liveDisputes}
          direction="left"
          speed="normal"
          pauseOnHover={true}
          type="live-voting" // Use the new type
        />
      )}
    </div>
  );
}

// NEW: Signed Agreements Infinite Cards Component WITH AVATARS
function SignedAgreementsInfiniteCards() {
  const { agreements, loading } = usePublicAgreements();

  const signedAgreements = useMemo(
    () => agreements.filter((agreement) => agreement.status === "signed"),
    [agreements],
  );

  console.log("🔍 SIGNED AGREEMENTS:", signedAgreements);

  const agreementItems = useMemo(
    () =>
      signedAgreements.map((agreement) => ({
        id: agreement.id,
        quote: agreement.description, // This should now show the actual description
        name: `${agreement.createdBy} ↔ ${agreement.counterparty}`,
        title: agreement.title,
        createdBy: agreement.createdBy,
        counterparty: agreement.counterparty,
        createdByUserId: agreement.createdByUserId,
        createdByAvatarId: agreement.createdByAvatarId,
        counterpartyUserId: agreement.counterpartyUserId,
        counterpartyAvatarId: agreement.counterpartyAvatarId,
      })),
    [signedAgreements],
  );

  if (loading) {
    return (
      <div className="card-cyan rounded-2xl border border-cyan-400/60 p-6">
        <h3 className="glow-text mb-4 text-xl font-semibold text-cyan-100">
          Signed Agreements
        </h3>
        <div className="flex h-32 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-cyan-300">
            <DottedSpinner size="medium" />
            <span>Loading agreements...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-cyan rounded-2xl border border-cyan-400/60 p-6">
      <h3 className="glow-text mb-4 text-xl font-semibold text-cyan-100">
        Signed Agreements ({signedAgreements.length})
      </h3>
      {signedAgreements.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <div className="mb-2">
              <DottedSpinner size="medium" />
            </div>
            <h4 className="mb-1 text-lg font-semibold text-cyan-300">
              No Signed Agreements
            </h4>
            <p className="text-sm text-cyan-200/70">
              There are currently no signed agreements to display.
            </p>
          </div>
        </div>
      ) : (
        <InfiniteMovingAgreements
          items={agreementItems}
          direction="left"
          speed="normal"
          pauseOnHover={true}
          className="max-w-full"
        />
      )}
    </div>
  );
}

// NEW: Renowned Judges Infinite Cards Component WITH AVATARS ON TOP
function RenownedJudgesInfiniteCards() {
  const judgeItems = useMemo(
    () => [
      {
        quote:
          "Lead arbitrator, Solidity auditor, and DAO governance advisor with 5+ years in on-chain dispute resolution. Known for technical fairness and precise smart contract analysis.",
        name: "@judgeNova",
        title: "Lead Arbitrator • Solidity Expert",
        avatar: avatar2,
        userId: "judgeNova",
      },
      {
        quote:
          "Founder of AresLabs • DeFi risk analyst and strategist. Brings deep financial expertise to tokenomics disputes and contract risk assessments.",
        name: "@judgeAres",
        title: "DeFi Risk Analyst • Financial Strategist",
        avatar: avatar1,
        userId: "judgeAres",
      },
      {
        quote:
          "Full-stack developer and Layer-2 researcher with focus on zk-rollups and protocol efficiency. Mediates technical disputes with balanced reasoning.",
        name: "@judgeKai",
        title: "Full-Stack Developer • L2 Researcher",
        avatar: avatar4,
        userId: "judgeKai",
      },
      {
        quote:
          "Corporate lawyer and IP rights advocate bridging Web2 and Web3 legal frameworks. Oversees intellectual property and compliance-related disputes.",
        name: "@judgeVera",
        title: "Corporate Lawyer • IP Rights Expert",
        avatar: avatar3,
        userId: "judgeVera",
      },
      {
        quote:
          "Protocol governance specialist and DAO operations consultant. Focuses on collective decision-making ethics and decentralization fairness.",
        name: "@judgeOrion",
        title: "Governance Specialist • DAO Consultant",
        avatar: avatar4,
        userId: "judgeOrion",
      },
    ],
    [],
  );

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
      <h3 className="glow-text mb-4 text-xl font-semibold text-cyan-100">
        Renowned Judges
      </h3>
      <InfiniteMovingJudges
        items={judgeItems}
        direction="right"
        speed="slow"
        pauseOnHover={true}
        className="max-w-full"
      />
    </div>
  );
}
