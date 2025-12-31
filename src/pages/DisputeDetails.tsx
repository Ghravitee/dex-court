/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import {
  ArrowLeft,
  Clock,
  Users,
  Scale,
  MessageCircle,
  Upload,
  UserCheck,
  Shield,
  Loader2,
  BarChart3,
  Vote,
  Gavel,
  FileText,
  AlertTriangle,
  Package,
  XCircle,
  Hourglass,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { disputeService } from "../services/disputeServices";
import { UserAvatar } from "../components/UserAvatar";
import {
  cleanTelegramUsername,
  formatTelegramUsernameForDisplay,
} from "../lib/usernameUtils";

import type {
  DefendantClaimRequest,
  DisputeRow,
  EvidenceFile,
  EvidenceItem,
  UploadedFile,
  VoteData,
} from "../types";
import PlaintiffReplyModal from "../components/disputes/modals/PlaintiffReplyModal";
import { DefendantReplyModal } from "../components/disputes/modals/DefendantReplyModal";
import EvidenceViewer from "../components/disputes/modals/EvidenceViewer";
import { EvidenceDisplay } from "../components/disputes/EvidenceDisplay";
import { VoteModal } from "../components/disputes/modals/VoteModal";
import VoteOutcomeModal from "../components/disputes/modals/VoteOutcomeModal";
import SettleConfirmationModal from "../components/disputes/modals/SettleConfirmationModal";
import DisputeChat from "./DisputeChat";
import type { DisputeChatRole } from "./DisputeChat/types/dto";
import { useVotingStatus } from "../hooks/useVotingStatus";

// Add this helper function near your other imports
const formatDisplayName = (username: string) => {
  // Clean the username first
  const cleaned = cleanTelegramUsername(username);

  // Check if it's a wallet address (starts with 0x and is 42 chars)
  if (cleaned.startsWith("0x") && cleaned.length === 42) {
    // Truncate wallet address and remove any @ prefix
    return `${cleaned.slice(0, 6)}...${cleaned.slice(-4)}`;
  }
  // For Telegram usernames, use the existing formatter
  return formatTelegramUsernameForDisplay(username);
};

// Helper function to map agreement status codes to human-readable labels
const getAgreementStatusLabel = (status: number): string => {
  switch (status) {
    case 1:
      return "pending_acceptance"; // Use the same string as your color system expects
    case 2:
      return "signed";
    case 3:
      return "completed";
    case 4:
      return "disputed";
    case 5:
      return "cancelled";
    case 6:
      return "expired";
    case 7:
      return "pending_approval";
    default:
      return "pending";
  }
};

// Use your existing color-coded status icon function
const getAgreementStatusIcon = (status: number) => {
  const statusLabel = getAgreementStatusLabel(status);

  switch (statusLabel) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    case "pending":
    case "pending_acceptance":
      return <Clock className="h-4 w-4 text-yellow-400" />;
    case "signed":
      return <FileText className="h-4 w-4 text-blue-400" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "expired":
      return <Hourglass className="h-4 w-4 text-gray-400" />;
    case "disputed":
      return <AlertTriangle className="h-4 w-4 text-purple-400" />;
    case "pending_approval":
      return <Package className="h-4 w-4 text-orange-400" />;
    default:
      return <FileText className="h-4 w-4 text-gray-400" />;
  }
};

// Helper function for status badge text
const getAgreementStatusText = (status: number): string => {
  switch (status) {
    case 1:
      return "Pending Acceptance";
    case 2:
      return "Signed / Active";
    case 3:
      return "Completed";
    case 4:
      return "Disputed";
    case 5:
      return "Cancelled";
    case 6:
      return "Expired";
    case 7:
      return "Pending Approval";
    default:
      return "Unknown Status";
  }
};

// Helper function for status badge colors (optional, for text/background)
const getAgreementStatusBadgeColor = (status: number): string => {
  const statusLabel = getAgreementStatusLabel(status);

  switch (statusLabel) {
    case "completed":
      return "bg-green-500/10 text-green-300 border-green-500/30";
    case "pending":
    case "pending_acceptance":
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
    case "signed":
      return "bg-blue-500/10 text-blue-300 border-blue-500/30";
    case "cancelled":
      return "bg-red-500/10 text-red-300 border-red-500/30";
    case "expired":
      return "bg-gray-500/10 text-gray-300 border-gray-500/30";
    case "disputed":
      return "bg-purple-500/10 text-purple-300 border-purple-500/30";
    case "pending_approval":
      return "bg-orange-500/10 text-orange-300 border-orange-500/30";
    default:
      return "bg-gray-500/10 text-gray-300 border-gray-500/30";
  }
};

