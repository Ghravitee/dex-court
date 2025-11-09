// components/UserAvatar.tsx - FIXED VERSION
import { useState, useEffect, useRef } from "react";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";

interface UserAvatarProps {
  userId: string;
  avatarId: number | null;
  username: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

// Enhanced cache with timestamp
const avatarCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function UserAvatar({
  userId,
  avatarId,
  username,
  size = "md",
  className = "",
  priority = false,
}: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user: currentUser } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-12 w-12 text-xs",
    xl: "h-14 w-14 text-xs",
  };

  const getFallbackColor = (username: string) => {
    const colors = [
      "bg-red-500/80 border-red-400/40",
      "bg-blue-500/80 border-blue-400/40",
      "bg-green-500/80 border-green-400/40",
      "bg-purple-500/80 border-purple-400/40",
      "bg-orange-500/80 border-orange-400/40",
      "bg-cyan-500/80 border-cyan-400/40",
    ];
    const index = username.length % colors.length;
    return colors[index];
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const fallbackColor = getFallbackColor(username);
  const initials = getInitials(username);

  // Helper function to check if error is AbortError
  const isAbortError = (error: unknown): boolean => {
    return error instanceof Error && error.name === "AbortError";
  };

  useEffect(() => {
    let isMounted = true;
    abortControllerRef.current = new AbortController();

    const loadAvatar = async () => {
      if (!avatarId) {
        if (isMounted) {
          setLoading(false);
          setError(true);
        }
        return;
      }

      const cacheKey = `user-${userId}-avatar-${avatarId}`;

      // Check cache with expiration
      const cached = avatarCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (isMounted) {
          setAvatarUrl(cached.url);
          setLoading(false);
        }
        return;
      }

      // Use current user's avatar if available
      if (currentUser?.id === userId && currentUser?.avatarUrl) {
        if (isMounted) {
          setAvatarUrl(currentUser.avatarUrl);
          avatarCache.set(cacheKey, {
            url: currentUser.avatarUrl,
            timestamp: Date.now(),
          });
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(false);
        }

        const url = await apiService.getAvatar(
          userId,
          avatarId,
          abortControllerRef.current?.signal, // Pass the signal
        );

        if (isMounted && url && typeof url === "string" && url.trim() !== "") {
          setAvatarUrl(url);
          avatarCache.set(cacheKey, {
            url,
            timestamp: Date.now(),
          });
        } else if (isMounted) {
          throw new Error("Invalid avatar URL");
        }
      } catch (error) {
        // Don't log AbortError as it's expected behavior
        if (!isAbortError(error)) {
          console.warn(`Failed to load avatar for user ${username}:`, error);
        }

        if (isMounted && !isAbortError(error)) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAvatar();

    return () => {
      isMounted = false;
      // Abort ongoing request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, avatarId, username, currentUser]);

  const handleImageError = () => {
    setError(true);
    if (avatarId) {
      const cacheKey = `user-${userId}-avatar-${avatarId}`;
      avatarCache.delete(cacheKey);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  // Show loading state briefly
  if (loading && !avatarUrl) {
    return (
      <div
        className={`${sizeClasses[size]} animate-pulse rounded-full border border-white/10 bg-white/5 ${className}`}
      />
    );
  }

  // Show avatar image if available and no error
  if (avatarUrl && !error) {
    return (
      <img
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

  // Fallback to initials
  return (
    <div
      className={`${sizeClasses[size]} rounded-full border ${fallbackColor} flex items-center justify-center font-medium text-white ${className}`}
      title={username}
    >
      {initials}
    </div>
  );
}
