import { Button } from "../ui/button";
import { Wallet, Menu } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-b from-background/60 to-background/30 backdrop-blur-xl px-4 sm:px-6">
      <div className="absolute inset-0 bg-cyan-500/10 blur-3xl -z-[50]"></div>
      <button
        className="md:hidden inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground/80 hover:bg-white/10"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 text-cyan-300" />
        Menu
      </button>
      <div className="flex items-center gap-3 ml-auto">
        <Button variant="neon" className="neon-hover">
          <Wallet className="mr-1 h-4 w-4" /> Connect Wallet
        </Button>
      </div>
    </header>
  );
}
