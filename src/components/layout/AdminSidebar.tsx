// src/components/layout/AdminSidebar.tsx
import { NavLink } from "react-router-dom";
import { Users, BarChart3, Shield, ArrowLeft, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { UserAvatar } from "../UserAvatar";

const adminRoutes = [
  {
    path: "/admin/users",
    label: "User Management",
    icon: <Users size={20} />,
    description: "Manage user roles and permissions",
  },
  {
    path: "/admin/analytics",
    label: "Analytics",
    icon: <BarChart3 size={20} />,
    description: "View platform statistics",
  },
];

interface AdminSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export const AdminSidebar = ({ mobile, onClose }: AdminSidebarProps) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-full w-64 border-r border-white/10 bg-gray-900/95 backdrop-blur-sm",
        mobile ? "flex" : "hidden md:flex",
      )}
    >
      {/* Glow effect */}
      <div className="absolute top-[250px] right-0 size-64 rounded-full bg-purple-500/20 blur-3xl"></div>

      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 ring-1 ring-purple-400/50">
              <Shield size={18} className="text-purple-300" />
            </div>
            <div>
              <div className="font-semibold text-purple-300">Admin Panel</div>
              <div className="text-xs text-white/60">DexCourt</div>
            </div>
          </div>

          {mobile && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
          )}
        </div>

        {/* User Info with Avatar */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={user?.id || "unknown"}
              avatarId={user?.avatarId || null}
              username={user?.username || user?.telegram?.username || "Admin"}
              size="md"
              className="border border-purple-400/30 shadow-md"
              priority={true}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white/90">
                @{user?.username || user?.telegram?.username || "Admin"}
              </div>
              <div className="truncate text-xs text-white/60">
                {user?.walletAddress
                  ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-4)}`
                  : "Administrator"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {adminRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              onClick={() => {
                if (mobile && onClose) onClose();
              }}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200",
                  "hover:bg-white/5 hover:text-white",
                  isActive
                    ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30"
                    : "text-white/70",
                )
              }
            >
              <span className="flex-shrink-0">{route.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{route.label}</div>
                {/* <div className="text-xs text-white/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {route.description}
                </div> */}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-white/10 p-4">
          {/* Back to Main App */}
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to App
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-300 transition-all hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
