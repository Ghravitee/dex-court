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
import avatar from "../assets/avatar.webp";
import { fetchAgreements } from "../lib/mockApi";
import { getDisputes, type DisputeRow } from "../lib/mockDisputes";

export default function Index() {
  return (
    <div className="relative overflow-hidden">
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
    </div>
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

// Helper for revenue generation
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
        t: `Day ${i}`,
        revenue: 15000 + Math.random() * 4000 + i * 200,
      });
    }
  } else if (type === "weekly") {
    // 4 weeks per month label
    for (let m = 0; m < 12; m++) {
      out.push({
        t: months[m],
        revenue: 15000 + Math.random() * 4000 + m * 800,
      });
    }
  } else {
    // monthly view — one bar per month
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
            className="glass flex h-[11rem] min-w-full flex-col items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-5 transition"
          >
            <div className="mt-1 text-lg font-semibold text-[#0891b2]">
              {item.title}
            </div>
            <div className="mt-2 text-sm text-white/60">{item.parties}</div>
            <p className="mt-2 text-sm text-white/80">{item.status}</p>
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
      bio: "Arbitrator & smart contract auditor",
      href: "/judges/nova",
      avatar,
    },
    {
      name: "@judgeAres",
      tg: "",
      x: "@ares_eth",
      href: "/judges/ares",
      bio: "Founder • DeFi risk analyst",
      avatar,
    },
    {
      name: "@judgeKai",
      tg: "@kai",
      x: "@kai_io",
      href: "/judges/kai",
      bio: "Full-stack dev & L2 researcher",
      avatar,
    },
    {
      name: "@judgeVera",
      tg: "",
      x: "@vera_x",
      href: "/judges/vera",
      bio: "Corporate lawyer • IP",
      avatar,
    },
    {
      name: "@judgeOrion",
      tg: "@orion",
      x: "@orion_xyz",
      href: "/judges/orion",
      bio: "Protocol governance specialist",
      avatar,
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
        className="relative flex w-full transition-transform duration-700 ease-in-out"
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
            className="glass flex min-w-full flex-col items-center justify-center gap-3 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 transition-all duration-700"
          >
            <img
              src={j.avatar}
              alt={j.name}
              className="h-20 w-20 rounded-full border-2 border-cyan-400/40 object-cover shadow-lg"
            />
            <div className="text-lg font-semibold text-[#0891b2]">{j.name}</div>
            <div className="flex justify-center gap-2 text-sm text-white/60">
              {j.tg && <span>{j.tg}</span>}
              {j.x && <span>{j.x}</span>}
            </div>
            <p className="text-center text-sm text-white/70">{j.bio}</p>
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
      title: "Escrow Refund",
      parties: "@0xNova vs @0xVega",
      desc: "Plaintiff requests refund after contractor missed milestones.",
      href: "/voting",
    },
    {
      id: 2,
      title: "Code Ownership Dispute",
      parties: "@0xLuna vs @0xSol",
      desc: "Clarifying IP rights for jointly developed smart contract.",
      href: "/voting",
    },
    {
      id: 3,
      title: "Liquidity Pool Compensation",
      parties: "@0xTheta vs @0xDelta",
      desc: "Community voting on compensation after protocol bug exploit.",
      href: "/voting",
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
    <div className="relative mt-4 overflow-hidden lg:mt-0 lg:h-[15rem]">
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
            <p className="text-sm text-white/80">{v.desc}</p>

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
    fetchAgreements().then((data) => {
      setAgreements(data.filter((a) => a.status === "signed"));
    });
  }, []);

  // auto slide
  useEffect(() => {
    if (!agreements.length) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(next, 4500);
    return () => clearTimeout(timeoutRef.current || undefined);
  }, [index, agreements.length, next]);

  if (!agreements.length) {
    return (
      <div className="glass flex h-[15rem] items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 text-white/70">
        Loading signed agreements...
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
            className="glass flex h-[14.6rem] min-w-full flex-col items-start justify-center gap-3 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 transition-all duration-700"
          >
            <div className="flex items-center gap-3">
              <Handshake className="h-6 w-6 text-cyan-400" />
              <h4 className="text-lg font-semibold text-[#0891b2]">
                {a.title}
              </h4>
            </div>
            <p className="text-sm text-white/70">{a.description}</p>
            <div className="flex w-full items-center justify-between text-sm text-white/60">
              <span>{a.counterparty}</span>
              <span className="text-cyan-300">
                {a.amount} {a.token}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
