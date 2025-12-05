/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Request/Response Types (Keep all your existing interfaces)
export interface AgreementsRequest {
  title: string;
  description: string;
  type: number;
  visibility: number;
  firstParty: string;
  counterParty: string;
  deadline?: string;
  includesFunds?: boolean;
  secureTheFunds?: boolean;
  tokenSymbol?: string;
  contractAddress?: string;
  amount?: number;
  chainId?: number;
  contractAgreementId?: string;
  txHash?: string;
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
  contractAgreementId?: string;
  includesFunds?: boolean;
  hasSecuredFunds?: boolean;
  escrowContract?: string;
  creator: PartyDTO;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  files: FileDTO[];
  timeline: TimelineEventDTO[];
  cancelPending?: boolean;
  cancelRequestedById?: number | null;
  cancelRequestedBy?: PartyDTO | null;
  deliverySubmittedBy?: PartyDTO | null;
  deliverySubmittedById?: number | null;
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

// TanStack Query Keys for organized cache management
export const agreementQueryKeys = {
  all: ["agreements"] as const,
  lists: () => [...agreementQueryKeys.all, "list"] as const,
  list: (filters: any) => [...agreementQueryKeys.lists(), filters] as const,
  details: () => [...agreementQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...agreementQueryKeys.details(), id] as const,
  mine: ["agreements", "mine"] as const,
  users: ["users"] as const,
  userSearch: (query: string) =>
    [...agreementQueryKeys.users, "search", query] as const,
  counts: ["agreements", "counts"] as const,
} as const;

// Improved AgreementService - No manual caching!
class AgreementService {
  setAuthToken(token: string) {
    console.log("🔐 Agreement service token set", token);
  }

  clearAuthToken() {
    console.log("🔐 Agreement service token cleared");
  }

  // Create new agreement
  // Create new agreement
  // Create new agreement
  // Create new agreement
  async createAgreement(data: AgreementsRequest, files: File[]): Promise<void> {
    console.log("🔄 Creating agreement with data:", data);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("type", data.type.toString());
    formData.append("visibility", data.visibility.toString());
    formData.append("firstParty", data.firstParty);
    formData.append("counterParty", data.counterParty);

    // FIX: Only append deadline if it has a value
    if (data.deadline && data.deadline.trim() !== "") {
      formData.append("deadline", data.deadline);
      console.log("📅 Deadline included:", data.deadline);
    } else {
      console.log("📅 No deadline provided - skipping deadline field");
    }

    // === REQUIRED FIELDS FOR INCLUDES_FUNDS = true ===
    if (data.includesFunds !== undefined) {
      formData.append("includesFunds", data.includesFunds.toString());
    }

    if (data.tokenSymbol) {
      formData.append("tokenSymbol", data.tokenSymbol);
    }

    if (data.amount) {
      formData.append("amount", data.amount.toString());
    }

    if (data.tokenSymbol && data.contractAddress) {
      formData.append("contractAddress", data.contractAddress);
    }

    // === REQUIRED FIELDS FOR SECURED_FUNDS = true ===
    if (data.secureTheFunds !== undefined) {
      formData.append("secureTheFunds", data.secureTheFunds.toString());
    }

    // FIX: Use exact field names backend expects (lowercase)
    if (data.chainId) {
      formData.append("chainId", data.chainId.toString());
    }

    if (data.contractAgreementId) {
      formData.append("contractAgreementId", data.contractAgreementId);
    }

    // FIX: Change txHash to txnhash (backend expects lowercase)
    if (data.txHash) {
      formData.append("txnhash", data.txHash); // ← Changed from txHash to txnhash
    }

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
      deadline: data.deadline || "NOT INCLUDED", // Show if included or not
      includesFunds: data.includesFunds,
      secureTheFunds: data.secureTheFunds,
      tokenSymbol: data.tokenSymbol,
      amount: data.amount,
      contractAddress: data.contractAddress,
      chainId: data.chainId,
      contractAgreementId: data.contractAgreementId,
      txnhash: data.txHash,
      files: files.map((f) => f.name),
    });

