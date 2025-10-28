import { Button } from "../ui/button";
import { Wallet, Menu } from "lucide-react";
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

      {/* Connect Wallet Button */}
      <div className="ml-auto flex items-center gap-3">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== "loading";
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated");

            // Wait for everything to load
            if (!ready) {
              return (
                <Button variant="neon" className="neon-hover" disabled>
                  <Wallet className="mr-2 h-4 w-4" />
                  Loading...
                </Button>
              );
            }

            return (
              <div className="flex items-center gap-2">
                {!connected && (
                  <Button
                    variant="neon"
                    className="neon-hover"
                    onClick={openConnectModal}
                    type="button"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                )}

                {connected && chain.unsupported && (
                  <Button
                    variant="neon"
                    className="neon-hover border-red-500/30 bg-red-500/20"
                    onClick={openChainModal}
                    type="button"
                  >
                    Wrong network
                  </Button>
                )}

                {connected && !chain.unsupported && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="neon"
                      className="neon-hover"
                      onClick={openChainModal}
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          className="mr-2 h-3 w-3 overflow-hidden rounded-full"
                          style={{
                            background: chain.iconBackground,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="h-3 w-3"
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </Button>

                    <Button
                      variant="neon"
                      className="neon-hover"
                      onClick={openAccountModal}
                      type="button"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      {account.displayName}
                    </Button>
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
