/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { useAuth } from "../../../hooks/useAuth";
import { rejectDelivery } from "../../../services/agreementServices";
import { disputeService } from "../../../services/disputeServices";
// import { getEscrowConfigs } from "../../../web3/readContract";
import { ESCROW_ABI, ERC20_ABI, ZERO_ADDRESS } from "../../../web3/config";
import {
  DisputeTypeEnum,
  type CreateDisputeFromAgreementRequest,
} from "../../../types";
import type { LoadingStates } from "../../../web3/interfaces";
import type { EscrowDetailsData } from "../types";
// import { DisputeStatusEnum } from "../types";

const INITIAL_LOADING: LoadingStates = {
  createAgreement: false,
  signAgreement: false,
  depositFunds: false,
  submitDelivery: false,
  approveDelivery: false,
  rejectDelivery: false,
  cancelOrder: false,
  approveCancellation: false,
  partialRelease: false,
  finalRelease: false,
  cancellationTimeout: false,
  claimMilestone: false,
  setMilestoneHold: false,
  raiseDispute: false,
  loadAgreement: false,
};

interface UseOnChainActionsOptions {
  id: string | undefined;
  escrow: EscrowDetailsData | null;
  onChainAgreement: any;
  fetchBackground: () => Promise<void>;
  setDisputeStatus: (s: string) => void;
  setPendingDisputeModal: (s: any) => void;
}

