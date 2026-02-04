// Topbar.tsx - SINGLE AUTO SIGN-IN VERSION
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useAccount, useAccountEffect, useDisconnect } from "wagmi";
import { toast } from "sonner";
import { useWalletLogin } from "../../hooks/useWalletLogin";
import {
  Menu,
  Wallet,
  Loader2,
  ArrowRight,
  AlertTriangle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { LoginModal } from "../LoginModal";
import { FaTelegramPlane } from "react-icons/fa";
import { UserAvatar } from "../UserAvatar";
import logo from "../../assets/logo.webp";

export function Topbar({
  onMenuClick,
  showLogo = false,
}: {
  onMenuClick?: () => void;
  showLogo?: boolean;
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user, loginMethod, logout } = useAuth();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const {
    autoSignIn,
    manualSignIn,
    isLoggingIn,
    getWalletValidationStatus,
    resetLoginAttempt,
  } = useWalletLogin();

  // Refs to track state without causing re-renders
  const autoLoginInProgressRef = useRef(false);
  const walletConnectionHandledRef = useRef(false);

  // Get wallet validation status
  const walletValidation = getWalletValidationStatus();

  // SINGLE AUTO SIGN-IN TRIGGER: Only in Topbar, not in LoginModal
  useEffect(() => {
    const handleAutoSignIn = async () => {
      // Only proceed if wallet is connected and we have an address
      if (!isConnected || !address) {
        return;
      }

      // Prevent multiple triggers
      if (
        autoLoginInProgressRef.current ||
        walletConnectionHandledRef.current
      ) {
        return;
      }

      // Don't auto sign-in if already authenticated via wallet
      if (isAuthenticated && loginMethod === "wallet") {
        walletConnectionHandledRef.current = true;
        return;
      }

      // Don't auto sign-in if Telegram authenticated with wrong wallet
      if (
        isAuthenticated &&
        loginMethod === "telegram" &&
        !walletValidation.isValid
      ) {
        walletConnectionHandledRef.current = true;
        return;
      }

      console.log("🔐 [Topbar] Attempting auto sign-in...");
      autoLoginInProgressRef.current = true;
      walletConnectionHandledRef.current = true;

      // Small delay to ensure wallet is fully connected
      setTimeout(async () => {
        try {
          await autoSignIn();
        } catch (error) {
          console.error("Auto sign-in error:", error);
        } finally {
          autoLoginInProgressRef.current = false;
        }
      }, 300); // Reduced delay
    };

    handleAutoSignIn();
  }, [
    isConnected,
    address,
    isAuthenticated,
    loginMethod,
    autoSignIn,
    walletValidation,
  ]);

  useAccountEffect({
    onConnect: (data) => {
      console.log("🔗 Wallet connected:", data.address);
      // Reset handling flags on new connection
      walletConnectionHandledRef.current = false;
    },
    onDisconnect: () => {
      console.log("🔗 Wallet disconnected");
      // Reset all flags on disconnect
      autoLoginInProgressRef.current = false;
      walletConnectionHandledRef.current = false;
      resetLoginAttempt();

      reloadAfterDisconnect();
    },
  });

  // Manual sign-in handler (when user explicitly wants to sign)
  const handleManualSignIn = async () => {
    if (!isConnected) {
      return;
    }

    try {
      await manualSignIn();
    } catch (error) {
      console.error("Manual sign-in error:", error);
    }
  };

  const reloadAfterDisconnect = () => {
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  // Handler for Telegram login/logout
  const handleTelegramAuth = () => {
    if (isAuthenticated) {
      logout();
      disconnect();
      reloadAfterDisconnect();
    } else {
      setShowLoginModal(true);
    }
  };

  // Get wallet button text based on state
  const getWalletButtonText = () => {
    if (isLoggingIn) {
      return "Signing...";
    }

    // If authenticated via wallet, show wallet info
    if (isAuthenticated && loginMethod === "wallet" && isConnected) {
      return "Wallet";
    }

    // If authenticated via Telegram with correct wallet
    if (
      isAuthenticated &&
      loginMethod === "telegram" &&
      isConnected &&
      walletValidation.isValid
    ) {
      return "Web3 Ready";
    }

    // If authenticated but wallet is wrong
    if (isAuthenticated && !walletValidation.isValid) {
      return "Switch Wallet";
    }

    // If connected but not authenticated
    if (isConnected && !isAuthenticated) {
      return "Sign In";
    }

    // Default: Connect wallet
    return "Connect Wallet";
  };

  // Get wallet button icon
  const getWalletButtonIcon = () => {
    if (isLoggingIn) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    // If authenticated via wallet, show dropdown chevron
    if (isAuthenticated && loginMethod === "wallet" && isConnected) {
      return <ChevronDown className="h-4 w-4" />;
    }

    if (isConnected && !isAuthenticated) {
      return <ArrowRight className="h-4 w-4" />;
    }

    // Show warning for wrong wallet
    if (isAuthenticated && !walletValidation.isValid) {
      return <AlertTriangle className="h-4 w-4" />;
    }

    return <Wallet className="h-4 w-4" />;
  };

  // Get wallet button styling
  const getWalletButtonVariant = () => {
    // Error state for wrong wallet
    if (isAuthenticated && !walletValidation.isValid) {
      return "border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20";
    }

    // Success state for correct wallet (wallet auth or Telegram with wallet)
    if (
      (isAuthenticated && loginMethod === "wallet") ||
      (isAuthenticated &&
        loginMethod === "telegram" &&
        walletValidation.isValid)
    ) {
      return "border-green-500/30 bg-green-500/10 text-green-300 hover:border-green-400 hover:bg-green-500/20";
    }

    // Neutral state for connection
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20";
  };

  // Get Telegram button text
  const getTelegramButtonText = () => {
    return getLogoutDisplayName();
  };

  // Get Telegram button styling
  const getTelegramButtonVariant = () => {
    if (isAuthenticated) {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20";
    }
    return "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:border-blue-400 hover:bg-blue-500/20";
  };

  // Extract username for the avatar component
  const getUsernameForAvatar = () => {
    if (isAuthenticated && user?.telegram?.username) {
      return user.telegram.username;
    }
    return user?.username || "unknown";
  };

  const getLogoutDisplayName = () => {
    if (!isAuthenticated) return "Login via Telegram";

    if (user?.telegram?.username) {
      return `@${user.telegram.username}`;
    }

    if (user?.walletAddress) {
      return `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;
    }

    return "Account";
  };

  useEffect(() => {
    if (
      isAuthenticated &&
      !walletValidation.isValid &&
      walletValidation.message
    ) {
      toast.error(
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="font-medium">Wrong wallet connected</span>
          </div>
          <span className="text-xs opacity-90">{walletValidation.message}</span>
          <span className="mt-1 text-xs text-red-200">
            Please switch wallets to continue.
          </span>
        </div>,
        { duration: 8000 },
      );
    }
  }, [isAuthenticated, walletValidation]);

  return (
    <>
      <header className="from-background/60 to-background/30 sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-b px-4 backdrop-blur-xl sm:px-6">
        <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div>

        {/* Left: Logo (shown on mobile when showLogo is true) */}
        {showLogo && (
          <div className="flex items-center gap-2 lg:hidden">
            <img
              src={logo}
              alt="DexCourt Logo"
              className="size-10 object-cover"
            />
            <span className="glow-text leading-none font-semibold text-cyan-300">
              DexCourt
            </span>
          </div>
        )}

        {/* Center Spacer */}
        <div className="flex-1" />

        {/* Right: Desktop Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
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

          {/* Telegram Login/Logout Button */}
          <button
            onClick={handleTelegramAuth}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${getTelegramButtonVariant()}`}
            title={isAuthenticated ? "Click to logout" : "Login with Telegram"}
          >
            {isAuthenticated ? (
              <>
                <UserAvatar
                  userId={user?.id || ""}
                  avatarId={user?.avatarId || null}
                  username={getUsernameForAvatar()}
                  size="sm"
                  className="border-emerald-400/40"
                />
                <span className="max-w-[130px] truncate">
                  {getTelegramButtonText()}
                </span>
                <LogOut className="h-4 w-4" />
              </>
            ) : (
              <>
                <FaTelegramPlane className="h-4 w-4" />
                <span className="max-w-[130px]">{getTelegramButtonText()}</span>
              </>
            )}
          </button>

          {/* Wallet Connect Button - SIMPLIFIED FOR AUTO SIGN-IN */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              // Case 1: Wallet connected AND authenticated with wallet
              if (isAuthenticated && loginMethod === "wallet" && connected) {
                return (
                  <button
                    onClick={openAccountModal}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${getWalletButtonVariant()}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">
                      {account.displayName}
                    </span>
                    <span className="opacity-80">{account.displayBalance}</span>
                  </button>
                );
              }

              // Case 2: Telegram authenticated with correct wallet
              if (
                isAuthenticated &&
                loginMethod === "telegram" &&
                connected &&
                walletValidation.isValid
              ) {
                return (
                  <button
                    onClick={openAccountModal}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${getWalletButtonVariant()}`}
                  >
                    {getWalletButtonIcon()}
                    <span className="max-w-[100px] truncate">
                      {account.displayName}
                    </span>
                    <span className="opacity-80">{account.displayBalance}</span>
                  </button>
                );
              }

              // Case 3: Connected but not authenticated yet (auto sign-in in progress or failed)
              if (connected) {
                return (
                  <button
                    onClick={() => {
                      // If auto sign-in failed or user wants to retry
                      if (!isAuthenticated) {
                        handleManualSignIn();
                      } else {
                        openAccountModal();
                      }
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${getWalletButtonVariant()}`}
                  >
                    {!isAuthenticated ? (
                      <>
                        {isLoggingIn ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        <span className="text-sm font-semibold">
                          {isLoggingIn ? "Signing..." : "Sign In"}
                        </span>
                        <span className="ml-1 max-w-[100px] truncate opacity-90">
                          {account.displayName}
                        </span>
                        <span className="opacity-70">
                          {account.displayBalance}
                        </span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
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

              // Case 4: Not connected - show connect button
              return (
                <button
                  onClick={openConnectModal}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${getWalletButtonVariant()}`}
                >
                  <Wallet className="h-4 w-4" />
                  {getWalletButtonText()}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {/* Right: Mobile Hamburger Menu */}
        <button
          className="text-foreground/80 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4 text-cyan-300" />
          Menu
        </button>
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
