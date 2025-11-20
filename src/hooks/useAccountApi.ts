// hooks/useAccountApi.ts
import { useState } from "react";
import { apiService, type AccountUpdateRequest } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import { clearAvatarCache } from "../lib/avatarUtils";

export const useAccountUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { refreshUser } = useAuth();

  const updateAccount = async (updateData: AccountUpdateRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiService.updateAccount(updateData);
      setSuccess(true);
      // Refresh user data to get updated information
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return { updateAccount, loading, error, success, reset };
};

// hooks/useAvatarUpload.ts - Add file compression
export const useAvatarUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { refreshUser } = useAuth();

  // Helper function to compress image
  const compressImage = (
    file: File,
    maxWidth = 800,
    quality = 0.8,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not compress image"));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              console.log(
                `🔐 Image compressed: ${file.size} → ${compressedFile.size} bytes`,
              );
              resolve(compressedFile);
            },
            "image/jpeg",
            quality,
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // In useAvatarUpload.ts - Simplify the upload function
  const uploadAvatar = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate file type
      if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
        throw new Error("Only JPEG and PNG files are allowed");
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be less than 2MB");
      }

      // Compress image if it's larger than 500KB
      let fileToUpload = file;
      if (file.size > 500 * 1024) {
        console.log("🔐 Compressing image...");
        fileToUpload = await compressImage(file, 800, 0.7);
      }

      await apiService.uploadAvatar(fileToUpload);
      // Clear avatar cache for current user to force reload
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      if (currentUser.id) {
        clearAvatarCache(currentUser.id);
      }

      // Refresh user data to get new avatarId
      await refreshUser();
      setSuccess(true);
      // Refresh user data to get new avatar
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return { uploadAvatar, loading, error, success, reset };
};
