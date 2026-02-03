/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useDisputeTransaction.ts
import { useState, useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VOTING_ABI, VOTING_CA } from "../web3/config";
import { getVoteConfigs } from "../web3/readContract";
import { toast } from "sonner";

export type TransactionStep = "idle" | "pending" | "success" | "error";

export const useDisputeTransaction = (chainId: number) => {
  // Transaction state
  const [transactionStep, setTransactionStep] =
    useState<TransactionStep>("idle");
  const [isProcessing, setIsProcessing] = useState(false);

  // Wagmi hooks
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess: isTransactionSuccess, isError: isTransactionError } =
    useWaitForTransactionReceipt({ hash });

  // Main function to create dispute on-chain
  const createDisputeOnchain = useCallback(
    async (votingId: number): Promise<string | undefined> => {
      console.log(
        "🟡 [useDisputeTransaction] Creating on-chain dispute with votingId:",
        votingId,
      );

      try {
        setTransactionStep("pending");
        setIsProcessing(true);

        const contractAddress = VOTING_CA[chainId];
        console.log("📝 [useDisputeTransaction] Contract lookup:", {
          chainId,
          contractAddress,
        });

        if (!contractAddress) {
          throw new Error(`No contract address found for chain ID ${chainId}`);
        }

        // Fetch fee amount from contract
        let feeValue = undefined;
        try {
          const configs = await getVoteConfigs(chainId);
          feeValue = configs?.feeAmount;
          console.log(
            "💰 [useDisputeTransaction] Fee amount:",
            feeValue?.toString(),
          );
        } catch (error) {
          console.warn(
            "⚠️ [useDisputeTransaction] Could not fetch fee amount, using default",
            error,
          );
        }

        console.log("🎯 [useDisputeTransaction] Transaction details:", {
          contractAddress,
          functionName: "raiseDispute",
          args: [BigInt(votingId), false],
          value: feeValue?.toString(),
          hasFee: !!feeValue,
        });

        console.log("⏳ [useDisputeTransaction] Calling writeContract...");

        writeContract({
          address: contractAddress,
          abi: VOTING_ABI.abi,
          functionName: "raiseDispute",
          args: [BigInt(votingId), false],
          value: feeValue,
        });

        console.log(
          "✅ [useDisputeTransaction] writeContract called successfully",
        );
        return undefined; // The transaction hash will come from wagmi
      } catch (error: any) {
        console.error(
          "❌ [useDisputeTransaction] createDisputeOnchain ERROR:",
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
    [chainId, writeContract],
  );

  // Retry transaction function
  const retryTransaction = useCallback(
    async (votingId: number): Promise<string | undefined> => {
      console.log(
        "🔄 [useDisputeTransaction] Retrying transaction for votingId:",
        votingId,
      );

      // Reset wagmi state
      resetWrite();

      // Reset our state
      setTransactionStep("idle");
      setIsProcessing(false);

      // Wait a moment before retrying
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Retry the transaction
      return createDisputeOnchain(votingId);
    },
    [createDisputeOnchain, resetWrite],
  );

  // Reset transaction state
  const resetTransaction = useCallback(() => {
    console.log("♻️ [useDisputeTransaction] Resetting transaction state");
    resetWrite();
    setTransactionStep("idle");
    setIsProcessing(false);
  }, [resetWrite]);

  // Monitor transaction status changes
  useEffect(() => {
    if (isWritePending) {
      console.log("⏳ [useDisputeTransaction] Transaction pending...");
      setTransactionStep("pending");
    } else if (isTransactionSuccess && hash) {
      console.log(
        "✅ [useDisputeTransaction] Transaction successful! Hash:",
        hash,
      );
      setTransactionStep("success");
      setIsProcessing(false);

      toast.success("Transaction confirmed!", {
        description: "Your payment has been processed successfully.",
        duration: 3000,
      });
    } else if (writeError || isTransactionError) {
      console.log("❌ [useDisputeTransaction] Transaction failed");
      setTransactionStep("error");
      setIsProcessing(false);

      if (writeError) {
        toast.error("Transaction failed", {
          description:
            writeError.message ||
            "Smart contract transaction failed. Please try again.",
          duration: 5000,
        });
      }
    }
  }, [
    isWritePending,
    isTransactionSuccess,
    writeError,
    isTransactionError,
    hash,
  ]);

  return {
    // State
    transactionStep,
    isProcessing,
    transactionHash: hash,
    transactionError: writeError,

    // Actions
    createDisputeOnchain,
    retryTransaction,
    resetTransaction,

    // Derived states
    isPending: transactionStep === "pending",
    isSuccess: transactionStep === "success",
    isError: transactionStep === "error",
    isIdle: transactionStep === "idle",
  };
};
