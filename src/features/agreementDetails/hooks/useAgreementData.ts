/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { agreementService } from "../../../services/agreementServices";
import { disputeService } from "../../../services/disputeServices";
import { connectSocket } from "../../../services/socket";
import type { Agreement } from "../../../types";
import {
  transformApiAgreement,
  isDisputeTriggeredByRejection,
} from "../utils/helpers";
import type { TypedSocket } from "../types";

interface PendingModalState {
  isOpen: boolean;
  votingId: number | null;
  flow: "reject" | "open";
}

export function useAgreementData(id: string | undefined) {
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeStatus, setDisputeStatus] = useState<any | null>(null);
  const [disputeVotingId, setDisputeVotingId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [rejectDisputeStatus, setRejectDisputeStatus] = useState<any | null>(
    null,
  );
  const [pendingModalState, setPendingModalState] = useState<PendingModalState>(
    {
      isOpen: false,
      votingId: null,
      flow: "reject",
    },
  );

  const socketRef = useRef<TypedSocket | null>(null);

  // ─── Fetch (foreground) ────────────────────────────────────────────────────

  const fetchAgreementDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await agreementService.getAgreementDetails(parseInt(id));
      setAgreement(transformApiAgreement(data, disputeVotingId));
    } catch {
      toast.error("Failed to load agreement details");
      setAgreement(null);
    } finally {
      setLoading(false);
    }
  }, [id, disputeVotingId]);

  // ─── Fetch (background) ───────────────────────────────────────────────────

  const fetchAgreementDetailsBackground = useCallback(async () => {
    if (isRefreshing || !id) return;
    setIsRefreshing(true);
    try {
      const data = await agreementService.getAgreementDetails(parseInt(id));
      setAgreement(transformApiAgreement(data, disputeVotingId));
    } catch {
      // Background failures are silent
    } finally {
      setIsRefreshing(false);
      setLastUpdate(Date.now());
    }
  }, [id, isRefreshing, disputeVotingId]);

  // ─── Fetch dispute details ─────────────────────────────────────────────────

  useEffect(() => {
    if (!agreement?.disputeId) return;
    const disputeId = parseInt(agreement.disputeId);
    if (isNaN(disputeId)) return;
    const fetch = async () => {
      try {
        const details = await disputeService.getDisputeDetails(disputeId);
        const transformed =
          disputeService.transformDisputeDetailsToRow(details);
        setDisputeStatus(transformed.status);
        if (transformed.votingId !== undefined)
          setDisputeVotingId(transformed.votingId);
      } catch {
        // non-critical
      }
    };
    fetch();
  }, [agreement?.disputeId]);

  // ─── Initial fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAgreementDetails();
  }, [id, fetchAgreementDetails]);

  // ─── WebSocket ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("authToken") ?? "";
    if (!token || !id) return;
    const agreementId = Number(id);
    const socket = connectSocket(token) as TypedSocket;
    socketRef.current = socket;

    socket.emit("agreement:join", { agreementId }, (ack) => {
      if (!ack.ok) console.warn("[WS] join failed", ack);
    });

    socket.on("agreement:event", async (event) => {
      if (event.agreementId !== agreementId) return;

      // Handle DisputeUpdated (type 19)
      if (event.type === 19) {
        setPendingModalState({ isOpen: false, votingId: null, flow: "reject" });

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
              // non-critical
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
    id,
    fetchAgreementDetailsBackground,
    agreement?.disputeId,
    disputeStatus,
    agreement,
  ]);

  // ─── Cross-tab event listener ──────────────────────────────────────────────

  useEffect(() => {
    const handleAgreementUpdate = (event: CustomEvent) => {
      if (event.detail.agreementId === parseInt(id || "")) {
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
  }, [id, fetchAgreementDetailsBackground]);

  return {
    agreement,
    setAgreement,
    loading,
    disputeStatus,
    setDisputeStatus,
    disputeVotingId,
    setDisputeVotingId,
    isRefreshing,
    lastUpdate,
    rejectDisputeStatus,
    setRejectDisputeStatus,
    pendingModalState,
    setPendingModalState,
    fetchAgreementDetails,
    fetchAgreementDetailsBackground,
  };
}
