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
      setError(error.message || "Failed to login with wallet");
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  return {
    loginWithConnectedWallet,
    isLoggingIn,
    error,
    setError,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
}
