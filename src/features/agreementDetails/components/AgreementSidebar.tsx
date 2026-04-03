/* eslint-disable @typescript-eslint/no-explicit-any */
import { Users, UserCheck, FileText, Eye } from "lucide-react";
import type { Agreement } from "../../../types";
import {
  getStatusColor,
  formatDateWithTime,
  getDisputeInfo,
} from "../utils/helpers";

interface Props {
  agreement: Agreement;
  isFirstParty: boolean;
  isCounterparty: boolean;
  isCreator: boolean;
  disputeStatus: any;
  signingDate: string | null;
}

export const AgreementSidebar = ({
  agreement,
  isFirstParty,
  isCounterparty,
  isCreator,
  disputeStatus,
  signingDate,
}: Props) => {
  const disputeInfo = getDisputeInfo(agreement);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="card-cyan rounded-xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Agreement Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-cyan-300">Agreement ID</span>
            <span className="text-white">#{agreement.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyan-300">Type</span>
            <span className="text-white">{agreement.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyan-300">Status</span>
            {disputeStatus !== "Pending Payment" ? (
              <span
                className={`font-medium ${getStatusColor(agreement.status)} rounded px-2 py-1 text-xs`}
              >
                {agreement.status.replace("_", " ")}
              </span>
            ) : (
              <span className="rounded border border-yellow-500/30 bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                Dispute Pending Payment
              </span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-cyan-300">Files Attached</span>
            <span className="text-white">{agreement.images?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyan-300">Funds Involved</span>
            <span className="text-white">
              {agreement.includeFunds === "yes" ? "Yes" : "No"}
            </span>
          </div>
          {agreement.includeFunds === "yes" && (
            <div className="flex justify-between">
              <span className="text-cyan-300">Escrow Used</span>
              <span className="text-white">
                {agreement.useEscrow ? "Yes" : "No"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Your role */}
      <div className="card-cyan rounded-xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Your Role</h3>
        <div className="space-y-3">
          {isFirstParty && (
            <div className="rounded-lg bg-blue-500/10 p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-blue-300">First Party</span>
              </div>
              <p className="mt-1 text-xs text-blue-200/80">
                You initiated this agreement. Both parties can mark work as
                delivered if the agreement warrants it.
              </p>
            </div>
          )}
          {isCounterparty && (
            <div className="rounded-lg bg-green-500/10 p-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-400" />
                <span className="font-medium text-green-300">Counterparty</span>
              </div>
              <p className="mt-1 text-xs text-green-200/80">
                Both parties can mark work as delivered if the agreement
                warrants it.
              </p>
            </div>
          )}
          {isCreator && !isFirstParty && !isCounterparty && (
            <div className="rounded-lg bg-purple-500/10 p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-purple-300">Creator</span>
              </div>
              <p className="mt-1 text-xs text-purple-200/80">
                You created this agreement in the system.
              </p>
            </div>
          )}
          {!isFirstParty && !isCounterparty && !isCreator && (
            <div className="rounded-lg bg-gray-500/10 p-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-300">Viewer</span>
              </div>
              <p className="mt-1 text-xs text-gray-200/80">
                You are viewing this agreement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contract info */}
      <div className="card-cyan rounded-xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Contract Info</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-cyan-300">Created</span>
            <span className="text-white">
              {formatDateWithTime(agreement.dateCreated)}
            </span>
          </div>
          {signingDate && (
            <div className="flex justify-between">
              <span className="text-cyan-300">Signed</span>
              <span className="text-white">
                {formatDateWithTime(signingDate)}
              </span>
            </div>
          )}
          {agreement.status === "disputed" &&
            disputeInfo.filedAt &&
            disputeStatus !== "Pending Payment" && (
              <div className="flex justify-between">
                <span className="text-purple-300">Dispute Filed</span>
                <span className="text-purple-300">
                  {formatDateWithTime(disputeInfo.filedAt)}
                </span>
              </div>
            )}
          <div className="flex justify-between">
            <span className="text-cyan-300">Deadline</span>
            <span className="text-white">
              {formatDateWithTime(agreement.deadline)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
