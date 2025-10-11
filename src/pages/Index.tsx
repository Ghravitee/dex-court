/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
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
  // Vote,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function Index() {
  return (
    <div className="space-y-8 relative overflow-hidden">
      <div className="lg:size-[20rem] rounded-md bg-cyan-500/20 absolute top-[10px] left-0 blur-3xl block "></div>
      <div className="lg:size-[20rem] rounded-md bg-cyan-500/20 absolute top-[300px] right-0 blur-3xl block"></div>
      <div className="absolute inset-0 bg-cyan-300/1 blur-3xl -z-[50]"></div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="col-span-2 h-fit">
          <HeroSection />
        </div>
        <div className="col-span-3">
          <KPIChart />
        </div>
      </div>
      {/* <CardLinks /> */}
      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <JudgesIntro />
        {/* <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4 w-full">
        <div className="text-xl font-medium text-white/90 ">
          Weighted Decision Model
        </div>
        <ul className="mt-2 text-muted-foreground">
          <li>
            Judges’ Votes:{" "}
            <span className="text-emerald-300 font-medium">70% influence</span>
          </li>
          <li>
            Community Votes:{" "}
            <span className="text-cyan-300 font-medium">30% influence</span>
          </li>
        </ul>
      </div> */}
        <DisputesSlideshow />
      </div>
      <RenownedJudges />
    </div>
  );
}

function HeroSection() {
  return (
    <section>
      <div className="relative items-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-8 md:grid-cols-3">
        <div className="relative z-[1]">
          <h1 className="text-3xl font-bold tracking-tight text-white glow-text space">
            DexCourt dApp
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
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
    <section className="mt-12 flex flex-col items-center">
      <h1 className="mb-6 text-2xl font-bold text-white/90 glow-text">
        DexCourt’s Statistics
      </h1>

      <div
        className="
          flex flex-wrap justify-center gap-8
          rounded-2xl border border-white/10
          bg-white/5 p-8
          backdrop-blur-xl
          max-w-5xl w-full
          shadow-[0_0_30px_-10px_rgba(0,255,255,0.35)]
        "
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="
              flex items-center gap-4
              min-w-[11rem]
            "
          >
            <div
              className="
                grid h-14 w-14 place-items-center
                rounded-lg border border-cyan-400/30
                bg-cyan-500/10 text-cyan-200
                shadow-[0_0_12px_rgba(0,255,255,0.35)]
              "
            >
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-white/60">{s.label}</div>
              <div className="text-2xl font-bold text-white leading-tight">
                {s.value}
              </div>
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
              stroke="#06b6d4" // bright cyan
              strokeWidth={2.5}
              dot={false}
            />
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

  return (
    <>
      <Carousel
        showArrows={false}
        showIndicators={false}
        showStatus={false}
        infiniteLoop
        autoPlay
        interval={3500}
        swipeable
        emulateTouch
        transitionTime={600}
        className=""
      >
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="flex flex-col items-center justify-center rounded-xl border border-white/10 p-5 transition bg-cyan-500/10 h-[15rem]"
          >
            <div className="text-xs text-muted-foreground">{item.id}</div>
            <div className="mt-1 text-lg font-semibold text-white/90">
              {item.title}
            </div>
            <div className="text-sm text-muted-foreground">{item.parties}</div>
            <p className="mt-2 text-sm text-foreground/80">{item.desc}</p>
          </Link>
        ))}
      </Carousel>
    </>
  );
}

function JudgesIntro() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="glass ring-1 ring-white/10 p-6 relative col-span-2 h-[15rem]">
      {/* Cyan glow effect */}
      <div className="lg:size-[30rem] rounded-full bg-cyan-500/20 absolute top-0 -right-10 blur-3xl block"></div>

      {/* Heading */}
      <h3 className="text-lg font-semibold text-white/90 space">
        Have you been wronged or cheated? Don’t stay silent, start a dispute.
      </h3>

      {/* Judges info */}
      <div className="mt-3 text-sm text-muted-foreground">
        <h3 className="font-semibold text-white/90">Who Judges Your Case?</h3>
        <p className="mt-1 text-cyan-400 text-muted-foreground space">Judges</p>
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
      avatar: "N",
    },
    {
      name: "@judgeAres",
      tg: "",
      x: "@ares_eth",
      bio: "Founder • DeFi risk analyst",
      avatar: "A",
    },
    {
      name: "@judgeKai",
      tg: "@kai",
      x: "@kai_io",
      bio: "Full-stack dev & L2 researcher",
      avatar: "K",
    },
    {
      name: "@judgeVera",
      tg: "",
      x: "@vera_x",
      bio: "Corporate lawyer • IP",
      avatar: "V",
    },
    {
      name: "@judgeOrion",
      tg: "@orion",
      x: "@orion_xyz",
      bio: "Protocol governance specialist",
      avatar: "O",
    },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative mt-10 items-stretch">
      {/* Judges Carousel */}
      <div className="flex flex-col  bg-transparent overflow-hidden">
        <Carousel
          showArrows={false}
          showIndicators={false}
          showStatus={false}
          infiniteLoop
          autoPlay
          interval={3000}
          swipeable
          emulateTouch
          transitionTime={700}
          className="h-[20rem] flex-1"
        >
          {judges.map((j) => (
            <div
              key={j.name}
              className="flex flex-col items-center justify-center rounded-xl border border-white/10 p-5 transition bg-cyan-500/10 h-[16rem]"
            >
              <div className="grid h-16 w-16 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 text-xl font-bold mb-3">
                {j.avatar}
              </div>
              <div className="font-semibold text-white/90 text-lg">
                {j.name}
              </div>
              <div className="text-sm text-muted-foreground mb-2 flex justify-center gap-2">
                {j.tg && <span>• TG: {j.tg}</span>}
                {j.x && <span>• X: {j.x}</span>}
              </div>
              <p className="text-sm text-white/70 max-w-xs">{j.bio}</p>
            </div>
          ))}
        </Carousel>
      </div>

      {/* Live Voting */}
      <div className="h-[16rem] relative rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent p-6 backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-2 glow-text">
            Live Voting
          </h3>
          <p className="text-sm text-muted-foreground">
            Ongoing community verdicts in progress. Cast your vote before time
            runs out.
          </p>
        </div>

        {/* Voting Card */}

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/80 font-semibold">
              Dispute D-401: Escrow Refund
            </div>
            <div className="text-xs text-cyan-300">@0xNova vs @0xVega</div>
          </div>
          <Timer className="text-cyan-300 w-4 h-4" />
        </div>

        <p className="text-xs text-white/70">
          Plaintiff claims funds should be released due to missed delivery
          milestones.
        </p>

        <div className="flex gap-3 mt-2">
          <button className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 py-1.5 text-sm hover:bg-cyan-500/20 transition">
            <ThumbsUp className="w-4 h-4" /> Approve
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 text-red-300 py-1.5 text-sm hover:bg-red-500/20 transition">
            <ThumbsDown className="w-4 h-4" /> Reject
          </button>
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
