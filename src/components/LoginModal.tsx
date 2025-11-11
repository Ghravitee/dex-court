// src/components/LoginModal.tsx - Major update
import { useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { X, Wallet, Loader2 } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { useWalletLogin } from "../hooks/useWalletLogin";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "login" | "link";
}

export function LoginModal({
  isOpen,
  onClose,
  mode = "login",
}: LoginModalProps) {
  const [otp, setOtp] = useState("");
  const [activeTab, setActiveTab] = useState<"wallet" | "telegram">("wallet");
  const { login, isLoading, linkTelegram } = useAuth();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // NEW: Use wallet login hook
  const {
    loginWithConnectedWallet,
    isLoggingIn,
    error: walletError,
    setError: setWalletError,
  } = useWalletLogin();

  const handleTelegramAction = async () => {
    try {
      if (mode === "link") {
        await linkTelegram(otp);
      } else {
        await login(otp);
      }
      onClose();
      setOtp("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`${mode === "link" ? "Linking" : "Login"} failed:`, error);

      const errorMessage = error.response?.data?.message || error.message;

      if (errorMessage.includes("expired")) {
        alert(
          "OTP has expired. Please generate a new one from the Telegram bot.",
        );
      } else if (errorMessage.includes("invalid")) {
        alert(
          "Invalid OTP format. Please copy the entire code from the Telegram bot.",
        );
      } else if (error.response?.status === 404) {
        alert(
          "Telegram bot not found. Please check the bot username: @DexCourtDVBot",
        );
      } else {
        alert(`Authentication failed: ${errorMessage}`);
      }
    }
  };

  // NEW: Handle wallet login
  const handleWalletLogin = async () => {
    if (!isConnected) {
      // Auto-connect if not connected
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    const success = await loginWithConnectedWallet();
    if (success) {
      onClose();
    }
  };

  const getModalTitle = () => {
    if (mode === "link") {
      return "Link Account";
    }
    return "Login to DexCourt";
  };

  const getTelegramButtonText = () => {
    if (mode === "link") {
      return isLoading ? "Linking..." : "Link Telegram";
    }
    return isLoading ? "Logging in..." : "Login";
  };

  const getWalletButtonText = () => {
    if (!isConnected) {
      return "Connect Wallet";
    }
    return isLoggingIn ? "Logging in..." : "Login with Wallet";
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setOtp("");
    setWalletError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-cyan relative w-[90%] max-w-md rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="mb-4 text-lg font-semibold">{getModalTitle()}</h3>
          <button
            onClick={handleClose}
            className="text-cyan-300 hover:text-white"
            disabled={isLoading || isLoggingIn}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 flex border-b border-white/10">
          <button
            onClick={() => {
              setActiveTab("wallet");
              setWalletError("");
            }}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "wallet"
                ? "border-b-2 border-cyan-400 text-cyan-300"
                : "text-gray-400"
            }`}
          >
            Wallet
          </button>
          <button
            onClick={() => setActiveTab("telegram")}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "telegram"
                ? "border-b-2 border-cyan-400 text-cyan-300"
                : "text-gray-400"
            }`}
          >
            Telegram
          </button>
        </div>

        {/* Wallet Login Section */}
        {activeTab === "wallet" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              {mode === "link"
                ? "Connect your wallet to link it to your account"
                : "Connect your wallet to login to your DexCourt account"}
            </p>

            {mode === "link" && isConnected ? (
              <div className="rounded-md border border-green-400/20 bg-green-500/10 p-3">
                <p className="text-sm text-green-300">
                  ✅ Wallet connected! Switch to Telegram tab to complete
                  linking.
                </p>
              </div>
            ) : (
              <>
                {walletError && (
                  <div className="rounded-md border border-red-400/20 bg-red-500/10 p-3">
                    <p className="text-sm text-red-300">{walletError}</p>
                  </div>
                )}

                <Button
                  onClick={handleWalletLogin}
                  disabled={isLoggingIn}
                  className="w-full border border-cyan-400/40 bg-cyan-600/20 py-4 text-lg font-medium text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-5 w-5" />
                      {getWalletButtonText()}
                    </>
                  )}
                </Button>

                {!isConnected && (
                  <p className="text-center text-sm text-cyan-300">
                    Click the button to connect your wallet and sign in
                  </p>
                )}

                {isConnected && !isLoggingIn && (
                  <p className="text-center text-sm text-gray-300">
                    You'll be asked to sign a message to verify ownership
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Telegram Section */}
        {activeTab === "telegram" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              {mode === "link"
                ? "Link your Telegram account to enable social features"
                : "To log in with Telegram, you need to have a Telegram username set first."}
            </p>

            <div className="rounded-md border border-cyan-400/20 bg-black/30 p-3">
              <p className="mb-2 text-sm font-semibold text-cyan-100">
                {mode === "link"
                  ? "Linking Instructions:"
                  : "First time users:"}
              </p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-gray-300">
                <li>
                  Go to Telegram{" "}
                  <span className="text-white">Settings → Edit Profile</span>
                </li>
                <li>Set your @username if you haven't already</li>
                <li>
                  Open{" "}
                  <a
                    href="https://t.me/DexCourtDVBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:underline"
                  >
                    @DexCourtDvBot
                  </a>{" "}
                  on Telegram
                </li>
                <li>
                  Type <span className="font-semibold text-white">/otp</span> to
                  get your one-time password
                </li>
              </ol>
            </div>

            <p className="text-sm text-gray-300">
              Paste the OTP you received below to{" "}
              {mode === "link"
                ? "link your account"
                : "verify and complete your registration"}
              .
            </p>

            <label className="block text-sm text-gray-300">
              Enter your OTP from DexCourt's Telegram bot:
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. xxxxxxxx-wmqDPP"
              className="w-full rounded-md border border-cyan-400/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              onKeyPress={(e) => {
                if (e.key === "Enter" && otp.trim()) {
                  handleTelegramAction();
                }
              }}
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-gray-500/30 text-gray-300 hover:bg-gray-700/40"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTelegramAction}
                className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
                disabled={isLoading || !otp.trim()}
              >
                {getTelegramButtonText()}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
