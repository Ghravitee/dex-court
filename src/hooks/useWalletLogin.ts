/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAccount, useSignMessage } from "wagmi";
import { walletLinkingService } from "../services/walletLinkingService";

let globalLoginAttempted = false;
let globalLastWalletAddress: string | null = null;

export function useWalletLogin() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    loginWithWallet,
    generateLoginNonce,
    user,
    isAuthenticated,
    loginMethod,
  } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const componentLoginAttemptedRef = useRef(false);
  const componentSignInPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    if (!isConnected) {
      globalLoginAttempted = false;
      globalLastWalletAddress = null;
      componentLoginAttemptedRef.current = false;
      componentSignInPromiseRef.current = null;
    }
  }, [isConnected]);

  // ─── Link wallet to existing authenticated session ─────────────────────────
  const linkWalletToSession = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) return false;

    setIsLoggingIn(true);
    setError(null);

    try {
      console.log("🔗 Linking wallet to existing session:", address);

      // Step 1: Get linking nonce (uses auth header — session already exists)
      const { nonce } =
        await walletLinkingService.generateLinkingNonce(address);
      console.log("🔗 Linking nonce received");

      // Step 2: Sign the nonce
      const signature = await signMessageAsync({ message: nonce });
      console.log("🔗 Linking signature generated");

      // Step 3: Verify and link
      await walletLinkingService.verifyAndLinkWallet({
        walletAddress: address,
        signature,
      });

      console.log("🔗 Wallet linked successfully!");
      return true;
    } catch (error: any) {
      console.error("Wallet linking failed:", error);
      handleWalletError(error);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  }, [isConnected, address, signMessageAsync]);

  // ─── Auto sign-in — routes to link or login based on session state ─────────
  const autoSignIn = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      console.log("🔐 Auto sign-in: Wallet not connected");
      return false;
    }

    // Already authenticated via wallet with matching address — nothing to do
    if (isAuthenticated && loginMethod === "wallet" && user?.walletAddress) {
      if (user.walletAddress.toLowerCase() === address.toLowerCase()) {
        console.log("🔐 Auto sign-in: Already authenticated with this wallet");
        globalLoginAttempted = true;
        globalLastWalletAddress = address;
        componentLoginAttemptedRef.current = true;
        return true;
      }
    }

    // ─── Telegram user connecting a wallet → link, don't re-login ────────────
    if (isAuthenticated && loginMethod === "telegram") {
      // If wallet already linked and matches — nothing to do
      if (
        user?.walletAddress &&
        user.walletAddress.toLowerCase() === address.toLowerCase()
      ) {
        console.log("🔗 Wallet already linked to this TG account");
        return true;
      }

      // If wallet already linked but different — block it
      if (
        user?.walletAddress &&
        user.walletAddress.toLowerCase() !== address.toLowerCase()
      ) {
        setError(
          `A different wallet is already linked to your account. Please connect: ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
        );
        return false;
      }

      // No wallet linked yet — link this one
      console.log("🔗 TG user has no wallet linked — initiating link flow");
      return await linkWalletToSession();
    }

    // ─── Fresh login flow (no session) ────────────────────────────────────────
    if (globalLoginAttempted && globalLastWalletAddress === address) {
      console.log(
        "🔐 Auto sign-in: Already attempted globally for this wallet",
      );
      return false;
    }

    if (componentLoginAttemptedRef.current) {
      console.log("🔐 Auto sign-in: Already attempted in this component");
      return false;
    }

    globalLoginAttempted = true;
    globalLastWalletAddress = address;
    componentLoginAttemptedRef.current = true;

    console.log("🔐 Starting wallet login for:", address);
    setIsLoggingIn(true);
    setError(null);

    try {
      const nonce = await generateLoginNonce(address);
      const signature = await signMessageAsync({ message: nonce });
      await loginWithWallet(address, signature);
      console.log("🔐 Wallet login successful!");
      return true;
    } catch (error: any) {
      console.error("Auto sign-in failed:", error);
      handleWalletError(error);

      if (!error.message?.includes("User rejected")) {
        globalLoginAttempted = false;
        componentLoginAttemptedRef.current = false;
      }

      return false;
    } finally {
      setIsLoggingIn(false);
    }
  }, [
    isConnected,
    address,
    isAuthenticated,
    loginMethod,
    user,
    generateLoginNonce,
    signMessageAsync,
    loginWithWallet,
    linkWalletToSession,
  ]);

  // ─── Manual sign-in (explicit user action) ────────────────────────────────
  const manualSignIn = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return false;
    }

    globalLoginAttempted = false;
    componentLoginAttemptedRef.current = false;

    return await autoSignIn();
  };

  // ─── Error handling ───────────────────────────────────────────────────────
  const handleWalletError = (error: any) => {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to authenticate with wallet";

    if (
      errorMessage.includes("already linked") ||
      errorMessage.includes("Wallet already linked")
    ) {
      setError("This wallet is already linked to another account.");
    } else if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("already registered")
    ) {
      setError(
        "An account with this wallet already exists. Please login with your registered method.",
      );
    } else if (
      errorMessage.includes("signature") ||
      errorMessage.includes("invalid signature")
    ) {
      setError("Invalid signature. Please try again.");
    } else if (
      errorMessage.includes("nonce") ||
      errorMessage.includes("expired")
    ) {
      setError("Session expired. Please try again.");
    } else {
      setError(errorMessage);
    }
  };

  // ─── Wallet validation status ─────────────────────────────────────────────
  const getWalletValidationStatus = (): {
    isValid: boolean;
    message?: string;
    action: "login" | "link" | "verify";
  } => {
    if (!isAuthenticated || !user) {
      return { isValid: true, action: "login" };
    }

    if (user.walletAddress) {
      if (address) {
        const isMatching =
          user.walletAddress.toLowerCase() === address.toLowerCase();
        return {
          isValid: isMatching,
          message: isMatching
            ? undefined
            : `Please connect your linked wallet: ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
          action: "verify",
        };
      }
      return { isValid: true, action: "verify" };
    }

    // Telegram user with no wallet linked yet
    return {
      isValid: true,
      action: "link",
      message: address
        ? "Connect wallet to link it to your account"
        : "Connect a wallet to link it to your account",
    };
  };

  return {
    autoSignIn,
    manualSignIn,
    linkWalletToSession,
    isLoggingIn,
    error,
    setError,
    clearError: () => setError(null),
    isWalletConnected: isConnected,
    walletAddress: address,
    getWalletValidationStatus,
    hasLoginAttempted: componentLoginAttemptedRef.current,
    resetLoginAttempt: () => {
      globalLoginAttempted = false;
      componentLoginAttemptedRef.current = false;
    },
  };
}
