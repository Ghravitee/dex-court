// hooks/useWalletAuthSync.ts
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "./useAuth";
import { useWalletLogin } from "./useWalletLogin";

export function useWalletAuthSync() {
  const { isConnected, address } = useAccount();

  const { isAuthenticated, user, loginMethod, logout } = useAuth();
  const { loginWithConnectedWallet, isLoggingIn } = useWalletLogin();

  // Auto-login when wallet connects and user is not authenticated
  useEffect(() => {
    const handleAutoLogin = async () => {
      // Only auto-login if:
      // 1. Wallet is connected
      // 2. User is not already authenticated
      // 3. Not currently logging in
      // 4. Has a valid address
      if (isConnected && address && !isAuthenticated && !isLoggingIn) {
        try {
          console.log("🔄 Auto-login triggered on wallet connection");
          await loginWithConnectedWallet();
        } catch (error) {
          console.error("Auto-login failed:", error);
          // Don't disconnect on failure, let user retry manually
        }
      }
    };

    // Add a small delay to ensure RainbowKit state is stable
    const timeoutId = setTimeout(handleAutoLogin, 500);
    return () => clearTimeout(timeoutId);
  }, [
    isConnected,
    address,
    isAuthenticated,
    isLoggingIn,
    loginWithConnectedWallet,
  ]);

  // Handle wallet disconnection
  useEffect(() => {
    if (!isConnected && isAuthenticated && loginMethod === "wallet") {
      // If user logged in via wallet and wallet disconnects, log them out
      console.log("🔌 Wallet disconnected, logging out");
      logout();
    }
  }, [isConnected, isAuthenticated, loginMethod, logout]);

  // Verify wallet matches when user changes wallet
  useEffect(() => {
    if (isAuthenticated && user?.walletAddress && address) {
      const isMatchingWallet =
        user.walletAddress.toLowerCase() === address.toLowerCase();

      if (!isMatchingWallet && loginMethod === "wallet") {
        console.log("⚠️ Wallet changed, logging out");
        logout();
      }
    }
  }, [address, isAuthenticated, user?.walletAddress, loginMethod, logout]);

  return {
    isConnected,
    address,
    isAuthenticated,
    loginMethod,
    isLoggingIn,
    shouldAutoLogin: isConnected && !isAuthenticated && !isLoggingIn,
  };
}
