/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import {
  Scale,
  X,
  // Wallet,
  Info,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { UploadedFile } from "../types";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useDisputeTransaction } from "../hooks/useDisputeTransaction";
import { TransactionStatus } from "../components/TransactionStatus";

const formatDefendantDisplay = (defendant: string): string => {
  const cleanDefendant = defendant.replace(/^@/, "");
  if (isWalletAddress(cleanDefendant)) {
    return cleanDefendant;
  }
  return defendant.startsWith("@") ? defendant : `@${defendant}`;
};

const isSecondRejection = (agreement: any): boolean => {
  if (!agreement?.timeline) return false;
  const rejectionEvents = agreement.timeline.filter(
    (event: any) => event.eventType === 6,
  );
  return rejectionEvents.length >= 2;
};

const isWalletAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

interface OpenPendingDisputeModalProps {
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
}: OpenPendingDisputeModalProps) {
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

  // Use the custom hook for transaction management
  const {
    transactionStep,
    isProcessing,
    transactionHash,
    transactionError,
    createDisputeOnchain,
    retryTransaction,
    resetTransaction,
    isSuccess,
    isError,
  } = useDisputeTransaction(networkInfo.chainId);

  const [hasInitiatedTransaction, setHasInitiatedTransaction] = useState(false);
  const [modalState, setModalState] = useState<
    "initializing" | "active" | "closing"
  >("initializing");

  // Add this ref to track if form has been initialized
  const hasInitialized = useRef(false);

  // Refs for form data that changes
  const formRef = useRef(form);
  const agreementIdRef = useRef(agreement?.id);
  const networkInfoRef = useRef(networkInfo);

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
      const isFirstParty =
        agreement._raw?.firstParty?.username === currentUser?.username;
      const defendant = isFirstParty
        ? agreement.counterparty
        : agreement.createdBy;

      const formattedDefendant = defendant
        ? formatDefendantDisplay(defendant)
        : "";

      const isFromSecondRejection = isSecondRejection(agreement._raw);

      let title = `Dispute from Agreement: ${agreement.title}`;
      let description = `This dispute originates from agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: `;

      if (isFromSecondRejection) {
        title = `Dispute: ${agreement.title} - Second Delivery Rejection`;
        description = `This dispute was automatically triggered after the second rejection of delivery for agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: The delivery has been rejected twice, indicating unresolved issues with the work performed.`;
      }

      setForm({
        title,
        kind: "Paid", // Always "Paid" for pending modal
        defendant: formattedDefendant,
        description,
        claim: "",
        evidence: [],
        witnesses: [""],
      });

      hasInitialized.current = true;
    }
  }, [isOpen, agreement, currentUser]);

  // Reset the initialized flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      resetTransaction();
      setHasInitiatedTransaction(false);
      setModalState("initializing");
    }
  }, [isOpen, resetTransaction]);

  // Enhanced logging
  useEffect(() => {
    console.log("📊 [OpenPendingDisputeModal] State Update:", {
      isOpen,
      votingId,
      transactionStep,
      isProcessing,
      transactionHash,
      hasInitiatedTransaction,
      modalState,
      networkInfo,
    });
  }, [
    isOpen,
    votingId,
    transactionStep,
    isProcessing,
    transactionHash,
    hasInitiatedTransaction,
    modalState,
    networkInfo,
  ]);

  // Initialize transaction when modal opens
  useEffect(() => {
    if (isOpen && votingId && !hasInitiatedTransaction) {
      console.log(
        "🚀 [OpenPendingDisputeModal] Initializing transaction for voting ID:",
        votingId,
      );
      console.log("🔗 Chain ID:", networkInfo.chainId);
      console.log("📄 Agreement:", {
        id: agreement?.id,
        title: agreement?.title,
        disputeId: agreement?.disputeId,
      });

      setHasInitiatedTransaction(true);
      setModalState("active");

      // Start transaction with a small delay
      const startTransaction = async () => {
        try {
          console.log(
            "⏳ [OpenPendingDisputeModal] Starting transaction in 500ms...",
          );
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log(
            "💰 [OpenPendingDisputeModal] Calling createDisputeOnchain...",
          );
          await createDisputeOnchain(votingId);
          console.log("✅ [OpenPendingDisputeModal] Transaction initiated");
        } catch (error) {
          console.error(
            "❌ [OpenPendingDisputeModal] Failed to start transaction:",
            error,
          );
        }
      };

      startTransaction();
    }
  }, [
    isOpen,
    votingId,
    hasInitiatedTransaction,
    createDisputeOnchain,
    networkInfo.chainId,
    agreement,
  ]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && transactionHash) {
      console.log(
        "✅ [OpenPendingDisputeModal] Transaction successful! Hash:",
        transactionHash,
      );
      console.log(
        "🔄 [OpenPendingDisputeModal] Will close modal and call onDisputeCreated in 2 seconds",
      );

      setModalState("closing");

      // Close modal after success with delay
      const timer = setTimeout(() => {
        console.log(
          "🏁 [OpenPendingDisputeModal] Closing modal and calling onDisputeCreated",
        );
        onDisputeCreated();
        onClose();
        resetTransaction();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, transactionHash, onDisputeCreated, onClose, resetTransaction]);

  // Handle transaction error
  useEffect(() => {
    if (isError) {
      console.error("❌ [OpenPendingDisputeModal] Transaction failed:", {
        error: transactionError,
        votingId,
        chainId: networkInfo.chainId,
      });

      // Keep modal open for retry
      setModalState("active");
    }
  }, [isError, transactionError, votingId, networkInfo.chainId]);

  const handleRetryPayment = useCallback(async () => {
    if (!votingId) {
      console.error(
        "❌ [OpenPendingDisputeModal] Cannot retry: Missing voting ID",
      );
      toast.error("Cannot retry: Missing voting ID");
      return;
    }

    console.log(
      "🔄 [OpenPendingDisputeModal] Retrying payment for voting ID:",
      votingId,
    );
    console.log("🔗 Chain ID:", networkInfo.chainId);

    try {
      await retryTransaction(votingId);
      console.log("✅ [OpenPendingDisputeModal] Retry initiated");
    } catch (error) {
      console.error("❌ [OpenPendingDisputeModal] Retry failed:", error);
    }
  }, [votingId, retryTransaction, networkInfo.chainId]);

  // Get custom status messages based on modal state
  const getStatusConfig = () => {
    if (
      modalState === "initializing" &&
      !isProcessing &&
      transactionStep === "idle"
    ) {
      return {
        title: "Initializing Payment...",
        description: "Preparing transaction for your dispute.",
        showSpinner: true,
        className: "text-blue-400",
      };
    }

    switch (transactionStep) {
      case "pending":
        return {
          title: "Processing Payment...",
          description:
            "Confirm the transaction in your wallet to complete payment.",
          showSpinner: true,
          className: "text-blue-400",
        };
      case "success":
        return {
          title: "Payment Successful!",
          description: "Your dispute is now active. Redirecting...",
          showSpinner: false,
          className: "text-green-400",
        };
      case "error":
        return {
          title: "Payment Failed",
          description:
            transactionError?.message ||
            "The transaction could not be completed.",
          showSpinner: false,
          className: "text-red-400",
        };
      default:
        return {
          title: "Ready for Payment",
          description: "Please confirm the transaction in your wallet.",
          showSpinner: false,
          className: "text-yellow-400",
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) {
    console.log("🚫 [OpenPendingDisputeModal] Modal not open, returning null");
    return null;
  }

  console.log("🎬 [OpenPendingDisputeModal] Rendering modal with:", {
    votingId,
    transactionStep,
    modalState,
    statusConfig,
  });

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
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            {/* Transaction Status Display */}
            <div className="mb-6">
              <TransactionStatus
                status={transactionStep}
                onRetry={handleRetryPayment}
                title={statusConfig.title}
                description={statusConfig.description}
                showRetryButton={true}
                className={statusConfig.className}
              />
            </div>

            {/* ADD THIS NEW PROCESSING SECTION */}
            <div className="mb-6 rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
              <div className="flex flex-col items-center justify-center text-center">
                {/* Animated Spinner */}
                <div className="relative mb-6">
                  <div className="size-20 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400"></div>
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

            {/* Transaction Information */}
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h4 className="mb-2 text-sm font-medium text-cyan-300">
                  Transaction Details
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cyan-200/80">Agreement:</span>
                    <span className="text-white">
                      {agreement?.title || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-200/80">Type:</span>
                    <span className="text-white">Paid Dispute</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-200/80">Voting ID:</span>
                    <span className="font-mono text-white">{votingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-200/80">Network:</span>
                    <span className="text-white">{networkInfo.chainName}</span>
                  </div>
                  {transactionHash && (
                    <div className="flex justify-between">
                      <span className="text-cyan-200/80">
                        Transaction Hash:
                      </span>
                      <span className="font-mono text-xs text-green-300">
                        {transactionHash.slice(0, 10)}...
                        {transactionHash.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Contract Info */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <div className="text-xs text-blue-200">
                    This transaction records your dispute on the blockchain for
                    transparency and security. Please confirm the transaction in
                    your wallet when prompted.
                  </div>
                </div>
              </div>

              {/* Error details for debugging */}
              {transactionError && (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <div className="text-xs">
                      <p className="font-medium text-red-300">Error Details:</p>
                      <p className="mt-1 text-sm break-all text-red-200/80">
                        {transactionError.message || "Unknown error occurred"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              {transactionStep !== "success" && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              )}

              {transactionStep === "error" && (
                <Button
                  variant="outline"
                  onClick={handleRetryPayment}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    "Retry Payment"
                  )}
                </Button>
              )}

              {transactionStep === "success" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log(
                      "🎯 [OpenPendingDisputeModal] Continue button clicked",
                    );
                    onDisputeCreated();
                    onClose();
                  }}
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  Continue to Dispute
                </Button>
              )}
            </div>

            {/* Footer with helpful info */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Info className="h-3 w-3" />
                <span>
                  If you encounter issues, try refreshing the page or check your
                  wallet connection.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
