// Sidebar.tsx - UPDATED WITH AUTO SIGN-IN
import { NavLink, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  FileText,
  Home,
  Scale,
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
  Star,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { useAdminAccess } from "../../hooks/useAdmin";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletLogin } from "../../hooks/useWalletLogin";
import { FaTelegramPlane } from "react-icons/fa";
import { UserAvatar } from "../../components/UserAvatar";
import { useEffect, useRef } from "react";
import logo from "../../assets/logo.webp";

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
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, loginMethod } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const {
    autoSignIn,
    manualSignIn,
    isLoggingIn,
    getWalletValidationStatus,
    // resetLoginAttempt,
  } = useWalletLogin();

  const walletValidation = getWalletValidationStatus();

  // Refs to track auto sign-in in Sidebar (to prevent duplicate with Topbar)
  const sidebarAutoSignInAttemptedRef = useRef(false);
  const sidebarLastAddressRef = useRef<string | null>(null);

  // Auto sign-in in Sidebar (only for mobile, or when Topbar might not be mounted)
  useEffect(() => {
    const handleSidebarAutoSignIn = async () => {
      // Only proceed in mobile mode or if sidebar is expanded on desktop
      if (!mobile && !expanded) return;

      // Only proceed if wallet is connected and we have an address
      if (!isConnected || !address) return;

      // Prevent duplicate attempts
      if (
        sidebarAutoSignInAttemptedRef.current &&
        sidebarLastAddressRef.current === address
      ) {
        return;
      }

      // Don't auto sign-in if already authenticated via wallet
      if (isAuthenticated && loginMethod === "wallet") return;

      // Don't auto sign-in if Telegram authenticated with wrong wallet
      if (
        isAuthenticated &&
        loginMethod === "telegram" &&
        !walletValidation.isValid
      )
        return;

      console.log("🔐 [Sidebar] Attempting auto sign-in...");
      sidebarAutoSignInAttemptedRef.current = true;
      sidebarLastAddressRef.current = address;

      // Small delay to ensure wallet is ready
      setTimeout(async () => {
        try {
          await autoSignIn();
        } catch (error) {
          console.error("Sidebar auto sign-in error:", error);
        }
      }, 400); // Slightly longer delay than Topbar
    };

    handleSidebarAutoSignIn();
  }, [
    mobile,
    expanded,
    isConnected,
    address,
    isAuthenticated,
    loginMethod,
    walletValidation,
    autoSignIn,
  ]);

  // Reset on disconnect
  useEffect(() => {
    if (!isConnected) {
      sidebarAutoSignInAttemptedRef.current = false;
      sidebarLastAddressRef.current = null;
    }
  }, [isConnected]);

  const reloadAfterDisconnect = () => {
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const handleTelegramAuth = () => {
    if (isAuthenticated) {
      logout();
      disconnect();
      if (mobile && setMobileOpen) setMobileOpen(false);
      reloadAfterDisconnect();
    } else {
      onLoginClick();
      if (mobile && setMobileOpen) setMobileOpen(false);
    }
  };

  const getTelegramButtonText = () => {
    if (!isAuthenticated) return "Login via Telegram";
    if (user?.telegram?.username) return `@${user.telegram.username}`;
    return "Account";
  };

  const getTelegramButtonVariant = () =>
    isAuthenticated
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
      : "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:border-blue-400 hover:bg-blue-500/20";

  const getUsernameForAvatar = () => {
    if (user?.telegram?.username) return user.telegram.username;
    return user?.username || "unknown";
  };

  const getWalletButtonText = (address?: string) => {
    if (isLoggingIn) return "Signing...";

    if (isAuthenticated && loginMethod === "wallet" && isConnected) {
      return "Wallet";
    }

    if (
      isAuthenticated &&
      loginMethod === "telegram" &&
      isConnected &&
      walletValidation.isValid
    ) {
      return "Web3 Ready";
    }

    if (isAuthenticated && !walletValidation.isValid) {
      return "Switch Wallet";
    }

    if (isConnected && !isAuthenticated) {
      if (address) {
        const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
        return `${truncated} • Sign in`;
      }
      return "Sign in with Wallet";
    }

    return "Connect Wallet";
  };

  const getWalletButtonIcon = () => {
    if (isLoggingIn) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (isAuthenticated && loginMethod === "wallet" && isConnected) {
      return <ChevronDown className="h-4 w-4" />;
    }

    if (isConnected && !isAuthenticated) {
      return <ArrowRight className="h-4 w-4" />;
    }

    if (isAuthenticated && !walletValidation.isValid) {
      return <AlertTriangle className="h-4 w-4" />;
    }

    return <Wallet className="h-4 w-4" />;
  };

  const getWalletButtonVariant = () => {
    if (isAuthenticated && !walletValidation.isValid) {
      return "border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20";
    }

    if (
      (isAuthenticated && loginMethod === "wallet") ||
      (isAuthenticated &&
        loginMethod === "telegram" &&
        walletValidation.isValid)
    ) {
      return "border-green-500/30 bg-green-500/10 text-green-300 hover:border-green-400 hover:bg-green-500/20";
    }

    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20";
  };

  // Manual sign-in handler for Sidebar
  const handleSidebarManualSignIn = async () => {
    if (!isConnected) return;

    try {
      await manualSignIn();
      if (mobile && setMobileOpen) setMobileOpen(false);
    } catch (error) {
      console.error("Sidebar manual sign-in error:", error);
    }
  };

  const nav = [
    { to: "/", label: "Home", icon: <Home size={18} /> },
    { to: "/agreements", label: "Agreements", icon: <FileText size={18} /> },
    { to: "/escrow", label: "Escrow", icon: <BadgeDollarSign size={18} /> },
    { to: "/disputes", label: "Disputes", icon: <Scale size={18} /> },
    { to: "/voting", label: "Voting", icon: <Vote size={18} /> },
    { to: "/reputation", label: "Reputation", icon: <Star size={18} /> },
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
        "fixed top-0 left-0 z-40 h-[100vh] flex-col border-r border-white/10",
        "transition-all duration-200",
        expanded ? "w-64" : "w-16",
      )}
    >
      {/* Glow */}
      <div className="absolute top-[300px] right-0 rounded-full bg-cyan-500/30 blur-3xl lg:size-[20rem]" />

      {/* Header */}
      <div className="relative flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <img
            src={logo}
            alt="DexCourt Logo"
            className="size-10 object-contain"
          />
          {expanded && (
            <span className="glow-text font-semibold text-cyan-300">
              DexCourt
            </span>
          )}
        </div>

        {!mobile && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -right-4 rounded-md border border-white/20 p-1 hover:text-white"
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
            onClick={() => mobile && setMobileOpen?.(false)}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                "hover:bg-white/5",
                isActive
                  ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
                  : "text-foreground/80",
              )
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span
              className={cn(
                "transition-all",
                expanded
                  ? "translate-x-0 opacity-100"
                  : "w-0 -translate-x-4 overflow-hidden opacity-0",
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}

        {mobile && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            {/* Profile Link - Only show if authenticated */}
            {isAuthenticated && (
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen?.(false)}
                className={({ isActive }) =>
                  cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                    "hover:bg-white/5",
                    isActive
                      ? "bg-white/5 text-purple-200 ring-1 ring-purple-400/30"
                      : "text-foreground/80",
                  )
                }
              >
                <UserAvatar
                  userId={user?.id || ""}
                  avatarId={user?.avatarId || null}
                  username={getUsernameForAvatar()}
                  size="sm"
                  className="border-purple-400/40"
                />
                <span className="flex-1 truncate text-left font-medium">
                  My Profile
                </span>
                <ArrowRight className="h-4 w-4" />
              </NavLink>
            )}

            {/* Telegram Authentication Button */}
            <button
              onClick={handleTelegramAuth}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                getTelegramButtonVariant(),
              )}
            >
              <FaTelegramPlane className="h-4 w-4" />
              <span className="flex-1 truncate text-left font-medium">
                {getTelegramButtonText()}
              </span>
              {isAuthenticated && loginMethod === "telegram" ? (
                <LogOut className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
            </button>

            {/* WALLET — UPDATED WITH AUTO SIGN-IN LOGIC */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                mounted,
                openConnectModal,
                openAccountModal,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                // Case 1: Wallet connected AND authenticated with wallet
                if (isAuthenticated && loginMethod === "wallet" && connected) {
                  return (
                    <button
                      onClick={openAccountModal}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        getWalletButtonVariant(),
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span className="truncate">{account.displayName}</span>
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
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        getWalletButtonVariant(),
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span className="truncate">{account.displayName}</span>
                    </button>
                  );
                }

                // Connected wallet but not authenticated
                if (connected) {
                  return (
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          handleSidebarManualSignIn();
                        } else {
                          openAccountModal();
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        getWalletButtonVariant(),
                      )}
                    >
                      {getWalletButtonIcon()}
                      <span className="truncate">
                        {getWalletButtonText(account?.address)}
                      </span>
                    </button>
                  );
                }

                // Not connected
                return (
                  <button
                    onClick={openConnectModal}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      getWalletButtonVariant(),
                    )}
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="truncate">{getWalletButtonText()}</span>
                  </button>
                );
              }}
            </ConnectButton.Custom>
          </div>
        )}

        {/* Desktop profile button */}
        {!mobile && (
          <button
            onClick={handleProfileClick}
            className={cn(
              "group mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              "hover:bg-white/5",
              location.pathname === "/profile" && isAuthenticated
                ? "bg-white/5 text-cyan-200 ring-1 ring-cyan-400/30"
                : "text-foreground/80",
            )}
          >
            {isAuthenticated ? (
              <UserAvatar
                userId={user?.id ?? "anonymous"}
                avatarId={user?.avatarId || null}
                username={getUsernameForAvatar()}
                size="sm"
                className="border-cyan-400/40"
              />
            ) : (
              <LogIn size={18} />
            )}
            <span
              className={cn(
                expanded
                  ? "translate-x-0 opacity-100"
                  : "w-0 -translate-x-4 overflow-hidden opacity-0",
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
