import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Lock, Eye, Clock, Key } from "lucide-react";

type CaseItem = {
  id: string;
  type: string;
  parties: { a: string; b: string };
  summary: string;
  commitEnd: number; // epoch ms
  revealEnd: number; // epoch ms
};

const now = () => Date.now();

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

async function sha256Hex(input: string) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Voting() {
  const cases: CaseItem[] = useMemo(() => {
    const t0 = now();
    return [
      {
        id: "D-229",
        type: "Payment",
        parties: { a: "@0xAlfa", b: "@0xBeta" },
        summary: "Payment dispute regarding milestone delivery.",
        commitEnd: t0 + 1000 * 60 * 15, // 15m
        revealEnd: t0 + 1000 * 60 * 35, // 35m
      },
      {
        id: "D-231",
        type: "Quality",
        parties: { a: "@0xAstra", b: "@0xNova" },
        summary: "Quality concerns on delivered assets.",
        commitEnd: t0 + 1000 * 60 * 5,
        revealEnd: t0 + 1000 * 60 * 25,
      },
      {
        id: "D-233",
        type: "Delivery",
        parties: { a: "@0xOrion", b: "@0xEcho" },
        summary: "Late delivery claimed by Party A.",
        commitEnd: t0 + 1000 * 60 * 45,
        revealEnd: t0 + 1000 * 60 * 70,
      },
    ];
  }, []);

  const [selected, setSelected] = useState<CaseItem>(cases[0]);

  // voting state
  const [choice, setChoice] = useState<"A" | "B" | "N">("N");
  const [salt, setSalt] = useState<string>(() =>
    Math.random().toString(36).slice(2)
  );
  const [commitHash, setCommitHash] = useState<string>("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    sha256Hex(`${selected.id}|${choice}|${salt}`).then(setCommitHash);
  }, [selected.id, choice, salt]);

  // timer
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const phase = useMemo(() => {
    const t = now();
    if (t < selected.commitEnd) return "commit" as const;
    if (t < selected.revealEnd) return "reveal" as const;
    return "closed" as const;
  }, [selected, tick]);

  const totalWindow =
    selected.revealEnd -
    (selected.commitEnd - (selected.commitEnd - (selected.commitEnd - 0)));
  const elapsed = Math.min(
    now() - (selected.commitEnd - 1000 * 60 * 0),
    totalWindow
  );

  const commitRemaining = Math.max(0, selected.commitEnd - now());
  const revealRemaining = Math.max(0, selected.revealEnd - now());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Active disputes as cards */}
      <section className="space-y-3 lg:col-span-1">
        <h1 className="text-xl font-semibold text-white/90">
          Active Disputes for Voting
        </h1>
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelected(c);
              setRevealed(false);
            }}
            className={`group w-full rounded-xl border p-4 text-left transition hover:ring-cyan-400/30 glass ring-1 ring-white/10 ${
              selected.id === c.id ? "bg-white/7 ring-cyan-400/30" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">
                  {c.type}
                </span>
                <div className="text-sm font-medium text-white/90">{c.id}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatRemaining(Math.max(0, c.commitEnd - now()))}
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {c.parties.a} vs {c.parties.b}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {c.summary}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 bg-gradient-to-r from-cyan-500/40 to-cyan-300/50" />
              </div>
              <span className="text-xs text-cyan-300 opacity-0 transition group-hover:opacity-100">
                View Case
              </span>
            </div>
          </button>
        ))}
      </section>

      {/* Right: Case view and voting */}
      <section className="lg:col-span-2 space-y-5">
        <div className="glass p-6 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Case</div>
              <div className="text-lg font-semibold text-white/90">
                {selected.id} • {selected.type}
              </div>
              <div className="text-xs text-muted-foreground">
                {selected.parties.a} vs {selected.parties.b}
              </div>
            </div>
            <div className="min-w-[220px]">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Voting Progress</span>
                <span>
                  {phase === "commit"
                    ? "Commit"
                    : phase === "reveal"
                    ? "Reveal"
                    : "Closed"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full bg-gradient-to-r ${
                    phase === "commit"
                      ? "from-cyan-500/60 to-cyan-300/60"
                      : phase === "reveal"
                      ? "from-emerald-500/60 to-emerald-300/60"
                      : "from-zinc-500/40 to-zinc-300/40"
                  }`}
                  style={{
                    width:
                      phase === "commit"
                        ? `${
                            (1 -
                              commitRemaining /
                                (selected.commitEnd -
                                  (selected.revealEnd - 20 * 60 * 1000))) *
                            100
                          }%`
                        : phase === "reveal"
                        ? `${
                            (1 -
                              revealRemaining /
                                (selected.revealEnd - selected.commitEnd)) *
                            100
                          }%`
                        : "100%",
                  }}
                />
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-cyan-300" />
                <span>
                  {phase === "commit" &&
                    `Commit ends in ${formatRemaining(commitRemaining)}`}
                  {phase === "reveal" &&
                    `Reveal ends in ${formatRemaining(revealRemaining)}`}
                  {phase === "closed" && "Voting closed"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Commit phase */}
          <div className="glass p-6 ring-1 ring-white/10">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-300" />
              <h3 className="text-sm font-semibold text-white/90">
                Commit Phase
              </h3>
            </div>
            <fieldset className="space-y-3">
              <legend className="mb-2 block text-xs text-muted-foreground">
                Choose your stance
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { k: "A", label: `Party A (${selected.parties.a})` },
                    { k: "B", label: `Party B (${selected.parties.b})` },
                    { k: "N", label: "Neutral" },
                  ] as const
                ).map((o) => (
                  <label
                    key={o.k}
                    className={`cursor-pointer rounded-md border p-3 text-center text-xs transition hover:border-cyan-400/40 ${
                      choice === o.k
                        ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-200"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vote"
                      className="hidden"
                      checked={choice === o.k}
                      onChange={() => setChoice(o.k)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Auto-generated salt
                  </label>
                  <input
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-cyan-400/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Commit hash (SHA-256)
                  </label>
                  <code className="block truncate rounded-md border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-cyan-300">
                    {commitHash}
                  </code>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  disabled={phase !== "commit"}
                  variant="neon"
                  className="neon-hover"
                >
                  Commit Vote
                </Button>
              </div>
            </fieldset>
          </div>

          {/* Reveal phase */}
          <div className="glass p-6 ring-1 ring-white/10">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-300" />
              <h3 className="text-sm font-semibold text-white/90">
                Reveal Phase
              </h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Your choice
                </label>
                <input
                  value={choice}
                  readOnly
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Salt (same as commit)
                </label>
                <input
                  value={salt}
                  readOnly
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Derived key
                </label>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-cyan-300" />
                  <code className="truncate text-[11px] text-cyan-300">
                    {commitHash.slice(0, 40)}…
                  </code>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button
                disabled={phase !== "reveal"}
                variant="outline"
                className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
              >
                Reveal Vote
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
