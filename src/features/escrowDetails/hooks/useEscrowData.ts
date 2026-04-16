/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { agreementService } from "../../../services/agreementServices";
import { disputeService } from "../../../services/disputeServices";
import { connectSocket } from "../../../services/socket";
import { getAgreement } from "../../../web3/readContract";
import type { EscrowDetailsData, TypedSocket } from "../types";
import { transformApiToEscrow } from "../utils/helpers";
import { devLog } from "../../../utils/logger";

interface PendingModalState {
  isOpen: boolean;
  data: {
    contractAgreementId: bigint;
    votingId: string | number;
    isProBono: boolean;
    action: "raise" | "reject";
  } | null;
}

type EscrowFetchError =
  | { type: "not_found" }
  | { type: "unauthorized" }
  | { type: "network" }
  | { type: "server"; status?: number }
  | { type: "unknown" };

export function useEscrowData(id: string | undefined) {
  const socketRef = useRef<TypedSocket | null>(null);

  const [escrow, setEscrow] = useState<EscrowDetailsData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [onChainAgreement, setOnChainAgreement] = useState<any | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [disputeStatus, setDisputeStatus] = useState<string | null>(null);
  const [disputeVotingId, setDisputeVotingId] = useState<string | null>(null);
  const [isDisputeFiler, setIsDisputeFiler] = useState(false);
  const [pendingDisputeModal, setPendingDisputeModal] =
    useState<PendingModalState>({
      isOpen: false,
      data: null,
    });
  const [fetchError, setFetchError] = useState<EscrowFetchError | null>(null);

  // ─── On-chain fetch ───────────────────────────────────────────────────────

  const fetchOnChainAgreement = useCallback(async (agreementData: any) => {
    if (!agreementData) return;
    const onChainAgreementId = agreementData.contractAgreementId;
    const escrowCA = agreementData.escrowContractAddress;
    const agreementChainId = agreementData.chainId;
    if (!onChainAgreementId || !escrowCA || !agreementChainId) return;

    devLog(
      `Initiating on-chain fetch: agreementId=${onChainAgreementId}, escrowCA=${escrowCA}, chainId=${agreementChainId}`,
    );
    setOnChainLoading(true);
    try {
      const res = await getAgreement(
        escrowCA,
        agreementChainId as number,
        BigInt(onChainAgreementId),
      );
      setOnChainAgreement(res);
    } catch (err) {
      console.error("Failed to fetch on-chain agreement:", err);
      setOnChainAgreement(null);
    } finally {
      setOnChainLoading(false);
    }
  }, []);

  // ─── Foreground fetch ─────────────────────────────────────────────────────

  const fetchEscrowDetails = useCallback(async () => {
    if (!id) return;
    setInitialLoading(true);
    setFetchError(null); // reset on each attempt
    try {
      const data = await agreementService.getAgreementDetails(parseInt(id));
      setEscrow(transformApiToEscrow(data));
      fetchOnChainAgreement(data).catch(console.warn);
    } catch (err: any) {
      setEscrow(null);
      const status = err?.response?.status ?? err?.status;
      if (status === 404) {
        setFetchError({ type: "not_found" });
      } else if (status === 403 || status === 401) {
        setFetchError({ type: "unauthorized" });
      } else if (status >= 500) {
        setFetchError({ type: "server", status });
      } else if (!navigator.onLine || err?.message === "Network Error") {
        setFetchError({ type: "network" });
      } else {
        setFetchError({ type: "unknown" });
      }
      toast.error("Failed to load escrow details");
    } finally {
      setInitialLoading(false);
    }
  }, [id, fetchOnChainAgreement]);

  // ─── Background fetch ─────────────────────────────────────────────────────

  const fetchEscrowDetailsBackground = useCallback(async () => {
    if (isRefreshing || !id) return;
    setIsRefreshing(true);
    try {
      const data = await agreementService.getAgreementDetails(parseInt(id));
      setEscrow(transformApiToEscrow(data));
      fetchOnChainAgreement(data).catch(console.warn);
    } catch {
      // silent
    } finally {
      setIsRefreshing(false);
      setLastUpdate(Date.now());
    }
  }, [id, isRefreshing, fetchOnChainAgreement]);

  // ─── Dispute details fetch ────────────────────────────────────────────────

  const fetchDisputeDetails = useCallback(async (disputeId: number) => {
    try {
      const details = await disputeService.getDisputeDetails(disputeId);
      const transformed = disputeService.transformDisputeDetailsToRow(details);
      const displayStatus = transformed.status;
      const internalStatus = displayStatus?.toLowerCase().replace(/\s+/g, "_");
      setDisputeStatus(internalStatus);
      if (transformed.votingId)
        setDisputeVotingId(transformed.votingId.toString());
      return transformed;
    } catch {
      return null;
    }
  }, []);

  // ─── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchEscrowDetails();
  }, [id, fetchEscrowDetails]);

  // ─── Dispute status watcher ───────────────────────────────────────────────

  useEffect(() => {
    const disputeId = escrow?._raw?.disputes?.[0]?.disputeId;
    if (disputeId) fetchDisputeDetails(parseInt(disputeId));
  }, [escrow?._raw?.disputes, fetchDisputeDetails]);

  // ─── WebSocket ────────────────────────────────────────────────────────────

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

      if (event.type === 19) {
        setPendingDisputeModal({ isOpen: false, data: null });
        const disputeId = escrow?._raw?.disputes?.[0]?.disputeId;
        if (disputeId) {
          const updated = await fetchDisputeDetails(parseInt(disputeId));
          if (updated) {
            const internalStatus = updated.status
              ?.toLowerCase()
              .replace(/\s+/g, "_");
            if (
              disputeStatus === "pending_payment" &&
              internalStatus !== "pending_payment"
            ) {
              toast.success("Payment confirmed! Dispute is now active.", {
                duration: 3000,
              });
            } else if (
              disputeStatus === "pending_locking_funds" &&
              internalStatus !== "pending_locking_funds"
            ) {
              toast.success("Funds locked! Dispute is now active.", {
                duration: 3000,
              });
            }
          }
        }
      }
      fetchEscrowDetailsBackground();
    });

    return () => {
      socket.off("agreement:event");
      socket.disconnect();
    };
  }, [
    id,
    fetchEscrowDetailsBackground,
    escrow?._raw?.disputes,
    disputeStatus,
    fetchDisputeDetails,
  ]);

  // ─── Cross-tab event ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      if (event.detail.agreementId === parseInt(id || ""))
        fetchEscrowDetailsBackground();
    };
    window.addEventListener("agreementUpdated", handler as EventListener);
    return () =>
      window.removeEventListener("agreementUpdated", handler as EventListener);
  }, [id, fetchEscrowDetailsBackground]);

  return {
    escrow,
    setEscrow,
    initialLoading,
    isRefreshing,
    lastUpdate,
    onChainAgreement,
    onChainLoading,
    disputeStatus,
    setDisputeStatus,
    disputeVotingId,
    setDisputeVotingId,
    isDisputeFiler,
    setIsDisputeFiler,
    pendingDisputeModal,
    setPendingDisputeModal,
    fetchEscrowDetails,
    fetchEscrowDetailsBackground,
    fetchDisputeDetails,
    fetchError,
  };
}