    try {
      const response = await api.post("/agreement", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Agreement created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Agreement creation failed:", error);
      console.error("📋 Error details:", error.response?.data);
      throw error;
    }
  }
  // User search - now with proper error handling
  async searchUsers(query: string): Promise<any[]> {
    try {
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

      console.log(
        `🔍 [AgreementService] Found ${filteredUsers.length} users matching "${query}"`,
      );

      return filteredUsers;
    } catch (error) {
      console.error("🔍 [AgreementService] User search failed:", error);
      return [];
    }
  }

  // Get all users - simplified without manual cache
  async getAllUsers(): Promise<any[]> {
    try {
      const response = await api.get<any>("/accounts");
      console.log("🔍 [AgreementService] /accounts response:", response.data);

      let users: any[] = [];

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

      return users;
    } catch (error) {
      console.error("🔍 [AgreementService] Failed to get all users:", error);
      return [];
    }
  }

  // REMOVED: clearUserCache() - No manual cache to clear!

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
  async getAgreements(params?: {
    top?: number;
    skip?: number;
    status?: number;
    sort?: string;
    search?: string;
  }): Promise<AgreementListDTO> {
    console.log("🔍 getAgreements called with params:", params);

    const requestParams = {
      top: params?.top || 10,
      skip: params?.skip || 0,
      status: params?.status,
      sort: params?.sort || "desc",
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
    });

