// LiveVotingInfiniteCards.tsx
import { Vote, Users, Clock, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { InfiniteMovingCardsWithAvatars } from "../../../components/ui/infinite-moving-cards-with-avatars";
import { useLiveVotingDisputes } from "../hooks/useLiveVotingDisputes";
import { DottedSpinner } from "./DottedSpinner";
import { AppLink } from "../../../components/AppLink";

export const LiveVotingInfiniteCards = () => {
  const { liveDisputes, loading, error } = useLiveVotingDisputes();

  return (
    <div className="card-cyan rounded-2xl border border-cyan-400/30 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="glow-text text-lg font-semibold text-cyan-100 sm:text-xl">
          Live Voting
        </h3>
        <AppLink to="/voting">
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
            disabled={loading}
          >
            <Vote className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Participate in </span>Voting
          </Button>
        </AppLink>
      </div>

      {loading && (
        <div className="flex h-32 flex-col items-center justify-center gap-4 text-cyan-300">
          <DottedSpinner size="medium" />
          <span className="text-sm">Loading live voting sessions...</span>
        </div>
      )}

      {!loading && error && (
        <div className="py-2">
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Failed to load live voting
            </p>
            <p className="max-w-[260px] text-xs leading-relaxed text-slate-500">
              {error}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && liveDisputes.length === 0 && (
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

      {!loading && !error && liveDisputes.length > 0 && (
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
