import { useQuery } from "@tanstack/react-query";
import {
  fetchMyAccount,
  fetchAccountById,
  fetchAccountByUsername,
  fetchAccountByWalletAddress,
} from "../../../services/accountService";
import { mapApiUserToUser } from "../utils/userMapper";
import { resolveHandleType, cleanHandle } from "../utils/resolveHandle";
import type { UserProfileData } from "../types";

// Query key includes both handle and isOwnProfile so switching between
// "my profile" and "another user's profile" correctly triggers separate fetches.
const userProfileKey = (handle: string, isOwnProfile: boolean) =>
  ["userProfile", handle, isOwnProfile] as const;

async function fetchUserByHandle(
  decodedHandle: string,
  isOwnProfile: boolean,
): Promise<UserProfileData> {
  const type = resolveHandleType(decodedHandle, isOwnProfile);
  const handle = cleanHandle(decodedHandle);

  switch (type) {
    case "own": {
      const apiUser = await fetchMyAccount();
      return mapApiUserToUser(apiUser);
    }
    case "wallet": {
      // Try wallet lookup first, fall back to username — backend gap (no dedicated wallet endpoint)
      try {
        const apiUser = await fetchAccountByWalletAddress(handle);
        return mapApiUserToUser(apiUser);
      } catch {
        const apiUser = await fetchAccountByUsername(handle);
        return mapApiUserToUser(apiUser);
      }
    }
    case "id": {
      const apiUser = await fetchAccountById(handle);
      return mapApiUserToUser(apiUser);
    }
    case "username": {
      const apiUser = await fetchAccountByUsername(handle);
      return mapApiUserToUser(apiUser);
    }
  }
}

export function useUserLoader(decodedHandle: string, isOwnProfile: boolean) {
  const isLoggedIn = !!localStorage.getItem("authToken");

  return useQuery({
    queryKey: userProfileKey(decodedHandle, isOwnProfile),
    queryFn: () => fetchUserByHandle(decodedHandle, isOwnProfile),
    enabled: !!decodedHandle && isLoggedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
