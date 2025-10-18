// import { useMemo, useState } from "react";
// import {
//   Search,
//   TrendingUp,
//   TrendingDown,
//   User,
//   Award,
//   AlertTriangle,
// } from "lucide-react";
// import { Link } from "react-router-dom";

// type HistoryRow = {
//   type: string;
//   counterparty: string;
//   outcome: string;
//   date: string;
//   impact: number;
// };

// type Profile = {
//   handle: string;
//   score: number;
//   agreements: number;
//   disputesWon: number;
//   disputesLost: number;
//   ignoredRulings: number;
//   history: HistoryRow[];
// };

// function clamp(n: number, min = 0, max = 100) {
//   return Math.max(min, Math.min(max, n));
// }

// function TrustMeter({ score }: { score: number }) {
//   const r = 54;
//   const cx = 64;
//   const cy = 64;
//   const c = 2 * Math.PI * r;
//   const trust = clamp(score);
//   const greenLen = (trust / 100) * c;
//   const redLen = c - greenLen;

//   return (
//     <svg viewBox="0 0 128 128" className="h-32 w-32">
//       <defs>
//         <linearGradient id="gGreen" x1="0" y1="0" x2="1" y2="1">
//           <stop offset="0%" stopColor="#22c55e" />
//           <stop offset="100%" stopColor="#86efac" />
//         </linearGradient>
//         <linearGradient id="gRed" x1="1" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor="#f43f5e" />
//           <stop offset="100%" stopColor="#fca5a5" />
//         </linearGradient>
//       </defs>
//       <circle
//         cx={cx}
//         cy={cy}
//         r={r}
//         fill="none"
//         stroke="rgba(255,255,255,0.08)"
//         strokeWidth={10}
//       />
//       <circle
//         cx={cx}
//         cy={cy}
//         r={r}
//         fill="none"
//         stroke="url(#gGreen)"
//         strokeWidth={10}
//         strokeLinecap="round"
//         strokeDasharray={`${greenLen} ${c}`}
//         transform={`rotate(-90 ${cx} ${cy})`}
//         className="[filter:drop-shadow(0_0_12px_rgba(16,185,129,0.6))]"
//       />
//       <circle
//         cx={cx}
//         cy={cy}
//         r={r}
//         fill="none"
//         stroke="url(#gRed)"
//         strokeWidth={10}
//         strokeLinecap="round"
//         strokeDasharray={`${redLen} ${c}`}
//         strokeDashoffset={greenLen}
//         transform={`rotate(-90 ${cx} ${cy})`}
//         className="[filter:drop-shadow(0_0_12px_rgba(244,63,94,0.5))]"
//       />
//       <text
//         x="50%"
//         y="50%"
//         dominantBaseline="middle"
//         textAnchor="middle"
//         className="fill-white text-xl font-bold"
//       >
//         {trust}
//       </text>
//       <text
//         x="50%"
//         y="62%"
//         dominantBaseline="middle"
//         textAnchor="middle"
//         className="fill-cyan-300 text-[10px]"
//       >
//         Trust
//       </text>
//     </svg>
//   );
// }

