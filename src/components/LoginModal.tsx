/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/LoginModal.tsx - FIXED WITH CLEAR SIGN MESSAGING
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";
import { X, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
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
  const { login, isLoading, linkTelegram, user, isAuthenticated, loginMethod } =
    useAuth();
  const { isConnected, address } = useAccount();

  const {
    manualSignIn,
    isLoggingIn,
    error: walletError,
    setError: setWalletError,
  } = useWalletLogin();

  // Close modal when user becomes authenticated (after auto sign-in)
  useEffect(() => {
    if (isOpen && isAuthenticated && activeTab === "wallet") {
      console.log("🔐 [Modal] User authenticated, closing modal...");
      // Small delay to show success state before closing
      const timer = setTimeout(() => {
        onClose();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isAuthenticated, activeTab, onClose]);

  // Only handle auto sign-in if modal opens with wallet already connected
  useEffect(() => {
    if (isOpen && activeTab === "wallet" && isConnected && address) {
      console.log(
        "🔐 [Modal] Wallet already connected, showing auto sign-in status",
      );
    }
  }, [isOpen, activeTab, isConnected, address]);

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
    } catch (error: any) {
      console.error(`${mode === "link" ? "Linking" : "Login"} failed:`, error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Authentication failed";

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
      } else {
        alert(`Authentication failed: ${errorMessage}`);
      }
    }
  };

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

  const renderWalletProgress = () => {
    const isSuccess =
      isAuthenticated &&
      (loginMethod === "wallet" || (loginMethod === "telegram" && isConnected));

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
              isSuccess
                ? "bg-green-500 text-white"
                : isLoggingIn
                  ? "animate-pulse border-2 border-amber-400 text-amber-400"
                  : isConnected && !isLoggingIn
                    ? "border-2 border-green-400 text-green-400"
                    : "border-2 border-gray-500 text-gray-500"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isLoggingIn ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "2"
            )}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm ${
                isSuccess
                  ? "text-green-300"
                  : isLoggingIn
                    ? "text-amber-300"
                    : isConnected && !isLoggingIn
                      ? "text-green-300"
                      : "text-gray-500"
              }`}
            >
              {isSuccess
                ? "Signed In Successfully!"
                : isLoggingIn
                  ? "Signing Message..."
                  : "Verify Ownership"}
            </p>
            {isSuccess ? (
              <p className="text-xs text-green-200">
                Authentication complete! ✓
              </p>
            ) : isLoggingIn ? (
              <p className="text-xs text-amber-200">
                Please approve the signature in your wallet...
              </p>
            ) : isConnected && !isLoggingIn ? (
              <p className="text-xs text-green-200">
                You'll be prompted to sign a message ✓
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setOtp("");
    setWalletError(null);
    onClose();
  };

  // Check if authentication was successful
  const isAuthSuccess =
    isAuthenticated &&
    (loginMethod === "wallet" || (loginMethod === "telegram" && isConnected));

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
              setWalletError(null);
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
                : "Connect your wallet to access DexCourt. You'll be prompted to sign a message to verify ownership."}
            </p>

            {/* Progress Indicator */}
            {renderWalletProgress()}

            {walletError && (
              <div className="rounded-md border border-red-400/20 bg-red-500/10 p-3">
                <p className="text-sm text-red-300">{walletError}</p>
              </div>
            )}

            {/* Connected wallet info */}
            {isConnected && address && (
              <div
                className={`rounded-md border p-3 ${
                  isAuthSuccess
                    ? "border-green-400/20 bg-green-500/10"
                    : "border-cyan-400/20 bg-cyan-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isAuthSuccess ? "text-green-300" : "text-cyan-300"
                      }`}
                    >
                      Wallet Connected{" "}
                      {isAuthSuccess ? "✅" : isLoggingIn ? "⏳" : "✅"}
                    </p>
                    <p
                      className={`text-xs ${
                        isAuthSuccess ? "text-green-200" : "text-cyan-200"
                      }`}
                    >
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                  {isAuthSuccess ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    !isLoggingIn && (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    )
                  )}
                </div>
                {isLoggingIn && (
                  <p className="mt-2 text-xs text-amber-300">
                    Waiting for signature approval in your wallet...
                  </p>
                )}
                {isAuthSuccess && (
                  <p className="mt-2 text-xs text-green-300">
                    ✅ Authentication successful! Closing...
                  </p>
                )}
              </div>
            )}

            {!isAuthSuccess && (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => {
                  const ready = mounted;

                  return (
                    <Button
                      disabled={!ready || isLoggingIn}
                      onClick={openConnectModal}
                      className="w-full border border-cyan-400/40 bg-cyan-600/20 py-4 text-lg font-medium text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing Message...
                        </>
                      ) : !isConnected ? (
                        <>
                          <Wallet className="mr-2 h-5 w-5" />
                          Connect Wallet
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Wallet Connected
                        </>
                      )}
                    </Button>
                  );
                }}
              </ConnectButton.Custom>
            )}

            {/* Manual sign-in button for when auto sign-in fails */}
            {isConnected && !isLoggingIn && walletError && !isAuthSuccess && (
              <Button
                onClick={async () => {
                  const success = await manualSignIn();
                  if (success) onClose();
                }}
                className="w-full border border-amber-400/40 bg-amber-600/20 py-3 text-sm font-medium text-amber-100 hover:bg-amber-500/30"
              >
                Try Manual Sign-In
              </Button>
            )}

            {/* Dynamic help text */}
            {!isConnected ? (
              <div className="rounded-md border border-cyan-400/20 bg-cyan-500/10 p-3">
                <p className="text-center text-sm text-cyan-300">
                  <strong>Step 1:</strong> Click "Connect Wallet" to link your
                  wallet
                </p>
                <p className="mt-1 text-center text-xs text-cyan-200">
                  You'll be prompted to sign a message after connection
                </p>
              </div>
            ) : !isAuthSuccess ? (
              <div className="rounded-md border border-green-400/20 bg-green-500/10 p-3">
                <p className="text-center text-sm text-green-300">
                  <strong>Step 2:</strong> Sign message to verify ownership
                </p>
                <p className="mt-1 text-center text-xs text-green-200">
                  Check your wallet for a signature request
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-green-400/20 bg-green-500/10 p-3">
                <p className="text-center text-sm text-green-300">
                  <strong>Success!</strong> You're now authenticated
                </p>
                <p className="mt-1 text-center text-xs text-green-200">
                  The modal will close automatically...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Telegram Section */}
        {activeTab === "telegram" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              {mode === "link"
                ? "Link your Telegram account to enable social features"
                : "Login or register with Telegram."}
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
