/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  AlertTriangle,
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { useNetworkEnvironment } from "../../../../config/useNetworkEnvironment";
import { useDisputeTransaction } from "../../../../hooks/useDisputeTransaction";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  votingId: number;
  agreement: any;
  onDisputeCreated: () => void;
  flow?: "reject" | "open";
}

export const PendingDisputeModal = ({
  isOpen,
  onClose,
  votingId,
  agreement,
  onDisputeCreated,
  flow = "reject",
}: Props) => {
  
  const networkInfo = useNetworkEnvironment();
  const [userInitiated, setUserInitiated] = useState(false);
  const [modalState, setModalState] = useState<
    "initializing" | "active" | "closing"
  >("initializing");
  const hasStartedTransaction = useRef(false);

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

  useEffect(() => {
    if (isSuccess && transactionHash) {
      setModalState("closing");
      toast.success("Payment successful! Waiting for confirmation...", {
        description: "Your dispute will be activated momentarily.",
        duration: 3000,
      });
    }
  }, [isSuccess, transactionHash]);

  useEffect(() => {
    if (isError) {
      setModalState("active");
      setUserInitiated(false);
    }
  }, [isError]);

  useEffect(() => {
    if (!isOpen) {
      resetTransaction();
      setUserInitiated(false);
      setModalState("initializing");
      hasStartedTransaction.current = false;
    }
  }, [isOpen, resetTransaction]);

  const handleStartPayment = useCallback(async () => {
    if (!votingId || userInitiated || isProcessing) return;
    setUserInitiated(true);
    setModalState("active");
    console.log(
      `[PendingDisputeModal] Starting payment — flow: ${flow}, votingId: ${votingId}`,
    );
    try {
      await createDisputeOnchain(votingId);
    } catch {
      setUserInitiated(false);
    }
  }, [votingId, userInitiated, isProcessing, createDisputeOnchain, flow]);

  const handleRetryPayment = useCallback(async () => {
    setUserInitiated(false);
    await retryTransaction(votingId);
  }, [votingId, retryTransaction]);

  const getStatusConfig = () => {
    if (
      modalState === "initializing" &&
      transactionStep === "idle" &&
      !userInitiated
    ) {
      return {
        title: "Ready to Pay",
        description:
          "Click the button below to start the payment process for your dispute.",
        icon: <Wallet className="h-12 w-12 text-yellow-400" />,
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
          className: "text-blue-400",
        };
      case "success":
        return {
          title: "Payment Successful!",
          description: "Your dispute is now active.",
          icon: <CheckCircle className="h-12 w-12 text-green-400" />,
          className: "text-green-400",
        };
      case "error":
        return {
          title: "Payment Failed",
          description:
            transactionError?.message ||
            "The transaction could not be completed.",
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          className: "text-red-400",
        };
      default:
        return {
          title: "Ready for Payment",
          description: "Please confirm the transaction in your wallet.",
          icon: <Wallet className="h-12 w-12 text-yellow-400" />,
          className: "text-yellow-400",
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          disabled={
            isProcessing ||
            transactionStep === "pending" ||
            transactionStep === "success"
          }
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
              {transactionStep === "success"
                ? "Payment Complete!"
                : "Complete Payment"}
            </h2>
            <p className="text-sm text-purple-300">
              {transactionStep === "success"
                ? "Your dispute is now active"
                : "Complete the transaction to activate your dispute"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <div className="mb-8 flex flex-col items-center justify-center text-center">
            <div className="mb-4">{statusConfig.icon}</div>
            <h3
              className={`mb-2 text-lg font-semibold ${statusConfig.className}`}
            >
              {statusConfig.title}
            </h3>
            <p
              className={`mx-auto max-w-[20rem] truncate text-sm sm:max-w-md ${statusConfig.className}`}
            >
              {statusConfig.description}
            </p>
          </div>

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

          {transactionHash && (
            <div className="mb-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium text-green-300">
                  Transaction Hash:
                </span>
              </div>
              <div className="mt-1 font-mono text-xs break-all text-green-200">
                {transactionHash}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <h4 className="mb-2 text-sm font-medium text-purple-300">
                Transaction Details
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  ["Agreement", agreement?.title || "N/A"],
                  ["Type", "Paid Dispute"],
                  // ["Flow", flow],
                  ["Voting ID", votingId],
                  ["Network", networkInfo.chainName],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-purple-200/80">{label}:</span>
                    <span className="text-white capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <div className="text-xs text-blue-200">
                  This transaction records your dispute on the blockchain for
                  transparency and security.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
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
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
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
                className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
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
                onDisputeCreated();
                onClose();
              }}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
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
    </div>
  );
};
