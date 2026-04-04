import { useState, useCallback } from "react";
import { apiService } from "../../../services/apiService";
import { type UserProfileData } from "../types";
import { mapApiUserToUser } from "../utils/userMapper";

export const useUserLoader = () => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(
    async (decodedHandle: string, isOwnProfile: boolean) => {
      if (!decodedHandle) {
        setError("No user handle provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let userData: UserProfileData | null = null;

        if (isOwnProfile) {
          console.log("🔐 Loading current user's profile");
          const apiUser = await apiService.getMyAccount();
          userData = mapApiUserToUser(apiUser);
        } else {
          const cleanHandle = decodedHandle.replace(/^@/, "");
          const isWalletAddress = /^0x[a-fA-F0-9]{40}$/.test(cleanHandle);
          const isNumericId = !isNaN(Number(cleanHandle));

          if (isWalletAddress) {
            console.log(
              `🔐 Handle appears to be wallet address: ${cleanHandle}`,
            );

            try {
              const apiUser =
                await apiService.getUserByWalletAddress(cleanHandle);
              userData = mapApiUserToUser(apiUser);
            } catch (walletError) {
              console.log("🔐 Wallet address lookup failed:", walletError);
              try {
                const apiUser = await apiService.getUserByUsername(cleanHandle);
                userData = mapApiUserToUser(apiUser);
              } catch (usernameError) {
                console.log("🔐 Username lookup also failed:", usernameError);
                throw new Error(
                  `User with wallet address ${cleanHandle} not found`,
                );
              }
            }
          } else if (isNumericId) {
            console.log(`🔐 Handle appears to be numeric ID: ${cleanHandle}`);
            try {
              const apiUser = await apiService.getUserById(cleanHandle);
              userData = mapApiUserToUser(apiUser);
            } catch (idError) {
              console.log("🔐 ID lookup failed:", idError);
              throw new Error(`User with ID ${cleanHandle} not found`);
            }
          } else {
            console.log(`🔐 Handle appears to be username: ${cleanHandle}`);
            try {
              const apiUser = await apiService.getUserByUsername(cleanHandle);
              userData = mapApiUserToUser(apiUser);
            } catch (usernameError) {
              console.log("🔐 Username lookup failed:", usernameError);
              throw new Error(`User "${cleanHandle}" not found`);
            }
          }
        }

        setUser(userData);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user profile",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    user,
    loading,
    error,
    loadUserData,
    setUser,
  };
};