// export default function Reputation() {
//   const data = useMemo<Profile[]>(
//     () => [
//       {
//         handle: "@0xAlfa",
//         score: 78,
//         agreements: 24,
//         disputesWon: 6,
//         disputesLost: 2,
//         ignoredRulings: 1,
//         history: [
//           {
//             type: "Agreement",
//             counterparty: "@0xBeta",
//             outcome: "Completed",
//             date: "2025-09-20",
//             impact: +4,
//           },
//           {
//             type: "Dispute",
//             counterparty: "@0xBeta",
//             outcome: "Won",
//             date: "2025-09-13",
//             impact: +8,
//           },
//           {
//             type: "Dispute",
//             counterparty: "@0xEcho",
//             outcome: "Lost",
//             date: "2025-08-30",
//             impact: -6,
//           },
//           {
//             type: "Ruling",
//             counterparty: "Court",
//             outcome: "Ignored",
//             date: "2025-08-05",
//             impact: -8,
//           },
//         ],
//       },
//       {
//         handle: "@0xAstra",
//         score: 64,
//         agreements: 12,
//         disputesWon: 2,
//         disputesLost: 3,
//         ignoredRulings: 0,
//         history: [
//           {
//             type: "Agreement",
//             counterparty: "@0xNova",
//             outcome: "Completed",
//             date: "2025-09-11",
//             impact: +3,
//           },
//           {
//             type: "Dispute",
//             counterparty: "@0xNova",
//             outcome: "Resolved",
//             date: "2025-09-10",
//             impact: +2,
//           },
//         ],
//       },
//       {
//         handle: "@0xNova",
//         score: 92,
//         agreements: 35,
//         disputesWon: 10,
//         disputesLost: 1,
//         ignoredRulings: 0,
//         history: [
//           {
//             type: "Dispute",
//             counterparty: "@0xAstra",
//             outcome: "Won",
//             date: "2025-09-28",
//             impact: +6,
//           },
//           {
//             type: "Agreement",
//             counterparty: "@0xEcho",
//             outcome: "Completed",
//             date: "2025-09-25",
//             impact: +5,
//           },
//           {
//             type: "Dispute",
//             counterparty: "@0xOrion",
//             outcome: "Won",
//             date: "2025-09-10",
//             impact: +8,
//           },
//         ],
//       },
//       {
//         handle: "@0xEcho",
//         score: 51,
//         agreements: 8,
//         disputesWon: 1,
//         disputesLost: 4,
//         ignoredRulings: 2,
//         history: [
//           {
//             type: "Dispute",
//             counterparty: "@0xAlfa",
//             outcome: "Lost",
//             date: "2025-09-13",
//             impact: -6,
//           },
//           {
//             type: "Ruling",
//             counterparty: "Court",
//             outcome: "Ignored",
//             date: "2025-08-05",
//             impact: -5,
//           },
//         ],
//       },
//       {
//         handle: "@0xOrion",
//         score: 71,
//         agreements: 19,
//         disputesWon: 5,
//         disputesLost: 3,
//         ignoredRulings: 1,
//         history: [
//           {
//             type: "Agreement",
//             counterparty: "@0xNova",
//             outcome: "Completed",
//             date: "2025-09-18",
//             impact: +4,
//           },
//           {
//             type: "Dispute",
//             counterparty: "@0xEcho",
//             outcome: "Won",
//             date: "2025-09-15",
//             impact: +6,
//           },
//           {
//             type: "Dispute",
//             counterparty: "@0xNova",
//             outcome: "Lost",
//             date: "2025-09-10",
//             impact: -3,
//           },
//         ],
//       },
//       {
//         handle: "@0xLumen",
//         score: 83,
//         agreements: 27,
//         disputesWon: 7,
//         disputesLost: 2,
//         ignoredRulings: 0,
//         history: [
//           {
//             type: "Dispute",
//             counterparty: "@0xOrion",
//             outcome: "Won",
//             date: "2025-09-22",
//             impact: +7,
//           },
//           {
//             type: "Agreement",
//             counterparty: "@0xEcho",
//             outcome: "Completed",
//             date: "2025-09-20",
//             impact: +4,
//           },
//         ],
//       },
//       {
//         handle: "@0xZephyr",
//         score: 58,
//         agreements: 14,
//         disputesWon: 3,
//         disputesLost: 5,
//         ignoredRulings: 1,
//         history: [
//           {
//             type: "Dispute",
//             counterparty: "@0xAlfa",
//             outcome: "Lost",
//             date: "2025-09-18",
//             impact: -4,
//           },
//           {
//             type: "Agreement",
//             counterparty: "@0xNova",
//             outcome: "Completed",
//             date: "2025-09-10",
//             impact: +3,
//           },
//         ],
//       },
//       {
//         handle: "@0xRogue",
//         score: 37,
//         agreements: 5,
//         disputesWon: 0,
//         disputesLost: 6,
//         ignoredRulings: 3,
//         history: [
//           {
//             type: "Dispute",
//             counterparty: "@0xOrion",
//             outcome: "Lost",
//             date: "2025-09-02",
//             impact: -8,
//           },
//           {
//             type: "Ruling",
//             counterparty: "Court",
//             outcome: "Ignored",
//             date: "2025-08-20",
//             impact: -5,
//           },
//         ],
//       },
//       {
//         handle: "@0xAether",
//         score: 89,
//         agreements: 30,
//         disputesWon: 9,
//         disputesLost: 1,
//         ignoredRulings: 0,
//         history: [
//           {
//             type: "Dispute",
//             counterparty: "@0xEcho",
//             outcome: "Won",
//             date: "2025-09-25",
//             impact: +7,
//           },
//           {
//             type: "Agreement",
//             counterparty: "@0xNova",
//             outcome: "Completed",
//             date: "2025-09-20",
//             impact: +5,
//           },
//         ],
//       },
//     ],
//     [],
//   );

