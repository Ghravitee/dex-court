import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useAdminUsers, useAdminCounts } from "../hooks/useAdminUsers";
import { AdminUsersManager } from "../components/AdminUsersManager";
import { StatCard } from "../components/StatCard";
import type { AdminStats, AdminUser } from "../types";

function deriveStats(
  users: AdminUser[] | undefined,
  totalAccounts?: number,
  totalAdmins?: number, // ← from dedicated query
): AdminStats {
  if (!users) {
    return {
      totalUsers: 0,
      admins: 0,
      judges: 0,
      community: 0,
      verified: 0,
      walletConnected: 0,
      telegramLinked: 0,
    };
  }

  return {
    totalUsers: totalAccounts ?? users.length,
    admins: totalAdmins ?? users.filter((u) => u.isAdmin).length, // ← backend total takes priority
    judges: users.filter((u) => u.role === 2).length,
    community: users.filter((u) => u.role === 1).length,
    verified: users.filter((u) => u.isVerified).length,
    walletConnected: users.filter((u) => u.walletAddress).length,
    telegramLinked: users.filter((u) => u.telegram?.username).length,
  };
}

export default function AdminUsers() {
  const {
    data: users,
    isLoading,
    error,
    totalAccounts,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAdminUsers();

  const { data: adminCountData } = useAdminCounts();

  const stats = useMemo(
    () => deriveStats(users, totalAccounts, adminCountData?.totalAccounts),
    [users, totalAccounts, adminCountData],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white/90">
          User Management
        </h1>
        <p className="text-sm text-white/50">
          Manage roles, permissions, and platform access.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center">
          <p className="font-semibold text-red-400">Error Loading Users</p>
          <p className="mt-1 text-sm text-white/60">
            {error instanceof Error
              ? error.message
              : "Failed to load user data"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          singular="Total User"
          plural="Total Users"
          value={stats.totalUsers}
          isLoading={isLoading}
          colorClass="cyan"
        />
        <StatCard
          singular="Admin"
          value={stats.admins}
          isLoading={isLoading}
          colorClass="yellow"
        />
        <StatCard
          singular="Judge"
          value={stats.judges}
          isLoading={isLoading}
          colorClass="blue"
        />
        <StatCard
          singular="Community Member"
          plural="Community Members"
          value={stats.community}
          isLoading={isLoading}
          colorClass="emerald"
        />
      </div>

      {!isLoading && users && users.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            singular="Verified User"
            plural="Verified Users"
            value={stats.verified}
            colorClass="green"
          />
          <StatCard
            singular="Wallet Connected User"
            plural="Wallet Connected Users"
            value={stats.walletConnected}
            colorClass="purple"
          />
          <StatCard
            singular="Telegram Linked User"
            plural="Telegram Linked Users"
            value={stats.telegramLinked}
            colorClass="cyan"
          />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading statistics…
        </div>
      )}

      {/* No more validUsers filter — backend is clean now */}
      <AdminUsersManager
        users={users ?? []}
        totalAccounts={totalAccounts}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        fetchNextPage={fetchNextPage}
      />
    </div>
  );
}
