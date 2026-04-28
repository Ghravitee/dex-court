// src/features/admin/components/AdminUsersManager.tsx
import { useState, useMemo, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Users,
  Loader2,
  X,
  ShieldAlert,
} from "lucide-react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useUpdateRole } from "../hooks/useUpdateRole";
import { useAdminAccess } from "../hooks/useAdminAccess";
import { resolveErrorMessage } from "../AdminError";
import { ActionToolbar } from "./ActionToolbar";
import { UserCard } from "./UserCard";
import type { AdminUser } from "../types";

interface BannerProps {
  kind: "success" | "error";
  message: string;
  onDismiss: () => void;
}

interface AdminUsersManagerProps {
  users: AdminUser[];
  totalAccounts: number;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

function Banner({ kind, message, onDismiss }: BannerProps) {
  const isSuccess = kind === "success";
  return (
    <div
      className={`flex w-fit items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${
        isSuccess
          ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
          : "border-red-400/20 bg-red-500/[0.08] text-red-300"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
      )}
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-1 rounded p-0.5 opacity-40 transition-opacity hover:opacity-80"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AdminUsersManager({
  users,
  totalAccounts,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: AdminUsersManagerProps) {
  const { isLoading, error, refetch } = useAdminUsers();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const { isAdmin } = useAdminAccess();
  const judgeMutation = useUpdateRole("judge");
  const communityMutation = useUpdateRole("community");

  const selectedCount = selectedIds.size;
  const selectedArray = useMemo(() => [...selectedIds], [selectedIds]);

  const handleToggle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === users.length ? new Set() : new Set(users.map((u) => u.id)),
    );
  }, [users]);

  const runMutation = async (target: "judge" | "community") => {
    if (!selectedArray.length) return;
    setFeedback(null);
    const mutation = target === "judge" ? judgeMutation : communityMutation;
    const label = target === "judge" ? "Judge" : "Community";
    try {
      await mutation.mutateAsync(selectedArray);
      setFeedback({
        kind: "success",
        message: `${selectedCount} user${selectedCount !== 1 ? "s" : ""} updated to ${label}.`,
      });
      setSelectedIds(new Set());
    } catch (err) {
      setFeedback({ kind: "error", message: resolveErrorMessage(err) });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10">
          <ShieldAlert className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h3 className="mb-1.5 text-base font-bold text-white/90">
            Admin Access Required
          </h3>
          <p className="text-sm text-white/45">
            You need administrator privileges to view this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <Banner
          kind={feedback.kind}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Toolbar */}
      <ActionToolbar
        selectedCount={selectedCount}
        totalCount={users.length}
        isJudgePending={judgeMutation.isPending}
        isCommunityPending={communityMutation.isPending}
        onMakeJudge={() => runMutation("judge")}
        onMakeCommunity={() => runMutation("community")}
        onToggleSelectAll={handleToggleAll}
      />

      {/* Panel */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-white/35 uppercase">
            <Users className="h-3.5 w-3.5 text-cyan-400/70" />
            All Users
          </div>
          {selectedCount > 0 && (
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-1 font-mono text-[11px] text-cyan-400">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400/60" />
            <span className="text-xs tracking-wide text-white/35">
              Loading users…
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertCircle className="h-8 w-8 text-red-400/70" />

            <div>
              <p className="text-sm font-semibold text-white/70">
                Failed to load users
              </p>
              <p className="mt-1 text-xs text-white/35">
                {resolveErrorMessage(error)}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10 active:scale-[0.98]"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Users className="h-8 w-8 text-white/20" />
            <p className="text-xs text-white/35">No users to display.</p>
          </div>
        ) : (
          <div className="max-h-[620px] overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin]">
            <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isSelected={selectedIds.has(user.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>

            {/* Load more */}
            {hasNextPage && (
              <div className="flex items-center justify-center border-t border-white/[0.06] p-4">
                <button
                  onClick={fetchNextPage}
                  disabled={isFetchingNextPage}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70 transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    `Load more (${totalAccounts - users.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
