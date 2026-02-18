/* eslint-disable @typescript-eslint/no-explicit-any */
// RejectPendingDisputeModal.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { AlertTriangle, Loader2, Info, X } from "lucide-react";
import { TransactionStatus } from "../components/TransactionStatus";
import { toast } from "sonner";
import { useEscrowDisputeTransaction } from "../hooks/useEscrowDisputeTransaction";

interface RejectPendingDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractAgreementId: bigint;
  votingId: number | string;
  escrowAddress: `0x${string}`;
  isProBono: boolean;
  agreement: any;
  onDisputeCreated: () => void;
}

export const RejectPendingDisputeModal = ({
  isOpen,
  onClose,
  contractAgreementId,
  votingId,
  escrowAddress,
  isProBono,
  agreement,
  onDisputeCreated,
}: RejectPendingDisputeModalProps) => {
  const [hasInitiatedTransaction, setHasInitiatedTransaction] = useState(false);
  const [modalState, setModalState] = useState<
    "initializing" | "active" | "closing"
  >("initializing");

  // Use the custom hook for escrow dispute transactions
  const {
    transactionStep,
    isProcessing,
    transactionHash,
    transactionError,
    rejectDeliveryOnchain,
    retryTransaction,
    resetTransaction,
    isSuccess,
    isError,
  } = useEscrowDisputeTransaction(
    escrowAddress,
    agreement?.chainId || 11155111,
  ); // Default to Sepolia if chainId not available

  // Enhanced logging
  useEffect(() => {
    console.log("📊 [RejectPendingDisputeModal] State Update:", {
      isOpen,
      contractAgreementId: contractAgreementId?.toString(),
      votingId,
      transactionStep,
      isProcessing,
      transactionHash,
      hasInitiatedTransaction,
      modalState,
      isProBono,
    });
  }, [
    isOpen,
    contractAgreementId,
    votingId,
    transactionStep,
    isProcessing,
    transactionHash,
    hasInitiatedTransaction,
    modalState,
    isProBono,
  ]);

  // Initialize transaction when modal opens
  useEffect(() => {
    if (isOpen && contractAgreementId && votingId && !hasInitiatedTransaction) {
      console.log(
        "🚀 [RejectPendingDisputeModal] Initializing transaction for voting ID:",
        votingId,
      );
      console.log("📄 Contract Agreement ID:", contractAgreementId.toString());
      console.log("💰 Dispute Type:", isProBono ? "Pro Bono" : "Paid");

      setHasInitiatedTransaction(true);
      setModalState("active");

      // Start transaction with a small delay
      const startTransaction = async () => {
        try {
          console.log(
            "⏳ [RejectPendingDisputeModal] Starting transaction in 500ms...",
          );
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Convert votingId to bigint
          const votingIdBigInt = BigInt(votingId.toString());

          console.log(
            "💰 [RejectPendingDisputeModal] Calling rejectDeliveryOnchain...",
          );
          await rejectDeliveryOnchain(
            contractAgreementId,
            votingIdBigInt,
            isProBono,
          );
          console.log("✅ [RejectPendingDisputeModal] Transaction initiated");
        } catch (error) {
          console.error(
            "❌ [RejectPendingDisputeModal] Failed to start transaction:",
            error,
          );
        }
      };

      startTransaction();
    }
  }, [
    isOpen,
    contractAgreementId,
    votingId,
    hasInitiatedTransaction,
    rejectDeliveryOnchain,
    isProBono,
  ]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && transactionHash) {
      console.log(
        "✅ [RejectPendingDisputeModal] Transaction successful! Hash:",
        transactionHash,
      );
      console.log(
        "🔄 [RejectPendingDisputeModal] Will close modal and call onDisputeCreated in 2 seconds",
      );

      setModalState("closing");

      // Close modal after success with delay
      const timer = setTimeout(() => {
        console.log(
          "🏁 [RejectPendingDisputeModal] Closing modal and calling onDisputeCreated",
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
      console.error("❌ [RejectPendingDisputeModal] Transaction failed:", {
        error: transactionError,
        contractAgreementId: contractAgreementId?.toString(),
        votingId,
      });

      // Keep modal open for retry
      setModalState("active");
    }
  }, [isError, transactionError, contractAgreementId, votingId]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log(
        "♻️ [RejectPendingDisputeModal] Modal closed, resetting state",
      );
      resetTransaction();
      setHasInitiatedTransaction(false);
      setModalState("initializing");
    }
  }, [isOpen, resetTransaction]);

  const handleRetryPayment = useCallback(async () => {
    if (!contractAgreementId || !votingId) {
      console.error(
        "❌ [RejectPendingDisputeModal] Cannot retry: Missing required data",
      );
      toast.error("Cannot retry: Missing transaction data");
      return;
    }

    console.log(
      "🔄 [RejectPendingDisputeModal] Retrying payment for voting ID:",
      votingId,
    );

    try {
      const votingIdBigInt = BigInt(votingId.toString());
      await retryTransaction(contractAgreementId, votingIdBigInt, isProBono);
      console.log("✅ [RejectPendingDisputeModal] Retry initiated");
    } catch (error) {
      console.error("❌ [RejectPendingDisputeModal] Retry failed:", error);
    }
  }, [contractAgreementId, votingId, retryTransaction, isProBono]);

  // Get custom status messages based on modal state
  const getStatusConfig = () => {
    // If modal is initializing (just opened)
    if (
      modalState === "initializing" &&
      !isProcessing &&
      transactionStep === "idle"
    ) {
      return {
        title: "Initializing Rejection...",
        description: "Preparing transaction for your dispute.",
        showSpinner: true,
        className: "text-blue-400",
      };
    }

    // Use transactionStep from custom hook
    switch (transactionStep) {
      case "pending":
        return {
          title: isProBono
            ? "Processing Rejection..."
            : "Processing Payment...",
          description: isProBono
            ? "Please confirm the transaction in your wallet to reject delivery."
            : "Please confirm the transaction in your wallet to complete payment.",
          showSpinner: true,
          className: "text-blue-400",
        };
      case "success":
        return {
          title: isProBono ? "Rejection Successful!" : "Payment Successful!",
          description: isProBono
            ? "Your dispute is now active."
            : "Your paid dispute is now active.",
          showSpinner: false,
          className: "text-green-400",
        };
      case "error":
        return {
          title: "Transaction Failed",
          description:
            transactionError?.message ||
            "The transaction could not be completed.",
          showSpinner: false,
          className: "text-red-400",
        };
      default:
        return {
          title: isProBono ? "Ready to Reject Delivery" : "Ready for Payment",
          description: isProBono
            ? "Please confirm the transaction in your wallet to reject delivery."
            : "Please confirm the transaction in your wallet to complete payment.",
          showSpinner: false,
          className: "text-yellow-400",
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (!isOpen) {
    console.log(
      "🚫 [RejectPendingDisputeModal] Modal not open, returning null",
    );
    return null;
  }

  console.log("🎬 [RejectPendingDisputeModal] Rendering modal with:", {
    votingId,
    transactionStep,
    modalState,
    isProBono,
    statusConfig,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          disabled={isProcessing}
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
            <AlertTriangle className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isProBono ? "Reject Delivery" : "Payment Processing"}
            </h2>
            <p className="text-sm text-purple-300">
              {isProBono
                ? "Complete transaction to reject delivery"
                : "Complete payment to reject delivery"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-6">
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

          {/* Progress Indicator for pending state */}
          {transactionStep === "pending" && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-purple-300">Processing Transaction</span>
                <span className="font-medium text-purple-200">
                  Waiting for confirmation...
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-500/20">
                <div
                  className="h-full animate-pulse bg-gradient-to-r from-purple-400 to-purple-500"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          )}

          {/* Transaction Information */}
          <div className="space-y-4">
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <h4 className="mb-2 text-sm font-medium text-purple-300">
                Transaction Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Agreement:</span>
                  <span className="max-w-[200px] truncate text-white">
                    {agreement?.title || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Action:</span>
                  <span className="text-white">Reject Delivery</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Type:</span>
                  <span className="text-white">
                    {isProBono ? "Pro Bono Dispute" : "Paid Dispute"}
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-purple-200/80">Voting ID:</span>
                  <span className="font-mono text-white">{votingId}</span>
                </div> */}
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

            {/* Smart Contract Info */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <div className="text-xs text-blue-200">
                  {isProBono ? (
                    <span>
                      This transaction records your delivery rejection on the
                      blockchain. Please confirm the transaction in your wallet
                      when prompted.
                    </span>
                  ) : (
                    <span>
                      This transaction records your dispute on the blockchain
                      for transparency and security. Please confirm the
                      transaction in your wallet when prompted.
                    </span>
                  )}
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
                    <p className="mt-1 max-h-[4rem] overflow-y-scroll text-sm break-all text-red-200/80 opacity-90">
                      {transactionError.message || "Unknown error occurred"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
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
                console.log(
                  "🎯 [RejectPendingDisputeModal] Continue button clicked",
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
    </div>
  );
};
