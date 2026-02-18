/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import {
  Scale,
  X,
  //   Wallet,
  Info,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { TransactionStatus } from "../components/TransactionStatus";
import { useEscrowDisputeTransaction } from "../hooks/useEscrowDisputeTransaction";

interface EscrowPendingDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisputeCreated: () => void;
  contractAgreementId: bigint | number | string;
  votingId: number | string;
  escrowAddress: `0x${string}` | undefined;
  isProBono: boolean;

  agreement: any; // The escrow/agreement data
  action: "raise" | "reject"; // Whether this is raising a new dispute or rejecting delivery
}

export default function EscrowPendingDisputeModal({
  isOpen,
  onClose,
  onDisputeCreated,
  contractAgreementId,
  votingId,
  escrowAddress,
  isProBono,

  agreement,
  action,
}: EscrowPendingDisputeModalProps) {
  const networkInfo = useNetworkEnvironment();
  const [hasInitiatedTransaction, setHasInitiatedTransaction] = useState(false);
  const [modalState, setModalState] = useState<
    "initializing" | "active" | "closing"
  >("initializing");

  // Convert contractAgreementId to bigint
  const contractIdAsBigInt = useCallback(() => {
    try {
      if (typeof contractAgreementId === "bigint") return contractAgreementId;
      if (typeof contractAgreementId === "number")
        return BigInt(contractAgreementId);
      if (typeof contractAgreementId === "string")
        return BigInt(contractAgreementId);
      return 0n;
    } catch (error) {
      console.error("Failed to convert contractAgreementId to bigint:", error);
      return 0n;
    }
  }, [contractAgreementId]);

  // Convert votingId to bigint
  const votingIdAsBigInt = useCallback(() => {
    try {
      if (typeof votingId === "bigint") return votingId;
      if (typeof votingId === "number") return BigInt(votingId);
      if (typeof votingId === "string") return BigInt(votingId);
      return 0n;
    } catch (error) {
      console.error("Failed to convert votingId to bigint:", error);
      return 0n;
    }
  }, [votingId]);

  // Use the custom hook for transaction management
  const {
    transactionStep,
    isProcessing,
    transactionHash,
    transactionError,
    raiseDisputeOnchain,
    rejectDeliveryOnchain,
    retryTransaction,
    resetTransaction,
    isSuccess,
    isError,
    isTransactionLoading,
  } = useEscrowDisputeTransaction(escrowAddress, networkInfo.chainId);

  // Enhanced logging
  useEffect(() => {
    console.log("📊 [EscrowPendingDisputeModal] State Update:", {
      isOpen,
      votingId,
      contractAgreementId: contractIdAsBigInt().toString(),
      transactionStep,
      isProcessing,
      transactionHash,
      hasInitiatedTransaction,
      modalState,
      networkInfo,
      action,
      isProBono,
    });
  }, [
    isOpen,
    votingId,
    contractAgreementId,
    transactionStep,
    isProcessing,
    transactionHash,
    hasInitiatedTransaction,
    modalState,
    networkInfo,
    action,
    isProBono,
    contractIdAsBigInt,
  ]);

  // Initialize transaction when modal opens
  useEffect(() => {
    if (
      isOpen &&
      votingId &&
      contractIdAsBigInt() > 0n &&
      !hasInitiatedTransaction
    ) {
      console.log(
        `🚀 [EscrowPendingDisputeModal] Initializing transaction for ${action} with voting ID:`,
        votingId,
      );
      console.log("🔗 Chain ID:", networkInfo.chainId);
      console.log("📄 Agreement:", {
        id: agreement?.id,
        title: agreement?.title,
        contractId: contractIdAsBigInt().toString(),
      });

      setHasInitiatedTransaction(true);
      setModalState("active");

      // Start transaction with a small delay
      const startTransaction = async () => {
        try {
          console.log(
            "⏳ [EscrowPendingDisputeModal] Starting transaction in 500ms...",
          );
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (action === "raise") {
            console.log(
              "💰 [EscrowPendingDisputeModal] Calling raiseDisputeOnchain...",
            );
            await raiseDisputeOnchain(
              contractIdAsBigInt(),
              votingIdAsBigInt(),
              isProBono,
            );
          } else if (action === "reject") {
            console.log(
              "💰 [EscrowPendingDisputeModal] Calling rejectDeliveryOnchain...",
            );
            await rejectDeliveryOnchain(
              contractIdAsBigInt(),
              votingIdAsBigInt(),
              isProBono,
            );
          }

          console.log("✅ [EscrowPendingDisputeModal] Transaction initiated");
        } catch (error) {
          console.error(
            "❌ [EscrowPendingDisputeModal] Failed to start transaction:",
            error,
          );
        }
      };

      startTransaction();
    }
  }, [
    isOpen,
    votingId,
    contractAgreementId,
    hasInitiatedTransaction,
    raiseDisputeOnchain,
    rejectDeliveryOnchain,
    networkInfo.chainId,
    agreement,
    action,
    isProBono,

    contractIdAsBigInt,
    votingIdAsBigInt,
  ]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && transactionHash) {
      console.log(
        `✅ [EscrowPendingDisputeModal] Transaction successful! Hash:`,
        transactionHash,
      );
      console.log(
        "🔄 [EscrowPendingDisputeModal] Will close modal and call onDisputeCreated in 2 seconds",
      );

      setModalState("closing");

      // Close modal after success with delay
      const timer = setTimeout(() => {
        console.log(
          "🏁 [EscrowPendingDisputeModal] Closing modal and calling onDisputeCreated",
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
      console.error("❌ [EscrowPendingDisputeModal] Transaction failed:", {
        error: transactionError,
        votingId,
        contractAgreementId: contractIdAsBigInt().toString(),
        chainId: networkInfo.chainId,
      });

      // Keep modal open for retry
      setModalState("active");
    }
  }, [
    isError,
    transactionError,
    votingId,
    contractAgreementId,
    networkInfo.chainId,
    contractIdAsBigInt,
  ]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log(
        "♻️ [EscrowPendingDisputeModal] Modal closed, resetting state",
      );
      resetTransaction();
      setHasInitiatedTransaction(false);
      setModalState("initializing");
    }
  }, [isOpen, resetTransaction]);

  const handleRetryPayment = useCallback(async () => {
    if (!votingId || contractIdAsBigInt() === 0n) {
      console.error(
        "❌ [EscrowPendingDisputeModal] Cannot retry: Missing voting ID or contract ID",
      );
      toast.error("Cannot retry: Missing required IDs");
      return;
    }

    console.log(
      `🔄 [EscrowPendingDisputeModal] Retrying payment for voting ID:`,
      votingId,
    );
    console.log("🔗 Chain ID:", networkInfo.chainId);

    try {
      if (action === "raise") {
        await retryTransaction(
          contractIdAsBigInt(),
          votingIdAsBigInt(),
          isProBono,
        );
      } else if (action === "reject") {
        await retryTransaction(
          contractIdAsBigInt(),
          votingIdAsBigInt(),
          isProBono,
        );
      }
      console.log("✅ [EscrowPendingDisputeModal] Retry initiated");
    } catch (error) {
      console.error("❌ [EscrowPendingDisputeModal] Retry failed:", error);
    }
  }, [
    votingId,
    // contractAgreementId,
    retryTransaction,
    networkInfo.chainId,
    action,
    isProBono,

    contractIdAsBigInt,
    votingIdAsBigInt,
  ]);

  // Get custom status messages based on modal state and action
  const getStatusConfig = () => {
    const actionText = action === "raise" ? "Dispute" : "Delivery Rejection";

    if (
      modalState === "initializing" &&
      !isProcessing &&
      transactionStep === "idle"
    ) {
      return {
        title: `Initializing ${actionText}...`,
        description: `Preparing transaction for your ${actionText.toLowerCase()}.`,
        showSpinner: true,
        className: "text-blue-400",
      };
    }

    switch (transactionStep) {
      case "pending":
        return {
          title: `Processing ${actionText}...`,
          description: isProBono
            ? "Confirm the transaction in your wallet."
            : "Confirm the payment transaction in your wallet to complete.",
          showSpinner: true,
          className: "text-blue-400",
        };
      case "success":
        return {
          title: `${actionText} Successful!`,
          description: `Your ${actionText.toLowerCase()} is now active.`,
          showSpinner: false,
          className: "text-green-400",
        };
      case "error":
        return {
          title: `${actionText} Failed`,
          description:
            transactionError?.message ||
            `The transaction could not be completed.`,
          showSpinner: false,
          className: "text-red-400",
        };
      default:
        return {
          title: `Ready for ${actionText}`,
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
    console.log(
      "🚫 [EscrowPendingDisputeModal] Modal not open, returning null",
    );
    return null;
  }

  console.log("🎬 [EscrowPendingDisputeModal] Rendering modal with:", {
    votingId,
    contractAgreementId: contractIdAsBigInt().toString(),
    transactionStep,
    modalState,
    statusConfig,
    action,
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
          className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 shadow-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/30 bg-purple-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-purple-300" />
              <h3 className="text-xl font-semibold text-purple-300">
                {action === "raise" ? (
                  isProBono ? (
                    <>Pro bono dispute for {agreement?.title || "agreement"}</>
                  ) : (
                    <>Payment for dispute: {agreement?.title || "agreement"}</>
                  )
                ) : (
                  <>
                    Processing delivery rejection for{" "}
                    {agreement?.title || "agreement"}
                  </>
                )}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white/70 hover:text-white"
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
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

            {/* Processing Section */}
            <div className="mb-6 rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  {/* Spinner based on transaction step */}
                  {transactionStep === "pending" ? (
                    <div className="size-20 animate-spin rounded-full border-4 border-purple-400/20 border-t-purple-400"></div>
                  ) : transactionStep === "success" ? (
                    <div className="flex size-20 items-center justify-center rounded-full border-4 border-green-400/20 bg-green-400/10">
                      <CheckCircle2 className="h-10 w-10 text-green-400" />
                    </div>
                  ) : transactionStep === "error" ? (
                    <div className="flex size-20 items-center justify-center rounded-full border-4 border-red-400/20 bg-red-400/10">
                      <AlertCircle className="h-10 w-10 text-red-400" />
                    </div>
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-full border-4 border-yellow-400/20 bg-yellow-400/10">
                      <Clock className="h-10 w-10 text-yellow-400" />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="mb-2 text-lg font-semibold text-white">
                    {transactionStep === "pending"
                      ? `Processing ${action === "raise" ? "Dispute" : "Rejection"}...`
                      : `Ready to ${action === "raise" ? "Create Dispute" : "Reject Delivery"}`}
                  </h4>
                  <p className="text-sm text-purple-200/80">
                    {transactionStep === "pending"
                      ? "Your transaction is being processed on the blockchain. This may take a moment..."
                      : `Your ${action === "raise" ? "dispute" : "rejection"} is ready to be processed.`}
                  </p>
                </div>

                <div className="mt-4 w-full rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
                    <div className="text-left">
                      <h5 className="mb-1 font-medium text-purple-300">
                        What's happening?
                      </h5>
                      <ul className="space-y-2 text-xs text-purple-200/80">
                        <li className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>
                            {action === "raise"
                              ? "Your dispute will be recorded on the blockchain"
                              : "Your delivery rejection will be recorded on the blockchain"}
                          </span>
                        </li>

                        <li className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>
                            {action === "raise" ? (
                              <>
                                <span className="font-medium text-yellow-300">
                                  48 hours
                                </span>{" "}
                                submission period begins for both parties to
                                present evidence
                              </>
                            ) : (
                              "Once confirmed, a dispute will be automatically created"
                            )}
                          </span>
                        </li>

                        {action === "raise" && (
                          <li className="flex items-start gap-2">
                            <Scale className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>
                              During the 48-hour submission period, judges will
                              review evidences and vote afterwards.
                            </span>
                          </li>
                        )}

                        {action === "reject" && (
                          <li className="flex items-start gap-2">
                            <Scale className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>
                              Once dispute is created, both parties have{" "}
                              <span className="font-medium text-yellow-300">
                                48 hours
                              </span>{" "}
                              to submit evidence before voting starts
                            </span>
                          </li>
                        )}

                        {!isProBono && (
                          <li className="flex items-start gap-2 text-emerald-300">
                            <DollarSign className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>
                              Payment will be processed through your wallet
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {transactionStep === "pending" && (
                  <div className="mt-6 w-full">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-purple-300">
                        Transaction Status
                      </span>
                      <span className="font-medium text-purple-200">
                        {isTransactionLoading ? "Confirming..." : "In Progress"}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-purple-500/20">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-500"
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

            {/* Transaction Details */}
            <div className="space-y-4">
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                <h4 className="mb-2 text-sm font-medium text-purple-300">
                  Transaction Details
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-purple-200/80">Agreement:</span>
                    <span className="text-white">
                      {agreement?.title || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-purple-200/80">Action:</span>
                    <span className="text-white">
                      {action === "raise" ? "Raise Dispute" : "Reject Delivery"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-purple-200/80">Type:</span>
                    <span className="text-white">
                      {isProBono ? "Pro Bono" : "Paid"}
                    </span>
                  </div>

                  {/* <div className="flex justify-between">
                    <span className="text-purple-200/80">Voting ID:</span>
                    <span className="font-mono text-white">{votingId}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-purple-200/80">Contract ID:</span>
                    <span className="font-mono text-white">
                      {contractIdAsBigInt().toString()}
                    </span>
                  </div> */}

                  <div className="flex justify-between">
                    <span className="text-purple-200/80">Network:</span>
                    <span className="text-white">{networkInfo.chainName}</span>
                  </div>

                  {transactionHash && (
                    <div className="flex justify-between">
                      <span className="text-purple-200/80">
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

              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                  <div className="text-xs text-purple-200">
                    This transaction records your{" "}
                    {action === "raise" ? "dispute" : "delivery rejection"} on
                    the blockchain for transparency and security. Please confirm
                    the transaction in your wallet when prompted.
                  </div>
                </div>
              </div>

              {transactionError && (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <div className="text-xs">
                      <p className="font-medium text-red-300">Error Details:</p>
                      <p className="mt-1 max-h-[4rem] overflow-y-scroll text-sm break-all text-red-200/80 opacity-90">
                        {transactionError.message || "Unknown error occurred"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              {transactionStep !== "success" && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
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
                  className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    "Retry Transaction"
                  )}
                </Button>
              )}

              {transactionStep === "success" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onDisputeCreated();
                    onClose();
                  }}
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Continue to Dispute
                </Button>
              )}
            </div>

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
