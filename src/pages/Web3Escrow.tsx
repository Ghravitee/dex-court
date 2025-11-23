import { useCallback, useEffect, useMemo, useState } from "react";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useChainId,
  useContractReads,
} from "wagmi";
import { parseEther, formatEther, parseUnits } from "viem";
import { ESCROW_ABI, ESCROW_CA, ERC20_ABI, ZERO_ADDRESS } from "../web3/config";
import { MilestoneTableRow } from "../web3/MilestoneTableRow";
import { formatAmount } from "../web3/helper";
import {
  FileText,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Lock,
  Upload,
  UserCheck,
  X,
  Package,
  PackageCheck,
  Ban,
  Info,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";

function isValidAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// In your main component, update the MilestoneData interface:
interface MilestoneData {
  percentBP: bigint;
  unlockAt: bigint;
  heldByRecipient: boolean;
  claimed: boolean;
  amount: bigint;
}

interface LoadingStates {
  createAgreement: boolean;
  signAgreement: boolean;
  depositFunds: boolean;
  submitDelivery: boolean;
  approveDelivery: boolean;
  rejectDelivery: boolean;
  cancelOrder: boolean;
  approveCancellation: boolean;
  partialRelease: boolean;
  finalRelease: boolean;
  cancellationTimeout: boolean;
  claimMilestone: boolean;
  setMilestoneHold: boolean;
  raiseDispute: boolean;
  loadAgreement: boolean;
}

// Add CountdownTimer component
// Replace the existing CountdownTimer component with this improved version
function CountdownTimer({
  targetTimestamp,
  onComplete,
}: {
  targetTimestamp: bigint;
  onComplete?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const target = Number(targetTimestamp);
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        onComplete?.();
        return;
      }

      // Convert to appropriate time units
      const days = Math.floor(difference / (60 * 60 * 24));
      const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((difference % (60 * 60)) / 60);
      const seconds = difference % 60;

      // Format based on the time remaining
      if (days > 0) {
        // Show days + hours for periods longer than a day
        setTimeLeft(
          `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`,
        );
      } else if (hours > 0) {
        // Show hours + minutes for periods less than a day but more than an hour
        setTimeLeft(
          `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`,
        );
      } else if (minutes > 0) {
        // Show minutes + seconds for periods less than an hour
        setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
      } else {
        // Show only seconds for very short periods
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp, onComplete]);

  return (
    <span
      className={`font-mono ${timeLeft === "Expired" ? "text-green-400" : "text-yellow-400"}`}
    >
      {timeLeft}
    </span>
  );
}

function formatSecondsToDetailed(seconds: bigint): string {
  const totalSeconds = Number(seconds);

  if (totalSeconds <= 0) return "0s";

  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const remainingSeconds = totalSeconds % 60;

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0)
    parts.push(`${remainingSeconds}s`);

  return parts.join(" ");
}

