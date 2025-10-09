import { useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown, User } from "lucide-react";

type HistoryRow = {
  type: string;
  counterparty: string;
  outcome: string;
  date: string;
  impact: number; // -10..+10
};

type Profile = {
  handle: string;
  score: number; // 0-100
  agreements: number;
  disputesWon: number;
  disputesLost: number;
  ignoredRulings: number;
  history: HistoryRow[];
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function TrustMeter({ score }: { score: number }) {
  const r = 54;
  const cx = 64;
  const cy = 64;
  const c = 2 * Math.PI * r;
  const trust = clamp(score);
  const greenLen = (trust / 100) * c;
  const redLen = c - greenLen;
  return (
    <svg viewBox="0 0 128 128" className="w-40 h-40">
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
        className="fill-white text-2xl font-bold"
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
  const data = useMemo<Profile[]>(
    () => [
      {
        handle: "@0xAlfa",
        score: 78,
        agreements: 24,
        disputesWon: 6,
        disputesLost: 2,
        ignoredRulings: 1,
        history: [
          {
            type: "Agreement",
            counterparty: "@0xBeta",
            outcome: "Completed",
            date: "2025-09-20",
            impact: +4,
          },
          {
            type: "Dispute",
            counterparty: "@0xBeta",
            outcome: "Won",
            date: "2025-09-13",
            impact: +8,
          },
          {
            type: "Dispute",
            counterparty: "@0xEcho",
            outcome: "Lost",
            date: "2025-08-30",
            impact: -6,
          },
          {
            type: "Ruling",
            counterparty: "Court",
            outcome: "Ignored",
            date: "2025-08-05",
            impact: -8,
          },
        ],
      },
      {
        handle: "@0xAstra",
        score: 64,
        agreements: 12,
        disputesWon: 2,
        disputesLost: 3,
        ignoredRulings: 0,
        history: [
          {
            type: "Agreement",
            counterparty: "@0xNova",
            outcome: "Completed",
            date: "2025-09-11",
            impact: +3,
          },
          {
            type: "Dispute",
            counterparty: "@0xNova",
            outcome: "Resolved",
            date: "2025-09-10",
            impact: +2,
          },
        ],
      },
    ],
    []
  );

  const [query, setQuery] = useState("@0xAlfa");
  const profile =
    data.find((p) => p.handle.toLowerCase() === query.toLowerCase()) || data[0];

  const delta = profile.history.reduce((acc, h) => acc + h.impact, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white/90">
          Reputation Explorer
        </h2>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search handle or address"
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-cyan-400/40"
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass ring-1 ring-white/10 p-6 flex items-center gap-4 bg-gradient-to-br from-cyan-500/10">
          <div className="grid h-12 w-12 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Profile</div>
            <div className="text-white/90 font-semibold">{profile.handle}</div>
          </div>
        </div>
        <div className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10">
          <div className="text-xs text-muted-foreground">Summary</div>
          <div className="mt-2 grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-[10px] text-muted-foreground">
                Agreements
              </div>
              <div className="text-lg font-semibold text-white/90">
                {profile.agreements}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Won</div>
              <div className="text-lg font-semibold text-emerald-300">
                {profile.disputesWon}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Lost</div>
              <div className="text-lg font-semibold text-rose-300">
                {profile.disputesLost}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Ignored</div>
              <div className="text-lg font-semibold text-amber-300">
                {profile.ignoredRulings}
              </div>
            </div>
          </div>
        </div>
        <div className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10 p-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">30d Change</div>
            <div
              className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                delta >= 0
                  ? "border-emerald-400/30 text-emerald-300 bg-emerald-500/10"
                  : "border-rose-400/30 text-rose-300 bg-rose-500/10"
              }`}
            >
              {delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}{" "}
              {delta >= 0 ? "+" : ""}
              {delta}
            </div>
          </div>
          <TrustMeter score={profile.score} />
        </div>
      </section>

      <section className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white/90">History</h3>
          <div className="text-xs text-muted-foreground">
            Impact: green positive, red negative
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Counterparty</th>
                <th className="px-5 py-3">Outcome</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Impact</th>
              </tr>
            </thead>
            <tbody>
              {profile.history.map((h, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-5 py-4">{h.type}</td>
                  <td className="px-5 py-4">{h.counterparty}</td>
                  <td className="px-5 py-4">{h.outcome}</td>
                  <td className="px-5 py-4 text-muted-foreground">{h.date}</td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`badge ${
                        h.impact >= 0 ? "badge-green" : "badge-red"
                      }`}
                    >
                      {h.impact >= 0 ? "+" : ""}
                      {h.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
