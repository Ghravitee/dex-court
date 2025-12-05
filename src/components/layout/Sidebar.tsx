// src/layout/Sidebar.tsx - UPDATED WITH AVATAR IN USERNAME DISPLAY
import { NavLink, useNavigate } from "react-router-dom";
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
  LogIn,
  Shield,
  Wallet,
  LogOut,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { useAdminAccess } from "../../hooks/useAdmin";
import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useWalletLogin } from "../../hooks/useWalletLogin";
import { FaTelegramPlane } from "react-icons/fa";
import { UserAvatar } from "../../components/UserAvatar"; // Add this import

export function Sidebar({
  expanded,
  setExpanded,
  mobile,
  setMobileOpen,
  onLoginClick,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  mobile?: boolean;
  setMobileOpen?: (v: boolean) => void;
  onLoginClick: () => void;
}) {
  const { isAuthenticated, user, logout, loginMethod } = useAuth();
  const { isAdmin } = useAdminAccess();
  const navigate = useNavigate();

  // Wallet authentication state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { loginWithConnectedWallet, isLoggingIn, getWalletValidationStatus } =
    useWalletLogin();

  const nav = [
    { to: "/", label: "Home", icon: <Home size={18} /> },
    { to: "/agreements", label: "Agreements", icon: <FileText size={18} /> },
    { to: "/escrow", label: "Escrow", icon: <BadgeDollarSign size={18} /> },
    { to: "/disputes", label: "Disputes", icon: <Scale size={18} /> },
    { to: "/voting", label: "Voting", icon: <Vote size={18} /> },
    {
      to: "/web3escrow",
      label: "Theo's Escrow",
      icon: <BadgeDollarSign size={18} />,
    },
    { to: "/web3vote", label: "Theo's Voting", icon: <Vote size={18} /> },
    { to: "/reputation", label: "Reputation", icon: <Star size={18} /> },

    // NEW: Admin link - only show for admin users
    ...(isAdmin
      ? [
          {
            to: "/admin",
            label: "Admin",
            icon: <Shield size={18} className="text-purple-300" />,
          },
        ]
      : []),
  ];

  // Handler for Telegram login/logout
  const handleTelegramAuth = () => {
    if (isAuthenticated) {
      logout();
      if (mobile && setMobileOpen) setMobileOpen(false);
    } else {
      onLoginClick();
      if (mobile && setMobileOpen) setMobileOpen(false);
    }
  };

  // Handler for wallet authentication
  const handleWalletAuth = async () => {
    if (!isConnected) {
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    // If already authenticated via wallet, just return (RainbowKit handles this)
    if (isAuthenticated && loginMethod === "wallet") {
      return;
    }

    // If authenticated via Telegram and wallet is wrong, don't proceed
    const walletValidation = getWalletValidationStatus();
    if (isAuthenticated && user?.walletAddress && !walletValidation.isValid) {
      return;
    }

    // Wallet login flow
    setIsAuthenticating(true);
    try {
      await loginWithConnectedWallet();
      if (mobile && setMobileOpen) setMobileOpen(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Get wallet button text
  const getWalletButtonText = () => {
    if (isAuthenticating || isLoggingIn) {
      return "Signing...";
    }

    // If authenticated via wallet
    if (isAuthenticated && loginMethod === "wallet" && isConnected) {
      return "Wallet";
    }

    // If authenticated via Telegram with correct wallet
    const walletValidation = getWalletValidationStatus();
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
      return "Sign In";
    }

    // Default: Connect wallet
    return "Connect Wallet";
  };

  // Get wallet button icon
  const getWalletButtonIcon = () => {
    if (isAuthenticating || isLoggingIn) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    // If authenticated via wallet
    if (isAuthenticated && loginMethod === "wallet" && isConnected) {
      return <ChevronDown className="h-4 w-4" />;
    }

    if (isConnected && !isAuthenticated) {
      return <ArrowRight className="h-4 w-4" />;
    }

    // Show warning for wrong wallet
    const walletValidation = getWalletValidationStatus();
    if (isAuthenticated && !walletValidation.isValid) {
      return <AlertTriangle className="h-4 w-4" />;
    }

    return <Wallet className="h-4 w-4" />;
  };

  // Get wallet button styling
  const getWalletButtonVariant = () => {
    const walletValidation = getWalletValidationStatus();

    // Error state for wrong wallet
    if (isAuthenticated && !walletValidation.isValid) {
      return "border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20";
    }

    // Success state for correct wallet
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

  // For desktop sidebar, we keep the Profile button
  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate("/profile");
      if (!expanded && setExpanded) setExpanded(true);
    } else {
      onLoginClick();
    }
  };

  return (
    <aside
      className={cn(
        mobile ? "flex" : "hidden lg:flex",
        "fixed top-0 left-0 z-40 h-[100vh] flex-col border-r border-white/10 transition-all duration-300",
        expanded ? "w-64" : "w-16",
      )}
    >
      {/* Glow effect */}
      <div className="absolute top-[300px] right-0 block rounded-full bg-cyan-500/30 blur-3xl lg:size-[20rem]"></div>

      {/* Header */}
      <div className="relative flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="neon flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400/20 ring-1 ring-cyan-400/60">
            <Scale size={18} />
          </div>
          {expanded && (
            <div className="glow-text leading-none font-semibold text-cyan-300 transition-opacity duration-300">
              DexCourt
            </div>
          )}
        </div>
        {!mobile && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground absolute -right-4 rounded-md border border-white/20 p-1 hover:text-white"
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
            onClick={() => {
              if (mobile && setMobileOpen) setMobileOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                "neon-hover hover:bg-white/5",
                isActive
                  ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
                  : "text-foreground/80",
              )
            }
          >
            <span className="relative flex items-center justify-center text-lg">
              {item.icon}
              {!expanded && (
                <span className="pointer-events-none absolute left-full z-50 ml-2 rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </span>

            <span
              className={cn(
                "font-medium transition-all duration-300",
                expanded
                  ? "translate-x-0 opacity-100"
                  : "w-0 -translate-x-5 overflow-hidden opacity-0",
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}

        {/* Mobile Authentication Section */}
        {mobile && (
          <>
            {/* Add Profile to navigation links when authenticated */}
            {isAuthenticated && (
              <NavLink
                to="/profile"
                onClick={() => {
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                    "neon-hover hover:bg-white/5",
                    isActive
                      ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
                      : "text-foreground/80",
                  )
                }
              >
                <span className="relative flex items-center justify-center text-lg">
                  <User size={18} />
                </span>
                <span className="font-medium">Profile</span>
              </NavLink>
            )}

            <div className="my-4 border-t border-white/10 pt-4">
              {/* Telegram Login/Logout Button - UPDATED WITH AVATAR */}
              <button
                onClick={handleTelegramAuth}
                className={cn(
                  "group relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  "neon-hover hover:bg-white/5",
                  getTelegramButtonVariant(),
                )}
              >
                <span className="relative flex items-center justify-center text-lg">
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
                    </>
                  ) : (
                    <FaTelegramPlane className="h-4 w-4" />
                  )}
                </span>
                <span className="flex-1 truncate text-left font-medium">
                  {getTelegramButtonText()}
                </span>
                {isAuthenticated && <LogOut className="ml-auto h-4 w-4" />}
              </button>

              {/* Wallet Connect Button */}
              <button
                onClick={handleWalletAuth}
                disabled={
                  isAuthenticating ||
                  isLoggingIn ||
                  (isAuthenticated && !getWalletValidationStatus().isValid)
                }
                className={cn(
                  "group relative mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  "neon-hover hover:bg-white/5 disabled:opacity-50",
                  getWalletButtonVariant(),
                )}
              >
                <span className="relative flex items-center justify-center text-lg">
                  {getWalletButtonIcon()}
                </span>
                <span className="flex-1 truncate text-left font-medium">
                  {getWalletButtonText()}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Desktop Profile/Login Button (different from mobile) */}
        {!mobile && (
          <button
            onClick={handleProfileClick}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
              "neon-hover text-foreground/80 hover:bg-white/5",
              location.pathname === "/profile" && isAuthenticated
                ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
                : "text-foreground/80",
            )}
          >
            <span className="relative flex items-center justify-center text-lg">
              {isAuthenticated ? (
                // Add avatar for authenticated user in desktop sidebar
                isAuthenticated && user ? (
                  <UserAvatar
                    userId={user.id}
                    avatarId={user.avatarId || null}
                    username={getUsernameForAvatar()}
                    size="sm"
                    className="border-cyan-400/40"
                  />
                ) : (
                  <User size={18} />
                )
              ) : (
                <LogIn size={18} />
              )}
              {!expanded && (
                <span className="pointer-events-none absolute left-full z-50 ml-2 rounded bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                  {isAuthenticated ? "Profile" : "Login"}
                </span>
              )}
            </span>

            <span
              className={cn(
                "font-medium transition-all duration-300",
                expanded
                  ? "translate-x-0 opacity-100"
                  : "w-0 -translate-x-5 overflow-hidden opacity-0",
              )}
            >
              {isAuthenticated ? "Profile" : "Login"}
            </span>
          </button>
        )}
      </nav>
    </aside>
  );
}
