/* eslint-disable @typescript-eslint/no-explicit-any */
import { cleanTelegramUsername } from "../lib/usernameUtils";
import { api } from "../lib/apiClient";
import { DisputeTypeEnum, DisputeStatusEnum, ErrorCodeEnum } from "../types";
import type {
  DisputeListResponse,
  CreateDisputeRequest,
  CreateDisputeFromAgreementRequest,
  VoteRequest,
  DisputeDetails,
  ApiError,
  DisputeRow,
  EvidenceFile,
  VoteOutcomeData,
} from "../types";

class DisputeService {
  private userCache: {
    users: any[];
    timestamp: number;
  } | null = null;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  // User search methods - same implementation as AgreementService
  async searchUsers(query: string): Promise<any[]> {
    try {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.log(`🔍 [DisputeService] Searching users with query: ${query}`);
      }

      if (!query || query.trim().length === 0) {
        return [];
      }

      const allUsers = await this.getAllUsers();

      if (!Array.isArray(allUsers)) {
        console.error(
          "🔍 [DisputeService] getAllUsers did not return an array:",
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
          `🔍 [DisputeService] Found ${filteredUsers.length} users matching "${query}"`,
        );
      }

      return filteredUsers;
    } catch (error) {
      console.error("🔍 [DisputeService] User search failed:", error);
      return [];
    }
  }

  async getAllUsers(): Promise<any[]> {
    // Return cached users if available and not expired
    if (
      this.userCache &&
      Date.now() - this.userCache.timestamp < this.CACHE_DURATION
    ) {
      console.log("🔍 [DisputeService] Returning cached users");
      return this.userCache.users;
    }

    try {
      const response = await api.get<any>("/accounts");

      console.log("🔍 [DisputeService] /accounts response:", response.data);

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
          "🔍 [DisputeService] Unexpected response format:",
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
      console.error("🔍 [DisputeService] Failed to get all users:", error);
      return [];
    }
  }

  // Clear cache when needed
  clearUserCache() {
    this.userCache = null;
    console.log("🔍 [DisputeService] User cache cleared");
  }

  // Create a new dispute manually
  // Create a new dispute manually - ENHANCED DEBUGGING VERSION
  // Create a new dispute (POST /dispute)
  async createDispute(
    data: CreateDisputeRequest,
    files: File[],
  ): Promise<{ id: number }> {
    console.log("🚀 Creating dispute with proper form-data format...");

    const formData = new FormData();

    // ✅ Append fields individually (NOT JSON)
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("requestKind", String(data.requestKind));
    formData.append("defendant", cleanTelegramUsername(data.defendant));
    formData.append("claim", data.claim);

    // ✅ Append witnesses array as `witnesses[0]`, `witnesses[1]`, etc.
    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((witness, index) => {
        formData.append(`witnesses[${index}]`, cleanTelegramUsername(witness));
      });
    }

    // ✅ Append evidence files
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    console.log("📦 FormData content being sent:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    try {
      const response = await api.post("/dispute", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Dispute created:", response.data);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Create dispute from agreement
  // Create dispute from agreement - fixed to match proper form-data structure
  async createDisputeFromAgreement(
    agreementId: number,
    data: CreateDisputeFromAgreementRequest,
    files: File[],
  ): Promise<{ id: number }> {
    console.log(
      "🚀 Creating dispute from agreement with proper form-data format...",
    );

    const formData = new FormData();

    // ✅ Append fields individually (NOT JSON)
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("requestKind", String(data.requestKind));
    formData.append("defendant", cleanTelegramUsername(data.defendant));
    formData.append("claim", data.claim);

    // ✅ Append witnesses as indexed keys
    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((witness, index) => {
        formData.append(`witnesses[${index}]`, cleanTelegramUsername(witness));
      });
    }

    // ✅ Append evidence files
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    console.log(
      "📦 FormData content being sent for createDisputeFromAgreement:",
    );
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    try {
      const response = await api.post(`/dispute/${agreementId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Dispute created from agreement:", response.data);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Get disputes list with pagination and filters
  async getDisputes(params?: {
    top?: number;
    skip?: number;
    status?: DisputeStatusEnum;
    sort?: "asc" | "desc";
    search?: string;
    range?: "all" | "last7d" | "last30d";
  }): Promise<DisputeListResponse> {
    try {
      const response = await api.get("/dispute", { params });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Get dispute details
  // Get dispute details - UPDATED WITH DEBUGGING
  async getDisputeDetails(disputeId: number): Promise<DisputeDetails> {
    try {
      console.log("🔍 Fetching dispute details for ID:", disputeId);
      const response = await api.get(`/dispute/${disputeId}`);
      console.log("🔍 Raw API response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("🔍 Error fetching dispute details:", error);
      this.handleError(error);
    }
  }

  // Submit defendant claim
  async submitDefendantClaim(
    disputeId: number,
    data: {
      defendantClaim: string;
      witnesses?: string[];
    },
    files?: File[],
  ): Promise<void> {
    const formData = new FormData();

    // ✅ Required defense statement
    formData.append("defendantClaim", data.defendantClaim);

    // ✅ Optional witnesses
    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((w, i) => {
        formData.append(`witnesses[${i}]`, w.trim());
      });
    }

    // ✅ Optional evidence files
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    console.log("🚀 Sending POST /dispute/:id/defendant-claim");
    for (const [k, v] of formData.entries()) {
      console.log("  ", k, "=>", v);
    }

    try {
      const response = await api.post(
        `/dispute/${disputeId}/defendant-claim`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      console.log("✅ Defendant claim submitted successfully", response.data);
    } catch (error: any) {
      console.error("❌ Error submitting defendant claim", error);
      this.handleError(error);
    }
  }

  // Edit defendant claim
  async editDefendantClaim(
    disputeId: number,
    data: {
      defendantClaim: string;
      witnesses?: string[];
    },
    files?: File[],
  ): Promise<void> {
    const formData = new FormData();

    // ✅ Required defense statement
    formData.append("defendantClaim", data.defendantClaim);

    // ✅ Optional witnesses
    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((w, i) => {
        formData.append(`witnesses[${i}]`, cleanTelegramUsername(w));
      });
    }

    // ✅ Optional evidence files
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    console.log("🚀 Sending PATCH /dispute/:id/defendant-claim");
    for (const [k, v] of formData.entries()) {
      console.log("  ", k, "=>", v);
    }

    try {
      const response = await api.patch(
        `/dispute/${disputeId}/defendant-claim`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      console.log("✅ Defendant claim edited successfully", response.data);
    } catch (error: any) {
      console.error("❌ Error editing defendant claim", error);
      this.handleError(error);
    }
  }

  // Edit plaintiff claim - FIXED to clean witness usernames
  async editPlaintiffClaim(
    disputeId: number,
    data: {
      title?: string;
      description?: string;
      claim?: string;
      requestKind?: number;
      defendant?: string;
      witnesses?: string[];
    },
    files?: File[],
  ): Promise<void> {
    const formData = new FormData();

    // ✅ Append individual fields exactly as backend expects
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.claim) formData.append("claim", data.claim);
    if (data.requestKind !== undefined)
      formData.append("requestKind", String(data.requestKind));
    if (data.defendant) formData.append("defendant", data.defendant);

    // ✅ Append witnesses individually as witnesses[0], witnesses[1], ... WITH CLEANED USERNAMES
    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((w, i) => {
        // Clean the username by removing @ prefix and trimming
        const cleanWitness = cleanTelegramUsername(w.trim());
        formData.append(`witnesses[${i}]`, cleanWitness);
      });
    }

    // ✅ Append evidence files directly (no "data" JSON wrapper)
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("files", file));
    }

    console.log("🚀 Sending PATCH /dispute/:id/plaintiff-claim");
    for (const [k, v] of formData.entries()) {
      console.log("  ", k, "=>", v);
    }

    try {
      const response = await api.patch(
        `/dispute/${disputeId}/plaintiff-claim`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      console.log("✅ Plaintiff claim edited successfully", response.data);
    } catch (error: any) {
      console.error("❌ Error editing plaintiff claim", error);
      this.handleError(error);
    }
  }

  // Manually settle dispute
  async settleDispute(disputeId: number): Promise<void> {
    try {
      await api.patch(`/dispute/${disputeId}/settled`);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Cast vote
  // In disputeServices.ts - check the castVote method
  async castVote(disputeId: number, data: VoteRequest): Promise<void> {
    try {
      console.log("🗳️ [DisputeService] Casting vote:", { disputeId, data });

      const response = await api.post(`/dispute/${disputeId}/vote`, data);

      console.log("✅ [DisputeService] Vote response:", response.data);

      // If the API returns data, return it
      return response.data;
    } catch (error: any) {
      console.error("❌ [DisputeService] Vote failed:", error);
      this.handleError(error);
    }
  }

  async escalateDisputesToVote(disputeIds: number[]): Promise<void> {
    try {
      console.log(`🚀 Escalating disputes to vote (PATCH):`, disputeIds);

      // Changed from POST to PATCH
      const response = await api.patch("/testing/escalate-votes", {
        disputeIds,
      });

      console.log("✅ Disputes escalated successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to escalate disputes:", error);
      this.handleError(error);
    }
  }

  // Check if user can vote in a dispute
  // Check if user can vote in a dispute
  async canUserVote(
    disputeId: number,
    userId: string,
  ): Promise<{ canVote: boolean; reason?: string }> {
    try {
      // Get dispute details to check parties
      const disputeDetails = await this.getDisputeDetails(disputeId);

      // Get current user data from your auth context instead of API call
      // Since we don't have getUserById, we'll use the existing user data
      const allUsers = await this.getAllUsers();
      const currentUser = allUsers.find(
        (user) => user.id?.toString() === userId || user.userId === userId,
      );

      if (!currentUser) {
        return { canVote: false, reason: "User not found" };
      }

      const currentUsername = cleanTelegramUsername(
        currentUser.username || currentUser.telegramUsername,
      );
      const plaintiffUsername = cleanTelegramUsername(
        disputeDetails.plaintiff.username,
      );

      // Plaintiffs cannot vote in their own disputes
      if (currentUsername === plaintiffUsername) {
        return {
          canVote: false,
          reason: "Plaintiffs cannot vote in their own disputes",
        };
      }

      // Defendants cannot vote in their own disputes
      if (
        disputeDetails.defendant &&
        currentUsername ===
          cleanTelegramUsername(disputeDetails.defendant.username)
      ) {
        return {
          canVote: false,
          reason: "Defendants cannot vote in their own disputes",
        };
      }

      // For now, allow all other logged-in users to vote

      return { canVote: true };
    } catch (error) {
      console.error("Error checking voting eligibility:", error);
      return { canVote: false, reason: "Error checking eligibility" };
    }
  }

  // Get vote outcome
  // Update the getVoteOutcome method in disputeServices.ts
  // Update the getVoteOutcome method to handle the complex object structure
  async getVoteOutcome(disputeId: number): Promise<VoteOutcomeData> {
    try {
      console.log(
        `🔍 [DisputeService] Fetching vote outcome for dispute ${disputeId}`,
      );

      const response = await api.get(`/dispute/${disputeId}/vote-outcome`);

      console.log(
        `📊 [DisputeService] Raw vote outcome response:`,
        response.data,
      );

      const apiData = response.data;

      // Extract data from the complex object structure
      const totalVotes =
        typeof apiData.totalVotes === "number" ? apiData.totalVotes : 0;

      // Extract judge votes - it's an object with plaintiff, defendant, dismiss properties
      const judgeVotesObj =
        apiData.votesPerGroup?.judges || apiData.judgeVotes || {};
      const judgeVotes =
        (judgeVotesObj.plaintiff || 0) +
        (judgeVotesObj.defendant || 0) +
        (judgeVotesObj.dismiss || 0);

      // Extract community votes - sum across both tiers
      const communityTierOne = apiData.votesPerGroup?.communityTierOne || {};
      const communityTierTwo = apiData.votesPerGroup?.communityTierTwo || {};
      const communityVotes =
        (communityTierOne.plaintiff || 0) +
        (communityTierOne.defendant || 0) +
        (communityTierOne.dismiss || 0) +
        (communityTierTwo.plaintiff || 0) +
        (communityTierTwo.defendant || 0) +
        (communityTierTwo.dismiss || 0);

      // Extract judge percentage - it's an object, we need plaintiff percentage
      const judgePctObj =
        apiData.percentagesPerGroup?.judges || apiData.judgePct || {};
      const judgePct = judgePctObj.plaintiff || 0;

      // Extract community percentage - use communityTierOne as representative
      const communityPctObj =
        apiData.percentagesPerGroup?.communityTierOne ||
        apiData.communityPct ||
        {};
      const communityPct = communityPctObj.plaintiff || 0;

      // Determine winner based on weighted result or result field
      let winner: "plaintiff" | "defendant" | "dismissed" = "dismissed";

      // Option 1: Use result field (1 = plaintiff, 2 = defendant, 3 = dismissed)
      if (apiData.result === 1) winner = "plaintiff";
      else if (apiData.result === 2) winner = "defendant";
      else if (apiData.result === 3) winner = "dismissed";
      // Option 2: Use weighted object to determine winner
      else if (apiData.weighted) {
        const { plaintiff = 0, defendant = 0, dismiss = 0 } = apiData.weighted;
        if (plaintiff > defendant && plaintiff > dismiss) winner = "plaintiff";
        else if (defendant > plaintiff && defendant > dismiss)
          winner = "defendant";
        else winner = "dismissed";
      }

      const transformedData = {
        winner: winner,
        judgeVotes: judgeVotes,
        communityVotes: communityVotes,
        judgePct: judgePct,
        communityPct: communityPct,
        comments: apiData.comments || [],
      };

      console.log("🔄 Transformed vote outcome:", transformedData);
      console.log("📈 Detailed vote analysis:", {
        totalVotes,
        judgeVotes: {
          total: judgeVotes,
          breakdown: judgeVotesObj,
        },
        communityVotes: {
          total: communityVotes,
          breakdown: {
            tierOne: communityTierOne,
            tierTwo: communityTierTwo,
          },
        },
        judgePct: {
          plaintiff: judgePct,
          breakdown: judgePctObj,
        },
        communityPct: {
          plaintiff: communityPct,
          breakdown: communityPctObj,
        },
        winner,
        weighted: apiData.weighted,
        result: apiData.result,
      });

      return transformedData;
    } catch (error: any) {
      console.error(
        `❌ [DisputeService] Failed to fetch vote outcome for dispute ${disputeId}:`,
        error,
      );
      this.handleError(error);
    }
  }

  // Get disputes in vote progress
  async getVoteInProgressDisputes(): Promise<{ results: any[] }> {
    try {
      const response = await api.get("/dispute/vote-in-progress");
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Get settled disputes with voting results
  // Get settled disputes with voting results - UPDATED for new endpoint
  async getSettledDisputes(params?: {
    top?: number;
    skip?: number;
    sort?: "asc" | "desc";
    search?: string;
    range?: string;
  }): Promise<any> {
    try {
      const response = await api.get("/dispute/vote-settled", { params });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Download file
  async downloadFile(disputeId: number, fileId: number): Promise<Blob> {
    try {
      const response = await api.get(`/dispute/${disputeId}/file/${fileId}`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Delete file
  async deleteFile(disputeId: number, fileId: number): Promise<void> {
    try {
      await api.delete(`/dispute/${disputeId}/file/${fileId}`);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Transform API data to frontend format
  // In disputeServices.ts - update transformDisputeDetailsToRow function
  transformDisputeDetailsToRow(dispute: DisputeDetails): DisputeRow {
    // Helper function to extract user data with fallbacks
    const extractUserData = (user: any) => {
      if (!user) {
        return {
          username: "Unknown",
          userId: "0",
          avatarId: null,
          telegramUsername: null,
        };
      }

      return {
        username: user.username || "Unknown",
        userId: user.id?.toString() || "0",
        avatarId: user.avatarId || user.avatar?.id || null,
        telegramUsername:
          user.telegramUsername || user.telegram?.username || null,
      };
    };

    const plaintiffData = extractUserData(dispute.plaintiff);
    const defendantData = extractUserData(dispute.defendant);

    const witnesses = {
      plaintiff:
        dispute.witnesses?.plaintiff?.map((w: any) => ({
          id: w?.id || 0,
          username: w?.username || "Unknown",
          avatarId: w?.avatarId || w?.avatar?.id || null,
        })) || [],
      defendant:
        dispute.witnesses?.defendant?.map((w: any) => ({
          id: w?.id || 0,
          username: w?.username || "Unknown",
          avatarId: w?.avatarId || w?.avatar?.id || null,
        })) || [],
    };

    console.log("🔍 Witnesses after transformation:", witnesses);

    // Transform evidence files to match EvidenceFile interface
    const transformEvidenceFiles = (files: any[]): EvidenceFile[] => {
      return (
        files?.map((f: any) => ({
          id: f?.id || 0,
          fileName: f?.fileName || "Unknown file",
          fileSize: f?.fileSize || 0,
          side: f?.side || 0,
          mimeType: f?.mimeType || "application/octet-stream",
          uploadedAt: f?.uploadedAt || new Date().toISOString(),
          fileId: f?.id, // For backward compatibility
          url: f?.url, // If available
        })) || []
      );
    };

    const plaintiffEvidence = transformEvidenceFiles(
      dispute.plaintiffComplaint?.evidenceFiles || [],
    );

    const defendantEvidence = transformEvidenceFiles(
      dispute.defendantResponse?.evidenceFiles || [],
    );

    const transformed: DisputeRow = {
      id: dispute.id?.toString() || "0",
      createdAt: dispute.createdAt || new Date().toISOString(),
      title: dispute.title || "Untitled Dispute",
      request: dispute.type === DisputeTypeEnum.ProBono ? "Pro Bono" : "Paid",
      parties: `${plaintiffData.username} vs ${defendantData.username}`,
      status: this.mapStatusToFrontend(dispute.status),
      claim: dispute.plaintiffComplaint?.formalClaim || "No claim specified",
      plaintiff: plaintiffData.username,
      defendant: defendantData.username,
      description:
        dispute.plaintiffComplaint?.description || "No description provided",

      witnesses: witnesses,
      evidence: plaintiffEvidence,
      defendantResponse: dispute.defendantResponse
        ? {
            description:
              dispute.defendantResponse.formalClaim ||
              "No response description",
            evidence: defendantEvidence,
            createdAt:
              dispute.defendantResponse.createdAt || new Date().toISOString(),
          }
        : undefined,
      plaintiffData,
      defendantData,

      hasVoted: dispute.hasVoted,
      agreementId: dispute.agreementId, // This should come from the API
      agreementTitle: dispute.agreementTitle,
    };

    return transformed;
  }

  // Also update the transformDisputeListItemToRow function
  // In your disputeServices.ts file - update this function
  transformDisputeListItemToRow(item: any): DisputeRow {
    // Helper function to extract user data with avatars
    const extractUserData = (user: any) => ({
      username: user?.username || "Unknown",
      userId: user?.id?.toString() || "0",
      avatarId: user?.avatarId || user?.avatar?.id || null,
      telegramUsername:
        user?.telegramUsername || user?.telegram?.username || null,
    });

    const plaintiffData = extractUserData(item.parties?.plaintiff);
    const defendantData = extractUserData(item.parties?.defendant);

    // Handle witnesses structure properly
    let witnesses = { plaintiff: [], defendant: [] };

    if (item.witnesses) {
      if (
        typeof item.witnesses === "object" &&
        !Array.isArray(item.witnesses)
      ) {
        // Handle object structure { plaintiff: [], defendant: [] }
        witnesses = {
          plaintiff: (item.witnesses.plaintiff || []).map((w: any) => ({
            id: w?.id || 0,
            username: w?.username || "Unknown",
            avatarId: w?.avatarId || w?.avatar?.id || null,
          })),
          defendant: (item.witnesses.defendant || []).map((w: any) => ({
            id: w?.id || 0,
            username: w?.username || "Unknown",
            avatarId: w?.avatarId || w?.avatar?.id || null,
          })),
        };
      } else if (Array.isArray(item.witnesses)) {
        // Handle array structure - assign to plaintiff witnesses by default
        witnesses = {
          plaintiff: item.witnesses.map((w: any) => ({
            id: w?.id || 0,
            username: w?.username || "Unknown",
            avatarId: w?.avatarId || w?.avatar?.id || null,
          })),
          defendant: [],
        };
      }
    }

    return {
      id: item.id?.toString() || "0",
      createdAt: item.createdAt || new Date().toISOString(),
      title: item.title || "Untitled Dispute",
      request:
        item.requestType === DisputeTypeEnum.ProBono ? "Pro Bono" : "Paid",
      parties: `${plaintiffData.username} vs ${defendantData.username}`,
      status: this.mapStatusToFrontend(item.status),
      claim: item.claim || "No claim specified",
      plaintiff: plaintiffData.username,
      defendant: defendantData.username,
      description: item.description || "No description provided",
      witnesses: witnesses,
      evidence: [], // Add empty evidence array for list items
      plaintiffData,
      defendantData,
    };
  }
  private mapStatusToFrontend(
    status: DisputeStatusEnum,
  ): "Pending" | "Vote in Progress" | "Settled" | "Dismissed" {
    switch (status) {
      case DisputeStatusEnum.Pending:
        return "Pending";
      case DisputeStatusEnum.VoteInProgress:
        return "Vote in Progress";
      case DisputeStatusEnum.Settled:
        return "Settled";
      case DisputeStatusEnum.Dismissed:
        return "Dismissed";
      default:
        return "Pending";
    }
  }

  // Error handling
  // Enhanced error handling
  private handleError(error: any): never {
    console.error("🎯 ===== ENHANCED ERROR HANDLING ===== 🚀");

    if (error.response?.data) {
      const apiError: ApiError = error.response.data;

      // 🚨 ENHANCED: Log the request payload that caused the error
      if (error.response.config?.data) {
        console.error("  Request Payload:", error.response.config.data);
      }

      // Map error codes to user-friendly messages
      const errorMessages: Record<ErrorCodeEnum, string> = {
        [ErrorCodeEnum.MissingData]:
          "Missing required fields. Please check: Title, Description, Defendant, Claim, and Evidence files.",
        [ErrorCodeEnum.InvalidEnum]: "Invalid dispute type selected.",
        [ErrorCodeEnum.MissingWallet]:
          "Wallet connection required for paid disputes.",
        [ErrorCodeEnum.AccountNotFound]: "Defendant account not found.",
        [ErrorCodeEnum.SameAccount]:
          "You cannot create a dispute against yourself.",
        [ErrorCodeEnum.WitnessesNotFound]: "One or more witnesses not found.",
        [ErrorCodeEnum.InvalidData]: "Invalid data provided.",
        [ErrorCodeEnum.InternalServerError]:
          "An unexpected error occurred. Please try again.",
        [ErrorCodeEnum.Forbidden]:
          "You are not authorized to perform this action.",
        [ErrorCodeEnum.InvalidStatus]:
          "This action cannot be performed in the current dispute status.",
      };

      const message =
        errorMessages[apiError.error] ||
        apiError.message ||
        "An error occurred";

      console.error("🎯 THROWING USER-FRIENDLY ERROR:", message);
      throw new Error(message);
    }

    // Network errors
    if (
      error.code === "NETWORK_ERROR" ||
      error.message?.includes("Network Error")
    ) {
      console.error("🌐 NETWORK ERROR DETECTED");
      throw new Error(
        "Network error. Please check your connection and try again.",
      );
    }

    // Timeout errors
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.error("⏰ TIMEOUT ERROR DETECTED");
      throw new Error("Request timeout. Please try again.");
    }

    console.error("🎯 THROWING GENERIC ERROR");
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }
}

export const disputeService = new DisputeService();
