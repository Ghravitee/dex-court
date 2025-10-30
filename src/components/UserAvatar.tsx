// components/UserAvatar.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { getAvatarCache, clearAvatarCache } from "../lib/avatarUtils";
import {
  avatarUrlCache,
  pendingRequests,
  preloadedImages,
  getFallbackColor,
  getInitials,
} from "../lib/avatarCache";

interface UserAvatarProps {
  userId: string;
  avatarId: number | null;
  username: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

export function UserAvatar({
  userId,
  avatarId,
  username,
  size = "md",
  className = "",
  priority = false,
}: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user: currentUser } = useAuth();
  const imageRef = useRef<HTMLImageElement>(null);
  const mountedRef = useRef(true);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-12 w-12 text-xs",
    xl: "h-14 w-14 text-xs",
  };

  // Memoize derived values
  const cacheKey = useMemo(
    () => (avatarId ? `user-${userId}-avatar-${avatarId}` : null),
    [userId, avatarId],
  );

  // Memoize expensive calculations
  const fallbackColor = useMemo(() => getFallbackColor(username), [username]);
  const initials = useMemo(() => getInitials(username), [username]);

  // Optimized avatar loading function
  const loadAvatar = useCallback(async () => {
    if (!avatarId || !cacheKey) {
      return null;
    }

    // Check memory cache first
    if (avatarUrlCache.has(cacheKey)) {
      return avatarUrlCache.get(cacheKey)!;
    }

    // Check if request is already in progress
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    // Check localStorage cache
    const avatarCache = getAvatarCache();
    if (avatarCache.has(cacheKey)) {
      const cachedUrl = avatarCache.get(cacheKey);
      // Quick validation without HEAD request (too expensive)
      if (cachedUrl && cachedUrl.startsWith("http")) {
        avatarUrlCache.set(cacheKey, cachedUrl);
        return cachedUrl;
      }
    }

    // Use current user's avatar if available
    if (currentUser?.id === userId && currentUser?.avatarUrl) {
      avatarUrlCache.set(cacheKey, currentUser.avatarUrl);
      avatarCache.set(cacheKey, currentUser.avatarUrl);
      return currentUser.avatarUrl;
    }

    // Make API request
    const request = (async () => {
      try {
        const url = await apiService.getAvatar(userId, avatarId);

        if (url && typeof url === "string" && url.trim() !== "") {
          // Cache the successful response
          avatarUrlCache.set(cacheKey, url);
          avatarCache.set(cacheKey, url);
          return url;
        } else {
          throw new Error("Invalid avatar URL");
        }
      } catch (error) {
        // Clear cache on error
        avatarUrlCache.delete(cacheKey);
        avatarCache.delete(cacheKey);
        throw error;
      } finally {
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
  }, [userId, avatarId, cacheKey, currentUser]);

  // Preload image function
  const preloadImage = useCallback((url: string) => {
    if (preloadedImages.has(url)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        preloadedImages.add(url);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Preload failed for avatar: ${url}`);
        resolve(); // Don't reject, just continue
      };
    });
  }, []);

  // Main effect for loading avatar
  useEffect(() => {
    mountedRef.current = true;

    const loadAvatarData = async () => {
      if (!avatarId || !cacheKey) {
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const url = await loadAvatar();

        if (mountedRef.current && url) {
          setAvatarUrl(url);

          // Preload image in background
          if (!url.startsWith("blob:")) {
            preloadImage(url).then(() => {
              if (mountedRef.current) {
                setImageLoaded(true);
              }
            });
          } else {
            setImageLoaded(true);
          }
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error(`Failed to load avatar for user ${username}:`, error);
          setError(true);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadAvatarData();

    return () => {
      mountedRef.current = false;
    };
  }, [avatarId, cacheKey, username, loadAvatar, preloadImage]);

  // Handle image load errors
  const handleImageError = useCallback(() => {
    setError(true);
    if (cacheKey) {
      // Remove from caches on error
      avatarUrlCache.delete(cacheKey);
      const avatarCache = getAvatarCache();
      avatarCache.delete(cacheKey);
      clearAvatarCache(userId, avatarId);
    }
  }, [cacheKey, userId, avatarId]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Show loading skeleton
  if (loading) {
    return (
      <div
        className={`${sizeClasses[size]} animate-pulse rounded-full border border-white/10 bg-white/5 ${className}`}
      />
    );
  }

  // Show avatar image only if we have a valid URL, no error, and image is loaded
  if (avatarUrl && !error && imageLoaded) {
    return (
      <img
        ref={imageRef}
        src={avatarUrl}
        alt={`${username}'s avatar`}
        className={`${sizeClasses[size]} rounded-full border border-white/10 object-cover ${className}`}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleImageLoad}
        onError={handleImageError}
        decoding="async"
      />
    );
  }

  // Fallback to initials with colored background
  return (
    <div
      className={`${sizeClasses[size]} rounded-full border ${fallbackColor} flex items-center justify-center font-medium text-white ${className}`}
      title={username}
    >
      {initials}
    </div>
  );
}
