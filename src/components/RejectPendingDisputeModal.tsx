/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X,
  Clock,
  Info,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VOTING_ABI, VOTING_CA } from "../web3/config";
import { getVoteConfigs } from "../web3/readContract";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { agreementService } from "../services/agreementServices";

// Transaction Status Component
const TransactionStatus = ({
  status,
  onRetry,
}: {
  status: "idle" | "pending" | "success" | "error";
  onRetry?: () => void;
}) => {
  if (status === "idle") return null;

  const configs = {
    pending: {
      icon: Loader2,
      text: "Waiting for MetaMask confirmation...",
      className: "text-blue-400",
      iconClassName: "animate-spin",
    },
    success: {
      icon: CheckCircle2,
      text: "Transaction confirmed! Activating dispute...",
      className: "text-green-400",
      iconClassName: "",
    },
    error: {
      icon: AlertCircle,
      text: "Transaction failed",
      className: "text-red-400",
      iconClassName: "",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border p-3 ${config.className} border-current/20 bg-current/5`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.iconClassName}`} />
        <span className="text-sm font-medium">{config.text}</span>
        {status === "error" && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-auto border-current text-current hover:bg-current/10"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default function RejectPendingDisputeModalPage() {
  const { id, votingId } = useParams<{ id: string; votingId: string }>();
  const navigate = useNavigate();
  const networkInfo = useNetworkEnvironment();

  // Use ref to prevent duplicate transaction initiation
  const hasStartedTransaction = useRef(false);

  // Wagmi hooks for smart contract interaction
  const {
    data: hash,
    writeContract,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess: isTransactionSuccess, isError: isTransactionError } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [transactionStep, setTransactionStep] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const startTransaction = useCallback(async () => {
    if (hasStartedTransaction.current || !votingId) {
      console.log(
        "⚠️ Transaction already started or no voting ID, skipping...",
      );
      return;
    }

    console.log("🟡 Starting payment process...");
    hasStartedTransaction.current = true;

    try {
      const contractAddress = VOTING_CA[networkInfo.chainId as number];
      console.log("📝 Contract lookup:", {
        chainId: networkInfo.chainId,
        contractAddress,
        votingId,
      });

      if (!contractAddress) {
        console.error("❌ No contract address found");
        throw new Error(
          `No contract address found for chain ID ${networkInfo.chainId}`,
        );
      }

      // Fetch fee amount from contract
      let feeValue = undefined;
      try {
        const configs = await getVoteConfigs(networkInfo.chainId);
        feeValue = configs?.feeAmount;
        console.log("💰 Fee amount:", feeValue?.toString());
      } catch (error) {
        console.warn(error, "⚠️ Could not fetch fee amount, using default");
      }

      console.log("🎯 Transaction details:", {
        contractAddress,
        functionName: "raiseDispute",
        args: [BigInt(parseInt(votingId)), false],
        value: feeValue?.toString(),
        hasFee: !!feeValue,
      });

      setTransactionStep("pending");

      // This will trigger wallet popup
      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "raiseDispute",
        args: [BigInt(parseInt(votingId)), false],
        value: feeValue,
      });
    } catch (error: any) {
      console.error("❌ Payment initiation error:", error);
      hasStartedTransaction.current = false;
      setTransactionStep("error");
      toast.error("Failed to initiate payment", {
        description: error.message || "Please try again.",
      });
    }
  }, [networkInfo.chainId, votingId, writeContract]);

  // Fetch agreement details
  useEffect(() => {
    const fetchAgreement = async () => {
      if (!id) return;

      try {
        const agreementId = parseInt(id);
        const agreementData =
          await agreementService.getAgreementDetails(agreementId);
        setAgreement(agreementData);
      } catch (error) {
        console.error("Failed to fetch agreement:", error);
        toast.error("Failed to load agreement details");
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, [id]);

  // AUTO-START TRANSACTION WHEN COMPONENT LOADS
  useEffect(() => {
    if (
      transactionStep === "idle" &&
      !hasStartedTransaction.current &&
      votingId &&
      !loading
    ) {
      console.log("🟡 Auto-starting transaction...");
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        startTransaction();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [transactionStep, startTransaction, votingId, loading]);

  // Reset the flag when component unmounts
  useEffect(() => {
    return () => {
      hasStartedTransaction.current = false;
    };
  }, []);

  // Handle transaction errors
  useEffect(() => {
    if (writeError || isTransactionError) {
      console.log("❌ Transaction failed:", writeError || isTransactionError);
      setTransactionStep("error");
      hasStartedTransaction.current = false;

      toast.error("Transaction failed", {
        description: "Smart contract transaction failed. Please try again.",
        duration: 5000,
      });
    }
  }, [writeError, isTransactionError]);

  // Handle transaction success
  useEffect(() => {
    if (isTransactionSuccess && hash) {
      console.log("✅ Transaction successful! Hash:", hash);
      setTransactionStep("success");
      hasStartedTransaction.current = false;

      toast.success("Transaction confirmed!", {
        description: "Dispute payment completed. Dispute is being activated...",
        duration: 3000,
      });

      // Redirect back to agreement page after a short delay
      setTimeout(() => {
        navigate(`/agreements/${id}`);
      }, 2000);
    }
  }, [isTransactionSuccess, hash, navigate, id]);

  const retryTransaction = () => {
    console.log("🔄 Retrying transaction...");
    setTransactionStep("idle");
    hasStartedTransaction.current = false;
    resetWrite();
    startTransaction();
  };

  const handleClose = () => {
    navigate(`/agreements/${id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400" />
          <p className="mt-2 text-white">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
            disabled={
              transactionStep === "pending" || transactionStep === "success"
            }
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Payment Required</h2>
              <p className="text-sm text-yellow-300">
                Complete payment to activate your dispute
              </p>
            </div>
          </div>

          {/* Information */}
          <div className="mb-6 space-y-4">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                <div className="text-sm text-yellow-200">
                  Your dispute has been created but requires payment to be
                  activated. Once payment is confirmed, judges will be notified
                  to review your case.
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <h4 className="mb-2 text-sm font-medium text-purple-300">
                Dispute Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Agreement:</span>
                  <span className="text-white">#{agreement?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Type:</span>
                  <span className="text-white">Delivery Rejection Dispute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200/80">Voting ID:</span>
                  <span className="text-white">{votingId}</span>
                </div>
              </div>
            </div>

            {/* Transaction Status */}
            {transactionStep === "pending" && (
              <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Wallet className="h-5 w-5 animate-pulse text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-200">
                      Waiting for Wallet Confirmation
                    </h4>
                    <p className="mt-1 text-xs text-blue-300/80">
                      Please check your wallet to confirm the transaction.
                    </p>
                    <div className="mt-2 flex items-start gap-1 rounded border border-blue-400/30 bg-blue-500/10 px-2 py-1">
                      <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-blue-400" />
                      <p className="text-xs text-blue-200/90">
                        <span className="font-medium">⚠️Important:</span> Do not
                        close this window or navigate away until the transaction
                        is complete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Status */}
            {transactionStep === "success" && (
              <div className="rounded-lg border border-green-400/20 bg-green-500/10 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  <div>
                    <h4 className="text-sm font-medium text-green-200">
                      Payment Complete!
                    </h4>
                    <p className="mt-1 text-xs text-green-300/80">
                      Transaction confirmed. Dispute is being activated...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Status Display */}
          <div className="mb-6">
            <TransactionStatus
              status={transactionStep}
              onRetry={retryTransaction}
            />
          </div>

          {/* Action buttons - Show retry on error, hide during transaction/success */}
          {transactionStep === "error" && (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20 sm:w-auto"
                onClick={retryTransaction}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
