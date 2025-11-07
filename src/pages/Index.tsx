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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  ComposedChart,
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

// Cache for expensive calculations
const revenueCache = new Map();
const seriesCache = new Map();

export default function Index() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute top-[10px] left-0 block rounded-md bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div>
      <div className="absolute top-[300px] right-0 block rounded-md bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div>
      <div className="absolute inset-0 -z-[50] bg-cyan-300/1 blur-3xl"></div>

      <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-5">
        <div className="col-span-2 flex h-fit w-full flex-col gap-4">
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
    <section>
      <div className="glass relative items-center gap-6 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent px-6 py-6">
        <div className="relative z-[1]">
          <h1 className="glow-text space text-3xl font-bold tracking-tight text-white">
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
    <section className="glass relative border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-5">
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

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
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
            <RTooltip
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

  const stats = useMemo(
    () => [
      {
        label: "Settled Disputes",
        value: settledLoading ? 342 : settledCount,
        icon: Trophy,
      },
      { label: "Judges", value: 28, icon: Scale },
      { label: "Eligible Voters", value: 12400, icon: Users },
      {
        label: "Agreements",
        value: agreementsLoading ? 4 : agreementsCount,
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
    ],
  );

  return (
    <section className="glass card-cyan justify-center gap-8 rounded-2xl px-4 py-4 lg:p-8">
      <h3 className="space mb-6 text-center text-lg font-semibold text-white/90 lg:text-xl">
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
                className="font-bold text-white lg:text-2xl"
              />
              {/* Show loading indicators */}
              {s.label === "Settled Disputes" && settledLoading && (
                <div className="mt-1 text-xs text-cyan-300">Loading...</div>
              )}
              {s.label === "Active Users" && usersLoading && (
                <div className="mt-1 text-xs text-cyan-300">Loading...</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KPIChart() {
  const daily = useMemo(() => genSeries("daily"), []);
  const weekly = useMemo(() => genSeries("weekly"), []);
  const monthly = useMemo(() => genSeries("monthly"), []);

  const [tab, setTab] = useState("daily");
  const data = tab === "daily" ? daily : tab === "weekly" ? weekly : monthly;

  return (
    <section className="glass relative mt-4 border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-5 md:mt-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="space font-semibold text-white/90 lg:text-xl">
          Network Activity
        </h3>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <RTooltip
              contentStyle={{
                background: "rgba(15,23,42,.9)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8,
                color: "#e2e8f0",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="agreements"
              name="Agreements"
              stroke="#facc15"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="judges"
              name="Judges"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="voters"
              name="Community Voters"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function genSeries(type: "daily" | "weekly" | "monthly"): any[] {
  const cacheKey = `series-${type}`;
  if (seriesCache.has(cacheKey)) {
    return seriesCache.get(cacheKey);
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
    for (let i = 1; i <= 14; i++) {
      out.push({
        t: `Day ${i}`,
        revenue: 100 + Math.random() * 80 + i * 5,
        agreements: 40 + Math.random() * 25 + i * 2,
        judges: 10 + Math.random() * 6 + i * 0.5,
        voters: 60 + Math.random() * 40 + i * 3,
      });
    }
  } else if (type === "weekly") {
    for (let m = 0; m < 12; m++) {
      out.push({
        t: months[m],
        revenue: 120 + Math.random() * 80 + m * 10,
        agreements: 50 + Math.random() * 25 + m * 3,
        judges: 12 + Math.random() * 6 + m * 0.5,
        voters: 70 + Math.random() * 40 + m * 4,
      });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      out.push({
        t: months[m],
        revenue: 150 + Math.random() * 100 + m * 20,
        agreements: 60 + Math.random() * 30 + m * 5,
        judges: 14 + Math.random() * 8 + m,
        voters: 80 + Math.random() * 50 + m * 6,
      });
    }
  }

  seriesCache.set(cacheKey, out);
  return out;
}

// NEW: Disputes Infinite Cards Component - UPDATED WITH REAL DATA
function DisputesInfiniteCards() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDisputes = async () => {
      try {
        setLoading(true);
        // Get recent disputes (you might want to add a limit parameter to your API)
        const response = await disputeService.getDisputes({
          top: 10, // Limit to 10 recent disputes
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
        title: `${dispute.status} • ${dispute.request}`,
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
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
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
          <div className="flex items-center gap-2 text-cyan-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            <span>Loading disputes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
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
        direction="right"
        speed="slow"
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
          <div className="flex items-center gap-2 text-cyan-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            <span>Loading live voting sessions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="glow-text text-xl font-semibold text-cyan-100">
          Live Voting Sessions
        </h3>
        <Link to="/voting">
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
          >
            <Scale className="mr-2 h-4 w-4" />
            Participate in Voting
          </Button>
        </Link>
      </div>

      {liveDisputes.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-4xl">🗳️</div>
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
  const { agreements: allAgreements, loading } = usePublicAgreements();

  const signedAgreements = useMemo(
    () =>
      allAgreements.filter(
        (agreement) =>
          agreement.status === "signed" || agreement.status === "completed",
      ),
    [allAgreements],
  );

  const agreementItems = useMemo(
    () =>
      signedAgreements.map((agreement) => ({
        id: agreement.id,
        quote: agreement.description,
        name: `${agreement.createdBy} ↔ ${agreement.counterparty}`,
        title: `${agreement.amount ? `${agreement.amount} ${agreement.token} • ` : ""}${agreement.status}`,
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
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
        <h3 className="glow-text mb-4 text-xl font-semibold text-cyan-100">
          Signed Agreements
        </h3>
        <div className="flex h-32 items-center justify-center">
          <div className="flex items-center gap-2 text-cyan-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            <span>Loading agreements...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
      <h3 className="glow-text mb-4 text-xl font-semibold text-cyan-100">
        Signed Agreements
      </h3>
      <InfiniteMovingAgreements
        items={agreementItems}
        direction="left"
        speed="normal"
        pauseOnHover={true}
        className="max-w-full"
      />
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
