/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  AlertTriangle,
  X,
  Scale,
  Wallet,
  Info,
  Ban,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VOTING_ABI, VOTING_CA } from "../web3/config";
import { getVoteConfigs } from "../web3/readContract";

const DisputeTypeEnum = {
  ProBono: 1,
  Paid: 2,
} as const;

type DisputeTypeEnumValue =
  (typeof DisputeTypeEnum)[keyof typeof DisputeTypeEnum];

interface RejectDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    claim: string,
    requestKind: DisputeTypeEnumValue,
    chainId?: number,
    votingId?: string,
    transactionHash?: string,
  ) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  isSubmitting: boolean;
  agreement: any;
}

// Transaction Status Component (Reuse from OpenDisputeModal)
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

export default function RejectDeliveryModal({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  isSubmitting,
  agreement,
}: RejectDeliveryModalProps) {
  const [requestKind, setRequestKind] = useState<DisputeTypeEnumValue>(
    DisputeTypeEnum.ProBono,
  );
  const networkInfo = useNetworkEnvironment();
  const { user: currentUser } = useAuth();

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

  // State for transaction status
  const [transactionStep, setTransactionStep] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [isProcessingPaidDispute, setIsProcessingPaidDispute] = useState(false);

  // Generate voting ID
  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  const handleSubmitAfterTransaction = useCallback(
    async (transactionHash: string) => {
      console.log("🔄 [RejectDeliveryModal] Submitting after transaction:", {
        transactionHash,
        votingId: votingIdToUse,
        requestKind:
          requestKind === DisputeTypeEnum.ProBono ? "Pro Bono" : "Paid",
      });

      try {
        await onConfirm(
          claim,
          requestKind,
          networkInfo.chainId,
          votingIdToUse.toString(),
          transactionHash,
        );
      } catch (error) {
        console.error(
          "❌ [RejectDeliveryModal] Submit after transaction error:",
          error,
        );
      }
    },
    [claim, requestKind, networkInfo.chainId, votingIdToUse, onConfirm],
  );

  // Handle transaction status changes
  useEffect(() => {
    if (isWritePending) {
      console.log("⏳ [RejectDeliveryModal] Transaction pending...");
      setTransactionStep("pending");
    } else if (isTransactionSuccess && hash && isProcessingPaidDispute) {
      console.log("✅ [RejectDeliveryModal] Transaction successful!");
      setTransactionStep("success");
      setIsProcessingPaidDispute(false);

      // Call onConfirm with transaction hash
      handleSubmitAfterTransaction(hash);
    } else if (writeError || isTransactionError) {
      console.log("❌ [RejectDeliveryModal] Transaction failed");
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);

      toast.error("Transaction failed", {
        description: "Smart contract transaction failed. Please try again.",
        duration: 5000,
      });
    }
  }, [
    isWritePending,
    isTransactionSuccess,
    writeError,
    isTransactionError,
    isProcessingPaidDispute,
    hash,
    handleSubmitAfterTransaction,
  ]);

  // Smart contract interaction for paid disputes
  const createDisputeOnchain = useCallback(
    async (votingId: number): Promise<void> => {
      console.log(
        "🟡 [RejectDeliveryModal] createDisputeOnchain STARTED with votingId:",
        votingId,
      );

      try {
        const contractAddress = VOTING_CA[networkInfo.chainId as number];
        console.log("📝 [RejectDeliveryModal] Contract lookup:", {
          chainId: networkInfo.chainId,
          contractAddress,
        });

        if (!contractAddress) {
          console.error("❌ [RejectDeliveryModal] No contract address found");
          throw new Error(
            `No contract address found for chain ID ${networkInfo.chainId}`,
          );
        }

        // Fetch fee amount from contract
        let feeValue = undefined;
        try {
          const configs = await getVoteConfigs(networkInfo.chainId);
          feeValue = configs?.feeAmount;
          console.log(
            "💰 [RejectDeliveryModal] Fee amount:",
            feeValue?.toString(),
          );
        } catch (error) {
          console.warn(
            error,
            "⚠️ [RejectDeliveryModal] Could not fetch fee amount, using default",
          );
        }

        console.log("🎯 [RejectDeliveryModal] Transaction details:", {
          contractAddress,
          functionName: "raiseDispute",
          args: [BigInt(votingId), false],
          value: feeValue?.toString(),
          hasFee: !!feeValue,
        });

        console.log("⏳ [RejectDeliveryModal] Calling writeContract...");

        writeContract({
          address: contractAddress,
          abi: VOTING_ABI.abi,
          functionName: "raiseDispute",
          args: [BigInt(votingId), false],
          value: feeValue,
        });

        console.log(
          "✅ [RejectDeliveryModal] writeContract called successfully",
        );
      } catch (error: any) {
        console.error("❌ [RejectDeliveryModal] createDisputeOnchain ERROR:", {
          name: error.name,
          message: error.message,
          code: error.code,
        });

        toast.error("Failed to initiate smart contract transaction", {
          description:
            error.message ||
            "Please check your wallet connection and try again.",
        });

        setTransactionStep("error");
        setIsProcessingPaidDispute(false);
      }
    },
    [networkInfo.chainId, writeContract],
  );

  const handleSubmit = async () => {
    if (!claim.trim()) {
      toast.error("Claim description is required", {
        description: "Please provide a reason for rejecting the delivery.",
        duration: 3000,
      });
      return;
    }

    console.log("🚀 [RejectDeliveryModal] Starting rejection flow:", {
      claim: claim.trim(),
      requestKind:
        requestKind === DisputeTypeEnum.ProBono ? "Pro Bono" : "Paid",
      chainId: networkInfo.chainId,
      votingId: votingIdToUse,
    });

    if (requestKind === DisputeTypeEnum.Paid) {
      // For paid disputes: Create dispute first, then show payment modal
      try {
        // This will create the dispute with "Pending Payment" status
        await onConfirm(
          claim,
          requestKind,
          networkInfo.chainId,
          votingIdToUse.toString(),
          // NO transaction hash yet
        );

        // The modal will close and RejectPendingDisputeModal will open
        // Payment will happen in the RejectPendingDisputeModal
      } catch (error) {
        console.error(
          "❌ [RejectDeliveryModal] Failed to create dispute:",
          error,
        );
      }
    } else {
      // For pro bono disputes: submit directly
      try {
        await onConfirm(
          claim,
          requestKind,
          networkInfo.chainId,
          votingIdToUse.toString(),
        );
      } catch (error) {
        console.error("❌ [RejectDeliveryModal] Pro Bono submit error:", error);
      }
    }
  };

  const retryTransaction = () => {
    setTransactionStep("idle");
    resetWrite();
    if (requestKind === DisputeTypeEnum.Paid) {
      createDisputeOnchain(votingIdToUse);
    }
  };

  // Determine the other party as defendant
  const getDefendant = () => {
    if (!agreement || !currentUser) return "Unknown";

    // Helper function to check if current user is first party
    const isCurrentUserFirstParty = (agreement: any, currentUser: any) => {
      if (!agreement || !currentUser) return false;
      const currentUsername = currentUser?.username;
      if (!currentUsername) return false;
      const firstPartyUsername = agreement.firstParty?.username;
      if (!firstPartyUsername || firstPartyUsername === "Unknown") return false;
      return (
        currentUsername.replace(/^@/, "").toLowerCase().trim() ===
        firstPartyUsername.replace(/^@/, "").toLowerCase().trim()
      );
    };

    const isFirstParty = isCurrentUserFirstParty(agreement._raw, currentUser);
    return isFirstParty ? agreement.counterparty : agreement.createdBy;
  };

  const defendant = getDefendant();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl sm:max-w-[40rem]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          disabled={
            isSubmitting ||
            transactionStep === "pending" ||
            isProcessingPaidDispute
          }
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
              Reject Delivery & Open Dispute
            </h2>
            <p className="text-sm text-red-300">
              This will create a dispute with the other party
            </p>
          </div>
        </div>

        {/* Dispute Type Selection */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-purple-300">
            Dispute Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-4 text-center transition ${
                requestKind === DisputeTypeEnum.ProBono
                  ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
              } ${
                isSubmitting ||
                transactionStep === "pending" ||
                isProcessingPaidDispute
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="disputeType"
                className="hidden"
                checked={requestKind === DisputeTypeEnum.ProBono}
                onChange={() => {
                  console.log("📝 [RejectDeliveryModal] Selected Pro Bono");
                  setRequestKind(DisputeTypeEnum.ProBono);
                }}
                disabled={
                  isSubmitting ||
                  transactionStep === "pending" ||
                  isProcessingPaidDispute
                }
              />
              <Scale className="h-5 w-5" />
              <div>
                <div className="font-medium">Pro Bono</div>
                <div className="text-xs opacity-80">
                  Free dispute resolution
                </div>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-4 text-center transition ${
                requestKind === DisputeTypeEnum.Paid
                  ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
              } ${
                isSubmitting ||
                transactionStep === "pending" ||
                isProcessingPaidDispute
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="disputeType"
                className="hidden"
                checked={requestKind === DisputeTypeEnum.Paid}
                onChange={() => {
                  console.log("📝 [RejectDeliveryModal] Selected Paid");
                  setRequestKind(DisputeTypeEnum.Paid);
                }}
                disabled={
                  isSubmitting ||
                  transactionStep === "pending" ||
                  isProcessingPaidDispute
                }
              />
              <Wallet className="h-5 w-5" />
              <div>
                <div className="font-medium">Paid</div>
                <div className="text-xs opacity-80">Priority resolution</div>
              </div>
            </label>
          </div>

          {/* Dispute Type Info */}
          <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
              <div className="text-xs text-cyan-200">
                {requestKind === DisputeTypeEnum.ProBono ? (
                  <span>
                    <span className="font-medium">Pro Bono:</span> No fee
                    required. Judges will handle your case when available. May
                    have longer wait times.
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">Paid:</span> A fee is required
                    to initiate your dispute. This fee helps prioritize your
                    case and notifies all judges to begin reviewing it
                    immediately.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Contract Info for Paid Disputes */}
        {requestKind === DisputeTypeEnum.Paid &&
          transactionStep === "idle" &&
          !isSubmitting && (
            <div className="mb-6 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-300" />
                <h4 className="text-sm font-medium text-emerald-200">
                  Smart Contract Transaction Required
                </h4>
              </div>
              <p className="mt-2 text-xs text-emerald-300/80">
                For paid disputes, you'll need to confirm a transaction in your
                wallet to record the dispute on-chain.
              </p>
            </div>
          )}

        {/* Dispute Info Summary */}
        <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
          <h4 className="mb-2 text-sm font-medium text-purple-300">
            Dispute Summary
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-200/80">Defendant:</span>
              <span className="text-white">{defendant}</span>
            </div>
          </div>
        </div>

        {/* Claim input */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-muted-foreground text-sm">
              Claim <span className="text-red-500">*</span>
            </label>
            <div className="group relative cursor-help">
              <Info className="h-4 w-4 text-cyan-300" />
              <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                Make sure it's reasonable, as that might help your case when the
                judges look into it.
              </div>
            </div>
          </div>
          <textarea
            value={claim}
            onChange={(e) => {
              setClaim(e.target.value);
            }}
            placeholder="Describe why you're rejecting this delivery (optional)"
            className="h-32 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            disabled={
              isSubmitting ||
              transactionStep === "pending" ||
              isProcessingPaidDispute
            }
            required
          />

          <p className="mt-1 text-xs text-gray-400">
            You can add more details and evidence on the dispute page.
          </p>
        </div>

        {/* Log Preview */}
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
            <div className="text-xs">
              <p className="font-medium text-yellow-300">What will happen:</p>
              <ul className="mt-1 space-y-1 text-yellow-200/80">
                <li>• Dispute will be created with {defendant}</li>
                <li>
                  • Type:{" "}
                  {requestKind === DisputeTypeEnum.ProBono
                    ? "Pro Bono"
                    : "Paid"}
                </li>
                {requestKind === DisputeTypeEnum.Paid && (
                  <li>• Smart contract transaction required</li>
                )}
                <p>You can add evidences, witnesses in the Dispute page</p>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 sm:w-auto"
            disabled={
              isSubmitting ||
              transactionStep === "pending" ||
              isProcessingPaidDispute
            }
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className={`w-full py-2 sm:w-auto ${
              requestKind === DisputeTypeEnum.Paid
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20"
            }`}
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              transactionStep === "pending" ||
              isProcessingPaidDispute
            }
          >
            {transactionStep === "pending" || isProcessingPaidDispute ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {requestKind === DisputeTypeEnum.Paid
                  ? "Confirm in Wallet..."
                  : "Creating Dispute..."}
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Reject &{" "}
                {requestKind === DisputeTypeEnum.Paid ? "Pay for " : ""}Open
                Dispute
              </>
            )}
          </Button>
        </div>
        {/* Transaction Status Display */}
        {transactionStep !== "idle" && (
          <div className="my-4">
            <TransactionStatus
              status={transactionStep}
              onRetry={retryTransaction}
            />
          </div>
        )}
      </div>
    </div>
  );
}
