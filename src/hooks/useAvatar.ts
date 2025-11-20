// hooks/useAvatar.ts
import { useQuery } from "@tanstack/react-query";
import { apiService } from "../services/apiService";

export const useAvatar = (
  userId: string,
  avatarId: number | null,
  //   username: string,
) => {
  return useQuery({
    queryKey: ["avatar", userId, avatarId],
    queryFn: async () => {
      if (!avatarId) {
        throw new Error("No avatar ID");
      }

      const url = await apiService.getAvatar(userId, avatarId);
      if (!url || typeof url !== "string" || url.trim() === "") {
        throw new Error("Invalid avatar URL");
      }

      // Preload the image to ensure it's valid
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });
    },
    enabled: !!avatarId, // Only fetch if we have an avatarId
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: 1000,
  });
};
