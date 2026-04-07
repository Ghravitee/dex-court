/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Vote, Users, Clock } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { InfiniteMovingCardsWithAvatars } from "../../../components/ui/infinite-moving-cards-with-avatars";
import { fetchVoteInProgressDisputes } from "../../../services/disputeServices";
import { parseAPIDate, now } from "../utils/chartHelpers";
import { DottedSpinner } from "./DottedSpinner";
import { type LiveVotingItem } from "../types";

export const LiveVotingInfiniteCards = () => {
  const [liveDisputes, setLiveDisputes] = useState<LiveVotingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveVotingDisputes = async () => {
      try {
        setLoading(true);
        const response = await fetchVoteInProgressDisputes(); // Changed function call

        if (response?.results) {
          const transformedDisputes = response.results.map((dispute: any) => {
            const base = dispute.voteStartedAt
              ? parseAPIDate(dispute.voteStartedAt)
              : parseAPIDate(dispute.createdAt);
            const endsAt = base + 24 * 60 * 60 * 1000;
            const remain = Math.max(0, endsAt - now());
            const daysLeft = Math.ceil(remain / (24 * 60 * 60 * 1000));

            return {
              id: dispute.id.toString(),
              quote:
                dispute.claim ||
                dispute.description ||
                `Dispute: ${dispute.title}`,
              name: `${dispute.parties?.plaintiff?.username || "@plaintiff"} vs ${dispute.parties?.defendant?.username || "@defendant"}`,
              title: `Community Voting • ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`,
              plaintiff: dispute.parties?.plaintiff?.username || "@plaintiff",
              defendant: dispute.parties?.defendant?.username || "@defendant",
              plaintiffData: dispute.parties?.plaintiff,
              defendantData: dispute.parties?.defendant,
              plaintiffUserId:
                dispute.parties?.plaintiff?.id?.toString() ||
                dispute.parties?.plaintiff?.userId ||
                "",
              defendantUserId:
                dispute.parties?.defendant?.id?.toString() ||
                dispute.parties?.defendant?.userId ||
                "",
              endsAt,
              hasVoted: dispute.hasVoted || false,
            };
          });

          setLiveDisputes(transformedDisputes);
        } else {
          setLiveDisputes([]);
        }
      } catch (error) {
        console.error("Error fetching live voting disputes:", error);
        setLiveDisputes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveVotingDisputes();
  }, []);

  return (
    <div className="card-cyan rounded-2xl border border-cyan-400/30 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="glow-text text-lg font-semibold text-cyan-100 sm:text-xl">
          Live Voting
        </h3>
        <Link to="/voting">
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
            disabled={loading}
          >
            <Vote className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Participate in </span>Voting
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex h-32 flex-col items-center justify-center gap-4 text-cyan-300">
          <DottedSpinner size="medium" />
          <span className="text-sm">Loading live voting sessions...</span>
        </div>
      )}

      {!loading && liveDisputes.length === 0 && (
        <div className="py-2">
          <p className="mb-4 text-sm leading-relaxed text-slate-400">
            Disputes currently open for community voting will scroll here. Each
            session runs for 24 hours once voting begins.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                <Users className="h-3.5 w-3.5 text-cyan-400/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300/90">
                  Active disputes
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  Plaintiff and defendant shown per voting card
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                <Clock className="h-3.5 w-3.5 text-cyan-400/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300/90">
                  Time remaining
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  Countdown to vote deadline shown on each card
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && liveDisputes.length > 0 && (
        <InfiniteMovingCardsWithAvatars
          items={liveDisputes}
          direction="left"
          speed="normal"
          pauseOnHover={true}
          type="live-voting"
        />
      )}
    </div>
  );
};
