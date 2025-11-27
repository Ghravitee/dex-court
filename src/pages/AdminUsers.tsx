// src/pages/AdminUsers.tsx
import { AdminUsersManager } from "../components/AdminUsersManager";
import { useAdminUsers } from "../hooks/useAdmin";
import { Loader2 } from "lucide-react";

export default function AdminUsers() {
  const { data: users, isLoading, error } = useAdminUsers();

  // Calculate real statistics from the users data
  const stats = {
    totalUsers: users?.length || 0,
    admins: users?.filter((user) => user.role === 3).length || 0,
    judges: users?.filter((user) => user.role === 2).length || 0,
    community: users?.filter((user) => user.role === 1).length || 0,
    basicUsers: users?.filter((user) => user.role === 0).length || 0,
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white/90">
              User Management
            </h1>
            <p className="mt-2 text-white/60">
              Manage user roles, permissions, and platform access
            </p>
          </div>
        </div>
        <div className="glass rounded-2xl border border-red-400/30 p-6 text-center">
          <div className="mb-2 text-lg font-semibold text-red-400">
            Error Loading Users
          </div>
          <div className="text-white/70">
            {error instanceof Error
              ? error.message
              : "Failed to load user data"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white/90">User Management</h1>
          <p className="mt-2 text-white/60">
            Manage user roles, permissions, and platform access
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          {/* Total Users */}
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3">
            <div className="text-2xl font-bold text-cyan-300">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.totalUsers.toLocaleString()
              )}
            </div>
            <div className="text-xs text-cyan-200">Total Users</div>
          </div>

          {/* Admins */}
          <div className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-4 py-3">
            <div className="text-2xl font-bold text-yellow-300">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.admins.toLocaleString()
              )}
            </div>
            <div className="text-xs text-yellow-200">Admins</div>
          </div>

          {/* Judges */}
          <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-3">
            <div className="text-2xl font-bold text-blue-300">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.judges.toLocaleString()
              )}
            </div>
            <div className="text-xs text-blue-200">Judges</div>
          </div>

          {/* Community Members */}
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
            <div className="text-2xl font-bold text-emerald-300">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.community.toLocaleString()
              )}
            </div>
            <div className="text-xs text-emerald-200">Community</div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      {!isLoading && users && users.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Basic Users */}
          <div className="rounded-lg border border-gray-400/30 bg-gray-500/10 px-4 py-3">
            <div className="text-lg font-bold text-gray-300">
              {stats.basicUsers.toLocaleString()}
            </div>
            <div className="text-xs text-gray-200">Basic Users</div>
          </div>

          {/* Verified Users */}
          <div className="rounded-lg border border-green-400/30 bg-green-500/10 px-4 py-3">
            <div className="text-lg font-bold text-green-300">
              {users.filter((user) => user.isVerified).length.toLocaleString()}
            </div>
            <div className="text-xs text-green-200">Verified</div>
          </div>

          {/* Wallet Connected */}
          <div className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-4 py-3">
            <div className="text-lg font-bold text-purple-300">
              {users
                .filter((user) => user.walletAddress)
                .length.toLocaleString()}
            </div>
            <div className="text-xs text-purple-200">Wallet Connected</div>
          </div>

          {/* Telegram Linked */}
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3">
            <div className="text-lg font-bold text-cyan-300">
              {users
                .filter((user) => user.telegram?.username)
                .length.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-200">Telegram Linked</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="glass rounded-2xl border border-cyan-400/30 p-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
            <span className="text-cyan-300">Loading user statistics...</span>
          </div>
        </div>
      )}

      {/* Users Manager Component */}
      <AdminUsersManager />
    </div>
  );
}