//   const [query, setQuery] = useState("");
//   const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
//   const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

//   const sortedData = useMemo(() => {
//     return [...data].sort((a, b) =>
//       sortDir === "desc" ? b.score - a.score : a.score - a.score,
//     );
//   }, [data, sortDir]);

//   const profile =
//     selectedProfile ||
//     data.find((p) => p.handle.toLowerCase() === query.toLowerCase()) ||
//     null;

//   const handleRowClick = (user: Profile) => {
//     setSelectedProfile(user);
//     setQuery(user.handle);
//   };

//   const delta = profile
//     ? profile.history.reduce((acc, h) => acc + h.impact, 0)
//     : 0;

//   return (
//     <div className="relative space-y-6">
//       <div className="absolute inset-0 -z-[50] bg-cyan-500/13 blur-3xl"></div>
//       <header className="flex flex-wrap items-center justify-between gap-3">
//         <h2 className="space text-xl font-semibold text-white/90">
//           Reputation Explorer
//         </h2>
//         <div className="relative w-full max-w-sm">
//           <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Search handle or address"
//             className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm outline-none focus:border-cyan-400/40"
//           />
//         </div>
//       </header>

//       <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//         {/* LEFT COLUMN */}
//         <div className="space-y-6 lg:col-span-2">
//           {/* Leaderboard */}
//           <section className="glass card-cyan">
//             <div className="flex items-center justify-between border-b border-white/10 p-5">
//               <div>
//                 <h3 className="space font-semibold text-white/90">
//                   Leaderboard
//                 </h3>
//                 <div className="text-muted-foreground text-xs">
//                   Top users by reputation
//                 </div>
//               </div>

//               {/* Sort Toggle */}
//               <button
//                 onClick={() =>
//                   setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
//                 }
//                 className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-white/5"
//               >
//                 {sortDir === "desc" ? (
//                   <>
//                     <TrendingDown className="h-3.5 w-3.5" />
//                     <span>Lowest first</span>
//                   </>
//                 ) : (
//                   <>
//                     <TrendingUp className="h-3.5 w-3.5" />
//                     <span>Highest first</span>
//                   </>
//                 )}
//               </button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full text-sm">
//                 <thead>
//                   <tr className="text-muted-foreground text-left">
//                     <th className="w-[5%] px-5 py-3">S/N</th>
//                     <th className="px-5 py-3">User</th>
//                     <th className="px-5 py-3">Disputes</th>
//                     <th className="px-5 py-3 text-center">Votes</th>
//                     <th className="px-5 py-3 text-right">Reputation</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {sortedData.map((user, index) => {
//                     const delta = user.history.reduce(
//                       (acc, h) => acc + h.impact,
//                       0,
//                     );
//                     return (
//                       <tr
//                         key={user.handle}
//                         className="cursor-pointer border-t border-white/10 hover:bg-white/5"
//                         onClick={() => handleRowClick(user)}
//                       >
//                         <td className="text-muted-foreground px-5 py-4">
//                           {index + 1}
//                         </td>

//                         <td className="hover flex items-center gap-3 px-5 py-4">
//                           <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
//                             <User className="h-5 w-5" />
//                           </div>
//                           <Link
//                             to={`/profile/${user.handle.replace("@", "")}`}
//                             className="text-white transition hover:text-cyan-500 hover:underline"
//                           >
//                             {user.handle}
//                           </Link>
//                         </td>
//                         <td className="px-5 py-4">
//                           <div className="flex gap-2">
//                             {/* Won */}
//                             <div className="group relative">
//                               <span className="text-sm text-emerald-300">
//                                 +{user.disputesWon}
//                               </span>
//                               <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-20 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
//                                 Disputes won
//                               </div>
//                             </div>

//                             {/* Lost */}
//                             <div className="group relative">
//                               <span className="text-sm text-red-400">
//                                 -{user.disputesLost}
//                               </span>
//                               <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-20 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
//                                 Disputes lost
//                               </div>
//                             </div>

