/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ESCROW_ABI } from "../web3/config";
import { getEscrowConfigs } from "../web3/readContract";
import { toast } from "sonner";
import { devLog } from "../utils/logger";

export type TransactionStep = "idle" | "pending" | "success" | "error";

export const useEscrowDisputeTransaction = (
  escrowAddress: `0x${string}` | undefined,
  chainId: number,
) => {
  // Transaction state
  const [transactionStep, setTransactionStep] =
    useState<TransactionStep>("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [votingId, setVotingId] = useState<bigint | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Wagmi hooks
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isSuccess: isTransactionSuccess,
    isError: isTransactionError,
    isLoading: isTransactionLoading,
  } = useWaitForTransactionReceipt({ hash });

  // Update transaction hash when we get it
  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
    }
  }, [hash]);

  // Main function to raise dispute on-chain
  const raiseDisputeOnchain = useCallback(
    async (
      contractAgreementId: bigint,
      votingIdToUse: bigint,
      isProBono: boolean,
    ) => {
      devLog(
        "🟡 [useEscrowDisputeTransaction] Raising dispute on-chain with:",
        {
          contractAgreementId: contractAgreementId.toString(),
          votingId: votingIdToUse.toString(),
          isProBono,
          escrowAddress,
          chainId,
        },
      );

      if (!escrowAddress) {
        throw new Error("Escrow contract address not available");
      }

      try {
        setTransactionStep("pending");
        setIsProcessing(true);
        setVotingId(votingIdToUse);
        setTransactionHash(null);

        // Fetch fee amount from contract for paid disputes
        let feeAmount = 0n;
        if (!isProBono) {
          try {
            const configs = await getEscrowConfigs(escrowAddress, chainId);
            feeAmount = configs?.feeAmount || 0n;
            devLog(
              "💰 [useEscrowDisputeTransaction] Fee amount from config:",
              feeAmount.toString(),
            );
          } catch (error) {
            console.warn(
              "⚠️ [useEscrowDisputeTransaction] Could not fetch fee amount, using 0",
              error,
            );
          }
        }

        // Calculate the value to send
        const valueToSend = isProBono ? 0n : feeAmount;

        devLog("🎯 [useEscrowDisputeTransaction] Transaction details:", {
          address: escrowAddress,
          functionName: "raiseDispute",
          args: [contractAgreementId, votingIdToUse, isProBono],
          value: valueToSend.toString(),
        });

        writeContract({
          address: escrowAddress,
          abi: ESCROW_ABI.abi,
          functionName: "raiseDispute",
          args: [contractAgreementId, votingIdToUse, isProBono],
          value: valueToSend,
        });

        devLog(
          "✅ [useEscrowDisputeTransaction] writeContract called successfully",
        );
        return undefined;
      } catch (error: any) {
        console.error(
          "❌ [useEscrowDisputeTransaction] raiseDisputeOnchain ERROR:",
          {
            name: error.name,
            message: error.message,
            code: error.code,
          },
        );

        setTransactionStep("error");
        setIsProcessing(false);

        toast.error("Failed to initiate smart contract transaction", {
          description:
            error.message ||
            "Please check your wallet connection and try again.",
        });

        throw error;
      }
    },
    [escrowAddress, chainId, writeContract],
  );

  // Function to reject delivery (which also creates a dispute)
  // Function to reject delivery (which also creates a dispute)
  const rejectDeliveryOnchain = useCallback(
    async (
      contractAgreementId: bigint,
      votingIdToUse: bigint,
      isProBono: boolean,
    ) => {
      devLog(
        "🟡 [useEscrowDisputeTransaction] Rejecting delivery on-chain with:",
        {
          contractAgreementId: contractAgreementId.toString(),
          votingId: votingIdToUse.toString(),
          isProBono,
          escrowAddress,
          chainId,
        },
      );

      if (!escrowAddress) {
        throw new Error("Escrow contract address not available");
      }

      try {
        setTransactionStep("pending");
        setIsProcessing(true);
        setVotingId(votingIdToUse);
        setTransactionHash(null);

        // Fetch fee amount from contract for paid disputes
        let feeAmount = 0n;
        if (!isProBono) {
          try {
            const configs = await getEscrowConfigs(escrowAddress, chainId);
            feeAmount = configs?.feeAmount || 0n;
            devLog(
              "💰 [useEscrowDisputeTransaction] Fee amount from config:",
              feeAmount.toString(),
            );
          } catch (error) {
            console.warn(
              "⚠️ [useEscrowDisputeTransaction] Could not fetch fee amount, using 0",
              error,
            );
          }
        }

        // Calculate the value to send
        const valueToSend = isProBono ? 0n : feeAmount;

        devLog("🎯 [useEscrowDisputeTransaction] Reject delivery details:", {
          address: escrowAddress,
          functionName: "approveDelivery",
          args: [contractAgreementId, false, votingIdToUse, isProBono],
          value: valueToSend.toString(),
        });

        writeContract({
          address: escrowAddress,
          abi: ESCROW_ABI.abi,
          functionName: "approveDelivery",
          args: [contractAgreementId, false, votingIdToUse, isProBono],
          value: valueToSend, // Add the value parameter
        });

        devLog(
          "✅ [useEscrowDisputeTransaction] rejectDeliveryOnchain called successfully",
        );
        return undefined;
      } catch (error: any) {
        console.error(
          "❌ [useEscrowDisputeTransaction] rejectDeliveryOnchain ERROR:",
          {
            name: error.name,
            message: error.message,
            code: error.code,
          },
        );

        setTransactionStep("error");
        setIsProcessing(false);

        toast.error("Failed to initiate smart contract transaction", {
          description:
            error.message ||
            "Please check your wallet connection and try again.",
        });

        throw error;
      }
    },
    [escrowAddress, chainId, writeContract],
  );
  // Retry transaction function
  const retryTransaction = useCallback(
    async (
      contractAgreementId: bigint,
      votingIdToUse: bigint,
      isProBono: boolean,
    ) => {
      devLog(
        "🔄 [useEscrowDisputeTransaction] Retrying transaction for votingId:",
        votingIdToUse.toString(),
      );

      // Reset wagmi state
      resetWrite();

      // Reset our state
      setTransactionStep("idle");
      setIsProcessing(false);
      setTransactionHash(null);

      // Wait a moment before retrying
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Retry the transaction - determine which function to call based on context
      // This is a simplified retry - in practice you might want to know if it was raise or reject
      return raiseDisputeOnchain(contractAgreementId, votingIdToUse, isProBono);
    },
    [raiseDisputeOnchain, resetWrite],
  );

  // Reset transaction state
  const resetTransaction = useCallback(() => {
    devLog("♻️ [useEscrowDisputeTransaction] Resetting transaction state");
    resetWrite();
    setTransactionStep("idle");
    setIsProcessing(false);
    setVotingId(null);
    setTransactionHash(null);
  }, [resetWrite]);

  // Monitor transaction status changes
  useEffect(() => {
    if (isWritePending) {
      devLog("⏳ [useEscrowDisputeTransaction] Transaction pending...");
      setTransactionStep("pending");
    } else if (isTransactionSuccess && hash) {
      devLog(
        "✅ [useEscrowDisputeTransaction] Transaction successful! Hash:",
        hash,
      );
      setTransactionStep("success");
      setIsProcessing(false);
      setTransactionHash(hash);

      toast.success("Transaction confirmed!", {
        description: "Your transaction has been processed successfully.",
        duration: 3000,
      });
    } else if (writeError || isTransactionError) {
      devLog("❌ [useEscrowDisputeTransaction] Transaction failed");
      setTransactionStep("error");
      setIsProcessing(false);

      if (writeError) {
        const errorMsg = writeError.message || "";
        const truncatedMsg =
          errorMsg.length > 100 ? errorMsg.substring(0, 97) + "..." : errorMsg;

        toast.error("Transaction failed", {
          description:
            truncatedMsg ||
            "Smart contract transaction failed. Please try again.",
          duration: 5000,
        });
      }
    }
  }, [
    isWritePending,
    isTransactionSuccess,
    isTransactionError,
    writeError,
    hash,
  ]);

  return {
    // State
    transactionStep,
    isProcessing,
    transactionHash: transactionHash || hash,
    transactionError: writeError,
    votingId,
    isTransactionLoading,

    // Actions
    raiseDisputeOnchain,
    rejectDeliveryOnchain,
    retryTransaction,
    resetTransaction,

    // Derived states
    isPending: transactionStep === "pending",
    isSuccess: transactionStep === "success",
    isError: transactionStep === "error",
    isIdle: transactionStep === "idle",
  };
};
