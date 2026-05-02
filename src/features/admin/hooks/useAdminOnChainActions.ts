// src/features/admin/hooks/useAdminOnChainActions.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainId, useSwitchChain } from "wagmi";
import { useAuth } from "../../../hooks/useAuth";
import {
  ESCROW_ABI,
  ESCROW_CA,
  VOTING_ABI,
  VOTING_CA,
} from "../../../web3/config";
import type {
  EscrowConfigInput,
  TxAction,
  VotingConfigInput,
} from "../types";

const INITIAL_LOADING: Record<TxAction, boolean> = {
  setEscrowConfig: false,
  setVotingConfig: false,
  setDisputeResolver: false,
  setFeeRecipient: false,
  freezeAgreement: false,
  recoverStuckEthEscrow: false,
  recoverStuckEthVoting: false,
  recoverStuckTokenEscrow: false,
  recoverStuckTokenVoting: false,
  finalizeEscrowDispute: false,
  finalizeVotingDispute: false
};

interface UseAdminOnChainActionsOptions {
  activeChainId: number;
  fetchBackground?: () => Promise<void>;
}

export function useAdminOnChainActions({
  activeChainId,
  fetchBackground,
}: UseAdminOnChainActionsOptions = { activeChainId: 0 }) {

  const escrowAddress = ESCROW_CA[activeChainId] as `0x${string}` | undefined;
  const votingAddress = VOTING_CA[activeChainId] as `0x${string}` | undefined;

  const { user } = useAuth();
  const { address } = useAccount();

  // Add inside the hook, after useAccount:
  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  // Add a chain sync helper:
  const ensureCorrectChain = useCallback(async () => {
    if (!activeChainId) return true;
    if (walletChainId === activeChainId) return true;
    try {
      await switchChainAsync({ chainId: activeChainId });
      return true;
    } catch {
      setUiError(`Please switch your wallet to the correct network`);
      return false;
    }
  }, [activeChainId, walletChainId, switchChainAsync]);


  const [loadingStates, setLoadingStates] =
    useState<Record<TxAction, boolean>>(INITIAL_LOADING);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<TxAction | null>(null);

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const setLoading = (action: TxAction, val: boolean) =>
    setLoadingStates((prev) => ({ ...prev, [action]: val }));

  const resetAllLoading = () => setLoadingStates(INITIAL_LOADING);

  const isAdmin = useMemo(() => {
    return Boolean(user?.role === 3 || user?.isAdmin);
  }, [user]);

  const ensureAdmin = useCallback(() => {
    console.log("ensureAdmin check", {
      isAdmin,
      role: user?.role,
      isAdminFlag: user?.isAdmin,
      user
    });
    if (!isAdmin) {
      setUiError("Admin access required");
      return false;
    }
    return true;
  }, [isAdmin, user]);

  useEffect(() => {
    if (writeError) {
      resetAllLoading();
      setPendingAction(null);
      console.log("Transaction error", writeError);
      setUiError("Transaction was rejected or failed");
      resetWrite();
    }
  }, [writeError, resetWrite]);

  useEffect(() => {
    if (!isSuccess || !pendingAction) return;

    (async () => {
      try {
        setLoading(pendingAction, false);
        setUiSuccess("Transaction successful");
        await fetchBackground?.();
      } catch {
        // ignore refresh failure
      } finally {
        setPendingAction(null);
        resetWrite();
      }
    })();
  }, [isSuccess, pendingAction, fetchBackground, resetWrite]);

  useEffect(() => {
    if (!uiError) return;
    const t = setTimeout(() => setUiError(null), 5000);
    return () => clearTimeout(t);
  }, [uiError]);

  useEffect(() => {
    if (!uiSuccess) return;
    const t = setTimeout(() => setUiSuccess(null), 5000);
    return () => clearTimeout(t);
  }, [uiSuccess]);

  const submitTx = useCallback(
    async (
      action: TxAction,
      params: {
        contract: `0x${string}`;
        abi: any;
        functionName: string;
        args?: readonly unknown[];
        value?: bigint;
      }
    ) => {
      setUiError(null);
      setUiSuccess(null);

      if (!ensureAdmin()) return;
      if (!params.contract || params.contract === "0x") {
        setUiError("Contract not configured for this network");
        return;
      }

      // ← Switch wallet to correct chain before writing
      const chainOk = await ensureCorrectChain();
      if (!chainOk) return;

      setLoading(action, true);
      setPendingAction(action);

      writeContract({
        address: params.contract,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args as any,
        value: params.value,
      });
    },
    [ensureAdmin, ensureCorrectChain, writeContract]
  );

  const setEscrowConfig = useCallback(
    async (newConfig: EscrowConfigInput) => {
      await submitTx("setEscrowConfig", {
        contract: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "setEscrowConfig",
        args: [
          newConfig.platformFeeBp,
          newConfig.feeAmount,
          newConfig.disputeDuration,
          newConfig.grace1Duration,
          newConfig.grace2Duration,
        ],
      });
    },
    [escrowAddress, submitTx]
  );

  const finalizeEscrowDispute = useCallback(
    async (
      id: bigint,
      outcome: 0 | 1 | 2,
      toProvider: bigint,
      toRecipient: bigint,
      votingId: bigint,
      contractAddress?: `0x${string}`,
    ) => {
      await submitTx("finalizeEscrowDispute", {
        contract: contractAddress ?? escrowAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "finalizeDispute",
        args: [id, outcome, toProvider, toRecipient, votingId],
      });
    },
    [escrowAddress, submitTx],
  );

  const setVotingConfig = useCallback(
    async (newConfig: VotingConfigInput) => {
      await submitTx("setVotingConfig", {
        contract: votingAddress as `0x${string}`,
        abi: VOTING_ABI.abi,
        functionName: "setVotingConfig",
        args: [
          newConfig.disputeDuration,
          newConfig.voteToken,
          newConfig.feeRecipient,
          newConfig.disputeResolver,
          newConfig.feeAmount,
        ],
      });
    },
    [submitTx, votingAddress]
  );

  const setDisputeResolver = useCallback(
    async (resolver: `0x${string}`) => {
      await submitTx("setDisputeResolver", {
        contract: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "setDisputeResolver",
        args: [resolver],
      });
    },
    [escrowAddress, submitTx]
  );

  const setFeeRecipient = useCallback(
    async (recipient: `0x${string}`) => {
      await submitTx("setFeeRecipient", {
        contract: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "setFeeRecipient",
        args: [recipient],
      });
    },
    [escrowAddress, submitTx]
  );

  const freezeAgreement = useCallback(
    async (id: bigint, status: boolean, contractAddress?: `0x${string}`) => {
      await submitTx("freezeAgreement", {
        contract: contractAddress ?? escrowAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "freezeAgreement",
        args: [id, status],
      });
    },
    [escrowAddress, submitTx]
  );

  const recoverStuckEthEscrow = useCallback(
    async (amount: bigint) => {
      await submitTx("recoverStuckEthEscrow", {
        contract: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "recoverStuckEth",
        args: [amount],
      });
    },
    [escrowAddress, submitTx]
  );

  const recoverStuckEthVoting = useCallback(
    async (amount: bigint) => {
      await submitTx("recoverStuckEthVoting", {
        contract: votingAddress as `0x${string}`,
        abi: VOTING_ABI.abi,
        functionName: "recoverStuckEth",
        args: [amount],
      });
    },
    [submitTx, votingAddress]
  );

  const recoverStuckTokenEscrow = useCallback(
    async (token: `0x${string}`, amount: bigint) => {
      await submitTx("recoverStuckTokenEscrow", {
        contract: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "recoverStuckToken",
        args: [token, amount],
      });
    },
    [escrowAddress, submitTx]
  );

  const recoverStuckTokenVoting = useCallback(
    async (token: `0x${string}`, amount: bigint) => {
      await submitTx("recoverStuckTokenVoting", {
        contract: votingAddress as `0x${string}`,
        abi: VOTING_ABI.abi,
        functionName: "recoverStuckToken",
        args: [token, amount],
      });
    },
    [submitTx, votingAddress]
  );

  return {
    loadingStates,
    uiError,
    uiSuccess,
    hash,
    isPending,
    isSuccess,
    pendingAction,
    isAdmin,
    address,
    resetWrite,
    setEscrowConfig,
    setVotingConfig,
    setDisputeResolver,
    setFeeRecipient,
    freezeAgreement,
    recoverStuckEthEscrow,
    recoverStuckEthVoting,
    recoverStuckTokenEscrow,
    recoverStuckTokenVoting,
    finalizeEscrowDispute,
  };
}