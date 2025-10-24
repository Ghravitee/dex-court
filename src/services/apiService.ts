/* eslint-disable @typescript-eslint/no-explicit-any */
// services/apiService.ts
import { api } from "../lib/apiClient";

const BASE_URL = "https://dev-api.dexcourt.com";

// services/apiService.ts - Update the interface
export interface AccountSummaryDTO {
  id: number;
  username: string;
  bio: string | null;
  telegramInfo?: string; // Keep this for backward compatibility if needed
  walletAddress: string | null;
  isVerified: boolean;
  avatarUrl?: string;
  avatarId?: number | null;
  role?: number;
  // Add the correct telegram structure
  telegram?: {
    username: string;
    id: string;
  };
}

export interface AccountUpdateRequest {
  username?: string;
  bio?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = BASE_URL;
  }

  // services/apiService.ts - Update the request method
  private async request<T>(config: any): Promise<T> {
    try {
      console.log("🔐 Making API request to:", `${this.baseURL}${config.url}`);

      // Get token and set it directly (no Bearer prefix)
      const token = localStorage.getItem("authToken");
      const headers = {
        ...config.headers,
        ...(token && { Authorization: token }), // Raw token, no Bearer
      };

      const response = await api({
        ...config,
        headers,
      });

      console.log("🔐 API Success:", response.status, response.data);
      return response.data as T;
    } catch (error: any) {
      console.error("🔐 API request failed:", error);

      if (error.response?.status === 500) {
        throw new Error("Server error: Please try again later");
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error.message || "An unexpected error occurred");
    }
  }

  // Accounts API methods
  async getMyAccount(): Promise<AccountSummaryDTO> {
    return this.request<AccountSummaryDTO>({
      method: "GET",
      url: "/accounts/mine",
    });
  }

  async getAccountById(accountId: string): Promise<AccountSummaryDTO> {
    return this.request<AccountSummaryDTO>({
      method: "GET",
      url: `/accounts/${accountId}`,
    });
  }

  async updateAccount(updateData: AccountUpdateRequest): Promise<void> {
    return this.request<void>({
      method: "PATCH",
      url: "/accounts",
      data: updateData,
    });
  }

  // services/apiService.ts - Update the uploadAvatar method
  async uploadAvatar(file: File): Promise<void> {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication required");
    }

    // Validate file type
    if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
      throw new Error("Only JPEG and PNG files are allowed");
    }

    // Validate file size (1MB max to avoid 413 errors)
    if (file.size > 1 * 1024 * 1024) {
      throw new Error("File size must be less than 1MB");
    }

    // Use direct fetch to bypass axios CORS issues
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      console.log("🔐 Uploading avatar file:", file.name, file.size, file.type);

      const response = await fetch(`${this.baseURL}/accounts/avatar`, {
        method: "PATCH",
        headers: {
          // Use raw token without Bearer prefix
          Authorization: token,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData,
      });

      console.log("🔐 Avatar upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔐 Avatar upload failed:", response.status, errorText);

        if (response.status === 413) {
          throw new Error(
            "File too large. Please use a smaller image (max 1MB).",
          );
        }
        if (response.status === 415) {
          throw new Error("Unsupported file type. Please use JPEG or PNG.");
        }

        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      console.log("🔐 Avatar uploaded successfully");
      return;
    } catch (error) {
      console.error("🔐 Avatar upload error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Upload failed due to network error");
    }
  }

  // Add this to your apiService.ts
  // services/apiService.ts - Update the getAvatar method
  // services/apiService.ts - Update getAvatar method
  async getAvatar(userId: string, avatarId: number): Promise<string> {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      // Add cache-busting parameter only for non-recent uploads
      // For recent uploads (last 5 minutes), use cache
      const cacheBuster =
        Date.now() - 5 * 60 * 1000 > 0 ? `?t=${Date.now()}` : "";

      const response = await fetch(
        `${this.baseURL}/accounts/${userId}/file/${avatarId}${cacheBuster}`,
        {
          headers: {
            Authorization: token,
          },
          // Add timeout for avatar requests
          signal: AbortSignal.timeout(10000), // 10 second timeout
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch avatar: ${response.status}`);
      }

      const blob = await response.blob();

      // Validate blob is actually an image
      if (!blob.type.startsWith("image/")) {
        throw new Error("Invalid image format");
      }

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("🔐 Failed to fetch avatar:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<AccountSummaryDTO[]> {
    try {
      const response = await this.request<any[]>({
        method: "GET",
        url: "/accounts",
      });

      return response.map((user) => this.transformToAccountSummaryDTO(user));
    } catch (error) {
      console.error("🔐 [API] Error getting all users:", error);
      throw new Error("Failed to fetch users list");
    }
  }

  // Add this method for getting user by username

  // services/apiService.ts - Add this method to the ApiService class

  async getUserByUsername(username: string): Promise<AccountSummaryDTO> {
    try {
      const cleanUsername = username.startsWith("@")
        ? username.slice(1)
        : username;

      console.log(`🔐 [API] Looking up user by username: ${cleanUsername}`);

      return this.request<AccountSummaryDTO>({
        method: "GET",
        url: `/accounts/username/${cleanUsername}`,
      });
    } catch (error) {
      console.error("🔐 [API] Error getting user by username:", error);
      throw new Error(`User with username ${username} not found`);
    }
  }

  // Update the getUserById method to use the new endpoint
  async getUserById(userId: string): Promise<AccountSummaryDTO> {
    try {
      console.log(`🔐 [API] Looking up user by ID: ${userId}`);
      return this.request<AccountSummaryDTO>({
        method: "GET",
        url: `/accounts/id/${userId}`,
      });
    } catch (error) {
      console.error("🔐 [API] Error getting user by ID:", error);
      throw new Error(`User with ID ${userId} not found`);
    }
  }
  // Helper function to transform any user object to AccountSummaryDTO
  private transformToAccountSummaryDTO(userData: any): AccountSummaryDTO {
    return {
      id: userData.id || userData.userId || 0,
      username: userData.username || userData.name || "",
      bio: userData.bio || userData.description || null,
      telegramInfo: userData.telegramInfo || userData.telegram?.username,
      walletAddress: userData.walletAddress || userData.wallet || null,
      isVerified: userData.isVerified || userData.verified || false,
      avatarUrl:
        userData.avatarUrl || userData.avatar || userData.profilePicture,
      avatarId: userData.avatarId || userData.avatarFileId || null,
      role: userData.role || userData.userRole || 0,
      telegram: userData.telegram
        ? {
            username: userData.telegram.username || userData.telegramInfo,
            id: userData.telegram.id || userData.telegramUserId || "",
          }
        : userData.telegramInfo
          ? {
              username: userData.telegramInfo,
              id: "",
            }
          : undefined,
    };
  }
}

export const apiService = new ApiService();
