/* eslint-disable @typescript-eslint/no-explicit-any */
import { VscVerifiedFilled } from "react-icons/vsc";
import { UserAvatar } from "../../../components/UserAvatar";
import { useAuth } from "../../../hooks/useAuth";
import type { Agreement } from "../../../types";
import {
  formatCreatorUsername,
  formatWalletAddress,
  formatDateWithTime,
  normalizeUsername,
  getDisputeInfo,
} from "../utils/helpers";
import { AppLink } from "../../../components/AppLink";

interface Props {
  agreement: Agreement;
  isCreator: boolean;
  disputeStatus: any;
  signingDate: string | null;
  deliverySubmittedDate: string | null;
  completionDate: string | null;
  cancellationDate: string | null;
}

export const AgreementTimeline = ({
  agreement,
  isCreator,
  disputeStatus,
  signingDate,
  deliverySubmittedDate,
  completionDate,
  cancellationDate,
}: Props) => {
  const { user } = useAuth();
  const disputeInfo = getDisputeInfo(agreement);

  return (
    <div className="card-cyan rounded-xl p-6">
      <h3 className="mb-6 text-lg font-semibold text-white">
        Agreement Timeline
      </h3>
      <div className="flex items-start space-x-8 overflow-x-auto pb-4">
        {/* Created */}
        <div className="relative flex min-w-[10rem] flex-col items-center text-center">
          <div className="z-10 h-4 w-4 rounded-full bg-yellow-300" />
          <div className="mt-3 font-medium text-white">Agreement Created</div>
          <div className="text-sm text-cyan-300">
            {formatDateWithTime(agreement.dateCreated)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-blue-400/70">
            <UserAvatar
              userId={agreement.creatorUserId || agreement.creator || ""}
              avatarId={agreement.creatorAvatarId || null}
              username={agreement.creator || ""}
              size="sm"
            />
            <AppLink
              to={`/profile/${encodeURIComponent(
                agreement.creator?.startsWith("@")
                  ? agreement.creator.slice(1)
                  : agreement.creator || "",
              )}`}
              className="hover:text-blue-300 hover:underline"
            >
              {formatCreatorUsername(agreement.creator)}
            </AppLink>
            {isCreator && (
              <VscVerifiedFilled className="size-5 text-green-400" />
            )}
          </div>
          <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-blue-400/50" />
        </div>

        {/* Signed */}
        {["signed", "completed", "disputed", "pending_approval"].includes(
          agreement.status,
        ) && (
          <div className="relative flex min-w-[12rem] flex-col items-center text-center">
            <div className="z-10 h-4 w-4 rounded-full bg-blue-400" />
            <div className="mt-3 font-medium text-white">Agreement Signed</div>
            <div className="text-sm text-cyan-300">
              {signingDate
                ? formatDateWithTime(signingDate)
                : formatDateWithTime(agreement.dateCreated)}
            </div>
            <div className="mt-1 text-xs text-emerald-400/70">
              by both parties
            </div>
            <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-emerald-400/50" />
          </div>
        )}

        {/* Delivery submitted */}
        {agreement.status === "pending_approval" && (
          <div className="relative flex min-w-[10rem] flex-col items-center text-center">
            <div className="z-10 h-4 w-4 rounded-full bg-orange-400" />
            <div className="mt-3 font-medium text-white">
              Delivery Submitted
            </div>
            <div className="text-sm text-cyan-300">
              {deliverySubmittedDate
                ? formatDateWithTime(deliverySubmittedDate)
                : "Date not available"}
            </div>
            <div className="mt-1 text-xs text-amber-400/70">
              Waiting for approval
            </div>
            <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-amber-400/50" />
          </div>
        )}

        {/* Completed */}
        {agreement.status === "completed" && (
          <div className="relative flex min-w-[12rem] flex-col items-center text-center">
            <div className="z-10 h-4 w-4 rounded-full bg-green-400" />
            <div className="mt-3 font-medium text-white">Work Completed</div>
            <div className="text-sm text-cyan-300">
              {completionDate
                ? formatDateWithTime(completionDate)
                : "Date not available"}
            </div>
          </div>
        )}

        {/* Disputed */}
        {agreement.status === "disputed" &&
          disputeStatus !== "Pending Payment" && (
            <div className="relative flex min-w-[10rem] flex-col items-center text-center">
              <div className="z-10 h-4 w-4 rounded-full bg-violet-400" />
              <div className="mt-3 font-medium text-white">Dispute Filed</div>
              <div className="text-sm text-cyan-300">
                {disputeInfo.filedAt
                  ? formatDateWithTime(disputeInfo.filedAt)
                  : "Recently"}
              </div>
              {disputeInfo.filedBy && (
                <div className="mt-1 flex items-center gap-1">
                  {disputeInfo.filedById && (
                    <UserAvatar
                      userId={disputeInfo.filedById.toString()}
                      avatarId={disputeInfo.filedByAvatarId}
                      username={disputeInfo.filedBy}
                      size="sm"
                    />
                  )}
                  <AppLink
                    to={`/profile/${encodeURIComponent(
                      disputeInfo.filedBy?.replace(/^@/, "") || "",
                    )}`}
                    className="text-xs text-violet-300/70 hover:text-violet-200 hover:underline"
                  >
                    by{" "}
                    {disputeInfo.filedBy.startsWith("0x")
                      ? formatWalletAddress(disputeInfo.filedBy)
                      : formatCreatorUsername(disputeInfo.filedBy)}
                  </AppLink>
                  {user &&
                    disputeInfo.filedBy &&
                    normalizeUsername(user.username) ===
                      normalizeUsername(disputeInfo.filedBy) && (
                      <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                    )}
                </div>
              )}
              {agreement._raw?.disputes?.length > 0 && (
                <AppLink
                  to={`/disputes/${agreement._raw.disputes[0].disputeId}`}
                  className="mt-2 text-xs text-violet-300 underline hover:text-violet-200"
                >
                  View Dispute Details
                </AppLink>
              )}
            </div>
          )}

        {/* Cancelled */}
        {agreement.status === "cancelled" && (
          <div className="relative flex min-w-[12rem] flex-col items-center text-center">
            <div className="z-10 h-4 w-4 rounded-full bg-red-400" />
            <div className="mt-3 font-medium text-white">
              Agreement Cancelled
            </div>
            <div className="text-sm text-cyan-300">
              {cancellationDate
                ? formatDateWithTime(cancellationDate)
                : "Date not available"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
