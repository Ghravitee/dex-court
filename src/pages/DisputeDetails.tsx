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
import { agreementService } from "../services/agreementServices";

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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [sourceAgreement, setSourceAgreement] = useState<any>(null);
  const [, setAgreementLoading] = useState(false);

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

  useEffect(() => {
    console.log("🔍 VOTING STATUS DEBUG:");
    console.log("Dispute ID:", disputeId);
    console.log("Dispute data:", dispute);
    console.log("HasVoted from dispute:", dispute?.hasVoted);
    console.log("Hook state - hasVoted:", hasVoted);
    console.log("Hook state - canVote:", canVote);
    console.log("Hook state - reason:", reason);
    console.log("Hook state - isLoading:", votingStatusLoading);
  }, [dispute, hasVoted, canVote, reason, votingStatusLoading, disputeId]);

  // Add effect to fetch agreement details if agreementId exists
  useEffect(() => {
    const fetchSourceAgreement = async () => {
      if (!dispute?.agreementId) return;

      setAgreementLoading(true);
      try {
        // You'll need to import your agreement service
        const agreementDetails = await agreementService.getAgreementDetails(
          dispute.agreementId,
        );
        setSourceAgreement(agreementDetails);
      } catch (error) {
        console.error("Failed to fetch source agreement:", error);
      } finally {
        setAgreementLoading(false);
      }
    };

    fetchSourceAgreement();
  }, [dispute?.agreementId]);

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
    setPdfLoading(evidence.type === "pdf");
    setPdfError(false);
  };

  // Function to handle PDF load events
  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  const handlePdfError = () => {
    setPdfLoading(false);
    setPdfError(true);
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

  // Add this component inside your DisputeDetails component
  const VotingStatus = () => {
    if (dispute?.status !== "Vote in Progress") return null;

    // Show loading state
    if (votingStatusLoading) {
      return (
        <div className="animate-fade-in card-cyan glass rounded-2xl p-6">
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
      <div className="flex items-center justify-between">
        {/* Back Button */}

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/disputes")}
            variant="outline"
            className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            <p className="hidden sm:block">Back to Disputes</p>
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
              <p className="hidden sm:block">Community</p>
            </span>
          )}

          {/* Status Badge */}
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

          {/* {dispute.agreementId && (
            <Link
              to={`/agreements/${dispute.agreementId}`}
              className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 hover:text-blue-200"
            >
              <FileText className="h-4 w-4" />
              View Source Agreement
              {dispute.agreementTitle && (
                <span className="max-w-[200px] truncate text-xs text-blue-400/70">
                  {dispute.agreementTitle}
                </span>
              )}
            </Link>
          )} */}
        </div>
        {/* Right Side Actions */}
        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
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
      <div className="flex grid-cols-2 flex-col gap-6 lg:grid">
        <div className="card-cyan glass max-w-2xl rounded-2xl p-6 shadow-lg">
          <div className="flex items-start justify-between">
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
                    {formatTelegramUsernameForDisplay(dispute.plaintiff)}
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
                    {formatTelegramUsernameForDisplay(dispute.defendant)}
                    {isCurrentUserDefendant() && (
                      <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Agreement Information Section */}
        {dispute.agreementId && sourceAgreement && (
          <div className="glass rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-transparent p-6">
            <div className="space-y-4">
              <div className="p-4">
                <div className="flex flex-col justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-blue-300">
                      {sourceAgreement.title ||
                        `Agreement #${dispute.agreementId}`}
                    </h4>
                    <p className="mt-1 text-sm text-blue-200/80">
                      Created:{" "}
                      {new Date(sourceAgreement.createdAt).toLocaleDateString()}
                    </p>
                    {sourceAgreement.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-blue-300/70">
                        {sourceAgreement.description}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/agreements/${dispute.agreementId}`}
                    className="flex w-fit items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-500/30 hover:text-white"
                  >
                    <FileText className="h-4 w-4" />
                    View Source Agreement
                  </Link>
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
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.plaintiff,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="hover:text-cyan-200 hover:underline"
                >
                  {formatTelegramUsernameForDisplay(dispute.plaintiff)}
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
            {plaintiffWitnesses.length > 0 && (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                  <UserCheck className="h-4 w-4" />
                  Plaintiff's Witnesses ({plaintiffWitnesses.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {plaintiffWitnesses.map((witness, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300"
                    >
                      {witness}
                    </span>
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
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.defendant,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="hover:text-yellow-200 hover:underline"
                >
                  {formatTelegramUsernameForDisplay(dispute.defendant)}
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
          {defendantWitnesses.length > 0 && (
            <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                <UserCheck className="h-4 w-4" />
                Defendant's Witnesses ({defendantWitnesses.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {defendantWitnesses.map((witness, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300"
                  >
                    {witness}
                  </span>
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
          setPdfLoading(false);
          setPdfError(false);
        }}
        selectedEvidence={selectedEvidence}
        onPdfLoad={handlePdfLoad}
        onPdfError={handlePdfError}
        pdfLoading={pdfLoading}
        pdfError={pdfError}
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