export function useOnChainActions({
  id,
  escrow,
  onChainAgreement,
  fetchBackground,
  setDisputeStatus,
  setPendingDisputeModal,
}: UseOnChainActionsOptions) {
  const { address } = useAccount();
  const { user } = useAuth();
  const { switchChain } = useSwitchChain();
  const wagmiChainId = useChainId();

  const [loadingStates, setLoadingStates] =
    useState<LoadingStates>(INITIAL_LOADING);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  const [depositState, setDepositState] = useState({
    isApprovingToken: false,
    approvalHash: null as any,
    needsApproval: false,
  });
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const setLoading = (action: keyof LoadingStates, val: boolean) =>
    setLoadingStates((prev) => ({ ...prev, [action]: val }));

  const resetAllLoading = () => setLoadingStates(INITIAL_LOADING);
  const resetMessages = () => {
    setUiError(null);
    setUiSuccess(null);
  };

  // ─── Wagmi ────────────────────────────────────────────────────────────────

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const {
    data: approvalHash,
    writeContract: writeApproval,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract();
  const { isSuccess: approvalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const escrowAddress = escrow?.escrowAddress as `0x${string}` | undefined;

  // ─── Voting ID ────────────────────────────────────────────────────────────

  const votingId = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  // ─── Role detection ───────────────────────────────────────────────────────

  const isLoadedAgreement = !!onChainAgreement;
  const isServiceProvider =
    isLoadedAgreement &&
    address &&
    onChainAgreement &&
    address.toLowerCase() ===
    onChainAgreement.serviceProvider?.toString().toLowerCase();
  const isServiceRecipient =
    isLoadedAgreement &&
    address &&
    onChainAgreement &&
    address.toLowerCase() ===
    onChainAgreement.serviceRecipient?.toString().toLowerCase();

  const userId = user?.id?.toString();
  const isFirstParty = userId === escrow?._raw?.firstParty?.id?.toString();
  const isCounterparty = userId === escrow?._raw?.counterParty?.id?.toString();
  const isCreator = userId === escrow?._raw?.creator?.id?.toString();

  // ─── Network switch ───────────────────────────────────────────────────────
  const switchToTokenChain = useCallback(async () => {
    if (!switchChain) return;
    try {
      switchChain({ chainId: escrow?._raw?.chainId || null });
    } catch {
      /* silent */
    }
  }, [escrow?._raw?.chainId, switchChain]);

  useEffect(() => {
    if (user?.walletAddress && wagmiChainId !== escrow?._raw?.chainId) {
      toast.info(`Switching to supported chain...`);
      switchToTokenChain();
    }
  }, [
    escrow?._raw?.chainId,
    switchToTokenChain,
    user?.walletAddress,
    wagmiChainId,
  ]);

  // ─── Error cleanup ────────────────────────────────────────────────────────

  useEffect(() => {
    if (writeError) {
      resetAllLoading();
      setUiError("Transaction was rejected or failed");
      setDepositState({
        isApprovingToken: false,
        needsApproval: false,
        approvalHash: null,
      });
      resetWrite();
    }
  }, [writeError, resetWrite]);

  useEffect(() => {
    if (approvalError) {
      resetAllLoading();
      setUiError("Token approval was rejected or failed");
      setDepositState({
        isApprovingToken: false,
        needsApproval: false,
        approvalHash: null,
      });
      resetApproval();
    }
  }, [approvalError, resetApproval]);

  useEffect(() => {
    if (uiError) {
      const t = setTimeout(() => setUiError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [uiError]);

  useEffect(() => {
    if (uiSuccess) {
      const t = setTimeout(() => setUiSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [uiSuccess]);

  // ─── Transaction success ──────────────────────────────────────────────────

  useEffect(() => {
    if (isSuccess) {
      setUiSuccess("Transaction successful!");
      resetWrite();
    }
  }, [isSuccess, resetWrite]);

  // ─── Dispute success ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isSuccess && hash && isSubmittingDispute) {
      (async () => {
        try {
          toast.success("Dispute raised successfully!", {
            description: "Transaction confirmed.",
            duration: 5000,
          });
          setTimeout(() => fetchBackground().catch(console.error), 2000);
        } finally {
          setIsSubmittingDispute(false);
          setLoading("raiseDispute", false);
          resetWrite();
        }
      })();
    }
  }, [isSuccess, hash, isSubmittingDispute, resetWrite, fetchBackground]);

  useEffect(() => {
    if (isSuccess && hash && isSubmittingReject) {
      (async () => {
        try {
          toast.success("Delivery rejected! A dispute has been created.", {
            description: "Transaction confirmed.",
            duration: 5000,
          });
          setTimeout(() => fetchBackground().catch(console.error), 2000);
        } finally {
          setIsSubmittingReject(false);
          setLoading("rejectDelivery", false);
          resetWrite();
        }
      })();
    }
  }, [isSuccess, hash, isSubmittingReject, resetWrite, fetchBackground]);

  // ─── Deposit flow ─────────────────────────────────────────────────────────

  const depositDirectly = useCallback(() => {
    if (!onChainAgreement || !escrowAddress) return;
    const amount = onChainAgreement.amount;
    const isERC20 = onChainAgreement.token !== ZERO_ADDRESS;
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "depositFunds",
      args: [onChainAgreement.id],
      value: isERC20 ? BigInt(0) : amount,
    });
    setUiSuccess("Deposit transaction submitted");
    setDepositState({
      isApprovingToken: false,
      needsApproval: false,
      approvalHash: null,
    });
  }, [onChainAgreement, writeContract, escrowAddress]);

  useEffect(() => {
    if (approvalSuccess && depositState.needsApproval) depositDirectly();
  }, [approvalSuccess, depositState.needsApproval, depositDirectly]);

  // ─── All action handlers ──────────────────────────────────────────────────
  const handleSignAgreement = () => {
    resetMessages();
    setLoading("signAgreement", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "signAgreement",
      args: [onChainAgreement.id],
    });
    setUiSuccess("Sign transaction submitted");
  };

  const handleSubmitDelivery = () => {
    resetMessages();
    setLoading("submitDelivery", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "submitDelivery",
      args: [onChainAgreement.id],
    });
    setUiSuccess("Submit delivery transaction sent");
  };

  const handleApproveDelivery = (final: boolean) => {
    resetMessages();
    if (final) setLoading("approveDelivery", true);
    else setLoading("rejectDelivery", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "approveDelivery",
      args: [onChainAgreement.id, final, BigInt(votingId), true],
    });
    setUiSuccess(final ? "Approval submitted" : "Rejection submitted");
  };

  const handleDepositFunds = async () => {
    resetMessages();
    setLoading("depositFunds", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    const isERC20 = onChainAgreement.token !== ZERO_ADDRESS;
    if (isERC20) {
      setDepositState({
        isApprovingToken: true,
        needsApproval: true,
        approvalHash: null,
      });
      setUiSuccess("Approving token for deposit...");
      writeApproval({
        address: onChainAgreement.token as `0x${string}`,
        abi: ERC20_ABI.abi,
        functionName: "approve",
        args: [escrowAddress, onChainAgreement.amount],
      });
    } else {
      depositDirectly();
    }
  };

  const handleCancelOrder = () => {
    resetMessages();
    setLoading("cancelOrder", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "cancelOrder",
      args: [onChainAgreement.id],
    });
    setUiSuccess("Cancel transaction submitted");
  };

  const handleApproveCancellation = (final: boolean) => {
    resetMessages();
    setLoading("approveCancellation", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "approveCancellation",
      args: [BigInt(onChainAgreement.id), final],
    });
    setUiSuccess(
      final
        ? "Cancellation approval submitted"
        : "Cancellation rejection submitted",
    );
  };

  const handlePartialRelease = () => {
    resetMessages();
    setLoading("partialRelease", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "partialAutoRelease",
      args: [BigInt(onChainAgreement.id)],
    });
    setUiSuccess("Partial release tx submitted");
  };

  const handleFinalRelease = () => {
    resetMessages();
    setLoading("finalRelease", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "finalAutoRelease",
      args: [BigInt(onChainAgreement.id)],
    });
    setUiSuccess("Final release tx submitted");
  };

  const handleCancellationTimeout = () => {
    resetMessages();
    setLoading("cancellationTimeout", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress,
      abi: ESCROW_ABI.abi,
      functionName: "enforceCancellationTimeout",
      args: [BigInt(onChainAgreement.id)],
    });
    setUiSuccess("enforceCancellationTimeout tx submitted");
  };

  const handleClaimMilestone = async (index: number) => {
    resetMessages();
    setLoading("claimMilestone", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI.abi,
      functionName: "claimMilestone",
      args: [BigInt(onChainAgreement.id), BigInt(index)],
    });
    setUiSuccess("Claim milestone transaction submitted");
  };

  const handleSetMilestoneHold = async (index: number, hold: boolean) => {
    resetMessages();
    setLoading("setMilestoneHold", true);
    if (!onChainAgreement?.id || !escrowAddress) {
      setUiError("Agreement ID required");
      return;
    }
    writeContract({
      address: escrowAddress as `0x${string}`,
      abi: ESCROW_ABI.abi,
      functionName: "setMilestoneHold",
      args: [BigInt(onChainAgreement.id), BigInt(index), hold],
    });
    setUiSuccess(`Milestone ${hold ? "held" : "unheld"} transaction submitted`);
  };

  // const fetchOnchainEscrowConfigs = useCallback(
  //   async (eAddress: `0x${string}`, agreement: any) => {
  //     try {
  //       return await getEscrowConfigs(
  //         eAddress,
  //         agreement.chainId || null,
  //       );
  //     } catch {
  //       return null;
  //     }
  //   },
  //   [],
  // );

  // ─── Raise dispute ──────────────────────────────────────────────────────

  const handleRaiseDispute = async (
    data: CreateDisputeFromAgreementRequest,
    files: File[],
    probono: boolean,
  ) => {
    resetMessages();
    setLoading("raiseDispute", true);
    setIsSubmittingDispute(true);
    try {
      if (!id || !onChainAgreement?.id) {
        setUiError("Agreement ID required");
        return;
      }
      const agreementId = parseInt(id);
      const chainId = escrow?._raw?.chainId as number | undefined;
      const disputeResponse = await disputeService.createDisputeFromAgreement(
        agreementId,
        data,
        files,
        chainId,
      );
      const votingIdToUseLocal = disputeResponse.votingId || votingId;
      // await fetchOnchainEscrowConfigs(escrowAddress!, onChainAgreement);
      setPendingDisputeModal({
        isOpen: true,
        data: {
          contractAgreementId: BigInt(onChainAgreement.id),
          votingId: votingIdToUseLocal,
          isProBono: probono,
          action: "raise",
        },
      });
      setUiSuccess("Dispute created. Waiting for blockchain confirmation...");

      // writeContract({
      //   address: escrowAddress as `0x${string}`,
      //   abi: ESCROW_ABI.abi,
      //   functionName: "raiseDispute",
      //   args: [BigInt(onChainAgreement.id), BigInt(votingIdToUseLocal), probono],
      // });
    } catch (error: unknown) {
      setLoading("raiseDispute", false);
      setIsSubmittingDispute(false);
      const msg =
        error instanceof Error ? error.message : "Failed to create dispute.";
      setUiError(msg);
      toast.error("Failed to create dispute", {
        description: msg,
        duration: 5000,
      });
    }
  };

  // ─── Reject delivery ──────────────────────────────────────────────────────

  const handleConfirmRejectDelivery = async (
    claim: string,
    requestKind: DisputeTypeEnum,
    chainId?: number,
    votingId?: string,
  ) => {
    setIsSubmittingReject(true);
    setLoading("rejectDelivery", true);
    resetMessages();
    try {
      if (!id || !onChainAgreement?.id || !escrowAddress) {
        setUiError("Agreement ID required");
        return;
      }
      const agreementId = parseInt(id);
      const generatedVotingId = votingId || votingIdToUse.toString();
      const isProBono = requestKind === DisputeTypeEnum.ProBono;
      try {
        await rejectDelivery(agreementId, {
          votingId: generatedVotingId,
          claim: claim.trim(),
          requestKind,
          chainId: chainId,
          contractAgreementId: onChainAgreement?.id?.toString(),
        });
      } catch {
        toast.warning(
          "Claim not saved, but proceeding with blockchain rejection",
        );
      }

      setPendingDisputeModal({
        isOpen: true,
        data: {
          contractAgreementId: BigInt(onChainAgreement.id),
          votingId: generatedVotingId,
          isProBono,
          action: "reject",
        },
      });
      setDisputeStatus(isProBono ? "pending_locking_funds" : "pending_payment");
      toast.success(
        isProBono
          ? "Dispute created! Waiting for blockchain confirmation..."
          : "Dispute created! Please confirm the transaction in your wallet.",
      );

      // writeContract({
      //   address: escrowAddress as `0x${string}`,
      //   abi: ESCROW_ABI.abi,
      //   functionName: "approveDelivery",
      //   args: [BigInt(onChainAgreement.id), false, BigInt(generatedVotingId), isProBono],
      // });
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to reject delivery.";
      toast.error("Failed to reject delivery", {
        description: msg,
        duration: 5000,
      });
      setUiError(msg);
    } finally {
      setIsSubmittingReject(false);
      setLoading("rejectDelivery", false);
    }
  };

  return {
    // loading states
    loadingStates,
    isSubmittingDispute,
    isSubmittingReject,
    // ui feedback
    uiError,
    uiSuccess,
    // wagmi
    hash,
    isPending,
    isApprovalPending,
    isSuccess,
    depositState,
    // role
    isLoadedAgreement,
    isServiceProvider,
    isServiceRecipient,
    isFirstParty,
    isCounterparty,
    isCreator,
    // identifiers
    votingId,
    votingIdToUse,
    // actions
    handleSignAgreement,
    handleSubmitDelivery,
    handleApproveDelivery,
    handleDepositFunds,
    handleCancelOrder,
    handleApproveCancellation,
    handlePartialRelease,
    handleFinalRelease,
    handleCancellationTimeout,
    handleClaimMilestone,
    handleSetMilestoneHold,
    handleRaiseDispute,
    handleConfirmRejectDelivery,
    resetWrite,
  };
}
