/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useWalletLogin.ts - FIXED SINGLE REQUEST VERSION
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAccount, useSignMessage } from "wagmi";

// Global ref to track auto sign-in across components
let globalLoginAttempted = false;
let globalLastWalletAddress: string | null = null;

export function useWalletLogin() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithWallet, generateLoginNonce, user, isAuthenticated } =
    useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Local refs for component-specific tracking
  const componentLoginAttemptedRef = useRef(false);
  const componentSignInPromiseRef = useRef<Promise<boolean> | null>(null);

  // Reset login attempt when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      globalLoginAttempted = false;
      globalLastWalletAddress = null;
      componentLoginAttemptedRef.current = false;
      componentSignInPromiseRef.current = null;
    }
  }, [isConnected]);

  // FIXED: Better wallet validation logic
  const validateWalletForUser = (): boolean => {
    if (!isAuthenticated || !user) {
      return true; // No user logged in, proceed normally with login/registration
    }

    // If user already has a linked wallet, they can only connect that specific wallet
    if (user.walletAddress && address) {
      const isMatchingWallet =
        user.walletAddress.toLowerCase() === address.toLowerCase();

      if (!isMatchingWallet) {
        setError(
          `This wallet is not linked to your account. Please connect your linked wallet: ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
        );
        return false;
      }
    }

    // If user doesn't have a linked wallet yet (Telegram user), allow any wallet connection
    // This will link the wallet to their existing Telegram account
    return true;
  };

  // SINGLE AUTO SIGN-IN FUNCTION with better coordination
  const autoSignIn = useCallback(async (): Promise<boolean> => {
    // Only proceed if wallet is connected and we have an address
    if (!isConnected || !address) {
      console.log("🔐 Auto sign-in: Wallet not connected");
      return false;
    }

    // Global check: prevent multiple components from triggering auto sign-in
    if (globalLoginAttempted && globalLastWalletAddress === address) {
      console.log(
        "🔐 Auto sign-in: Already attempted globally for this wallet",
      );
      return false;
    }

    // Component check: prevent this component from trying multiple times
    if (componentLoginAttemptedRef.current) {
      console.log("🔐 Auto sign-in: Already attempted in this component");
      return false;
    }

    // If already authenticated and wallet matches, skip
    if (isAuthenticated && user?.walletAddress) {
      if (user.walletAddress.toLowerCase() === address.toLowerCase()) {
        console.log("🔐 Auto sign-in: Already authenticated with this wallet");
        return true;
      }
    }

    // Mark that we're attempting login
    globalLoginAttempted = true;
    globalLastWalletAddress = address;
    componentLoginAttemptedRef.current = true;

    console.log("🔐 Starting auto sign-in for wallet:", address);

    setIsLoggingIn(true);
    setError(null);

    try {
      // Step 1: Get login nonce
      const nonce = await generateLoginNonce(address);
      console.log("🔐 Auto sign-in nonce received:", nonce);

      // Step 2: Sign the nonce
      const message = nonce;
      const signature = await signMessageAsync({ message });
      console.log("🔐 Auto sign-in signature generated:", signature);

      // Step 3: Verify and login (or register new account)
      await loginWithWallet(address, signature);
      console.log("🔐 Auto sign-in successful!");

      return true;
    } catch (error: any) {
      console.error("Auto sign-in failed:", error);
      handleWalletError(error);

      // Reset global state on error (but only for non-user errors)
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
    user,
    generateLoginNonce,
    signMessageAsync,
    loginWithWallet,
  ]);

  // Manual trigger for sign-in (when user explicitly clicks)
  const manualSignIn = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return false;
    }

    // Reset the attempt flags to allow manual sign-in
    globalLoginAttempted = false;
    componentLoginAttemptedRef.current = false;

    return await autoSignIn();
  };

  // Error handling
  const handleWalletError = (error: any) => {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to authenticate with wallet";

    // Handle existing user case
    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("already registered") ||
      errorMessage.includes("User already exists") ||
      errorMessage.includes("already have an account")
    ) {
      setError(
        "You already have an existing account. Please login with your registered method or use Telegram login.",
      );
    }
    // Handle wallet already linked case
    else if (
      errorMessage.includes("already linked") ||
      errorMessage.includes("Wallet already linked")
    ) {
      setError(
        "This wallet is already linked to another account. Please use a different wallet or login with your existing method.",
      );
    }
    // Handle invalid signature cases
    else if (
      errorMessage.includes("signature") ||
      errorMessage.includes("Signature") ||
      errorMessage.includes("invalid signature")
    ) {
      setError("Invalid signature. Please try again.");
    }
    // Handle nonce-related errors
    else if (
      errorMessage.includes("nonce") ||
      errorMessage.includes("Nonce") ||
      errorMessage.includes("expired")
    ) {
      setError("Session expired. Please try again.");
    }
    // Generic error
    else {
      setError(errorMessage);
    }
  };

  // FIXED: Better wallet validation status
  const getWalletValidationStatus = (): {
    isValid: boolean;
    message?: string;
    action: "login" | "link" | "verify";
  } => {
    if (!isAuthenticated || !user) {
      return { isValid: true, action: "login" };
    }

    // User is authenticated
    if (user.walletAddress) {
      // User has existing linked wallet
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
    } else {
      // User doesn't have linked wallet yet (Telegram user)
      return {
        isValid: true,
        action: "link",
        message: address
          ? "Click to link this wallet to your account"
          : "Connect a wallet to link it to your account",
      };
    }
  };

  return {
    autoSignIn,
    manualSignIn,
    isLoggingIn,
    error,
    setError,
    clearError: () => setError(null),
    isWalletConnected: isConnected,
    walletAddress: address,
    validateWalletForUser,
    getWalletValidationStatus,
    // Add these for tracking
    hasLoginAttempted: componentLoginAttemptedRef.current,
    resetLoginAttempt: () => {
      globalLoginAttempted = false;
      componentLoginAttemptedRef.current = false;
    },
  };
}
