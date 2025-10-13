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
  ThumbsUp,
  ThumbsDown,
  Users,
  Timer,
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
import avatar1 from "../assets/avatar-1.jpg";
import avatar2 from "../assets/avatar-2.jpg";
import avatar3 from "../assets/avatar-3.jpg";
import avatar4 from "../assets/avatar-4.jpg";
import avatar5 from "../assets/avatar-5.jpg";
import { Link } from "react-router-dom";

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
      {/* <CardLinks /> */}

      <div className="mt-4 grid grid-cols-1 gap-x-6 lg:grid-cols-3">
        <JudgesIntro />

        <DisputesSlideshow />
      </div>
      <RenownedJudges />
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

// function CardLinks() {
//   return (
//     <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
//       <Card
//         title="Agreements"
//         icon={<FileText className="h-4 w-4" />}
//         to="/agreements"
//         color="from-cyan-500/10"
//         description="Draft, sign, and manage tamper-proof smart agreements."
//       />
//       <Card
//         title="Disputes"
//         icon={<Scale className="h-4 w-4" />}
//         to="/disputes"
//         color="from-cyan-500/10"
//         description="Resolve conflicts through transparent voting and evidence."
//       />
//       <Card
//         title="Escrow"
//         icon={<BadgeDollarSign className="h-4 w-4" />}
//         to="/escrow"
//         color="from-sky-500/10"
//         description="Secure funds in trustless, automated escrow vaults."
//       />
//       <Card
//         title="Voting Hub"
//         icon={<Vote className="h-4 w-4" />}
//         to="/voting"
//         color="from-cyan-500/10"
//         description="Participate in community verdicts and shape case outcomes."
//       />
//       <Card
//         title="Reputation"
//         icon={<Star className="h-4 w-4" />}
//         to="/reputation"
//         color="from-cyan-500/10"
//         description="Earn credibility as you engage with agreements & disputes."
//       />
//       <Card
//         title="Profile"
//         icon={<User className="h-4 w-4" />}
//         to="/profile"
//         color="from-cyan-500/10"
//         description="View your activity, reputation, and arbitration history."
//       />
//     </section>
//   );
// }

