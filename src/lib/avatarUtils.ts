// lib/avatarUtils.ts
import { apiService } from "../services/apiService";

// Simple in-memory cache for avatar URLs
const avatarCache = new Map<string, string>();

// Utility function to preload specific avatars
export const preloadUserAvatar = async (
  userId: string,
  avatarId: number | null, // Accept null
): Promise<void> => {
  if (!avatarId) return; // Early return if null

  const cacheKey = `user-${userId}-avatar-${avatarId}`;

  if (avatarCache.has(cacheKey)) {
    return; // Already cached
  }

  try {
    const url = await apiService.getAvatar(userId, avatarId);
    if (url && typeof url === "string" && url.trim() !== "") {
      avatarCache.set(cacheKey, url);

      // Preload the image
      const img = new Image();
      img.src = url;
    }
  } catch (error) {
    console.error(`Failed to preload avatar for user ${userId}:`, error);
  }
};

// Utility function to clear cache (useful after avatar updates)
export const clearAvatarCache = (userId?: string, avatarId?: number | null) => {
  if (userId && avatarId) {
    const cacheKey = `user-${userId}-avatar-${avatarId}`;
    avatarCache.delete(cacheKey);
  } else if (userId) {
    // Clear all avatars for this user
    for (const key of avatarCache.keys()) {
      if (key.startsWith(`user-${userId}-avatar-`)) {
        avatarCache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    avatarCache.clear();
  }
};

// Export cache for internal use (not for direct external use)
export const getAvatarCache = () => avatarCache;
