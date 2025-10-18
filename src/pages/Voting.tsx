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
    [t0],
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
        judgeVotes: 8,
        communityVotes: 95,
        judgePct: 45, // 55% voted to dismiss
        communityPct: 47, // 53% voted to dismiss
        comments: [
          { handle: "@judgeKai", text: "Insufficient grounds; dismiss." },
          {
            handle: "@judgeNova",
            text: "Contract terms were unclear from the start.",
          },
        ],
      },
      {
        id: "D-205",
        title: "Payment dispute with mixed outcome",
        parties: { plaintiff: "@0xAlpha", defendant: "@0xBeta" },
        description: "Complex payment terms led to confusion.",
        winner: "defendant",
        judgeVotes: 12,
        communityVotes: 150,
        judgePct: 35, // 65% for defendant
        communityPct: 42, // 58% for defendant
        comments: [
          {
            handle: "@judgeOrion",
            text: "Defendant followed the agreed terms.",
          },
        ],
      },
    ],
    [],
  );

  const [tab, setTab] = useState<"live" | "done">("live");
  const [, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative space-y-6">
      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl" />

      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90">Voting Hub</h2>
        {/* <div className="text-xs text-muted-foreground">
          Connected as:{" "}
          <span className="text-cyan-300 font-medium">{currentUser}</span>
        </div> */}
      </header>

      {/* Custom Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit rounded-md bg-white/5 p-1">
          <button
            onClick={() => setTab("live")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              tab === "live"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-muted-foreground hover:text-white/80"
            }`}
          >
            LIVE
          </button>
          <button
            onClick={() => setTab("done")}
            className={`rounded-md px-4 py-1.5 text-sm transition ${
              tab === "done"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-muted-foreground hover:text-white/80"
            }`}
          >
            CONCLUDED
          </button>
        </div>
        {/* Color Legend */}
        <div className="flex items-center gap-4 text-xs text-white/70">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-cyan-400/80" />
            <span>Plaintiff</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-pink-400/80" />
            <span>Defendant</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <span>Dismissed</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto mt-4 grid max-w-[1050px] grid-flow-row-dense grid-cols-1 items-start gap-6 lg:grid-cols-2">
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
  const [choice, setChoice] = useState<
    "plaintiff" | "defendant" | "dismissed" | null
  >(null);

  const [comment, setComment] = useState("");
  const remain = Math.max(0, c.endsAt - now());

  const isJudge = c.participants.some(
    (p) => p.handle === currentUser && p.role === "judge",
  );

  return (
    <div className="relative rounded-xl border border-white/10 p-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4">
            <div>
              <div className="font-semibold text-white/90">{c.title}</div>
              <div className="text-muted-foreground text-xs">
                <span className="font-medium text-cyan-300">
                  Plaintiff: {c.parties.plaintiff}
                </span>{" "}
                vs{" "}
                <span className="font-medium text-pink-300">
                  Defendant: {c.parties.defendant}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground mb-1 flex items-center justify-end gap-2 text-xl">
                <Clock className="h-5 w-5 text-cyan-300" /> Voting ends
              </div>
              <div className="font-mono text-lg text-cyan-300">
                {fmtRemain(remain)}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5" />

          <AccordionContent className="mt-3 px-5">
            <div className="space-y-3">
              <Link
                to={`/disputes?case=${c.id}`}
                className="inline-flex items-center text-xs text-cyan-300 hover:underline"
              >
                <ExternalLink className="mr-1 h-5 w-5" />
                <span className="mt-1">Details</span>
              </Link>

              {/* Voting Options */}
              {/* Voting Section */}
              <div className="mt-2">
                <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">
                  Who is your vote for?
                </h4>

                <div className="grid grid-cols-3 gap-3">
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
                  <span className="text-muted-foreground text-sm">
                    Comment{" "}
                    {isJudge && <span className="text-xs">(max 1200)</span>}
                  </span>
                  {!isJudge && (
                    <span className="text-muted-foreground text-xs">
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
                  <div className="text-muted-foreground mt-1 text-right text-[10px]">
                    {1200 - comment.length} characters left
                  </div>
                )}
              </div>

              {/* Vote Button + Info */}
              <div className="mt-3 flex items-center justify-between gap-3">
                <Button
                  variant="neon"
                  className="neon-hover"
                  disabled={!choice}
                >
                  Cast Vote
                </Button>

                <div className="group relative cursor-pointer">
                  <Info className="h-4 w-4 text-cyan-300/70 transition group-hover:text-cyan-300" />
                  <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                    Your vote remains private until the voting period ends.
                    During this time, only your participation status (“voted”)
                    is visible — not your decision.
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="mt-2 h-fit max-h-[30rem] overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4">
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
                        <span className="text-muted-foreground text-xs">
                          ({p.role})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground mt-3 text-xs">
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
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-5 text-center text-xs shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-transform hover:bg-cyan-500/30 active:scale-[0.98] ${
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
  // Weighted Voting Logic (DexCourt 70/30 model)
  const totalVotes = c.judgeVotes + c.communityVotes;

  // Judges hold 70% weight, community 30%
  const judgeWeight = 0.7;
  const communityWeight = 0.3;

  // Each side's percentage from its group
  const plaintiffJudgePct = c.judgePct; // % of judges who voted for plaintiff
  const plaintiffCommunityPct = c.communityPct; // % of community who voted for plaintiff

  // Calculate dismiss votes based on the winner
  const getDismissVotes = () => {
    if (c.winner === "dismissed") {
      // If case was dismissed, calculate dismiss votes from both groups
      const judgeDismissVotes = Math.round(
        ((100 - c.judgePct) / 100) * c.judgeVotes,
      );
      const communityDismissVotes = Math.round(
        ((100 - c.communityPct) / 100) * c.communityVotes,
      );
      return judgeDismissVotes + communityDismissVotes;
    } else {
      // For non-dismissed cases, calculate dismiss votes as the minority votes
      const plaintiffVotes =
        Math.round((c.judgePct / 100) * c.judgeVotes) +
        Math.round((c.communityPct / 100) * c.communityVotes);
      const defendantVotes = totalVotes - plaintiffVotes;
      return totalVotes - plaintiffVotes - defendantVotes;
    }
  };

  const dismissVotes = getDismissVotes();

  // Weighted overall percentage for plaintiff
  const weightedPlaintiffPct =
    plaintiffJudgePct * judgeWeight + plaintiffCommunityPct * communityWeight;

  // Defendant percentage is the remainder (excluding dismiss votes)
  const weightedDefendantPct = 100 - weightedPlaintiffPct;

  // Approximate actual votes (excluding dismiss votes)
  const effectiveTotalVotes = totalVotes - dismissVotes;
  const plaintiffVotes = Math.round(
    (effectiveTotalVotes * weightedPlaintiffPct) / 100,
  );
  const defendantVotes = effectiveTotalVotes - plaintiffVotes;

  // Determine winner
  const winLabel =
    c.winner === "dismissed"
      ? "Dismissed"
      : weightedPlaintiffPct > 50
        ? "Plaintiff"
        : "Defendant";

  // Combined weighted win percentage
  const winPct = Math.round(
    Math.max(weightedPlaintiffPct, weightedDefendantPct),
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10">
      <Accordion type="single" collapsible>
        <AccordionItem value="case">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <div>
              <div className="font-semibold text-white/90">{c.title}</div>
              <div className="text-muted-foreground text-xs">
                <span className="font-medium text-cyan-300">
                  Plaintiff: {c.parties.plaintiff}
                </span>{" "}
                vs{" "}
                <span className="font-medium text-pink-300">
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
                {dismissVotes > 0 && (
                  <div className="text-yellow-400">
                    Dismiss: {dismissVotes} votes
                  </div>
                )}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5"></AccordionTrigger>

          <AccordionContent className="mt-3 px-5">
            <div className="space-y-4">
              {/* Voting Breakdown */}
              <div className="glass rounded-lg border border-cyan-400/30 bg-white/5 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                <div className="mb-2 text-sm font-medium text-white/90">
                  Voting Breakdown
                </div>

                {/* Dismiss Votes Display */}
                {dismissVotes > 0 && (
                  <div className="mb-4 rounded-md border border-yellow-400/30 bg-yellow-500/10 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-yellow-300">
                        Dismiss Case
                      </span>
                      <span className="font-mono text-yellow-300">
                        {dismissVotes} votes
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-yellow-200/80">
                      {Math.round((dismissVotes / totalVotes) * 100)}% of total
                      votes
                    </div>
                  </div>
                )}

                {/* Judges Section */}
                <div className="mb-3">
                  <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                    <span>Judges — {c.judgeVotes} votes</span>
                    <span>{c.judgePct}% favor Plaintiff</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-800"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - c.judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>

                  <div className="mt-1 flex justify-between text-[11px]">
                    <span className="text-cyan-300">
                      Plaintiff: {Math.round((c.judgePct / 100) * c.judgeVotes)}{" "}
                      votes
                    </span>
                    <span className="text-pink-300">
                      Defendant:{" "}
                      {Math.round(((100 - c.judgePct) / 100) * c.judgeVotes)}{" "}
                      votes
                    </span>
                  </div>
                </div>

                {/* Community Section */}
                <div className="mb-4">
                  <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                    <span>Community — {c.communityVotes} votes</span>
                    <span>{c.communityPct}% favor Plaintiff</span>
                  </div>

                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.communityPct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-300/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - c.communityPct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    />
                  </div>

                  <div className="mt-1 flex justify-between text-[11px]">
                    <span className="text-cyan-300">
                      Plaintiff:{" "}
                      {Math.round((c.communityPct / 100) * c.communityVotes)}{" "}
                      votes
                    </span>
                    <span className="text-pink-300">
                      Defendant:{" "}
                      {Math.round(
                        ((100 - c.communityPct) / 100) * c.communityVotes,
                      )}{" "}
                      votes
                    </span>
                  </div>
                </div>

                {/* Weighted Overall Section */}
                <div>
                  <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                    <span>Weighted Total (70% Judges, 30% Community)</span>
                    <span>
                      {weightedPlaintiffPct.toFixed(1)}% favor Plaintiff
                    </span>
                  </div>

                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${weightedPlaintiffPct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-400/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${weightedDefendantPct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    />
                  </div>

                  <div className="mt-1 flex justify-between text-[11px]">
                    <span className="text-cyan-300">
                      Plaintiff: {plaintiffVotes} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant: {defendantVotes} votes
                    </span>
                  </div>
                </div>

                {/* Final Verdict */}
                <div className="mt-4 rounded-md border border-cyan-400/30 bg-cyan-500/10 p-3">
                  <div className="text-center text-sm font-medium text-cyan-200">
                    Final Verdict:{" "}
                    <span className="text-lg font-bold">{winLabel}</span>
                  </div>
                  <div className="text-muted-foreground mt-1 text-center text-xs">
                    {winLabel === "Dismissed"
                      ? "Case dismissed with no winner"
                      : `${winLabel} wins with ${winPct}% weighted majority`}
                  </div>
                </div>
              </div>

              {/* Judges' Comments */}
              <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                <div className="mb-2 text-sm font-medium text-white/90">
                  Judges' Comments
                </div>
                <ul className="space-y-2 text-sm">
                  {c.comments.map((cm, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-white/10 bg-white/5 p-3"
                    >
                      <span className="mr-2 text-cyan-300">{cm.handle}</span>
                      {cm.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Case Description */}
              <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                <div className="text-sm font-medium text-white/90">
                  Case Description
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
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
