/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { disputeService } from "../../../services/disputeServices";
import { type DoneCase } from "../types";

export const useConcludedDisputes = () => {
  const [concludedCases, setConcludedCases] = useState<DoneCase[]>([]);
  const [concludedLoading, setConcludedLoading] = useState(false);

  const fetchConcludedDisputes = useCallback(async () => {
    try {
      setConcludedLoading(true);
      const response = await disputeService.getSettledDisputes({
        top: 300,
        sort: "desc",
      });

      if (response?.results) {
        const concludedDisputes = response.results.map((dispute: any) => {
          let winner: "plaintiff" | "defendant" | "dismissed" = "dismissed";

          if (dispute.result === 1) winner = "plaintiff";
          else if (dispute.result === 2) winner = "defendant";
          else if (dispute.result === 3) winner = "dismissed";

          const judgeVotes = dispute.votesPerGroup?.judges?.total || 0;
          const communityVotes =
            (dispute.votesPerGroup?.communityTierOne?.total || 0) +
            (dispute.votesPerGroup?.communityTierTwo?.total || 0);

          const judgePct = dispute.percentagesPerGroup?.judges?.plaintiff || 0;
          const communityPct =
            (dispute.percentagesPerGroup?.communityTierOne?.plaintiff ||
              0 + dispute.percentagesPerGroup?.communityTierTwo?.plaintiff ||
              0) / 2;

          const comments = (dispute.comments || []).map((comment: any) => {
            const text =
              comment.comment ||
              comment.text ||
              comment.content ||
              "No comment text";
            const username = comment.username || comment.handle || "Anonymous";

            return {
              // accountId is what UserAvatar needs as `userId` to build the
              // avatar URL. Without it, UserAvatar receives undefined and falls
              // back to initials even when avatarId is present.
              accountId: comment.accountId,
              handle: username,
              text: text,
              avatarId: comment.avatarId || null,
            };
          });

          return {
            id: dispute.id.toString(),
            title: dispute.title || "Untitled Dispute",
            parties: {
              plaintiff: dispute.parties?.plaintiff?.username || "@plaintiff",
              defendant: dispute.parties?.defendant?.username || "@defendant",
              plaintiffAvatar: dispute.parties?.plaintiff?.avatarId || null,
              defendantAvatar: dispute.parties?.defendant?.avatarId || null,
              plaintiffId: dispute.parties?.plaintiff?.id?.toString() || "",
              defendantId: dispute.parties?.defendant?.id?.toString() || "",
            },
            description:
              dispute.claim || dispute.description || "No description provided",
            winner,
            judgeVotes,
            communityVotes,
            judgePct,
            communityPct,
            weighted: dispute.weighted || {
              plaintiff: 0,
              defendant: 0,
              dismiss: 0,
            },
            votesPerGroup: dispute.votesPerGroup || {
              judges: { plaintiff: 0, defendant: 0, dismiss: 0, total: 0 },
              communityTierOne: {
                plaintiff: 0,
                defendant: 0,
                dismiss: 0,
                total: 0,
              },
              communityTierTwo: {
                plaintiff: 0,
                defendant: 0,
                dismiss: 0,
                total: 0,
              },
            },
            percentagesPerGroup: dispute.percentagesPerGroup || {
              judges: { plaintiff: 0, defendant: 0, dismiss: 0 },
              communityTierOne: { plaintiff: 0, defendant: 0, dismiss: 0 },
              communityTierTwo: { plaintiff: 0, defendant: 0, dismiss: 0 },
            },
            comments,
            rawData: dispute,
          };
        });

        setConcludedCases(concludedDisputes);
      } else {
        setConcludedCases([]);
      }
    } catch (err) {
      console.error("Failed to fetch concluded disputes:", err);
      throw err;
    } finally {
      setConcludedLoading(false);
    }
  }, []);

  return {
    concludedCases,
    concludedLoading,
    fetchConcludedDisputes,
  };
};
