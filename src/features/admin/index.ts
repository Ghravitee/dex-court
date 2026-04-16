// src/features/admin/index.ts
// Public API surface of the admin feature — import from here, not from internals.

export { AdminUsersManager } from "./components/AdminUsersManager";
export { default as AdminUsersPage } from "./pages/AdminUsers";
export { RoleBadge } from "./components/RoleBadge";
export { StatCard } from "./components/StatCard";

export { useAdminUsers } from "./hooks/useAdminUsers";
export { useUpdateRole } from "./hooks/useUpdateRole";
export { useAdminAccess } from "./hooks/useAdminAccess";
export { adminQueryKeys } from "./hooks/useAdminUsers";

export { AdminError, resolveErrorMessage } from "./AdminError";
export { AdminErrorCode, ROLE_CONFIG } from "./constants";
export type { AdminUser, AdminStats, AdminRoleValue, RoleTarget } from "./types";