    return response.data;
  }

  // Get all agreements count - optimized
  async getAllAgreementsCount(): Promise<number> {
    try {
      console.log("🔢 Counting ALL agreements...");
      const firstPage = await this.getAgreements({ top: 1, skip: 0 });
      const totalCount = firstPage.totalAgreements || 0;
      console.log(`✅ Total agreements count from API: ${totalCount}`);
      return totalCount;
    } catch (error) {
      console.error("❌ Failed to count all agreements:", error);
      throw error;
    }
  }

  // Get all agreements with pagination
  async getAllAgreements(filters?: {
    top?: number;
    status?: number;
    search?: string;
    sort?: string;
  }): Promise<AgreementSummaryDTO[]> {
    try {
      let allAgreements: AgreementSummaryDTO[] = [];
      let skip = 0;
      const top = 100;
      let hasMore = true;
      let totalAgreements = 0;

      console.log("🔍 Fetching all agreements with pagination...");

      while (hasMore) {
        const params = { top, skip, ...filters, sort: filters?.sort || "desc" };
        const response = await this.getAgreements(params);
        const pageAgreements = response.results || [];

        console.log(
          `📄 Skip ${skip}: ${pageAgreements.length} agreements returned`,
        );

        if (pageAgreements.length === 0) {
          hasMore = false;
          break;
        }

        allAgreements = [...allAgreements, ...pageAgreements];

        if (skip === 0) {
          totalAgreements =
            response.totalAgreements || response.totalResults || 0;
          console.log(`📊 Total agreements in system: ${totalAgreements}`);
        }

        if (totalAgreements > 0 && allAgreements.length >= totalAgreements) {
          hasMore = false;
          break;
        }

        if (pageAgreements.length < top) {
          hasMore = false;
          break;
        }

        skip += top;
        if (skip > 5000) {
          console.warn("⚠️ Reached safety limit of 5000 records");
          hasMore = false;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`✅ Fetched ${allAgreements.length} total agreements`);
      return allAgreements;
    } catch (error) {
      console.error("❌ Failed to fetch all agreements:", error);
      throw error;
    }
  }

  // Get user agreements
  // Get user agreements - also fix the null checking here
  async getUserAgreements(
    userId: string,
    filters?: { status?: number; search?: string },
  ): Promise<AgreementSummaryDTO[]> {
    try {
      console.log(`👤 Fetching ALL agreements for user ${userId}...`);
      const allAgreements = await this.getAllAgreements(filters);

      // Filter for the specific user with proper null checking
      const userAgreements = allAgreements.filter((agreement) => {
        // Check if firstParty exists and has an id
        const isFirstParty =
          agreement.firstParty &&
          agreement.firstParty.id &&
          agreement.firstParty.id.toString() === userId;

        // Check if counterParty exists and has an id
        const isCounterParty =
          agreement.counterParty &&
          agreement.counterParty.id &&
          agreement.counterParty.id.toString() === userId;

        return isFirstParty || isCounterParty;
      });

      console.log(
        `✅ Total agreements for user ${userId}: ${userAgreements.length}`,
      );
      return userAgreements;
    } catch (error) {
      console.error(`❌ Failed to fetch agreements for user ${userId}:`, error);
      throw error;
    }
  }

  // Add this method to your AgreementService class
  async getUserAgreementsWithTopSkip(
    userId: string,
  ): Promise<AgreementSummaryDTO[]> {
    try {
      console.log(
        `👤 Fetching agreements for user ${userId} with pagination...`,
      );

      // Use the existing getAgreements method with pagination
      const response = await this.getAgreements({
        top: 100, // Get a reasonable number of agreements
        skip: 0,
        sort: "desc",
      });

      const allAgreements = response.results || [];

      // Filter for the specific user with proper null checking
      const userAgreements = allAgreements.filter((agreement) => {
        // Check if firstParty exists and has an id
        const isFirstParty =
          agreement.firstParty &&
          agreement.firstParty.id &&
          agreement.firstParty.id.toString() === userId;

        // Check if counterParty exists and has an id
        const isCounterParty =
          agreement.counterParty &&
          agreement.counterParty.id &&
          agreement.counterParty.id.toString() === userId;

        return isFirstParty || isCounterParty;
      });

      console.log(
        `✅ Found ${userAgreements.length} agreements for user ${userId}`,
      );

      return userAgreements;
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
  async getAgreementDetails(agreementId: number): Promise<AgreementDetailsDTO> {
    const response = await api.get(`/agreement/${agreementId}`);
    return response.data;
  }

  // Add this method to your AgreementService class
  async getSignedAgreements(): Promise<AgreementSummaryDTO[]> {
    console.log("🔍 Fetching signed agreements for homepage...");

    // Get all agreements
    const allAgreements = await this.getAllAgreements({
      sort: "desc",
      top: 1000, // Get a large number
    });

    // Filter for signed agreements (status = ACTIVE = 2)
    const signedAgreements = allAgreements.filter(
      (agreement) => agreement.status === AgreementStatusEnum.ACTIVE,
    );

    console.log(
      `✅ Found ${signedAgreements.length} signed agreements out of ${allAgreements.length} total`,
    );

    // Enhance with details if needed
    const agreementsNeedingDetails = signedAgreements.filter(
      (agreement) =>
        !agreement.description || agreement.description.trim() === "",
    );

    if (agreementsNeedingDetails.length > 0) {
      const detailedAgreements = await Promise.all(
        agreementsNeedingDetails.map(async (agreement) => {
          try {
            const details = await this.getAgreementDetails(agreement.id);
            return {
              ...agreement,
              description: details.description || "No description available",
            };
          } catch (error) {
            console.warn(
              `Failed to fetch details for agreement ${agreement.id}:`,
              error,
            );
            return agreement;
          }
        }),
      );

      // Replace agreements with detailed versions
      return signedAgreements.map((agreement) => {
        const detailed = detailedAgreements.find((d) => d.id === agreement.id);
        return detailed || agreement;
      });
    }

    return signedAgreements;
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
    files.forEach((file) => formData.append("files", file));

    const response = await api.post(
      `/agreement/${agreementId}/files`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  }

  // Download file
  async downloadFile(agreementId: number, fileId: number): Promise<void> {
    try {
      const response = await api.get(
        `/agreement/${agreementId}/file/${fileId}`,
        {
          responseType: "blob",
        },
      );

      let filename = `document-${fileId}`;
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const contentType = response.headers["content-type"];
      const blob = contentType
        ? new Blob([response.data], { type: contentType })
        : new Blob([response.data]);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ File downloaded successfully: ${filename}`);
    } catch (error: any) {
      console.error("Download failed:", error);

      if (error.response?.status === 404) {
        throw new Error("File not found on server.");
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to download this file.");
      } else if (error.response?.status === 400) {
        throw new Error("Invalid request.");
      }

      throw new Error("Failed to download file. Please try again.");
    }
  }

  // Delete file
  async deleteFile(agreementId: number, fileId: number): Promise<void> {
    const response = await api.delete(
      `/agreement/${agreementId}/file/${fileId}`,
    );
    return response.data;
  }

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
          "Cannot request cancellation: Invalid agreement state.",
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
          "Cannot respond to cancellation: Invalid agreement state.",
        );
      }
      throw error;
    }
  }
}

export const agreementService = new AgreementService();

// 🎯 TANSTACK QUERY HOOKS - The Real Improvement!

// Query hooks for agreements
export function useAgreements(params?: {
  top?: number;
  skip?: number;
  status?: number;
  sort?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: agreementQueryKeys.list(params || {}),
    queryFn: () => agreementService.getAgreements(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useMyAgreements() {
  return useQuery({
    queryKey: agreementQueryKeys.mine,
    queryFn: () => agreementService.getMyAgreements(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAgreementDetails(agreementId: number) {
  return useQuery({
    queryKey: agreementQueryKeys.detail(agreementId),
    queryFn: () => agreementService.getAgreementDetails(agreementId),
    enabled: !!agreementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: agreementQueryKeys.users,
    queryFn: () => agreementService.getAllUsers(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useUserSearch(query: string) {
  const { data: allUsers, isLoading } = useAllUsers();

  const filteredUsers =
    allUsers?.filter(
      (user) =>
        user?.username?.toLowerCase().includes(query.toLowerCase()) ||
        user?.telegram?.username?.toLowerCase().includes(query.toLowerCase()) ||
        user?.telegramInfo?.toLowerCase().includes(query.toLowerCase()) ||
        user?.walletAddress?.toLowerCase().includes(query.toLowerCase()),
    ) || [];

  return {
    data: filteredUsers,
    isLoading,
  };
}

export function useAllAgreementsCount() {
  return useQuery({
    queryKey: [...agreementQueryKeys.counts, "total"],
    queryFn: () => agreementService.getAllAgreementsCount(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hooks
export function useCreateAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, files }: { data: AgreementsRequest; files: File[] }) =>
      agreementService.createAgreement(data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.users });
    },
  });
}

export function useSignAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      accepted,
    }: {
      agreementId: number;
      accepted: boolean;
    }) => agreementService.signAgreement(agreementId, accepted),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: agreementQueryKeys.detail(variables.agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.mine });
    },
  });
}

export function useEditAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      data,
    }: {
      agreementId: number;
      data: AgreementsEditRequest;
    }) => agreementService.editAgreement(agreementId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: agreementQueryKeys.detail(variables.agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
    },
  });
}

export function useDeleteAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: number) =>
      agreementService.deleteAgreement(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.removeQueries({
        queryKey: agreementQueryKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.mine });
    },
  });
}

// Delivery actions hook
export function useDeliveryActions() {
  const queryClient = useQueryClient();

  const markAsDelivered = useMutation({
    mutationFn: (agreementId: number) =>
      agreementService.markAsDelivered(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({
        queryKey: agreementQueryKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
    },
  });

  const confirmDelivery = useMutation({
    mutationFn: (agreementId: number) =>
      agreementService.confirmDelivery(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({
        queryKey: agreementQueryKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
    },
  });

  const rejectDelivery = useMutation({
    mutationFn: (agreementId: number) =>
      agreementService.rejectDelivery(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({
        queryKey: agreementQueryKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
    },
  });

  return { markAsDelivered, confirmDelivery, rejectDelivery };
}

// Cancellation actions hook
export function useCancelationActions() {
  const queryClient = useQueryClient();

  const requestCancelation = useMutation({
    mutationFn: (agreementId: number) =>
      agreementService.requestCancelation(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({
        queryKey: agreementQueryKeys.detail(agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
    },
  });

  const respondToCancelation = useMutation({
    mutationFn: ({
      agreementId,
      accepted,
    }: {
      agreementId: number;
      accepted: boolean;
    }) => agreementService.respondToCancelation(agreementId, accepted),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: agreementQueryKeys.detail(variables.agreementId),
      });
      queryClient.invalidateQueries({ queryKey: agreementQueryKeys.lists() });
    },
  });

  return { requestCancelation, respondToCancelation };
}

// Utility hook for manual cache invalidation
export function useInvalidateAgreements() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: agreementQueryKeys.all });
  };
}
