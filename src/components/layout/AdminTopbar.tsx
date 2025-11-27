// src/components/layout/AdminTopbar.tsx
import { Menu, Shield } from "lucide-react";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export const AdminTopbar = ({ onMenuClick }: AdminTopbarProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-gray-900/80 px-6 backdrop-blur-xl">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 hover:text-white md:hidden"
        aria-label="Open admin menu"
      >
        <Menu size={18} />
      </button>

      {/* Admin Actions */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}

        {/* Admin Badge */}
        <div className="hidden items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1 md:flex">
          <Shield size={14} className="text-purple-300" />
          <span className="text-sm font-medium text-purple-300">
            Administrator
          </span>
        </div>
      </div>
    </header>
  );
};
