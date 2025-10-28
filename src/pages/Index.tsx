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
  ChevronLeft,
  ChevronRight,
  // Vote,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { getDisputes, type DisputeRow } from "../lib/mockDisputes";
import { agreementService } from "../services/agreementServices";
import { UserAvatar } from "../components/UserAvatar";

export default function Index() {
  return (
    <main style={{ display: "block" }} className="relative overflow-hidden">
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

      <div className="mt-4 grid grid-cols-1 items-stretch gap-x-6 lg:grid-cols-2">
        {/* <JudgesIntro /> */}
        <DisputesSlideshow />
        <LiveVoting />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
        <SignedAgreements />
        <RenownedJudges />
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
        t: i, // Changed from "Day ${i}" to just the number
        revenue: 15000 + Math.random() * 4000 + i * 200,
      });
    }
  } else if (type === "weekly") {
    // 4 bars per month, start from January but skip its label
    for (let m = 0; m < 12; m++) {
      for (let w = 0; w < 4; w++) {
        out.push({
          t: m === 0 ? "" : months[m], // no label for January
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

  return out;
}

function StatsGrid() {
  const stats = [
    { label: "Settled Disputes", value: 342, icon: Trophy },
    { label: "Judges", value: 28, icon: Scale },
    { label: "Eligible Voters", value: 12400, icon: Users },
    { label: "Agreements", value: 5312, icon: Handshake },
    { label: "Platform Revenue", value: 214000, icon: Landmark, prefix: "$" },
    { label: "Escrow TVL", value: 3100000, icon: Banknote, prefix: "$" },
    { label: "Active Users", value: 7902, icon: User },
    { label: "Paid to Judges", value: 68000, icon: Coins, prefix: "$" },
    { label: "Paid to Community", value: 112000, icon: Wallet, prefix: "$" },
  ];

  return (
    <section className="glass card-cyan justify-center gap-8 rounded-2xl px-4 py-4 lg:p-8">
      <h3 className="space mb-6 text-center text-lg font-semibold text-white/90 lg:text-xl">
        Statistics
      </h3>

      {/* One grid for all stats */}
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
      {/* <div className="absolute top-[50px] right-0 left-0 mx-auto block rounded-md bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div> */}
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
              stroke="#facc15" // yellow-gold, contrasts the blue tones
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="judges"
              name="Judges"
              stroke="#ef4444" // red, gives strong contrast
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="voters"
              name="Community Voters"
              stroke="#8b5cf6" // purple neon
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
  return out;
}

function DisputesSlideshow() {
  const [data, setData] = useState<DisputeRow[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    getDisputes().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delay = useMemo(() => 3500 + Math.floor(Math.random() * 1200), []);

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % data.length);
  }, [data.length]);

  const prevSlide = useCallback(() => {
    setIndex((prev) => (prev - 1 + data.length) % data.length);
  }, [data.length]);
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(nextSlide, delay);
    return () => clearTimeout(timeoutRef.current || undefined);
  }, [index, nextSlide, delay]);

  // Swipe gestures for mobile
  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (diff > 50) prevSlide();
    if (diff < -50) nextSlide();
    touchStart.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      <div className="mt-4 mb-2 flex items-center justify-between md:mt-0">
        <h3 className="space max-w-[20rem] text-[17px] font-semibold text-white/90">
          Have you been wronged or cheated? Don’t stay silent, start a{" "}
          <Link to={"/disputes"} className="text-[#0891b2]">
            dispute
          </Link>
          .
        </h3>

        <div className="mb-3 flex items-center justify-between">
          {/* <h1 className="text-xl text-white">Disputes</h1> */}
          <Link
            to={"/disputes"}
            className="neon-hover ring-offset-background focus-visible:ring-ring relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-500/15 px-4 py-3 text-sm font-medium whitespace-nowrap text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-colors hover:bg-cyan-500/20 hover:shadow-[0_0_34px_rgba(34,211,238,0.6)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <Scale className="mr-2 h-4 w-4" />
            Create Dispute
          </Link>
        </div>
      </div>

      <div
        className="relative flex w-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {data.map((item, i) => (
          <Link
            key={item.id}
            to={`/disputes/${item.id}`}
            style={{
              transform: i === index ? "scale(1)" : "scale(0.9)",
              opacity: i === index ? 1 : 0.4,
            }}
            className="glass flex min-w-full flex-col items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-5 transition lg:h-[13.5rem]"
          >
            <div className="mt-1 text-lg font-semibold text-[#0891b2]">
              {item.title}
            </div>
            <div className="mt-2 text-sm text-white/60">{item.parties}</div>
            <p className="mt-2 text-sm">
              {item.status === "Settled" ? (
                <span className="badge badge-blue">Settled</span>
              ) : item.status === "Pending" ? (
                <span className="badge badge-orange">Pending</span>
              ) : item.status === "Dismissed" ? (
                <span className="badge badge-red">Dismissed</span>
              ) : (
                <span className="badge border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                  Vote in Progress
                </span>
              )}
            </p>

            {/* 🆕 Optional new info */}
            <p className="mt-2 line-clamp-2 text-center text-xs text-white/60 italic">
              “{item.claim}”
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
              <span>
                {item.evidence.length}{" "}
                {item.evidence.length > 1 ? "evidences" : "evidence"}
              </span>
              {item.witnesses.length > 0 && (
                <span>{item.witnesses.length} witnesses</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RenownedJudges() {
  const judges = [
    {
      name: "@judgeNova",
      tg: "@judgeNova",
      x: "@nova_xyz",
      href: "/judges/nova",
      bio: "Lead arbitrator, Solidity auditor, and DAO governance advisor with 5+ years in on-chain dispute resolution. Known for technical fairness and precise smart contract analysis.",
      avatar: avatar2,
    },
    {
      name: "@judgeAres",
      tg: "@judgeAres",
      x: "@ares_eth",
      href: "/judges/ares",
      bio: "Founder of AresLabs • DeFi risk analyst and strategist. Brings deep financial expertise to tokenomics disputes and contract risk assessments.",
      avatar: avatar1,
    },
    {
      name: "@judgeKai",
      tg: "@kai",
      x: "@kai_io",
      href: "/judges/kai",
      bio: "Full-stack developer and Layer-2 researcher with focus on zk-rollups and protocol efficiency. Mediates technical disputes with balanced reasoning.",
      avatar: avatar4,
    },
    {
      name: "@judgeVera",
      tg: "@vera_lex",
      x: "@vera_x",
      href: "/judges/vera",
      bio: "Corporate lawyer and IP rights advocate bridging Web2 and Web3 legal frameworks. Oversees intellectual property and compliance-related disputes.",
      avatar: avatar3,
    },
    {
      name: "@judgeOrion",
      tg: "@orion_xyz",
      x: "@orion_xyz",
      href: "/judges/orion",
      bio: "Protocol governance specialist and DAO operations consultant. Focuses on collective decision-making ethics and decentralization fairness.",
      avatar: avatar4,
    },
  ];

  const [index, setIndex] = useState(0);
  const delay = useMemo(() => 4200 + Math.floor(Math.random() * 1000), []);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(
    () => setIndex((prev) => (prev + 1) % judges.length),
    [judges.length],
  );
  const prev = useCallback(
    () => setIndex((prev) => (prev - 1 + judges.length) % judges.length),
    [judges.length],
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(next, delay);
    return () => clearTimeout(timeoutRef.current || undefined);
  }, [index, next, delay]);

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="glow-text mb-2 font-semibold text-cyan-100 lg:text-xl">
          Renowned Judges
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prev}>
            <ChevronLeft className="text-cyan-300 hover:text-cyan-400" />
          </button>
          <button onClick={next}>
            <ChevronRight className="text-cyan-300 hover:text-cyan-400" />
          </button>
        </div>
      </div>

      <div
        className="relative flex w-full transition-transform duration-700 ease-in-out lg:h-[15rem]"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {judges.map((j, i) => (
          <Link
            to={j.href}
            key={j.name}
            style={{
              transform: i === index ? "scale(1)" : "scale(0.9)",
              opacity: i === index ? 1 : 0.4,
            }}
            className="glass flex min-w-full items-center gap-6 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 transition-all duration-700"
          >
            <img
              src={j.avatar}
              alt={j.name}
              className="h-20 w-20 rounded-full border-2 border-cyan-400/40 object-contain shadow-lg"
            />
            <div className="flex flex-col text-left">
              <div className="text-lg font-semibold text-[#0891b2]">
                {j.name}
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-white/60">
                {j.tg && <span>{j.tg}</span>}
                {j.x && <span>{j.x}</span>}
              </div>
              <p className="mt-2 max-w-[25rem] text-sm leading-relaxed text-white/70">
                {j.bio}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LiveVoting() {
  const votes = [
    {
      id: 1,
      title: "Escrow Refund Request",
      parties: "@0xNova vs @0xVega",
      desc: "The plaintiff seeks a full refund after the developer missed two key delivery milestones in a freelance contract. Community members are voting on whether the escrow should be released or refunded.",
      href: "/voting/escrow-refund",
    },
    {
      id: 2,
      title: "Code Ownership Dispute",
      parties: "@0xLuna vs @0xSol",
      desc: "A disagreement over authorship of a jointly developed smart contract for an NFT minting protocol. Voters must decide if both parties share IP rights or if one contributor holds exclusive control.",
      href: "/voting/code-ownership",
    },
    {
      id: 3,
      title: "Liquidity Pool Compensation Proposal",
      parties: "@0xTheta vs @0xDelta",
      desc: "Following a governance bug exploit that drained 12% of the liquidity pool, the DAO proposes a partial reimbursement to affected users. Voters decide whether compensation should be approved or rejected.",
      href: "/voting/liquidity-compensation",
    },
    {
      id: 4,
      title: "NFT Royalties Dispute",
      parties: "@0xAria vs @0xMaven",
      desc: "An artist claims unpaid royalties from a secondary marketplace smart contract. The defendant argues the royalties were waived under a previous governance proposal. The vote determines if compensation is due.",
      href: "/voting/nft-royalties",
    },
    {
      id: 5,
      title: "Protocol Exploit Responsibility",
      parties: "@0xEcho vs @0xPrime",
      desc: "A protocol contributor is accused of negligence after a critical vulnerability went unpatched. The community votes to determine accountability and potential penalties.",
      href: "/voting/protocol-liability",
    },
    {
      id: 6,
      title: "DAO Fund Misallocation",
      parties: "@0xAtlas vs @0xCoreDAO",
      desc: "A member alleges that DAO funds were misused for personal gain by a multisig signer. Voters must decide whether to initiate a treasury audit and revoke privileges.",
      href: "/voting/dao-fund-misuse",
    },
  ];

  const [index, setIndex] = useState(0);
  const delay = useMemo(() => 5000 + Math.floor(Math.random() * 1200), []);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(
    () => setIndex((prev) => (prev + 1) % votes.length),
    [votes.length],
  );
  const prev = useCallback(
    () => setIndex((prev) => (prev - 1 + votes.length) % votes.length),
    [votes.length],
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(next, delay);
    return () => clearTimeout(timeoutRef.current || undefined);
  }, [index, next, delay]);

  return (
    <div className="relative mt-4 overflow-hidden lg:mt-0 lg:h-[18rem]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="glow-text mb-2 font-semibold text-cyan-100 lg:text-xl">
          Live Voting
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prev}>
            <ChevronLeft className="text-cyan-300 hover:text-cyan-400" />
          </button>
          <button onClick={next}>
            <ChevronRight className="text-cyan-300 hover:text-cyan-400" />
          </button>
        </div>
      </div>

      <div
        className="relative flex w-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {votes.map((v, i) => (
          <div
            key={v.id}
            style={{
              transform: i === index ? "scale(1)" : "scale(0.9)",
              opacity: i === index ? 1 : 0.4,
            }}
            className="glass flex min-w-full flex-col items-center justify-between rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 transition-all duration-700"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="text-lg font-semibold text-[#0891b2]">
                  {v.title}
                </div>
                <div className="text-sm text-white/60">{v.parties}</div>
              </div>
            </div>
            <p className="mx-auto max-w-[30rem] text-center text-sm text-white/80">
              {v.desc}
            </p>

            {/* Updated button section */}
            <div className="mt-4 flex justify-center">
              <Link
                to={v.href}
                className="neon-hover flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-6 py-2 text-sm font-medium text-cyan-200 transition-all hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
              >
                <Scale className="h-4 w-4" />
                Vote
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignedAgreements() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(
    () => setIndex((prev) => (prev + 1) % agreements.length),
    [agreements.length],
  );
  const prev = useCallback(
    () =>
      setIndex((prev) => (prev - 1 + agreements.length) % agreements.length),
    [agreements.length],
  );

  useEffect(() => {
    const loadSignedAgreements = async () => {
      try {
        setLoading(true);

        // Fetch only public agreements (visibility = 2 or 3)
        const publicAgreements = await agreementService.getAgreements();

        console.log("📋 Public agreements for signed:", publicAgreements);

        // Handle the response structure properly
        const publicAgreementsList = publicAgreements.results || [];

        // Filter for:
        // 1. ACTIVE status (status = 2) - signed agreements
        // 2. PUBLIC or AUTO_PUBLIC visibility (visibility = 2 or 3)
        const signedPublicAgreements = publicAgreementsList
          .filter(
            (agreement: any) =>
              agreement.status === 2 && // ACTIVE status (signed)
              (agreement.visibility === 2 || agreement.visibility === 3), // PUBLIC or AUTO_PUBLIC
          )
          .map((agreement: any) => ({
            id: agreement.id.toString(),
            title: agreement.title || "Untitled Agreement",
            description: agreement.description || "No description provided",
            counterparty: agreement.counterParty?.username || "Unknown",
            createdBy: agreement.firstParty?.username || "Unknown",
            status: "signed", // Since we're filtering for status 2
            dateCreated: agreement.dateCreated
              ? new Date(agreement.dateCreated).toLocaleDateString()
              : "Unknown date",
            deadline: agreement.deadline
              ? new Date(agreement.deadline).toLocaleDateString()
              : "No deadline",
            amount: agreement.amount ? agreement.amount.toString() : undefined,
            token: agreement.tokenSymbol || undefined,
            // Add avatar information if available
            createdByAvatarId: agreement.firstParty?.avatarId || null,
            counterpartyAvatarId: agreement.counterParty?.avatarId || null,
            createdByUserId: agreement.firstParty?.id?.toString(),
            counterpartyUserId: agreement.counterParty?.id?.toString(),
          }));

        console.log(
          "✅ Signed PUBLIC agreements found:",
          signedPublicAgreements.length,
        );
        setAgreements(signedPublicAgreements);
      } catch (error) {
        console.error("Failed to fetch signed agreements:", error);
        setAgreements([]);
      } finally {
        setLoading(false);
      }
    };

    loadSignedAgreements();
  }, []);

  // Auto slide
  useEffect(() => {
    if (!agreements.length) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(next, 4500);
    return () => clearTimeout(timeoutRef.current || undefined);
  }, [index, agreements.length, next]);

  if (loading) {
    return (
      <div className="">
        <h3 className="glow-text mb-2 font-semibold text-cyan-100 lg:text-xl">
          Signed Agreements
        </h3>
        <div className="glass flex h-[15rem] items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
          <div className="flex items-center gap-2 text-cyan-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            <span>Loading signed agreements...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!agreements.length) {
    return (
      <div className="">
        <h3 className="glow-text mb-2 font-semibold text-cyan-100 lg:text-xl">
          Signed Agreements
        </h3>
        <div className="glass flex h-[15rem] items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
          <div className="text-center">
            <Handshake className="mx-auto mb-2 h-8 w-8 text-cyan-400/60" />
            <p className="text-white/70">No signed agreements found</p>
            <p className="mt-1 text-sm text-white/50">
              Agreements that are signed and active will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="glow-text mb-2 font-semibold text-cyan-100 lg:text-xl">
          Signed Agreements
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prev}>
            <ChevronLeft className="text-cyan-300 hover:text-cyan-400" />
          </button>
          <button onClick={next}>
            <ChevronRight className="text-cyan-300 hover:text-cyan-400" />
          </button>
        </div>
      </div>

      <div
        className="relative flex w-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {agreements.map((a, i) => (
          <Link
            key={a.id}
            to={`/agreements/${a.id}`}
            style={{
              transform: i === index ? "scale(1)" : "scale(0.9)",
              opacity: i === index ? 1 : 0.4,
            }}
            className="glass flex h-[14.6rem] min-w-full flex-col items-start justify-between rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 transition-all duration-700"
          >
            <div className="w-full">
              <div className="mb-3 flex items-center gap-3">
                <Handshake className="h-6 w-6 text-cyan-400" />
                <h4 className="line-clamp-1 text-lg font-semibold text-[#0891b2]">
                  {a.title}
                </h4>
              </div>
              <p className="mb-4 line-clamp-2 text-sm text-white/70">
                {a.description}
              </p>

              {/* Parties with avatars */}
              <div className="mb-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <UserAvatar
                    userId={a.createdByUserId || a.createdBy}
                    avatarId={a.createdByAvatarId || null}
                    username={a.createdBy}
                    size="sm"
                  />
                  <span className="text-sm text-white/80">{a.createdBy}</span>
                </div>
                <span className="text-xs text-cyan-400">↔</span>
                <div className="flex items-center gap-1">
                  <UserAvatar
                    userId={a.counterpartyUserId || a.counterparty}
                    avatarId={a.counterpartyAvatarId || null}
                    username={a.counterparty}
                    size="sm"
                  />
                  <span className="text-sm text-white/80">
                    {a.counterparty}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {a.amount && (
                  <span className="font-medium text-cyan-300">
                    {a.amount} {a.token}
                  </span>
                )}
                <span className="badge badge-blue">Signed</span>
              </div>
              <div className="text-xs text-white/40">
                Created: {a.dateCreated}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
