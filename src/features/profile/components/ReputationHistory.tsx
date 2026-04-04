/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../../../components/ui/button";
import { Loader2 } from "lucide-react";
import { formatReputationEvent, formatDateTime } from "../utils/formatters";
// import { ReputationEventTypeEnum } from "../constants";

interface ReputationHistoryProps {
  reputationHistory: any;
  loading: boolean;
  error: string | null;
  loadingMore: boolean;
  userRoles: any;
  onLoadMore: () => void;
  onViewEvent: (eventId: string, isEscrow: boolean) => void;
}

export const ReputationHistory = ({
  reputationHistory,
  loading,
  error,
  loadingMore,
  userRoles,
  onLoadMore,
  // onViewEvent,
}: ReputationHistoryProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
        <span className="ml-2 text-cyan-300">
          Loading reputation history...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-2 text-lg text-red-300">
          Error loading reputation history
        </div>
        <div className="text-sm text-white/50">{error}</div>
      </div>
    );
  }

  if (!reputationHistory?.results?.length) {
    const getRoleMessage = () => {
      if (userRoles.admin) return "Administrator Reputation";
      if (userRoles.judge) return "Judge Reputation";
      if (userRoles.community) return "Community Reputation";
      return "Building Reputation";
    };

    const getRoleDescription = () => {
      if (userRoles.admin) {
        return "Administrators maintain platform integrity. Your reputation score is based on oversight activities.";
      }
      if (userRoles.judge) {
        return "Judges earn reputation through fair dispute resolution and timely decisions.";
      }
      if (userRoles.community) {
        return "Community members build reputation by participating in agreements and disputes.";
      }
      return "Complete agreements, resolve disputes, and participate in the community to build your reputation.";
    };

    return (
      <div className="py-8 text-center">
        <div className="mb-2 text-lg text-cyan-300">{getRoleMessage()}</div>
        <div className="text-sm text-white/50">{getRoleDescription()}</div>
        <div className="mt-4 text-sm text-cyan-300">
          Base Score: {reputationHistory?.baseScore || 50} → Final Score:{" "}
          {reputationHistory?.finalScore || 50}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80">
            <div className="font-medium">Reputation Score</div>
            <div className="text-xs text-white/60">
              {reputationHistory.results.length} of {reputationHistory.total}{" "}
              events shown
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-cyan-300">
              {reputationHistory.finalScore || 50}
            </div>
            <div className="text-xs text-white/60">
              <span className="text-green-400">
                +
                {(reputationHistory.finalScore || 50) -
                  (reputationHistory.baseScore || 50)}
              </span>{" "}
              from base
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {reputationHistory.results.map((event: any) => {
          const formattedEvent = formatReputationEvent(event);

          return (
            <div
              key={event.id}
              className="rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-cyan-400/30 hover:bg-white/10"
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{formattedEvent.icon}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-white/90">
                        {formattedEvent.eventType}
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {formatDateTime(event.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        formattedEvent.isPositive
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {formattedEvent.isPositive ? "+" : ""}
                      {formattedEvent.value} pts
                    </span>
                  </div>

                  {/* {(event.eventType ===
                    ReputationEventTypeEnum.AgreementCompleted ||
                    event.eventType ===
                      ReputationEventTypeEnum.AgreementEscrowCompleted ||
                    event.eventType === ReputationEventTypeEnum.DisputeWon ||
                    event.eventType ===
                      ReputationEventTypeEnum.DisputeLostRegular ||
                    event.eventType ===
                      ReputationEventTypeEnum.DisputeLostEscrow) && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-cyan-300 hover:text-cyan-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isEscrow =
                            event.eventType ===
                              ReputationEventTypeEnum.AgreementEscrowCompleted ||
                            event.eventType ===
                              ReputationEventTypeEnum.DisputeLostEscrow;
                          onViewEvent(event.eventId.toString(), isEscrow);
                        }}
                      >
                        View Event #{event.eventId}
                      </Button>
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reputationHistory.hasMore && (
        <div className="mt-4 text-center">
          <div className="mb-2 text-xs text-white/60">
            Showing {reputationHistory.results.length} of{" "}
            {reputationHistory.total} events
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More History"
            )}
          </Button>
        </div>
      )}
    </>
  );
};
