// import { NavLink } from "react-router-dom";
// import { cn } from "../../lib/utils";
// import {
//   BadgeDollarSign,
//   FileText,
//   Home,
//   Scale,
//   Star,
//   User,
// } from "lucide-react";

// const nav = [
//   { to: "/", label: "Home", emoji: <Home /> },
//   { to: "/agreements", label: "Agreements", emoji: <FileText /> },
//   { to: "/disputes", label: "Disputes", emoji: <Scale /> },
//   { to: "/voting", label: "Voting", emoji: <Scale /> },
//   { to: "/escrow", label: "Escrow", emoji: <BadgeDollarSign /> },
//   { to: "/reputation", label: "Reputation", emoji: <Star /> },
//   { to: "/profile", label: "Profile", emoji: <User /> },
// ];

// export function Sidebar() {
//   return (
//     <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-r-white/10 bg-sidebar glass">
//       <div className="flex h-16 items-center gap-3 px-5">
//         <div className="h-8 w-8 rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60 neon" />
//         <a href="/" className="cursor-pointer">
//           <div className="text-cyan-300 font-semibold leading-none glow-text">
//             Neon Court
//           </div>
//           <div className="text-xs text-muted-foreground">Web3 Justice</div>
//         </a>
//       </div>
//       <nav className="mt-4 space-y-1 px-3">
//         {nav.map((item) => (
//           <NavLink
//             key={item.to}
//             to={item.to}
//             className={({ isActive }) =>
//               cn(
//                 "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
//                 "hover:bg-white/5 neon-hover",
//                 isActive
//                   ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30 neon"
//                   : "text-foreground/80"
//               )
//             }
//           >
//             <span className="text-lg">{item.emoji}</span>
//             <span className="font-medium">{item.label}</span>
//           </NavLink>
//         ))}
//       </nav>
//       <div className="absolute inset-x-0 bottom-0 p-4 text-xs text-muted-foreground">
//         <div className="rounded-lg border border-white/10 bg-white/5 p-3">
//           <div className="mb-1 font-medium text-foreground/80">Status</div>
//           <div className="flex items-center justify-between text-xs">
//             <span className="text-muted-foreground">Network</span>
//             <span className="text-cyan-300">Ethereum</span>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }

import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  BadgeDollarSign,
  FileText,
  Home,
  Scale,
  Star,
  User,
} from "lucide-react";

const nav = [
  { to: "/", label: "Home", emoji: <Home /> },
  { to: "/agreements", label: "Agreements", emoji: <FileText /> },
  { to: "/disputes", label: "Disputes", emoji: <Scale /> },
  { to: "/voting", label: "Voting", emoji: <Scale /> },
  { to: "/escrow", label: "Escrow", emoji: <BadgeDollarSign /> },
  { to: "/reputation", label: "Reputation", emoji: <Star /> },
  { to: "/profile", label: "Profile", emoji: <User /> },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-sidebar sidebar-glass transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}
      aria-hidden={!open}
    >
      <div className="flex h-16 items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60 neon" />
          <div>
            <div className="text-cyan-300 font-semibold leading-none glow-text">
              Neon Court
            </div>
            <div className="text-xs text-muted-foreground">Web3 Justice</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden rounded-md p-1 text-muted-foreground hover:text-white"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-4 space-y-1 px-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                "hover:bg-white/5 neon-hover",
                isActive
                  ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30 neon"
                  : "text-foreground/80"
              )
            }
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="absolute inset-x-0 bottom-0 p-4 text-xs text-muted-foreground">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="mb-1 font-medium text-foreground/80">Status</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Network</span>
            <span className="text-cyan-300">Ethereum</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
