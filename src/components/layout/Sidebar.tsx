// src/layout/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  FileText,
  Home,
  Scale,
  Star,
  User,
  Vote,
  ChevronLeft,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

const nav = [
  { to: "/", label: "Home", icon: <Home size={18} /> },
  { to: "/agreements", label: "Agreements", icon: <FileText size={18} /> },
  { to: "/disputes", label: "Disputes", icon: <Scale size={18} /> },
  { to: "/voting", label: "Voting", icon: <Vote size={18} /> },
  { to: "/escrow", label: "Escrow", icon: <BadgeDollarSign size={18} /> },
  { to: "/reputation", label: "Reputation", icon: <Star size={18} /> },
];

export function Sidebar({
  expanded,
  setExpanded,
  mobile,
  setMobileOpen,
  onLoginClick,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  mobile?: boolean;
  setMobileOpen?: (v: boolean) => void;
  onLoginClick: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      // Navigate to profile when authenticated
      navigate("/profile");
      if (mobile && setMobileOpen) setMobileOpen(false);
    } else {
      // Show login modal when not authenticated
      onLoginClick();
    }
  };

  return (
    <aside
      className={cn(
        mobile ? "flex" : "hidden md:flex",
        "sidebar-glass fixed top-0 left-0 z-40 h-screen flex-col border-r border-white/10 transition-all duration-300",
        expanded ? "w-64" : "w-16",
      )}
    >
      {/* Glow effect */}
      <div className="absolute top-[300px] right-0 block rounded-full bg-cyan-500/30 blur-3xl lg:size-[20rem]"></div>

      {/* Header */}
      <div className="flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="neon flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60">
            <Scale size={18} />
          </div>
          {expanded && (
            <div className="glow-text leading-none font-semibold text-cyan-300 transition-opacity duration-300">
              DexCourt
            </div>
          )}
        </div>
        {!mobile && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground rounded-md p-1 hover:text-white"
            aria-label="Toggle sidebar"
          >
            {expanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (mobile && setMobileOpen) setMobileOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                "neon-hover hover:bg-white/5",
                isActive
                  ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
                  : "text-foreground/80",
              )
            }
          >
            <span className="relative flex items-center justify-center text-lg">
              {item.icon}
              {!expanded && (
                <span className="pointer-events-none absolute left-full z-50 ml-2 rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </span>

            <span
              className={cn(
                "font-medium transition-all duration-300",
                expanded
                  ? "translate-x-0 opacity-100"
                  : "w-0 -translate-x-5 overflow-hidden opacity-0",
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}

        {/* Single Conditional Login/Profile Button */}
        <button
          onClick={handleAuthButtonClick}
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
            "neon-hover text-foreground/80 hover:bg-white/5",
            // Add active state styling when on profile page
            location.pathname === "/profile" && isAuthenticated
              ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
              : "text-foreground/80",
          )}
        >
          <span className="relative flex items-center justify-center text-lg">
            {isAuthenticated ? <User size={18} /> : <LogIn size={18} />}
            {!expanded && (
              <span className="pointer-events-none absolute left-full z-50 ml-2 rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                {isAuthenticated ? "Profile" : "Login"}
              </span>
            )}
          </span>

          <span
            className={cn(
              "font-medium transition-all duration-300",
              expanded
                ? "translate-x-0 opacity-100"
                : "w-0 -translate-x-5 overflow-hidden opacity-0",
            )}
          >
            {isAuthenticated ? "Profile" : "Login"}
          </span>
        </button>
      </nav>
      {!expanded && (
        <div className="neon mx-auto mb-10 flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60">
          <Scale size={18} />
        </div>
      )}
    </aside>
  );
}
