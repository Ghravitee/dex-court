// Topbar.tsx - UPDATED WITH AVATAR IN USERNAME DISPLAY
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useAccount, useConnect } from "wagmi";
import { useWalletLogin } from "../../hooks/useWalletLogin";
import {
  Menu,
  Wallet,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Scale,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { LoginModal } from "../LoginModal";
import { FaTelegramPlane } from "react-icons/fa";
import { UserAvatar } from "../UserAvatar"; // Add this import

export function Topbar({
  onMenuClick,
  showLogo = false,
}: {
  onMenuClick?: () => void;
  showLogo?: boolean;
}) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user, loginMethod, logout } = useAuth();

  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { loginWithConnectedWallet, isLoggingIn, getWalletValidationStatus } =
    useWalletLogin();

  // Get wallet validation status
  const walletValidation = getWalletValidationStatus();

  // Handler for wallet authentication
  const handleWalletAuth = async () => {
    // If wallet not connected, connect first
    if (!isConnected) {
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    // If already authenticated via wallet and clicking "Wallet Connected",
    // we should NOT try to sign in again - RainbowKit will handle this
    if (isAuthenticated && loginMethod === "wallet") {
      // RainbowKit ConnectButton.Custom will handle opening account modal
      return;
    }

    // If authenticated via Telegram and wallet is wrong, don't proceed
    if (isAuthenticated && user?.walletAddress && !walletValidation.isValid) {
      return;
    }

    // Wallet login flow (for first-time login or Telegram users linking wallet)
    setIsAuthenticating(true);
    try {
      await loginWithConnectedWallet();
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handler for Telegram login/logout
  const handleTelegramAuth = () => {
    if (isAuthenticated) {
      // Logout if already authenticated
      logout();
    } else {
      // Show login modal if not authenticated
      setShowLoginModal(true);
    }
  };

  // Get wallet button text based on state
  const getWalletButtonText = () => {
    if (isAuthenticating || isLoggingIn) {
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
      return "Wrong Wallet";
    }

    // If connected but not authenticated
    if (isConnected && !isAuthenticated) {
      return "Login via Wallet";
    }

    // Default: Connect wallet
    return "Connect Wallet TopBar";
  };

  // Get wallet button icon
  const getWalletButtonIcon = () => {
    if (isAuthenticating || isLoggingIn) {
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

  // Get Telegram button text - ADD AVATAR HERE
  const getTelegramButtonText = () => {
    if (isAuthenticated) {
      return user?.telegram?.username ? `@${user.telegram.username}` : "Logout";
    }
    return "Login via Telegram";
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

  return (
    <>
      <header className="from-background/60 to-background/30 sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-b px-4 backdrop-blur-xl sm:px-6">
        <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div>

        {/* Left: Logo (shown on mobile when showLogo is true) */}
        {showLogo && (
          <div className="flex items-center gap-2 lg:hidden">
            <div className="neon flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60">
              <Scale size={18} />
            </div>
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
          {/* Telegram Login/Logout Button - UPDATED WITH AVATAR */}
          <button
            onClick={handleTelegramAuth}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${getTelegramButtonVariant()}`}
            title={isAuthenticated ? "Click to logout" : "Login with Telegram"}
          >
            {isAuthenticated ? (
              <>
                {/* Add UserAvatar component here */}
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

          {/* Wallet Connect Button */}
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              // Case 1: User is authenticated via wallet
              if (isAuthenticated && loginMethod === "wallet" && connected) {
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

              // Case 2: User is authenticated via Telegram with correct wallet
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

              // Case 3: All other states (connect, sign in, wrong wallet, etc.)
              return (
                <button
                  onClick={handleWalletAuth}
                  disabled={
                    isAuthenticating ||
                    isLoggingIn ||
                    (isAuthenticated && !walletValidation.isValid)
                  }
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${getWalletButtonVariant()}`}
                >
                  {getWalletButtonIcon()}
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
