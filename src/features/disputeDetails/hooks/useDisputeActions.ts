/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { disputeService } from "../../../services/disputeServices";
import { ESCROW_ABI } from "../../../web3/config";
import type {
  DisputeRow,
  UploadedFile,
  DefendantClaimRequest,
  VoteData,
} from "../../../types";
import { useVotingStatus } from "../../voting/hooks/useVotingStatus";
import { useAuth } from "../../../hooks/useAuth";

interface UseDisputeActionsOptions {
  id: string | undefined;
  dispute: DisputeRow | null;
  escrowContractAddress: `0x${string}` | null;
  refreshDispute: (id: number) => Promise<DisputeRow>;
  isUserAdmin: () => boolean;
  isUserJudge: () => boolean;
}

export function useDisputeActions({
  id,
  dispute,
  escrowContractAddress,
  refreshDispute,
  isUserAdmin,
  isUserJudge,
}: UseDisputeActionsOptions) {
  const { user } = useAuth();
  const disputeId = id ? parseInt(id) : null;

  // ─── Wagmi ─────────────────────────────────────────────────────────────────
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  // ─── Local states ──────────────────────────────────────────────────────────
  const [escalating, setEscalating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [canFinalize, setCanFinalize] = useState(false);
  const [settlingDispute, setSettlingDispute] = useState(false);
  const [pendingTransactionType, setPendingTransactionType] = useState<
    "settle" | "startVote" | null
  >(null);
  const [voteStarted, setVoteStarted] = useState(false);
  const [voteData, setVoteData] = useState<VoteData>({
    choice: null,
    comment: "",
  });

  // ─── Voting status ─────────────────────────────────────────────────────────
  const {
    hasVoted,
    canVote,
    reason,
    isLoading: votingStatusLoading,
    markAsVoted,
    tier,
    weight,
  } = useVotingStatus(disputeId, dispute);

  // ─── isVoteStarted ─────────────────────────────────────────────────────────
  const isVoteStarted = useCallback((): boolean => {
    if (!dispute) return false;
    if (dispute.agreement?.type === 1)
      return dispute.status === "Vote in Progress";
    if (dispute.agreement?.type === 2) return voteStarted;
    return false;
  }, [dispute, voteStarted]);

  // ─── canFinalize check ─────────────────────────────────────────────────────
  const checkIfCanFinalize = useCallback((): boolean => {
    if (!dispute || !user) return false;
    return (
      dispute.status === "Vote in Progress" && (isUserAdmin() || isUserJudge())
    );
  }, [dispute, user, isUserAdmin, isUserJudge]);

  useEffect(() => {
    if (dispute && user) setCanFinalize(checkIfCanFinalize());
  }, [dispute, user, checkIfCanFinalize]);

  // ─── On-chain tx effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (isSuccess && hash && pendingTransactionType) {
      if (pendingTransactionType === "startVote") {
        toast.success("Voting can now begin! 🗳️", {
          description:
            "The voting phase has been initiated. Community members can now cast their votes.",
        });
        setVoteStarted(true);
        setTimeout(async () => {
          try {
            if (disputeId) await refreshDispute(disputeId);
          } catch {
            // Refresh failure after vote start is non-critical; the page still shows the updated status
          }
        }, 3000);
      }
      if (pendingTransactionType === "settle") {
        toast.success("Escrow dispute settled successfully! 🎉", {
          description: "Transaction confirmed! The page will refresh.",
        });
        setTimeout(() => window.location.reload(), 1500);
      }
      setPendingTransactionType(null);
      resetWrite();
    }
  }, [
    isSuccess,
    hash,
    pendingTransactionType,
    resetWrite,
    disputeId,
    refreshDispute,
  ]);

  useEffect(() => {
    if (writeError) resetWrite();
  }, [writeError, resetWrite]);

  // ─── Voting ────────────────────────────────────────────────────────────────
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
      markAsVoted();
      const msg =
        voteData.choice === "plaintiff"
          ? "You voted for the Plaintiff"
          : voteData.choice === "defendant"
            ? "You voted for the Defendant"
            : "You voted to dismiss the case";
      toast.success("Vote Submitted Successfully! 🗳️", {
        description: `${msg}. Your vote is now confidential.`,
      });
      setVoteData({ choice: null, comment: "" });
      if (disputeId) await refreshDispute(disputeId);
    } catch (error: any) {
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error("Failed to submit vote", {
        description: error.message || "Please try again later",
      });
      throw error;
    }
  }, [voteData, disputeId, user, markAsVoted, refreshDispute]);

  // ─── Replies ───────────────────────────────────────────────────────────────
  const handleDefendantReply = useCallback(
    async (description: string, files: UploadedFile[], witnesses: string[]) => {
      if (!id) return;
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        toast.error("Invalid dispute ID");
        return;
      }
      try {
        const data: DefendantClaimRequest = {
          defendantClaim: description,
          witnesses: witnesses.filter((w) => w.trim()),
        };
        const fileList = files.map((uf) => uf.file);
        const isEditing = dispute?.defendantResponse !== undefined;
        if (isEditing) {
          await disputeService.editDefendantClaim(
            parsedId,
            data,
            fileList.length > 0 ? fileList : undefined,
          );
          toast.success("Response updated successfully!");
        } else {
          await disputeService.submitDefendantClaim(
            parsedId,
            data,
            fileList.length > 0 ? fileList : undefined,
          );
          toast.success("Response submitted successfully!");
        }
        await refreshDispute(parsedId);
      } catch (error: any) {
        toast.error("Failed to submit response", {
          description: error.message,
        });
        throw error;
      }
    },
    [id, dispute, refreshDispute],
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
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        toast.error("Invalid dispute ID");
        return;
      }
      try {
        const plaintiffClaimData: any = {};
        if (title.trim() && title !== dispute?.title)
          plaintiffClaimData.title = title;
        if (description.trim() && description !== dispute?.description)
          plaintiffClaimData.description = description;
        if (claim.trim() && claim !== dispute?.claim)
          plaintiffClaimData.claim = claim;
        if (requestKind !== undefined)
          plaintiffClaimData.requestKind = requestKind;
        if (witnesses !== undefined)
          plaintiffClaimData.witnesses = witnesses.filter((w) => w.trim());
        if (
          Object.keys(plaintiffClaimData).length === 0 &&
          files.length === 0
        ) {
          throw new Error("Please provide at least one field to update");
        }
        const fileList = files.map((uf) => uf.file);
        await disputeService.editPlaintiffClaim(
          parsedId,
          plaintiffClaimData,
          fileList.length > 0 ? fileList : undefined,
        );
        toast.success("Dispute updated successfully!");
        await refreshDispute(parsedId);
      } catch (error: any) {
        toast.error("Failed to update dispute", { description: error.message });
        throw error;
      }
    },
    [id, dispute, refreshDispute],
  );

  // ─── Settle ────────────────────────────────────────────────────────────────
  const handleOnchainSettleDispute = useCallback(async () => {
    if (!dispute?.contractAgreementId) {
      toast.error("Cannot settle dispute: Contract agreement ID is missing");
      return;
    }
    if (!escrowContractAddress) {
      toast.error("Escrow contract address not loaded yet");
      return;
    }
    try {
      setPendingTransactionType("settle");
      writeContract({
        address: escrowContractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "settleDispute",
        args: [BigInt(dispute.contractAgreementId)],
      });
    } catch (error: unknown) {
      toast.error("Failed to settle dispute", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      setPendingTransactionType(null);
    }
  }, [dispute, escrowContractAddress, writeContract]);

  const handleSettleDispute = useCallback(async () => {
    if (!id) return;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      toast.error("Invalid dispute ID");
      return;
    }
    let loadingToast: string | number | undefined;
    try {
      setSettlingDispute(true);
      loadingToast = toast.loading(
        "Settling dispute... This may take a moment.",
      );
      await disputeService.settleDispute(parsedId);
      toast.dismiss(loadingToast);
      toast.success("Dispute settled successfully! 🎉", {
        description: "The dispute has been resolved and the page will refresh.",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      if (loadingToast) toast.dismiss(loadingToast);
      if (
        error.message?.includes("timeout") ||
        error.message?.includes("Request timeout") ||
        error.code === "ECONNABORTED"
      ) {
        toast.info("Settlement is processing...", {
          description:
            "This is taking longer than expected. The page will refresh to check status.",
        });
        setTimeout(() => window.location.reload(), 3000);
      } else {
        toast.error("Failed to settle dispute", {
          description: error.message || "Please try again later",
        });
      }
    } finally {
      setSettlingDispute(false);
    }
  }, [id]);

  // ─── Escalate ──────────────────────────────────────────────────────────────
  const handleEscalateToVote = useCallback(async () => {
    if (!disputeId || !user || !dispute) return;
    try {
      setEscalating(true);
      await disputeService.escalateDisputesToVote([disputeId]);
      toast.success("Dispute escalated to voting period!", {
        description:
          "The dispute has been moved from Pending to Vote in Progress.",
      });
      await refreshDispute(disputeId);
    } catch (error: any) {
      toast.error("Failed to escalate dispute", {
        description: error.message || "Please try again later",
      });
    } finally {
      setEscalating(false);
    }
  }, [disputeId, user, dispute, refreshDispute]);

  // ─── Finalize ──────────────────────────────────────────────────────────────
  const handleFinalizeVote = useCallback(async () => {
    if (!disputeId || !user) return;
    if (
      !confirm(
        "Are you sure you want to manually finalize this dispute? This will calculate votes and determine the outcome.",
      )
    )
      return;
    try {
      setFinalizing(true);
      const loadingToast = toast.loading("Finalizing dispute votes...");
      await disputeService.finalizeDisputes([disputeId]);
      toast.dismiss(loadingToast);
      toast.success("Dispute votes finalized successfully!");
      await refreshDispute(disputeId);
    } catch (error: any) {
      toast.error("Failed to finalize dispute", {
        description: error.message || "Please try again later",
      });
    } finally {
      setFinalizing(false);
    }
  }, [disputeId, user, refreshDispute]);

  // ─── canUserVote (for VoteModal prop) ─────────────────────────────────────
  const canUserVote = useCallback(async () => {
    return { canVote, reason, hasVoted, isJudge: isUserJudge() };
  }, [canVote, reason, hasVoted, isUserJudge]);

  return {
    // wagmi
    isPending,
    // voting status
    hasVoted,
    canVote,
    reason,
    votingStatusLoading,
    tier,
    weight,
    voteData,
    setVoteData,
    isVoteStarted,
    canFinalize,
    // actions
    handleVoteChange,
    handleCastVote,
    handleDefendantReply,
    handlePlaintiffReply,
    handleOnchainSettleDispute,
    handleSettleDispute,
    handleEscalateToVote,
    handleFinalizeVote,
    canUserVote,
    // loading flags
    escalating,
    finalizing,
    settlingDispute,
    pendingTransactionType,
    escrowContractAddress,
  };
}
