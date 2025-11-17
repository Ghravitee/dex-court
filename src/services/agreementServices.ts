// src/services/agreementServices.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../lib/apiClient";

// API Enum Mappings
export const AgreementTypeEnum = {
  REPUTATION: 1,
  ESCROW: 2,
} as const;

export const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

export const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
  PARTY_SUBMITTED_DELIVERY: 7,
} as const;

// Request/Response Types
export interface AgreementsRequest {
  title: string;
  description: string;
  type: number;
  visibility: number;
  firstParty: string;
  counterParty: string;
  deadline: string;
  includesFunds?: boolean;
  secureTheFunds?: boolean;
  tokenSymbol?: string;
  contractAddress?: string;
  amount?: number;
}

export interface AgreementSignRequest {
  accepted: boolean;
}

export interface AgreementListDTO {
  totalAgreements: number;
  totalResults: number;
  results: AgreementSummaryDTO[];
  data?: any;
}

export interface AgreementSummaryDTO {
  id: number;
  dateCreated: string;
  description: string;
  visibility: number;
  data?: any;
  title: string;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  amount?: number;
  tokenSymbol?: string;
  deadline: string;
  status: number;
}

export interface AgreementMineListDTO {
  results: AgreementSummaryDTO[];
}

export interface AgreementDetailsDTO {
  id: number;
  title: string;
  description: string;
  type: number;
  visibility: number;
  status: number;
  amount?: number;
  tokenSymbol?: string;
  deadline: string;
  createdAt: string;
  includesFunds?: boolean;
  secureTheFunds?: boolean;
  escrowContract?: string;
  creator: PartyDTO;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  files: FileDTO[];
  timeline: TimelineEventDTO[];

  // 🆕 ADD THESE CANCELLATION PROPERTIES
  cancelPending?: boolean;
  cancelRequestedById?: number | null;
  cancelRequestedBy?: PartyDTO | null;

  // 🆕 ADD DELIVERY PROPERTIES
  deliverySubmittedBy?: PartyDTO | null;
  deliverySubmittedById?: number | null;

  // 🆕 ADD DATE PROPERTIES
  completedAt?: string;
  updatedAt?: string;
}

export interface PartyDTO {
  id: number;
  username: string;
  telegramUsername?: string;
  wallet?: string | null;
  avatarId?: number | null;
  avatar?: {
    id: number;
    fileName: string;
  } | null;
}

export interface FileDTO {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface TimelineEventDTO {
  id: number;
  eventType: number;
  createdAt: string;
  description?: string;
}

export interface AgreementsEditRequest {
  title?: string;
  description?: string;
  type?: number;
  visibility?: number;
  deadline?: string;
  amount?: number;
  tokenSymbol?: string;
  contractAddress?: string;
}

export interface AgreementCancelRespondRequest {
  accepted: boolean;
}

export interface UserDTO {
  id: number;
  username: string;
  bio: string;
  isVerified: boolean;
  telegram: {
    username?: string;
    id?: string;
  };
  walletAddress: string;
  role: number;
  avatarId: number;
}

class AgreementService {
  private userCache: {
    users: any[];
    timestamp: number;
  } | null = null;
  private readonly CACHE_DURATION = 60000;
  setAuthToken(token: string) {
    console.log("🔐 Agreement service token set", token);
  }

  clearAuthToken() {
    console.log("🔐 Agreement service token cleared");
  }

