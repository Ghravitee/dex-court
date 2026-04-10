/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { disputeService } from "../../../services/disputeServices";
import { connectSocket } from "../../../services/socket";
import type { Agreement } from "../../../types";
import {
  transformApiAgreement,
  isDisputeTriggeredByRejection,
} from "../utils/helpers";
import type { TypedSocket } from "../types";
import { useAgreementDetails } from "../../../hooks/useAgreements";


export function useAgreementData(id: string | undefined) {
  const agreementId = id ? parseInt(id) : null;

  const [disputeStatus, setDisputeStatus] = useState<any | null>(null);
  const [disputeChainId, setDisputeChainId] = useState<number | null>(null);
  const [disputeVotingId, setDisputeVotingId] = useState<number | null>(null);
  const [rejectDisputeStatus, setRejectDisputeStatus] = useState<any | null>(
    null,
  );
  const [pendingModalState, setPendingModalState] = useState<{
    isOpen: boolean;
    votingId: number | null;
    flow: "reject" | "open";
    chainId: number | null;
  }>({ isOpen: false, votingId: null, flow: "reject", chainId: null });

  // Local agreement override — needed so mutations can optimistically update
  // the agreement shape (e.g. adding disputeVotingId) without waiting for refetch
  const [agreementOverride, setAgreement] = useState<Agreement | null>(null);

  const socketRef = useRef<TypedSocket | null>(null);

  // ─── TanStack Query ────────────────────────────────────────────────────────

  const {
    data: rawAgreementData,
    isLoading: loading,
    refetch,
    isRefetching: isRefreshing,
  } = useAgreementDetails(agreementId, {
    // Don't show stale data while refetching in the background
    refetchOnWindowFocus: false,
  });

  // Transform API data at render time, not inside the fetch.
  // This breaks the old dependency on disputeVotingId inside the fetch callback.
  const agreement: Agreement | null =
    agreementOverride ??
    (rawAgreementData
      ? transformApiAgreement(rawAgreementData, disputeVotingId)
      : null);

  // ─── Background refetch (used by WebSocket + cross-tab listener) ───────────

  const fetchAgreementDetailsBackground = useCallback(async () => {
    if (!agreementId) return;
    // TanStack Query guards against concurrent in-flight requests natively
    await refetch();
    // Clear the local override so the fresh cache data takes over
    setAgreement(null);
  }, [agreementId, refetch]);

  // ─── Foreground refetch (used by initial load and manual retry) ────────────

  const fetchAgreementDetails = useCallback(async () => {
    if (!agreementId) return;
    try {
      await refetch();
      setAgreement(null);
    } catch {
      toast.error("Failed to load agreement details");
    }
  }, [agreementId, refetch]);

  // ─── Fetch dispute details when disputeId is known ─────────────────────────

  useEffect(() => {
    // console.log("Agreement in effect", agreement);
    if (!agreement?.disputeId) return;
    const disputeId = parseInt(agreement.disputeId);
    if (isNaN(disputeId)) return;

    const fetch = async () => {
      try {
        const details = await disputeService.getDisputeDetails(disputeId);
        const transformed = disputeService.transformDisputeDetailsToRow(details);
        // console.log("Fetched dispute details", details, transformed.chainId);
        setDisputeStatus(transformed.status);
        if (transformed.votingId !== undefined) {
          setDisputeVotingId(transformed.votingId);
        }
        // Read chainId from dispute — works for both agreement-linked and standalone disputes
        const disputeChainId = transformed.chainId ?? transformed.chainId ?? null;
        console.log("Dispute chain ID", disputeChainId);
        if (disputeChainId) {
          setDisputeChainId(disputeChainId);
          setPendingModalState((prev) => ({
            ...prev,
            chainId: Number(disputeChainId),
          }));
        }
      } catch {
        // Non-critical — dispute details are supplementary
      }
    };

    fetch();
  }, [agreement?.disputeId]);

  // ─── WebSocket ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("authToken") ?? "";
    if (!token || !agreementId) return;

    const socket = connectSocket(token) as TypedSocket;
    socketRef.current = socket;

    socket.emit("agreement:join", { agreementId }, (ack) => {
      if (!ack.ok) console.warn("[WS] join failed", ack);
    });

    socket.on("agreement:event", async (event) => {
      if (event.agreementId !== agreementId) return;

      // Type 19 = DisputeUpdated
      if (event.type === 19) {
        setPendingModalState({ isOpen: false, votingId: null, flow: "reject", chainId: null });

        if (agreement?.disputeId) {
          const disputeIdNum = parseInt(agreement.disputeId);
          if (!isNaN(disputeIdNum)) {
            try {
              const details =
                await disputeService.getDisputeDetails(disputeIdNum);
              const transformed =
                disputeService.transformDisputeDetailsToRow(details);
              setDisputeStatus(transformed.status);

              if (isDisputeTriggeredByRejection(agreement)) {
                setRejectDisputeStatus(transformed.status);
              }

              if (
                disputeStatus === "Pending Payment" &&
                transformed.status !== "Pending Payment"
              ) {
                toast.success("Dispute is now active!", {
                  description: `Status: ${transformed.status}`,
                  duration: 3000,
                });
              }
            } catch {
              // Non-critical
            }
          }
        }
      }

      fetchAgreementDetailsBackground();
    });

    return () => {
      socket.off("agreement:event");
      socket.disconnect();
    };
  }, [
    agreementId,
    fetchAgreementDetailsBackground,
    agreement?.disputeId,
    disputeStatus,
    agreement,
  ]);

  // ─── Cross-tab event listener ──────────────────────────────────────────────

  useEffect(() => {
    const handleAgreementUpdate = (event: CustomEvent) => {
      if (event.detail.agreementId === agreementId) {
        fetchAgreementDetailsBackground();
      }
    };
    window.addEventListener(
      "agreementUpdated",
      handleAgreementUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "agreementUpdated",
        handleAgreementUpdate as EventListener,
      );
  }, [agreementId, fetchAgreementDetailsBackground]);

  return {
    agreement,
    setAgreement,
    loading,
    isRefreshing,
    disputeStatus,
    setDisputeStatus,
    disputeVotingId,
    setDisputeVotingId,
    rejectDisputeStatus,
    setRejectDisputeStatus,
    pendingModalState,
    setPendingModalState,
    fetchAgreementDetails,
    fetchAgreementDetailsBackground,
    disputeChainId,
    // lastUpdate is removed — consumers should react to `agreement` changing,
    // not to a timestamp. If something genuinely needs it, use Date.now() where used.
  };
}
