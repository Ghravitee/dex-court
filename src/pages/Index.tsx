/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  FileText,
  Scale,
  BadgeDollarSign,
  Star,
  User,
  // Timer,
  ArrowRight,
  Users,
  Trophy,
  Coins,
  Handshake,
  Banknote,
  Wallet,
  Landmark,
  Vote,
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
} from "recharts";

export default function Index() {
  return (
    <div className="space-y-8 relative overflow-hidden">
      <div className="lg:size-[20rem] rounded-md bg-cyan-500/20 absolute top-[10px] left-0 blur-3xl block "></div>
      <div className="lg:size-[20rem] rounded-md bg-cyan-500/20 absolute top-[300px] right-0 blur-3xl block"></div>
      <div className="absolute inset-0 bg-cyan-500/4 blur-3xl -z-[50]"></div>

      <HeroSection />
      <CardLinks />
      <StatsGrid />
      <KPIChart />
      <DisputesSlideshow />
      <JudgesIntro />
      <RenownedJudges />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative grid grid-cols-1 items-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-8 md:grid-cols-3">
      <div className="md:col-span-2 relative z-[1]">
        <h1 className="text-3xl font-bold tracking-tight text-white glow-text space">
          DexCourt dApp
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A decentralized platform for trustless agreements, transparent dispute
          resolution, and on-chain reputation. Govern your deals and votes with
          full cryptographic assurance.
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
    </section>
  );
}

function CardLinks() {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card
        title="Agreements"
        icon={<FileText className="h-4 w-4" />}
        to="/agreements"
        color="from-cyan-500/10"
        description="Draft, sign, and manage tamper-proof smart agreements."
      />
      <Card
        title="Disputes"
        icon={<Scale className="h-4 w-4" />}
        to="/disputes"
        color="from-cyan-500/10"
        description="Resolve conflicts through transparent voting and evidence."
      />
      <Card
        title="Escrow"
        icon={<BadgeDollarSign className="h-4 w-4" />}
        to="/escrow"
        color="from-sky-500/10"
        description="Secure funds in trustless, automated escrow vaults."
      />
      <Card
        title="Voting Hub"
        icon={<Vote className="h-4 w-4" />}
        to="/voting"
        color="from-cyan-500/10"
        description="Participate in community verdicts and shape case outcomes."
      />
      <Card
        title="Reputation"
        icon={<Star className="h-4 w-4" />}
        to="/reputation"
        color="from-cyan-500/10"
        description="Earn credibility as you engage with agreements & disputes."
      />
      <Card
        title="Profile"
        icon={<User className="h-4 w-4" />}
        to="/profile"
        color="from-cyan-500/10"
        description="View your activity, reputation, and arbitration history."
      />
    </section>
  );
}

function StatsGrid() {
  const stats = [
    { label: "Settled Disputes", value: "342", icon: Trophy },
    { label: "Judges", value: "28", icon: Scale },
    { label: "Eligible Voters", value: "12.4k", icon: Users },
    { label: "Agreements", value: "5,312", icon: Handshake },
    { label: "Platform Revenue", value: "$214k", icon: Landmark },
    { label: "Escrow TVL", value: "$3.1m", icon: Banknote },
    { label: "Active Users", value: "7,902", icon: User },
    { label: "Paid to Judges", value: "$68k", icon: Coins },
    { label: "Paid to Community", value: "$112k", icon: Wallet },
  ];
  return (
    <section>
      <h1 className="space lg:text-xl mb-2 font-bold glow-text">
        DexCourt's Statistics
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="grid h-10 w-10 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 neon">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="grow">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-xl font-semibold text-white">{s.value}</div>
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
    <section className="glass ring-1 ring-white/10 p-5 relative">
      <div className="lg:size-[20rem] rounded-md bg-cyan-500/20 absolute top-[50px] left-0 right-0 mx-auto blur-3xl block"></div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="lg:text-xl font-semibold text-white/90 space">
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
              dataKey="revenue"
              name="Revenue"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="agreements"
              name="Agreements"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="judges"
              name="Judges"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="voters"
              name="Community Voters"
              stroke="#a78bfa"
              strokeWidth={2}
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
  const items = useMemo(
    () => [
      {
        id: "D-311",
        title: "Payment dispute for audit",
        parties: "@0xAlfa vs @0xBeta",
        desc: "Invoice unpaid after delivered audit.",
        href: "/disputes?case=D-311",
      },
      {
        id: "D-309",
        title: "Missed delivery window",
        parties: "@0xAstra vs @0xNova",
        desc: "Shipment delayed beyond 7 days.",
        href: "/disputes?case=D-309",
      },
      {
        id: "D-300",
        title: "IP infringement claim",
        parties: "@0xOrion vs @0xEcho",
        desc: "Assets reused without license.",
        href: "/disputes?case=D-300",
      },
      {
        id: "D-296",
        title: "Unresponsive contractor",
        parties: "@0xZen vs @0xVolt",
        desc: "Ghosted after partial payment.",
        href: "/disputes?case=D-296",
      },
    ],
    []
  );
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [paused, items.length]);
  const item = items[i];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-0 lg:w-[50%]">
      <div className="lg:size-[20rem] rounded-md bg-cyan-500/20 absolute top-[50px] left-0 right-0 mx-auto blur-3xl block"></div>
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <h3 className="text-sm font-semibold text-white/90">
          Disputes (Live Teasers)
        </h3>
        <span className="text-xs text-muted-foreground">
          Click to view before it rotates
        </span>
      </div>
      <Link
        to={item.href}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="block p-6 transition-opacity duration-300"
      >
        <div className="text-xs text-muted-foreground">{item.id}</div>
        <div className="mt-1 text-lg font-semibold text-white/90">
          {item.title}
        </div>
        <div className="text-sm text-muted-foreground">{item.parties}</div>
        <p className="mt-2 text-sm text-foreground/80">{item.desc}</p>
      </Link>
    </section>
  );
}