  // Create new agreement - matching the test pattern
  async createAgreement(data: AgreementsRequest, files: File[]): Promise<void> {
    console.log("🔄 Creating agreement with data:", data);

    // Create FormData object
    const formData = new FormData();

    // Append each data field individually - EXACTLY like the test
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("type", data.type.toString());
    formData.append("visibility", data.visibility.toString());
    formData.append("firstParty", data.firstParty);
    formData.append("counterParty", data.counterParty);
    formData.append("deadline", data.deadline);

    // Append optional fields if they exist
    if (data.tokenSymbol) {
      formData.append("tokenSymbol", data.tokenSymbol);
    }
    if (data.amount) {
      formData.append("amount", data.amount.toString());
    }
    if (data.contractAddress) {
      formData.append("contractAddress", data.contractAddress);
    }

    // Append files as array
    files.forEach((file) => {
      formData.append("files", file);
    });

    console.log("📦 FormData fields:", {
      title: data.title,
      description: data.description,
      type: data.type,
      visibility: data.visibility,
      firstParty: data.firstParty,
      counterParty: data.counterParty,
      deadline: data.deadline,
      files: files.map((f) => f.name),
      filesCount: files.length,
    });

    // Send as multipart/form-data
    const response = await api.post("/agreement", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Agreement created successfully:", response.data);
    return response.data;
  }

  // User search methods
  // User search methods - client-side only since no search endpoint exists
  async searchUsers(query: string): Promise<any[]> {
    try {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔍 [AgreementService] Searching users with query: ${query}`,
        );
      }

      if (!query || query.trim().length === 0) {
        return [];
      }

      const allUsers = await this.getAllUsers();

      if (!Array.isArray(allUsers)) {
        console.error(
          "🔍 [AgreementService] getAllUsers did not return an array:",
          allUsers,
        );
        return [];
      }

      const filteredUsers = allUsers.filter(
        (user) =>
          user?.username?.toLowerCase().includes(query.toLowerCase()) ||
          user?.telegram?.username
            ?.toLowerCase()
            .includes(query.toLowerCase()) ||
          user?.telegramInfo?.toLowerCase().includes(query.toLowerCase()) ||
          user?.walletAddress?.toLowerCase().includes(query.toLowerCase()),
      );

      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔍 [AgreementService] Found ${filteredUsers.length} users matching "${query}"`,
        );
      }

      return filteredUsers;
    } catch (error) {
      console.error("🔍 [AgreementService] User search failed:", error);
      return [];
    }
  }

  async getAllUsers(): Promise<any[]> {
    // Return cached users if available and not expired
    if (
      this.userCache &&
      Date.now() - this.userCache.timestamp < this.CACHE_DURATION
    ) {
      console.log("🔍 [AgreementService] Returning cached users");
      return this.userCache.users;
    }

    try {
      const response = await api.get<any>("/accounts");

      console.log("🔍 [AgreementService] /accounts response:", response.data);

      let users: any[] = [];

      // The response has { accounts: [...] } structure based on your logs
      if (response.data && Array.isArray(response.data.accounts)) {
        users = response.data.accounts;
      } else if (response.data && Array.isArray(response.data.results)) {
        users = response.data.results;
      } else if (Array.isArray(response.data)) {
        users = response.data;
      } else {
        console.warn(
          "🔍 [AgreementService] Unexpected response format:",
          response.data,
        );
        users = [];
      }

      // Cache the results
      this.userCache = {
        users,
        timestamp: Date.now(),
      };

      return users;
    } catch (error) {
      console.error("🔍 [AgreementService] Failed to get all users:", error);
      return [];
    }
  }

