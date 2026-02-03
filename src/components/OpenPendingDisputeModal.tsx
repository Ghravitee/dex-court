/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import {
  // Loader2,
  Scale,
  X,
  Wallet,
  Info,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { UploadedFile } from "../types";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { VOTING_ABI, VOTING_CA } from "../web3/config";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getVoteConfigs } from "../web3/readContract";

const formatDefendantDisplay = (defendant: string): string => {
  // First, clean any leading @ symbol
  const cleanDefendant = defendant.replace(/^@/, "");

  // Check if it's a wallet address (after removing @)
  if (isWalletAddress(cleanDefendant)) {
    // For wallet addresses, don't add @ symbol
    return cleanDefendant;
  }
  // For Telegram usernames, ensure it has @ symbol for display
  return defendant.startsWith("@") ? defendant : `@${defendant}`;
};

const isSecondRejection = (agreement: any): boolean => {
  if (!agreement?.timeline) return false;

  const rejectionEvents = agreement.timeline.filter(
    (event: any) => event.eventType === 6, // DELIVERY_REJECTED = 6
  );

  return rejectionEvents.length >= 2;
};

const isWalletAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  votingId: number;
  agreement: any;
  onDisputeCreated: () => void;
}

export default function OpenPendingDisputeModal({
  isOpen,
  onClose,
  votingId,
  agreement,
  onDisputeCreated,
}: OpenDisputeModalProps) {
  const { user: currentUser } = useAuth();
  const networkInfo = useNetworkEnvironment();
  const [form, setForm] = useState({
    title: "",
    kind: "Pro Bono" as "Pro Bono" | "Paid",
    defendant: "",
    description: "",
    claim: "",
    evidence: [] as UploadedFile[],
    witnesses: [""] as string[],
  });

  // Transaction state
  const [transactionStep, setTransactionStep] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [isProcessingPaidDispute, setIsProcessingPaidDispute] = useState(false);

  // Add this ref to track if form has been initialized
  const hasInitialized = useRef(false);

  // Refs for form data that changes
  const formRef = useRef(form);
  const agreementIdRef = useRef(agreement?.id);
  const networkInfoRef = useRef(networkInfo);

  // Refs to prevent duplicate dispute creation
  const hasCreatedDisputeRef = useRef(false);
  const lastTransactionHashRef = useRef<string | null>(null);

  // Wagmi hooks for smart contract interaction
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess: isTransactionSuccess, isError: isTransactionError } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Update refs when dependencies change
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    agreementIdRef.current = agreement?.id;
  }, [agreement?.id]);

  useEffect(() => {
    networkInfoRef.current = networkInfo;
  }, [networkInfo]);

  // Initialize form from agreement
  useEffect(() => {
    if (isOpen && agreement && !hasInitialized.current) {
      // Determine who the defendant should be (the other party)
      const isFirstParty =
        agreement._raw?.firstParty?.username === currentUser?.username;
      const defendant = isFirstParty
        ? agreement.counterparty
        : agreement.createdBy;

      // Format the defendant for display
      const formattedDefendant = defendant
        ? formatDefendantDisplay(defendant)
        : "";

      // Check if this is from a second rejection
      const isFromSecondRejection = isSecondRejection(agreement._raw);

      let title = `Dispute from Agreement: ${agreement.title}`;
      let description = `This dispute originates from agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: `;

      if (isFromSecondRejection) {
        title = `Dispute: ${agreement.title} - Second Delivery Rejection`;
        description = `This dispute was automatically triggered after the second rejection of delivery for agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: The delivery has been rejected twice, indicating unresolved issues with the work performed.`;
      }

      // Pre-fill form with agreement data
      setForm({
        title,
        kind: "Pro Bono",
        defendant: formattedDefendant, // Use formatted defendant
        description,
        claim: "",
        evidence: [],
        witnesses: [""],
      });

      // Mark as initialized
      hasInitialized.current = true;
    }
  }, [isOpen, agreement, currentUser]);

  // Reset the initialized flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      setTransactionStep("idle");
      setIsProcessingPaidDispute(false);
      // Reset duplicate prevention refs
      hasCreatedDisputeRef.current = false;
      lastTransactionHashRef.current = null;
      resetWrite();
    }
  }, [isOpen, resetWrite]);

  // Helper function to reset and close
  const resetFormAndClose = useCallback(() => {
    setForm({
      title: "",
      kind: "Pro Bono",
      defendant: "",
      description: "",
      claim: "",
      evidence: [],
      witnesses: [""],
    });
    setTransactionStep("idle");
    setIsProcessingPaidDispute(false);
    // Reset the processing ref
    transactionProcessingRef.current = {
      hasProcessed: false,
      transactionHash: null,
    };
    resetWrite();
    onDisputeCreated();
    onClose();
  }, [resetWrite, onDisputeCreated, onClose]);

  // Replace the entire transaction handling logic with this:

  // Transaction state ref to prevent multiple executions
  const transactionProcessingRef = useRef({
    hasProcessed: false,
    transactionHash: null as string | null,
  });

  // Handle transaction status changes - SIMPLE AND RELIABLE VERSION
  // Handle transaction status changes - UPDATED
  useEffect(() => {
    console.log("🔄 Transaction effect running:", {
      isWritePending,
      isTransactionSuccess,
      writeError,
      isTransactionError,
      isProcessingPaidDispute,
      hash,
      hasProcessed: transactionProcessingRef.current.hasProcessed,
    });

    if (isWritePending) {
      console.log("⏳ Transaction pending...");
      setTransactionStep("pending");
      // Reset processing flag when new transaction starts
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
    } else if (isTransactionSuccess && hash && isProcessingPaidDispute) {
      console.log("✅ Transaction successful!");

      // Mark as processed
      transactionProcessingRef.current = {
        hasProcessed: true,
        transactionHash: hash,
      };

      console.log("🚀 Transaction confirmed for dispute");
      setTransactionStep("success");
      setIsProcessingPaidDispute(false);

      // Show success message
      toast.success("Transaction confirmed!", {
        description: "Updating dispute status...",
        duration: 3000,
      });

      // IMPORTANT: Wait 2 seconds then close modal
      setTimeout(() => {
        resetFormAndClose();
      }, 2000);

      // Call onDisputeCreated to trigger parent refresh
      onDisputeCreated();
    } else if (writeError || isTransactionError) {
      console.log("❌ Transaction failed");
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);

      // Show error but keep the modal open so user can retry
      toast.error("Transaction failed", {
        description: "Smart contract transaction failed. Please try again.",
        duration: 5000,
      });

      // Reset processing flag on error
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
    }
  }, [
    isWritePending,
    isTransactionSuccess,
    writeError,
    isTransactionError,
    isProcessingPaidDispute,
    hash,
    resetFormAndClose,
    onDisputeCreated,
  ]);

  // Reset processing ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
    }
  }, [isOpen]);

  const fetchOnchainVoteConfigs = useCallback(
    async (agreement: any) => {
      if (!agreement) return;

      console.log("Fetching on-chain vote configs for agreement:", agreement);
      try {
        const res = await getVoteConfigs(
          agreement.chainId || networkInfo.chainId,
        );
        return res;
      } catch (err) {
        console.error("Failed to fetch getVoteConfig agreement:", err);
        return null;
      }
    },
    [networkInfo.chainId],
  );

  // Smart contract interaction for paid disputes - UPDATED
  const createDisputeOnchain = useCallback(
    async (votingId: number): Promise<void> => {
      console.log(
        "🟡 [DEBUG] createDisputeOnchain STARTED with votingId:",
        votingId,
      );

      try {
        console.log("🔍 [DEBUG] Network Info:", {
          chainId: networkInfo.chainId,
        });

        const contractAddress = VOTING_CA[networkInfo.chainId as number];
        console.log("📝 [DEBUG] Contract lookup:", {
          chainId: networkInfo.chainId,
          contractAddress,
          availableChains: Object.keys(VOTING_ABI),
        });

        if (!contractAddress) {
          console.error(
            "❌ [DEBUG] No contract address found for chain ID",
            networkInfo.chainId,
          );
          throw new Error(
            `No contract address found for chain ID ${networkInfo.chainId}`,
          );
        }

        console.log("🔍 [DEBUG] Before fetchOnchainVoteConfigs");
        console.log("📋 [DEBUG] Agreement data:", {
          id: agreement?.id,
          votingId: agreement?.votingId,
          blockchain: agreement?.blockchain,
        });

        const configs = await fetchOnchainVoteConfigs(agreement);

        console.log("📊 [DEBUG] On-chain configs:", {
          feeAmount: configs?.feeAmount?.toString(),
          configsExist: !!configs,
        });

        console.log("🎯 [DEBUG] Voting ID to use:", votingId);
        console.log("🔢 [DEBUG] BigInt conversion:", {
          original: votingId,
          bigInt: BigInt(votingId),
        });

        const feeValue = configs ? configs.feeAmount : undefined;

        console.log("💰 [DEBUG] Transaction details:", {
          contractAddress,
          functionName: "raiseDispute",
          args: [BigInt(votingId), false],
          value: feeValue?.toString(),
          hasFee: !!feeValue,
        });

        console.log("⏳ [DEBUG] Calling writeContract...");

        writeContract({
          address: contractAddress,
          abi: VOTING_ABI.abi,
          functionName: "raiseDispute",
          args: [BigInt(votingId), false],
          value: feeValue,
        });

        console.log("✅ [DEBUG] writeContract called successfully");
        console.log(
          "🟢 [DEBUG] Transaction initiated - waiting for confirmation",
        );
      } catch (error: any) {
        console.error("❌ [DEBUG] createDisputeOnchain ERROR:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          data: error.data,
        });

        console.error("❌ Smart contract interaction failed:", error);

        toast.error("Failed to initiate smart contract transaction", {
          description:
            error.message ||
            "Please check your wallet connection and try again.",
        });

        console.log("🔧 [DEBUG] Setting error state");
        setTransactionStep("error");
        setIsProcessingPaidDispute(false);
        // Reset flags on error
        hasCreatedDisputeRef.current = false;
        lastTransactionHashRef.current = null;

        console.log("🟢 [DEBUG] Error handled, user notified");
      } finally {
        console.log("🔚 [DEBUG] createDisputeOnchain execution complete");
      }
    },
    [agreement, fetchOnchainVoteConfigs, networkInfo.chainId, writeContract],
  );

  // Main form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // STEP 2: Now call smart contract with the voting ID
      await createDisputeOnchain(votingId);
    } catch (error: any) {
      console.error("❌ [PAID] Failed to create paid dispute:", error);
      setIsProcessingPaidDispute(false);

      const errorMessage = error.message || "Failed to create dispute";
      toast.error("Submission Failed", {
        description: errorMessage,
        duration: 6000,
      });
    }
  };

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-cyan-300" />
              <h3 className="text-xl font-semibold text-cyan-300">
                Making payment for {agreement?.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
              disabled={
                transactionStep === "pending" || isProcessingPaidDispute
              }
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            {/* ADD THIS NEW PROCESSING SECTION */}
            <div className="mb-6 rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
              <div className="flex flex-col items-center justify-center text-center">
                {/* Animated Spinner */}
                <div className="relative mb-6">
                  <div className="size-20 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400"></div>
                  {/* <div className="absolute inset-0 flex items-center justify-center">
                    <Scale className="h-8 w-8 text-cyan-300" />
                  </div> */}
                </div>

                {/* Status Message */}
                <div className="mb-4">
                  <h4 className="mb-2 text-lg font-semibold text-white">
                    {transactionStep === "pending"
                      ? "Processing Transaction..."
                      : "Ready to Create Dispute"}
                  </h4>
                  <p className="text-sm text-cyan-200/80">
                    {transactionStep === "pending"
                      ? "Your transaction is being processed on the blockchain. This may take a moment..."
                      : "Your dispute is ready to be created."}
                  </p>
                </div>

                {/* Information Panel */}
                <div className="mt-4 w-full rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
                    <div className="text-left">
                      <h5 className="mb-1 font-medium text-cyan-300">
                        What's happening?
                      </h5>
                      <ul className="space-y-2 text-xs text-cyan-200/80">
                        <li className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>
                            Your dispute will be created and registered on the
                            blockchain
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>
                            Once created, the dispute will enter the voting
                            phase
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Scale className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>
                            Judges will review your case and community members
                            can vote
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Progress Steps */}
                {transactionStep === "pending" && (
                  <div className="mt-6 w-full">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-cyan-300">Transaction Status</span>
                      <span className="font-medium text-cyan-200">
                        In Progress
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-cyan-500/20">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3 pt-4">
                <Button
                  type="submit"
                  variant="neon"
                  className="neon-hover w-full py-3"
                  disabled={
                    transactionStep === "pending" || isProcessingPaidDispute
                  }
                >
                  {transactionStep === "pending" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {form.kind === "Paid" && transactionStep === "pending"
                        ? "Processing Transaction..."
                        : "Creating Dispute..."}
                    </>
                  ) : (
                    <>
                      <Scale className="mr-2 h-4 w-4" />
                      {form.kind === "Paid"
                        ? "Pay & Open Dispute"
                        : "Open Dispute"}
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Smart Contract Info for Paid Disputes */}
            {form.kind === "Paid" && transactionStep === "idle" && (
              <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-cyan-300" />
                  <h4 className="text-sm font-medium text-cyan-200">
                    Smart Contract Transaction Required
                  </h4>
                </div>
                <p className="mt-2 text-xs text-cyan-300/80">
                  For paid disputes, you'll need to confirm a transaction in
                  your wallet to record the dispute on-chain. This ensures
                  transparency and security for your case.
                </p>
                <div className="mt-3 text-xs text-cyan-400">
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <span>Voting ID: {votingId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <span>Network: {networkInfo.chainName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