function JudgesIntro() {
  const [expanded, setExpanded] = useState(false);
  const text = (
    <div className="relative">
      <h3 className=" font-semibold text-white/90">Who Judges Your Case?</h3>
      <p className="mt-1 text-cyan-400 text-muted-foreground space">Judges</p>
      <p className="text-sm text-muted-foreground">
        DexCourt’s panel of judges consists of reputable and well-known figures
        across both Web3 and traditional spaces.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Top influencers (e.g., IncomeSharks)</li>
        <li>Leading project founders (e.g., CZ)</li>
        <li>Experienced blockchain developers</li>
        <li>Respected degens with strong community reputation</li>
        <li>Licensed lawyers and real-world judges</li>
        <li>Prominent Web2 personalities</li>
      </ul>
      <p className="mt-2 text-sm text-muted-foreground">
        These individuals are selected based on proven{" "}
        <span className="text-cyan-400">
          credibility, influence, and integrity
        </span>{" "}
        within their respective domains.
      </p>
      <p className="mt-3 text-cyan-400 text-muted-foreground space">
        The Community
      </p>
      <p className="text-sm text-muted-foreground">
        In addition to the judges, the broader DexCourt community also plays a
        vital role. Holders of the $LAW token can review cases and cast their
        votes, ensuring that justice remains decentralized and inclusive.
      </p>
      <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4 w-fit">
        <div className="text-sm font-medium text-white/90">
          Weighted Decision Model
        </div>
        <ul className="mt-2 text-sm text-muted-foreground">
          <li>
            Judges’ Votes:{" "}
            <span className="text-emerald-300 font-medium">70% influence</span>
          </li>
          <li>
            Community Votes:{" "}
            <span className="text-cyan-300 font-medium">30% influence</span>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <section className="glass ring-1 ring-white/10 p-6 relative">
      <div className="lg:size-[30rem] rounded-full bg-cyan-500/20 absolute top-0 -right-10 blur-3xl block"></div>
      <h3 className="text-lg font-semibold text-white/90 space">
        Have you been wronged or cheated? Don’t stay silent, start a dispute.
      </h3>
      <div className="mt-3 text-sm text-muted-foreground">
        <Expandable text={text} expanded={expanded} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
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

function Expandable({
  text,
  expanded,
}: {
  text: React.ReactNode;
  expanded: boolean;
}) {
  if (expanded) return <div>{text}</div>;
  return (
    <div className="line-clamp-[10] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:10]">
      {text}
    </div>
  );
}

function RenownedJudges() {
  const judges = useMemo(
    () => [
      {
        name: "@judgeNova",
        tg: "@judgeNova",
        x: "@nova_xyz",
        ig: "",
        tiktok: "",
        bio: "Arbitrator & smart contract auditor",
        avatar: "N",
      },
      {
        name: "@judgeAres",
        tg: "",
        x: "@ares_eth",
        ig: "",
        tiktok: "",
        bio: "Founder • DeFi risk analyst",
        avatar: "A",
      },
      {
        name: "@judgeKai",
        tg: "@kai",
        x: "@kai_io",
        ig: "@kai.ig",
        tiktok: "",
        bio: "Full‑stack dev & L2 researcher",
        avatar: "K",
      },
      {
        name: "@judgeVera",
        tg: "",
        x: "@vera_x",
        ig: "",
        tiktok: "@vera.tok",
        bio: "Corporate lawyer • IP",
        avatar: "V",
      },
      {
        name: "@judgeOrion",
        tg: "@orion",
        x: "@orion_xyz",
        ig: "@orion.ig",
        tiktok: "",
        bio: "Protocol governance",
        avatar: "O",
      },
    ],
    []
  );

  return (
    <section className="space-y-3 relative">
      <div className="lg:size-[30rem] rounded-md bg-cyan-500/20 absolute top-[50px] left-0 blur-3xl block"></div>
      <h3 className="text-sm font-semibold text-white/90 space">
        Renowned DexCourt Judges
      </h3>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex animate-[marquee_30s_linear_infinite] gap-4 [--gap:1rem] hover:[animation-play-state:paused]">
          {[...judges, ...judges].map((j, idx) => (
            <div
              key={idx}
              className="glow min-w-[260px] rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                  {j.avatar}
                </div>
                <div>
                  <div className="font-medium text-white/90">{j.name}</div>
                  <div className="text-[11px] text-muted-foreground flex gap-2">
                    {j.tg && <span>TG: {j.tg}</span>}
                    {j.x && <span>X: {j.x}</span>}
                    {j.ig && <span>IG: {j.ig}</span>}
                    {j.tiktok && <span>TT: {j.tiktok}</span>}
                  </div>
                </div>
              </div>
              {j.bio && (
                <p className="mt-2 text-xs text-muted-foreground">{j.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </section>
  );
}

function Card({
  title,
  icon,
  to,
  color,
  description,
}: {
  title: string;
  icon: React.ReactNode;
  to: string;
  color: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className={
        "group glass flex flex-col gap-1 justify-between px-5 py-3 border border-white/10 group-hover:border-cyan-400 transition-all transform hover:scale-[1.04] " +
        `bg-gradient-to-br ${color}`
      }
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 neon">
          {icon}
        </div>
        <div>
          <div className="font-medium text-white/90 space text-lg">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-cyan-300 opacity-0 transition group-hover:opacity-100 self-end" />
    </Link>
  );
}
