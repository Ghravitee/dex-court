import { useNavigate } from "react-router-dom";
import { MessageCircle, Upload, UserCheck, Shield } from "lucide-react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { UserAvatar } from "../../../components/UserAvatar";
import { EvidenceDisplay } from "../../../components/disputes/EvidenceDisplay";
import { cleanTelegramUsername } from "../../../lib/usernameUtils";
import type { DisputeRow, EvidenceItem } from "../../../types";
import { formatDisplayName } from "../utils/formatter";

interface Props {
  dispute: DisputeRow;
  defendantEvidence: EvidenceItem[];
  defendantWitnesses: string[];
  isCurrentUserDefendant: () => boolean;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const DefendantColumn = ({
  dispute,
  defendantEvidence,
  defendantWitnesses,
  isCurrentUserDefendant,
  onViewEvidence,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Defendant Header */}
      <div className="animate-slide-in-right flex w-fit items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-4">
        <UserAvatar
          userId={
            dispute.defendantData?.userId ||
            cleanTelegramUsername(dispute.defendant)
          }
          avatarId={dispute.defendantData?.avatarId || null}
          username={cleanTelegramUsername(dispute.defendant)}
          size="md"
        />
        <div>
          <h2 className="text-lg font-bold text-yellow-400">Defendant</h2>
          <div className="flex items-center gap-2 text-sm text-yellow-300">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/profile/${encodeURIComponent(cleanTelegramUsername(dispute.defendant))}`,
                )
              }
              className="hover:text-yellow-200 hover:underline"
            >
              {formatDisplayName(dispute.defendant)}
            </button>
            {isCurrentUserDefendant() && (
              <VscVerifiedFilled className="h-4 w-4 text-green-400" />
            )}
          </div>
        </div>
      </div>

      {/* Defendant Response */}
      {dispute.defendantResponse ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
              <MessageCircle className="h-4 w-4" />
              Response to Claims
              <span className="text-muted-foreground ml-auto text-xs">
                {new Date(
                  dispute.defendantResponse.createdAt,
                ).toLocaleDateString()}
              </span>
            </h3>
            <p className="text-sm leading-relaxed text-yellow-100">
              {dispute.defendantResponse.description}
            </p>
          </div>

          {defendantEvidence.length > 0 && (
            <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                <Upload className="h-4 w-4" />
                Defense Evidence ({defendantEvidence.length})
              </h3>
              <EvidenceDisplay
                evidence={defendantEvidence}
                color="yellow"
                onViewEvidence={onViewEvidence}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-yellow-400/30 bg-yellow-500/5 p-8 text-center">
          <Shield className="mx-auto mb-3 h-8 w-8 text-yellow-400/50" />
          <h3 className="mb-2 text-lg font-semibold text-yellow-300">
            Awaiting Response
          </h3>
          <p className="mb-4 text-sm text-yellow-200/70">
            The defendant has not yet responded to the claims.
          </p>
        </div>
      )}

      {/* Defendant Witnesses */}
      {defendantWitnesses.length > 0 && (
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
            <UserCheck className="h-4 w-4" />
            Defendant's Witnesses ({defendantWitnesses.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {defendantWitnesses.map((witness, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    `/profile/${encodeURIComponent(cleanTelegramUsername(witness))}`,
                  );
                }}
                className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300 transition-colors hover:bg-yellow-500/30 hover:text-yellow-200 hover:underline"
              >
                {formatDisplayName(witness)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
