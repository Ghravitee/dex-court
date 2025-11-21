// components/UserAvatar.tsx - FIXED VERSION
import { useState } from "react";
import { useAvatar } from "../hooks/useAvatar";
import { useAuth } from "../hooks/useAuth";

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
  const [imageError, setImageError] = useState(false);
  const { user: currentUser } = useAuth();

  // Use TanStack Query for avatar fetching
  const { data: avatarUrl, isLoading, isError } = useAvatar(userId, avatarId);

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
    // Handle empty or undefined usernames
    if (!username || username === "unknown") return "?";

    // 🆕 FIX: Remove @ symbol and get the first character of the actual username
    const cleanUsername = username.replace(/^@/, "").trim();

    // Handle case where username might be empty after cleaning
    if (!cleanUsername) return "?";

    return cleanUsername.charAt(0).toUpperCase();
  };

  const fallbackColor = getFallbackColor(username);
  const initials = getInitials(username);

  // Use current user's avatar if available (bypass API call)
  const effectiveAvatarUrl =
    currentUser?.id === userId && currentUser?.avatarUrl
      ? currentUser.avatarUrl
      : avatarUrl;

  const handleImageError = () => {
    console.warn(`Avatar image failed to load for user ${username}`);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Determine what to display
  const shouldShowFallback =
    !avatarId || isError || imageError || !effectiveAvatarUrl;

  // Show loading state only briefly and only if we're actually fetching
  if (isLoading && avatarId && !effectiveAvatarUrl) {
    return (
      <div
        className={`${sizeClasses[size]} animate-pulse rounded-full border border-white/10 bg-white/5 ${className}`}
        title={username}
      />
    );
  }

  // Show avatar image if available
  if (effectiveAvatarUrl && !shouldShowFallback) {
    return (
      <img
        src={effectiveAvatarUrl}
        alt={`${username}'s avatar`}
        className={`${sizeClasses[size]} rounded-full border border-white/10 object-cover ${className}`}
        loading={priority ? "eager" : "lazy"}
        onLoad={handleImageLoad}
        onError={handleImageError}
        decoding="async"
        title={username}
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