function Web3Escrow() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState("create");
  const [agreementId, setAgreementId] = useState("");
  const [depositState, setDepositState] = useState({
    isApprovingToken: false,
    approvalHash: null,
    needsApproval: false,
  });
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [createApprovalState, setCreateApprovalState] = useState({
    isApprovingToken: false,
    needsApproval: false,
  });
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState(
    BigInt(Math.floor(Date.now() / 1000)),
  );

  const [disputeForm, setDisputeForm] = useState({
    votingId: "",
    plaintiffIsServiceRecipient: true,
    proBono: false,
    feeAmount: "",
  });

  // Create Agreement Form
  const [createForm, setCreateForm] = useState({
    agreementId: "",
    serviceProvider: "",
    serviceRecipient: "",
    token: ZERO_ADDRESS,
    amount: "",
    deadlineDuration: "604800",
    privateMode: false,
    vestingMode: false,
    milestonePercs: ["50", "50"], // Default: 50%, 50%
    milestoneOffsets: ["0", "302400"], // Default: immediate, 3.5 days
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    createAgreement: false,
    signAgreement: false,
    depositFunds: false,
    submitDelivery: false,
    approveDelivery: false,
    rejectDelivery: false,
    cancelOrder: false,
    approveCancellation: false,
    partialRelease: false,
    finalRelease: false,
    cancellationTimeout: false,
    claimMilestone: false,
    setMilestoneHold: false,
    raiseDispute: false,
    loadAgreement: false,
  });

  // Helper function to set loading states
  const setLoading = (action: keyof LoadingStates, isLoading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [action]: isLoading,
    }));
  };

  // Reset all loading states
  const resetAllLoading = () => {
    setLoadingStates({
      createAgreement: false,
      signAgreement: false,
      depositFunds: false,
      submitDelivery: false,
      approveDelivery: false,
      rejectDelivery: false,
      cancelOrder: false,
      approveCancellation: false,
      partialRelease: false,
      finalRelease: false,
      cancellationTimeout: false,
      claimMilestone: false,
      setMilestoneHold: false,
      raiseDispute: false,
      loadAgreement: false,
    });
  };

  // Enhanced dispute handler with modal
  const openDisputeModal = () => {
    const votingId = Math.floor(Math.random() * 1000000).toString();
    const newDisputeForm = {
      votingId: votingId,
      plaintiffIsServiceRecipient: isServiceRecipient as boolean,
      proBono: true,
      feeAmount: "0.01", // Default fee
    };

    setDisputeForm(newDisputeForm);
    setShowDisputeModal(true);
  };

  // View Agreement
  const [viewId, setViewId] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  const [milestones, setMilestones] = useState<MilestoneData[]>([]);

  const contractAddress = ESCROW_CA[chainId as number];

  // Update current time every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(BigInt(Math.floor(Date.now() / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Write Contract Hook
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read Stats
  const { data: stats, refetch: refetchStats } = useReadContract({
    address: contractAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getStats",
  });

  // Read Agreement (used for both view & manage)
  const { data: agreement, refetch: refetchAgreement } = useReadContract({
    address: contractAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getAgreement",
    args: viewId ? [BigInt(viewId)] : undefined,
    query: { enabled: !!viewId },
  });

  // Approval hooks for ERC20
  const {
    data: approvalHash,
    writeContract: writeApproval,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract();

  const { isSuccess: approvalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Token decimals for create form
  const { data: createTokenDecimals } = useReadContract({
    address:
      createForm.token !== ZERO_ADDRESS
        ? (createForm.token as `0x${string}`)
        : undefined,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
    query: {
      enabled:
        createForm.token !== ZERO_ADDRESS && isValidAddress(createForm.token),
    },
  });

  // Token decimals for manage tab
  const { data: manageTokenDecimals } = useReadContract({
    address:
      agreement && agreement[4] !== ZERO_ADDRESS
        ? (agreement[4] as `0x${string}`)
        : undefined,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
    query: {
      enabled: !!agreement && agreement[4] !== ZERO_ADDRESS,
    },
  });

  const { data: manageTokenSymbol } = useReadContract({
    address:
      agreement && agreement[4] !== ZERO_ADDRESS
        ? (agreement[4] as `0x${string}`)
        : undefined,
    abi: ERC20_ABI.abi,
    functionName: "symbol",
    query: {
      enabled: !!agreement && agreement[4] !== ZERO_ADDRESS,
    },
  });

  // convert a user percent string like "50" or "12.5" -> basis points as number (e.g. 50 -> 5000)
  const percentToBP = (s: string): number => {
    const n = Number(s);
    if (Number.isNaN(n)) return 0;
    // multiply by 100 to get basis points (100% -> 10000)
    // use Math.round to handle decimals safely (e.g. 12.345 -> 1235 bp)
    return Math.round(n * 100);
  };

  // derived roles when agreement is loaded
  const isLoadedAgreement = !!agreement;
  const isServiceProvider =
    isLoadedAgreement &&
    address &&
    agreement &&
    address.toLowerCase() === agreement[2].toString().toLowerCase();
  const isServiceRecipient =
    isLoadedAgreement &&
    address &&
    agreement &&
    address.toLowerCase() === agreement[3].toString().toLowerCase();
  const now = currentTime;

  // helper to reset messages
  const resetMessages = () => {
    setUiError(null);
    setUiSuccess(null);
  };

  // Safe getters for agreement fields
  const getField = useCallback(
    (idx: number): unknown => {
      if (!agreement) return undefined;
      if (agreement.length <= idx) return undefined;
      return agreement[idx];
    },
    [agreement],
  );

  const getBigIntField = useCallback(
    (idx: number): bigint => {
      const v = getField(idx);
      if (v === undefined || v === null) return 0n;
      try {
        // handle both BigInt and numeric strings
        if (typeof v === "bigint") return v;
        if (typeof v === "string") return BigInt(v);
        // some libs return objects with toString
        return BigInt(v.toString());
      } catch {
        return 0n;
      }
    },
    [getField],
  );

  const getBoolField = useCallback(
    (idx: number): boolean => {
      const v = getField(idx);
      return !!v;
    },
    [getField],
  );

  // Fetch milestone count - enable when viewId exists and vesting is enabled
  const {
    data: milestoneCount,
    refetch: refetchMilestoneCount,
    // error: milestoneCountError
  } = useReadContract({
    address: contractAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getMilestoneCount",
    args: viewId ? [BigInt(viewId)] : undefined,
    query: {
      enabled: !!viewId && getBoolField(24),
    },
  });

  // Create contracts array for milestones ONLY when we have a valid count
  const contractsForMilestones = useMemo(() => {
    if (!milestoneCount || !viewId || !getBoolField(24)) {
      return [];
    }

    const count = Number(milestoneCount);
    if (count === 0) return [];

    console.log(
      `Creating ${count} milestone contracts, trigger: ${refetchTrigger}`,
    );

    return Array.from({ length: count }, (_, i) => ({
      address: contractAddress as `0x${string}`,
      abi: ESCROW_ABI.abi,
      functionName: "getMilestone" as const,
      args: [BigInt(viewId), BigInt(i)],
    }));
  }, [milestoneCount, viewId, getBoolField, refetchTrigger, contractAddress]);

  // Fetch all milestones
  const {
    data: rawMilestonesData,
    refetch: refetchMilestonesData,
    // error: milestonesError
  } = useContractReads({
    contracts: contractsForMilestones,
    query: {
      enabled: contractsForMilestones.length > 0,
    },
  });

  // helper to safely convert various on-chain shapes to bigint
  const toBigIntSafe = (v: unknown): bigint => {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(Math.floor(v));
    if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
    // some libs return objects with toString()
    if (
      v &&
      typeof (v as { toString?: () => string }).toString === "function"
    ) {
      const s = (v as { toString: () => string }).toString();
      if (/^\d+$/.test(s)) return BigInt(s);
    }
    return 0n;
  };

  const triggerMilestoneRefetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!rawMilestonesData || !Array.isArray(rawMilestonesData)) {
      setMilestones([]);
      return;
    }

    try {
      const mapped = rawMilestonesData
        .filter((item) => item.status === "success" && item.result)
        .map((item): MilestoneData | null => {
          const r = item.result;

          if (Array.isArray(r)) {
            const percentBP = toBigIntSafe(r[0]);
            const unlockAt = toBigIntSafe(r[1]);
            const heldByRecipient = !!r[2];
            const claimed = !!r[3];
            const amount = toBigIntSafe(r[4]);

            return { percentBP, unlockAt, heldByRecipient, claimed, amount };
          }

          // Handle object format if needed
          if (typeof r === "object") {
            const obj = r as unknown as Record<string, unknown>;
            const percentBP = toBigIntSafe(obj.percentBP ?? obj["0"]);
            const unlockAt = toBigIntSafe(obj.unlockAt ?? obj["1"]);
            const heldByRecipient = !!(obj.heldByRecipient ?? obj["2"]);
            const claimed = !!(obj.claimed ?? obj["3"]);
            const amount = toBigIntSafe(obj.amount ?? obj["4"]);
            return { percentBP, unlockAt, heldByRecipient, claimed, amount };
          }

          return null;
        })
        .filter(Boolean) as MilestoneData[];

      setMilestones(mapped);
    } catch (err) {
      console.error("Error mapping milestones:", err);
      setMilestones([]);
    }
  }, [rawMilestonesData]);

  // Helper function to parse amount with correct decimals
  const parseAmount = (
    amount: string,
    tokenAddress: string,
    decimals?: number,
  ) => {
    const tokenIsETH = tokenAddress === ZERO_ADDRESS;
    if (tokenIsETH) {
      return parseEther(amount);
    } else {
      // Default to 18 if decimals not available, but this should be handled by the decimals fetch
      const actualDecimals = decimals || 18;
      return parseUnits(amount, actualDecimals);
    }
  };

  // ===================== VALIDATED ACTIONS ===================== //
  const handleCreateAgreement = async () => {
    resetMessages();
    setLoading("createAgreement", true);
    try {
      if (!isConnected) return setUiError("Connect your wallet");
      if (!createForm.agreementId)
        return setUiError("Agreement ID is required");
      if (!isValidAddress(createForm.serviceProvider))
        return setUiError("Invalid service provider address");
      if (!isValidAddress(createForm.serviceRecipient))
        return setUiError("Invalid service recipient address");
      if (
        createForm.serviceProvider.toLowerCase() ===
        createForm.serviceRecipient.toLowerCase()
      )
        return setUiError(
          "serviceProvider and serviceRecipient cannot be the same",
        );

      if (!createForm.amount || Number(createForm.amount) <= 0)
        return setUiError("Amount must be greater than 0");

      const tokenIsETH = createForm.token === ZERO_ADDRESS;
      const callerIsServiceRecipient =
        address &&
        address.toLowerCase() === createForm.serviceRecipient.toLowerCase();

      if (!tokenIsETH && !isValidAddress(createForm.token))
        return setUiError("Invalid token address");

      let value: bigint = 0n;
      try {
        value = parseAmount(
          createForm.amount,
          createForm.token,
          createTokenDecimals as unknown as number,
        );
        if (value <= 0n) return setUiError("Parsed amount is zero or invalid");
      } catch (err) {
        setUiError("Invalid amount format");
        console.error("parseAmount error", err);
        return;
      }

      if (createForm.vestingMode) {
        if (
          createForm.milestonePercs.length === 0 ||
          createForm.milestoneOffsets.length === 0
        ) {
          return setUiError(
            "Milestone percentages and offsets are required for vesting mode",
          );
        }
        if (
          createForm.milestonePercs.length !==
          createForm.milestoneOffsets.length
        ) {
          return setUiError(
            "Milestone percentages and offsets arrays must have the same length",
          );
        }

        const deadlineNum = Number(createForm.deadlineDuration);
        if (!Number.isFinite(deadlineNum) || deadlineNum <= 0) {
          return setUiError(
            "Deadline must be a positive number (seconds) for vesting",
          );
        }

        // validate each offset is numeric, >= 0 and <= deadlineDuration
        for (let idx = 0; idx < createForm.milestoneOffsets.length; idx++) {
          const offStr = createForm.milestoneOffsets[idx];
          const offNum = Number(offStr);
          if (!Number.isFinite(offNum) || offNum < 0) {
            return setUiError(`Milestone offset #${idx} is invalid`);
          }
          if (offNum > deadlineNum) {
            return setUiError(
              `Milestone offset #${idx} (${offNum}s) cannot be greater than deadline (${deadlineNum}s)`,
            );
          }
        }

        const totalBP = createForm.milestonePercs.reduce(
          (sum, perc) => sum + percentToBP(perc),
          0,
        );
        if (totalBP !== 10000) {
          return setUiError(
            "Total milestone percentages must equal 100 (sum of percentages)",
          );
          // UI shows perc values, but we enforce 10000 bp under the hood
        }
      }

      if (!tokenIsETH && callerIsServiceRecipient) {
        setCreateApprovalState((prev) => ({
          ...prev,
          needsApproval: true,
          isApprovingToken: true,
        }));
        setUiSuccess("Approving tokens for contract...");

        writeApproval({
          address: createForm.token as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: "approve",
          args: [contractAddress as `0x${string}`, value],
        });
        return;
      }

      const shouldSendETH = tokenIsETH && callerIsServiceRecipient;

      const milestonePercsBigInt = createForm.milestonePercs.map((perc) =>
        BigInt(percentToBP(perc)),
      );
      const milestoneOffsetsBigInt = createForm.milestoneOffsets.map((offset) =>
        BigInt(offset),
      );

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "createAgreement",
        args: [
          BigInt(createForm.agreementId),
          createForm.serviceProvider as `0x${string}`,
          createForm.serviceRecipient as `0x${string}`,
          createForm.token as `0x${string}`,
          BigInt(value),
          BigInt(createForm.deadlineDuration),
          createForm.vestingMode,
          createForm.privateMode,
          milestonePercsBigInt,
          milestoneOffsetsBigInt,
        ],
        value: shouldSendETH ? value : BigInt(0),
      });

      setUiSuccess("Transaction submitted — check your wallet");
    } catch (error: unknown) {
      setLoading("createAgreement", false);
      setUiError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Error creating agreement",
      );
      console.error("Error creating agreement:", error);
    }
  };

  const addMilestone = () => {
    setCreateForm((prev) => ({
      ...prev,
      milestonePercs: [...prev.milestonePercs, "0"],
      milestoneOffsets: [...prev.milestoneOffsets, "0"],
    }));
  };

  // Remove milestone input row
  const removeMilestone = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      milestonePercs: prev.milestonePercs.filter((_, i) => i !== index),
      milestoneOffsets: prev.milestoneOffsets.filter((_, i) => i !== index),
    }));
  };

  // Update milestone value
  const updateMilestone = (
    index: number,
    field: "percs" | "offsets",
    value: string,
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      [`milestone${field === "percs" ? "Percs" : "Offsets"}`]: prev[
        `milestone${field === "percs" ? "Percs" : "Offsets"}`
      ].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleClaimMilestone = async (index: number) => {
    resetMessages();
    setLoading("claimMilestone", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider)
        return setUiError("Only serviceProvider can claim milestones");
      if (!getBoolField(24))
        return setUiError("Agreement is not in vesting mode");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (!getBoolField(15))
        return setUiError("Agreement not signed completely");
      if (getBoolField(21)) return setUiError("The agreement is frozen");

      if (now > getBigIntField(10) && !getBoolField(18))
        return setUiError("Can not claim after cancellation expired");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "claimMilestone",
        args: [BigInt(viewId), BigInt(index)],
      });
      setUiSuccess("Claim milestone transaction submitted");
    } catch (error) {
      setLoading("claimMilestone", false);
      setUiError("Error claiming milestone");
      console.error("Error claiming milestone:", error);
    }
  };

  const handleSetMilestoneHold = async (index: number, hold: boolean) => {
    console.log("handleSetMilestoneHold called with:", {
      index,
      hold,
      agreementId,
      viewId,
      address,
    });

    resetMessages();
    setLoading("setMilestoneHold", true);
    try {
      if (!viewId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceRecipient)
        return setUiError("Only serviceRecipient can set milestone hold");
      if (!getBoolField(24))
        return setUiError("Agreement is not in vesting mode");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (!getBoolField(15))
        return setUiError("Agreement not signed completely");
      if (getBoolField(21)) return setUiError("The agreement is frozen");
      if (!milestoneCount) return setUiError("Milestone count not loaded");
      if (index >= Number(milestoneCount))
        return setUiError("Invalid milestone index");

      // Check if milestone is already claimed
      if (milestones[index]?.claimed)
        return setUiError("Milestone already claimed");

      console.log(
        `Calling setMilestoneHold for agreement ${viewId}, milestone ${index}, hold: ${hold}`,
      );

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "setMilestoneHold",
        args: [BigInt(viewId), BigInt(index), hold],
      });

      setUiSuccess(
        `Milestone ${hold ? "held" : "unheld"} transaction submitted`,
      );
      triggerMilestoneRefetch();
    } catch (error: unknown) {
      setLoading("setMilestoneHold", false);
      const msg = error instanceof Error ? error.message : String(error);
      setUiError(`Failed to set milestone hold: ${msg}`);
      console.error("handleSetMilestoneHold error:", error);
    }
  };

  const handleLoadAgreementForManage = async () => {
    resetMessages();
    setLoading("loadAgreement", true);
    try {
      if (!agreementId) {
        setLoading("loadAgreement", false);
        return setUiError("Enter an agreement id to load");
      }
      setViewId(agreementId);
      await refetchAgreement();
      setUiSuccess("Agreement loaded");
      setLoading("loadAgreement", false);
    } catch (err) {
      setLoading("loadAgreement", false);
      setUiError("Unable to load agreement");
      console.error(err);
      return;
    }
  };

  const handleSignAgreement = () => {
    resetMessages();
    setLoading("signAgreement", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can sign");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (getBoolField(15) && !getBoolField(18))
        return setUiError("Agreement already signed");
      if (isServiceProvider && getBoolField(16) && !getBoolField(18))
        return setUiError("You already signed the Agreement");
      if (isServiceRecipient && getBoolField(17) && !getBoolField(18))
        return setUiError("You already signed the Agreement");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "signAgreement",
        args: [BigInt(agreementId)],
      });
      setUiSuccess("Sign transaction submitted");
    } catch (error) {
      setLoading("signAgreement", false);
      setUiError("Error signing agreement");
      console.error("Error signing agreement:", error);
    }
  };

  const handleSubmitDelivery = () => {
    resetMessages();
    setLoading("submitDelivery", true);
    try {
      // ... existing validation logic
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !getBoolField(18))
        return setUiError("Only serviceProvider can submit delivery");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (!getBoolField(15)) return setUiError("Agreement not signed");
      if (getBigIntField(10) !== 0n && !getBoolField(22) && !getBoolField(18))
        return setUiError("Submission is pending already");
      if (getBoolField(22)) return setUiError("Cancellation requested");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "submitDelivery",
        args: [BigInt(agreementId)],
      });
      setUiSuccess("Submit delivery transaction sent");
    } catch (error) {
      setLoading("submitDelivery", false);
      setUiError("Error submitting delivery");
      console.error("Error submitting delivery:", error);
    }
  };

  const handleApproveDelivery = (final: boolean) => {
    resetMessages();
    if (final) {
      setLoading("approveDelivery", true);
    } else {
      setLoading("rejectDelivery", true);
    }
    try {
      // ... existing validation logic
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceRecipient && final)
        return setUiError("Only serviceRecipient can approve delivery");
      if (!isServiceRecipient && !final)
        return setUiError("Only serviceRecipient can reject delivery");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (!getBoolField(15)) return setUiError("Agreement not signed");
      if (getBigIntField(10) === 0n && final)
        return setUiError("There are no pending delivery to approve");
      if (getBigIntField(10) === 0n && !final)
        return setUiError("There are no pending delivery to reject");
      if (getBoolField(22)) return setUiError("Cancellation requested");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "approveDelivery",
        args: [BigInt(agreementId), final],
      });
      setUiSuccess(final ? "Approval submitted" : "Rejection submitted");
    } catch (error) {
      if (final) {
        setLoading("approveDelivery", false);
      } else {
        setLoading("rejectDelivery", false);
      }
      setUiError("Error processing delivery approval");
      console.error("Error processing delivery approval:", error);
    }
  };

  const handleDepositFunds = async () => {
    resetMessages();
    setLoading("depositFunds", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can deposit funds");
      if (getBoolField(14) && !getBoolField(18))
        return setUiError("Agreement is funded already");
      if (getBoolField(18)) return setUiError("Agreement is already completed");
      if (getBoolField(21)) return setUiError("Agreement is frozen already");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");

      const isERC20 = getField(4) !== ZERO_ADDRESS;

      if (isERC20) {
        const amount = getBigIntField(5);
        if (amount <= 0n) return setUiError("Invalid deposit amount");

        setDepositState((prev) => ({
          ...prev,
          needsApproval: true,
          isApprovingToken: true,
        }));
        setUiSuccess("Approving token for deposit...");

        writeApproval({
          address: getField(4) as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: "approve",
          args: [contractAddress as `0x${string}`, amount],
        });
      } else {
        depositDirectly();
      }
    } catch (error) {
      setLoading("depositFunds", false);
      setUiError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Error preparing deposit",
      );
      console.error("Error in handleDepositFunds:", error);
    }
  };

  const depositDirectly = useCallback(() => {
    try {
      if (!agreement) return setUiError("Agreement not loaded");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");

      const amount = getBigIntField(5);
      const isERC20 = getField(4) !== ZERO_ADDRESS;

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "depositFunds",
        args: [BigInt(agreementId)],
        value: isERC20 ? BigInt(0) : amount,
      });

      setUiSuccess("Deposit transaction submitted");
      setDepositState((prev) => ({
        ...prev,
        needsApproval: false,
        isApprovingToken: false,
      }));
    } catch (error) {
      setUiError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Error submitting deposit",
      );
      console.error("Error depositing funds:", error);
    }
  }, [
    agreement,
    agreementId,
    contractAddress,
    getBigIntField,
    getBoolField,
    getField,
    writeContract,
  ]);

  const handleApproveCancellation = (final: boolean) => {
    resetMessages();
    setLoading("approveCancellation", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can cancel the order");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (!getBoolField(15)) return setUiError("Agreement not signed");
      if (getBigIntField(10) === 0n && final)
        return setUiError("There are no pending order cancellation to approve");
      if (getBigIntField(10) === 0n && !final)
        return setUiError("There are no pending order cancellation to reject");
      if (!getBoolField(22) && !getBoolField(18))
        return setUiError("No Cancellation requested");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");

      if (now > getBigIntField(10) && !getBoolField(18))
        return setUiError("24 hour Grace period not yet ended");

      const initiator = getField(12);
      if (
        initiator &&
        address &&
        address.toLowerCase() === initiator.toString().toLowerCase() &&
        final
      )
        return setUiError("You can't approve your own cancellation request");
      if (
        initiator &&
        address &&
        address.toLowerCase() === initiator.toString().toLowerCase() &&
        !final
      )
        return setUiError("You can't reject your own cancellation request");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "approveCancellation",
        args: [BigInt(agreementId), final],
      });
      setUiSuccess(
        final
          ? "Cancellation approval submitted"
          : "Cancellation rejection submitted",
      );
    } catch (error) {
      setLoading("approveCancellation", false);
      setUiError("Error processing cancellation");
      console.error("Error processing cancellation:", error);
    }
  };

  const handleCancelOrder = () => {
    resetMessages();
    setLoading("cancelOrder", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can cancel the order");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (!getBoolField(15)) return setUiError("Agreement not signed");
      if (getBigIntField(10) !== 0n && !getBoolField(22) && !getBoolField(18))
        return setUiError("Submission is pending");
      if (getBoolField(22)) return setUiError("Cancellation requested Already");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "cancelOrder",
        args: [BigInt(agreementId)],
      });
      setUiSuccess("Cancel transaction submitted");
    } catch (error) {
      setLoading("cancelOrder", false);
      setUiError("Error cancelling order");
      console.error("Error cancelling order:", error);
    }
  };

  const handlePartialRelease = () => {
    resetMessages();
    setLoading("partialRelease", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (getBigIntField(10) === 0n)
        return setUiError("No approved delivery yet");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (getBoolField(22)) return setUiError("Cancellation is in process");
      if (getBoolField(24))
        return setUiError("You cannot release partial funds on Vesting");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");

      if (now < getBigIntField(10) && !getBoolField(18))
        return setUiError("24 hours Grace period not yet ended");

      const remaining = getBigIntField(6);
      if (remaining / 2n === 0n)
        return setUiError("Not enough funds to partial release");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "partialAutoRelease",
        args: [BigInt(agreementId)],
      });
      setUiSuccess("Partial release tx submitted");
    } catch (error) {
      setLoading("partialRelease", false);
      setUiError("Error processing partial release");
      console.error("Error processing partial release:", error);
    }
  };

  const handleCancellationTImeout = () => {
    resetMessages();
    setLoading("cancellationTimeout", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (getBigIntField(10) === 0n)
        return setUiError("No approved delivery yet");
      if (now < getBigIntField(10) && !getBoolField(18))
        return setUiError("24 hours Grace period not yet ended");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (!getBoolField(22) && !getBoolField(18))
        return setUiError("There is not pending cancellation");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "enforceCancellationTimeout",
        args: [BigInt(agreementId)],
      });
      setUiSuccess("enforceCancellationTimeout tx submitted");
    } catch (error) {
      setLoading("cancellationTimeout", false);
      setUiError("Error processing cancellation timeout");
      console.error("Error processing cancellation timeout:", error);
    }
  };

  const handleFinalRelease = () => {
    resetMessages();
    setLoading("finalRelease", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (getBigIntField(11) === 0n && !getBoolField(18))
        return setUiError("48 hours grace period has not started");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (getBoolField(24))
        return setUiError("You cannot release full funds on vesting");
      if (getBigIntField(6) === 0n && !getBoolField(18))
        return setUiError("Not enough funds to release");
      if (now < getBigIntField(11) && !getBoolField(18))
        return setUiError("48 hours Grace period not yet ended");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "finalAutoRelease",
        args: [BigInt(agreementId)],
      });
      setUiSuccess("Final release tx submitted");
    } catch (error) {
      setLoading("finalRelease", false);
      setUiError("Error processing final release");
      console.error("Error processing final release:", error);
    }
  };

  const handleRaiseDisputeWithModal = async () => {
    resetMessages();
    setLoading("raiseDispute", true);
    try {
      if (!agreementId) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can raise a dispute");
      if (!getBoolField(14)) return setUiError("Agreement not funded");
      if (!getBoolField(15)) return setUiError("Agreement not signed");
      if (getBoolField(18)) return setUiError("The agreement is completed");
      if (getBoolField(21)) return setUiError("The agreement is frozen");
      if (getBoolField(19))
        return setUiError("The agreement is already in dispute");

      // Validate dispute form
      if (!disputeForm.votingId) return setUiError("Voting ID is required");

      const votingId = BigInt(disputeForm.votingId);

      let feeAmount = 0n;
      if (!disputeForm.proBono) {
        if (!disputeForm.feeAmount || Number(disputeForm.feeAmount) <= 0)
          return setUiError("Fee amount is required when not pro bono");

        try {
          feeAmount = parseEther(disputeForm.feeAmount);
        } catch (err) {
          setUiError("Invalid fee amount format");
          return err;
        }
      }

      const isETHFee = !disputeForm.proBono;

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "raiseDispute",
        args: [
          BigInt(agreementId),
          votingId,
          disputeForm.plaintiffIsServiceRecipient,
          disputeForm.proBono,
          feeAmount,
        ],
        value: isETHFee ? feeAmount : 0n,
      });

      setUiSuccess("Dispute raised successfully!");
      setShowDisputeModal(false);
    } catch (error: unknown) {
      setLoading("raiseDispute", false);
      setUiError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Error raising dispute",
      );
      console.error("Error raising dispute:", error);
    }
  };

  useEffect(() => {
    if (agreement && getBoolField(24)) {
      // If vesting is enabled
      refetchMilestoneCount();
    }
  }, [agreement, getBoolField, refetchMilestoneCount]);

  useEffect(() => {
    if (milestoneCount) {
      // refetch contract reads if milestone count changed
      refetchMilestonesData();
    } else {
      setMilestones([]);
    }
  }, [milestoneCount, refetchMilestonesData]);

  useEffect(() => {
    if (writeError) {
      resetAllLoading();
      setUiError("Transaction was rejected or failed");
      setCreateApprovalState({ isApprovingToken: false, needsApproval: false });
      setDepositState({
        isApprovingToken: false,
        needsApproval: false,
        approvalHash: null,
      });
      resetWrite();
    }
  }, [writeError, resetWrite]);

  useEffect(() => {
    if (approvalError) {
      resetAllLoading();

      setUiError("Token approval was rejected or failed");
      setCreateApprovalState({ isApprovingToken: false, needsApproval: false });
      setDepositState({
        isApprovingToken: false,
        needsApproval: false,
        approvalHash: null,
      });
      resetApproval();
    }
  }, [approvalError, resetApproval]);

  useEffect(() => {
    resetMessages();
    setCreateApprovalState({ isApprovingToken: false, needsApproval: false });
  }, [activeTab]);

  useEffect(() => {
    if (approvalSuccess && depositState.needsApproval) {
      // proceed immediately to deposit
      depositDirectly();
    }
  }, [
    approvalSuccess,
    depositState.needsApproval,
    agreementId,
    agreement,
    depositDirectly,
  ]);

  // Add this useEffect hook after your existing useEffect hooks
  useEffect(() => {
    if (isSuccess) {
      resetAllLoading();

      // Small delay to ensure blockchain state is updated
      const timer = setTimeout(() => {
        refetchStats();
        if (viewId) {
          refetchAgreement();
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, viewId, refetchStats, refetchAgreement]);

  useEffect(() => {
    if (approvalSuccess && createApprovalState.needsApproval) {
      // After approval is successful, create the agreement
      let value: bigint;
      try {
        value = parseAmount(
          createForm.amount,
          createForm.token,
          createTokenDecimals as unknown as number,
        );
      } catch {
        setUiError("Invalid amount after approval");
        return;
      }

      const milestonePercsBigInt = createForm.milestonePercs.map((perc) =>
        BigInt(percentToBP(perc)),
      );
      const milestoneOffsetsBigInt = createForm.milestoneOffsets.map((offset) =>
        BigInt(offset),
      );

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "createAgreement",
        args: [
          BigInt(createForm.agreementId),
          createForm.serviceProvider as `0x${string}`,
          createForm.serviceRecipient as `0x${string}`,
          createForm.token as `0x${string}`,
          value,
          BigInt(createForm.deadlineDuration),
          createForm.vestingMode,
          createForm.privateMode,
          milestonePercsBigInt,
          milestoneOffsetsBigInt,
        ],
        value: BigInt(0), // No ETH value for ERC20
      });

      setCreateApprovalState({ needsApproval: false, isApprovingToken: false });
      setUiSuccess("Token approved! Creating agreement...");
    }
  }, [
    approvalSuccess,
    createApprovalState.needsApproval,
    createForm,
    contractAddress,
    writeContract,
    createTokenDecimals,
  ]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 lg:px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-cyan-300">Escrow Center</h1>
          </div>
        </div>

        {/* <ConnectButton /> */}
        {!isConnected ? (
          <div className="card-cyan glass mx-auto mt-20 max-w-[1000px] rounded-xl p-4 lg:p-8">
            <div className="flex flex-col justify-center text-center">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Welcome to Escrow Platform
              </h2>
              <p className="mx-auto mb-6 max-w-[600px] text-cyan-200/80">
                Connect your wallet to create and manage secure escrow
                agreements with milestone-based payments, dispute resolution,
                and automated releases.
              </p>
              <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-4">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
                  <h3 className="font-semibold text-green-300">
                    Secure Payments
                  </h3>
                  <p className="text-sm text-green-200/70">
                    Funds held in escrow until conditions are met
                  </p>
                </div>
                <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-4">
                  <Package className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                  <h3 className="font-semibold text-blue-300">
                    Milestone Tracking
                  </h3>
                  <p className="text-sm text-blue-200/70">
                    Release payments as work progresses
                  </p>
                </div>
                <div className="rounded-lg border border-purple-400/30 bg-purple-500/10 p-4">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                  <h3 className="font-semibold text-purple-300">
                    Dispute Resolution
                  </h3>
                  <p className="text-sm text-purple-200/70">
                    Fair resolution process for disagreements
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Dashboard */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                <p className="text-sm text-cyan-300">Total Agreements</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats[0].toString() : "0"}
                </p>
              </div>
              <div className="glass rounded-xl border border-purple-400/30 bg-gradient-to-br from-purple-500/20 to-transparent p-4">
                <p className="text-sm text-purple-300">Total Disputes</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats[1].toString() : "0"}
                </p>
              </div>
              <div className="glass rounded-xl border border-green-400/30 bg-gradient-to-br from-green-500/20 to-transparent p-4">
                <p className="text-sm text-green-300">Smooth Completions</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats[2].toString() : "0"}
                </p>
              </div>
              <div className="glass rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-transparent p-4">
                <p className="text-sm text-yellow-300">Fees Collected</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? formatEther(stats[3]).slice(0, 6) : "0"} ETH
                </p>
              </div>
              <div className="glass rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-transparent p-4">
                <p className="text-sm text-blue-300">Escrowed ETH</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? formatEther(stats[4]).slice(0, 6) : "0"} ETH
                </p>
              </div>
              <div className="glass rounded-xl border border-orange-400/30 bg-gradient-to-br from-orange-500/20 to-transparent p-4">
                <p className="text-sm text-orange-300">Platform Fees</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats[5].toString() : "0"}
                </p>
              </div>
              <div className="glass rounded-xl border border-pink-400/30 bg-gradient-to-br from-pink-500/20 to-transparent p-4">
                <p className="text-sm text-pink-300">Grace 1 Duration</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? formatSecondsToDetailed(stats[6]) : "0s"}
                </p>
                <p className="mt-1 text-xs text-pink-400/70">
                  {stats ? `${stats[6].toString()} seconds` : ""}
                </p>
              </div>
              <div className="glass rounded-xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/20 to-transparent p-4">
                <p className="text-sm text-indigo-300">Grace 2 Duration</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? formatSecondsToDetailed(stats[7]) : "0s"}
                </p>
                <p className="mt-1 text-xs text-indigo-400/70">
                  {stats ? `${stats[7].toString()} seconds` : ""}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-cyan-400/30">
              {["create", "manage", "view"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === tab ? "border-b-2 border-cyan-400 text-cyan-400" : "text-cyan-300 hover:text-cyan-200"}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Create Agreement Tab - TRANSFORMED */}
            {activeTab === "create" && (
              <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  Create New Agreement
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-cyan-300">
                      Agreement ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter unique agreement ID"
                      value={createForm.agreementId}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          agreementId: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-cyan-300">
                      Service Provider Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={createForm.serviceProvider}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          serviceProvider: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-cyan-300">
                      Service Recipient Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={createForm.serviceRecipient}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          serviceRecipient: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-cyan-300">
                      Token Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x... or leave empty for ETH"
                      value={createForm.token}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, token: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-cyan-300">
                      Amount{" "}
                      {createForm.token === ZERO_ADDRESS ? "(ETH)" : "(Tokens)"}
                    </label>
                    <input
                      type="text"
                      placeholder="Enter amount"
                      value={createForm.amount}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, amount: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-cyan-300">
                      Deadline Duration (seconds)
                    </label>
                    <input
                      type="text"
                      placeholder="604800 (1 week)"
                      value={createForm.deadlineDuration}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          deadlineDuration: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createForm.privateMode}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            privateMode: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-white/10 bg-white/5 text-cyan-400 focus:ring-cyan-400/20"
                      />
                      <span className="text-cyan-300">Private Mode</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createForm.vestingMode}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            vestingMode: e.target.checked,
                          })
                        }
                        className="h-5 w-5 rounded border-white/10 bg-white/5 text-cyan-400 focus:ring-cyan-400/20"
                      />
                      <span className="text-cyan-300">Vesting Mode</span>
                    </label>
                  </div>
                </div>

                {/* Vesting Configuration */}
                {createForm.vestingMode && (
                  <div className="glass mt-6 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Vesting Milestones
                    </h3>
                    <div className="space-y-4">
                      {createForm.milestonePercs.map((perc, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="mb-2 block text-sm text-cyan-300">
                              Percentage %
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., 50 for 50%"
                              value={perc}
                              onChange={(e) =>
                                updateMilestone(index, "percs", e.target.value)
                              }
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="mb-2 block text-sm text-cyan-300">
                              Offset (seconds)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., 302400 (3.5 days)"
                              value={createForm.milestoneOffsets[index]}
                              onChange={(e) =>
                                updateMilestone(
                                  index,
                                  "offsets",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                            />
                          </div>
                          {createForm.milestonePercs.length > 1 && (
                            <Button
                              variant="outline"
                              onClick={() => removeMilestone(index)}
                              className="mt-6 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={addMilestone}
                      className="mt-4 border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Add Milestone
                    </Button>
                    <p className="mt-3 text-sm text-cyan-300">
                      Total:{" "}
                      {createForm.milestonePercs.reduce(
                        (sum, perc) => sum + Number(perc),
                        0,
                      )}
                      /100%
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleCreateAgreement}
                  disabled={
                    isPending ||
                    isConfirming ||
                    createApprovalState.isApprovingToken ||
                    isApprovalPending ||
                    loadingStates.createAgreement
                  }
                  className="neon-hover mt-6 w-full"
                  variant="neon"
                >
                  {loadingStates.createAgreement ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : createApprovalState.isApprovingToken ? (
                    isApprovalPending ? (
                      "Approving Token..."
                    ) : (
                      "Confirming Approval..."
                    )
                  ) : isPending ? (
                    "Confirming..."
                  ) : isConfirming ? (
                    "Creating..."
                  ) : (
                    "Create Agreement"
                  )}
                </Button>
                {uiError && (
                  <div className="mt-4 w-fit rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                    <p className="text-red-400">{uiError}</p>
                  </div>
                )}
                {uiSuccess && (
                  <div className="mt-4 w-fit rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                    <p className="text-green-400">{uiSuccess}</p>
                  </div>
                )}
                {isSuccess && (
                  <div className="mt-4 w-fit rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                    <p className="text-green-400">
                      Agreement created successfully!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Manage Agreement Tab - TRANSFORMED */}
            {activeTab === "manage" && (
              <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  Manage Agreement
                </h2>
                <div className="mb-6 flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter Agreement ID"
                      value={agreementId}
                      onChange={(e) => setAgreementId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <Button
                    onClick={handleLoadAgreementForManage}
                    disabled={loadingStates.loadAgreement}
                    className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                    variant="outline"
                  >
                    {loadingStates.loadAgreement ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
                        Loading...
                      </>
                    ) : (
                      "Load Agreement"
                    )}
                  </Button>
                </div>

                {agreement && (
                  <div className="glass mb-6 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Agreement Overview
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-cyan-400" />
                        <div>
                          <div className="text-sm text-cyan-300">
                            Agreement ID
                          </div>
                          <div className="font-mono text-white">
                            {agreement[0].toString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-purple-400" />
                        <div>
                          <div className="text-sm text-cyan-300">Parties</div>
                          <div className="text-white">
                            Provider: {agreement[2].toString().slice(0, 8)}...
                            <br />
                            Recipient: {agreement[3].toString().slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-emerald-400" />
                        <div>
                          <div className="text-sm text-cyan-300">Amount</div>
                          <div className="text-white">
                            {formatAmount(
                              getBigIntField(5),
                              manageTokenDecimals as unknown as number,
                            )}{" "}
                            {agreement[4] === ZERO_ADDRESS
                              ? "ETH"
                              : manageTokenSymbol}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-cyan-400" />
                        <div>
                          <div className="text-sm text-cyan-300">Mode</div>
                          <div className="text-white">
                            {getBoolField(24) ? "Vesting" : "Standard"}
                            {getBoolField(20) ? " • Private" : " • Public"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="mt-4 space-y-2">
                      {getBigIntField(10) > 0n && getBoolField(22) && (
                        <div className="flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
                          <Clock className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-300">
                            Pending Order Cancellation:{" "}
                            <CountdownTimer
                              targetTimestamp={getBigIntField(10)}
                              onComplete={refetchAgreement}
                            />
                          </span>
                        </div>
                      )}
                      {getBoolField(21) && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <span className="text-red-300">
                            Agreement is Frozen!
                          </span>
                        </div>
                      )}
                      {getBigIntField(10) > 0n && getBoolField(22) && (
                        <div className="flex items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-3">
                          <Info className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-300">
                            {(() => {
                              const initiator = getField(12);
                              const serviceProvider = getField(2);
                              const serviceRecipient = getField(3);

                              if (
                                initiator &&
                                serviceProvider &&
                                serviceRecipient
                              ) {
                                const initiatorLower = initiator
                                  .toString()
                                  .toLowerCase();
                                const serviceProviderLower = serviceProvider
                                  .toString()
                                  .toLowerCase();
                                const serviceRecipientLower = serviceRecipient
                                  .toString()
                                  .toLowerCase();

                                if (initiatorLower === serviceRecipientLower) {
                                  return "Cancellation request sent, waiting for service provider";
                                } else if (
                                  initiatorLower === serviceProviderLower
                                ) {
                                  return "Cancellation request sent, waiting for service recipient";
                                }
                              }
                              return "Cancellation request sent, waiting for the other party";
                            })()}
                          </span>
                        </div>
                      )}
                      {getBigIntField(10) > 0n &&
                        getBoolField(25) &&
                        !getBoolField(24) && (
                          <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="text-blue-300">
                              Pending Delivery [Grace period 1]:{" "}
                              <CountdownTimer
                                targetTimestamp={getBigIntField(10)}
                                onComplete={refetchAgreement}
                              />
                            </span>
                          </div>
                        )}
                      {getBigIntField(10) > 0n && getBoolField(25) && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                          <Package className="h-4 w-4 text-green-400" />
                          <span className="text-green-300">
                            Delivery submitted, waiting for service recipient
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-4 sm:flex-row">
                        {!getBoolField(16) && (
                          <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                            <UserCheck className="h-4 w-4 text-blue-400" />
                            <span className="text-blue-300">
                              Waiting for Service Provider Signature
                            </span>
                          </div>
                        )}
                        {!getBoolField(17) && (
                          <div className="flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 p-3">
                            <UserCheck className="h-4 w-4 text-purple-400" />
                            <span className="text-purple-300">
                              Waiting for Service Recipient Signature
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {agreement && (
                  <>
                    {/* Check if any action buttons are available */}
                    {(((isServiceProvider && !getBoolField(16)) ||
                      (isServiceRecipient && !getBoolField(17))) &&
                      getBoolField(14)) ||
                    (!getBoolField(14) && !getBoolField(15)) ||
                    (getBoolField(15) &&
                      isServiceProvider &&
                      !getBoolField(21) &&
                      !getBoolField(22) &&
                      !getBoolField(25)) ||
                    (getBoolField(15) &&
                      isServiceRecipient &&
                      !getBoolField(22) &&
                      getBoolField(25)) ||
                    (now < getBigIntField(10) &&
                      getBoolField(15) &&
                      getBoolField(22) &&
                      address &&
                      address.toLowerCase() !==
                        String(getField(12)).toLowerCase() &&
                      !getBoolField(25)) ||
                    (getBoolField(15) &&
                      !getBoolField(22) &&
                      !getBoolField(25) &&
                      !getBoolField(21)) ||
                    (getBigIntField(10) !== BigInt(0) &&
                      !getBoolField(24) &&
                      now > getBigIntField(10) &&
                      getBoolField(14) &&
                      !getBoolField(22) &&
                      getBoolField(15)) ||
                    (getBoolField(15) &&
                      !getBoolField(24) &&
                      now > getBigIntField(11) &&
                      getBigIntField(11) !== BigInt(0) &&
                      getBoolField(14) &&
                      getBoolField(22)) ||
                    (getBoolField(15) &&
                      now > getBigIntField(10) &&
                      getBoolField(22) &&
                      getBigIntField(10) !== BigInt(0)) ||
                    (getBoolField(14) &&
                      getBoolField(15) &&
                      !getBoolField(19) &&
                      !getBoolField(18) &&
                      !getBoolField(21) &&
                      !getBoolField(22)) ? (
                      <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">
                          Agreement Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {/* Action Buttons */}

                          {agreement &&
                            ((isServiceProvider && !getBoolField(16)) ||
                              (isServiceRecipient && !getBoolField(17))) &&
                            getBoolField(14) && (
                              <>
                                <Button
                                  onClick={handleSignAgreement}
                                  disabled={
                                    !agreementId ||
                                    isPending ||
                                    loadingStates.signAgreement
                                  }
                                  className="w-fit border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                                  variant="outline"
                                >
                                  {loadingStates.signAgreement ? (
                                    <>
                                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
                                      Signing Agreement...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Sign Agreement
                                    </>
                                  )}
                                </Button>
                              </>
                            )}

                          {agreement &&
                            !getBoolField(14) &&
                            !getBoolField(15) && (
                              <Button
                                onClick={handleDepositFunds}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  isApprovalPending ||
                                  loadingStates.depositFunds
                                }
                                className="neon-hover w-fit border-green-500/50 bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-400"
                                variant="outline"
                              >
                                {loadingStates.depositFunds ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent"></div>
                                    Depositing...
                                  </>
                                ) : depositState.isApprovingToken ? (
                                  isApprovalPending ? (
                                    "Approving..."
                                  ) : (
                                    "Confirming..."
                                  )
                                ) : (
                                  <>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Deposit Funds
                                  </>
                                )}
                              </Button>
                            )}
                          {agreement &&
                            getBoolField(15) &&
                            isServiceProvider &&
                            !getBoolField(21) &&
                            !getBoolField(22) &&
                            !getBoolField(25) && (
                              <Button
                                onClick={handleSubmitDelivery}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.submitDelivery
                                }
                                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                variant="outline"
                              >
                                {loadingStates.submitDelivery ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent"></div>
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Package className="mr-2 h-4 w-4" />
                                    Submit Delivery
                                  </>
                                )}
                              </Button>
                            )}
                          {agreement &&
                            getBoolField(15) &&
                            isServiceRecipient &&
                            !getBoolField(22) &&
                            getBoolField(25) &&
                            !getBoolField(18) && (
                              <Button
                                onClick={() => handleApproveDelivery(true)}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.approveDelivery
                                }
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                variant="outline"
                              >
                                {loadingStates.approveDelivery ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <PackageCheck className="mr-2 h-4 w-4" />
                                    Approve Delivery
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            getBoolField(15) &&
                            isServiceRecipient &&
                            !getBoolField(22) &&
                            getBoolField(25) &&
                            !getBoolField(18) && (
                              <Button
                                onClick={() => handleApproveDelivery(false)}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.rejectDelivery
                                }
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                variant="outline"
                              >
                                {loadingStates.rejectDelivery ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Reject Delivery
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            now < getBigIntField(10) &&
                            getBoolField(15) &&
                            getBoolField(22) &&
                            address &&
                            address.toLowerCase() !==
                              String(getField(12)).toLowerCase() &&
                            !getBoolField(25) && (
                              <Button
                                onClick={() => handleApproveCancellation(true)}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.approveCancellation
                                }
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                variant="outline"
                              >
                                {loadingStates.approveCancellation ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve Cancellation
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            now < getBigIntField(10) &&
                            getBoolField(15) &&
                            getBoolField(22) &&
                            address &&
                            address.toLowerCase() !==
                              String(getField(12)).toLowerCase() &&
                            !getBoolField(25) && (
                              <Button
                                onClick={() => handleApproveCancellation(false)}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.approveCancellation
                                }
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                variant="outline"
                              >
                                {loadingStates.approveCancellation ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject Cancellation
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            getBoolField(15) &&
                            !getBoolField(22) &&
                            !getBoolField(25) &&
                            !getBoolField(21) && (
                              <Button
                                onClick={handleCancelOrder}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.cancelOrder
                                }
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                variant="outline"
                              >
                                {loadingStates.cancelOrder ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Cancel Order
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            getBigIntField(10) !== BigInt(0) &&
                            !getBoolField(24) &&
                            now > getBigIntField(10) &&
                            getBoolField(14) &&
                            !getBoolField(22) &&
                            getBoolField(15) && (
                              <Button
                                onClick={handlePartialRelease}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  getBoolField(24) ||
                                  loadingStates.partialRelease
                                }
                                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                                variant="outline"
                              >
                                {loadingStates.partialRelease ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent"></div>
                                    Releasing...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Partial Release
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            getBoolField(15) &&
                            !getBoolField(24) &&
                            now > getBigIntField(11) &&
                            getBigIntField(11) !== BigInt(0) &&
                            getBoolField(14) &&
                            getBoolField(22) && (
                              <Button
                                onClick={handleFinalRelease}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  getBoolField(24) ||
                                  loadingStates.finalRelease
                                }
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                                variant="outline"
                              >
                                {loadingStates.finalRelease ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
                                    Releasing...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Final Release
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            getBoolField(15) &&
                            now > getBigIntField(10) &&
                            getBoolField(22) &&
                            getBigIntField(10) !== BigInt(0) && (
                              <Button
                                onClick={handleCancellationTImeout}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.cancellationTimeout
                                }
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                                variant="outline"
                              >
                                {loadingStates.cancellationTimeout ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Cancellation Timeout
                                  </>
                                )}
                              </Button>
                            )}

                          {agreement &&
                            getBoolField(14) &&
                            getBoolField(15) &&
                            !getBoolField(19) &&
                            !getBoolField(18) &&
                            !getBoolField(21) &&
                            !getBoolField(22) && (
                              <Button
                                onClick={openDisputeModal}
                                disabled={
                                  !agreementId ||
                                  isPending ||
                                  loadingStates.raiseDispute
                                }
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-300/15"
                                variant="outline"
                              >
                                {loadingStates.raiseDispute ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
                                    Opening...
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Raise Dispute
                                  </>
                                )}
                              </Button>
                            )}

                          {/* Milestones Section */}
                          {agreement &&
                            getBoolField(24) &&
                            milestoneCount! > 0 &&
                            getBoolField(15) && (
                              <div className="glass col-span-full mt-6 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                                <h3 className="mb-4 text-xl font-bold text-white">
                                  Vesting Milestones
                                </h3>

                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse rounded-lg bg-white/5">
                                    <thead>
                                      <tr className="border-b border-cyan-400/30">
                                        <th className="p-4 text-left text-cyan-300">
                                          Milestone
                                        </th>
                                        <th className="p-4 text-left text-cyan-300">
                                          Percentage
                                        </th>
                                        <th className="p-4 text-left text-cyan-300">
                                          Amount
                                        </th>
                                        <th className="p-4 text-left text-cyan-300">
                                          Unlock Time
                                        </th>
                                        <th className="p-4 text-left text-cyan-300">
                                          Time Remaining
                                        </th>
                                        <th className="p-4 text-left text-cyan-300">
                                          Status
                                        </th>
                                        <th className="p-4 text-left text-cyan-300">
                                          Actions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {milestones.map((milestone, index) => (
                                        <MilestoneTableRow
                                          key={index}
                                          milestone={milestone}
                                          index={index}
                                          agreement={agreement}
                                          manageTokenDecimals={
                                            manageTokenDecimals as number
                                          }
                                          manageTokenSymbol={
                                            manageTokenSymbol as string
                                          }
                                          isServiceProvider={
                                            isServiceProvider as boolean
                                          }
                                          isServiceRecipient={
                                            isServiceRecipient as boolean
                                          }
                                          onClaimMilestone={
                                            handleClaimMilestone
                                          }
                                          onSetMilestoneHold={
                                            handleSetMilestoneHold
                                          }
                                          isLoadingClaim={
                                            loadingStates.claimMilestone
                                          }
                                          isLoadingHold={
                                            loadingStates.setMilestoneHold
                                          }
                                        />
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
                {uiError && (
                  <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                    <p className="text-red-400">{uiError}</p>
                  </div>
                )}
                {uiSuccess && (
                  <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                    <p className="text-green-400">{uiSuccess}</p>
                  </div>
                )}
                {isSuccess && (
                  <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                    <p className="text-green-400">Transaction successful!</p>
                  </div>
                )}
              </div>
            )}

            {/* View Agreement Tab - TRANSFORMED */}
            {activeTab === "view" && (
              <div className="glass max-w-[1000px] rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  View Agreement Details
                </h2>
                <div className="mb-6 flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter Agreement ID"
                      value={viewId}
                      onChange={(e) => setViewId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <Button
                    onClick={() => refetchAgreement()}
                    className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                    variant="outline"
                  >
                    Fetch Details
                  </Button>
                </div>

                {agreement && (
                  <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                    <h3 className="mb-4 text-xl font-bold text-white">
                      Agreement Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        {
                          label: "ID",
                          value: agreement[0].toString(),
                          icon: FileText,
                        },
                        {
                          label: "Creator",
                          value: agreement[1].toString(),
                          icon: Users,
                        },
                        {
                          label: "serviceProvider",
                          value: agreement[2].toString(),
                          icon: UserCheck,
                        },
                        {
                          label: "serviceRecipient",
                          value: agreement[3].toString(),
                          icon: Users,
                        },
                        {
                          label: "token",
                          value: agreement[4].toString(),
                          icon: DollarSign,
                        },
                        {
                          label: "Amount",
                          value: `${formatAmount(getBigIntField(5), manageTokenDecimals as unknown as number)} ${agreement[4] === ZERO_ADDRESS ? "ETH" : manageTokenSymbol}`,
                          icon: DollarSign,
                        },
                        {
                          label: "Remaining",
                          value: `${formatAmount(getBigIntField(6), manageTokenDecimals as unknown as number)} ${agreement[4] === ZERO_ADDRESS ? "ETH" : manageTokenSymbol}`,
                          icon: DollarSign,
                        },
                        {
                          label: "createdAt",
                          value: agreement[7].toString(),
                          icon: Calendar,
                        },
                        {
                          label: "deadline",
                          value: agreement[8].toString(),
                          icon: Clock,
                        },
                        {
                          label: "deadlineDuration",
                          value: agreement[9].toString(),
                          icon: Clock,
                        },
                        {
                          label: "grace1Ends",
                          value: (
                            <span>
                              {agreement[10].toString()}
                              {getBigIntField(10) > 0n && (
                                <span className="ml-2">
                                  (
                                  <CountdownTimer
                                    targetTimestamp={getBigIntField(10)}
                                    onComplete={refetchAgreement}
                                  />
                                  )
                                </span>
                              )}
                            </span>
                          ),
                          icon: Clock,
                        },
                        {
                          label: "grace2Ends",
                          value: (
                            <span>
                              {agreement[11].toString()}
                              {getBigIntField(11) > 0n && (
                                <span className="ml-2">
                                  (
                                  <CountdownTimer
                                    targetTimestamp={getBigIntField(11)}
                                    onComplete={refetchAgreement}
                                  />
                                  )
                                </span>
                              )}
                            </span>
                          ),
                          icon: Clock,
                        },
                        {
                          label: "grace1EndsCalledBy",
                          value: agreement[12].toString(),
                          icon: Users,
                        },
                        {
                          label: "grace2EndsCalledBy",
                          value: agreement[13].toString(),
                          icon: Users,
                        },
                        {
                          label: "funded",
                          value: agreement[14].toString(),
                          icon: DollarSign,
                        },
                        {
                          label: "signed",
                          value: agreement[15].toString(),
                          icon: FileText,
                        },
                        {
                          label: "acceptedByServiceProvider",
                          value: agreement[16].toString(),
                          icon: UserCheck,
                        },
                        {
                          label: "acceptedByServiceRecipient",
                          value: agreement[17].toString(),
                          icon: UserCheck,
                        },
                        {
                          label: "completed",
                          value: agreement[18].toString(),
                          icon: CheckCircle,
                        },
                        {
                          label: "disputed",
                          value: agreement[19].toString(),
                          icon: AlertTriangle,
                        },
                        {
                          label: "privateMode",
                          value: agreement[20].toString(),
                          icon: Lock,
                        },
                        {
                          label: "frozen",
                          value: agreement[21].toString(),
                          icon: Shield,
                        },
                        {
                          label: "pendingCancellation",
                          value: agreement[22].toString(),
                          icon: Ban,
                        },
                        {
                          label: "orderCancelled",
                          value: agreement[23].toString(),
                          icon: XCircle,
                        },
                        {
                          label: "Vesting State",
                          value: agreement[24].toString(),
                          icon: Package,
                        },
                        {
                          label: "deliverySubmitted",
                          value: agreement[25].toString(),
                          icon: PackageCheck,
                        },
                        {
                          label: "votingId",
                          value: agreement[26].toString(),
                          icon: FileText,
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 rounded-lg border border-white/10 bg-white/5 p-3"
                        >
                          <item.icon className="mt-0.5 h-4 w-4 text-cyan-400" />
                          <div>
                            <div className="text-sm text-cyan-300">
                              {item.label}:
                            </div>
                            <div className="font-mono text-xs break-all text-white">
                              {item.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showDisputeModal && (
              <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                <div className="glass w-full max-w-md rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                  <h3 className="mb-4 text-xl font-bold text-white">
                    Raise Dispute
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-cyan-300">
                        Voting ID
                      </label>
                      <input
                        type="text"
                        value={disputeForm.votingId}
                        onChange={(e) =>
                          setDisputeForm({
                            ...disputeForm,
                            votingId: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                        placeholder="Unique voting ID"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={disputeForm.proBono}
                        onChange={(e) =>
                          setDisputeForm({
                            ...disputeForm,
                            proBono: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-white/10 bg-white/5 text-cyan-400 focus:ring-cyan-400/20"
                      />
                      <label className="text-cyan-300">
                        Pro Bono (Free of charge)
                      </label>
                    </div>

                    {!disputeForm.proBono && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm text-cyan-300">
                            Fee Amount
                          </label>
                          <input
                            type="text"
                            value={disputeForm.feeAmount}
                            onChange={(e) =>
                              setDisputeForm({
                                ...disputeForm,
                                feeAmount: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                            placeholder="0.01"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handleRaiseDisputeWithModal}
                      disabled={
                        !agreementId || isPending || loadingStates.raiseDispute
                      }
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      variant="outline"
                    >
                      {loadingStates.raiseDispute ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                          Raising Dispute...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Raise Dispute
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDisputeModal(false)}
                      className="flex-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Web3Escrow;
