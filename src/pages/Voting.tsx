import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Info } from "lucide-react";
import {
  Clock,
  ExternalLink,
  // MessageSquare,
  // ThumbsDown,
  // ThumbsUp,
  // Minus,
} from "lucide-react";
// import { Switch } from "../components/ui/switch";
import { Link } from "react-router-dom";

function now() {
  return Date.now();
}
function fmtRemain(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000),
    h = Math.floor(s / 3600)
      .toString()
      .padStart(2, "0"),
    m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0"),
    ss = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

// Types
interface LiveCase {
  id: string;
  title: string;
  parties: { plaintiff: string; defendant: string };
  description: string;
  endsAt: number;
  participants: {
    handle: string;
    commented: boolean;
    role: "judge" | "community";
  }[];
}
interface DoneCase {
  id: string;
  title: string;
  parties: { plaintiff: string; defendant: string };
  description: string;
  winner: "plaintiff" | "defendant" | "dismissed";
  judgeVotes: number;
  communityVotes: number;
  judgePct: number;
  communityPct: number;
  comments: { handle: string; text: string }[];
}

export default function Voting() {
  const currentUser = "@judgeNova"; // or dynamically from wallet/session

  const t0 = now();
  const live = useMemo<LiveCase[]>(
    () => [
      {
        id: "D-229",
        title: "Payment dispute for audit",
        parties: { plaintiff: "@0xAlfa", defendant: "@0xBeta" },
        description: "Milestone invoice unpaid after delivery.",
        endsAt: t0 + 1000 * 60 * 35,
        participants: [
          { handle: "@judgeNova", commented: true, role: "judge" },
          { handle: "@0xEcho", commented: false, role: "community" },
        ],
      },
      {
        id: "D-231",
        title: "Quality concerns on assets",
        parties: { plaintiff: "@0xAstra", defendant: "@0xNova" },
        description: "Delivered assets not meeting specs.",
        endsAt: t0 + 1000 * 60 * 12,
        participants: [
          { handle: "@judgeOrion", commented: true, role: "judge" },
          { handle: "@0xVega", commented: false, role: "community" },
        ],
      },
      {
        id: "D-237",
        title: "Unauthorized contract modification",
        parties: { plaintiff: "@0xDelta", defendant: "@0xSigma" },
        description:
          "Plaintiff claims terms were altered post-deployment without consent.",
        endsAt: t0 + 1000 * 60 * 50,
        participants: [
          { handle: "@judgeAres", commented: true, role: "judge" },
          { handle: "@0xZion", commented: false, role: "community" },
          { handle: "@0xEcho", commented: true, role: "community" },
        ],
      },
      {
        id: "D-240",
        title: "Unverified milestone submission",
        parties: { plaintiff: "@0xRay", defendant: "@0xEon" },
        description:
          "Defendant claims milestone submitted, but verification data missing.",
        endsAt: t0 + 1000 * 60 * 25,
        participants: [
          { handle: "@judgeKai", commented: true, role: "judge" },
          { handle: "@0xNexa", commented: false, role: "community" },
          { handle: "@0xOrion", commented: false, role: "community" },
        ],
      },
      {
        id: "D-242",
        title: "Token distribution delay",
        parties: { plaintiff: "@0xZen", defendant: "@0xPulse" },
        description:
          "Launch tokens delayed beyond agreed release date, causing liquidity impact.",
        endsAt: t0 + 1000 * 60 * 90,
        participants: [
          { handle: "@judgeVera", commented: false, role: "judge" },
          { handle: "@0xDraco", commented: false, role: "community" },
          { handle: "@0xMira", commented: true, role: "community" },
        ],
      },
      {
        id: "D-248",
        title: "Data tampering allegation",
        parties: { plaintiff: "@0xIon", defendant: "@0xCore" },
        description:
          "Evidence suggests defendant modified shared report data pre-submission.",
        endsAt: t0 + 1000 * 60 * 10,
        participants: [
          { handle: "@judgeNova", commented: true, role: "judge" },
          { handle: "@0xEcho", commented: false, role: "community" },
          { handle: "@0xLyra", commented: false, role: "community" },
        ],
      },
      {
        id: "D-252",
        title: "Unclear IP ownership",
        parties: { plaintiff: "@0xAtom", defendant: "@0xPrime" },
        description:
          "Project code ownership not clearly defined in initial agreement.",
        endsAt: t0 + 1000 * 60 * 48,
        participants: [
          { handle: "@judgeAres", commented: false, role: "judge" },
          { handle: "@0xZenith", commented: false, role: "community" },
          { handle: "@0xRay", commented: false, role: "community" },
        ],
      },
      {
        id: "D-255",
        title: "Mismatched invoice total",
        parties: { plaintiff: "@0xLuna", defendant: "@0xCrux" },
        description:
          "Invoice total differed from contract-approved budget by 2.3%.",
        endsAt: t0 + 1000 * 60 * 18,
        participants: [
          { handle: "@judgeOrion", commented: true, role: "judge" },
          { handle: "@0xKai", commented: false, role: "community" },
          { handle: "@0xAstra", commented: false, role: "community" },
        ],
      },
      {
        id: "D-259",
        title: "False bug bounty claim",
        parties: { plaintiff: "@0xDraco", defendant: "@0xVolt" },
        description:
          "Plaintiff accused of submitting duplicate bug report already rewarded.",
        endsAt: t0 + 1000 * 60 * 27,
        participants: [
          { handle: "@judgeVera", commented: true, role: "judge" },
          { handle: "@0xEon", commented: false, role: "community" },
        ],
      },
      {
        id: "D-262",
        title: "Liquidity withdrawal breach",
        parties: { plaintiff: "@0xOmega", defendant: "@0xPulse" },
        description:
          "Defendant withdrew LP funds prior to agreed lock period expiration.",
        endsAt: t0 + 1000 * 60 * 55,
        participants: [
          { handle: "@judgeNova", commented: false, role: "judge" },
          { handle: "@0xZed", commented: true, role: "community" },
          { handle: "@0xDraco", commented: false, role: "community" },
        ],
      },
    ],
    [t0]
  );
  const concluded = useMemo<DoneCase[]>(
    () => [
      {
        id: "D-210",
        title: "Late delivery",
        parties: { plaintiff: "@0xOrion", defendant: "@0xEcho" },
        description: "Delivery exceeded deadline by 9 days.",
        winner: "plaintiff",
        judgeVotes: 7,
        communityVotes: 124,
        judgePct: 72,
        communityPct: 61,
        comments: [
          { handle: "@judgeNova", text: "Compelling evidence of delay." },
          { handle: "@judgeAres", text: "Timeline clearly missed." },
        ],
      },
      {
        id: "D-207",
        title: "Scope misunderstanding",
        parties: { plaintiff: "@0xIon", defendant: "@0xZed" },
        description: "Contract ambiguous; recommendation to dismiss.",
        winner: "dismissed",
        judgeVotes: 5,
        communityVotes: 82,
        judgePct: 55,
        communityPct: 53,
        comments: [
          { handle: "@judgeKai", text: "Insufficient grounds; dismiss." },
        ],
      },
    ],
    []
  );

  const [tab, setTab] = useState<"live" | "done">("live");
  const [, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-6 relative">
      <div className="absolute inset-0 bg-cyan-500/15 blur-3xl -z-[50]" />

      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90">Voting Hub</h2>
        {/* <div className="text-xs text-muted-foreground">
          Connected as:{" "}
          <span className="text-cyan-300 font-medium">{currentUser}</span>
        </div> */}
      </header>

      {/* Custom Tabs */}
      <div className="flex w-fit rounded-md bg-white/5 p-1">
        <button
          onClick={() => setTab("live")}
          className={`px-4 py-1.5 text-sm rounded-md transition ${
            tab === "live"
              ? "bg-cyan-500/20 text-cyan-300"
              : "text-muted-foreground hover:text-white/80"
          }`}
        >
          LIVE
        </button>
        <button
          onClick={() => setTab("done")}
          className={`px-4 py-1.5 text-sm rounded-md transition ${
            tab === "done"
              ? "bg-cyan-500/20 text-cyan-300"
              : "text-muted-foreground hover:text-white/80"
          }`}
        >
          CONCLUDED
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 grid-flow-row-dense items-start max-w-[1050px] mx-auto">
        {tab === "live" &&
          live.map((c) => (
            <LiveCaseCard key={c.id} c={c} currentUser={currentUser} />
          ))}
        {tab === "done" &&
          concluded.map((c) => <DoneCaseCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function LiveCaseCard({
  c,
  currentUser,
}: {
  c: LiveCase;
  currentUser: string;
}) {
  const [choice, setChoice] = useState<"plaintiff" | "defendant" | "dismissed">(
    "plaintiff"
  );
  const [comment, setComment] = useState("");
  const remain = Math.max(0, c.endsAt - now());

  const isJudge = c.participants.some(
    (p) => p.handle === currentUser && p.role === "judge"
  );

  return (
    <div className="border border-white/10 rounded-xl p-0 relative">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4">
            <div>
              <div className="text-sm text-muted-foreground">{c.id}</div>
              <div className="text-white/90 font-semibold">{c.title}</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-cyan-300 font-medium">
                  Plaintiff: {c.parties.plaintiff}
                </span>{" "}
                vs{" "}
                <span className="text-pink-300 font-medium">
                  Defendant: {c.parties.defendant}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-muted-foreground flex items-center justify-end gap-2 text-xl">
                <Clock className="h-5 w-5 text-cyan-300" /> Voting ends
              </div>
              <div className="font-mono text-lg text-cyan-300">
                {fmtRemain(remain)}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5" />

          <AccordionContent className="px-5">
            <div className="space-y-3">
              <Link
                to={`/disputes?case=${c.id}`}
                className="inline-flex items-center text-xs text-cyan-300 hover:underline"
              >
                <ExternalLink className="mr-1 h-5 w-5" />
                <span className="mt-1">Details</span>
              </Link>

              {/* Voting Options */}
              <div>
                <div className="mb-2 text-sm text-muted-foreground">
                  Who is your vote for?
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <VoteOption
                    label={`Plaintiff (${c.parties.plaintiff})`}
                    active={choice === "plaintiff"}
                    onClick={() => setChoice("plaintiff")}
                  />
                  <VoteOption
                    label={`Defendant (${c.parties.defendant})`}
                    active={choice === "defendant"}
                    onClick={() => setChoice("defendant")}
                  />
                  <VoteOption
                    label="Dismiss Case"
                    active={choice === "dismissed"}
                    onClick={() => setChoice("dismissed")}
                  />
                </div>
              </div>

              {/* Comment Section */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Comment{" "}
                    {isJudge && <span className="text-xs">(max 1200)</span>}
                  </span>
                  {!isJudge && (
                    <span className="text-xs text-muted-foreground">
                      Only judges can comment
                    </span>
                  )}
                </div>

                <textarea
                  disabled={!isJudge}
                  value={comment}
                  onChange={(e) =>
                    e.target.value.length <= 1200 && setComment(e.target.value)
                  }
                  className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40 disabled:opacity-60"
                  placeholder={
                    isJudge
                      ? "Add your reasoning..."
                      : "Comments restricted to judges"
                  }
                />
                {isJudge && (
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">
                    {1200 - comment.length} characters left
                  </div>
                )}
              </div>

              {/* Vote Button + Info */}
              <div className="flex items-center justify-between gap-3 mt-3">
                <Button variant="neon" className="neon-hover">
                  Cast Vote
                </Button>

                <div className="relative group cursor-pointer">
                  <Info className="w-4 h-4 text-cyan-300/70 group-hover:text-cyan-300 transition" />
                  <div className="absolute right-0 top-full mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                    Your vote remains private until the voting period ends.
                    During this time, only your participation status (“voted”)
                    is visible — not your decision.
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 h-fit mt-2">
                <div className="mb-2 text-sm font-medium text-white/90">
                  Participants
                </div>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {c.participants.map((p, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-white/10 bg-white/5 p-3"
                    >
                      <span
                        className={`${
                          p.role === "judge" ? "text-cyan-400" : "text-white/80"
                        }`}
                      >
                        {p.handle}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({p.role})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Votes and comments remain hidden until conclusion.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function VoteOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center hover:bg-cyan-500/30 justify-center gap-2 rounded-md border px-3 py-2 text-center text-xs transition ${
        active
          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
          : "border-white/10 bg-white/5 hover:border-cyan-400/30"
      }`}
    >
      {label}
    </button>
  );
}

function DoneCaseCard({ c }: { c: DoneCase }) {
  const totalVotes = c.judgeVotes + c.communityVotes;

  // Approximate for demo (you can replace with backend values)
  const plaintiffVotes = Math.round(
    (totalVotes * (c.judgePct + c.communityPct)) / 200
  );
  const defendantVotes = totalVotes - plaintiffVotes;

  const winLabel =
    c.winner === "plaintiff"
      ? "Plaintiff"
      : c.winner === "defendant"
      ? "Defendant"
      : "Dismissed";

  const winPct = Math.round(c.judgePct * 0.7 + c.communityPct * 0.3);

  return (
    <div className="border border-white/10 rounded-xl relative overflow-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value="case">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <div>
              <div className="text-white/90 font-semibold">{c.title}</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-cyan-300 font-medium">
                  Plaintiff: {c.parties.plaintiff}
                </span>{" "}
                vs{" "}
                <span className="text-pink-300 font-medium">
                  Defendant: {c.parties.defendant}
                </span>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-white/90">
                Verdict:{" "}
                <span
                  className={`${
                    winLabel === "Dismissed"
                      ? "text-yellow-400"
                      : winLabel === "Plaintiff"
                      ? "text-cyan-300"
                      : "text-pink-300"
                  }`}
                >
                  {winLabel}
                </span>
              </div>
              <div className="text-muted-foreground text-xs">
                Total votes: {totalVotes}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5"></AccordionTrigger>

          <AccordionContent className="px-5">
            <div className="space-y-4">
              {/* Unified Voting Breakdown */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white/90 mb-2">
                  Voting Breakdown
                </div>

                {/* Plaintiff Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      Plaintiff ({c.parties.plaintiff}) — {plaintiffVotes} votes
                    </span>
                    <span>{c.judgePct}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Defendant Bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      Defendant ({c.parties.defendant}) — {defendantVotes} votes
                    </span>
                    <span>{c.communityPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-pink-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.communityPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-3">
                  {winLabel} wins with a combined {winPct}% majority.
                </p>
              </div>

              {/* Judges’ Comments */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white/90 mb-2">
                  Judges’ Comments
                </div>
                <ul className="space-y-2 text-sm">
                  {c.comments.map((cm, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-white/10 bg-white/5 p-3"
                    >
                      <span className="text-cyan-300 mr-2">{cm.handle}</span>
                      {cm.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Case Description */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white/90">
                  Case Description
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.description}
                </p>
                <Link
                  to={`/disputes?case=${c.id}`}
                  className="mt-3 inline-flex items-center text-xs text-cyan-300 hover:underline"
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" /> View on Disputes
                </Link>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
