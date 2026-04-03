/* eslint-disable @typescript-eslint/no-explicit-any */
import { type UserProfileData } from "../types";
import { formatWalletAddress } from "./formatters";

export const mapApiUserToUser = (apiUser: any): UserProfileData => {
  const getRolesFromRoleNumber = (role: number, isAdmin: boolean) => {
    return {
      admin: isAdmin,
      judge: role === 2,
      community: role === 1,
      user: true,
    };
  };

  const roles = getRolesFromRoleNumber(
    apiUser.role || 0,
    apiUser.isAdmin || false,
  );
  const apiUrl = import.meta.env.VITE_API_URL;

  const avatarUrl =
    apiUser.avatarId && apiUser.id
      ? `${apiUrl}/accounts/${apiUser.id}/file/${apiUser.avatarId}`
      : undefined;

  const primaryUsername = apiUser.telegram?.username
    ? `@${apiUser.telegram.username}`
    : `@${apiUser.username || "user"}`;

  return {
    id: apiUser.id.toString(),
    username: apiUser.telegram?.username || apiUser.username || "",
    bio: apiUser.bio || null,
    isVerified: apiUser.isVerified,
    isAdmin: apiUser.isAdmin || false,
    telegram: apiUser.telegram
      ? {
          username: apiUser.telegram.username,
          id: apiUser.telegram.id,
        }
      : undefined,
    walletAddress: apiUser.walletAddress,
    role: apiUser.role || 0,
    avatarId: apiUser.avatarId || null,
    handle: primaryUsername,
    wallet: formatWalletAddress(apiUser.walletAddress),
    trustScore: 0,
    roles,
    stats: {
      deals: 0,
      agreements: 0,
      disputes: 0,
      revenue: { "7d": 0, "30d": 0, "90d": 0 },
    },
    joinedDate: new Date().toISOString().split("T")[0],
    avatarUrl: avatarUrl,
  };
};
