// src/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { cn } from "../../lib/utils";

const nav = [
  { to: "/", label: "Home", icon: <Home size={18} /> },
  { to: "/agreements", label: "Agreements", icon: <FileText size={18} /> },
  { to: "/disputes", label: "Disputes", icon: <Scale size={18} /> },
  { to: "/voting", label: "Voting", icon: <Vote size={18} /> },
  { to: "/escrow", label: "Escrow", icon: <BadgeDollarSign size={18} /> },
  { to: "/reputation", label: "Reputation", icon: <Star size={18} /> },
  { to: "/profile", label: "Profile", icon: <User size={18} /> },
];

export function Sidebar({
  expanded,
  setExpanded,
  mobile,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  mobile?: boolean;
}) {
  return (
    <aside
      className={cn(
        mobile ? "flex" : "hidden md:flex",
        "fixed left-0 top-0 z-40 h-screen border-r border-white/10 sidebar-glass flex-col transition-all duration-300",
        expanded ? "w-64" : "w-16"
      )}
    >
      {/* Glow effect */}
      <div className="lg:size-[20rem] rounded-full bg-cyan-500/30 absolute top-[300px] right-0 blur-3xl block"></div>

      {/* Header */}
      <div className="flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-8 w-8 flex items-center justify-center rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60 neon">
            <Scale size={18} />
          </div>
          {expanded && (
            <div className="text-cyan-300 font-semibold leading-none glow-text transition-opacity duration-300">
              DexCourt
            </div>
          )}
        </div>
        {!mobile && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-1 text-muted-foreground hover:text-white"
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
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                "hover:bg-white/5 neon-hover",
                isActive
                  ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
                  : "text-foreground/80"
              )
            }
          >
            <span className="text-lg relative flex items-center justify-center">
              {item.icon}
              {!expanded && (
                <span className="absolute left-full ml-2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                  {item.label}
                </span>
              )}
            </span>

            <span
              className={cn(
                "font-medium transition-all duration-300",
                expanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-5 w-0 overflow-hidden"
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
      {!expanded && (
        <div className="h-8 w-8 flex items-center justify-center rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60 neon mx-auto mb-10">
          <Scale size={18} />
        </div>
      )}
    </aside>
  );
}
