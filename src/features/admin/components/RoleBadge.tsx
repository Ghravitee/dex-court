// src/features/admin/components/RoleBadge.tsx
import { Crown, Shield, Users, User } from "lucide-react";
import { ROLE_CONFIG } from "../constants";
import type { AdminRoleValue } from "../types";

const ROLE_ICONS: Record<AdminRoleValue, React.ReactNode> = {
  3: <Crown className="h-3 w-3" />,
  2: <Shield className="h-3 w-3" />,
  1: <Users className="h-3 w-3" />,
  0: <User className="h-3 w-3" />,
};

interface RoleBadgeProps {
  role: AdminRoleValue;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG[0];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${config.bg} ${config.color} ${config.ring}`}
    >
      {ROLE_ICONS[role]}
      {config.label}
    </span>
  );
}