  // Clear cache when needed (e.g., after creating a new agreement)
  clearUserCache() {
    this.userCache = null;
    console.log("🔍 [AgreementService] User cache cleared");
  }
  async getUserByUsername(username: string): Promise<any> {
    try {
      const cleanUsername = username.replace(/^@/, "");
      const response = await api.get(
        `/accounts/username/${encodeURIComponent(cleanUsername)}`,
      );

      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error("User not found or invalid response");
      }
    } catch (error) {
      console.error(`User lookup failed for ${username}:`, error);
      throw error;
    }
  }

  // Get agreements list with filters
  // Enhanced getAgreements method with better parameter handling
  // In agreementServices.ts - Update the getAgreements method
  async getAgreements(params?: {
    top?: number;
    skip?: number;
    status?: number;
    sort?: string;
    search?: string;
    // Remove page and page_size since API doesn't support them
  }): Promise<AgreementListDTO> {
    console.log(
      "🔍 getAgreements called with params:",
      JSON.stringify(params, null, 2),
    );

    // ✅ FIXED: Use only the parameters that the API actually supports
    const requestParams = {
      top: params?.top || 10, // Default to 10 if not provided
      skip: params?.skip || 0, // Default to 0 if not provided
      status: params?.status,
      sort: params?.sort || "desc", // Default to desc if not provided
      search: params?.search,
    };

    // Remove undefined parameters
    Object.keys(requestParams).forEach((key) => {
      if (requestParams[key as keyof typeof requestParams] === undefined) {
        delete requestParams[key as keyof typeof requestParams];
      }
    });

    const response = await api.get("/agreement", { params: requestParams });

    console.log("📦 getAgreements response details:", {
      totalResults: response.data.totalResults,
      totalAgreements: response.data.totalAgreements,
      resultsCount: response.data.results?.length,
      firstFewIds: response.data.results?.slice(0, 3).map((a: any) => a.id),
      hasMoreData: response.data.results?.length > 0,
      currentPage:
        Math.floor((requestParams.skip || 0) / (requestParams.top || 10)) + 1,
    });

    return response.data;
  }

  // In agreementServices.ts - FIXED getAllAgreementsCount method
  async getAllAgreementsCount(): Promise<number> {
    try {
      console.log("🔢 Counting ALL agreements...");

      // ✅ FIXED: Use correct API parameters (top and skip instead of page/page_size)
      const firstPage = await this.getAgreements({
        top: 1,
        skip: 0,
      });
      const totalCount = firstPage.totalAgreements || 0;

      console.log(`✅ Total agreements count from API: ${totalCount}`);
      return totalCount;
    } catch (error) {
      console.error("❌ Failed to count all agreements:", error);

      // Fallback: try to count manually if the direct count fails
      try {
        console.log("🔄 Falling back to manual counting...");
        const allAgreements = await this.getAllAgreements();
        const manualCount = allAgreements.length;
        console.log(`✅ Manual count: ${manualCount} agreements`);
        return manualCount;
      } catch (fallbackError) {
        console.error("❌ Manual count also failed:", fallbackError);
        throw error;
      }
    }
  }
  // In agreementServices.ts - FIXED getAllAgreements method
  // In agreementServices.ts - FIXED getAllAgreements method
  async getAllAgreements(filters?: {
    status?: number;
    search?: string;
    sort?: string;
  }): Promise<AgreementSummaryDTO[]> {
    try {
      let allAgreements: AgreementSummaryDTO[] = [];
      let skip = 0;
      const top = 100; // Use top instead of page_size
      let hasMore = true;
      let totalAgreements = 0;

      console.log("🔍 Fetching all agreements with pagination...");

      while (hasMore) {
        const params = {
          top: top,
          skip: skip,
          ...filters,
          sort: filters?.sort || "desc",
        };

        const response = await this.getAgreements(params);
        const pageAgreements = response.results || [];

        console.log(
          `📄 Skip ${skip}: ${pageAgreements.length} agreements returned`,
        );

        if (pageAgreements.length === 0) {
          hasMore = false;
          console.log(`📄 Reached end at skip ${skip}`);
          break;
        }

        allAgreements = [...allAgreements, ...pageAgreements];

        // Get total count from the first response
        if (skip === 0) {
          totalAgreements =
            response.totalAgreements || response.totalResults || 0;
          console.log(`📊 Total agreements in system: ${totalAgreements}`);
        }

        console.log(
          `📄 Skip ${skip}: ${pageAgreements.length} agreements (Total so far: ${allAgreements.length}/${totalAgreements})`,
        );

        // Check if we've reached the total
        if (totalAgreements > 0 && allAgreements.length >= totalAgreements) {
          hasMore = false;
          console.log(`✅ Reached total of ${totalAgreements} agreements`);
          break;
        }

        // Also stop if we get fewer results than top (indicating last page)
        if (pageAgreements.length < top) {
          hasMore = false;
          console.log(
            `✅ Reached last page with ${pageAgreements.length} agreements`,
          );
          break;
        }

        skip += top;

        // Safety limit to prevent infinite loops
        if (skip > 5000) {
          console.warn("⚠️ Reached safety limit of 5000 records");
          hasMore = false;
        }

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`✅ Fetched ${allAgreements.length} total agreements`);
      return allAgreements;
    } catch (error) {
      console.error("❌ Failed to fetch all agreements:", error);
      throw error;
    }
  }

  // In agreementServices.ts - Update the getUserAgreements method
  async getUserAgreements(
    userId: string,
    filters?: {
      status?: number;
      search?: string;
    },
  ): Promise<AgreementSummaryDTO[]> {
    try {
      console.log(`👤 Fetching ALL agreements for user ${userId}...`);

      let allUserAgreements: AgreementSummaryDTO[] = [];
      let currentPage = 1;
      const pageSize = 50;
      let hasMore = true;
      let totalFetched = 0;

      while (hasMore) {
        try {
          console.log(`📄 Fetching page ${currentPage} for user agreements...`);

          const params = {
            page: currentPage,
            page_size: pageSize,
            ...filters,
          };

          const response = await this.getAgreements(params);
          const pageAgreements = response.results || [];

          console.log(
            `📄 Page ${currentPage}: ${pageAgreements.length} agreements returned`,
          );

          if (pageAgreements.length === 0) {
            hasMore = false;
            console.log(`✅ Reached end of agreements at page ${currentPage}`);
            break;
          }

          // Filter agreements where the user is involved
          const userAgreementsInPage = pageAgreements.filter((agreement) => {
            const isUserInvolved =
              agreement.firstParty.id.toString() === userId ||
              agreement.counterParty.id.toString() === userId;
            return isUserInvolved;
          });

          console.log(
            `👤 Page ${currentPage}: ${userAgreementsInPage.length} agreements involve user ${userId}`,
          );

          allUserAgreements = [...allUserAgreements, ...userAgreementsInPage];
          totalFetched += pageAgreements.length;

          // Check if we've reached the total count
          if (response.totalResults && totalFetched >= response.totalResults) {
            hasMore = false;
            console.log(
              `✅ Reached total of ${response.totalResults} agreements`,
            );
          }

          currentPage++;

          // Safety limit
          if (currentPage > 50) {
            console.warn("⚠️ Reached safety limit of 50 pages");
            hasMore = false;
          }
        } catch (pageError) {
          console.error(`❌ Error fetching page ${currentPage}:`, pageError);
          hasMore = false;
          break;
        }
      }

      console.log(
        `✅ Total agreements for user ${userId}: ${allUserAgreements.length}`,
      );
      return allUserAgreements;
    } catch (error) {
      console.error(`❌ Failed to fetch agreements for user ${userId}:`, error);
      throw error;
    }
  }

  // Alternative approach using top/skip parameters
  async getUserAgreementsWithTopSkip(
    userId: string,
    filters?: {
      status?: number;
      search?: string;
    },
  ): Promise<AgreementSummaryDTO[]> {
    try {
      console.log(
        `👤 Fetching ALL agreements for user ${userId} using top/skip...`,
      );

      let allUserAgreements: AgreementSummaryDTO[] = [];
      let skip = 0;
      const top = 50; // Get 50 per request
      let hasMore = true;
      let consecutiveEmptyResults = 0;

      while (hasMore) {
        try {
          console.log(
            `📄 Fetching agreements with skip=${skip}, top=${top}...`,
          );

          const params = {
            top: top,
            skip: skip,
            ...filters,
            sort: "desc", // Ensure consistent ordering
          };

          const response = await this.getAgreements(params);
          const pageAgreements = response.results || [];

          console.log(
            `📄 Skip ${skip}: ${pageAgreements.length} agreements returned`,
          );

          if (pageAgreements.length === 0) {
            consecutiveEmptyResults++;
            console.log(`📄 No more agreements at skip=${skip}`);

            // If we get empty results, stop
            if (consecutiveEmptyResults >= 1) {
              hasMore = false;
              console.log(`✅ Reached end of agreements at skip=${skip}`);
              break;
            }
          } else {
            consecutiveEmptyResults = 0;

            // Filter agreements where the user is involved
            const userAgreementsInPage = pageAgreements.filter((agreement) => {
              const isUserInvolved =
                agreement.firstParty.id.toString() === userId ||
                agreement.counterParty.id.toString() === userId;
              return isUserInvolved;
            });

            console.log(
              `👤 Skip ${skip}: ${userAgreementsInPage.length} agreements involve user ${userId}`,
            );

            allUserAgreements = [...allUserAgreements, ...userAgreementsInPage];

            // Move to next page
            skip += top;
          }

          // Safety limit
          if (skip > 1000) {
            console.warn("⚠️ Reached safety limit of 1000 records");
            hasMore = false;
          }

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (pageError) {
          console.error(`❌ Error fetching skip=${skip}:`, pageError);
          hasMore = false;
          break;
        }
      }

      console.log(
        `✅ Total agreements for user ${userId}: ${allUserAgreements.length}`,
      );
      return allUserAgreements;
    } catch (error) {
      console.error(`❌ Failed to fetch agreements for user ${userId}:`, error);
      throw error;
    }
  }

  // Get user's agreements
  async getMyAgreements(): Promise<AgreementMineListDTO> {
    const response = await api.get("/agreement/mine");
    return response.data;
  }

  // Get agreement details
  async getAgreementDetails(
    agreementId: number,
  ): Promise<{ data: AgreementDetailsDTO }> {
    const response = await api.get(`/agreement/${agreementId}`);
    return { data: response.data };
  }

  // Sign/accept or reject agreement
  async signAgreement(agreementId: number, accepted: boolean): Promise<void> {
    const data: AgreementSignRequest = { accepted };
    const response = await api.patch(`/agreement/sign/${agreementId}`, data);
    return response.data;
  }

  // Edit agreement
  async editAgreement(
    agreementId: number,
    data: AgreementsEditRequest,
  ): Promise<void> {
    const response = await api.patch(`/agreement/${agreementId}`, data);
    return response.data;
  }

  // Delete agreement
  async deleteAgreement(agreementId: number): Promise<void> {
    const response = await api.delete(`/agreement/${agreementId}`);
    return response.data;
  }

  // Upload additional files
  async uploadFiles(agreementId: number, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post(
      `/agreement/${agreementId}/files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  }

  // Download file
  // In your agreementServices.ts file, add this method if it doesn't exist:

  // Enhanced downloadFile method with proper TypeScript error handling
  downloadFile = async (agreementId: number, fileId: number): Promise<void> => {
    try {
      const response = await api.get(
        `/agreement/${agreementId}/file/${fileId}`,
        {
          responseType: "blob", // Important for file downloads
        },
      );

      // Get the original filename from the file data or response headers
      let filename = `document-${fileId}`;

      // First, try to get filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      console.log("📥 Download details:", {
        contentDisposition,
        filename,
        contentType: response.headers["content-type"],
      });

      // Create blob with proper MIME type if available
      const contentType = response.headers["content-type"];
      const blob = contentType
        ? new Blob([response.data], { type: contentType })
        : new Blob([response.data]);

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename; // This should preserve the original extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ File downloaded successfully: ${filename}`);
    } catch (error: unknown) {
      console.error("Download failed:", error);

      // Type-safe error handling
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };

        if (axiosError.response?.status === 404) {
          throw new Error(
            "File not found on server. The file may have been deleted or the ID is incorrect.",
          );
        } else if (axiosError.response?.status === 403) {
          throw new Error("You don't have permission to download this file.");
        } else if (axiosError.response?.status === 400) {
          throw new Error(
            "Invalid request. Please check the agreement and file IDs.",
          );
        }
      }

      // Generic error for all other cases
      throw new Error("Failed to download file. Please try again.");
    }
  };

  // Delete file
  async deleteFile(agreementId: number, fileId: number): Promise<void> {
    const response = await api.delete(
      `/agreement/${agreementId}/file/${fileId}`,
    );
    return response.data;
  }

  // Delivery actions
  // Delivery actions
  async markAsDelivered(agreementId: number): Promise<void> {
    const response = await api.patch(`/agreement/${agreementId}/delivery/send`);
    return response.data;
  }

  async confirmDelivery(agreementId: number): Promise<void> {
    const response = await api.patch(
      `/agreement/${agreementId}/delivery/confirm`,
    );
    return response.data;
  }

  async rejectDelivery(agreementId: number): Promise<void> {
    const response = await api.patch(
      `/agreement/${agreementId}/delivery/reject`,
    );
    return response.data;
  }

  async requestCancelation(agreementId: number): Promise<void> {
    try {
      console.log(`🔄 Requesting cancellation for agreement ${agreementId}`);
      const response = await api.patch(
        `/agreement/${agreementId}/cancel/request`,
      );
      console.log("✅ Cancellation request successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Cancellation request failed:", error);
      if (error.response?.data?.error === 16) {
        throw new Error(
          "Cannot request cancellation: Agreement may already have a pending cancellation or invalid state.",
        );
      }
      throw error;
    }
  }

  async respondToCancelation(
    agreementId: number,
    accepted: boolean,
  ): Promise<void> {
    try {
      console.log(
        `🔄 Responding to cancellation for agreement ${agreementId}, accepted: ${accepted}`,
      );
      const data: AgreementCancelRespondRequest = { accepted };
      const response = await api.patch(
        `/agreement/${agreementId}/cancel/response`,
        data,
      );
      console.log("✅ Cancellation response successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Cancellation response failed:", error);
      if (error.response?.data?.error === 16) {
        throw new Error(
          "Cannot respond to cancellation: Invalid agreement state or no pending cancellation.",
        );
      }
      throw error;
    }
  }
}
export const agreementService = new AgreementService();
