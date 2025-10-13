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

type HistoryRow = {
  type: string;
  counterparty: string;
  outcome: string;
  date: string;
  impact: number;
};

type Profile = {
  handle: string;
  score: number;
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
    <svg viewBox="0 0 128 128" className="w-32 h-32">
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
      {
        handle: "@0xNova",
        score: 92,
        agreements: 35,
        disputesWon: 10,
        disputesLost: 1,
        ignoredRulings: 0,
        history: [
          {
            type: "Dispute",
            counterparty: "@0xAstra",
            outcome: "Won",
            date: "2025-09-28",
            impact: +6,
          },
          {
            type: "Agreement",
            counterparty: "@0xEcho",
            outcome: "Completed",
            date: "2025-09-25",
            impact: +5,
          },
          {
            type: "Dispute",
            counterparty: "@0xOrion",
            outcome: "Won",
            date: "2025-09-10",
            impact: +8,
          },
        ],
      },
      {
        handle: "@0xEcho",
        score: 51,
        agreements: 8,
        disputesWon: 1,
        disputesLost: 4,
        ignoredRulings: 2,
        history: [
          {
            type: "Dispute",
            counterparty: "@0xAlfa",
            outcome: "Lost",
            date: "2025-09-13",
            impact: -6,
          },
          {
            type: "Ruling",
            counterparty: "Court",
            outcome: "Ignored",
            date: "2025-08-05",
            impact: -5,
          },
        ],
      },
      {
        handle: "@0xOrion",
        score: 71,
        agreements: 19,
        disputesWon: 5,
        disputesLost: 3,
        ignoredRulings: 1,
        history: [
          {
            type: "Agreement",
            counterparty: "@0xNova",
            outcome: "Completed",
            date: "2025-09-18",
            impact: +4,
          },
          {
            type: "Dispute",
            counterparty: "@0xEcho",
            outcome: "Won",
            date: "2025-09-15",
            impact: +6,
          },
          {
            type: "Dispute",
            counterparty: "@0xNova",
            outcome: "Lost",
            date: "2025-09-10",
            impact: -3,
          },
        ],
      },
      {
        handle: "@0xLumen",
        score: 83,
        agreements: 27,
        disputesWon: 7,
        disputesLost: 2,
        ignoredRulings: 0,
        history: [
          {
            type: "Dispute",
            counterparty: "@0xOrion",
            outcome: "Won",
            date: "2025-09-22",
            impact: +7,
          },
          {
            type: "Agreement",
            counterparty: "@0xEcho",
            outcome: "Completed",
            date: "2025-09-20",
            impact: +4,
          },
        ],
      },
      {
        handle: "@0xZephyr",
        score: 58,
        agreements: 14,
        disputesWon: 3,
        disputesLost: 5,
        ignoredRulings: 1,
        history: [
          {
            type: "Dispute",
            counterparty: "@0xAlfa",
            outcome: "Lost",
            date: "2025-09-18",
            impact: -4,
          },
          {
            type: "Agreement",
            counterparty: "@0xNova",
            outcome: "Completed",
            date: "2025-09-10",
            impact: +3,
          },
        ],
      },
      {
        handle: "@0xRogue",
        score: 37,
        agreements: 5,
        disputesWon: 0,
        disputesLost: 6,
        ignoredRulings: 3,
        history: [
          {
            type: "Dispute",
            counterparty: "@0xOrion",
            outcome: "Lost",
            date: "2025-09-02",
            impact: -8,
          },
          {
            type: "Ruling",
            counterparty: "Court",
            outcome: "Ignored",
            date: "2025-08-20",
            impact: -5,
          },
        ],
      },
      {
        handle: "@0xAether",
        score: 89,
        agreements: 30,
        disputesWon: 9,
        disputesLost: 1,
        ignoredRulings: 0,
        history: [
          {
            type: "Dispute",
            counterparty: "@0xEcho",
            outcome: "Won",
            date: "2025-09-25",
            impact: +7,
          },
          {
            type: "Agreement",
            counterparty: "@0xNova",
            outcome: "Completed",
            date: "2025-09-20",
            impact: +5,
          },
        ],
      },
    ],
    []
  );

  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      sortDir === "desc" ? b.score - a.score : a.score - a.score
    );
  }, [data, sortDir]);

  const profile =
    selectedProfile ||
    data.find((p) => p.handle.toLowerCase() === query.toLowerCase()) ||
    null;

  const handleRowClick = (user: Profile) => {
    setSelectedProfile(user);
    setQuery(user.handle);
  };

  const delta = profile
    ? profile.history.reduce((acc, h) => acc + h.impact, 0)
    : 0;

  return (
    <div className="space-y-6 relative">
      <div className="absolute inset-0 bg-cyan-500/13 blur-3xl -z-[50]"></div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white/90 space">
          Reputation Explorer
        </h2>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search handle or address"
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-cyan-400/40"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaderboard */}
          <section className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3 className="font-semibold text-white/90 space">
                  Leaderboard
                </h3>
                <div className="text-xs text-muted-foreground">
                  Top users by reputation
                </div>
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() =>
                  setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
                }
                className="flex items-center gap-2 text-xs border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/5 text-cyan-300 transition"
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
                  <tr className="text-left text-muted-foreground">
                    <th className="px-5 py-3 w-[5%]">S/N</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Disputes</th>
                    <th className="px-5 py-3 text-center">Votes</th>
                    <th className="px-5 py-3 text-right">Reputation</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((user, index) => {
                    const delta = user.history.reduce(
                      (acc, h) => acc + h.impact,
                      0
                    );
                    return (
                      <tr
                        key={user.handle}
                        className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
                        onClick={() => handleRowClick(user)}
                      >
                        <td className="px-5 py-4 text-muted-foreground">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4 flex items-center gap-3 hover">
                          <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center ">
                            <User className="h-5 w-5" />
                          </div>
                          <Link
                            to={`/profile/${user.handle.replace("@", "")}`}
                            className="text-white hover:text-cyan-500 hover:underline transition"
                          >
                            {user.handle}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            {/* Won */}
                            <div className="relative group">
                              <span className="text-emerald-300 text-sm">
                                +{user.disputesWon}
                              </span>
                              <div className="absolute left-1/2 top-full z-10 hidden w-20 -translate-x-1/2 mt-1 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                                Disputes won
                              </div>
                            </div>

                            {/* Lost */}
                            <div className="relative group">
                              <span className="text-red-400 text-sm">
                                -{user.disputesLost}
                              </span>
                              <div className="absolute left-1/2 top-full z-10 hidden w-20 -translate-x-1/2 mt-1 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                                Disputes lost
                              </div>
                            </div>

                            {/* Ignored */}
                            <div className="relative group">
                              <span className="text-cyan-300 text-sm">
                                {user.ignoredRulings}
                              </span>
                              <div className="absolute left-1/2 top-full z-10 hidden w-24 -translate-x-1/2 mt-1 rounded-md bg-cyan-950/90 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                                Rulings ignored
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {user.agreements}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-white/90 font-semibold relative">
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
            <section className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <h3 className="text-sm font-semibold text-white/90">
                  Reputation History for {profile.handle}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="px-5 py-3 w-[5%]">S/N</th>
                      <th className="px-5 py-3">User</th>

                      <th className="px-5 py-3 w-[35%]">Reason</th>
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
                          className="border-t border-white/10 hover:bg-white/5 transition"
                        >
                          {/* Reputation change */}
                          <td className="px-5 py-4 text-muted-foreground">
                            {i + 1}
                          </td>

                          <td className="px-5 py-4 flex items-center gap-3 hover">
                            <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center ">
                              <User className="h-5 w-5" />
                            </div>
                            <Link
                              to={`/profile/${h.counterparty.replace("@", "")}`}
                              className="text-white/80 hover:text-cyan-400 hover:underline"
                            >
                              {h.counterparty}
                            </Link>
                          </td>

                          {/* Reason */}
                          <td className="px-5 py-4 text-white/80">{reason}</td>

                          {/* User */}

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
                          {/* Date */}
                          <td className="px-0 py-4 text-muted-foreground text-xs">
                            {h.date}
                          </td>

                          {/* Trust score change */}
                          <td className="px-5 py-4 text-right text-white/90">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-muted-foreground">
                                {prevScore}
                              </span>
                              <span className="text-cyan-400 text-xs">→</span>
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

        {/* RIGHT COLUMN - Notifications and Profile Details */}
        <aside className="space-y-2">
          <section className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10 p-5 max-h-[500px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-white/90 border-b border-white/10 pb-2">
              Reputation Updates
            </h3>

            <div className="space-y-3 text-sm mt-4">
              {/* Positive update */}
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <p>
                  <span className="text-cyan-300">@IncomeSharks</span> earned
                  <span className="text-emerald-400 font-semibold"> +5 </span>
                  reputation for judging{" "}
                  <span className="text-cyan-300">Case #1223</span>.
                </p>
              </div>

              {/* Negative update */}
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                <p>
                  <span className="text-cyan-300">@IncomeSharks</span> lost
                  <span className="text-rose-400 font-semibold"> –3 </span>
                  reputation <span className="text-cyan-300">Case #1223</span> –
                  decision misaligned.
                </p>
              </div>
            </div>
          </section>

          {/* Profile, Trust score, Reputation - Only show when a profile is selected */}
          {profile ? (
            <>
              <div className="glass ring-1 ring-white/10 p-6 flex items-center gap-4 bg-gradient-to-br from-cyan-500/10">
                <div className="grid h-12 w-12 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Profile</div>
                  <div className="text-white/90 font-semibold">
                    {profile.handle}
                  </div>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-2">
                <div className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10 px-6 py-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      30d Change
                    </div>
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
                      )}
                      {delta >= 0 ? "+" : ""}
                      {delta}
                    </div>
                  </div>

                  <TrustMeter score={profile.score} />
                </div>

                <div className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10">
                  <div className=" text-muted-foreground">Summary</div>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {/* Agreements/Won */}
                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="text-sm text-muted-foreground space">
                          Agreements
                        </div>
                        <div className="text-lg font-semibold text-white/90">
                          {profile.agreements}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground space">
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
                        <div className="text-sm text-muted-foreground space">
                          Lost
                        </div>
                        <div className="text-lg font-semibold text-rose-300">
                          {profile.disputesLost}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground space">
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
            <div className="glass ring-1 ring-white/10 p-8 text-center bg-gradient-to-br from-cyan-500/10">
              <User className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Select a user from the leaderboard to view their profile
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
