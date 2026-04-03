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
import { UserAvatar } from "@/components/UserAvatar";
import { calculateVoteResults } from "@/lib/voteCalculations";
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

  const weightedPercentages = useMemo(() => {
    const judgeWeight = 0.7;
    const communityWeight = 0.3;

    const judgePlaintiffPct = c.percentagesPerGroup?.judges?.plaintiff || 0;
    const communityPlaintiffPct =
      ((c.percentagesPerGroup?.communityTierOne?.plaintiff || 0) +
        (c.percentagesPerGroup?.communityTierTwo?.plaintiff || 0)) /
      2;

    const weightedPlaintiffPct =
      judgePlaintiffPct * judgeWeight + communityPlaintiffPct * communityWeight;
    const weightedDefendantPct = 100 - weightedPlaintiffPct;

    return {
      plaintiff: weightedPlaintiffPct,
      defendant: weightedDefendantPct,
    };
  }, [c.percentagesPerGroup]);

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
                  <span className="font-medium text-cyan-300">Plaintiff: </span>{" "}
                  <UsernameWithAvatar
                    username={c.parties.plaintiff}
                    avatarId={c.parties.plaintiffAvatar || null}
                    userId={c.parties.plaintiffId}
                  />
                </div>
                vs{" "}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-pink-300">Defendant: </span>
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
                  className={`${
                    c.winner === "dismissed"
                      ? "text-yellow-400"
                      : c.winner === "plaintiff"
                        ? "text-cyan-300"
                        : "text-pink-300"
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
                Total votes: {totalVotes}
                {isDismissedDueToNoVotes && (
                  <div className="mt-1 text-xs text-yellow-400">
                    No votes cast
                  </div>
                )}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5"></AccordionTrigger>

          <AccordionContent className="mt-3 px-5">
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-4 text-center">
                <div className="mb-2 text-lg text-emerald-200">
                  Final Verdict
                </div>
                <div
                  className={`mb-2 text-2xl font-bold ${
                    c.winner === "plaintiff"
                      ? "text-cyan-300"
                      : c.winner === "defendant"
                        ? "text-pink-300"
                        : "text-yellow-300"
                  }`}
                >
                  {c.winner === "plaintiff"
                    ? "Plaintiff Wins"
                    : c.winner === "defendant"
                      ? "Defendant Wins"
                      : "Case Dismissed"}
                </div>
                <div className="text-emerald-200">
                  {isDismissedDueToNoVotes
                    ? "No votes were cast during the voting period"
                    : `${Math.round(weightedPercentages.plaintiff)}% weighted majority`}
                </div>
              </div>

              {!isDismissedDueToNoVotes && (
                <div className="glass rounded-lg border border-cyan-400/30 bg-white/5 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                  <div className="mb-2 text-sm font-medium text-white/90">
                    Voting Breakdown
                  </div>

                  {c.votesPerGroup?.judges && (
                    <div className="mb-4">
                      <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                        <span>
                          Judges — {c.votesPerGroup.judges.total} votes
                        </span>
                        <span>
                          {c.percentagesPerGroup?.judges?.plaintiff || 0}% favor
                          Plaintiff
                        </span>
                      </div>

                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-800"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${c.percentagesPerGroup?.judges?.plaintiff || 0}%`,
                          }}
                          transition={{
                            duration: 1,
                            ease: "easeOut",
                            delay: 0,
                          }}
                        />
                        <motion.div
                          className="absolute top-0 right-0 h-full rounded-r-full bg-pink-600"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${c.percentagesPerGroup?.judges?.defendant || 0}%`,
                          }}
                          transition={{
                            duration: 1,
                            ease: "easeOut",
                            delay: 0,
                          }}
                        />
                      </div>

                      <div className="mt-1 flex justify-between text-[11px]">
                        <span className="text-cyan-300">
                          Plaintiff: {c.votesPerGroup.judges.plaintiff} votes
                        </span>
                        <span className="text-pink-300">
                          Defendant: {c.votesPerGroup.judges.defendant} votes
                        </span>
                      </div>
                    </div>
                  )}

                  {c.votesPerGroup?.communityTierOne &&
                    c.votesPerGroup.communityTierOne.total > 0 && (
                      <div className="mb-4">
                        <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                          <span>
                            Community Tier 1 —{" "}
                            {c.votesPerGroup.communityTierOne.total} votes
                          </span>
                          <span>
                            {c.percentagesPerGroup?.communityTierOne
                              ?.plaintiff || 0}
                            % favor Plaintiff
                          </span>
                        </div>

                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-300"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${c.percentagesPerGroup?.communityTierOne?.plaintiff || 0}%`,
                            }}
                            transition={{
                              duration: 1,
                              ease: "easeOut",
                              delay: 0.2,
                            }}
                          />
                          <motion.div
                            className="absolute top-0 right-0 h-full rounded-r-full bg-pink-300/60"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${c.percentagesPerGroup?.communityTierOne?.defendant || 0}%`,
                            }}
                            transition={{
                              duration: 1,
                              ease: "easeOut",
                              delay: 0.2,
                            }}
                          />
                        </div>

                        <div className="mt-1 flex justify-between text-[11px]">
                          <span className="text-cyan-300">
                            Plaintiff:{" "}
                            {c.votesPerGroup.communityTierOne.plaintiff} votes
                          </span>
                          <span className="text-pink-300">
                            Defendant:{" "}
                            {c.votesPerGroup.communityTierOne.defendant} votes
                          </span>
                        </div>
                      </div>
                    )}

                  {c.votesPerGroup?.communityTierTwo &&
                    c.votesPerGroup.communityTierTwo.total > 0 && (
                      <div className="mb-4">
                        <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                          <span>
                            Community Tier 2 —{" "}
                            {c.votesPerGroup.communityTierTwo.total} votes
                          </span>
                          <span>
                            {c.percentagesPerGroup?.communityTierTwo
                              ?.plaintiff || 0}
                            % favor Plaintiff
                          </span>
                        </div>

                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-200"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${c.percentagesPerGroup?.communityTierTwo?.plaintiff || 0}%`,
                            }}
                            transition={{
                              duration: 1,
                              ease: "easeOut",
                              delay: 0.3,
                            }}
                          />
                          <motion.div
                            className="absolute top-0 right-0 h-full rounded-r-full bg-pink-200/60"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${c.percentagesPerGroup?.communityTierTwo?.defendant || 0}%`,
                            }}
                            transition={{
                              duration: 1,
                              ease: "easeOut",
                              delay: 0.3,
                            }}
                          />
                        </div>

                        <div className="mt-1 flex justify-between text-[11px]">
                          <span className="text-cyan-300">
                            Plaintiff:{" "}
                            {c.votesPerGroup.communityTierTwo.plaintiff} votes
                          </span>
                          <span className="text-pink-300">
                            Defendant:{" "}
                            {c.votesPerGroup.communityTierTwo.defendant} votes
                          </span>
                        </div>
                      </div>
                    )}

                  <div>
                    <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                      <span>Weighted Total (70% Judges, 30% Community)</span>
                      <span>
                        {weightedPercentages.plaintiff.toFixed(1)}% favor
                        Plaintiff
                      </span>
                    </div>

                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${weightedPercentages.plaintiff}%` }}
                        transition={{
                          duration: 1,
                          ease: "easeOut",
                          delay: 0.5,
                        }}
                      />
                      <motion.div
                        className="absolute top-0 right-0 h-full rounded-r-full bg-pink-400/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${weightedPercentages.defendant}%` }}
                        transition={{
                          duration: 1,
                          ease: "easeOut",
                          delay: 0.5,
                        }}
                      />
                    </div>

                    <div className="mt-1 flex justify-between text-[11px]">
                      <span className="text-cyan-300">
                        Plaintiff: {voteResults.plaintiffVotes} votes
                      </span>
                      <span className="text-pink-300">
                        Defendant: {voteResults.defendantVotes} votes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {c.comments && c.comments.length > 0 ? (
                <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
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
                            userId={comment.handle.replace("@", "")}
                            avatarId={comment.avatarId || null}
                            username={comment.handle}
                            size="sm"
                          />
                          <div className="text-sm font-medium text-cyan-300">
                            {formatDisplayName(comment.handle)}
                          </div>
                        </div>
                        <div className="mt-2 text-white/80">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                  <div className="text-sm font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    No judges' comments were provided for this case.
                  </p>
                </div>
              )}

              <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                <div className="text-sm font-medium text-white/90">
                  Case Description
                </div>
                <p className="text-muted-foreground mt-1 text-sm break-all">
                  {c.description}
                </p>
                <Link
                  to={`/disputes/${c.id}`}
                  className="mt-3 inline-flex items-center text-xs text-cyan-300 hover:underline"
                  prefetch="intent"
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" /> View on Disputes
                </Link>
              </div>

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
