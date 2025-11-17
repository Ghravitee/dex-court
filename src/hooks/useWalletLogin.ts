// hooks/useWalletLogin.ts
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAccount, useSignMessage } from "wagmi";

export function useWalletLogin() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string>("");
  const { loginWithWallet, generateLoginNonce } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const loginWithConnectedWallet = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return false;
    }

    setIsLoggingIn(true);
    setError("");

    try {
      // Step 1: Get login nonce
      const nonceResponse = await generateLoginNonce(address);
      const nonce = nonceResponse;

      console.log("🔐 Login nonce received:", nonce);

      // Step 2: Sign ONLY the nonce
      const message = nonce;
      const signature = await signMessageAsync({ message });

      console.log("🔐 Login signature generated:", signature);

      // Step 3: Verify and login
      await loginWithWallet(address, signature);

      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Wallet login failed:", error);

      // Extract error message from different possible sources
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to login with wallet";

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

      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Helper function to clear errors
  const clearError = () => {
    setError("");
  };

  return {
    loginWithConnectedWallet,
    isLoggingIn,
    error,
    setError: clearError, // Expose clearError as setError for consistency
    clearError,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
}
