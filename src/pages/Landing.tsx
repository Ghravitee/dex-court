// import { Link } from "react-router-dom";
// import { Button } from "../components/ui/button";
// import { BadgeDollarSign, FileText, Scale, Star } from "lucide-react";

// export default function Landing() {
//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       <LandingNav />
//       <main>
//         <Hero />
//         <CoreFeatures />
//         <Tokenomics />
//         <Roadmap />
//         <CTA />
//         <Footer />
//       </main>
//     </div>
//   );
// }

// function LandingNav() {
//   return (
//     <header className="sticky top-0 z-20 border-b border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl">
//       <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
//         <div className="flex items-center gap-3">
//           <div className="h-8 w-8 rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60 neon" />
//           <div className="text-sm font-semibold text-cyan-300 glow-text">
//             Neon Court
//           </div>
//         </div>
//         <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
//           <a href="#features" className="hover:text-white">
//             Features
//           </a>
//           <a href="#tokenomics" className="hover:text-white">
//             Tokenomics
//           </a>
//           <a href="#roadmap" className="hover:text-white">
//             Roadmap
//           </a>
//           <a href="#cta" className="hover:text-white">
//             Get started
//           </a>
//         </nav>
//         <div className="flex items-center gap-3">
//           <Link to="/" className="hidden sm:block">
//             <Button
//               variant="outline"
//               className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
//             >
//               Launch dApp
//             </Button>
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// function Hero() {
//   return (
//     <section className="relative overflow-hidden">
//       <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
//         <div className="absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
//         <div className="absolute top-10 right-1/3 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
//       </div>
//       <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
//         <div>
//           <p className="text-cyan-300">
//             Trust, fairness, and transparency in Web3 interactions.
//           </p>
//           <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
//             A Futuristic Web3 Justice Dashboard
//           </h1>
//           <p className="mt-4 text-sm text-muted-foreground md:text-base">
//             Agreements, escrow, disputes, on-chain voting, and reputation—all in
//             one neon-fast, privacy-first experience.
//           </p>
//           <div className="mt-6 flex flex-wrap gap-3">
//             <Link to="/">
//               <Button variant="neon" className="neon-hover">
//                 Launch dApp
//               </Button>
//             </Link>
//             <a href="#features">
//               <Button
//                 variant="outline"
//                 className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
//               >
//                 See Core Features
//               </Button>
//             </a>
//           </div>
//         </div>
//         <div className="glass ring-1 ring-cyan-400/20 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
//           <div className="text-xs text-muted-foreground">Preview</div>
//           <div className="mt-3 grid gap-3 sm:grid-cols-2">
//             <PreviewCard
//               title="Create Agreement"
//               emoji="🧾"
//               desc="Draft, sign, and track obligations with optional escrow."
//             />
//             <PreviewCard
//               title="Disputes"
//               emoji="⚖️"
//               desc="Raise cases, attach evidence, and follow deadlines."
//             />
//             <PreviewCard
//               title="Voting"
//               emoji="🗳️"
//               desc="Commit–reveal with salted hashes and fair deliberation."
//             />
//             <PreviewCard
//               title="Escrow"
//               emoji="💰"
//               desc="Secure funds with release/dispute actions and receipts."
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function CoreFeatures() {
//   return (
//     <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
//       <div className="mx-auto max-w-3xl">
//         <h2 className="text-2xl font-semibold text-white">Core Features</h2>
//         <p className="mt-2 text-sm text-muted-foreground">
//           Create and sign deals, secure transactions, verified expert judgments,
//           and reputation that defines your Web3 identity.
//         </p>
//       </div>
//       <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
//         <CFItem
//           icon={<FileText className="h-6 w-6" />}
//           title="Agreements"
//           subtitle="Create and sign deals on-chain or off-chain"
//         />
//         <CFItem
//           icon={<Scale className="h-6 w-6" />}
//           title="Judges"
//           subtitle="Verified experts + community powered verdicts"
//         />
//         <CFItem
//           icon={<BadgeDollarSign className="h-6 w-6" />}
//           title="Escrow"
//           subtitle="Secure transactions enforced by smart contracts"
//         />
//         <CFItem
//           icon={<Star className="h-6 w-6" />}
//           title="Reputation"
//           subtitle="Earn or lose trust that defines your Web3 identity"
//         />
//       </div>
//     </section>
//   );
// }

// function CFItem({
//   icon,
//   title,
//   subtitle,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   subtitle: string;
// }) {
//   return (
//     <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
//       <div className="grid h-12 w-12 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 neon">
//         {icon}
//       </div>
//       <div>
//         <div className="text-lg font-semibold text-white/90">{title}</div>
//         <div className="text-sm text-muted-foreground">{subtitle}</div>
//       </div>
//     </div>
//   );
// }

// function Tokenomics() {
//   const data = [
//     { label: "Platform rewards", value: 40, color: "#22d3ee" },
//     { label: "Liquidity", value: 20, color: "#38bdf8" },
//     { label: "Judge incentives", value: 25, color: "#10b981" },
//     { label: "Treasury", value: 10, color: "#a78bfa" },
//     { label: "Team & operations", value: 6, color: "#f59e0b" },
//   ];
//   const total = data.reduce((a, b) => a + b.value, 0);

//   let start = 0;
//   const segs = data.map((d, i) => {
//     const end = start + (d.value / total) * 2 * Math.PI;
//     const seg = { start, end, color: d.color, key: i };
//     start = end;
//     return seg;
//   });

//   const R = 80;
//   const CX = 100;
//   const CY = 100;

//   return (
//     <section id="tokenomics" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
//       <h2 className="text-2xl font-semibold text-white">Tokenomics</h2>
//       <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
//         <div className="glass rounded-2xl border border-white/10 p-6">
//           <svg viewBox="0 0 200 200" className="mx-auto h-60 w-60">
//             <circle
//               cx={CX}
//               cy={CY}
//               r={R}
//               fill="none"
//               stroke="rgba(255,255,255,0.08)"
//               strokeWidth={18}
//             />
//             {segs.map((s) => (
//               <path
//                 key={s.key}
//                 d={describeArc(
//                   CX,
//                   CY,
//                   R,
//                   (s.start * 180) / Math.PI,
//                   (s.end * 180) / Math.PI
//                 )}
//                 stroke={s.color}
//                 strokeWidth={18}
//                 fill="none"
//                 strokeLinecap="butt"
//               />
//             ))}
//           </svg>
//         </div>
//         <ul className="space-y-3">
//           {data.map((d) => (
//             <li
//               key={d.label}
//               className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-4"
//             >
//               <div className="flex items-center gap-3">
//                 <span
//                   className="h-3 w-3 rounded-sm"
//                   style={{ backgroundColor: d.color }}
//                 />
//                 <span className="text-sm text-white/90">{d.label}</span>
//               </div>
//               <span className="text-sm text-muted-foreground">{d.value}%</span>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </section>
//   );
// }

// // Utilities to draw arcs
// function polarToCartesian(
//   centerX: number,
//   centerY: number,
//   radius: number,
//   angleInDegrees: number
// ) {
//   var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
//   return {
//     x: centerX + radius * Math.cos(angleInRadians),
//     y: centerY + radius * Math.sin(angleInRadians),
//   };
// }
// function describeArc(
//   x: number,
//   y: number,
//   radius: number,
//   startAngle: number,
//   endAngle: number
// ) {
//   var start = polarToCartesian(x, y, radius, endAngle);
//   var end = polarToCartesian(x, y, radius, startAngle);
//   var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
//   var d = [
//     "M",
//     start.x,
//     start.y,
//     "A",
//     radius,
//     radius,
//     0,
//     largeArcFlag,
//     0,
//     end.x,
//     end.y,
//   ].join(" ");
//   return d;
// }

// function Roadmap() {
//   return (
//     <section id="roadmap" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
//       <h2 className="text-2xl font-semibold text-white">Roadmap</h2>
//       <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
//         <div className="space-y-6">
//           <Milestone
//             quarter="Q4 2025"
//             title="Smart contract deployment"
//             desc="Escrow + Dispute modules live"
//           />
//           <Milestone
//             quarter="Q1 2026"
//             title="Public dispute portal"
//             desc="Community access to raise and track cases"
//           />
//         </div>
//         <div className="space-y-6">
//           <Milestone
//             quarter="Q2 2026"
//             title="Reputation engine + Judge DAO"
//             desc="On-chain scoring and governance"
//           />
//           <Milestone
//             quarter="Q3 2026"
//             title="Cross-chain & SDK integrations"
//             desc="Integrations and developer tooling"
//           />
//         </div>
//       </div>
//     </section>
//   );
// }

// function Milestone({
//   quarter,
//   title,
//   desc,
// }: {
//   quarter: string;
//   title: string;
//   desc: string;
// }) {
//   return (
//     <div className="relative rounded-xl border border-white/10 bg-white/5 p-5">
//       <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-cyan-400/60 to-transparent" />
//       <div className="pl-4">
//         <div className="text-xs uppercase tracking-wider text-cyan-300">
//           {quarter}
//         </div>
//         <div className="text-lg font-semibold text-white/90">{title}</div>
//         <div className="text-sm text-muted-foreground">{desc}</div>
//       </div>
//     </div>
//   );
// }

// function CTA() {
//   return (
//     <section id="cta" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
//       <div className="glass relative overflow-hidden rounded-2xl border border-white/10 p-8 ring-1 ring-cyan-400/20">
//         <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
//         <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
//           <div>
//             <h3 className="text-2xl font-semibold text-white">
//               Ready to arbitrate in neon?
//             </h3>
//             <p className="mt-1 text-sm text-muted-foreground">
//               Launch the app to start creating agreements, resolving disputes,
//               and building reputation.
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <Link to="/">
//               <Button variant="neon" className="neon-hover">
//                 Launch dApp
//               </Button>
//             </Link>
//             <a href="#features">
//               <Button
//                 variant="outline"
//                 className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
//               >
//                 Explore Features
//               </Button>
//             </a>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function Footer() {
//   return (
//     <footer className="border-t border-white/10 py-8">
//       <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
//         <div>© {new Date().getFullYear()} Neon Court</div>
//         <div className="flex gap-4">
//           <a href="#features" className="hover:text-white">
//             Features
//           </a>
//           <a href="#tokenomics" className="hover:text-white">
//             Tokenomics
//           </a>
//           <a href="#roadmap" className="hover:text-white">
//             Roadmap
//           </a>
//           <Link to="/" className="hover:text-white">
//             Launch dApp
//           </Link>
//         </div>
//       </div>
//     </footer>
//   );
// }

// function KPI({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
//       <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
//         {label}
//       </div>
//       <div className="mt-1 text-xl font-semibold text-white">{value}</div>
//     </div>
//   );
// }

// function Feature({
//   icon,
//   title,
//   desc,
// }: {
//   icon: React.ReactNode;
//   title: string;
//   desc: string;
// }) {
//   return (
//     <div className="glass group rounded-xl border border-white/10 p-5 ring-1 ring-white/10 transition hover:ring-cyan-400/30">
//       <div className="flex items-center gap-3">
//         <div className="grid h-9 w-9 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
//           {icon}
//         </div>
//         <div className="font-medium text-white/90">{title}</div>
//       </div>
//       <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
//     </div>
//   );
// }

// function PreviewCard({
//   title,
//   emoji,
//   desc,
// }: {
//   title: string;
//   emoji: string;
//   desc: string;
// }) {
//   return (
//     <div className="rounded-xl border border-white/10 bg-white/5 p-4">
//       <div className="flex items-center gap-2 text-sm font-medium text-white/90">
//         <span className="text-lg">{emoji}</span>
//         {title}
//       </div>
//       <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
//     </div>
//   );
// }
