import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import {
  cleanTelegramUsername,
  formatTelegramUsernameForDisplay,
} from "../../../lib/usernameUtils";
import type { Agreement } from "../../../types";
import { AgreementSkeleton } from "./AgreementSkeleton";
import { AgreementStatusBadge } from "./AgreementStatusBadge";

interface Props {
  agreements: Agreement[];
  loading: boolean;
  totalAgreements: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const formatParty = (username: string) =>
  username.startsWith("@0x")
    ? `${username.slice(1, 5)}..${username.slice(-6)}`
    : formatTelegramUsernameForDisplay(username);

export const AgreementTable = ({
  agreements,
  loading,
  totalAgreements,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const navigate = useNavigate();
  const totalPages = Math.ceil(totalAgreements / pageSize);

  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (currentPage <= 3) return i + 1;
      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
      return currentPage - 2 + i;
    },
  );

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-b-2 border-white/10 ring-1 ring-white/10">
      {/* Page size selector */}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-cyan-300">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400/40"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} className="text-black" value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-sm text-cyan-300">per page</span>
        </div>
      </div>

      <div className="min-w-max">
        <table className="w-full text-sm md:min-w-full">
          <thead>
            <tr className="text-left text-sm font-semibold">
              <th className="px-5 py-3 text-cyan-300">Date Created</th>
              <th className="px-5 py-3 text-emerald-300">Title</th>
              <th className="px-5 py-3 text-yellow-300">Parties</th>
              <th className="px-5 py-3 text-pink-300">Amount</th>
              <th className="px-5 py-3 text-indigo-300">Deadline</th>
              <th className="px-5 py-3 text-purple-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <AgreementSkeleton key={i} />
              ))
            ) : agreements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-cyan-300">
                  No agreements found.
                </td>
              </tr>
            ) : (
              agreements.map((a) => {
                return (
                  <tr
                    key={a.id}
                    className="cursor-pointer border-t border-white/10 text-xs transition hover:bg-white/5"
                    onClick={() =>
                      navigate(
                        a.useEscrow ? `/escrow/${a.id}` : `/agreements/${a.id}`,
                      )
                    }
                  >
                    <td className="text-muted-foreground px-5 py-4">
                      {a.dateCreated}
                    </td>
                    <td className="max-w-[300px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[350px]">
                      <div className="text-muted-foreground line-clamp-2 text-xs break-words">
                        {a.title}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/90">
                      <div className="flex items-center gap-2">
                        {/* Creator */}
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={
                              a.createdByUserId ||
                              cleanTelegramUsername(a.createdBy)
                            }
                            avatarId={a.createdByAvatarId || null}
                            username={cleanTelegramUsername(a.createdBy)}
                            size="sm"
                          />
                          <Link
                            to={`/profile/${encodeURIComponent(cleanTelegramUsername(a.createdBy))}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-cyan-300 hover:text-cyan-200 hover:underline"
                          >
                            {formatParty(a.createdBy)}
                          </Link>
                        </div>

                        <span className="text-cyan-400">
                          <FaArrowRightArrowLeft />
                        </span>

                        {/* Counterparty */}
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={
                              a.counterpartyUserId ||
                              cleanTelegramUsername(a.counterparty)
                            }
                            avatarId={a.counterpartyAvatarId || null}
                            username={cleanTelegramUsername(a.counterparty)}
                            size="sm"
                          />
                          <Link
                            to={`/profile/${encodeURIComponent(cleanTelegramUsername(a.counterparty))}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-cyan-300 hover:text-cyan-200 hover:underline"
                          >
                            {formatParty(a.counterparty)}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/90">
                      {a.useEscrow
                        ? `${a.amount || "0"} ${a.token || ""} (Escrow)`
                        : a.includeFunds === "yes"
                          ? `${a.amount || "0"} ${a.token || ""} (No escrow)`
                          : "No amount"}
                    </td>
                    <td className="px-5 py-4 text-white/90">{a.deadline}</td>
                    <td className="px-5 py-4">
                      <AgreementStatusBadge status={a.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalAgreements > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="order-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
            </Button>

            <div className="xs:flex order-3 hidden items-center gap-1 sm:order-2">
              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "neon" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={`${
                    currentPage === pageNum
                      ? "neon-hover"
                      : "border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                  } h-8 min-w-[2rem] px-2 text-xs sm:h-9 sm:min-w-[2.5rem] sm:px-3 sm:text-sm`}
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            <div className="xs:hidden order-2 text-sm text-cyan-300 sm:order-3">
              Page {currentPage} of {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="order-4 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
