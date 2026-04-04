/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuth";
import {
  agreementService,
  type AgreementDeliveryRejectedRequest,
} from "../../../services/agreementServices";
import { api } from "../../../lib/apiClient";
import type { Agreement } from "../../../types";
import type { DisputeTypeEnumValue } from "../types";
import { DisputeTypeEnum, AgreementEventTypeEnum } from "../types";
import { generateVotingId } from "../utils/helpers";

interface UseAgreementActionsOptions {
  id: string | undefined;
  agreement: Agreement | null;
  fetchBackground: () => Promise<void>;
  setDisputeStatus: (s: any) => void;
  setDisputeVotingId: (id: number) => void;
  setRejectDisputeStatus: (s: any) => void;
  setAgreement: React.Dispatch<React.SetStateAction<Agreement | null>>;
  setPendingModalState: (s: {
    isOpen: boolean;
    votingId: number | null;
    flow: "reject" | "open";
  }) => void;
}

export function useAgreementActions({
  id,
  agreement,
  fetchBackground,
  setDisputeStatus,
  setDisputeVotingId,
  setRejectDisputeStatus,
  setAgreement,
  setPendingModalState,
}: UseAgreementActionsOptions) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSigning, setIsSigning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRespondingToCancel, setIsRespondingToCancel] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // ─── Sign ──────────────────────────────────────────────────────────────────

  const handleSignAgreement = useCallback(async () => {
    if (!id || !agreement) return;
    const requiresEscrow =
      agreement.useEscrow || agreement._raw?.secureTheFunds;
    if (
      agreement.includeFunds === "yes" &&
      requiresEscrow &&
      !user?.walletAddress
    ) {
      toast.error(
        "Wallet connection required for agreements secured with escrow",
      );
      return;
    }
    setIsSigning(true);
    try {
      await agreementService.signAgreement(parseInt(id), true);
      toast.success("Agreement signed successfully!");
      await fetchBackground();
    } catch (error: any) {
      const errorCode = error.response?.data?.error;
      const errorMessage = error.response?.data?.message;
      const errorMap: Record<number, string> = {
        12:
          agreement.includeFunds === "yes" &&
          (agreement.useEscrow || agreement._raw?.secureTheFunds)
            ? "Wallet connection required for escrow-secured agreements"
            : "Unexpected wallet requirement. Please contact support.",
        16: "Agreement is not in a signable state",
        17: "You are not authorized to sign this agreement",
      };
      toast.error(
        errorMap[errorCode] || errorMessage || "Failed to sign agreement",
      );
    } finally {
      setIsSigning(false);
    }
  }, [id, agreement, user, fetchBackground]);

  // ─── Cancel ────────────────────────────────────────────────────────────────

  const handleCancelAgreement = useCallback(async () => {
    if (!id || !agreement) return;
    const hasCancellationRequest =
      agreement.cancelPending ||
      agreement._raw?.cancelPending ||
      agreement.cancelRequestedById ||
      agreement._raw?.cancelRequestedById ||
      (agreement._raw?.timeline?.some(
        (e: any) => e.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED,
      ) ??
        false);

    if (hasCancellationRequest) {
      toast.error("There is already a pending cancellation request.");
      return;
    }
    if (!confirm("Are you sure you want to cancel this agreement?")) return;

    setIsCancelling(true);
    try {
      const agreementId = parseInt(id);
      if (agreement.status === "pending") {
        await agreementService.deleteAgreement(agreementId);
        toast.success("Agreement cancelled successfully!");
        navigate("/agreements");
      } else {
        await agreementService.requestCancelation(agreementId);
        toast.success(
          "Cancellation requested! Waiting for counterparty confirmation.",
        );
        await fetchBackground();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to cancel agreement. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  }, [id, agreement, navigate, fetchBackground]);

  // ─── Respond to cancellation ───────────────────────────────────────────────

  const handleRespondToCancelation = useCallback(
    async (accepted: boolean) => {
      if (!id || !agreement) return;
      const timeline = agreement.timeline || agreement._raw?.timeline || [];
      const hasCancelRequest = timeline.some(
        (e: any) =>
          e.type === 7 ||
          e.eventType === AgreementEventTypeEnum.CANCEL_REQUESTED,
      );
      if (!hasCancelRequest) {
        toast.error("No pending cancellation request found.");
        return;
      }

      setIsRespondingToCancel(true);
      try {
        await agreementService.respondToCancelation(parseInt(id), accepted);
        toast.success(
          accepted
            ? "Cancellation accepted! Agreement has been cancelled."
            : "Cancellation rejected! Agreement remains active.",
        );
        await fetchBackground();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message ||
            "Failed to respond to cancellation. Please try again.",
        );
      } finally {
        setIsRespondingToCancel(false);
      }
    },
    [id, agreement, fetchBackground],
  );

  // ─── Mark as delivered ─────────────────────────────────────────────────────

  const handleMarkAsDelivered = useCallback(async () => {
    if (!id || !agreement) return;
    setIsCompleting(true);
    try {
      await agreementService.markAsDelivered(parseInt(id));
      toast.success("Delivery marked! Waiting for the other party's approval.");
      await fetchBackground();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to mark as delivered. Please try again.",
      );
    } finally {
      setIsCompleting(false);
    }
  }, [id, agreement, fetchBackground]);

  // ─── Confirm delivery ──────────────────────────────────────────────────────

  const handleConfirmDelivery = useCallback(async () => {
    if (!id || !agreement) return;
    setIsConfirming(true);
    try {
      await agreementService.confirmDelivery(parseInt(id));
      toast.success("Delivery confirmed! Agreement completed.");
      await fetchBackground();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to confirm delivery. Please try again.",
      );
    } finally {
      setIsConfirming(false);
    }
  }, [id, agreement, fetchBackground]);

  // ─── Reject delivery ───────────────────────────────────────────────────────

  const handleConfirmReject = useCallback(
    async (
      claim: string,
      requestKind: DisputeTypeEnumValue,
      chainId?: number,
      votingId?: string,
    ) => {
      if (!id || !agreement) return;
      setIsSubmittingReject(true);
      try {
        const agreementId = parseInt(id);
        const votingIdToUse = votingId || generateVotingId();

        const payload: AgreementDeliveryRejectedRequest = {
          votingId: votingIdToUse.toString(),
          claim: claim.trim(),
          requestKind,
          ...(chainId && { chainId }),
        };

        await agreementService.rejectDelivery(agreementId, payload);

        if (requestKind === DisputeTypeEnum.Paid) {
          setRejectDisputeStatus("Pending Payment");
          setDisputeStatus("Pending Payment");
          setPendingModalState({
            isOpen: true,
            votingId: parseInt(votingIdToUse),
            flow: "reject",
          });
          toast.success(
            "Dispute created! Please confirm the transaction in your wallet.",
            { duration: 5000 },
          );
        } else {
          toast.success(
            `Delivery rejected! Dispute created. Voting ID: ${votingIdToUse}.`,
            { duration: 5000 },
          );
          await fetchBackground();
        }
      } catch (error: any) {
        toast.error("Failed to reject delivery", {
          description:
            error.response?.data?.message ||
            error.message ||
            "Please try again.",
          duration: 5000,
        });
        throw error;
      } finally {
        setIsSubmittingReject(false);
      }
    },
    [
      id,
      agreement,
      fetchBackground,
      setDisputeStatus,
      setRejectDisputeStatus,
      setPendingModalState,
    ],
  );

  // ─── Complete payment for existing dispute ─────────────────────────────────

  const handleCompletePayment = useCallback(() => {
    if (!id || !agreement) return;
    const votingId = agreement.disputeVotingId;
    if (!votingId) {
      toast.error("Unable to process payment: Missing voting ID");
      return;
    }
    const votingIdAsNumber =
      typeof votingId === "string" ? parseInt(votingId, 10) : votingId;
    if (isNaN(votingIdAsNumber)) {
      toast.error("Unable to process payment: Invalid voting ID format");
      return;
    }
    setPendingModalState({
      isOpen: true,
      votingId: votingIdAsNumber,
      flow: "open",
    });
  }, [id, agreement, setPendingModalState]);

  // ─── Paid dispute created callback ────────────────────────────────────────

  const handlePaidDisputeCreated = useCallback(
    (votingId: string | number, flow: "open") => {
      const votingIdAsNumber =
        typeof votingId === "string" ? parseInt(votingId, 10) : votingId;
      if (isNaN(votingIdAsNumber)) {
        toast.error("Invalid voting ID received");
        return;
      }
      setDisputeVotingId(votingIdAsNumber);
      setAgreement((prev) =>
        prev ? { ...prev, disputeVotingId: votingIdAsNumber } : null,
      );
      setDisputeStatus("Pending Payment");
      setRejectDisputeStatus("Pending Payment");
      setPendingModalState({ isOpen: true, votingId: votingIdAsNumber, flow });
    },
    [
      setDisputeVotingId,
      setAgreement,
      setDisputeStatus,
      setRejectDisputeStatus,
      setPendingModalState,
    ],
  );

  // ─── File download ─────────────────────────────────────────────────────────

  const handleDownloadFile = useCallback(
    async (fileIndex: number) => {
      if (!id || !agreement) return;
      try {
        toast.info("Downloading file...");
        const files = agreement._raw?.files || [];
        if (!files.length || fileIndex >= files.length) {
          toast.error("File not found in agreement data");
          return;
        }
        const file = files[fileIndex];
        if (!file.id) {
          toast.error("File ID not found");
          return;
        }

        const agreementId = parseInt(id);
        const response = await api.get(
          `/agreement/${agreementId}/file/${file.id}`,
          { responseType: "blob" },
        );
        let filename = file.fileName;
        if (!filename.includes(".")) {
          const match =
            response.headers["content-disposition"]?.match(/filename="?(.+)"?/);
          if (match?.[1]) filename = match[1];
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
        toast.success("File downloaded successfully!");
      } catch (error: any) {
        toast.error(
          error.message || "Failed to download file. Please try again.",
        );
      }
    },
    [id, agreement],
  );

  return {
    isSigning,
    isCancelling,
    isCompleting,
    isConfirming,
    isRespondingToCancel,
    isSubmittingReject,
    handleSignAgreement,
    handleCancelAgreement,
    handleRespondToCancelation,
    handleMarkAsDelivered,
    handleConfirmDelivery,
    handleConfirmReject,
    handleCompletePayment,
    handlePaidDisputeCreated,
    handleDownloadFile,
  };
}
