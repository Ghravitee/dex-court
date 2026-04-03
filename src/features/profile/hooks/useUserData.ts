/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { formatUsername, formatWalletAddress } from "../utils/formatters";

export const useUserData = (user: any, trustScore: number) => {
  return useMemo(() => {
    const formatHandle = () => {
      if (user?.telegram?.username) {
        return `@${user.telegram.username}`;
      }
      if (user?.walletAddress) {
        return formatWalletAddress(user.walletAddress);
      }
      if (user?.username) {
        return formatUsername(user.username);
      }
      return "@you";
    };

    return {
      handle: formatHandle(),
      wallet: formatWalletAddress(user?.walletAddress),
      score: trustScore,
      roles: user?.roles || {
        admin: false,
        judge: false,
        community: false,
        user: true,
      },
      isVerified: user?.isVerified || false,
      stats: user?.stats || {
        deals: 0,
        agreements: 0,
        disputes: 0,
        revenue: { "7d": 0, "30d": 0, "90d": 0 },
      },
    };
  }, [user, trustScore]);
};
