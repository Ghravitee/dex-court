// components/UserAvatar.tsx - SIMPLIFIED VERSION
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

// Simple cache - just in memory to avoid duplicate requests
const avatarCache = new Map<string, string>();

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
  const mountedRef = useRef(true);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-12 w-12 text-xs",
    xl: "h-14 w-14 text-xs",
  };

  // Simple fallback color based on username
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

  // Simple initials
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const fallbackColor = getFallbackColor(username);
  const initials = getInitials(username);

  useEffect(() => {
    mountedRef.current = true;

    const loadAvatar = async () => {
      if (!avatarId) {
        setLoading(false);
        setError(true);
        return;
      }

      const cacheKey = `user-${userId}-avatar-${avatarId}`;

      // Check cache first
      if (avatarCache.has(cacheKey)) {
        const cachedUrl = avatarCache.get(cacheKey);
        if (mountedRef.current && cachedUrl) {
          setAvatarUrl(cachedUrl);
          setLoading(false);
        }
        return;
      }

      // Use current user's avatar if available
      if (currentUser?.id === userId && currentUser?.avatarUrl) {
        if (mountedRef.current) {
          setAvatarUrl(currentUser.avatarUrl);
          avatarCache.set(cacheKey, currentUser.avatarUrl);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(false);

        const url = await apiService.getAvatar(userId, avatarId);

        if (
          mountedRef.current &&
          url &&
          typeof url === "string" &&
          url.trim() !== ""
        ) {
          setAvatarUrl(url);
          avatarCache.set(cacheKey, url);
        } else {
          throw new Error("Invalid avatar URL");
        }
      } catch (error) {
        console.warn(`Failed to load avatar for user ${username}:`, error);
        if (mountedRef.current) {
          setError(true);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadAvatar();

    return () => {
      mountedRef.current = false;
    };
  }, [userId, avatarId, username, currentUser]);

  // Handle image load errors
  const handleImageError = () => {
    setError(true);
    if (avatarId) {
      const cacheKey = `user-${userId}-avatar-${avatarId}`;
      avatarCache.delete(cacheKey);
    }
  };

  // Handle image load success
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
