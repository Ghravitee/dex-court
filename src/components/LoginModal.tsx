// src/components/LoginModal.tsx
import { useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [otp, setOtp] = useState("");
  const [activeTab, setActiveTab] = useState<"wallet" | "telegram">("wallet");
  const { login, isLoading } = useAuth();

  if (!isOpen) return null;

  const handleTelegramLogin = async () => {
    try {
      await login(otp);
      onClose();
      setOtp("");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Invalid or expired OTP. Please try again.");
    }
  };

  const handleWalletConnect = () => {
    // Implement wallet connection logic here
    console.log("Connect wallet clicked");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-cyan relative w-[90%] max-w-md rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="mb-4 text-lg font-semibold">Login to DexCourt</h3>
          <button onClick={onClose} className="text-cyan-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Tab Navigation */}
        <div className="mb-4 flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "wallet"
                ? "border-b-2 border-cyan-400 text-cyan-300"
                : "text-gray-400"
            }`}
          >
            Connect Wallet
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

        {/* Wallet Login */}
        {activeTab === "wallet" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Connect your wallet to access DexCourt features
            </p>
            <Button
              onClick={handleWalletConnect}
              className="w-full border border-cyan-400/40 bg-cyan-600/20 py-4 text-lg font-medium text-cyan-100 hover:bg-cyan-500/30"
            >
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Telegram Login */}
        {activeTab === "telegram" && (
          <div className="space-y-4">
            <label className="block text-sm text-gray-300">
              Enter your OTP from the DexCourt's Telegram bot:
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. xxxxxxxx-wmqDPP"
              className="w-full rounded-md border border-cyan-400/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-500/30 text-gray-300 hover:bg-gray-700/40"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTelegramLogin}
                className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
                disabled={isLoading || !otp.trim()}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