// Main Component
export default function DisputeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    null,
  );
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);

  const [settleModalOpen, setSettleModalOpen] = useState(false);

  const [escalating, setEscalating] = useState(false);

  // Voting state
  // Voting state
  const [voteData, setVoteData] = useState<VoteData>({
    choice: null,
    comment: "",
  });

  const disputeId = id ? parseInt(id) : null;

  const {
    hasVoted,
    canVote,
    reason,
    isLoading: votingStatusLoading,
    markAsVoted,
  } = useVotingStatus(disputeId, dispute);

  const [voteOutcomeModalOpen, setVoteOutcomeModalOpen] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  // Reply modals state
  const [defendantReplyModalOpen, setDefendantReplyModalOpen] = useState(false);
  const [plaintiffReplyModalOpen, setPlaintiffReplyModalOpen] = useState(false);

  // Replace your current isCurrentUserPlaintiff function with this:
  const isCurrentUserPlaintiff = useCallback(() => {
    if (!user || !dispute) {
      return false;
    }

    const currentUsername = user.username || user.telegramUsername;
    const plaintiffUsername = cleanTelegramUsername(dispute.plaintiff);

    const isPlaintiff =
      normalizeUsername(currentUsername) ===
      normalizeUsername(plaintiffUsername);

    return isPlaintiff;
  }, [user, dispute]);

  // Replace your current isCurrentUserDefendant function with this:
  const isCurrentUserDefendant = useCallback(() => {
    if (!user || !dispute) {
      return false;
    }

    const currentUsername = user.username || user.telegramUsername;
    const defendantUsername = cleanTelegramUsername(dispute.defendant);

    const isDefendant =
      normalizeUsername(currentUsername) ===
      normalizeUsername(defendantUsername);

    return isDefendant;
  }, [user, dispute]);

  // Add normalization helper function
  // Update the normalizeUsername function to handle undefined values
  const normalizeUsername = (username: string | undefined): string => {
    if (!username) return "";
    return username.replace(/^@/, "").toLowerCase().trim();
  };

  // Wrap these helper functions in useCallback as well
  const getUserRoleNumber = useCallback((): number => {
    return user?.role || 1; // Default to Community (1) if no role
  }, [user?.role]);

  const isUserJudge = useCallback((): boolean => {
    return getUserRoleNumber() === 2; // 2 = Judge
  }, [getUserRoleNumber]);

  const isUserAdmin = useCallback((): boolean => {
    return getUserRoleNumber() === 3; // 3 = Admin
  }, [getUserRoleNumber]);

  const isUserCommunity = useCallback((): boolean => {
    return getUserRoleNumber() === 1; // 1 = Community
  }, [getUserRoleNumber]);

  // Update the getUserRole function
  // Update the getUserRole function to use useCallback
  const getUserRole = useCallback((): DisputeChatRole | undefined => {
    if (!user || !dispute) return undefined;

    const currentUsername = user.username || user.telegramUsername;
    const normalizedCurrent = normalizeUsername(currentUsername);

    const plaintiffUsername = normalizeUsername(
      cleanTelegramUsername(dispute.plaintiff),
    );
    const defendantUsername = normalizeUsername(
      cleanTelegramUsername(dispute.defendant),
    );

    if (normalizedCurrent === plaintiffUsername) return "plaintiff";
    if (normalizedCurrent === defendantUsername) return "defendant";

    // Check if user is a witness
    const plaintiffWitnesses = dispute.witnesses?.plaintiff || [];
    const defendantWitnesses = dispute.witnesses?.defendant || [];

    const allWitnesses = [...plaintiffWitnesses, ...defendantWitnesses];
    const isWitness = allWitnesses.some(
      (witness) => normalizeUsername(witness.username) === normalizedCurrent,
    );

    if (isWitness) return "witness";

    // Check if user is a judge (role 2) or admin (role 3)
    if (isUserJudge() || isUserAdmin()) return "judge";

    return "community"; // Return community for regular users
  }, [user, dispute, isUserJudge, isUserAdmin]); // Add all dependencies

  const canUserVote = useCallback(async (): Promise<{
    canVote: boolean;
    reason?: string;
    hasVoted?: boolean;
    isJudge?: boolean;
  }> => {
    const userRole = getUserRole();
    const isJudge = isUserJudge();

    // Plaintiff and defendant cannot vote - this should already be handled by useVotingStatus
    // but we double-check here for UI purposes
    if (userRole === "plaintiff" || userRole === "defendant") {
      return {
        canVote: false,
        reason: "Parties cannot vote in their own dispute",
        hasVoted: false,
        isJudge: false,
      };
    }

    return {
      canVote,
      reason,
      hasVoted,
      isJudge,
    };
  }, [canVote, reason, hasVoted, getUserRole, isUserJudge]);

  // Fetch dispute details
  // Fetch dispute details
  // Fetch dispute details - UPDATED WITH BETTER ERROR HANDLING
  useEffect(() => {
    if (!id) {
      console.error("No dispute ID provided");
      setLoading(false);
      return;
    }

    const disputeId = parseInt(id);
    if (isNaN(disputeId)) {
      console.error("Invalid dispute ID:", id);
      toast.error("Invalid dispute ID");
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchDisputeDetails = async () => {
      try {
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        console.log("✅ Received dispute details:", disputeDetails);

        const transformedDispute =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        console.log("✅ Transformed dispute:", transformedDispute);

        setDispute(transformedDispute);
      } catch (error: any) {
        console.error("❌ Failed to fetch dispute details:", error);
        toast.error("Failed to load dispute details", {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDisputeDetails();
  }, [id]);

  // In your component, update the processEvidence function
  const processEvidence = (
    evidenceList: EvidenceFile[], // Now properly typed
    disputeId: string,
  ): EvidenceItem[] => {
    return evidenceList.map((evidence) => {
      const name = evidence.fileName;

      // Function to get file URL using file ID
      const getFileUrl = (file: EvidenceFile): string => {
        if (file.id) {
          // Use the numeric file ID
          const API_BASE =
            import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";
          return `${API_BASE}/dispute/${disputeId}/file/${file.id}`;
        }
        // Fallback to filename if no ID (shouldn't happen)
        return `/api/dispute/${disputeId}/file/${encodeURIComponent(name)}`;
      };

      const fileUrl = getFileUrl(evidence);

      // Improved PDF detection
      if (name.includes("etherscan.io")) {
        return {
          name,
          type: "transaction",
          url: evidence.url || name, // Use provided URL or fallback
          preview:
            "https://placehold.co/600x400/1e3a8a/white?text=Blockchain+Tx",
        };
      } else if (/\.(webp|jpg|jpeg|png|gif)$/i.test(name)) {
        return {
          name,
          type: "image",
          url: fileUrl,
          preview: fileUrl,
        };
      } else if (/\.pdf($|\?)/i.test(name)) {
        return {
          name,
          type: "pdf",
          url: fileUrl,
          preview:
            "https://placehold.co/600x800/059669/white?text=PDF+Document",
        };
      } else if (name.match(/chat|screenshot|conversation/i)) {
        return {
          name,
          type: "chat",
          url: fileUrl,
          preview:
            "https://placehold.co/600x800/1f2937/white?text=Chat+Screenshot",
        };
      } else {
        return {
          name,
          type: "document",
          url: fileUrl,
          preview: "https://placehold.co/600x800/059669/white?text=Document",
        };
      }
    });
  };

  // Safe data access with fallbacks
  // Safe data access with fallbacks
  const safeEvidence = processEvidence(
    dispute?.evidence || [],
    dispute?.id || id || "",
  );
  const plaintiffWitnesses =
    dispute?.witnesses?.plaintiff?.map((w) => w.username) || [];
  const defendantWitnesses =
    dispute?.witnesses?.defendant?.map((w) => w.username) || [];
  const safeDescription = dispute?.description || "No description provided.";
  const safeClaim = dispute?.claim || "No claim specified.";

  const defendantEvidence = dispute?.defendantResponse
    ? processEvidence(
        dispute.defendantResponse.evidence || [],
        dispute?.id || id || "",
      )
    : [];

  // Function to handle evidence viewing
  const handleViewEvidence = (evidence: EvidenceItem) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
  };

  // Voting handlers
  const handleVoteChange = useCallback(
    (
      choice: "plaintiff" | "defendant" | "dismissed" | null,
      comment: string,
    ) => {
      setVoteData({ choice, comment });
    },
    [],
  );

  const handleCastVote = useCallback(async () => {
    if (!voteData.choice || !disputeId || !user) return;

    let loadingToast: string | number | undefined;

    try {
      loadingToast = toast.loading("Submitting your vote...");

      await disputeService.castVote(disputeId, {
        voteType:
          voteData.choice === "plaintiff"
            ? 1
            : voteData.choice === "defendant"
              ? 2
              : 3,
        comment: voteData.comment,
      });

      toast.dismiss(loadingToast);

      // Use the hook to mark as voted
      markAsVoted(voteData.choice);

      const voteMessage =
        voteData.choice === "plaintiff"
          ? "You voted for the Plaintiff"
          : voteData.choice === "defendant"
            ? "You voted for the Defendant"
            : "You voted to dismiss the case";

      toast.success("Vote Submitted Successfully! 🗳️", {
        description: `${voteMessage}. Your vote is now confidential.`,
      });

      setVoteModalOpen(false);
      setVoteData({ choice: null, comment: "" });

      // Refresh dispute details
      const disputeDetails = await disputeService.getDisputeDetails(disputeId);
      const transformedDispute =
        disputeService.transformDisputeDetailsToRow(disputeDetails);
      setDispute(transformedDispute);
    } catch (error: any) {
      if (loadingToast) toast.dismiss(loadingToast);

      toast.error("Failed to submit vote", {
        description: error.message || "Please try again later",
      });
      throw error;
    }
  }, [voteData, disputeId, user, markAsVoted]);

  const handleOpenVoteModal = useCallback(() => {
    setVoteModalOpen(true);
    // Reset vote data when opening modal
    setVoteData({ choice: null, comment: "" });
  }, []);

  // Reply handlers with witnesses
  const handleDefendantReply = useCallback(
    async (description: string, files: UploadedFile[], witnesses: string[]) => {
      if (!id) return;

      const disputeId = parseInt(id);
      if (isNaN(disputeId)) {
        toast.error("Invalid dispute ID");
        return;
      }

      try {
        const defendantClaimData: DefendantClaimRequest = {
          defendantClaim: description,
          witnesses: witnesses.filter((w) => w.trim()),
        };

        const fileList = files.map((uf) => uf.file);

        // Determine if this is a new response or an edit
        const isEditing = dispute?.defendantResponse !== undefined;

        if (isEditing) {
          // Use PATCH for editing existing response
          await disputeService.editDefendantClaim(
            disputeId,
            defendantClaimData,
            fileList.length > 0 ? fileList : undefined,
          );
          toast.success("Response updated successfully!");
        } else {
          // Use POST for new response
          await disputeService.submitDefendantClaim(
            disputeId,
            defendantClaimData,
            fileList.length > 0 ? fileList : undefined,
          );
          toast.success("Response submitted successfully!");
        }

        // Refresh dispute details
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        const transformedDispute =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        setDispute(transformedDispute);
      } catch (error: any) {
        toast.error("Failed to submit response", {
          description: error.message,
        });
        throw error;
      }
    },
    [id, dispute],
  );
  const handlePlaintiffReply = useCallback(
    async (
      title: string,
      description: string,
      claim: string,
      requestKind: number,
      files: UploadedFile[],
      witnesses: string[],
    ) => {
      if (!id) return;

      const disputeId = parseInt(id);
      if (isNaN(disputeId)) {
        toast.error("Invalid dispute ID");
        return;
      }

      try {
        const plaintiffClaimData: any = {};

        // Check what fields are actually being included
        if (title.trim() && title !== dispute?.title) {
          plaintiffClaimData.title = title;
        }
        if (description.trim() && description !== dispute?.description) {
          plaintiffClaimData.description = description;
        }
        if (claim.trim() && claim !== dispute?.claim) {
          plaintiffClaimData.claim = claim;
        }
        if (requestKind !== undefined) {
          plaintiffClaimData.requestKind = requestKind;
          console.log("🔍 Including requestKind:", requestKind);
        }

        if (witnesses !== undefined) {
          plaintiffClaimData.witnesses = witnesses.filter((w) => w.trim());
        }

        // Check if at least one field is provided
        if (
          Object.keys(plaintiffClaimData).length === 0 &&
          files.length === 0
        ) {
          throw new Error("Please provide at least one field to update");
        }

        const fileList = files.map((uf) => uf.file);

        await disputeService.editPlaintiffClaim(
          disputeId,
          plaintiffClaimData,
          fileList.length > 0 ? fileList : undefined,
        );

        toast.success("Dispute updated successfully!");

        // Refresh dispute details
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        const transformedDispute =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        setDispute(transformedDispute);
      } catch (error: any) {
        console.error("❌ Error details:", error);
        toast.error("Failed to update dispute", {
          description: error.message,
        });
        throw error;
      }
    },
    [id, dispute],
  );

  const handleSettleDispute = useCallback(async () => {
    if (!id) return;

    const disputeId = parseInt(id);
    if (isNaN(disputeId)) {
      toast.error("Invalid dispute ID");
      return;
    }

    try {
      await disputeService.settleDispute(disputeId);
      toast.success("Dispute settled successfully!");
      setSettleModalOpen(false);

      // Refresh dispute details
      const disputeDetails = await disputeService.getDisputeDetails(disputeId);
      const transformedDispute =
        disputeService.transformDisputeDetailsToRow(disputeDetails);
      setDispute(transformedDispute);
    } catch (error: any) {
      toast.error("Failed to settle dispute", {
        description: error.message,
      });
    }
  }, [id]);

  const hasValidDefendantResponse = (defendantResponse: any) => {
    if (!defendantResponse) return false;
    if (!defendantResponse.description) return false;

    const trimmedDesc = defendantResponse.description.trim();
    return trimmedDesc !== "" && trimmedDesc !== "No response description";
  };

  const handleEscalateToVote = useCallback(async () => {
    if (!disputeId || !user) return;

    try {
      setEscalating(true);
      await disputeService.escalateDisputesToVote([disputeId]);

      toast.success("Dispute escalated to voting period!", {
        description:
          "The dispute has been moved from Pending to Vote in Progress.",
      });

      // Refresh dispute details
      const disputeDetails = await disputeService.getDisputeDetails(disputeId);
      const transformedDispute =
        disputeService.transformDisputeDetailsToRow(disputeDetails);
      setDispute(transformedDispute);
    } catch (error: any) {
      toast.error("Failed to escalate dispute", {
        description: error.message || "Please try again later",
      });
    } finally {
      setEscalating(false);
    }
  }, [disputeId, user]);

  // Add this component inside your DisputeDetails component
  const VotingStatus = () => {
    if (dispute?.status !== "Vote in Progress") return null;

    // Show loading state
    if (votingStatusLoading) {
      return (
        <div className="animate-fade-in card-cyan rounded-2xl p-6">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
            <p className="text-sm text-cyan-200">Checking voting status...</p>
          </div>
        </div>
      );
    }

    const userRole = getUserRole();
    const isJudge = isUserJudge();
    const isCommunity = isUserCommunity();
    const isParty = userRole === "plaintiff" || userRole === "defendant";

    // User is plaintiff or defendant - they CANNOT vote
    if (isParty) {
      return (
        <div className="animate-fade-in card-amber glass mx-auto rounded-2xl p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
              <Shield className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-amber-300">
                Case Participant
              </h3>
              <p className="text-sm text-amber-200">
                {userRole === "plaintiff"
                  ? "As the plaintiff, you cannot vote in your own dispute."
                  : "As the defendant, you cannot vote in your own dispute."}
              </p>
              <p className="mt-2 text-xs text-amber-300/70">
                Voting is for community members and judges only.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // User has voted - Consistent with Voting page
    if (hasVoted) {
      return (
        <div className="animate-fade-in card-emerald glass mx-auto rounded-2xl p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-emerald-300">
                Vote Submitted!
              </h3>
              <p className="text-sm text-emerald-200">
                Thank you for participating in this dispute.
                {isJudge && (
                  <span className="mt-1 block text-emerald-300">
                    ⚖️ Your vote carries judge weight
                  </span>
                )}
              </p>
              <p className="mt-2 text-xs text-emerald-300/70">
                Results will be revealed when voting ends.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // User can vote
    if (canVote) {
      return (
        <div className="animate-fade-in card-cyan glass mx-auto rounded-2xl p-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20">
              <Vote className="h-6 w-6 text-cyan-300" />
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="mb-1 text-lg font-bold text-cyan-300">
                Cast Your Vote
              </h3>
              <p className="text-center text-sm text-cyan-200">
                Your vote will help resolve this dispute fairly.
                {isJudge && (
                  <span className="mt-1 block font-semibold text-cyan-300">
                    Judge Vote - Carries Higher Weight
                  </span>
                )}
                {isCommunity && (
                  <span className="mt-1 block text-cyan-300">
                    Community Vote
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="neon"
              className="neon-hover mt-2"
              onClick={handleOpenVoteModal}
              size="lg"
            >
              <Vote className="mr-2 h-4 w-4" />
              Cast {isJudge ? "Judge" : "Community"} Vote
            </Button>
          </div>
        </div>
      );
    }

    // User cannot vote (but not because they're a party)
    return (
      <div className="animate-fade-in card-amber glass mx-auto rounded-2xl p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <Shield className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-bold text-amber-300">
              Voting in Progress
            </h3>
            <p className="text-sm text-amber-200">
              This dispute is currently being voted on by eligible community
              members.
            </p>
            {reason && (
              <p className="mt-2 text-xs text-amber-300/70">{reason}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-muted-foreground">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="py-6 text-white">
        <Button
          onClick={() => navigate("/disputes")}
          variant="ghost"
          className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Disputes
        </Button>
        <p className="text-red-400">Dispute not found.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 py-6 text-white">
      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        {/* Back Button */}

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/disputes")}
            variant="outline"
            className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            <p className="flex items-center gap-1">
              Back<span className="hidden sm:block"> to Disputes</span>
            </p>
          </Button>

          {/* Role Badge */}
          {isUserJudge() && (
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
              <Gavel className="h-3 w-3" />
              Judge
            </span>
          )}
          {isUserCommunity() && (
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
              <Users className="h-3 w-3" />
              <p className="block">Community</p>
            </span>
          )}

          {/* Status Badge */}
          <div>
            {dispute.status === "Settled" ? (
              <span className="badge-blue inline-flex items-center rounded-full border px-4 py-1 text-sm">
                Settled
              </span>
            ) : dispute.status === "Pending" ? (
              <span className="badge-orange inline-flex items-center rounded-full border px-4 py-1 text-sm">
                Pending
              </span>
            ) : dispute.status === "Dismissed" ? (
              <span className="badge-red inline-flex items-center rounded-full border px-4 py-1 text-sm">
                Dismissed
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-300">
                Vote in Progress
              </span>
            )}
          </div>
        </div>
        {/* Right Side Actions */}
        {/* Right Side Actions */}
        <div className="flex items-center gap-1">
          {/* Show Vote Outcome for Settled/Dismissed disputes */}
          {(dispute.status === "Settled" || dispute.status === "Dismissed") && (
            <Button
              variant="neon"
              className="neon-hover"
              onClick={() => setVoteOutcomeModalOpen(true)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              See Vote Outcome
            </Button>
          )}

          {dispute?.status === "Pending" && (
            <Button
              variant="outline"
              className="border-purple-400/30 text-purple-300 hover:bg-purple-500/10"
              onClick={handleEscalateToVote}
              disabled={escalating}
            >
              {escalating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Vote className="mr-2 h-4 w-4" />
              )}
              {escalating ? "Escalating..." : "Test: Escalate to Vote"}
            </Button>
          )}
          {/* Show Cast Vote button ONLY for Vote in Progress disputes AND if user is NOT plaintiff/defendant */}
          {dispute.status === "Vote in Progress" &&
            canVote &&
            !hasVoted &&
            !isCurrentUserPlaintiff() &&
            !isCurrentUserDefendant() && (
              <Button
                variant="neon"
                className="neon-hover ml-auto"
                onClick={handleOpenVoteModal}
              >
                <Vote className="mr-2 h-4 w-4" />
                Cast {isUserJudge() ? "Judge" : "Community"} Vote
              </Button>
            )}

          {/* Show voted status ONLY if user is NOT plaintiff/defendant */}
          {dispute.status === "Vote in Progress" &&
            hasVoted &&
            !isCurrentUserPlaintiff() &&
            !isCurrentUserDefendant() && (
              <div className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2">
                <span className="text-emerald-300">
                  ✅ {isUserJudge() ? "Judge " : ""}Vote Submitted
                  {isUserJudge() && " ⚖️"}
                </span>
              </div>
            )}
        </div>
      </div>
      {/* Header Card */}
      {/* Header Card */}
      {/* Agreement and Contract Information Panel */}
      <div className="">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-300">
          <FileText className="h-5 w-5" />
          Agreement & Contract Details
        </h3>

        {/* Agreement and Contract Information Panel */}
        {(dispute.agreement?.type ||
          dispute.votingId ||
          dispute.contractAgreementId) && (
          <div className="w-fit rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-blue-300">
              <FileText className="h-5 w-5" />
              Agreement & Contract Details
            </h3>

            <div className="flex flex-wrap gap-2">
              {/* Agreement Type Card */}
              {dispute.agreement?.type && (
                <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                      <FileText className="h-4 w-4 text-blue-300" />
                    </div>
                    <span className="text-sm font-medium text-blue-300">
                      Agreement Type
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-200">
                      {dispute.agreement.type === 2 ? "Escrow" : "Reputational"}
                    </span>
                  </div>
                  {dispute.agreement.status && (
                    <div className="mt-2 text-xs text-blue-300/70">
                      Status: {dispute.agreement.status}
                    </div>
                  )}
                </div>
              )}

              {/* Voting ID Card */}
              {dispute.votingId && (
                <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                      <Vote className="h-4 w-4 text-purple-300" />
                    </div>
                    <span className="text-sm font-medium text-purple-300">
                      Voting ID
                    </span>
                  </div>
                  <div className="font-mono text-lg font-bold text-purple-200">
                    #{dispute.votingId}
                  </div>
                  <div className="mt-1 text-xs text-purple-300/70">
                    Unique voting identifier
                  </div>
                </div>
              )}

              {/* Contract Agreement ID Card */}
              {dispute.contractAgreementId && (
                <div className="rounded-lg border border-green-400/20 bg-green-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <span className="text-lg">📜</span>
                    </div>
                    <span className="text-sm font-medium text-green-300">
                      Contract ID
                    </span>
                  </div>
                  <div className="font-mono text-lg font-bold text-green-200">
                    {dispute.contractAgreementId}
                  </div>
                  <div className="mt-1 text-xs text-green-300/70">
                    On-chain contract reference
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information Row */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Chain ID */}
              {dispute.chainId && (
                <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-4 py-2">
                  <span className="text-sm text-cyan-300">Chain ID</span>
                  <span className="font-mono text-sm font-bold text-cyan-200">
                    {dispute.chainId}
                  </span>
                </div>
              )}

              {/* Transaction Hash */}
              {dispute.txnhash && (
                <div className="flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2">
                  <span className="text-sm text-amber-300">
                    Transaction Hash
                  </span>
                  <span className="truncate font-mono text-xs text-amber-200">
                    {dispute.txnhash}
                  </span>
                </div>
              )}

              {/* Dispute Type */}
              {dispute.type !== undefined && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-4 py-2">
                  <span className="text-sm text-indigo-300">Dispute Type</span>
                  <span className="text-sm font-bold text-indigo-200">
                    {dispute.type === 1 ? "Pro Bono" : "Paid"}
                  </span>
                </div>
              )}

              {/* Vote Timings */}
              {dispute.voteStartedAt && (
                <div className="flex items-center justify-between rounded-lg border border-violet-400/20 bg-violet-500/10 px-4 py-2">
                  <span className="text-sm text-violet-300">Vote Started</span>
                  <span className="text-xs text-violet-200">
                    {new Date(dispute.voteStartedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 w-fit rounded-lg border border-gray-400/20 bg-gray-500/10 p-3">
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-300">
                    Debug Info
                  </summary>
                  <pre className="mt-2 overflow-auto text-gray-400">
                    {JSON.stringify(
                      {
                        votingId: dispute.votingId,
                        contractAgreementId: dispute.contractAgreementId,
                        chainId: dispute.chainId,
                        agreement: dispute.agreement,
                        type: dispute.type,
                        result: dispute.result,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex grid-cols-2 flex-col gap-6 lg:grid">
        <div className="card-cyan rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <h1 className="mb-2 font-bold text-cyan-400 lg:text-[22px]">
                {dispute.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>{dispute.request}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                <Users className="h-4 w-4" />
                <span>Parties</span>
              </div>
              <div className="mt-1 flex flex-col items-center gap-2 text-sm">
                {/* Plaintiff with Avatar and Verification */}
                <div className="flex items-center gap-2">
                  <UserAvatar
                    userId={
                      dispute.plaintiffData?.userId ||
                      cleanTelegramUsername(dispute.plaintiff)
                    }
                    avatarId={dispute.plaintiffData?.avatarId || null}
                    username={cleanTelegramUsername(dispute.plaintiff)}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const cleanUsername = cleanTelegramUsername(
                        dispute.plaintiff,
                      );
                      const encodedUsername = encodeURIComponent(cleanUsername);
                      navigate(`/profile/${encodedUsername}`);
                    }}
                    className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    {formatDisplayName(dispute.plaintiff)} {/* Updated */}
                    {isCurrentUserPlaintiff() && (
                      <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                    )}
                  </button>
                </div>
                <span className="text-white/50">vs</span>
                {/* Defendant with Avatar and Verification */}
                <div className="flex items-center gap-2">
                  <UserAvatar
                    userId={
                      dispute.defendantData?.userId ||
                      cleanTelegramUsername(dispute.defendant)
                    }
                    avatarId={dispute.defendantData?.avatarId || null}
                    username={cleanTelegramUsername(dispute.defendant)}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const cleanUsername = cleanTelegramUsername(
                        dispute.defendant,
                      );
                      const encodedUsername = encodeURIComponent(cleanUsername);
                      navigate(`/profile/${encodedUsername}`);
                    }}
                    className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 hover:underline"
                  >
                    {formatDisplayName(dispute.defendant)} {/* Updated */}
                    {isCurrentUserDefendant() && (
                      <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Source Agreement Information Section - Using data from dispute.agreement */}
        {dispute.agreement && (
          <div className="rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-transparent p-4">
            <div className="space-y-4">
              <div className="px-4">
                <h2 className="">Source Agreement</h2>
                <div className="flex flex-col justify-between gap-2">
                  <div>
                    <h4 className="mb-2 font-bold text-cyan-400 lg:text-[22px]">
                      {dispute.agreement.title ||
                        `Agreement #${dispute.agreement.id}`}
                    </h4>

                    {/* Agreement Status and Type Row */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {/* Agreement Status with Icon */}
                      {dispute.agreement.status && (
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${getAgreementStatusBadgeColor(dispute.agreement.status)}`}
                        >
                          {getAgreementStatusIcon(dispute.agreement.status)}
                          <span>
                            {getAgreementStatusText(dispute.agreement.status)}
                          </span>
                        </div>
                      )}

                      {/* Agreement Type Badge */}
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                          dispute.agreement.type === 2
                            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            : "border border-blue-400/30 bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {dispute.agreement.type === 2
                          ? "Escrow Agreement"
                          : "Reputational Agreement"}
                      </span>
                    </div>

                    {/* Agreement Details Grid */}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={
                        dispute.agreement.type === 2
                          ? `/escrow/${dispute.agreement.id}`
                          : `/agreements/${dispute.agreement.id}`
                      }
                      className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-500/30 hover:text-white"
                    >
                      <FileText className="h-4 w-4" />
                      View Source Agreementsss
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {dispute.status === "Vote in Progress" && <VotingStatus />}
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plaintiff Column */}
        <div className="space-y-6">
          {/* Plaintiff Header */}
          {/* Plaintiff Header */}
          <div className="animate-slide-in-left ml-auto flex w-fit items-center gap-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
            <UserAvatar
              userId={
                dispute.plaintiffData?.userId ||
                cleanTelegramUsername(dispute.plaintiff)
              }
              avatarId={dispute.plaintiffData?.avatarId || null}
              username={cleanTelegramUsername(dispute.plaintiff)}
              size="md"
            />
            <div>
              <h2 className="text-lg font-bold text-cyan-400">Plaintiff</h2>
              <div className="flex items-center gap-2 text-sm text-cyan-300">
                <button
                  type="button"
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.plaintiff,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="hover:text-cyan-200 hover:underline"
                >
                  {formatDisplayName(dispute.plaintiff)} {/* Updated */}
                </button>
                {isCurrentUserPlaintiff() && (
                  <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                )}
                <button
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.plaintiff,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="text-cyan-400 hover:text-cyan-300"
                ></button>
              </div>
            </div>
          </div>
          {/* Initial Claim */}
          <div className="space-y-4">
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                <MessageCircle className="h-4 w-4" />
                Initial Complaint
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </span>
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-cyan-200">
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed text-cyan-100">
                    {safeDescription}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-green-400">
                    Formal Claim
                  </h4>
                  <p className="text-sm leading-relaxed text-cyan-100">
                    {safeClaim}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence */}
            {safeEvidence.length > 0 && (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                  <Upload className="h-4 w-4" />
                  Supporting Evidence ({safeEvidence.length})
                </h3>
                <EvidenceDisplay
                  evidence={safeEvidence}
                  color="cyan"
                  onViewEvidence={handleViewEvidence}
                />
              </div>
            )}

            {/* Witnesses */}
            {/* Plaintiff's Witnesses */}
            {plaintiffWitnesses.length > 0 && (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                  <UserCheck className="h-4 w-4" />
                  Plaintiff's Witnesses ({plaintiffWitnesses.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {plaintiffWitnesses.map((witness, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const cleanUsername = cleanTelegramUsername(witness);
                        const encodedUsername =
                          encodeURIComponent(cleanUsername);
                        navigate(`/profile/${encodedUsername}`);
                      }}
                      className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/30 hover:text-cyan-200 hover:underline"
                    >
                      {formatDisplayName(witness)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Defendant Column */}
        {/* Defendant Column */}
        <div className="space-y-6">
          {/* Defendant Header */}
          <div className="animate-slide-in-right flex w-fit items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-4">
            <UserAvatar
              userId={
                dispute.defendantData?.userId ||
                cleanTelegramUsername(dispute.defendant)
              }
              avatarId={dispute.defendantData?.avatarId || null}
              username={cleanTelegramUsername(dispute.defendant)}
              size="md"
            />
            <div>
              <h2 className="text-lg font-bold text-yellow-400">Defendant</h2>
              <div className="flex items-center gap-2 text-sm text-yellow-300">
                <button
                  type="button"
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.defendant,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="hover:text-yellow-200 hover:underline"
                >
                  {formatDisplayName(dispute.defendant)} {/* Updated */}
                </button>
                {isCurrentUserDefendant() && (
                  <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                )}
              </div>
            </div>
          </div>

          {/* Defendant Response */}
          {dispute.defendantResponse ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                  <MessageCircle className="h-4 w-4" />
                  Response to Claims
                  <span className="text-muted-foreground ml-auto text-xs">
                    {new Date(
                      dispute.defendantResponse.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </h3>
                <p className="text-sm leading-relaxed text-yellow-100">
                  {dispute.defendantResponse.description}
                </p>
              </div>

              {/* Defendant's Evidence */}
              {defendantEvidence.length > 0 && (
                <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                    <Upload className="h-4 w-4" />
                    Defense Evidence ({defendantEvidence.length})
                  </h3>
                  <EvidenceDisplay
                    evidence={defendantEvidence}
                    color="yellow"
                    onViewEvidence={handleViewEvidence}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-yellow-400/30 bg-yellow-500/5 p-8 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-yellow-400/50" />
              <h3 className="mb-2 text-lg font-semibold text-yellow-300">
                Awaiting Response
              </h3>
              <p className="mb-4 text-sm text-yellow-200/70">
                The defendant has not yet responded to the claims.
              </p>
            </div>
          )}

          {/* Defendant Witnesses Section */}
          {/* Defendant's Witnesses Section */}
          {defendantWitnesses.length > 0 && (
            <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                <UserCheck className="h-4 w-4" />
                Defendant's Witnesses ({defendantWitnesses.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {defendantWitnesses.map((witness, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const cleanUsername = cleanTelegramUsername(witness);
                      const encodedUsername = encodeURIComponent(cleanUsername);
                      navigate(`/profile/${encodedUsername}`);
                    }}
                    className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300 transition-colors hover:bg-yellow-500/30 hover:text-yellow-200 hover:underline"
                  >
                    {formatDisplayName(witness)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Voting Section - Prominent display for Vote in Progress disputes */}
      </div>
      {/* Action Buttons */}
      {/* Action Buttons */}
      {/* Action Buttons */}
      <div className="flex gap-3 border-b border-white/10 py-6">
        {/* Plaintiff Edit Button - Only show when dispute is pending */}
        {dispute.status === "Pending" && isCurrentUserPlaintiff() && (
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
            onClick={() => setPlaintiffReplyModalOpen(true)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Edit as Plaintiff
          </Button>
        )}

        {/* Settle Dispute Button - Only for plaintiff when dispute is pending */}
        {dispute.status === "Pending" && isCurrentUserPlaintiff() && (
          <Button
            variant="outline"
            className="border-green-400/30 text-green-300 hover:bg-green-500/10"
            onClick={() => setSettleModalOpen(true)}
          >
            <Scale className="mr-2 h-4 w-4" />
            Settle Dispute
          </Button>
        )}

        {/* Defendant Response Button - Only for defendant when no response exists and dispute is pending */}
        {dispute.status === "Pending" &&
          isCurrentUserDefendant() &&
          !hasValidDefendantResponse(dispute.defendantResponse) && (
            <Button
              variant="outline"
              className="ml-auto border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
              onClick={() => setDefendantReplyModalOpen(true)}
            >
              <Shield className="mr-2 h-4 w-4" />
              Respond as Defendant
            </Button>
          )}

        {/* Defendant Edit Button - Show when defendant has responded AND dispute is still pending */}
        {dispute.status === "Pending" &&
          isCurrentUserDefendant() &&
          hasValidDefendantResponse(dispute.defendantResponse) && (
            <Button
              variant="outline"
              className="ml-auto border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
              onClick={() => setDefendantReplyModalOpen(true)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Edit as Defendant
            </Button>
          )}

        {/* Show Cast Vote button ONLY for Vote in Progress disputes AND if user is NOT plaintiff/defendant */}
        {dispute.status === "Vote in Progress" &&
          canVote &&
          !hasVoted &&
          !isCurrentUserPlaintiff() &&
          !isCurrentUserDefendant() && (
            <Button
              variant="neon"
              className="neon-hover ml-auto"
              onClick={handleOpenVoteModal}
            >
              <Vote className="mr-2 h-4 w-4" />
              Cast Vote
            </Button>
          )}

        {/* Show voted status ONLY if user is NOT plaintiff/defendant */}
        {dispute.status === "Vote in Progress" &&
          hasVoted &&
          !isCurrentUserPlaintiff() &&
          !isCurrentUserDefendant() && (
            <div className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2">
              <span className="text-emerald-300">✅ Vote Submitted</span>
            </div>
          )}
      </div>
      {/* Dispute Chat Integration */}
      <div className="mt-8">
        <DisputeChat disputeId={parseInt(id!)} userRole={getUserRole()} />
      </div>
      {/* Evidence Viewer Modal */}
      <EvidenceViewer
        isOpen={evidenceViewerOpen}
        onClose={() => {
          setEvidenceViewerOpen(false);
        }}
        selectedEvidence={selectedEvidence}
      />
      {/* Vote Outcome Modal */}
      <VoteOutcomeModal
        isOpen={voteOutcomeModalOpen}
        onClose={() => setVoteOutcomeModalOpen(false)}
        disputeId={parseInt(id!)}
        // Optional: You can also pass voteOutcome data directly if you already have it
        // voteOutcome={yourVoteOutcomeData}
      />
      {/* Vote Modal */}
      <VoteModal
        isOpen={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        voteData={voteData}
        onVoteChange={handleVoteChange}
        onCastVote={handleCastVote}
        hasVoted={hasVoted}
        isSubmitting={false}
        dispute={dispute}
        canUserVote={canUserVote}
        isCurrentUserPlaintiff={isCurrentUserPlaintiff}
        isCurrentUserDefendant={isCurrentUserDefendant}
        isJudge={isUserJudge()} // Pass actual judge status
      />
      {/* Plaintiff Reply Modal */}
      <PlaintiffReplyModal
        isOpen={plaintiffReplyModalOpen}
        onClose={() => setPlaintiffReplyModalOpen(false)}
        dispute={dispute}
        onSubmit={handlePlaintiffReply}
        navigate={navigate}
      />
      {/* Defendant Reply Modal */}
      <DefendantReplyModal
        isOpen={defendantReplyModalOpen}
        onClose={() => setDefendantReplyModalOpen(false)}
        dispute={dispute}
        onSubmit={handleDefendantReply}
        navigate={navigate}
      />
      <SettleConfirmationModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        onConfirm={handleSettleDispute}
        disputeTitle={dispute?.title}
      />
    </div>
  );
}
