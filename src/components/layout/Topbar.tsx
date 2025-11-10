// Topbar.tsx
import { Menu, Wallet } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="from-background/60 to-background/30 sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-b px-4 backdrop-blur-xl sm:px-6">
      <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div>

      {/* Mobile Menu Button */}
      <button
        className="text-foreground/80 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 text-cyan-300" />
        Menu
      </button>

      {/* Custom Connect Wallet Button */}
      <div className="ml-auto flex items-center gap-3">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openConnectModal,
            openAccountModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <button
                onClick={connected ? openAccountModal : openConnectModal}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/20"
              >
                <Wallet className="h-4 w-4" />
                {connected ? (
                  <>
                    <span className="max-w-[100px] truncate">
                      {account.displayName}
                    </span>
                    <span className="opacity-80">{account.displayBalance}</span>
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
