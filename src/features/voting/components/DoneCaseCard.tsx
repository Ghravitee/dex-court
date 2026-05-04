/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { ExternalLink } from "lucide-react";
import { UserAvatar } from "../../../components/UserAvatar";
import { calculateVoteResults } from "../../../lib/voteCalculations";
import { UsernameWithAvatar } from "./UsernameWithAvatar";
import { formatDisplayName } from "../utils/formatting";
import { type DoneCaseCardProps } from "../types";

export const DoneCaseCard: React.FC<DoneCaseCardProps> = ({ c }) => {
  const voteResults = useMemo(() => {
    return calculateVoteResults(c);
  }, [c]);

  const totalCommunityVotes = useMemo(() => {
    return (
      (c.votesPerGroup?.communityTierOne?.total || 0) +
      (c.votesPerGroup?.communityTierTwo?.total || 0)
    );
  }, [c.votesPerGroup]);

  const totalVotes = useMemo(() => {
    return (c.votesPerGroup?.judges?.total || 0) + totalCommunityVotes;
  }, [c.votesPerGroup, totalCommunityVotes]);

  const isDismissedDueToNoVotes = useMemo(() => {
    return c.winner === "dismissed" && totalVotes === 0;
  }, [c.winner, totalVotes]);

  // Merge Tier 1 + Tier 2 into a single "Community" group, including dismiss.
  const communityVotes = useMemo(() => {
    const plaintiff =
      (c.votesPerGroup?.communityTierOne?.plaintiff || 0) +
      (c.votesPerGroup?.communityTierTwo?.plaintiff || 0);
    const defendant =
      (c.votesPerGroup?.communityTierOne?.defendant || 0) +
      (c.votesPerGroup?.communityTierTwo?.defendant || 0);
    const dismiss =
      (c.votesPerGroup?.communityTierOne?.dismiss || 0) +
      (c.votesPerGroup?.communityTierTwo?.dismiss || 0);
    const total = plaintiff + defendant + dismiss;

    // Each percentage is computed independently so dismiss votes don't get
    // silently folded into the defendant slice.
    const plaintiffPct = total > 0 ? Math.round((plaintiff / total) * 100) : 0;
    const defendantPct = total > 0 ? Math.round((defendant / total) * 100) : 0;
    const dismissPct = total > 0 ? 100 - plaintiffPct - defendantPct : 0;

    return {
      plaintiff,
      defendant,
      dismiss,
      total,
      plaintiffPct,
      defendantPct,
      dismissPct,
    };
  }, [c.votesPerGroup]);

  // Derive total dismiss votes across all groups for the summary row.
  const totalDismissVotes = useMemo(() => {
    return (c.votesPerGroup?.judges?.dismiss || 0) + communityVotes.dismiss;
  }, [c.votesPerGroup, communityVotes.dismiss]);

  // Plain-English verdict summary
  // Plain-English verdict summary
  const verdictSummary = useMemo(() => {
    if (isDismissedDueToNoVotes) return "Nobody voted, so the case was closed";
    if (c.winner === "dismissed")
      return "The case was closed without a clear winner";

    const judgesVoted = (c.votesPerGroup?.judges?.total || 0) > 0;
    const communityVoted = communityVotes.total > 0;

    if (!judgesVoted && !communityVoted) {
      return "The case was decided automatically — no one voted";
    }
    if (!judgesVoted) {
      return `Only community members voted — they sided with the ${c.winner}`;
    }
    if (!communityVoted) {
      return `Only judges voted — they sided with the ${c.winner}`;
    }

    const judgesPlaintiffPct = c.percentagesPerGroup?.judges?.plaintiff || 0;
    const judgesFavor = judgesPlaintiffPct >= 50 ? "plaintiff" : "defendant";
    const communityFavor =
      communityVotes.plaintiffPct >= 50 ? "plaintiff" : "defendant";

    if (judgesFavor === communityFavor) {
      return `Both judges and community members agreed — the ${c.winner} wins`;
    }
    return `Judges overruled the community — the ${c.winner} wins`;
  }, [
    c.winner,
    isDismissedDueToNoVotes,
    c.percentagesPerGroup,
    c.votesPerGroup,
    communityVotes,
  ]);

  // Judges' per-outcome percentages — each computed independently from the API.
  const judgesPlaintiffPct = c.percentagesPerGroup?.judges?.plaintiff || 0;
  const judgesDefendantPct = c.percentagesPerGroup?.judges?.defendant || 0;
  const judgesDismissPct = c.percentagesPerGroup?.judges?.dismiss || 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10">
      <Accordion type="single" collapsible>
        <AccordionItem value="case">
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <div>
              <Link
                to={`/disputes/${c.id}`}
                className="inline-flex items-center hover:underline"
                prefetch="intent"
              >
                <h2 className="font-semibold text-white/90">{c.title}</h2>
              </Link>

              <div className="text-muted-foreground my-4 flex flex-col items-center gap-2 text-xs sm:flex-row">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-400">Plaintiff: </span>
                  <UsernameWithAvatar
                    username={c.parties.plaintiff}
                    avatarId={c.parties.plaintiffAvatar || null}
                    userId={c.parties.plaintiffId}
                  />
                </div>
                vs{" "}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-yellow-400">
                    Defendant:{" "}
                  </span>
                  <UsernameWithAvatar
                    username={c.parties.defendant}
                    avatarId={c.parties.defendantAvatar || null}
                    userId={c.parties.defendantId}
                  />
                </div>
              </div>
            </div>

            <div className="text-right text-sm">
              <div className="text-white/90">
                Verdict:{" "}
                <span
                  className={`font-semibold ${
                    c.winner === "dismissed"
                      ? "text-slate-400"
                      : c.winner === "plaintiff"
                        ? "text-blue-400"
                        : "text-yellow-400"
                  }`}
                >
                  {c.winner === "dismissed"
                    ? "Dismissed"
                    : c.winner === "plaintiff"
                      ? "Plaintiff"
                      : "Defendant"}
                </span>
              </div>
              <div className="text-muted-foreground text-xs">
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"} total
                {isDismissedDueToNoVotes && (
                  <div className="mt-1 text-xs text-slate-400">
                    No votes cast
                  </div>
                )}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5" />

          <AccordionContent className="mt-3 px-5">
            <div className="space-y-4">
              {/* ── Final Verdict ── */}
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-4 text-center">
                <div className="mb-2 text-sm tracking-wide text-emerald-200 uppercase">
                  Final Verdict
                </div>
                <div
                  className={`mb-2 text-2xl font-bold ${
                    c.winner === "plaintiff"
                      ? "text-blue-400"
                      : c.winner === "defendant"
                        ? "text-yellow-400"
                        : "text-slate-300"
                  }`}
                >
                  {c.winner === "plaintiff"
                    ? "Plaintiff Wins"
                    : c.winner === "defendant"
                      ? "Defendant Wins"
                      : "Case Dismissed"}
                </div>
                <div className="text-sm text-emerald-200">{verdictSummary}</div>
              </div>

              {/* ── Voting Breakdown ── */}
              {!isDismissedDueToNoVotes && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 text-sm font-medium text-white/90">
                    How people voted
                  </div>

                  {/* Color legend */}
                  <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
                      <span className="text-blue-300">Plaintiff</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-yellow-500" />
                      <span className="text-yellow-300">Defendant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-slate-500" />
                      <span className="text-slate-400">Dismissed</span>
                    </div>
                  </div>

                  {/* ── Judges bar ── */}
                  {c.votesPerGroup?.judges && (
                    <div className="mb-5">
                      <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                        <span className="font-medium">
                          ⚖️ Judges
                          <span className="ml-1 text-white/40">
                            ({c.votesPerGroup.judges.total}{" "}
                            {c.votesPerGroup.judges.total === 1
                              ? "vote"
                              : "votes"}
                            )
                          </span>
                        </span>
                      </div>

                      {/* 3-segment flex bar: Plaintiff | Dismiss | Defendant */}
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${judgesPlaintiffPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                        <motion.div
                          className="h-full bg-slate-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${judgesDismissPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.1,
                          }}
                        />
                        <motion.div
                          className="h-full bg-yellow-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${judgesDefendantPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.2,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px]">
                        <span className="text-blue-300">
                          {c.votesPerGroup.judges.plaintiff} Plaintiff
                        </span>
                        {(c.votesPerGroup.judges.dismiss || 0) > 0 && (
                          <span className="text-slate-400">
                            {c.votesPerGroup.judges.dismiss} Dismissed
                          </span>
                        )}
                        <span className="text-yellow-300">
                          {c.votesPerGroup.judges.defendant} Defendant
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── Community bar (Tier 1 + Tier 2 merged) ── */}
                  {communityVotes.total > 0 && (
                    <div className="mb-5">
                      <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                        <span className="font-medium">
                          👥 Community Members
                          <span className="ml-1 text-white/40">
                            ({communityVotes.total}{" "}
                            {communityVotes.total === 1 ? "vote" : "votes"})
                          </span>
                        </span>
                      </div>

                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-blue-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${communityVotes.plaintiffPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.15,
                          }}
                        />
                        <motion.div
                          className="h-full bg-slate-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${communityVotes.dismissPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.25,
                          }}
                        />
                        <motion.div
                          className="h-full bg-yellow-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${communityVotes.defendantPct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.35,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px]">
                        <span className="text-blue-300">
                          {communityVotes.plaintiff} Plaintiff
                        </span>
                        {communityVotes.dismiss > 0 && (
                          <span className="text-slate-400">
                            {communityVotes.dismiss} Dismissed
                          </span>
                        )}
                        <span className="text-yellow-300">
                          {communityVotes.defendant} Defendant
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total summary row */}
                  <div className="mt-2 rounded-md bg-white/5 px-3 py-2 text-xs text-white/60">
                    Total:{" "}
                    <span className="font-medium text-blue-300">
                      {voteResults.plaintiffVotes} Plaintiff
                    </span>
                    {" · "}
                    <span className="font-medium text-yellow-300">
                      {voteResults.defendantVotes} Defendant
                    </span>
                    {totalDismissVotes > 0 && (
                      <>
                        {" · "}
                        <span className="font-medium text-slate-400">
                          {totalDismissVotes} Dismissed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Judges' Comments ── */}
              {c.comments && c.comments.length > 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 text-sm font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <div className="space-y-2 text-sm">
                    {c.comments.map((comment: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            userId={String(comment.accountId ?? "")}
                            avatarId={comment.avatarId || null}
                            username={comment.handle || comment.username || ""}
                            size="sm"
                          />
                          <div className="text-sm font-medium text-blue-300">
                            {formatDisplayName(comment.handle)}
                          </div>
                        </div>
                        <div className="mt-2 text-white/80">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    No judges' comments were provided for this case.
                  </p>
                </div>
              )}

              {/* ── Case Description ── */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white/90">
                  Case Description
                </div>
                <p className="text-muted-foreground mt-1 text-sm break-all">
                  {c.description}
                </p>
                <Link
                  to={`/disputes/${c.id}`}
                  className="mt-3 inline-flex items-center text-xs text-blue-300 hover:underline"
                  prefetch="intent"
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" /> View on Disputes
                </Link>
              </div>

              {/* ── Dev-only debug panel ── */}
              {process.env.NODE_ENV === "development" && (
                <div className="rounded-lg border border-gray-400/30 bg-gray-500/10 p-3">
                  <div className="text-xs text-gray-300">
                    <strong>API Data:</strong>
                    <br />
                    <strong>Weighted:</strong> {JSON.stringify(c.weighted)}
                    <br />
                    <strong>Result Code:</strong> {c.rawData?.result}
                    <br />
                    <strong>Total Votes:</strong> {c.rawData?.totalVotes}
                    <br />
                    <strong>Judges Votes:</strong>{" "}
                    {JSON.stringify(c.votesPerGroup?.judges)}
                    <br />
                    <strong>Community Tier 1:</strong>{" "}
                    {JSON.stringify(c.votesPerGroup?.communityTierOne)}
                    <br />
                    <strong>Community Tier 2:</strong>{" "}
                    {JSON.stringify(c.votesPerGroup?.communityTierTwo)}
                    <br />
                    <strong>Judges %:</strong>{" "}
                    {JSON.stringify(c.percentagesPerGroup?.judges)}
                    <br />
                    <strong>Community %:</strong>{" "}
                    {JSON.stringify({
                      tierOne: c.percentagesPerGroup?.communityTierOne,
                      tierTwo: c.percentagesPerGroup?.communityTierTwo,
                    })}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const MemoizedDoneCaseCard = React.memo(DoneCaseCard);
