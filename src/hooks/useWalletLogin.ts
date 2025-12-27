/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useWalletLogin.ts - COMPLETELY FIXED VERSION
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAccount, useSignMessage } from "wagmi";

export function useWalletLogin() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithWallet, generateLoginNonce, user, isAuthenticated } =
    useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

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

  const loginWithConnectedWallet = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return false;
    }

    // NEW: For authenticated users, we're linking wallet to existing account
    if (isAuthenticated && user) {
      // This is a wallet linking flow for existing users (especially Telegram users)
      return await linkWalletToExistingAccount();
    }

    // Original login flow for unauthenticated users
    return await performWalletLogin();
  };

  // FIXED: Wallet linking for existing users
  const linkWalletToExistingAccount = async (): Promise<boolean> => {
    setIsLoggingIn(true);
    setError("");

    try {
      console.log(
        "🔐 Starting wallet linking for existing user:",
        user?.username,
      );

      // Step 1: Get nonce for linking
      const nonceResponse = await generateLoginNonce(address!);
      const nonce = nonceResponse;

      console.log("🔐 Linking nonce received:", nonce);

      // Step 2: Sign the nonce
      const message = nonce;
      const signature = await signMessageAsync({ message });

      console.log("🔐 Linking signature generated:", signature);

      // Step 3: This will link the wallet to the existing account
      await loginWithWallet(address!, signature);

      console.log("🔐 Wallet successfully linked to existing account");
      return true;
    } catch (error: any) {
      console.error("Wallet linking failed:", error);
      handleWalletError(error);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Wallet login for new users
  const performWalletLogin = async (): Promise<boolean> => {
    setIsLoggingIn(true);
    setError("");

    try {
      // Step 1: Get login nonce
      const nonceResponse = await generateLoginNonce(address!);
      const nonce = nonceResponse;

      console.log("🔐 Login nonce received:", nonce);

      // Step 2: Sign ONLY the nonce
      const message = nonce;
      const signature = await signMessageAsync({ message });

      console.log("🔐 Login signature generated:", signature);

      // Step 3: Verify and login (or register new account)
      await loginWithWallet(address!, signature);

      return true;
    } catch (error: any) {
      console.error("Wallet login failed:", error);
      handleWalletError(error);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
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
    loginWithConnectedWallet,
    isLoggingIn,
    error,
    setError, // ✅ allow message input
    clearError: () => setError(null),
    isWalletConnected: isConnected,
    walletAddress: address,
    validateWalletForUser,
    getWalletValidationStatus,
  };
}
