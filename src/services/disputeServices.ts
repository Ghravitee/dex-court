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

const generateVotingId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

class DisputeService {
  private userCache: {
    users: any[];
    timestamp: number;
  } | null = null;
  private readonly CACHE_DURATION = 60000;

  // User search methods remain the same...

  async searchUsers(query: string): Promise<any[]> {
    try {
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

  clearUserCache() {
    this.userCache = null;
    console.log("🔍 [DisputeService] User cache cleared");
  }

  // Create a new dispute manually
  async createDispute(
    data: CreateDisputeRequest,
    files: File[],
  ): Promise<{ id: number }> {
    console.log("🚀 Creating dispute with proper form-data format...");

    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("requestKind", String(data.requestKind));
    formData.append("defendant", cleanTelegramUsername(data.defendant));
    formData.append("claim", data.claim);

    const votingId = generateVotingId();
    formData.append("votingId", votingId);

    console.log("✅ Generated votingId for dispute:", votingId);

    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((witness, index) => {
        formData.append(`witnesses[${index}]`, cleanTelegramUsername(witness));
      });
    }

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

      console.log("✅ Dispute created with votingId:", votingId, response.data);
      return { ...response.data, votingId };
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Create dispute from agreement
  // Create dispute from agreement
  async createDisputeFromAgreement(
    agreementId: number,
    data: CreateDisputeFromAgreementRequest,
    files: File[],
  ): Promise<{ id: number; votingId?: string }> {
    console.log(
      "🚀 Creating dispute from agreement with proper form-data format...",
    );

    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("requestKind", String(data.requestKind));
    formData.append("defendant", cleanTelegramUsername(data.defendant));
    formData.append("claim", data.claim);

    const votingId = generateVotingId();
    formData.append("votingId", votingId);

    console.log("✅ Generated votingId for agreement dispute:", votingId);

    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((witness, index) => {
        formData.append(`witnesses[${index}]`, cleanTelegramUsername(witness));
      });
    }

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
      // FIXED: Added timeout and better error handling
      const response = await api.post(`/dispute/${agreementId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000, // 30 second timeout
      });

      console.log("📥 Raw response from server:", response);
      console.log("📦 Response data:", response.data);
      console.log("📊 Response status:", response.status);

      if (response.status === 201) {
        // FIXED: Handle the new response format { id: disputeId }
        if (!response.data || typeof response.data !== "object") {
          console.error("❌ Invalid response format - expected object with id");
          throw new Error(
            "Server returned invalid response format. Expected { id: disputeId }.",
          );
        }

        const disputeId = response.data.id;

        if (!disputeId || typeof disputeId !== "number") {
          console.error("❌ Missing or invalid dispute ID in response");
          console.error("Response data:", response.data);
          throw new Error(
            "Server response missing dispute ID. Please contact support.",
          );
        }

        console.log(
          "✅ Dispute created from agreement successfully!",
          `Dispute ID: ${disputeId}, Voting ID: ${votingId}`,
          "Full response:",
          response.data,
        );

        return {
          id: disputeId,
          votingId: votingId,
        };
      } else if (response.status === 200) {
        // Handle 200 OK response as well (some APIs use 200 for successful creation)
        if (response.data && response.data.id) {
          console.log("✅ Dispute created (200 OK)", response.data);
          return {
            id: response.data.id,
            votingId: votingId,
          };
        } else {
          throw new Error("Server returned 200 but missing dispute ID.");
        }
      } else {
        console.error("❌ Unexpected response status:", response.status);
        throw new Error(`Unexpected server response: ${response.status}`);
      }
    } catch (error: any) {
      console.error("❌ Error in createDisputeFromAgreement:", error);

      // Enhanced error logging
      if (error.response) {
        console.error("📥 Server response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });

        // Handle specific error cases
        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (errorData.error === "MissingData") {
            throw new Error(
              "Missing required data. Please check all fields are filled correctly.",
            );
          }
          if (errorData.error === "InvalidData") {
            throw new Error(
              "Invalid data provided. Please check your inputs and try again.",
            );
          }
        }

        if (error.response.status === 404) {
          throw new Error(
            "Agreement not found. Please check the agreement ID and try again.",
          );
        }

        if (error.response.status === 409) {
          throw new Error(
            "A dispute already exists for this agreement. You cannot create another one.",
          );
        }
      }

      if (error.code === "ECONNABORTED") {
        console.error("⏰ Request timeout - server took too long to respond");
        throw new Error(
          "Request timeout. The server took too long to respond. Please try again.",
        );
      }

      if (error.code === "ERR_NETWORK") {
        console.error("🌐 Network error - cannot connect to server");
        throw new Error(
          "Cannot connect to server. Please check your internet connection and try again.",
        );
      }

      // Re-throw with better error message
      const errorMessage = error.message || "Unknown error occurred";
      throw new Error(`Failed to create dispute: ${errorMessage}`);
    }
  }

  // UPDATED: Get disputes list with pagination and filters - enhanced for Voting component
  async getDisputes(params?: {
    top?: number;
    skip?: number;
    status?: DisputeStatusEnum;
    sort?: "asc" | "desc";
    search?: string;
    range?: "all" | "last7d" | "last30d";
  }): Promise<DisputeListResponse> {
    try {
      console.log("🔍 [DisputeService] Fetching disputes with params:", params);

      const response = await api.get("/dispute", { params });

      console.log("✅ [DisputeService] Disputes response structure:", {
        hasResults: !!response.data?.results,
        resultsCount: response.data?.results?.length || 0,
        totalCount: response.data?.totalCount,
        hasPagination: response.data?.pagination !== undefined,
        fullResponse: response.data,
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ [DisputeService] Failed to fetch disputes:", error);
      this.handleError(error);
    }
  }

  // Get dispute details
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

    formData.append("defendantClaim", data.defendantClaim);

    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((w, i) => {
        formData.append(`witnesses[${i}]`, w.trim());
      });
    }

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

    formData.append("defendantClaim", data.defendantClaim);

    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((w, i) => {
        formData.append(`witnesses[${i}]`, cleanTelegramUsername(w));
      });
    }

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

  // Edit plaintiff claim
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

    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.claim) formData.append("claim", data.claim);
    if (data.requestKind !== undefined)
      formData.append("requestKind", String(data.requestKind));
    if (data.defendant) formData.append("defendant", data.defendant);

    if (data.witnesses && data.witnesses.length > 0) {
      data.witnesses.forEach((w, i) => {
        const cleanWitness = cleanTelegramUsername(w.trim());
        formData.append(`witnesses[${i}]`, cleanWitness);
      });
    }

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
  async castVote(disputeId: number, data: VoteRequest): Promise<void> {
    try {
      console.log("🗳️ [DisputeService] Casting vote:", { disputeId, data });

      const response = await api.post(`/dispute/${disputeId}/vote`, data);

      console.log("✅ [DisputeService] Vote response:", response.data);

      return response.data;
    } catch (error: any) {
      console.error("❌ [DisputeService] Vote failed:", error);
      this.handleError(error);
    }
  }

  async escalateDisputesToVote(disputeIds: number[]): Promise<void> {
    try {
      console.log(`🚀 Escalating disputes to vote (PATCH):`, disputeIds);

      const response = await api.patch(
        "/testing/escalate-votes",
        {
          disputeIds,
        },
        {
          timeout: 60000,
        },
      );

      console.log("✅ Disputes escalated successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to escalate disputes:", error);

      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        console.warn("⚠️ Request timed out, but may have succeeded on server");
        throw new Error(
          "Request timed out. Please refresh the page to check if it succeeded.",
        );
      }

      this.handleError(error);
    }
  }

  // Check if user can vote in a dispute
  async canUserVote(
    disputeId: number,
    userId: string,
  ): Promise<{
    canVote: boolean;
    reason?: string;
    tier?: number;
    weight?: number;
  }> {
    try {
      console.log(
        `🔍 [DisputeService] Checking eligibility for dispute ${disputeId}, user ${userId}`,
      );

      const response = await api.post(
        `/dispute/${disputeId}/check-eligibility`,
      );

      console.log(`✅ [DisputeService] Eligibility response:`, response.data);

      const { isEligible, reason, tier, weight } = response.data;

      return {
        canVote: isEligible,
        reason: !isEligible ? this.getReasonMessage(reason) : undefined,
        tier: tier,
        weight: weight,
      };
    } catch (error: any) {
      console.error(`❌ [DisputeService] Eligibility check failed:`, error);

      if (error.response?.data?.error) {
        const apiError = error.response.data;

        switch (apiError.error) {
          case ErrorCodeEnum.InvalidData:
            return { canVote: false, reason: "Invalid dispute data" };
          case ErrorCodeEnum.InvalidStatus:
            return { canVote: false, reason: "Dispute is not in voting phase" };
          case ErrorCodeEnum.AccountNotFound:
            return { canVote: false, reason: "User account not found" };
          case ErrorCodeEnum.Forbidden:
            return {
              canVote: false,
              reason: "User is not allowed to vote on this dispute",
            };
          default:
            return {
              canVote: false,
              reason: apiError.message || "Not eligible to vote",
            };
        }
      }

      return { canVote: false, reason: "Error checking eligibility" };
    }
  }

  // Get vote outcome
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

      const totalVotes =
        typeof apiData.totalVotes === "number" ? apiData.totalVotes : 0;

      const judgeVotesObj =
        apiData.votesPerGroup?.judges || apiData.judgeVotes || {};
      const judgeVotes =
        (judgeVotesObj.plaintiff || 0) +
        (judgeVotesObj.defendant || 0) +
        (judgeVotesObj.dismiss || 0);

      const communityTierOne = apiData.votesPerGroup?.communityTierOne || {};
      const communityTierTwo = apiData.votesPerGroup?.communityTierTwo || {};
      const communityVotes =
        (communityTierOne.plaintiff || 0) +
        (communityTierOne.defendant || 0) +
        (communityTierOne.dismiss || 0) +
        (communityTierTwo.plaintiff || 0) +
        (communityTierTwo.defendant || 0) +
        (communityTierTwo.dismiss || 0);

      const judgePctObj =
        apiData.percentagesPerGroup?.judges || apiData.judgePct || {};
      const judgePct = judgePctObj.plaintiff || 0;

      const communityPctObj =
        apiData.percentagesPerGroup?.communityTierOne ||
        apiData.communityPct ||
        {};
      const communityPct = communityPctObj.plaintiff || 0;

      let winner: "plaintiff" | "defendant" | "dismissed" = "dismissed";

      if (apiData.result === 1) winner = "plaintiff";
      else if (apiData.result === 2) winner = "defendant";
      else if (apiData.result === 3) winner = "dismissed";
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

  // UPDATED: Get settled disputes with voting results - enhanced for Voting component
  async getSettledDisputes(params?: {
    top?: number;
    skip?: number;
    sort?: "asc" | "desc";
    search?: string;
    range?: string;
  }): Promise<any> {
    try {
      console.log(
        "🔍 [DisputeService] Fetching settled disputes with params:",
        params,
      );

      const response = await api.get("/dispute/vote-settled", { params });

      console.log("✅ [DisputeService] Settled disputes response structure:", {
        hasResults: !!response.data?.results,
        resultsCount: response.data?.results?.length || 0,
        totalCount: response.data?.totalCount,
        hasPagination: response.data?.pagination !== undefined,
        fullResponseKeys: Object.keys(response.data || {}),
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "❌ [DisputeService] Failed to fetch settled disputes:",
        error,
      );
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
  transformDisputeDetailsToRow(dispute: DisputeDetails): DisputeRow {
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

    const transformEvidenceFiles = (files: any[]): EvidenceFile[] => {
      return (
        files?.map((f: any) => ({
          id: f?.id || 0,
          fileName: f?.fileName || "Unknown file",
          fileSize: f?.fileSize || 0,
          side: f?.side || 0,
          mimeType: f?.mimeType || "application/octet-stream",
          uploadedAt: f?.uploadedAt || new Date().toISOString(),
          fileId: f?.id,
          url: f?.url,
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
      agreementId: dispute.agreementId,
      agreementTitle: dispute.agreementTitle,

      votingId: dispute.votingId,
      contractAgreementId: dispute.contractAgreementId,
      chainId: dispute.chainId,
      txnhash: dispute.txnhash,
      type: dispute.type,
      result: dispute.result,
      votePendingAt: dispute.votePendingAt,
      voteStartedAt: dispute.voteStartedAt,
      voteEndedAt: dispute.voteEndedAt,

      agreement: dispute.agreement
        ? {
            id: dispute.agreement.id,
            type: dispute.agreement.type,
            status: dispute.agreement.status,
            title: dispute.agreement.title,
          }
        : null,
    };

    console.log("🔄 Transformed dispute with new fields:", {
      votingId: transformed.votingId,
      contractAgreementId: transformed.contractAgreementId,
      chainId: transformed.chainId,
      agreementType: transformed.agreement?.type,
    });

    return transformed;
  }

  transformDisputeListItemToRow(item: any): DisputeRow {
    const extractUserData = (user: any) => ({
      username: user?.username || "Unknown",
      userId: user?.id?.toString() || "0",
      avatarId: user?.avatarId || user?.avatar?.id || null,
      telegramUsername:
        user?.telegramUsername || user?.telegram?.username || null,
    });

    const plaintiffData = extractUserData(item.parties?.plaintiff);
    const defendantData = extractUserData(item.parties?.defendant);

    let witnesses = { plaintiff: [], defendant: [] };

    if (item.witnesses) {
      if (
        typeof item.witnesses === "object" &&
        !Array.isArray(item.witnesses)
      ) {
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
      evidence: [],
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

  private getReasonMessage(reasonCode: number): string {
    const reasonMessages: Record<number, string> = {
      0: "Eligible to vote",
      1: "Not in voting phase",
      2: "User is plaintiff",
      3: "User is defendant",
      4: "User has already voted",
      5: "User does not meet voting requirements",
      6: "Dispute not found",
      7: "User account not found",
    };

    return reasonMessages[reasonCode] || "Not eligible to vote";
  }

  // Error handling
  private handleError(error: any): never {
    console.error("🎯 ===== STRICT ERROR HANDLING ===== 🚀");

    console.error("Full error object:", error);

    if (error.response?.status === 500) {
      console.error("❌ SERVER ERROR (500) - Dispute creation FAILED");
      throw new Error(
        "Dispute creation failed due to server error. Please try again.",
      );
    }

    if (error.response?.status === 413) {
      console.error("📁 REQUEST ENTITY TOO LARGE (413)");
      throw new Error(
        "File too large. The total request size exceeds server limits. Please reduce file sizes or upload fewer files.",
      );
    }

    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("CORS") ||
      error.message?.includes("cross-origin") ||
      (error.response === undefined && error.request !== undefined)
    ) {
      console.error("🌐 CORS/NETWORK ERROR DETECTED");
      throw new Error(
        "Unable to connect to server. Please check your connection and try again.",
      );
    }

    if (error.response?.data) {
      const apiError: ApiError = error.response.data;

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
          "Dispute creation failed due to server error. Please try again.",
        [ErrorCodeEnum.Forbidden]:
          "You are not authorized to perform this action.",
        [ErrorCodeEnum.InvalidStatus]:
          "This action cannot be performed in the current dispute status.",
      };

      const message =
        errorMessages[apiError.error] ||
        apiError.message ||
        "Dispute creation failed. Please try again.";

      console.error("🎯 THROWING STRICT ERROR:", message);
      throw new Error(message);
    }

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.error("⏰ TIMEOUT ERROR DETECTED");
      throw new Error(
        "Request timeout. The server took too long to respond. Please try again.",
      );
    }

    console.error("🎯 THROWING GENERIC ERROR");
    throw new Error(
      "Dispute creation failed. Please check your connection and try again.",
    );
  }
}

export const disputeService = new DisputeService();
