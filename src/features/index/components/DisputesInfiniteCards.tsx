import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Scale, Users, FileText } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { InfiniteMovingCardsWithAvatars } from "../../../components/ui/infinite-moving-cards-with-avatars";
import { disputeService } from "../../../services/disputeServices";
import type { DisputeListItem, DisputeRow } from "../../../types";
import { PulseLoader } from "./PulseLoader";

export const DisputesInfiniteCards = () => {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDisputes = async () => {
      try {
        setLoading(true);
        const response = await disputeService.getDisputes({
          top: 10,
          sort: "desc",
        });
        const recentDisputes = response.results || [];
        const transformedDisputes = recentDisputes.map(
          (dispute: DisputeListItem) =>
            disputeService.transformDisputeListItemToRow(dispute),
        );
        setDisputes(transformedDisputes);
      } catch (error) {
        console.error("Error fetching recent disputes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentDisputes();
  }, []);

  const disputeItems = useMemo(
    () =>
      disputes.map((dispute) => ({
        id: dispute.id,
        quote:
          dispute.claim || dispute.description || `Dispute: ${dispute.title}`,
        name: dispute.parties,
        title: dispute.title,
        plaintiff: dispute.plaintiff,
        defendant: dispute.defendant,
        plaintiffData: dispute.plaintiffData,
        defendantData: dispute.defendantData,
        plaintiffUserId:
          dispute.plaintiffData?.userId || dispute.plaintiffData?.id || "",
        defendantUserId:
          dispute.defendantData?.userId || dispute.defendantData?.id || "",
        evidenceCount: dispute.evidence?.length || 0,
      })),
    [disputes],
  );

  const isEmpty = !loading && disputeItems.length === 0;

  return (
    <div className="rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-transparent p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="glow-text text-lg font-semibold text-cyan-100 sm:text-xl">
          Recent Disputes
        </h3>
        <Link to="/disputes">
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
            disabled={loading}
          >
            <Scale className="mr-2 h-4 w-4" />
            View All
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-32 flex-col items-center justify-center gap-3 text-cyan-300">
          <PulseLoader size="medium" />
          <span className="text-sm">Loading disputes...</span>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="py-2">
          <p className="mb-4 text-sm leading-relaxed text-slate-400">
            Disputes filed through the network will appear here. When parties
            raise a claim, it shows up as a card for quick review.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                <Users className="h-3.5 w-3.5 text-cyan-400/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300/90">
                  Parties involved
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  Plaintiff and defendant details shown per dispute
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                <FileText className="h-3.5 w-3.5 text-cyan-400/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300/90">
                  Claims &amp; evidence
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  Dispute claim and evidence count surfaced inline
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {!loading && !isEmpty && (
        <InfiniteMovingCardsWithAvatars
          items={disputeItems}
          direction="left"
          speed="normal"
          pauseOnHover={true}
          type="disputes"
        />
      )}
    </div>
  );
};
