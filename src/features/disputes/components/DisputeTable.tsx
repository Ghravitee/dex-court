import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import type { DisputeRow } from "../../../types";
import { cleanTelegramUsername } from "../../../lib/usernameUtils";
import { DisputeSkeleton } from "./DisputeSkeleton";
import { DisputeStatusBadge } from "./DisputeStatusBadge";
import { DisputePagination } from "./DisputePagination";
import { formatPartyDisplay } from "../utils/formatters";

interface Props {
  disputes: DisputeRow[];
  loading: boolean;
  fetchError: string | null;
  totalDisputes: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  isRefetching: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefetch: () => void;
}

export const DisputeTable = ({
  disputes,
  loading,
  fetchError,
  totalDisputes,
  pageSize,
  currentPage,
  totalPages,
  startItem,
  endItem,
  isRefetching,
  onPageChange,
  onPageSizeChange,
  onRefetch,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-b-2 border-white/10 p-0 ring-1 ring-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <h3 className="font-semibold text-white/90">Disputes</h3>
        <div className="text-sm text-cyan-300">
          {totalDisputes} {totalDisputes === 1 ? "dispute" : "disputes"}
        </div>
      </div>

      {/* Page size selector */}
      <div className="px-5 py-3">
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

      <div className="overflow-x-auto">
        <table className="min-w-full lg:text-sm">
          <thead>
            <tr className="text-left text-sm font-semibold">
              <th className="px-5 py-3 text-cyan-300">Creation date</th>
              <th className="px-5 py-3 text-emerald-300">Title</th>
              <th className="px-5 py-3 text-yellow-300">Request type</th>
              <th className="px-5 py-3 text-pink-300">Parties</th>
              <th className="px-5 py-3 text-purple-300">Claim</th>
              <th className="px-5 py-3 text-indigo-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <DisputeSkeleton key={i} />
              ))
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-cyan-300">
                  No disputes found.
                </td>
              </tr>
            ) : (
              disputes.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => navigate(`/disputes/${d.id}`)}
                  className="cursor-pointer border-t border-white/10 text-xs transition hover:bg-cyan-500/10"
                >
                  <td className="text-muted-foreground min-w-[120px] px-5 py-4">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 font-medium text-white/90">
                    <div className="max-w-[300px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[350px]">
                      <div className="text-muted-foreground line-clamp-2 text-xs break-words">
                        {d.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">{d.request}</td>
                  <td className="px-5 py-4 text-white/90">
                    <div className="flex min-w-[180px] items-center gap-2">
                      {/* Plaintiff */}
                      <div className="flex min-w-0 flex-shrink items-center gap-1">
                        <UserAvatar
                          userId={
                            d.plaintiffData?.userId ||
                            cleanTelegramUsername(d.plaintiff)
                          }
                          avatarId={d.plaintiffData?.avatarId || null}
                          username={cleanTelegramUsername(d.plaintiff)}
                          size="sm"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/profile/${encodeURIComponent(cleanTelegramUsername(d.plaintiff))}`,
                            );
                          }}
                          className="max-w-[60px] truncate text-cyan-300 hover:text-cyan-200 hover:underline lg:max-w-none"
                        >
                          {formatPartyDisplay(d.plaintiff)}
                        </button>
                      </div>

                      <span className="flex-shrink-0 text-cyan-400">
                        <FaArrowRightArrowLeft />
                      </span>

                      {/* Defendant */}
                      <div className="flex min-w-0 flex-shrink items-center gap-1">
                        <UserAvatar
                          userId={
                            d.defendantData?.userId ||
                            cleanTelegramUsername(d.defendant)
                          }
                          avatarId={d.defendantData?.avatarId || null}
                          username={cleanTelegramUsername(d.defendant)}
                          size="sm"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/profile/${encodeURIComponent(cleanTelegramUsername(d.defendant))}`,
                            );
                          }}
                          className="max-w-[60px] truncate text-cyan-300 hover:text-cyan-200 hover:underline lg:max-w-none"
                        >
                          {formatPartyDisplay(d.defendant)}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="max-w-[300px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[350px]">
                      <div className="text-muted-foreground line-clamp-2 text-xs break-words">
                        {d.claim}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap">
                    <DisputeStatusBadge status={d.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Error state */}
        {fetchError && !loading && (
          <div className="px-5 py-6 text-center">
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Unable to Load Disputes
              </h3>
              <p className="mb-4 text-cyan-300">{fetchError}</p>
              <Button
                variant="outline"
                onClick={onRefetch}
                disabled={isRefetching}
                className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
              >
                {isRefetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refetching...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refetch Disputes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalDisputes > 0 && (
        <DisputePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalDisputes={totalDisputes}
          startItem={startItem}
          endItem={endItem}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