//                             {/* Ignored */}
//                             <div className="group relative">
//                               <span className="text-sm text-cyan-300">
//                                 {user.ignoredRulings}
//                               </span>
//                               <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-24 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
//                                 Rulings ignored
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-5 py-4 text-center">
//                           {user.agreements}
//                         </td>
//                         <td className="px-5 py-4 text-right">
//                           <span className="relative font-semibold text-white/90">
//                             {user.score}
//                             <sup
//                               className={`ml-1 text-[10px] font-medium ${
//                                 delta >= 0 ? "text-emerald-400" : "text-red-400"
//                               }`}
//                             >
//                               {delta >= 0 ? `+${delta}` : delta}
//                             </sup>
//                           </span>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </section>

//           {/* Reputation History - Only show when a profile is selected */}
//           {profile && (
//             <section className="glass card-cyan">
//               <div className="flex items-center justify-between border-b border-white/10 p-5">
//                 <h3 className="text-sm font-semibold text-white/90">
//                   Reputation History for {profile.handle}
//                 </h3>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="min-w-full text-sm">
//                   <thead>
//                     <tr className="text-muted-foreground text-left">
//                       <th className="w-[5%] px-5 py-3">S/N</th>
//                       <th className="px-5 py-3">User</th>

//                       <th className="w-[35%] px-5 py-3">Reason</th>
//                       <th className="px-5 py-3">Reputation Change</th>
//                       <th className="px-5 py-3">Date</th>
//                       <th className="px-5 py-3 text-right">
//                         Trust Score → Reputation
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {profile.history.map((h, i) => {
//                       const prevScore = profile.score - h.impact;
//                       const currentScore = profile.score;
//                       const reason =
//                         h.type === "Agreement"
//                           ? "Completed successful agreement"
//                           : h.type === "Dispute" && h.outcome === "Won"
//                             ? "Won a dispute"
//                             : h.type === "Dispute" && h.outcome === "Lost"
//                               ? "Lost a dispute"
//                               : "Ignored official ruling";

//                       return (
//                         <tr
//                           key={i}
//                           className="border-t border-white/10 transition hover:bg-white/5"
//                         >
//                           {/* Reputation change */}
//                           <td className="text-muted-foreground px-5 py-4">
//                             {i + 1}
//                           </td>

//                           <td className="hover flex items-center gap-3 px-5 py-4">
//                             <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
//                               <User className="h-5 w-5" />
//                             </div>
//                             <Link
//                               to={`/profile/${h.counterparty.replace("@", "")}`}
//                               className="text-white/80 hover:text-cyan-400 hover:underline"
//                             >
//                               {h.counterparty}
//                             </Link>
//                           </td>

//                           {/* Reason */}
//                           <td className="px-5 py-4 text-white/80">{reason}</td>

//                           {/* User */}

//                           <td className="px-5 py-4">
//                             <span
//                               className={`font-medium ${
//                                 h.impact >= 0
//                                   ? "text-emerald-400"
//                                   : "text-rose-400"
//                               }`}
//                             >
//                               {h.impact >= 0 ? "+" : ""}
//                               {h.impact}
//                             </span>
//                           </td>
//                           {/* Date */}
//                           <td className="text-muted-foreground px-0 py-4 text-xs">
//                             {h.date}
//                           </td>

//                           {/* Trust score change */}
//                           <td className="px-5 py-4 text-right text-white/90">
//                             <span className="inline-flex items-center gap-1">
//                               <span className="text-muted-foreground">
//                                 {prevScore}
//                               </span>
//                               <span className="text-xs text-cyan-400">→</span>
//                               <span
//                                 className={`font-semibold ${
//                                   h.impact >= 0
//                                     ? "text-emerald-300"
//                                     : "text-rose-300"
//                                 }`}
//                               >
//                                 {currentScore}
//                               </span>
//                             </span>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </section>
//           )}
//         </div>

//         {/* RIGHT COLUMN - Notifications and Profile Details */}
//         <aside className="space-y-2">
//           <section className="glass card-cyan max-h-[500px] overflow-y-auto p-5 ring-1 ring-white/10">
//             <h3 className="border-b border-white/10 pb-2 text-sm font-semibold text-white/90">
//               Reputation Updates
//             </h3>

//             <div className="mt-4 space-y-3 text-sm">
//               {/* Positive update */}
//               <div className="flex items-start gap-2">
//                 <Award className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
//                 <p>
//                   <span className="text-cyan-300">@IncomeSharks</span> earned
//                   <span className="font-semibold text-emerald-400"> +5 </span>
//                   reputation for judging{" "}
//                   <span className="text-cyan-300">Case #1223</span>.
//                 </p>
//               </div>

//               {/* Negative update */}
//               <div className="flex items-start gap-2">
//                 <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
//                 <p>
//                   <span className="text-cyan-300">@IncomeSharks</span> lost
//                   <span className="font-semibold text-rose-400"> –3 </span>
//                   reputation <span className="text-cyan-300">Case #1223</span> –
//                   decision misaligned.
//                 </p>
//               </div>
//             </div>
//           </section>

//           {/* Profile, Trust score, Reputation - Only show when a profile is selected */}
//           {profile ? (
//             <>
//               <div className="glass card-cyan flex items-center gap-4 p-6 ring-1 ring-white/10">
//                 <div className="grid h-12 w-12 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
//                   <User className="h-5 w-5" />
//                 </div>
//                 <div>
//                   <div className="text-muted-foreground text-sm">Profile</div>
//                   <div className="font-semibold text-white/90">
//                     {profile.handle}
//                   </div>
//                 </div>
//               </div>

//               <section className="grid grid-cols-1 gap-2">
//                 <div className="glass card-cyan flex items-center justify-between px-6 py-2 ring-1 ring-white/10">
//                   <div>
//                     <div className="text-muted-foreground text-xs">
//                       30d Change
//                     </div>
//                     <div
//                       className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
//                         delta >= 0
//                           ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
//                           : "border-rose-400/30 bg-rose-500/10 text-rose-300"
//                       }`}
//                     >
//                       {delta >= 0 ? (
//                         <TrendingUp className="h-3.5 w-3.5" />
//                       ) : (
//                         <TrendingDown className="h-3.5 w-3.5" />
//                       )}
//                       {delta >= 0 ? "+" : ""}
//                       {delta}
//                     </div>
//                   </div>

//                   <TrustMeter score={profile.score} />
//                 </div>

//                 <div className="glass card-cyan p-6">
//                   <div className="text-muted-foreground">Summary</div>
//                   <div className="mt-2 grid grid-cols-2 gap-4">
//                     {/* Agreements/Won */}
//                     <div className="flex flex-col gap-2">
//                       <div>
//                         <div className="text-muted-foreground space text-sm">
//                           Agreements
//                         </div>
//                         <div className="text-lg font-semibold text-white/90">
//                           {profile.agreements}
//                         </div>
//                       </div>
//                       <div>
//                         <div className="text-muted-foreground space text-sm">
//                           Won
//                         </div>
//                         <div className="text-lg font-semibold text-emerald-300">
//                           {profile.disputesWon}
//                         </div>
//                       </div>
//                     </div>

//                     {/* Lost/Ignored*/}
//                     <div className="flex flex-col gap-2">
//                       <div>
//                         <div className="text-muted-foreground space text-sm">
//                           Lost
//                         </div>
//                         <div className="text-lg font-semibold text-rose-300">
//                           {profile.disputesLost}
//                         </div>
//                       </div>
//                       <div>
//                         <div className="text-muted-foreground space text-sm">
//                           Ignored
//                         </div>
//                         <div className="text-lg font-semibold text-amber-300">
//                           {profile.ignoredRulings}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </section>
//             </>
//           ) : (
//             <div className="glass bg-gradient-to-br from-cyan-500/10 p-8 text-center ring-1 ring-white/10">
//               <User className="mx-auto mb-2 h-8 w-8 text-cyan-300" />
//               <div className="text-muted-foreground text-sm">
//                 Select a user from the leaderboard to view their profile
//               </div>
//             </div>
//           )}
//         </aside>
//       </div>
//     </div>
//   );
// }

// pages/Reputation.tsx
import { useMemo, useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  User,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getUserStatsForReputation,
  // type User as UserType,
} from "../lib/mockUsers";

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

// Reuse the TrustMeter component from your existing code
function TrustMeter({ score }: { score: number }) {
  const r = 54;
  const cx = 64;
  const cy = 64;
  const c = 2 * Math.PI * r;
  const trust = clamp(score);
  const greenLen = (trust / 100) * c;
  const redLen = c - greenLen;

  return (
    <svg viewBox="0 0 128 128" className="h-32 w-32">
      <defs>
        <linearGradient id="gGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
        <linearGradient id="gRed" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fca5a5" />
        </linearGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={10}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="url(#gGreen)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${greenLen} ${c}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="[filter:drop-shadow(0_0_12px_rgba(16,185,129,0.6))]"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="url(#gRed)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${redLen} ${c}`}
        strokeDashoffset={greenLen}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="[filter:drop-shadow(0_0_12px_rgba(244,63,94,0.5))]"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-white text-xl font-bold"
      >
        {trust}
      </text>
      <text
        x="50%"
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-cyan-300 text-[10px]"
      >
        Trust
      </text>
    </svg>
  );
}

export default function Reputation() {
  const data = useMemo(() => getUserStatsForReputation(), []);

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProfile, setSelectedProfile] = useState<
    (typeof data)[0] | null
  >(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      sortDir === "desc" ? b.score - a.score : a.score - a.score,
    );
  }, [data, sortDir]);

  const profile =
    selectedProfile ||
    data.find((p) => p.handle.toLowerCase() === query.toLowerCase()) ||
    null;

  const handleRowClick = (user: (typeof data)[0]) => {
    setSelectedProfile(user);
    setQuery(user.handle);
  };

  const delta = profile
    ? profile.history.reduce((acc, h) => acc + h.impact, 0)
    : 0;

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-0 -z-[50] bg-cyan-500/13 blur-3xl"></div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="space text-xl font-semibold text-white/90">
          Reputation Explorer
        </h2>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search handle or address"
            className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm outline-none focus:border-cyan-400/40"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leaderboard */}
          <section className="glass card-cyan">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3 className="space font-semibold text-white/90">
                  Leaderboard
                </h3>
                <div className="text-muted-foreground text-xs">
                  Top users by reputation
                </div>
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() =>
                  setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
                }
                className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-white/5"
              >
                {sortDir === "desc" ? (
                  <>
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>Lowest first</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Highest first</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="w-[5%] px-5 py-3">S/N</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Disputes</th>
                    <th className="px-5 py-3 text-center">Agreements</th>
                    <th className="px-5 py-3 text-right">Reputation</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((user, index) => {
                    const delta = user.history.reduce(
                      (acc, h) => acc + h.impact,
                      0,
                    );
                    return (
                      <tr
                        key={user.handle}
                        className="cursor-pointer border-t border-white/10 hover:bg-white/5"
                        onClick={() => handleRowClick(user)}
                      >
                        <td className="text-muted-foreground px-5 py-4">
                          {index + 1}
                        </td>

                        <td className="hover flex items-center gap-3 px-5 py-4">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                            <User className="h-5 w-5" />
                          </div>
                          <Link
                            to={`/profile/${user.handle.replace("@", "")}`}
                            className="text-white transition hover:text-cyan-500 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {user.handle}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            {/* Won */}
                            <div className="group relative">
                              <span className="text-sm text-emerald-300">
                                +{user.disputesWon}
                              </span>
                              <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-20 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                                Disputes won
                              </div>
                            </div>

                            {/* Lost */}
                            <div className="group relative">
                              <span className="text-sm text-red-400">
                                -{user.disputesLost}
                              </span>
                              <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-20 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                                Disputes lost
                              </div>
                            </div>

                            {/* Ignored */}
                            <div className="group relative">
                              <span className="text-sm text-cyan-300">
                                {user.ignoredRulings}
                              </span>
                              <div className="absolute top-full left-1/2 z-10 mt-1 hidden w-24 -translate-x-1/2 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                                Rulings ignored
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {user.agreements}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="relative font-semibold text-white/90">
                            {user.score}
                            <sup
                              className={`ml-1 text-[10px] font-medium ${
                                delta >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {delta >= 0 ? `+${delta}` : delta}
                            </sup>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reputation History - Only show when a profile is selected */}
          {profile && (
            <section className="glass card-cyan">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <h3 className="text-sm font-semibold text-white/90">
                  Reputation History for {profile.handle}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left">
                      <th className="w-[5%] px-5 py-3">S/N</th>
                      <th className="px-5 py-3">Counterparty</th>
                      <th className="w-[35%] px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Reputation Change</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">
                        Trust Score → Reputation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.history.map((h, i) => {
                      const prevScore = profile.score - h.impact;
                      const currentScore = profile.score;
                      const reason =
                        h.type === "Agreement"
                          ? "Completed successful agreement"
                          : h.type === "Dispute" && h.outcome === "Won"
                            ? "Won a dispute"
                            : h.type === "Dispute" && h.outcome === "Lost"
                              ? "Lost a dispute"
                              : "Ignored official ruling";

                      return (
                        <tr
                          key={i}
                          className="border-t border-white/10 transition hover:bg-white/5"
                        >
                          <td className="text-muted-foreground px-5 py-4">
                            {i + 1}
                          </td>

                          <td className="hover flex items-center gap-3 px-5 py-4">
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                              <User className="h-5 w-5" />
                            </div>
                            <Link
                              to={`/profile/${h.counterparty.replace("@", "")}`}
                              className="text-white/80 hover:text-cyan-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {h.counterparty}
                            </Link>
                          </td>

                          <td className="px-5 py-4 text-white/80">{reason}</td>

                          <td className="px-5 py-4">
                            <span
                              className={`font-medium ${
                                h.impact >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {h.impact >= 0 ? "+" : ""}
                              {h.impact}
                            </span>
                          </td>

                          <td className="text-muted-foreground px-0 py-4 text-xs">
                            {h.date}
                          </td>

                          <td className="px-5 py-4 text-right text-white/90">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-muted-foreground">
                                {prevScore}
                              </span>
                              <span className="text-xs text-cyan-400">→</span>
                              <span
                                className={`font-semibold ${
                                  h.impact >= 0
                                    ? "text-emerald-300"
                                    : "text-rose-300"
                                }`}
                              >
                                {currentScore}
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN - Keep your existing right column code */}
        {/* ... */}
        <aside className="space-y-2">
          <section className="glass card-cyan max-h-[500px] overflow-y-auto p-5 ring-1 ring-white/10">
            <h3 className="border-b border-white/10 pb-2 text-sm font-semibold text-white/90">
              Reputation Updates
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              {/* Positive update */}
              <div className="flex items-start gap-2">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p>
                  <span className="text-cyan-300">@IncomeSharks</span> earned
                  <span className="font-semibold text-emerald-400"> +5 </span>
                  reputation for judging{" "}
                  <span className="text-cyan-300">Case #1223</span>.
                </p>
              </div>

              {/* Negative update */}
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <p>
                  <span className="text-cyan-300">@IncomeSharks</span> lost
                  <span className="font-semibold text-rose-400"> –3 </span>
                  reputation <span className="text-cyan-300">Case #1223</span> –
                  decision misaligned.
                </p>
              </div>
            </div>
          </section>

          {/* Profile, Trust score, Reputation - Only show when a profile is selected */}
          {profile ? (
            <>
              <div className="glass card-cyan flex items-center gap-4 p-6 ring-1 ring-white/10">
                <div className="grid h-12 w-12 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Profile</div>
                  <div className="font-semibold text-white/90">
                    {profile.handle}
                  </div>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-2">
                <div className="glass card-cyan flex items-center justify-between px-6 py-2 ring-1 ring-white/10">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      30d Change
                    </div>
                    <div
                      className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                        delta >= 0
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {delta >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {delta >= 0 ? "+" : ""}
                      {delta}
                    </div>
                  </div>

                  <TrustMeter score={profile.score} />
                </div>

                <div className="glass card-cyan p-6">
                  <div className="text-muted-foreground">Summary</div>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {/* Agreements/Won */}
                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Agreements
                        </div>
                        <div className="text-lg font-semibold text-white/90">
                          {profile.agreements}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Won
                        </div>
                        <div className="text-lg font-semibold text-emerald-300">
                          {profile.disputesWon}
                        </div>
                      </div>
                    </div>

                    {/* Lost/Ignored*/}
                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Lost
                        </div>
                        <div className="text-lg font-semibold text-rose-300">
                          {profile.disputesLost}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground space text-sm">
                          Ignored
                        </div>
                        <div className="text-lg font-semibold text-amber-300">
                          {profile.ignoredRulings}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="glass bg-gradient-to-br from-cyan-500/10 p-8 text-center ring-1 ring-white/10">
              <User className="mx-auto mb-2 h-8 w-8 text-cyan-300" />
              <div className="text-muted-foreground text-sm">
                Select a user from the leaderboard to view their profile
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
