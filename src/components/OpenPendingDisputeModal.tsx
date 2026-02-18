/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import {
  Scale,
  X,
  Wallet,
  Info,
  // Clock,
  AlertTriangle,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
// import { toast } from "sonner";
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
  const [userInitiated, setUserInitiated] = useState(false);
  const [modalState, setModalState] = useState<
    "initializing" | "active" | "closing"
  >("initializing");

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
      setUserInitiated(false);
      setModalState("initializing");
    }
  }, [isOpen, resetTransaction]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && transactionHash) {
      console.log(
        "✅ [OpenPendingDisputeModal] Transaction successful! Hash:",
        transactionHash,
      );

      setModalState("closing");

      // Close modal after success with delay
      const timer = setTimeout(() => {
        console.log(
          "🏁 [OpenPendingDisputeModal] Closing modal and calling onDisputeCreated",
        );
        onDisputeCreated();
        onClose();
        setUserInitiated(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, transactionHash, onDisputeCreated, onClose]);

  // Handle transaction error
  useEffect(() => {
    if (isError) {
      console.error("❌ [OpenPendingDisputeModal] Transaction failed:", {
        error: transactionError,
        votingId,
        chainId: networkInfo.chainId,
      });

      setModalState("active");
      setUserInitiated(false); // Allow retry
    }
  }, [isError, transactionError, votingId, networkInfo.chainId]);

  const handleStartPayment = async () => {
    if (!votingId || userInitiated || isProcessing) return;

    console.log(
      "🚀 [OpenPendingDisputeModal] User initiated payment for voting ID:",
      votingId,
    );

    setUserInitiated(true);
    setModalState("active");

    try {
      await createDisputeOnchain(votingId);
      console.log("✅ [OpenPendingDisputeModal] Transaction initiated");
    } catch (error) {
      console.error(
        "❌ [OpenPendingDisputeModal] Failed to start transaction:",
        error,
      );
      setUserInitiated(false);
    }
  };

  const handleRetryPayment = async () => {
    console.log(
      "🔄 [OpenPendingDisputeModal] Retrying payment for voting ID:",
      votingId,
    );

    setUserInitiated(false);
    await retryTransaction(votingId);
  };

  // Get custom status messages and icons based on modal state
  const getStatusConfig = () => {
    // Initial state - waiting for user to click
    if (
      modalState === "initializing" &&
      transactionStep === "idle" &&
      !userInitiated
    ) {
      return {
        title: "Ready to Pay",
        description: "Click the button below to start the payment process.",
        icon: <Wallet className="h-12 w-12 text-yellow-400" />,
        spinner: false,
        className: "text-yellow-400",
      };
    }

    switch (transactionStep) {
      case "pending":
        return {
          title: "Processing Payment...",
          description:
            "Confirm the transaction in your wallet to complete payment.",
          icon: <Loader2 className="h-12 w-12 animate-spin text-blue-400" />,
          spinner: true,
          className: "text-blue-400",
        };
      case "success":
        return {
          title: "Payment Successful!",
          description: "Your dispute is now active. Redirecting...",
          icon: <CheckCircle className="h-12 w-12 text-green-400" />,
          spinner: false,
          className: "text-green-400",
        };
      case "error":
        return {
          title: "Payment Failed",
          description:
            transactionError?.message ||
            "The transaction could not be completed.",
          icon: <AlertCircle className="h-12 w-12 text-red-400" />,
          spinner: false,
          className: "text-red-400",
        };
      default:
        return {
          title: "Ready for Payment",
          description: "Please confirm the transaction in your wallet.",
          icon: <Wallet className="h-12 w-12 text-yellow-400" />,
          spinner: false,
          className: "text-yellow-400",
        };
    }
  };

  const statusConfig = getStatusConfig();

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
          className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 shadow-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/30 bg-purple-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-purple-300" />
              <h3 className="text-xl font-semibold text-purple-300">
                {transactionStep === "success"
                  ? "Payment Complete!"
                  : "Complete Payment"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
              disabled={
                isProcessing ||
                transactionStep === "pending" ||
                transactionStep === "success"
              }
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="mb-4 rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
              <p className="text-sm text-purple-200">
                Completing payment for: <strong>{agreement?.title}</strong>
              </p>
            </div>

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

            {/* Status Icon and Message */}
            <div className="mb-8 flex flex-col items-center justify-center text-center">
              <div className="mb-4">{statusConfig.icon}</div>
              <div>
                <h3
                  className={`mb-2 text-lg font-semibold ${statusConfig.className}`}
                >
                  {statusConfig.title}
                </h3>
                <p className="max-w-md truncate text-sm text-purple-200/80">
                  {statusConfig.description}
                </p>
              </div>
            </div>

            {/* Progress Indicator for pending state */}
            {transactionStep === "pending" && (
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-purple-300">
                    Processing Transaction
                  </span>
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
                    <span className="text-white">
                      {agreement?.title || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200/80">Type:</span>
                    <span className="text-white">Paid Dispute</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200/80">Voting ID:</span>
                    <span className="font-mono text-white">{votingId}</span>
                  </div>
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

              {transactionError && (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <div className="text-xs">
                      <p className="font-medium text-red-300">Error Details:</p>
                      <p className="mt-1 max-h-[6rem] overflow-y-scroll text-sm break-all text-red-200/80 opacity-90">
                        {transactionError.message || "Unknown error occurred"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              {transactionStep === "idle" && !userInitiated && (
                <>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="neon"
                    onClick={handleStartPayment}
                    className="neon-hover border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20"
                    disabled={isProcessing}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Pay & Activate Dispute
                  </Button>
                </>
              )}

              {transactionStep === "error" && (
                <>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </Button>
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
                </>
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