function RevenueChart() {
  type Point = { t: string; revenue: number };

  const daily = useMemo<Point[]>(() => genRevenue(30), []);
  const weekly = useMemo<Point[]>(() => genRevenue(12, 7), []);
  const monthly = useMemo<Point[]>(() => genRevenue(12, 30), []);

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
function genRevenue(n: number, step = 1): any[] {
  const out: any[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      t: `${i * step + 1}`,
      revenue: 15000 + Math.random() * 4000 + i * 200, // simulates gradual growth
    });
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
    <section className="glass justify-center gap-8 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-8">
      <h3 className="space mb-6 font-semibold text-white/90 lg:text-xl">
        Statistics
      </h3>

      {/* One grid for all stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex min-w-[11rem] items-center gap-4">
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
                className="text-2xl font-bold text-white"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function KPIChart() {
  type Point = {
    t: string;
    revenue: number;
    agreements: number;
    judges: number;
    voters: number;
  };
  const daily = useMemo<Point[]>(() => genSeries(14), []);
  const weekly = useMemo<Point[]>(() => genSeries(12, 7), []);
  const monthly = useMemo<Point[]>(() => genSeries(12, 30), []);
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

function genSeries(n: number, step = 1): any[] {
  const out = [] as any[];
  for (let i = 0; i < n; i++) {
    out.push({
      t: `${i * step + 1}`,
      revenue: 100 + Math.random() * 80 + i * 5,
      agreements: 40 + Math.random() * 25 + i * 2,
      judges: 10 + Math.random() * 6 + i * 0.5,
      voters: 60 + Math.random() * 40 + i * 3,
    });
  }
  return out;
}

function DisputesSlideshow() {
  const items = [
    {
      id: 1,
      title: "Payment dispute for audit",
      parties: "@0xAlfa vs @0xBeta",
      desc: "Invoice unpaid after delivered audit.",
      href: "/disputes?case=D-311",
    },
    {
      id: 2,
      title: "Missed delivery window",
      parties: "@0xAstra vs @0xNova",
      desc: "Shipment delayed beyond 7 days.",
      href: "/disputes?case=D-309",
    },
    {
      id: 3,
      title: "IP infringement claim",
      parties: "@0xOrion vs @0xEcho",
      desc: "Assets reused without license.",
      href: "/disputes?case=D-300",
    },
    {
      id: 4,
      title: "Unresponsive contractor",
      parties: "@0xZen vs @0xVolt",
      desc: "Ghosted after partial payment.",
      href: "/disputes?case=D-296",
    },
  ];

  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delay = 3500 + Math.floor(Math.random() * 1200); // desync by up to 1.2s

  const nextSlide = useCallback(
    () => setIndex((prev) => (prev + 1) % items.length),
    [items.length],
  );
  const prevSlide = useCallback(
    () => setIndex((prev) => (prev - 1 + items.length) % items.length),
    [items.length],
  );

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
      <div className="flex items-center justify-between">
        <h3 className="glow-text space mb-2 font-semibold text-cyan-100 lg:text-xl">
          Disputes (teaser)
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevSlide} className="">
            <ChevronLeft />
          </button>
          <button onClick={nextSlide} className="">
            <ChevronRight />
          </button>
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
        {items.map((item, i) => (
          <Link
            key={item.id}
            to={item.href}
            style={{
              transform: i === index ? "scale(1)" : "scale(0.9)",
              opacity: i === index ? 1 : 0.4,
            }}
            className="glass flex h-[13.5rem] min-w-full flex-col items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-5 transition"
          >
            <div className="mt-1 text-lg font-semibold text-[#0891b2]">
              {item.title}
            </div>
            <div className="mt-2 text-sm text-white/60">{item.parties}</div>
            <p className="mt-2 text-sm text-white/80">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function JudgesIntro() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      className={`glass rborder to-transparenttransition-all relative col-span-2 overflow-hidden border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 p-6 duration-300 ${
        expanded ? "h-auto" : "h-[16rem]"
      }`}
    >
      {/* Cyan glow effect */}
      <div className="absolute top-0 -right-10 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div>

      {/* Heading */}
      <h3 className="space text-lg font-semibold text-white/90">
        Have you been wronged or cheated? Don’t stay silent, start a dispute.
      </h3>

      {/* Judges info */}
      <div className="text-muted-foreground mt-3 text-sm">
        <h3 className="font-semibold text-white/90">Who Judges Your Case?</h3>
        <p className="text-muted-foreground space mt-1 text-cyan-400">Judges</p>
        <p>
          DexCourt’s panel of judges consists of reputable and well-known
          figures across both Web3 and traditional spaces.
        </p>

        {/* Always visible part */}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Top influencers (e.g., IncomeSharks)</li>

          {/* Hidden part starts here */}
          {expanded && (
            <>
              <li>Leading project founders (e.g., CZ)</li>
              <li>Experienced blockchain developers</li>
              <li>Respected degens with strong community reputation</li>
              <li>Licensed lawyers and real-world judges</li>
              <li>Prominent Web2 personalities</li>
            </>
          )}
        </ul>

        {/* Hidden explanatory text */}
        {expanded && (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              These individuals are selected based on proven{" "}
              <span className="text-cyan-400">
                credibility, influence, and integrity
              </span>{" "}
              within their respective domains.
            </p>

            <p className="text-muted-foreground space mt-3 text-cyan-400">
              The Community
            </p>
            <p className="text-muted-foreground text-sm">
              In addition to the judges, the broader DexCourt community also
              plays a vital role. Holders of the $LAW token can review cases and
              cast their votes, ensuring that justice remains decentralized and
              inclusive.
            </p>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="neon" className="neon-hover" asChild>
          <Link to="/disputes">Create Dispute</Link>
        </Button>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-cyan-300 hover:underline"
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      </div>
    </section>
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
      avatar: avatar1,
    },
    {
      name: "@judgeAres",
      tg: "",
      x: "@ares_eth",
      href: "/judges/ares",
      bio: "Founder • DeFi risk analyst",
      avatar: avatar2,
    },
    {
      name: "@judgeKai",
      tg: "@kai",
      x: "@kai_io",
      href: "/judges/kai",
      bio: "Full-stack dev & L2 researcher",
      avatar: avatar3,
    },
    {
      name: "@judgeVera",
      tg: "",
      x: "@vera_x",
      href: "/judges/vera",
      bio: "Corporate lawyer • IP",
      avatar: avatar4,
    },
    {
      name: "@judgeOrion",
      tg: "@orion",
      x: "@orion_xyz",
      href: "/judges/orion",
      bio: "Protocol governance specialist",
      avatar: avatar5,
    },
  ];

  const votes = [
    {
      id: 1,
      title: "Escrow Refund",
      parties: "@0xNova vs @0xVega",
      desc: "Plaintiff requests refund after contractor missed milestones.",
    },
    {
      id: 2,
      title: "Code Ownership Dispute",
      parties: "@0xLuna vs @0xSol",
      desc: "Clarifying IP rights for jointly developed smart contract.",
    },
    {
      id: 3,
      title: "Liquidity Pool Compensation",
      parties: "@0xTheta vs @0xDelta",
      desc: "Community voting on compensation after protocol bug exploit.",
    },
  ];

  // --- Carousel logic (same as DisputesSlideshow) ---
  const [judgeIndex, setJudgeIndex] = useState(0);
  const [voteIndex, setVoteIndex] = useState(0);
  const judgeDelay = useMemo(() => 4200 + Math.floor(Math.random() * 1000), []);
  const voteDelay = useMemo(() => 5000 + Math.floor(Math.random() * 1200), []);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutVoteRef = useRef<NodeJS.Timeout | null>(null);

  const nextJudge = useCallback(
    () => setJudgeIndex((prev) => (prev + 1) % judges.length),
    [judges.length],
  );
  const prevJudge = useCallback(
    () => setJudgeIndex((prev) => (prev - 1 + judges.length) % judges.length),
    [judges.length],
  );

  const nextVote = useCallback(
    () => setVoteIndex((prev) => (prev + 1) % votes.length),
    [votes.length],
  );
  const prevVote = useCallback(
    () => setVoteIndex((prev) => (prev - 1 + votes.length) % votes.length),
    [votes.length],
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(nextJudge, judgeDelay);
    return () => clearTimeout(timeoutRef.current || undefined);
  }, [judgeIndex, nextJudge, judgeDelay]);

  useEffect(() => {
    if (timeoutVoteRef.current) clearTimeout(timeoutVoteRef.current);
    timeoutVoteRef.current = setTimeout(nextVote, voteDelay);
    return () => clearTimeout(timeoutVoteRef.current || undefined);
  }, [voteIndex, nextVote, voteDelay]);

  return (
    <section className="relative mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="absolute top-0 -right-10 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div>

      {/* --- Renowned Judges --- */}
      <div className="relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="glow-text space mb-2 font-semibold text-cyan-100 lg:text-xl">
            Renowned Judges
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevJudge}>
              <ChevronLeft className="text-cyan-300 hover:text-cyan-400" />
            </button>
            <button onClick={nextJudge}>
              <ChevronRight className="text-cyan-300 hover:text-cyan-400" />
            </button>
          </div>
        </div>

        <div
          className="relative flex w-full transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${judgeIndex * 100}%)`,
          }}
        >
          {judges.map((j, i) => (
            <Link
              to={j.href}
              key={j.name}
              style={{
                transform: i === judgeIndex ? "scale(1)" : "scale(0.9)",
                opacity: i === judgeIndex ? 1 : 0.4,
              }}
              className="glass flex min-w-full flex-col items-center justify-center gap-3 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 transition-all duration-700"
            >
              <img
                src={j.avatar}
                alt={j.name}
                className="h-20 w-20 rounded-full border-2 border-cyan-400/40 object-cover shadow-lg"
              />
              <div className="text-lg font-semibold text-[#0891b2]">
                {j.name}
              </div>
              <div className="flex justify-center gap-2 text-sm text-white/60">
                {j.tg && <span>{j.tg}</span>}
                {j.x && <span>{j.x}</span>}
              </div>
              <p className="text-center text-sm text-white/70">{j.bio}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* --- Live Voting --- */}
      <div className="relative h-fit overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="glow-text space mb-2 font-semibold text-cyan-100 lg:text-xl">
            Live Voting
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevVote}>
              <ChevronLeft className="text-cyan-300 hover:text-cyan-400" />
            </button>
            <button onClick={nextVote}>
              <ChevronRight className="text-cyan-300 hover:text-cyan-400" />
            </button>
          </div>
        </div>

        <div
          className="relative flex w-full transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${voteIndex * 100}%)`,
          }}
        >
          {votes.map((v, i) => (
            <div
              key={v.id}
              style={{
                transform: i === voteIndex ? "scale(1)" : "scale(0.9)",
                opacity: i === voteIndex ? 1 : 0.4,
              }}
              className="glass flex min-w-full flex-col justify-between rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6 transition-all duration-700"
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex flex-col gap-4">
                    <div className="font-semibold text-cyan-300">{v.title}</div>
                    <div className="text-xs text-white/60">{v.parties}</div>
                  </div>
                  <Timer className="h-4 w-4 text-cyan-300" />
                </div>
                <p className="text-sm text-white/80">{v.desc}</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/30 py-1.5 text-sm text-cyan-200 transition hover:bg-cyan-500/20">
                  <ThumbsUp className="h-4 w-4" /> Approve
                </button>
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 py-1.5 text-sm text-red-300 transition hover:bg-red-500/20">
                  <ThumbsDown className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// function Card({
//   title,
//   icon,
//   to,
//   color,
//   description,
// }: {
//   title: string;
//   icon: React.ReactNode;
//   to: string;
//   color: string;
//   description: string;
// }) {
//   return (
//     <Link
//       to={to}
//       className={
//         "group glass flex flex-col gap-1 justify-between px-5 py-3 border border-white/10 group-hover:border-cyan-400 transition-all transform hover:scale-[1.04] " +
//         `bg-gradient-to-br ${color}`
//       }
//     >
//       <div className="flex items-center gap-3">
//         <div className="grid h-9 w-9 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 neon">
//           {icon}
//         </div>
//         <div>
//           <div className="font-medium text-white/90 space text-lg">{title}</div>
//           <div className="text-sm text-muted-foreground">{description}</div>
//         </div>
//       </div>
//       <ArrowRight className="h-4 w-4 text-cyan-300 opacity-0 transition group-hover:opacity-100 self-end" />
//     </Link>
//   );
// }
