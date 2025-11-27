/* eslint-disable @typescript-eslint/no-explicit-any */
// components/AdminUsersManager.tsx - UPDATED WITH AVATARS
import { useState, useMemo } from "react";
import {
  useAdminUsers,
  useUpdateToJudge,
  useUpdateToCommunity,
  useAdminAccess,
  AdminError,
} from "../hooks/useAdmin";
import { Button } from "./ui/button";
import {
  Loader2,
  Shield,
  Users,
  AlertCircle,
  CheckCircle2,
  Crown,
  Wallet,
} from "lucide-react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { UserAvatar } from "./UserAvatar";

export const AdminUsersManager = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { isAdmin } = useAdminAccess();
  const { data: users, isLoading, error } = useAdminUsers();
  const updateToJudgeMutation = useUpdateToJudge();
  const updateToCommunityMutation = useUpdateToCommunity();

  // Filter out current admin user if needed
  const filteredUsers = useMemo(() => {
    return users || [];
  }, [users]);

  const handleUserSelect = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleUpdateToJudge = async () => {
    if (selectedUsers.length === 0) return;

    clearMessages();

    try {
      await updateToJudgeMutation.mutateAsync(selectedUsers);
      setSuccessMessage(
        `Successfully updated ${selectedUsers.length} user(s) to Judge role`,
      );
      setSelectedUsers([]);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleUpdateToCommunity = async () => {
    if (selectedUsers.length === 0) return;

    clearMessages();

    try {
      await updateToCommunityMutation.mutateAsync(selectedUsers);
      setSuccessMessage(
        `Successfully updated ${selectedUsers.length} user(s) to Community role`,
      );
      setSelectedUsers([]);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const getErrorMessage = (error: any) => {
    if (error instanceof AdminError) {
      return error.message;
    }
    return error?.message || "An unexpected error occurred";
  };

  const getUserRoleBadge = (role: number) => {
    switch (role) {
      case 3:
        return (
          <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-300">
            <Crown className="h-3 w-3" />
            Admin
          </span>
        );
      case 2:
        return (
          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
            Judge
          </span>
        );
      case 1:
        return (
          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
            Community
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs text-gray-300">
            User
          </span>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-500/10 to-transparent p-6 text-center shadow-lg">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h3 className="mb-2 text-lg font-semibold text-white/90">
          Admin Access Required
        </h3>
        <p className="text-white/70">
          You need administrator privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white/90">
          User Management
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">
            {selectedUsers.length} user(s) selected
          </span>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="glass w-fit rounded-lg border border-green-400/30 bg-gradient-to-br from-green-500/20 to-transparent p-4 shadow-lg">
          <div className="flex items-center gap-2 text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="glass w-fit rounded-lg border border-red-400/30 bg-gradient-to-br from-red-500/20 to-transparent p-4 shadow-lg">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleUpdateToJudge}
          disabled={
            selectedUsers.length === 0 || updateToJudgeMutation.isPending
          }
          className="border-blue-400/40 bg-gradient-to-br from-blue-600/20 to-blue-500/10 text-blue-100 shadow-lg shadow-blue-500/10 hover:from-blue-500/30 hover:to-blue-400/20 disabled:opacity-50"
        >
          {updateToJudgeMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Shield className="mr-2 h-4 w-4" />
          )}
          Make Judge ({selectedUsers.length})
        </Button>

        <Button
          onClick={handleUpdateToCommunity}
          disabled={
            selectedUsers.length === 0 || updateToCommunityMutation.isPending
          }
          className="border-emerald-400/40 bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 text-emerald-100 shadow-lg shadow-emerald-500/10 hover:from-emerald-500/30 hover:to-emerald-400/20 disabled:opacity-50"
        >
          {updateToCommunityMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Make Community ({selectedUsers.length})
        </Button>

        <Button
          onClick={handleSelectAll}
          variant="outline"
          className="border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-cyan-100"
        >
          {selectedUsers.length === filteredUsers.length
            ? "Deselect All"
            : "Select All"}
        </Button>
      </div>

      {/* Users List */}
      <div className="glass rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/5 p-6 shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
            <span className="ml-3 text-cyan-300">Loading users...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h3 className="mb-2 text-lg font-semibold text-white/90">
              Error Loading Users
            </h3>
            <p className="text-white/70">{getErrorMessage(error)}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-cyan-400" />
            <h3 className="mb-2 text-lg font-semibold text-white/90">
              No Users Found
            </h3>
            <p className="text-white/70">There are no users to display.</p>
          </div>
        ) : (
          <div className="max-h-96 space-y-4 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => {
                // Fix: Format username - remove @ and slice if it's a wallet address
                const displayUsername = user.username?.startsWith("0x")
                  ? `${user.username.slice(0, 6)}...${user.username.slice(-4)}`
                  : user.username?.replace(/^@/, "") || "user";

                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)} // Fix: Click container to select
                    className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                      selectedUsers.includes(user.id)
                        ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 shadow-lg shadow-cyan-500/20"
                        : "card-cyan"
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div
                      className="absolute top-3 right-3 z-30"
                      onClick={(e) => e.stopPropagation()} // Fix: Prevent container click when clicking checkbox
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-gray-900"
                      />
                    </div>

                    {/* User Header with Avatar */}
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        userId={user.id.toString()}
                        avatarId={user.avatarId || null}
                        username={user.username || "user"}
                        size="lg"
                        className="border-2 border-cyan-400/30 shadow-lg"
                        priority={false}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate font-semibold text-white/90">
                            {displayUsername}{" "}
                            {/* Fix: Use formatted username without @ */}
                          </h4>
                          {user.isVerified && (
                            <VscVerifiedFilled className="h-4 w-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {getUserRoleBadge(user.role || 0)}
                          {user.isVerified && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">ID:</span>
                        <span className="font-mono text-white/80">
                          {user.id}
                        </span>
                      </div>

                      {user.telegram?.username && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/70">
                            @{user.telegram.username}
                          </span>
                        </div>
                      )}

                      {user.walletAddress && (
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3 w-3 text-purple-400" />
                          <span className="truncate font-mono text-white/70">
                            {user.walletAddress.slice(0, 6)}...
                            {user.walletAddress.slice(-4)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <div className="mt-3">
                        <p className="line-clamp-2 text-xs text-white/60">
                          {user.bio}
                        </p>
                      </div>
                    )}

                    {/* Selection Glow Effect */}
                    {selectedUsers.includes(user.id) && (
                      <div className="absolute inset-0 rounded-xl bg-cyan-400/5 ring-2 ring-cyan-400/30"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mutation Loading States */}
      {(updateToJudgeMutation.isPending ||
        updateToCommunityMutation.isPending) && (
        <div className="glass rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 p-4 shadow-lg">
          <div className="flex items-center gap-2 text-cyan-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating user roles...</span>
          </div>
        </div>
      )}
    </div>
  );
};
