/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/apiClient";
import type { Agreement } from "../../../types";
import type { DisputeTypeEnumValue } from "../types";
import { DisputeTypeEnum, AgreementEventTypeEnum } from "../types";
import { generateVotingId } from "../utils/helpers";
import { type AgreementDeliveryRejectedRequest } from "../../../services/agreementServices";
import {
  useSignAgreement,
  useDeleteAgreement,
  useRequestCancellation,
  useRespondToCancellation,
  useMarkAsDelivered,
  useConfirmDelivery,
  useRejectDelivery,
} from "../../../hooks/useAgreements";
import { useNavigation } from "../../../hooks/useNavigation";

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
    chainId: number | null;
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
  const { navigateTo } = useNavigation();

  const { user } = useAuth();

  // Mutation hooks — each owns its own loading state via isPending
  const signMutation = useSignAgreement();
  const deleteMutation = useDeleteAgreement();
  const requestCancellationMutation = useRequestCancellation();
  const respondCancellationMutation = useRespondToCancellation();
  const markDeliveredMutation = useMarkAsDelivered();
  const confirmDeliveryMutation = useConfirmDelivery();
  const rejectDeliveryMutation = useRejectDelivery();

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

    try {
      await signMutation.mutateAsync({
        agreementId: parseInt(id),
        accepted: true,
      });
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
    }
  }, [id, agreement, user, fetchBackground, signMutation]);

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

    try {
      const agreementId = parseInt(id);
      if (agreement.status === "pending") {
        await deleteMutation.mutateAsync(agreementId);
        toast.success("Agreement cancelled successfully!");
        navigateTo("/agreements");
      } else {
        await requestCancellationMutation.mutateAsync(agreementId);
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
    }
  }, [
    id,
    agreement,
    navigateTo,
    fetchBackground,
    deleteMutation,
    requestCancellationMutation,
  ]);

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

      try {
        await respondCancellationMutation.mutateAsync({
          agreementId: parseInt(id),
          accepted,
        });
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
      }
    },
    [id, agreement, fetchBackground, respondCancellationMutation],
  );

  // ─── Mark as delivered ─────────────────────────────────────────────────────

  const handleMarkAsDelivered = useCallback(async () => {
    if (!id || !agreement) return;
    try {
      await markDeliveredMutation.mutateAsync(parseInt(id));
      toast.success("Delivery marked! Waiting for the other party's approval.");
      await fetchBackground();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to mark as delivered. Please try again.",
      );
    }
  }, [id, agreement, fetchBackground, markDeliveredMutation]);

  // ─── Confirm delivery ──────────────────────────────────────────────────────

  const handleConfirmDelivery = useCallback(async () => {
    if (!id || !agreement) return;
    try {
      await confirmDeliveryMutation.mutateAsync(parseInt(id));
      toast.success("Delivery confirmed! Agreement completed.");
      await fetchBackground();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to confirm delivery. Please try again.",
      );
    }
  }, [id, agreement, fetchBackground, confirmDeliveryMutation]);

  // ─── Reject delivery ───────────────────────────────────────────────────────

  const handleConfirmReject = useCallback(
    async (
      claim: string,
      requestKind: DisputeTypeEnumValue,
      chainId?: number,
      votingId?: string,
    ) => {
      if (!id || !agreement) return;

      try {
        const agreementId = parseInt(id);
        const votingIdToUse = votingId || generateVotingId();

        const payload: AgreementDeliveryRejectedRequest = {
          votingId: votingIdToUse.toString(),
          claim: claim.trim(),
          requestKind,
          ...(chainId && { chainId }),
        };

        await rejectDeliveryMutation.mutateAsync({
          agreementId,
          data: payload,
        });

        if (requestKind === DisputeTypeEnum.Paid) {
          setRejectDisputeStatus("Pending Payment");
          setDisputeStatus("Pending Payment");
          setPendingModalState({
            isOpen: true,
            votingId: parseInt(votingIdToUse),
            flow: "reject",
            chainId: chainId ?? null, // chainId comes from the onConfirm param
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
      }
    },
    [
      id,
      agreement,
      fetchBackground,
      setDisputeStatus,
      setRejectDisputeStatus,
      setPendingModalState,
      rejectDeliveryMutation,
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
      chainId: null,
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
      setPendingModalState({
        isOpen: true,
        votingId: votingIdAsNumber,
        flow,
        chainId: null,
      });
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
  // Kept as a direct API call — no mutation needed since downloads
  // don't mutate server state and don't benefit from cache invalidation.

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
        const blob = new Blob([response.data], { type: contentType });
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
    // Loading states — now sourced from mutation isPending
    isSigning: signMutation.isPending,
    isCancelling:
      deleteMutation.isPending || requestCancellationMutation.isPending,
    isCompleting: markDeliveredMutation.isPending,
    isConfirming: confirmDeliveryMutation.isPending,
    isRespondingToCancel: respondCancellationMutation.isPending,
    isSubmittingReject: rejectDeliveryMutation.isPending,
    // Handlers
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
