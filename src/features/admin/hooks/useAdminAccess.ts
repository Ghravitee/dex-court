// src/features/admin/hooks/useAdminAccess.ts
import { useAuth } from "../../../hooks/useAuth"; // adjust path as needed

export function useAdminAccess() {
  const { user, isLoading } = useAuth();
  return {
    isAdmin: user?.isAdmin === true,
    user,
    isLoading,
  };
}
