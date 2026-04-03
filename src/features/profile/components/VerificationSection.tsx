/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../../../components/ui/button";
import { FiSend } from "react-icons/fi";
import { Wallet } from "lucide-react";
import { FaXTwitter, FaInstagram, FaTiktok } from "react-icons/fa6";
import { VerificationBadge } from "./VerificationBadge";
import { Tooltip } from "./Tooltip";

interface VerificationSectionProps {
  user: any;
  onLinkTelegram: () => void;
  onLinkWallet: () => void;
}

export const VerificationSection = ({
  user,
  onLinkTelegram,
  onLinkWallet,
}: VerificationSectionProps) => {
  const verifications = [
    {
      id: "telegram",
      icon: <FiSend className="h-5 w-5 text-cyan-300" />,
      label: "Telegram",
      value: user?.telegram?.username
        ? `@${user.telegram.username}`
        : "Not linked",
      isVerified: !!user?.telegram?.username,
      onConnect: onLinkTelegram,
    },
    {
      id: "wallet",
      icon: <Wallet className="h-5 w-5 text-cyan-300" />,
      label: "Wallet",
      value: user?.walletAddress
        ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`
        : "Not linked",
      isVerified: !!user?.walletAddress,
      onConnect: onLinkWallet,
    },
    {
      id: "twitter",
      icon: <FaXTwitter className="h-5 w-5 text-white" />,
      label: "Twitter",
      value: "@you_web3",
      isVerified: false,
      comingSoon: true,
    },
    {
      id: "instagram",
      icon: <FaInstagram className="h-5 w-5 text-pink-400" />,
      label: "Instagram",
      value: "Not linked",
      isVerified: false,
      comingSoon: true,
    },
    {
      id: "tiktok",
      icon: <FaTiktok className="h-5 w-5 text-gray-200" />,
      label: "TikTok",
      value: "Not linked",
      isVerified: false,
      comingSoon: true,
    },
  ];

  return (
    <section className="h-fit rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-4 lg:p-6">
      <div className="space text-muted-foreground mb-4 text-lg">
        Verifications
      </div>
      <div className="grid grid-cols-1 gap-6">
        {verifications.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 ${
              item.comingSoon ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  {item.label}
                  {item.isVerified && <VerificationBadge />}
                </div>
                <div className="text-muted-foreground text-xs">
                  {item.value}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.isVerified ? (
                <span className="text-xs text-green-400">✅ Linked</span>
              ) : item.comingSoon ? (
                <Tooltip content="Coming soon in v2">
                  <Button
                    variant="outline"
                    disabled
                    className="border-cyan-400/30 text-cyan-200"
                  >
                    Connect
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  onClick={item.onConnect}
                  variant="outline"
                  className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                >
                  Link
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
