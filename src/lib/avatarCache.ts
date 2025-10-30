// lib/avatarCache.ts

// Cache for avatar URLs to prevent duplicate requests
export const avatarUrlCache = new Map<string, string>();
export const pendingRequests = new Map<string, Promise<string | null>>();
export const preloadedImages = new Set<string>();

// Cache management functions
export function clearAvatarUrlCache(): void {
  avatarUrlCache.clear();
  pendingRequests.clear();
  preloadedImages.clear();
}

export function getAvatarUrlCacheSize(): number {
  return avatarUrlCache.size;
}

// Helper functions for avatar generation
export function getFallbackColor(name: string): string {
  const colors = [
    "bg-cyan-500/20 border-cyan-400/30",
    "bg-purple-500/20 border-purple-400/30",
    "bg-emerald-500/20 border-emerald-400/30",
    "bg-rose-500/20 border-rose-400/30",
    "bg-amber-500/20 border-amber-400/30",
  ];

  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function getInitials(name: string): string {
  const cleanName = name.replace(/^@/, "").trim();

  if (cleanName.length === 0) return "U";

  const parts = cleanName.split(/[\s.]+/).filter((part) => part.length > 0);

  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  return cleanName.length >= 2
    ? cleanName.substring(0, 2).toUpperCase()
    : cleanName.charAt(0).toUpperCase();
}
