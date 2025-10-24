// components/UserAvatar.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { getAvatarCache, clearAvatarCache } from "../lib/avatarUtils";

interface UserAvatarProps {
  userId: string;
  avatarId: number | null;
  username: string;
  size?: "sm" | "md" | "lg";
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

  useEffect(() => {
    const loadAvatar = async () => {
      // Reset states
      setError(false);
      setAvatarUrl(null);
      setImageLoaded(false);

      if (!avatarId || !cacheKey) {
        console.log(
          `No avatarId provided for user ${username}, using fallback`,
        );
        return;
      }

      const avatarCache = getAvatarCache();

      // Check cache first
      if (avatarCache.has(cacheKey)) {
        const cachedUrl = avatarCache.get(cacheKey);
        setAvatarUrl(cachedUrl!);
        console.log(`Using cached avatar for ${username}`);
        return;
      }

      if (currentUser?.id === userId && currentUser?.avatarUrl) {
        setAvatarUrl(currentUser.avatarUrl);
        avatarCache.set(cacheKey, currentUser.avatarUrl);
        return;
      }

      try {
        setLoading(true);
        console.log(
          `Loading avatar for user ${username}, avatarId: ${avatarId}`,
        );

        const url = await apiService.getAvatar(userId, avatarId);

        if (url && typeof url === "string" && url.trim() !== "") {
          setAvatarUrl(url);
          avatarCache.set(cacheKey, url);
          console.log(`Avatar loaded successfully for ${username}`);
        } else {
          console.warn(`Invalid avatar URL for user ${username}`);
          setError(true);
        }
      } catch (error) {
        console.error(`Failed to load avatar for user ${username}:`, error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadAvatar();
  }, [userId, avatarId, currentUser, username, cacheKey]); // ← Remove avatarUrl

  // Preload image when avatarUrl changes
  useEffect(() => {
    if (avatarUrl && !avatarUrl.startsWith("blob:") && !imageLoaded) {
      const img = new Image();
      img.src = avatarUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => {
        console.warn(`Preload failed for avatar: ${avatarUrl}`);
        setError(true);
      };
    }
  }, [avatarUrl, imageLoaded]); // Add imageLoaded to prevent repeated preloads

  // Generate fallback background color based on username
  const getFallbackColor = (name: string) => {
    const colors = [
      "bg-cyan-500/20 border-cyan-400/30",
      "bg-purple-500/20 border-purple-400/30",
      "bg-emerald-500/20 border-emerald-400/30",
      "bg-rose-500/20 border-rose-400/30",
      "bg-amber-500/20 border-amber-400/30",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    const cleanName = name.replace(/^@/, "").trim();
    const parts = cleanName.split(/[\s.]+/);

    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    } else if (cleanName.length >= 2) {
      return cleanName.substring(0, 2).toUpperCase();
    } else if (cleanName.length === 1) {
      return cleanName.charAt(0).toUpperCase();
    } else {
      return "U";
    }
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div
        className={`${sizeClasses[size]} animate-pulse rounded-full border border-white/10 bg-white/5 ${className}`}
      />
    );
  }

  // Show avatar image only if we have a valid URL, no error, and image is loaded (for non-blob URLs)
  if (avatarUrl && !error && (avatarUrl.startsWith("blob:") || imageLoaded)) {
    return (
      <img
        ref={imageRef}
        src={avatarUrl}
        alt={`${username}'s avatar`}
        className={`${sizeClasses[size]} rounded-full border border-white/10 object-cover transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.warn(
            `Avatar image failed to load for ${username}, error: ${e}`,
          );
          setError(true);
          // Remove from cache if it fails
          if (cacheKey) {
            clearAvatarCache(userId, avatarId);
          }
        }}
      />
    );
  }

  // Fallback to initials with colored background
  return (
    <div
      className={`${sizeClasses[size]} rounded-full border ${getFallbackColor(username)} flex items-center justify-center font-medium text-white ${className}`}
      title={username}
    >
      {getInitials(username)}
    </div>
  );
}
