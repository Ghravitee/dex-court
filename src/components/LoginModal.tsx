// src/components/LoginModal.tsx - IMPROVED VERSION
import { useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import { X, Wallet, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
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
  const { login, isLoading, linkTelegram, user } = useAuth();
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const {
    loginWithConnectedWallet,
    isLoggingIn,
    error: walletError,
    setError: setWalletError,
  } = useWalletLogin();

  // In LoginModal.tsx - Replace the handleTelegramAction function
  const handleTelegramAction = async () => {
    if (!otp.trim()) {
      alert("Please enter your OTP");
      return;
    }

    try {
      console.log("🔐 Starting Telegram authentication...");

      if (mode === "link") {
        await linkTelegram(otp);
        console.log("🔐 Telegram linking successful");
      } else {
        await login(otp);
        console.log("🔐 Telegram login successful");
      }

      onClose();
      setOtp("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`${mode === "link" ? "Linking" : "Login"} failed:`, error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Authentication failed";

      // Handle specific error cases
      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("already registered") ||
        errorMessage.includes("User already exists")
      ) {
        alert("You already have an existing account. Please login instead.");
        return;
      }

      if (errorMessage.includes("expired")) {
        alert(
          "OTP has expired. Please generate a new one from the Telegram bot.",
        );
      } else if (
        errorMessage.includes("invalid") ||
        errorMessage.includes("Invalid OTP")
      ) {
        alert(
          "Invalid OTP format. Please copy the entire code from the Telegram bot.",
        );
      } else if (error.response?.status === 404) {
        alert(
          "Telegram bot not found. Please check the bot username: @DexCourtDVBot",
        );
      } else if (
        errorMessage.includes("401") ||
        errorMessage.includes("unauthorized")
      ) {
        alert("Authentication failed. Please check your OTP and try again.");
      } else {
        alert(`Authentication failed: ${errorMessage}`);
      }
    }
  };

  // src/components/LoginModal.tsx - Add this check before wallet login
  // In LoginModal.tsx - Update handleWalletLogin
  const handleWalletLogin = async () => {
    if (!isConnected) {
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    // NEW: For linking mode, validate wallet matches before proceeding
    if (mode === "link" && user?.walletAddress && address) {
      if (user.walletAddress.toLowerCase() !== address.toLowerCase()) {
        setWalletError();
        return;
      }
    }

    const success = await loginWithConnectedWallet();
    if (success) {
      onClose();
    }
  };

  // Update the wallet section text to be clearer
  <p className="text-sm text-gray-300">
    {mode === "link"
      ? "Connect your wallet to link it to your account"
      : "Connect your wallet to access DexCourt. We'll automatically find your existing account or create a new one."}
  </p>;

  const getModalTitle = () => {
    if (mode === "link") {
      return "Link Account";
    }
    return "DexCourt - Justice for Web3";
  };

  const getTelegramButtonText = () => {
    if (mode === "link") {
      return isLoading ? "Linking..." : "Link Telegram";
    }
    return isLoading ? "Continuing..." : "Continue with Telegram";
  };

  // NEW: Better wallet button text that shows progress
  const getWalletButtonText = () => {
    if (!isConnected) {
      return "Connect Wallet LoginModal";
    }
    if (isLoggingIn) {
      return "Signing Message...";
    }
    return "Verify Ownership";
  };

  // Replace the renderWalletProgress function with this:
  const renderWalletProgress = () => {
    return (
      <div className="mb-4 space-y-3">
        {/* Step 1: Connect Wallet */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              isConnected
                ? "bg-green-500 text-white"
                : "border-2 border-cyan-400 text-cyan-400"
            }`}
          >
            {isConnected ? <CheckCircle2 className="h-4 w-4" /> : "1"}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm ${isConnected ? "text-green-400" : "text-gray-300"}`}
            >
              Connect your wallet
            </p>
            {isConnected && (
              <p className="text-xs text-green-300">Connected ✓</p>
            )}
          </div>
        </div>

        {/* Step 2: Verify Ownership */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              isConnected
                ? "border-2 border-amber-400 text-amber-400"
                : "border-2 border-gray-500 text-gray-500"
            }`}
          >
            2
          </div>
          <div className="flex-1">
            <p
              className={`text-sm ${isConnected ? "text-amber-300" : "text-gray-500"}`}
            >
              Verify ownership
            </p>
            {isConnected && (
              <p className="text-xs text-amber-200">
                Click below to sign message
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setOtp("");
    setWalletError();
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
              setWalletError();
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

        {/* Wallet Section */}
        {activeTab === "wallet" && (
          <div className="space-y-4">
            {/* NEW: Show current user's linked wallet info */}
            {mode === "link" && user?.walletAddress && (
              <div className="rounded-md border border-amber-400/20 bg-amber-500/10 p-3">
                <p className="text-sm font-medium text-amber-300">
                  Your Linked Wallet
                </p>
                <p className="font-mono text-xs text-amber-200">
                  {user.walletAddress}
                </p>
                <p className="mt-1 text-xs text-amber-200">
                  You can only connect this wallet to your account.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-300">
              {mode === "link"
                ? user?.walletAddress
                  ? "Reconnect your linked wallet to verify ownership"
                  : "Connect your wallet to link it to your account"
                : "Connect your wallet to access DexCourt. We'll automatically find your existing account or create a new one."}
            </p>

            {/* NEW: Progress Indicator */}
            {renderWalletProgress()}

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

                {/* NEW: Connected wallet info */}
                {isConnected && address && (
                  <div className="rounded-md border border-cyan-400/20 bg-cyan-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-cyan-300">
                          Wallet Connected ✅
                        </p>
                        <p className="text-xs text-cyan-200">
                          {address.slice(0, 6)}...{address.slice(-4)}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
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
                      {getWalletButtonText()}
                    </>
                  ) : (
                    <>
                      {!isConnected ? (
                        <>
                          <Wallet className="mr-2 h-5 w-5" />
                          {getWalletButtonText()}
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-5 w-5" />
                          {getWalletButtonText()}
                        </>
                      )}
                    </>
                  )}
                </Button>

                {/* NEW: Dynamic help text based on connection state */}
                {!isConnected ? (
                  <div className="rounded-md border border-cyan-400/20 bg-cyan-500/10 p-3">
                    <p className="text-center text-sm text-cyan-300">
                      <strong>Step 1:</strong> Click "Connect Wallet LoginModal" to link
                      your wallet
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-amber-400/20 bg-amber-500/10 p-3">
                    <p className="text-center text-sm text-amber-300">
                      <strong>Step 2:</strong> Click "Verify Ownership" to sign
                      a message and complete authentication
                    </p>
                    <p className="mt-1 text-center text-xs text-amber-200">
                      This proves you own the wallet and keeps your account
                      secure
                    </p>
                  </div>
                )}

                {/* Connection status info */}
                {isConnected && !isLoggingIn && (
                  <div className="text-center">
                    <p className="text-sm text-gray-300">
                      Almost there! One more step to verify ownership.
                    </p>
                  </div>
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
                : "Login or register with Telegram. If you have an existing account, we'll automatically log you in."}
            </p>

            <div className="rounded-md border border-cyan-400/20 bg-black/30 p-3">
              <p className="mb-2 text-sm font-semibold text-cyan-100">
                How to get started:
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
              {mode === "link" ? "link your account" : "continue"}.
              <br />
              <span className="text-cyan-300">
                We'll automatically detect if you have an existing account.
              </span>
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
                onClick={handleTelegramAction}
                className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
                disabled={isLoading || !otp.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "link" ? "Linking..." : "Authenticating..."}
                  </>
                ) : (
                  getTelegramButtonText()
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
