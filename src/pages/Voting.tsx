import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Clock,
  ExternalLink,
  // MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Minus,
} from "lucide-react";
import { Switch } from "../components/ui/switch";
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
  const [judgeMode, setJudgeMode] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white/90">Voting Hub</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Judge Mode</span>
            <Switch checked={judgeMode} onCheckedChange={setJudgeMode} />
          </div>
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
        <div className="mt-4 space-y-4">
          {tab === "live" &&
            live.map((c) => (
              <LiveCaseCard key={c.id} c={c} judgeMode={judgeMode} />
            ))}

          {tab === "done" &&
            concluded.map((c) => <DoneCaseCard key={c.id} c={c} />)}
        </div>
      </div>
    </div>
  );
}

function LiveCaseCard({ c, judgeMode }: { c: LiveCase; judgeMode: boolean }) {
  const [choice, setChoice] = useState<"plaintiff" | "defendant" | "dismissed">(
    "plaintiff"
  );
  const [comment, setComment] = useState("");
  const remain = Math.max(0, c.endsAt - now());

  return (
    <div className="glass ring-1 ring-white/10 p-0 mx-w-[40rem] mx-auto">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 justify-between px-5 pt-4">
            <div>
              <div className="text-sm text-muted-foreground">{c.id}</div>
              <div className="text-white/90 font-semibold">{c.title}</div>
              <div className="text-xs text-muted-foreground">
                {c.parties.plaintiff} vs {c.parties.defendant}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-muted-foreground flex items-center justify-end gap-2">
                <Clock className="h-5 w-5 text-cyan-300" /> Voting ends
              </div>
              <div className="font-mono text-sm text-cyan-300">
                {fmtRemain(remain)}
              </div>
            </div>
          </div>
          <AccordionTrigger className="px-5"></AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/disputes?case=${c.id}`}
                    className="inline-flex items-center text-xs text-cyan-300 hover:underline"
                  >
                    <ExternalLink className="mr-1 h-5 w-5" />
                    <span className="mt-1"> Details</span>
                  </Link>
                </div>
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    Who is your vote for?
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <VoteOption
                      label={`Plaintiff (${c.parties.plaintiff})`}
                      icon={<ThumbsUp className="h-4 w-4" />}
                      active={choice === "plaintiff"}
                      onClick={() => setChoice("plaintiff")}
                    />
                    <VoteOption
                      label={`Defendant (${c.parties.defendant})`}
                      icon={<ThumbsDown className="h-4 w-4" />}
                      active={choice === "defendant"}
                      onClick={() => setChoice("defendant")}
                    />
                    <VoteOption
                      label="Dismiss Case"
                      icon={<Minus className="h-4 w-4" />}
                      active={choice === "dismissed"}
                      onClick={() => setChoice("dismissed")}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Comment{" "}
                      {judgeMode ? (
                        <span className="text-xs text-muted-foreground">
                          (max 1200)
                        </span>
                      ) : null}
                    </span>
                    {!judgeMode && (
                      <span className="text-xs text-muted-foreground">
                        Only judges can comment
                      </span>
                    )}
                  </div>
                  <textarea
                    disabled={!judgeMode}
                    value={comment}
                    onChange={(e) =>
                      e.target.value.length <= 1200 &&
                      setComment(e.target.value)
                    }
                    className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-cyan-400/40 disabled:opacity-60"
                    placeholder={
                      judgeMode
                        ? "Add your reasoning..."
                        : "Comments restricted to judges"
                    }
                  />
                  {judgeMode && (
                    <div className="mt-1 text-right text-[10px] text-muted-foreground">
                      {1200 - comment.length} characters left
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant="neon" className="neon-hover">
                          Cast Vote
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Your vote remains private until the voting period ends.
                      During this time, only your participation status (“voted”)
                      is visible — not your decision. This ensures fairness and
                      prevents bias or influence during active voting.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-medium text-white/90">
                  Participants
                </div>
                <ul className="space-y-2 text-sm">
                  {c.participants.map((p, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-foreground/90">
                        {p.handle}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({p.role})
                        </span>
                      </span>
                      {/* {p.commented && (
                        <MessageSquare
                          className="h-4 w-4 text-cyan-300"
                          title="Comment added"
                        />
                      )} */}
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
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-center text-xs transition ${
        active
          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
          : "border-white/10 bg-white/5 hover:border-cyan-400/30"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function DoneCaseCard({ c }: { c: DoneCase }) {
  const totalVotes = c.judgeVotes + c.communityVotes;
  const winLabel =
    c.winner === "plaintiff"
      ? "Plaintiff"
      : c.winner === "defendant"
      ? "Defendant"
      : "Dismissed";
  const winPct = Math.round(c.judgePct * 0.7 + c.communityPct * 0.3);
  return (
    <div className="glass ring-1 ring-white/10 p-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="i">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <div>
              <div className="text-white/90 font-semibold">{c.title}</div>
              <div className="text-xs text-muted-foreground">
                {c.parties.plaintiff} vs {c.parties.defendant}
              </div>
            </div>
            <div className="text-right">
              <div className=" text-white/90">
                Winner: <span className="text-cyan-300">{winLabel}</span>
              </div>
              <div className="text-muted-foreground">
                Judges {c.judgePct}% • Community {c.communityPct}% • Combined{" "}
                {winPct}%
              </div>
              <div className="text-muted-foreground">
                Judges voted: {c.judgeVotes} • Community votes:{" "}
                {c.communityVotes} • Total: {totalVotes}
              </div>
            </div>
          </div>
          <AccordionTrigger className="px-5"></AccordionTrigger>
          <AccordionContent className="px-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/90">
                    Verdict
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {winLabel} wins with a combined {winPct}% majority.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/90">
                    Comments from Judges
                  </div>
                  <ul className="mt-2 space-y-2 text-sm">
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
              </div>
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
