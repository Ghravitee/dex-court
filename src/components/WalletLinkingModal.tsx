/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/WalletLinkingModal.tsx
import { useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import { X, Loader2 } from "lucide-react";
import { useAccount, useSignMessage } from "wagmi";

interface WalletLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WalletLinkingModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletLinkingModalProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string>("");
  const { linkWallet, generateLinkingNonce, user } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // In WalletLinkingModal.tsx - Update the signing part
  const handleLinkWallet = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLinking(true);
    setError("");

    try {
      // Step 1: Get nonce for linking
      const nonce = await generateLinkingNonce(address);

      // Step 2: Sign the nonce with proper EIP-191 format
      const message = nonce;

      const signature = await signMessageAsync({
        message,
      });

      // Step 3: Verify and link
      await linkWallet(address, signature);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Wallet linking failed:", error);
      setError(error.message || "Failed to link wallet");
    } finally {
      setIsLinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-cyan relative w-[90%] max-w-md rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="mb-4 text-lg font-semibold">Link Wallet to Account</h3>
          <button
            onClick={onClose}
            className="text-cyan-300 hover:text-white"
            disabled={isLinking}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Link your wallet address to your account to enable wallet-based
            features.
          </p>

          {user?.walletAddress ? (
            <div className="rounded-md border border-green-400/20 bg-green-500/10 p-3">
              <p className="text-sm text-green-300">
                ✅ Wallet already linked: {user.walletAddress}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-cyan-400/20 bg-black/30 p-3">
                <p className="mb-2 text-sm font-semibold text-cyan-100">
                  Current Status:
                </p>
                <div className="text-sm text-gray-300">
                  <div>
                    • Telegram:{" "}
                    {user?.telegram?.username
                      ? `@${user.telegram.username}`
                      : "Not linked"}
                  </div>
                  <div>• Wallet: Not linked</div>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-400/20 bg-red-500/10 p-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <Button
                onClick={handleLinkWallet}
                disabled={isLinking || !isConnected}
                className="w-full border border-cyan-400/40 bg-cyan-600/20 py-4 text-lg font-medium text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking Wallet...
                  </>
                ) : (
                  "Link Connected Wallet"
                )}
              </Button>

              {!isConnected && (
                <p className="text-center text-sm text-yellow-300">
                  Please connect your wallet first using the connect button in
                  the top bar
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
