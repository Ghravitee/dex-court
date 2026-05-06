import { MessageCircle, Upload, UserCheck } from "lucide-react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { UserAvatar } from "../../../components/UserAvatar";
import { EvidenceDisplay } from "../../../components/disputes/EvidenceDisplay";
import { cleanTelegramUsername } from "../../../lib/usernameUtils";
import type { DisputeRow, EvidenceItem } from "../../../types";
import { formatDisplayName } from "../utils/formatter";
import { useNavigation } from "../../../hooks/useNavigation";

interface Props {
  dispute: DisputeRow;
  safeEvidence: EvidenceItem[];
  plaintiffWitnesses: string[];
  safeDescription: string;
  safeClaim: string;
  isCurrentUserPlaintiff: () => boolean;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const PlaintiffColumn = ({
  dispute,
  safeEvidence,
  plaintiffWitnesses,
  safeDescription,
  safeClaim,
  isCurrentUserPlaintiff,
  onViewEvidence,
}: Props) => {
  const { navigateTo } = useNavigation();

  return (
    <div className="space-y-6">
      {/* Plaintiff Header */}
      <div className="animate-slide-in-left ml-auto flex w-fit items-center gap-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
        <UserAvatar
          userId={
            dispute.plaintiffData?.userId ||
            cleanTelegramUsername(dispute.plaintiff)
          }
          avatarId={dispute.plaintiffData?.avatarId || null}
          username={cleanTelegramUsername(dispute.plaintiff)}
          size="md"
        />
        <div>
          <h2 className="text-lg font-bold text-cyan-400">Plaintiff</h2>
          <div className="flex items-center gap-2 text-sm text-cyan-300">
            <button
              type="button"
              onClick={() =>
                navigateTo(
                  `/profile/${encodeURIComponent(cleanTelegramUsername(dispute.plaintiff))}`,
                )
              }
              className="hover:text-cyan-200 hover:underline"
            >
              {formatDisplayName(dispute.plaintiff)}
            </button>
            {isCurrentUserPlaintiff() && (
              <VscVerifiedFilled className="h-4 w-4 text-green-400" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Initial Complaint */}
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
            <MessageCircle className="h-4 w-4" />
            Initial Complaint
            <span className="text-muted-foreground ml-auto text-xs">
              {new Date(dispute.createdAt).toLocaleDateString()}
            </span>
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium text-cyan-200">
                Description
              </h4>
              <p className="text-sm leading-relaxed break-all text-cyan-100">
                {safeDescription}
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-green-400">
                Formal Claim
              </h4>
              <p className="text-sm leading-relaxed break-all text-cyan-100">
                {safeClaim}
              </p>
            </div>
          </div>
        </div>

        {/* Evidence */}
        {safeEvidence.length > 0 && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
              <Upload className="h-4 w-4" />
              Supporting Evidence ({safeEvidence.length})
            </h3>
            <EvidenceDisplay
              evidence={safeEvidence}
              color="cyan"
              onViewEvidence={onViewEvidence}
            />
          </div>
        )}

        {/* Plaintiff Witnesses */}
        {plaintiffWitnesses.length > 0 && (
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
              <UserCheck className="h-4 w-4" />
              Plaintiff's Witnesses ({plaintiffWitnesses.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {plaintiffWitnesses.map((witness, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo(
                      `/profile/${encodeURIComponent(cleanTelegramUsername(witness))}`,
                    );
                  }}
                  className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/30 hover:text-cyan-200 hover:underline"
                >
                  {formatDisplayName(witness)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
