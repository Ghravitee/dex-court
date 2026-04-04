import { Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VscVerifiedFilled } from "react-icons/vsc";
import { UserAvatar } from "../../../components/UserAvatar";
import { cleanTelegramUsername } from "../../../lib/usernameUtils";
import type { DisputeRow } from "../../../types";
import { formatDisplayName } from "../utils/formatter";

interface Props {
  dispute: DisputeRow;
  isCurrentUserPlaintiff: () => boolean;
  isCurrentUserDefendant: () => boolean;
}

export const DisputeOverviewCard = ({
  dispute,
  isCurrentUserPlaintiff,
  isCurrentUserDefendant,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="card-cyan rounded-2xl p-6 shadow-lg">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <h1 className="mb-2 font-bold text-cyan-400 lg:text-[22px]">
            {dispute.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-cyan-300">
              <Clock className="h-4 w-4" />
              <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <span>{dispute.request}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70">
            <Users className="h-4 w-4" />
            <span>Parties</span>
          </div>
          <div className="mt-1 flex flex-col items-center gap-2 text-sm">
            {/* Plaintiff */}
            <div className="flex items-center gap-2">
              <UserAvatar
                userId={
                  dispute.plaintiffData?.userId ||
                  cleanTelegramUsername(dispute.plaintiff)
                }
                avatarId={dispute.plaintiffData?.avatarId || null}
                username={cleanTelegramUsername(dispute.plaintiff)}
                size="sm"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    `/profile/${encodeURIComponent(cleanTelegramUsername(dispute.plaintiff))}`,
                  );
                }}
                className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 hover:underline"
              >
                {formatDisplayName(dispute.plaintiff)}
                {isCurrentUserPlaintiff() && (
                  <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                )}
              </button>
            </div>

            <span className="text-white/50">vs</span>

            {/* Defendant */}
            <div className="flex items-center gap-2">
              <UserAvatar
                userId={
                  dispute.defendantData?.userId ||
                  cleanTelegramUsername(dispute.defendant)
                }
                avatarId={dispute.defendantData?.avatarId || null}
                username={cleanTelegramUsername(dispute.defendant)}
                size="sm"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    `/profile/${encodeURIComponent(cleanTelegramUsername(dispute.defendant))}`,
                  );
                }}
                className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 hover:underline"
              >
                {formatDisplayName(dispute.defendant)}
                {isCurrentUserDefendant() && (
                  <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
