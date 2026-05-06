/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { Info, Loader2, Clock, ExternalLink, Vote, Shield } from "lucide-react";
import { toast } from "sonner";
import { disputeService } from "../../../services/disputeServices";
import { agreementService } from "../../../services/agreementServices";
import { getAgreement } from "../../../web3/readContract";
import { useVotingStatus } from "../hooks/useVotingStatus";
import { UsernameWithAvatar } from "./UsernameWithAvatar";
import { MemoizedVoteOption } from "./VoteOption";
import { fmtRemain } from "../utils/dateUtils";
import { type LiveCaseCardProps } from "../types";
import { AppLink } from "../../../components/AppLink";

export const LiveCaseCard: React.FC<LiveCaseCardProps> = ({
  c,
  currentTime,
  refetchLiveDisputes,
  isVoteStarted,
  isJudge = false,
}) => {
  const [choice, setChoice] = useState<
    "plaintiff" | "defendant" | "dismissed" | null
  >(null);
  const [comment, setComment] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [onChainAgreement, setOnChainAgreement] = useState<any | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [localVoted, setLocalVoted] = useState(false);

  const {
    hasVoted,
    canVote,
    reason,
    tier,
    weight,
    markAsVoted,
    isInitialCheck,
  } = useVotingStatus(parseInt(c.id), c.rawDispute);

  const remain = Math.max(0, c.endsAt - currentTime);
  const isExpired = remain <= 0;
  const formattedTime = fmtRemain(remain);
  const voteStarted = isVoteStarted(c.id);

  useEffect(() => {
    if (
      c.agreement?.type === 2 &&
      c.agreement.id &&
      c.contractAgreementId &&
      c.chainId
    ) {
      const agreementId = c.agreement.id;
      const chainId = c.chainId;
      const contractAgreementId = c.contractAgreementId;

      const fetchOnChainData = async () => {
        try {
          setOnChainLoading(true);
          const agreementData =
            await agreementService.getAgreementDetails(agreementId);
          const escrowAddress =
            agreementData.escrowContractAddress as `0x${string}`;
          if (escrowAddress) {
            const res = await getAgreement(
              escrowAddress,
              chainId,
              BigInt(contractAgreementId),
            );
            setOnChainAgreement(res);
          }
        } catch (err) {
          console.error("Failed to fetch on-chain agreement:", err);
          setOnChainAgreement(null);
        } finally {
          setOnChainLoading(false);
        }
      };

      fetchOnChainData();
    }
  }, [c.agreement?.type, c.agreement?.id, c.contractAgreementId, c.chainId]);

  const canStartOnChainVote = useMemo(() => {
    if (c.agreement?.type !== 2 || !onChainAgreement || onChainLoading) {
      return false;
    }
    return Number(onChainAgreement.voteStartedAt) === 0;
  }, [c.agreement?.type, onChainAgreement, onChainLoading]);

  const handleCastVote = useCallback(async () => {
    if (!choice) return;

    setIsVoting(true);
    let loadingToast: string | number | undefined;

    try {
      const disputeId = parseInt(c.id);
      if (isNaN(disputeId)) {
        toast.error("Invalid dispute ID");
        return;
      }

      loadingToast = toast.loading("Casting your vote...", {
        description: "Your vote is being securely submitted",
      });

      await disputeService.castVote(disputeId, {
        voteType: choice === "plaintiff" ? 1 : choice === "defendant" ? 2 : 3,
        comment: comment,
      });

      toast.dismiss(loadingToast);

      const voteAction =
        choice === "plaintiff"
          ? "Plaintiff"
          : choice === "defendant"
            ? "Defendant"
            : "Dismiss Case";

      toast.success("Vote Cast! ✅", {
        description: `You voted for ${voteAction}. Thank you for participating!`,
        duration: 4000,
      });

      // Set local state immediately so the UI reflects the voted status
      // without waiting for the server round-trip.
      setLocalVoted(true);
      markAsVoted();
      setChoice(null);
      setComment("");

      // Delay the list refetch so the server has time to persist the vote
      // before useVotingStatus re-runs on the refreshed card.
      //
      // Why this matters: refetchLiveDisputes() can remount the card component,
      // resetting localVoted to false. If the refetch fires before the server
      // has confirmed the vote, hasVoted also comes back false — making the
      // user appear un-voted even though they just voted successfully.
      // A 3-second buffer is enough for the API to settle in practice.
      setTimeout(refetchLiveDisputes, 3000);
    } catch (error: any) {
      console.error("❌ Vote failed:", error);

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      toast.error("Vote Submission Failed", {
        description:
          error.message || "Unable to submit vote. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsVoting(false);
    }
  }, [choice, comment, c.id, refetchLiveDisputes, markAsVoted]);

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length <= 1200) {
        setComment(e.target.value);
      }
    },
    [],
  );

  const votingInfo = useMemo(() => {
    if (!canVote) return null;

    const info = [];
    if (tier) info.push(`Tier ${tier}`);
    if (weight && weight > 1) info.push(`${weight}x weight`);

    return info.length > 0 ? `(${info.join(", ")})` : "";
  }, [canVote, tier, weight]);

  // localVoted handles the immediate post-vote UI; hasVoted takes over once
  // the component remounts after the delayed refetch and the server confirms.
  const voted = localVoted || hasVoted;

  return (
    <div
      className={`relative rounded-xl border p-0 ${
        isExpired ? "border-yellow-400/30 bg-yellow-500/5" : "border-white/10"
      }`}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <div className="flex flex-col justify-between px-4 pt-4 sm:flex-row sm:items-center">
            <div>
              <AppLink
                to={`/disputes/${c.id}`}
                className="inline-flex items-center hover:underline"
                prefetch="intent"
              >
                <h2 className="font-semibold text-white/90">{c.title}</h2>
              </AppLink>
              <div className="text-muted-foreground my-4 flex flex-col items-center gap-2 text-xs sm:flex-row">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-400">Plaintiff: </span>{" "}
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

              <div className="mt-1">
                {isInitialCheck ? (
                  <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-300">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Checking eligibility...
                  </span>
                ) : voted ? (
                  <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                    ✓ You have voted
                  </span>
                ) : canVote ? (
                  <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-300">
                    <Vote className="mr-1 h-3 w-3" />
                    Eligible to vote {votingInfo}
                  </span>
                ) : voteStarted ? (
                  <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-300">
                    <Shield className="mr-1 h-3 w-3" />
                    Not eligible to vote
                  </span>
                ) : c.agreement?.type === 1 ? (
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
                    <Clock className="mr-1 h-3 w-3" />
                    Reputational - Vote Now
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">
                    <Clock className="mr-1 h-3 w-3" />
                    Start Vote Required
                  </span>
                )}
                {c.agreement?.type && (
                  <span
                    className={`ml-2 inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${
                      c.agreement.type === 2
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        : "border-blue-400/30 bg-blue-500/10 text-blue-300"
                    }`}
                  >
                    {c.agreement.type === 2 ? "Escrow" : "Reputational"}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 flex items-center justify-end gap-2">
                <Clock
                  className={`mt-1 ml-10 size-3 lg:size-5 ${
                    isExpired ? "text-yellow-400" : "text-cyan-300"
                  }`}
                />
                <p className="text-muted-foreground text-sm sm:text-base">
                  {isExpired ? "Voting ended" : "Voting ends"}
                </p>
              </div>
              <div
                className={`font-mono text-lg ${
                  isExpired ? "text-yellow-400" : "text-cyan-300"
                }`}
              >
                {isExpired ? "00:00:00" : formattedTime}
              </div>
            </div>
          </div>

          <AccordionTrigger className="px-5" />

          <AccordionContent className="mt-3 px-5">
            <div className="space-y-3">
              <AppLink
                to={`/disputes/${c.id}`}
                className="inline-flex items-center text-xs text-cyan-300 hover:underline"
                prefetch="intent"
              >
                <ExternalLink className="mr-1 h-5 w-5" />
                <span className="mt-1">Details</span>
              </AppLink>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-2 text-sm font-medium text-white/90">
                  Case Description
                </div>
                <p className="text-sm text-white/80">{c.description}</p>
              </div>

              {!isExpired && c.agreement?.type === 2 && !voteStarted && (
                <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-300">
                        Start Voting Phase
                      </h4>
                      <p className="text-xs text-green-200">
                        Click to initiate escrow voting on-chain. Once started,
                        the 24-hour voting timer will begin.
                      </p>
                      {onChainAgreement && (
                        <div className="mt-1 text-xs">
                          <div className="text-green-300">
                            Status:{" "}
                            {canStartOnChainVote
                              ? "Ready to start"
                              : "Cannot start yet"}
                          </div>
                          {c.contractAgreementId && (
                            <div className="text-green-300/70">
                              Agreement ID: {c.contractAgreementId}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isExpired && c.agreement?.type === 1 && !voteStarted && (
                <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                      <Info className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-300">
                        Reputational Dispute
                      </h4>
                      <p className="text-xs text-blue-200">
                        Voting starts automatically. You can cast your vote now.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {voteStarted && isInitialCheck ? (
                <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-300">
                        Checking Eligibility
                      </h4>
                      <p className="text-xs text-blue-200">
                        Verifying your voting status...
                      </p>
                    </div>
                  </div>
                </div>
              ) : voteStarted && !canVote && reason ? (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                      <Info className="h-4 w-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-300">
                        Not Eligible to Vote
                      </h4>
                      <p className="text-xs text-amber-200">{reason}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {voteStarted && (
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-center">
                  <div className="text-sm text-cyan-300">
                    Vote counts are hidden during voting to maintain fairness
                  </div>
                  <div className="mt-1 text-xs text-cyan-200">
                    Results will be visible after voting ends
                  </div>
                </div>
              )}

              {!isExpired && voteStarted && !isInitialCheck && canVote && (
                <div className="mt-2">
                  <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">
                    {voted
                      ? "Your Vote Has Been Cast"
                      : isExpired
                        ? "Voting Completed"
                        : "Who is your vote for?"}
                  </h4>

                  {!voted && !isExpired && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <MemoizedVoteOption
                        label={`Plaintiff (${c.parties.plaintiff})`}
                        active={choice === "plaintiff"}
                        onClick={() => setChoice("plaintiff")}
                        choice={choice}
                        optionType="plaintiff"
                        disabled={isExpired}
                        username={c.parties.plaintiff}
                        avatarId={c.parties.plaintiffAvatar || null}
                        userId={c.parties.plaintiffId}
                        roleLabel="Plaintiff"
                      />
                      <MemoizedVoteOption
                        label={`Defendant (${c.parties.defendant})`}
                        active={choice === "defendant"}
                        onClick={() => setChoice("defendant")}
                        choice={choice}
                        optionType="defendant"
                        disabled={isExpired}
                        username={c.parties.defendant}
                        avatarId={c.parties.defendantAvatar || null}
                        userId={c.parties.defendantId}
                        roleLabel="Defendant"
                      />
                      <MemoizedVoteOption
                        label="Dismiss Case"
                        active={choice === "dismissed"}
                        onClick={() => setChoice("dismissed")}
                        choice={choice}
                        optionType="dismissed"
                        disabled={isExpired}
                      />
                    </div>
                  )}

                  {voted && (
                    <div className="rounded-md border border-green-400/30 bg-green-500/10 p-4 text-center">
                      <div className="mb-2 text-lg text-green-300">
                        ✓ Vote Submitted
                      </div>
                      <div className="text-sm text-green-200">
                        Thank you for participating! Your vote has been recorded
                        and will be counted when voting ends.
                      </div>
                    </div>
                  )}

                  {isExpired && !voted && (
                    <div className="mt-3 rounded-md border border-yellow-400/30 bg-yellow-500/10 p-3 text-center">
                      <div className="text-sm text-yellow-300">
                        Voting has ended. Results will be available soon.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!voted && !isExpired && voteStarted && canVote && isJudge && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cyan-300">
                        Add Comment
                      </span>
                      <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                        Judges Only
                      </span>
                    </div>
                    <span className="text-xs text-cyan-300/70">max 1200</span>
                  </div>

                  <textarea
                    disabled={isVoting}
                    value={comment}
                    onChange={handleCommentChange}
                    className="min-h-28 w-full rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/40 disabled:opacity-60"
                    placeholder="Share your judicial reasoning..."
                  />

                  <div className="mt-1 flex justify-between text-xs">
                    <div className="text-cyan-300/70">
                      ⚖️ Judicial comments help explain the verdict
                    </div>
                    <div className="text-cyan-200">
                      {1200 - comment.length} characters left
                    </div>
                  </div>
                </div>
              )}

              {!voted && !isExpired && voteStarted && canVote && !isJudge && (
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-cyan-300" />
                    <div>
                      <div className="text-sm text-cyan-200">
                        Comments are restricted to judges only
                      </div>
                      <div className="text-xs text-cyan-200/70">
                        Only judges can add comments to their votes
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!voted && !isExpired && voteStarted && canVote && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Button
                    variant="neon"
                    className="neon-hover"
                    disabled={!choice || isVoting}
                    onClick={handleCastVote}
                  >
                    {isVoting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Voting...
                      </>
                    ) : (
                      "Cast Vote"
                    )}
                  </Button>

                  <div className="group relative cursor-pointer">
                    <Info className="h-4 w-4 text-cyan-300/70 transition group-hover:text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      Your vote remains private until the voting period ends.
                      During this time, only your participation status ("voted")
                      is visible — not your decision.
                    </div>
                  </div>
                </div>
              )}

              {process.env.NODE_ENV === "development" && (
                <div className="rounded-lg border border-gray-400/30 bg-gray-500/10 p-3">
                  <div className="text-xs text-gray-300">
                    <strong>Debug Info:</strong>
                    <br />
                    Dispute ID: {c.id}
                    <br />
                    Can Vote: {canVote ? "Yes" : "No"}
                    <br />
                    Has Voted: {voted ? "Yes" : "No"}
                    <br />
                    Reason: {reason || "None"}
                    <br />
                    Tier: {tier || "None"}
                    <br />
                    Weight: {weight || "None"}
                    <br />
                    Agreement Type: {c.agreement?.type || "Unknown"}
                    <br />
                    Contract Agreement ID: {c.contractAgreementId || "None"}
                    <br />
                    Vote Started: {voteStarted ? "Yes" : "No"}
                    <br />
                    Can Start On-Chain: {canStartOnChainVote ? "Yes" : "No"}
                    <br />
                    Voting Ends: {new Date(c.endsAt).toLocaleString()}
                    <br />
                    Current Time: {new Date(currentTime).toLocaleString()}
                    <br />
                    Remaining: {remain}ms
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

export const MemoizedLiveCaseCard = React.memo(LiveCaseCard);
