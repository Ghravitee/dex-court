// Topbar.tsx - IMPROVED VERSION
import { Menu, Wallet, Loader2, ArrowRight } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAccount, useConnect } from "wagmi";
import { useWalletLogin } from "../../hooks/useWalletLogin";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { isConnected, isDisconnected } = useAccount();
  const { connect, connectors } = useConnect();
  // const { disconnect } = useDisconnect();
  const { loginWithConnectedWallet, isLoggingIn } = useWalletLogin();

  // NEW: Auto-logout when wallet disconnects
  useEffect(() => {
    if (isAuthenticated && isDisconnected) {
      console.log("🔐 Wallet disconnected, logging out user");
      logout();
    }
  }, [isAuthenticated, isDisconnected, logout]);

  const handleWalletAuth = async () => {
    if (!isConnected) {
      // First connect wallet
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    // Then authenticate (this handles both registration and login)
    setIsAuthenticating(true);
    try {
      await loginWithConnectedWallet();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getButtonText = () => {
    if (isAuthenticating || isLoggingIn) {
      return "Signing...";
    }

    if (isAuthenticated && user) {
      return "Connected";
    }

    if (isConnected) {
      return "Verify & Continue";
    }

    return "Connect Wallet";
  };

  const getButtonIcon = () => {
    if (isAuthenticating || isLoggingIn) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isConnected && !isAuthenticated) {
      return <ArrowRight className="h-4 w-4" />;
    }

    return <Wallet className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (isConnected && !isAuthenticated) {
      return "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20";
    }
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20";
  };

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

      {/* Custom Connect Wallet Button with Auth */}
      <div className="ml-auto flex items-center gap-3">
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            // Use our custom auth flow for unauthenticated users
            if (!isAuthenticated) {
              return (
                <div className="flex flex-col items-end">
                  <button
                    onClick={handleWalletAuth}
                    disabled={isAuthenticating || isLoggingIn}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${getButtonVariant()}`}
                  >
                    {getButtonIcon()}
                    {getButtonText()}
                  </button>

                  {/* NEW: Clean status indicator */}
                  {/* {isConnected && !isAuthenticated && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"></div>
                      <span className="text-xs text-amber-300/80">
                        Click to verify ownership
                      </span>
                    </div>
                  )} */}
                </div>
              );
            }

            // Use RainbowKit for authenticated users (account management)
            return (
              <button
                onClick={openAccountModal}
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
