// agreementServices.ts
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
}

export interface AgreementSummaryDTO {
  id: number;
  dateCreated: string;
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
  escrowContract?: string;
  creator: PartyDTO;
  firstParty: PartyDTO;
  counterParty: PartyDTO;
  files: FileDTO[];
  timeline: TimelineEventDTO[];
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

class AgreementService {
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
  // In agreementServices.ts - update searchUsers to return empty array
  // User search methods
  async searchUsers(query: string): Promise<any[]> {
    try {
      console.log(`🔍 [AgreementService] Searching users with query: ${query}`);

      // Use the api instance instead of this.request()
      const response = await api.get<any[]>(
        `/accounts/search?query=${encodeURIComponent(query)}`,
      );

      console.log(`🔍 [AgreementService] Search results:`, response.data);
      return response.data;
    } catch (error) {
      console.error("🔍 [AgreementService] User search failed:", error);

      // Fallback: if search endpoint doesn't exist, use getAllUsers and filter locally
      console.log("🔍 [AgreementService] Using fallback search method");
      const allUsers = await this.getAllUsers();
      const filteredUsers = allUsers.filter(
        (user) =>
          user.username?.toLowerCase().includes(query.toLowerCase()) ||
          user.telegramInfo?.toLowerCase().includes(query.toLowerCase()) ||
          user.telegram?.username?.toLowerCase().includes(query.toLowerCase()),
      );
      return filteredUsers;
    }
  }

  // Also update getAllUsers method to use api instance
  async getAllUsers(): Promise<any[]> {
    try {
      const response = await api.get<any[]>("/accounts");
      return response.data;
    } catch (error) {
      console.error("🔍 [AgreementService] Failed to get all users:", error);
      return [];
    }
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
  async getAgreements(params?: {
    top?: number;
    skip?: number;
    status?: number;
    sort?: string;
    search?: string;
  }): Promise<AgreementListDTO> {
    const response = await api.get("/agreement", { params });
    return response.data;
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
  async downloadFile(agreementId: number, fileId: number): Promise<Blob> {
    const response = await api.get(`/agreement/${agreementId}/file/${fileId}`, {
      responseType: "blob",
    });
    return response.data;
  }

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

  // Cancelation actions
  async requestCancelation(agreementId: number): Promise<void> {
    const response = await api.patch(
      `/agreement/${agreementId}/cancel/request`,
    );
    return response.data;
  }

  async respondToCancelation(
    agreementId: number,
    accepted: boolean,
  ): Promise<void> {
    const data: AgreementCancelRespondRequest = { accepted };
    const response = await api.patch(
      `/agreement/${agreementId}/cancel/response`,
      data,
    );
    return response.data;
  }
}
export const agreementService = new AgreementService();
