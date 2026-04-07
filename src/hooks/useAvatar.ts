// hooks/useAvatar.ts
import { useQuery } from "@tanstack/react-query";
import { fetchAvatar } from "../services/accountService";

export const useAvatar = (userId: string, avatarId: number | null) => {
  return useQuery({
    queryKey: ["avatar", userId, avatarId],
    queryFn: async () => {
      if (!avatarId) throw new Error("No avatar ID");

      const url = await fetchAvatar(userId, avatarId);
      if (!url || typeof url !== "string" || url.trim() === "") {
        throw new Error("Invalid avatar URL");
      }

      // Preload to verify the blob URL resolves to a valid image
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });
    },
    enabled: !!avatarId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
};
