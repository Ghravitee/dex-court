// Topbar.tsx - UPDATED WITH LOGOUT BUTTON
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useAccount, useConnect } from "wagmi";
import { useWalletLogin } from "../../hooks/useWalletLogin";
import {
  Menu,
  Wallet,
  Loader2,
  ArrowRight,
  AlertTriangle,
  LogOut,
} from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { isAuthenticated, user, logout, loginMethod } = useAuth();

  const { isConnected, isDisconnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { loginWithConnectedWallet, isLoggingIn, getWalletValidationStatus } =
    useWalletLogin();

  // NEW: Get wallet validation status
  const walletValidation = getWalletValidationStatus();

  // FIXED: Better auto-logout logic
  useEffect(() => {
    // Only auto-logout if:
    // 1. User is authenticated via wallet
    // 2. Wallet gets disconnected
    if (isAuthenticated && loginMethod === "wallet" && isDisconnected) {
      console.log(
        "🔐 Wallet disconnected for wallet-authenticated user, logging out",
      );
      logout();
    }
  }, [isAuthenticated, isDisconnected, logout, loginMethod]);

  const handleWalletAuth = async () => {
    if (!isConnected) {
      // First connect wallet
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    // Existing logic for wallet authentication
    if (user?.walletAddress && !walletValidation.isValid) {
      return;
    }

    // Wallet login flow
    setIsAuthenticating(true);
    try {
      await loginWithConnectedWallet();
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Update button text to be clearer
  const getButtonText = () => {
    if (isAuthenticating || isLoggingIn) {
      return "Signing...";
    }

    if (isAuthenticated && user) {
      const validation = getWalletValidationStatus();

      if (!validation.isValid) {
        return "Wrong Wallet";
      }

      // SPECIAL CASE: Telegram user with correct wallet
      if (loginMethod === "telegram" && isConnected && validation.isValid) {
        return "Web3 Ready";
      }

      if (isConnected) {
        switch (validation.action) {
          case "link":
            return "Link Wallet";
          case "verify":
            return "Verify Wallet";
          default:
            return user.walletAddress ? "Wallet Connected" : "Connected";
        }
      }
      return user.walletAddress ? "Connect Wallet" : "Connect Wallet";
    }

    if (isConnected) {
      return "Login with Wallet";
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

    // Show warning icon for wrong wallet
    if (isAuthenticated && !walletValidation.isValid) {
      return <AlertTriangle className="h-4 w-4" />;
    }

    return <Wallet className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    // Show error state for wrong wallet
    if (isAuthenticated && !walletValidation.isValid) {
      return "border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20";
    }

    // Show different colors based on the action
    if (isAuthenticated && user) {
      const validation = getWalletValidationStatus();

      switch (validation.action) {
        case "link":
          return "border-green-500/30 bg-green-500/10 text-green-300 hover:border-green-400 hover:bg-green-500/20";
        case "verify":
          return "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20";
        default:
          return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20";
      }
    }

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

      {/* Wallet validation warning */}
      {isAuthenticated &&
        walletValidation.isValid &&
        walletValidation.message && (
          <div className="mr-4 hidden items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-1 md:flex">
            <span className="text-xs text-blue-300">
              {walletValidation.message}
            </span>
          </div>
        )}

      {/* Custom Connect Wallet Button with Auth */}
      <div className="ml-auto flex items-center gap-3">
        {/* NEW: Logout Button - Only show when authenticated */}
        {isAuthenticated && (
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-400 hover:bg-red-500/20"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
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
                    disabled={
                      isAuthenticating ||
                      isLoggingIn ||
                      (isConnected && !walletValidation.isValid)
                    }
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${getButtonVariant()}`}
                  >
                    {getButtonIcon()}
                    {getButtonText()}
                  </button>
                </div>
              );
            }

            if (loginMethod === "wallet" && isConnected) {
              return (
                <button
                  onClick={openAccountModal}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${getButtonVariant()}`}
                >
                  {getButtonIcon()}
                  {connected && (
                    <>
                      <span className="max-w-[100px] truncate">
                        {account.displayName}
                      </span>
                      <span className="opacity-80">
                        {account.displayBalance}
                      </span>
                    </>
                  )}
                </button>
              );
            }

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
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
