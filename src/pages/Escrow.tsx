// src/pages/Escrow.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import {
  Search,
  SortAsc,
  SortDesc,
  Eye,
  Info,
  Upload,
  Paperclip,
  Trash2,
  Loader2,
  ChevronDown,
  Calendar,
  User,
  Users,
  Send,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Link2,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
  Server,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type { Escrow, ExtendedEscrow } from "../types";
import { Link } from "react-router-dom";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// wagmi + viem style hooks
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useContractReads,
  useSwitchChain
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import { ESCROW_ABI, ESCROW_CA, ERC20_ABI, ZERO_ADDRESS } from "../web3/config";
import { agreementService } from "../services/agreementServices";
import { cleanTelegramUsername } from "../lib/usernameUtils";
import { isValidAddress } from "../web3/helper";
import { useAuth } from "../hooks/useAuth";

// API Enum Mappings
const AgreementTypeEnum = {
  REPUTATION: 1,
  ESCROW: 2,
} as const;

const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

type CreationStep =
  | "idle"
  | "creating_backend"
  | "awaiting_approval"
  | "approving"
  | "creating_onchain"
  | "waiting_confirmation"
  | "success"
  | "error";

// Helper function to extract transaction hash from description
const extractTxHashFromDescription = (
  description: string,
): string | undefined => {
  const match = description?.match(/Transaction Hash: (0x[a-fA-F0-9]{64})/);
  return match?.[1];
};

// Enhanced extraction functions with better pattern matching
const extractServiceProviderFromDescription = (
  description: string,
): string | undefined => {
  if (!description) return undefined;

  // Try multiple patterns in order of priority
  const patterns = [
    // Exact pattern from the new ON-CHAIN ESCROW DATA format
    /Service Provider: (0x[a-fA-F0-9]{40})/,
    // Alternative formats (case-insensitive)
    /Service Provider:\s*(0x[a-fA-F0-9]{40})/i,
    /Provider:\s*(0x[a-fA-F0-9]{40})/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match?.[1]) {
      // Validate it's a proper Ethereum address
      const address = match[1];
      if (isValidAddress(address)) {
        return address.toLowerCase(); // Normalize to lowercase
      }
    }
  }

  return undefined;
};

// Helper function to extract service recipient from description
const extractServiceRecipientFromDescription = (
  description: string,
): string | undefined => {
  if (!description) return undefined;

  // Try multiple patterns in order of priority
  const patterns = [
    // Exact pattern from the new ON-CHAIN ESCROW DATA format
    /Service Recipient: (0x[a-fA-F0-9]{40})/,
    // Alternative formats (case-insensitive)
    /Service Recipient:\s*(0x[a-fA-F0-9]{40})/i,
    /Recipient:\s*(0x[a-fA-F0-9]{40})/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match?.[1]) {
      // Validate it's a proper Ethereum address
      const address = match[1];
      if (isValidAddress(address)) {
        return address.toLowerCase(); // Normalize to lowercase
      }
    }
  }

  return undefined;
};

// Enhanced helper function to get wallet address from party object
const getPartyWalletAddress = (party: any): string => {
  if (!party) return "";

  // Try multiple possible field names
  return (
    party.walletAddress ||
    party.wallet ||
    party.WalletAddress ||
    party.address ||
    (party.wallet && typeof party.wallet === "object"
      ? party.wallet.address
      : null) ||
    ""
  );
};

// Helper function to format wallet addresses for display
const formatWalletAddress = (address: string): string => {
  if (!address || address === "@unknown") return "@unknown";

  // Check if it's already a short format
  if (address.startsWith("@")) {
    return address;
  }

  // Check if it's a Telegram handle (no @ symbol but not a wallet address)
  if (address.length <= 15 && !address.startsWith("0x")) {
    return `@${address}`;
  }

  // If it's a wallet address (0x...), slice it
  if (address.startsWith("0x") && address.length === 42) {
    return `${address.slice(0, 4)}...${address.slice(-6)}`;
  }

  // Return original for any other case
  return address;
};

// File upload types
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

// Escrow type options
type EscrowType = "myself" | "others";

// Update the status type to include all possible values
type EscrowStatus =
  | "pending"
  | "signed"
  | "completed"
  | "cancelled"
  | "expired"
  | "disputed"
  | "pending_approval";

// Create a base type without the status conflict
type ExtendedEscrowBase = Omit<ExtendedEscrow, "status">;

// Extended Escrow type to include on-chain data
interface ExtendedEscrowWithOnChain extends ExtendedEscrowBase {
  txHash?: string;
  onChainId?: string;
  includeFunds?: "yes" | "no";
  useEscrow?: boolean;
  escrowAddress?: string;
  escrowType?: EscrowType;
  status: EscrowStatus;
  source?: string;
}

// Enhanced interface for on-chain escrow data
interface OnChainEscrowData extends ExtendedEscrowWithOnChain {
  onChainStatus?: string;
  onChainAmount?: string;
  onChainDeadline?: number;
  onChainParties?: {
    serviceProvider: string;
    serviceRecipient: string;
  };
  onChainToken?: string;
  isOnChainActive?: boolean;
  isFunded?: boolean;
  isSigned?: boolean;
  isCompleted?: boolean;
  isDisputed?: boolean;
  isCancelled?: boolean;
  lastUpdated?: number;
}

// Smart contract error patterns (from your Solidity contract)
const CONTRACT_ERRORS = {
  NOT_PARTY: "NotParty",
  NOT_ACTIVE: "NotActive",
  INVALID_AMOUNT: "InvalidAmount",
  CANNOT_BE_SAME: "CannotBeTheSame",
  ZERO_ADDRESS: "ZeroAddress",
  NOT_YET_FUNDED: "NotYetFunded",
  ALREADY_SIGNED: "AlreadySigned",
  ALREADY_ACCEPTED: "AlreadyAccepted",
  ALREADY_FUNDED: "AlreadyFunded",
  GRACE_NOT_ENDED: "Grace1NotEnded",
  GRACE_PERIOD_ENDED: "Grace1PeriodEnded",
  ALREADY_IN_GRACE: "AlreadyInGracePeriod",
  NO_ACTION_MADE: "NoActionMade",
  NOT_SIGNED: "NotSigned",
  INITIATOR_CANNOT_RESPOND: "InitiatorCannotRespond",
  ALREADY_PENDING_CANCELLATION: "AlreadyPendingCancellation",
  IN_VESTING_STAGE: "InVestingStage",
  NO_VESTING_STAGE: "NoVestingStage",
  MILESTONE_HELD: "MilestoneHeld",
  MILESTONE_ALREADY_CLAIMED: "MilestoneAlreadyClaimed",
  INVALID_MILESTONE_CONFIG: "InvalidMilestoneConfig",
  MILESTONE_NOT_UNLOCKED: "MilestoneNotUnlocked",
  OFFSET_EXCEEDS_DEADLINE: "OffsetExceedsDeadline",
};

// Enhanced status mapping for on-chain agreements
const mapAgreementStatusToEscrow = (status: number): EscrowStatus => {
  switch (status) {
    case 1:
      return "pending"; // PENDING_ACCEPTANCE
    case 2:
      return "signed"; // SIGNED
    case 3:
      return "completed"; // COMPLETED
    case 4:
      return "disputed"; // DISPUTED
    case 5:
      return "cancelled"; // CANCELLED
    case 6:
      return "expired"; // EXPIRED
    case 7:
      return "pending_approval"; // PARTY_SUBMITTED_DELIVERY
    default:
      return "pending";
  }
};

const transformApiAgreementToEscrow = (
  apiAgreement: any,
): ExtendedEscrowWithOnChain => {
  // Debug: Log the raw data for inspection
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Processing agreement:", {
      id: apiAgreement.id,
      title: apiAgreement.title,
      hasOnChainData: apiAgreement.description?.includes(
        "ON-CHAIN ESCROW DATA",
      ),
      descriptionPreview: apiAgreement.description?.substring(0, 150) + "...",
      // Log the new fields
      payeeWalletAddress: apiAgreement.payeeWalletAddress,
      payerWalletAddress: apiAgreement.payerWalletAddress,
    });
  }

  // FIRST: Try to use the new dedicated fields (most reliable)
  let serviceProvider = apiAgreement.payeeWalletAddress; // Payee = Service Provider
  let serviceRecipient = apiAgreement.payerWalletAddress; // Payer = Service Recipient

  // SECOND: If new fields are null/empty, extract from description (current approach)
  if (!serviceProvider || !serviceRecipient) {
    console.log(
      `⚠️ Using description extraction as fallback for agreement ${apiAgreement.id}`,
    );

    const serviceProviderFromDesc = extractServiceProviderFromDescription(
      apiAgreement.description,
    );
    const serviceRecipientFromDesc = extractServiceRecipientFromDescription(
      apiAgreement.description,
    );

    serviceProvider = serviceProviderFromDesc;
    serviceRecipient = serviceRecipientFromDesc;
  }

  // THIRD: If description extraction also fails, fall back to party data (last resort)
  if (!serviceProvider || !serviceRecipient) {
    console.warn(
      `⚠️ Could not extract roles from new fields or description for agreement ${apiAgreement.id}, using party data fallback`,
    );

    const serviceProviderWallet = getPartyWalletAddress(
      apiAgreement.firstParty,
    );
    const serviceRecipientWallet = getPartyWalletAddress(
      apiAgreement.counterParty,
    );

    // Normalize wallet addresses to lowercase for consistency
    serviceProvider = serviceProviderWallet?.toLowerCase() || "";
    serviceRecipient = serviceRecipientWallet?.toLowerCase() || "";

    // Fallback to telegram username if wallet not found
    const fallbackServiceProvider =
      serviceProvider ||
      cleanTelegramUsername(apiAgreement.firstParty?.telegramUsername) ||
      "@unknown";

    const fallbackServiceRecipient =
      serviceRecipient ||
      cleanTelegramUsername(apiAgreement.counterParty?.telegramUsername) ||
      "@unknown";

    serviceProvider = serviceProvider || fallbackServiceProvider;
    serviceRecipient = serviceRecipient || fallbackServiceRecipient;
  }

  // Normalize addresses (lowercase for consistency)
  if (serviceProvider && serviceProvider.startsWith("0x")) {
    serviceProvider = serviceProvider.toLowerCase();
  }
  if (serviceRecipient && serviceRecipient.startsWith("0x")) {
    serviceRecipient = serviceRecipient.toLowerCase();
  }

  // Log source for debugging
  const source = apiAgreement.payeeWalletAddress
    ? "new fields (payeeWalletAddress/payerWalletAddress)"
    : "description extraction (fallback)";

  if (process.env.NODE_ENV === "development") {
    console.log("✅ Final mapping for agreement:", {
      id: apiAgreement.id,
      title: apiAgreement.title,
      source: source,
      mapping: {
        from: `Service Recipient (Payer) = ${serviceRecipient}`,
        to: `Service Provider (Payee) = ${serviceProvider}`,
      },
    });
  }

  // Extract other fields...
  const includeFunds = apiAgreement.includesFunds ? "yes" : "no";
  const useEscrow = apiAgreement.hasSecuredFunds;
  const onChainId = apiAgreement.contractAgreementId;

  return {
    id: `${apiAgreement.id}`,
    title: apiAgreement.title,
    // Use the determined values
    from: serviceRecipient, // Service Recipient (Payer)
    to: serviceProvider, // Service Provider (Payee)
    token: apiAgreement.tokenSymbol || "ETH",
    amount: apiAgreement.amount ? parseFloat(apiAgreement.amount) : 0,
    status: mapAgreementStatusToEscrow(apiAgreement.status),
    deadline: apiAgreement.deadline
      ? new Date(apiAgreement.deadline).toISOString().split("T")[0]
      : "No deadline",
    type: apiAgreement.visibility === 1 ? "private" : "public",
    description: apiAgreement.description || "",
    createdAt: new Date(
      apiAgreement.dateCreated || apiAgreement.createdAt,
    ).getTime(),
    txHash: extractTxHashFromDescription(apiAgreement.description),
    onChainId: onChainId,
    includeFunds: includeFunds,
    useEscrow: useEscrow,
    escrowAddress: apiAgreement.escrowContractAddress,
    // Store the source for debugging
    source: source,
  };
};

export default function Escrow() {
  const [statusTab, setStatusTab] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTxHash, setLastSyncedTxHash] = useState<string | null>(null);
  const [chainConfigError, setChainConfigError] = useState<string | null>(null);


  // ---------- wagmi / on-chain state ----------
  const { address, isConnected } = useAccount();
  const { user: currentUser } = useAuth();
  const { switchChain } = useSwitchChain();
  const networkInfo = useNetworkEnvironment();

  // Add this state near the top of the component, with other state declarations
  const [creationStep, setCreationStep] = useState<CreationStep>("idle");
  const [currentStepMessage, setCurrentStepMessage] = useState<string>("");

  const contractAddress = useMemo(() => {
    if (!networkInfo.chainId) return undefined;

    const address = ESCROW_CA[networkInfo.chainId as number];

    console.log("🔄 Contract address lookup:", {
      address,
      isValid: address && isValidAddress(address),
      ESCROW_CA,
    });

    if (address && isValidAddress(address)) {
      return address as `0x${string}`;
    }

    console.error(
      `❌ No valid contract address found for chainId ${networkInfo.chainId}`,
    );
    return undefined;
  }, [networkInfo.chainId]);

  const switchToTokenChain = useCallback(async () => {
    if (!networkInfo.chainId || !switchChain) return;

    try {
      switchChain({ chainId: networkInfo.chainId });
    } catch (error) {
      console.error("Failed to switch network:", error);
      // Fallback: show message asking user to switch manually
    }
  }, [networkInfo.chainId, switchChain]);


  // Separate write hooks: one for general writes, one for approvals
  const {
    data: txHash,
    writeContract,
    isPending: isTxPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    data: approvalHash,
    writeContract: writeApproval,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract();

  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { isSuccess: approvalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Enhanced error handling for contract errors
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEscrows, setTotalEscrows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allEscrows, setAllEscrows] = useState<OnChainEscrowData[]>([]);

  // Add this function to update step messages
  const updateStep = (step: CreationStep, message: string) => {
    setCreationStep(step);
    setCurrentStepMessage(message);
    console.log(`🔄 ${step}: ${message}`);
  };

  // Load escrow agreements directly with type=2 (ESCROW)
  const loadEscrowAgreements = useCallback(async () => {
    try {
      setLoading(true);

      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.log("📥 Loading escrow agreements (type=2)...");
      }

      // Fetch only escrow agreements (type=2)
      const escrowAgreementsResponse = await agreementService.getAgreements({
        top: 100,
        skip: 0,
        sort: "desc",
        type: AgreementTypeEnum.ESCROW,
      });

      console.log("📄 Fetched escrow agreements response:", escrowAgreementsResponse);

      const escrowAgreementsList = escrowAgreementsResponse.results || [];

      if (
        process.env.NODE_ENV === "development" &&
        escrowAgreementsList.length > 0
      ) {
        console.log(
          "📋 First agreement description:",
          escrowAgreementsList[0].description,
        );
        console.log(
          "📋 Extracted provider:",
          extractServiceProviderFromDescription(
            escrowAgreementsList[0].description,
          ),
        );
        console.log(
          "📋 Extracted recipient:",
          extractServiceRecipientFromDescription(
            escrowAgreementsList[0].description,
          ),
        );
      }

      // Transform ALL escrow agreements (type=2)
      const transformedEscrows = escrowAgreementsList.map(
        transformApiAgreementToEscrow,
      );

      // Store ALL escrows for filtering/sorting
      setAllEscrows(transformedEscrows);
      setTotalEscrows(transformedEscrows.length);

      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Loaded escrow agreements:", transformedEscrows.length);
      }
    } catch (error: any) {
      console.error("Failed to fetch escrow agreements:", error);
      toast.error(error.message || "Failed to load escrow agreements");
      setAllEscrows([]);
      setTotalEscrows(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load agreements on mount - with cleanup
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await loadEscrowAgreements();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [loadEscrowAgreements]);

  // Refetch after successful creation - debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (txSuccess) {
        loadEscrowAgreements();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [txSuccess, loadEscrowAgreements]);

  // Load agreements on mount
  useEffect(() => {
    loadEscrowAgreements();
  }, [loadEscrowAgreements]);

  // Refetch after successful creation
  useEffect(() => {
    if (txSuccess) {
      setTimeout(() => {
        loadEscrowAgreements();
      }, 3000);
    }
  }, [txSuccess, loadEscrowAgreements]);

  // Effect to handle write errors from smart contract
  useEffect(() => {
    if (writeError) {
      const errorMessage = extractContractErrorMessage(writeError);
      setUiError(errorMessage);
      toast.error(`Contract Error: ${errorMessage}`);
    }
  }, [writeError]);

  // Effect to handle approval errors
  useEffect(() => {
    if (approvalError) {
      const errorMessage = extractContractErrorMessage(approvalError);
      setUiError(errorMessage);
      toast.error(`Approval Error: ${errorMessage}`);
    }
  }, [approvalError]);

  // Effect to handle transaction success
  useEffect(() => {
    if (txSuccess) {
      setUiSuccess("Transaction confirmed successfully!");
      toast.success("Transaction confirmed!");
      resetWrite();
    }
  }, [txSuccess, resetWrite]);

  // Effect to handle approval success
  useEffect(() => {
    if (approvalSuccess) {
      setUiSuccess("Token approval confirmed!");
      toast.success("Token approval confirmed!");
      resetApproval();
    }
  }, [approvalSuccess, resetApproval]);

  // Effect to handle transaction success - NO PATCH CALL!
  useEffect(() => {
    const handleTransactionSuccess = async () => {
      if (!txSuccess || !txHash || txHash === lastSyncedTxHash || isSyncing) {
        return;
      }

      setIsSyncing(true);
      setLastSyncedTxHash(txHash);
      updateStep("success", "Escrow created successfully!");

      try {
        console.log("✅ Transaction confirmed on-chain:", txHash);

        // SUCCESS MESSAGE ONLY - NO BACKEND UPDATE
        setUiSuccess("✅ Escrow created successfully!");
        toast.success("Escrow Created Successfully!", {
          description: `Transaction confirmed. Both parties will receive Telegram notifications.`,
        });

        // Close modal and reset
        setTimeout(() => {
          setOpen(false);
          resetForm();
          setCreationStep("idle");
          setCurrentStepMessage("");
          loadEscrowAgreements();
        }, 2000);
      } catch (err: any) {
        console.error("❌ Error handling success:", err);
        updateStep("error", "Error finalizing escrow creation");
        toast.error("Transaction Success", {
          description:
            "Escrow created on-chain but there was an issue updating UI.",
        });
      } finally {
        setIsSyncing(false);
        resetWrite();
      }
    };

    handleTransactionSuccess();
  }, [
    txSuccess,
    txHash,
    lastSyncedTxHash,
    isSyncing,
    resetWrite,
    loadEscrowAgreements,
  ]);

  // Function to extract meaningful error messages from contract errors
  const extractContractErrorMessage = (error: any): string => {
    if (!error) return "Unknown error occurred";

    const errorMessage = error.message || error.toString();

    // Check for common contract errors
    if (errorMessage.includes(CONTRACT_ERRORS.NOT_PARTY)) {
      return "You are not a party in this agreement";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.NOT_ACTIVE)) {
      return "Agreement is not active or already completed";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.INVALID_AMOUNT)) {
      return "Invalid amount provided";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.CANNOT_BE_SAME)) {
      return "Service provider and recipient cannot be the same address";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.ZERO_ADDRESS)) {
      return "Zero address is not allowed";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.NOT_YET_FUNDED)) {
      return "Agreement has not been funded yet";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.ALREADY_SIGNED)) {
      return "Agreement is already signed";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.ALREADY_FUNDED)) {
      return "Agreement is already funded";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.NOT_SIGNED)) {
      return "Agreement is not signed yet";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.INVALID_MILESTONE_CONFIG)) {
      return "Invalid milestone configuration - check percentages and offsets";
    }
    if (errorMessage.includes(CONTRACT_ERRORS.OFFSET_EXCEEDS_DEADLINE)) {
      return "Milestone offset exceeds agreement deadline";
    }
    if (
      errorMessage.includes("user rejected") ||
      errorMessage.includes("denied transaction")
    ) {
      return "Transaction was rejected by user";
    }
    if (errorMessage.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }
    if (errorMessage.includes("execution reverted")) {
      const revertMatch = errorMessage.match(
        /execution reverted: (.+?)(?="|$)/,
      );
      if (revertMatch && revertMatch[1]) {
        return `Contract reverted: ${revertMatch[1]}`;
      }
      return "Transaction reverted by contract";
    }

    return `Blockchain error: ${errorMessage}...`;
  };

  // Reset error and success messages
  const resetMessages = () => {
    setUiError(null);
    setUiSuccess(null);
  };

  // Enhanced escrow loading with on-chain data
  const [escrowsWithOnChainData, setEscrowsWithOnChainData] = useState<
    OnChainEscrowData[]
  >([]);

  // Apply pagination to filtered results
  const applyPagination = useCallback(
    (escrowsList: OnChainEscrowData[], page: number, size: number) => {
      const startIndex = (page - 1) * size;
      const endIndex = startIndex + size;
      const paginatedEscrows = escrowsList.slice(startIndex, endIndex);
      setEscrowsWithOnChainData(paginatedEscrows);
    },
    [],
  );

  // Filter and sort logic
  const filteredEscrows = useMemo(() => {
    if (allEscrows.length === 0) return [];

    let result = allEscrows.filter((e) => {
      // Status filter
      if (statusTab !== "all" && e.status !== statusTab) return false;

      // Search filter
      if (query.trim()) {
        const searchQuery = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(searchQuery) ||
          e.description.toLowerCase().includes(searchQuery) ||
          e.from.toLowerCase().includes(searchQuery) ||
          e.to.toLowerCase().includes(searchQuery)
        );
      }
      return true;
    });

    // Sort the results
    result = result.sort((a, b) =>
      sortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt,
    );

    return result;
  }, [allEscrows, statusTab, query, sortAsc]);

  // Apply pagination when filters change
  useEffect(() => {
    if (filteredEscrows.length > 0) {
      applyPagination(filteredEscrows, currentPage, pageSize);
    } else {
      setEscrowsWithOnChainData([]);
    }
  }, [filteredEscrows, currentPage, pageSize, applyPagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, query, sortAsc]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEscrows.length / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredEscrows.length);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    applyPagination(filteredEscrows, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    applyPagination(filteredEscrows, 1, newSize);
  };

  // ---------- UI state ----------
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dropdown states
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);

  // Date state
  const [deadline, setDeadline] = useState<Date | null>(null);

  // New state for escrow type selection
  const [escrowType, setEscrowType] = useState<EscrowType>("myself");

  const [form, setForm] = useState({
    title: "",
    type: "" as "public" | "private" | "",
    counterparty: "",
    payer: "" as "me" | "counterparty" | "",
    partyA: "",
    partyB: "",
    payerOther: "" as "partyA" | "partyB" | "",
    token: "",
    customTokenAddress: "",
    amount: "",
    description: "",
    evidence: [] as UploadedFile[],
    milestones: [""] as string[],
    tokenDecimals: 18,
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
      if (
        tokenRef.current &&
        !tokenRef.current.contains(event.target as Node)
      ) {
        setIsTokenOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const typeOptions = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  const tokenOptions = [
    { value: "USDC", label: "USDC" },
    { value: "DAI", label: "DAI" },
    { value: "ETH", label: "ETH" },
    { value: "custom", label: "Custom Token" },
  ];

  // File handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file) => {
      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + " MB";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSize,
      };

      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setForm((prev) => ({
            ...prev,
            evidence: [...prev.evidence, newFile],
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setForm((prev) => ({ ...prev, evidence: [...prev.evidence, newFile] }));
      }
    });
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((file) => file.id !== id),
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.pdf,.doc,.docx,.txt";
    const dataTransfer = new DataTransfer();
    Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;

    const event = new Event("change", { bubbles: true });
    input.dispatchEvent(event);

    handleFileSelect({
      target: { files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // ---------- On-chain helpers ----------
  const [viewId] = useState("");

  // percent string (like "50") -> basis points (5000)
  const percentToBP = (s: string): number => {
    const n = Number(s);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
  };

  // parse amount into bigint per token decimals (ETH uses parseEther)
  const parseAmount = (
    amount: string,
    tokenAddr: string,
    decimals?: number,
  ) => {
    if (!amount) throw new Error("empty amount");
    if (tokenAddr === ZERO_ADDRESS) {
      return parseEther(amount);
    } else {
      const d = decimals ?? form.tokenDecimals ?? 18;
      return parseUnits(amount, d);
    }
  };

  // parse milestones text array from form.milestones into two arrays
  const parseMilestonesFromForm = (
    milestonesInput: string[],
    deadlineDuration: number,
  ) => {
    const percBP: number[] = [];
    const offsets: number[] = [];
    for (const m of milestonesInput) {
      if (!m || m.trim() === "") continue;
      const parts = m.split(":").map((s) => s.trim());
      const p = Number(parts[0]);
      if (Number.isNaN(p)) throw new Error("invalid percent");
      const bp = percentToBP(String(p));
      percBP.push(bp);
      let offset = 0;
      if (parts.length > 1 && parts[1] !== "") {
        offset = Number(parts[1]);
        if (Number.isNaN(offset) || offset < 0)
          throw new Error("invalid offset");
        if (offset > deadlineDuration)
          throw new Error("offset > deadlineDuration");
      }
      offsets.push(offset);
    }
    return { percBP, offsets };
  };

  // Read agreement (when viewId is set)
  const { data: agreementData } = useReadContract({
    address: contractAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getAgreement",
    args: viewId ? [BigInt(viewId)] : undefined,
    query: { enabled: !!viewId && !!contractAddress },
  });

  // Read milestone count if vesting enabled on agreement
  const { data: milestoneCountData } = useReadContract({
    address: contractAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getMilestoneCount",
    args: viewId ? [BigInt(viewId)] : undefined,
    query: {
      enabled:
        !!viewId && !!agreementData && (agreementData as any)[24] === true,
    },
  });

  // Fetch milestone rows when milestoneCount available
  const contractsForMilestones = useMemo(() => {
    const count =
      typeof milestoneCountData === "bigint"
        ? Number(milestoneCountData)
        : typeof milestoneCountData === "number"
          ? milestoneCountData
          : 0;
    if (!count || !viewId || !contractAddress) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: contractAddress as `0x${string}`,
      abi: ESCROW_ABI.abi,
      functionName: "getMilestone" as const,
      args: [BigInt(viewId), BigInt(i)],
    }));
  }, [milestoneCountData, viewId, contractAddress]);

  useContractReads({
    contracts: contractsForMilestones,
    query: { enabled: contractsForMilestones.length > 0 },
  });

  // ---------------- New: decimals lookup for create form ----------------
  const { data: createTokenDecimals } = useReadContract({
    address: isValidAddress(form.customTokenAddress)
      ? (form.customTokenAddress as `0x${string}`)
      : undefined,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
    query: {
      enabled:
        isValidAddress(form.customTokenAddress) && form.token === "custom",
    },
  });

  useEffect(() => {
    if (
      typeof createTokenDecimals === "number" ||
      typeof createTokenDecimals === "bigint"
    ) {
      setForm((prev) => ({
        ...prev,
        tokenDecimals: Number(createTokenDecimals),
      }));
    }
  }, [createTokenDecimals]);

  // ---------------- New: automatic approval continuation ----------------
  const [pendingCreatePayload, setPendingCreatePayload] = useState<any>(null);
  const [createApprovalState, setCreateApprovalState] = useState({
    isApprovingToken: false,
    needsApproval: false,
  });

  useEffect(() => {
    if (
      approvalSuccess &&
      createApprovalState.needsApproval &&
      pendingCreatePayload
    ) {
      try {
        updateStep(
          "creating_onchain",
          "Token approved. Creating escrow on blockchain...",
        );
        writeContract(pendingCreatePayload);
        setCreateApprovalState({
          isApprovingToken: false,
          needsApproval: false,
        });
        setPendingCreatePayload(null);
        updateStep(
          "waiting_confirmation",
          "Escrow creation submitted. Waiting for confirmation...",
        );
        setUiSuccess("Approval confirmed — creating agreement now");
      } catch (err) {
        console.error("auto-create after approval failed", err);
        setUiError("Failed to create agreement after approval");
        updateStep("error", "Failed to create after approval");
      }
    }
  }, [
    approvalSuccess,
    createApprovalState.needsApproval,
    pendingCreatePayload,
    writeContract,
  ]);

  // Simplified transaction data ref
  const transactionDataRef = useRef<{
    contractAgreementId: string;
  } | null>(null);

  // Add resetForm function
  const resetForm = () => {
    setForm({
      title: "",
      type: "",
      counterparty: "",
      payer: "",
      partyA: "",
      partyB: "",
      payerOther: "",
      token: "",
      customTokenAddress: "",
      amount: "",
      description: "",
      evidence: [],
      milestones: [""],
      tokenDecimals: 18,
    });
    setDeadline(null);
    setEscrowType("myself");
  };

  // ---------------- Create agreement handler with new flow ----------------
  // Update the handleCreateAgreementOnChain function to include step tracking
  const handleCreateAgreementOnChain = async () => {
    resetMessages();
    setCreationStep("idle");
    setCurrentStepMessage("");

    if (!contractAddress || !isValidAddress(contractAddress)) {
      const errorMsg =
        chainConfigError || "Escrow contract not configured for this network";
      setUiError(errorMsg);
      updateStep("error", errorMsg);
      toast.error("Network Error", {
        description: `Please switch to a supported network. Current chain: ${networkInfo.chainId}`,
      });
      return;
    }
    if (!isConnected) {
      setUiError("Connect your wallet");
      updateStep("error", "Wallet not connected");
      return;
    }
    if (!currentUser?.walletAddress) {
      setUiError("Sign in to your account");
      updateStep("error", "User not signed in");
      return;
    }

    if (!form.title) {
      setUiError("Title required");
      updateStep("error", "Missing title");
      return;
    }
    if (!form.type) {
      setUiError("Type required");
      updateStep("error", "Missing escrow type");
      return;
    }
    if (!deadline) {
      setUiError("Deadline required");
      updateStep("error", "Missing deadline");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setUiError("Amount must be > 0");
      updateStep("error", "Invalid amount");
      return;
    }

    // Determine parties
    let serviceProviderAddr = "";
    let serviceRecipientAddr = "";
    let firstPartyAddr = "";
    let counterPartyAddr = "";

    if (escrowType === "myself") {
      if (!isValidAddress(form.counterparty)) {
        setUiError("Counterparty must be a valid address (0x...)");
        updateStep("error", "Invalid counterparty address");
        return;
      }
      if (form.payer === "me") {
        serviceRecipientAddr = address!;
        serviceProviderAddr = form.counterparty;
        firstPartyAddr = address!.toLowerCase();
        counterPartyAddr = form.counterparty.toLowerCase();
      } else {
        serviceProviderAddr = address!;
        serviceRecipientAddr = form.counterparty;
        firstPartyAddr = address!.toLowerCase();
        counterPartyAddr = form.counterparty.toLowerCase();
      }
    } else {
      if (!isValidAddress(form.partyA) || !isValidAddress(form.partyB)) {
        setUiError("Both parties must be valid addresses");
        updateStep("error", "Invalid party addresses");
        return;
      }
      if (form.payerOther === "partyA") {
        serviceRecipientAddr = form.partyA;
        serviceProviderAddr = form.partyB;
        firstPartyAddr = form.partyB.toLowerCase();
        counterPartyAddr = form.partyA.toLowerCase();
      } else {
        serviceRecipientAddr = form.partyB;
        serviceProviderAddr = form.partyA;
        firstPartyAddr = form.partyA.toLowerCase();
        counterPartyAddr = form.partyB.toLowerCase();
      }
    }

    // Check for same address error
    if (
      serviceProviderAddr.toLowerCase() === serviceRecipientAddr.toLowerCase()
    ) {
      setUiError("Service provider and recipient cannot be the same address");
      updateStep("error", "Parties cannot be the same");
      return;
    }

    // Token parsing
    let tokenAddr: string = ZERO_ADDRESS;
    if (form.token === "custom") {
      if (!isValidAddress(form.customTokenAddress)) {
        setUiError("Custom token must be a valid address");
        updateStep("error", "Invalid custom token address");
        return;
      }
      tokenAddr = form.customTokenAddress;
    } else if (form.token === "ETH") {
      tokenAddr = ZERO_ADDRESS;
    } else {
      if (
        !form.customTokenAddress ||
        !isValidAddress(form.customTokenAddress)
      ) {
        setUiError(
          `${form.token} selected — paste its contract address in Custom Token field`,
        );
        updateStep("error", `Missing ${form.token} contract address`);
        return;
      }
      tokenAddr = form.customTokenAddress;
    }

    // Deadline calculation
    const now = Math.floor(Date.now() / 1000);
    const deadlineSeconds = Math.floor((deadline as Date).getTime() / 1000);
    if (deadlineSeconds <= now) {
      setUiError("Deadline must be in the future");
      updateStep("error", "Deadline must be in the future");
      return;
    }
    const deadlineDuration = deadlineSeconds - now;

    // Parse milestones
    let vestingMode = false;
    let milestonePercs: number[] = [];
    let milestoneOffsets: number[] = [];
    try {
      const parsed = parseMilestonesFromForm(form.milestones, deadlineDuration);
      if (parsed.percBP.length > 0) {
        vestingMode = true;
        milestonePercs = parsed.percBP;
        milestoneOffsets = parsed.offsets;
        const totalBP = milestonePercs.reduce((s, v) => s + v, 0);
        if (totalBP !== 10000) {
          setUiError(
            "Milestone percentages must sum to 100% (10000 basis points)",
          );
          updateStep("error", "Milestone percentages don't sum to 100%");
          return;
        }
      }
    } catch (err: any) {
      setUiError(err.message || "Invalid milestones");
      updateStep("error", "Invalid milestone format");
      return;
    }

    // Amount parsing
    let amountBN: bigint;
    try {
      amountBN = parseAmount(
        form.amount,
        tokenAddr,
        form.tokenDecimals,
      ) as bigint;
      if (amountBN <= 0n) {
        setUiError("Parsed amount invalid");
        updateStep("error", "Invalid amount");
        return;
      }
    } catch (err) {
      console.error("parse amount error", err);
      setUiError("Invalid amount format");
      updateStep("error", "Could not parse amount");
      return;
    }

    // Generate 9-digit contract agreement ID
    const generateContractAgreementId = () => {
      const min = 100000000;
      const max = 999999999;
      const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
      return randomId.toString();
    };

    const contractAgreementId = generateContractAgreementId();
    console.log(
      "🔑 Generated 9-digit contract agreement ID:",
      contractAgreementId,
    );

    // ================================================
    // STEP 1: Create agreement in backend (off-chain)
    // ================================================
    setIsSubmitting(true);
    updateStep("creating_backend", "Creating agreement in database...");

    try {
      // Prepare files for upload
      let filesToUpload: File[] = [];
      if (form.evidence.length > 0) {
        filesToUpload = form.evidence.map((f) => f.file);
      }

      console.log("📝 Creating agreement in backend...");

      // Prepare description with on-chain metadata
      const onChainMetadata = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ON-CHAIN ESCROW DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract Agreement ID: ${contractAgreementId}
Service Provider: ${serviceProviderAddr}
Service Recipient: ${serviceRecipientAddr}
Token Address: ${tokenAddr}
Amount: ${form.amount}
Vesting Enabled: ${vestingMode}
Chain ID: ${networkInfo.chainId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      const fullDescription = form.description + onChainMetadata;

      let backendAgreementId = contractAgreementId;

      try {
        updateStep("creating_backend", "Sending data to backend server...");
        const agreementResponse = await agreementService.createAgreement(
          {
            title: form.title,
            description: fullDescription,
            type: AgreementTypeEnum.ESCROW,
            visibility:
              form.type === "private"
                ? AgreementVisibilityEnum.PRIVATE
                : AgreementVisibilityEnum.PUBLIC,
            firstParty: firstPartyAddr,
            counterParty: counterPartyAddr,
            deadline: deadline.toISOString(),
            amount: parseFloat(form.amount),
            tokenSymbol: form.token === "custom" ? "custom" : form.token,
            contractAddress:
              form.token === "custom" ? form.customTokenAddress : undefined,
            includesFunds: true,
            secureTheFunds: true,
            chainId: networkInfo.chainId,
            contractAgreementId: contractAgreementId,
          },
          filesToUpload,
        );

        console.log("✅ Backend response:", agreementResponse);

        if (agreementResponse && agreementResponse.id) {
          backendAgreementId = String(agreementResponse.id);
        }

        updateStep(
          "creating_backend",
          "Backend agreement created successfully",
        );
      } catch (backendErr) {
        console.warn(
          "⚠️ Backend creation had minor issues, continuing anyway:",
          backendErr,
        );
        updateStep("creating_backend", "Backend completed (with warnings)");
      }

      console.log("🔗 Agreement references:", {
        backendAgreementId,
        contractAgreementId,
      });

      // Store minimal data
      transactionDataRef.current = {
        contractAgreementId,
      };

      // ================================================
      // STEP 2: Call smart contract
      // ================================================
      const agreementIdNumber = BigInt(contractAgreementId);

      const callerIsDepositor =
        serviceRecipientAddr.toLowerCase() === address?.toLowerCase();
      const tokenIsETH = tokenAddr === ZERO_ADDRESS;

      // If ERC20 and caller is depositor, handle approval
      if (!tokenIsETH && callerIsDepositor) {
        updateStep(
          "awaiting_approval",
          "Token approval required. Please check your wallet...",
        );

        setCreateApprovalState({ isApprovingToken: true, needsApproval: true });

        const milestonePercsBN = milestonePercs.map((p) => BigInt(p));
        const milestoneOffsetsBN = milestoneOffsets.map((o) => BigInt(o));

        const payload = {
          address: contractAddress as `0x${string}`,
          abi: ESCROW_ABI.abi,
          functionName: "createAgreement",
          args: [
            agreementIdNumber,
            serviceProviderAddr as `0x${string}`,
            serviceRecipientAddr as `0x${string}`,
            tokenAddr as `0x${string}`,
            BigInt(amountBN),
            BigInt(deadlineDuration),
            vestingMode,
            form.type === "private",
            milestonePercsBN,
            milestoneOffsetsBN,
          ],
          value: 0n,
        };

        setPendingCreatePayload(payload);

        updateStep("approving", "Approving token spending...");
        writeApproval({
          address: tokenAddr as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: "approve",
          args: [contractAddress as `0x${string}`, amountBN],
        });

        setUiSuccess(
          "Approval submitted; will create agreement after confirmation",
        );
        setIsSubmitting(false);
        return;
      }

      // Otherwise call createAgreement directly
      updateStep("creating_onchain", "Creating escrow on blockchain...");
      const milestonePercsBN = milestonePercs.map((p) => BigInt(p));
      const milestoneOffsetsBN = milestoneOffsets.map((o) => BigInt(o));
      const valueToSend = tokenIsETH && callerIsDepositor ? amountBN : 0n;

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "createAgreement",
        args: [
          agreementIdNumber,
          serviceProviderAddr as `0x${string}`,
          serviceRecipientAddr as `0x${string}`,
          tokenAddr as `0x${string}`,
          BigInt(amountBN),
          BigInt(deadlineDuration),
          vestingMode,
          form.type === "private",
          milestonePercsBN,
          milestoneOffsetsBN,
        ],
        value: valueToSend,
      });

      updateStep(
        "waiting_confirmation",
        "Transaction submitted. Waiting for blockchain confirmation...",
      );
      setUiSuccess("CreateAgreement transaction submitted — check wallet");
      setIsSubmitting(false);
    } catch (backendErr: any) {
      console.error("❌ Failed:", backendErr);
      setIsSubmitting(false);
      updateStep("error", "Failed to create agreement");

      const errorCode = backendErr.response?.data?.error;
      let userMessage = "Failed to create agreement";

      switch (errorCode) {
        case 1:
          userMessage = "Missing required information";
          break;
        case 7:
          userMessage = "One or both parties need to register first";
          break;
        case 11:
          userMessage = "Parties cannot be the same account";
          break;
      }

      setUiError(userMessage);
      toast.error("Error", {
        description: userMessage,
      });
    }
  };

  // Wrapper for modal submit
  const createEscrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setCreationStep("idle");
    setCurrentStepMessage("");

    if (!form.title.trim()) {
      setUiError("Please enter a title");
      return;
    }
    if (!form.type) {
      setUiError("Please select escrow type");
      return;
    }
    if (escrowType === "myself") {
      if (!form.payer) {
        setUiError("Please select who pays");
        return;
      }
      if (!form.counterparty.trim()) {
        setUiError("Please enter counterparty information");
        return;
      }
    } else {
      if (!form.payerOther) {
        setUiError("Please select who pays");
        return;
      }
      if (!form.partyA.trim() || !form.partyB.trim()) {
        setUiError("Please enter both parties' information");
        return;
      }
    }
    if (!form.token) {
      setUiError("Please select payment token");
      return;
    }
    if (form.token === "custom" && !form.customTokenAddress.trim()) {
      setUiError("Please enter custom token address");
      return;
    }
    if (
      !form.amount.trim() ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setUiError("Please enter a valid amount");
      return;
    }
    if (!form.description.trim()) {
      setUiError("Please enter a description");
      return;
    }
    if (!deadline) {
      setUiError("Please select a deadline");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isConnected && contractAddress) {
        await handleCreateAgreementOnChain();
        setIsSubmitting(false);
        return;
      }

      // fallback mock
      if (form.evidence.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const id = `E-${Math.floor(Math.random() * 900 + 100)}`;

      let from: string;
      let to: string;

      if (escrowType === "myself") {
        from = form.payer === "me" ? "@you" : form.counterparty;
        to = form.payer === "me" ? form.counterparty : "@you";
      } else {
        from = form.payerOther === "partyA" ? form.partyA : form.partyB;
        to = form.payerOther === "partyA" ? form.partyB : form.partyA;
      }

      const next: ExtendedEscrowWithOnChain = {
        id,
        title: form.title,
        from,
        to,
        token: form.token === "custom" ? form.customTokenAddress : form.token,
        amount: Number(form.amount),
        status: "pending",
        deadline: deadline.toISOString().split("T")[0],
        type: form.type as "public" | "private",
        description: form.description,
        createdAt: Date.now(),
        escrowType: escrowType,
      };

      // Add to local state (for demo/testing)
      setEscrowsWithOnChainData((arr) => [next, ...arr]);
      setOpen(false);

      const successMessage =
        escrowType === "myself"
          ? `Escrow created between you and ${form.counterparty}`
          : `Escrow created between ${form.partyA} and ${form.partyB}`;

      setUiSuccess("Escrow created successfully");
      toast.success("Escrow created successfully", {
        description: `${successMessage} • ${form.amount} ${form.token} • ${form.evidence.length} files uploaded`,
      });

      resetForm();
    } catch (error) {
      setUiError("Failed to create escrow");
      updateStep("error", "Failed to create escrow");
      toast.error("Failed to create escrow", {
        description: "Please try again later",
      });
      console.error("Failed to create escrow:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const NetworkWarning = () => {
    if (!isConnected || !chainConfigError) return null;

    return (
      <div className="mb-4 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-400" />
          <div>
            <h4 className="text-sm font-medium text-orange-300">
              Unsupported Network
            </h4>
            <p className="mt-1 text-xs text-orange-300/80">
              {chainConfigError}
            </p>
            <p className="mt-2 text-xs text-orange-200/60">
              Supported networks:{" "}
              {Object.keys(ESCROW_CA)
                .map((id) => `Chain ${id}`)
                .join(", ")}
            </p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (currentUser?.walletAddress && isConnected) {
      toast.info(`Wallet Connected, switching to supported chain ${networkInfo.chainId === 1 ? "Ethereum [id:1]" : "Sepolia [id:11155111]"}...`);
      switchToTokenChain();
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      console.log("🔗 Chain configuration:", {
        contractAddress,
        contractConfig: ESCROW_CA,
        isAddressValid: contractAddress && isValidAddress(contractAddress),
      });

      if (!contractAddress || !isValidAddress(contractAddress)) {
        const errorMsg = `Escrow contract not configured for chain ${networkInfo.chainId}. Please switch to a supported network.`;
        setChainConfigError(errorMsg);
        toast.error("Unsupported Network", {
          description: `Chain ID ${networkInfo.chainId} is not supported. Please switch to a supported network.`,
        });
      } else {
        setChainConfigError(null);
      }
    }
  }, [networkInfo.chainId, isConnected, contractAddress]);

  const CreationProgress = () => {
    if (creationStep === "idle") return null;

    const steps = [
      {
        id: "creating_backend",
        label: "Backend Setup",
        description: "Creating agreement in database",
        icon: Server,
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
        borderColor: "border-blue-400/20",
      },
      {
        id: "awaiting_approval",
        label: "Awaiting Approval",
        description: "Waiting for token approval",
        icon: Clock,
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "border-amber-400/20",
      },
      {
        id: "approving",
        label: "Token Approval",
        description: "Approving token spending",
        icon: ShieldCheck,
        color: "text-purple-400",
        bgColor: "bg-purple-400/10",
        borderColor: "border-purple-400/20",
      },
      {
        id: "creating_onchain",
        label: "On-Chain Creation",
        description: "Deploying smart contract",
        icon: Link2,
        color: "text-cyan-400",
        bgColor: "bg-cyan-400/10",
        borderColor: "border-cyan-400/20",
      },
      {
        id: "waiting_confirmation",
        label: "Confirmation",
        description: "Waiting for blockchain",
        icon: Loader2,
        color: "text-indigo-400",
        bgColor: "bg-indigo-400/10",
        borderColor: "border-indigo-400/20",
      },
      {
        id: "success",
        label: "Success",
        description: "Escrow created successfully",
        icon: Sparkles,
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "border-emerald-400/20",
      },
    ];

    const currentStepIndex = steps.findIndex(
      (step) => step.id === creationStep,
    );
    const isError = creationStep === "error";
    const isSuccess = creationStep === "success";

    return (
      <div className="mb-6 rounded-xl border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-900/30 p-6 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${isError
                  ? "bg-red-500/10"
                  : isSuccess
                    ? "bg-emerald-500/10"
                    : "bg-cyan-500/10"
                  }`}
              >
                {isError ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : isSuccess ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isError
                    ? "Creation Failed"
                    : isSuccess
                      ? "Escrow Created Successfully"
                      : "Creating Escrow"}
                </h3>
                <p className="text-sm text-gray-400">
                  {isError
                    ? "An error occurred during creation"
                    : isSuccess
                      ? "Your escrow is now live on the blockchain"
                      : "Please wait while we set up your escrow agreement"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-full bg-white/5 px-3 py-1.5">
            <span className="text-sm font-medium text-cyan-300">
              Step {Math.min(currentStepIndex + 1, steps.length - 1)} of{" "}
              {steps.length - 1}
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative mb-8">
          {/* Connection Line */}
          {/* <div className="absolute top-6 right-0 left-0 h-0.5 -translate-y-1/2 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
              style={{
                width: `${
                  isError
                    ? 100
                    : ((currentStepIndex + 1) / (steps.length - 1)) * 100
                }%`,
              }}
            />
          </div> */}

          {/* Steps */}
          <div className="relative z-10 grid grid-cols-3 gap-4 md:grid-cols-6">
            {steps.slice(0, -1).map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.id} className="relative">
                  <div
                    className={`relative flex flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : isCurrent
                        ? "border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                        : isPending
                          ? "border-white/10 bg-white/5"
                          : "border-white/10 bg-white/5"
                      }`}
                  >
                    {/* Step Indicator */}
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${isCompleted
                        ? "border-emerald-500 bg-emerald-500/20"
                        : isCurrent
                          ? "border-cyan-500 bg-cyan-500/20"
                          : "border-white/20 bg-white/10"
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <StepIcon
                          className={`h-5 w-5 ${isCurrent
                            ? "text-cyan-400"
                            : isPending
                              ? "text-gray-400"
                              : "text-gray-500"
                            }`}
                        />
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="text-center">
                      <div
                        className={`text-xs font-semibold ${isCompleted
                          ? "text-emerald-300"
                          : isCurrent
                            ? "text-cyan-300"
                            : "text-gray-400"
                          }`}
                      >
                        {step.label}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {step.description}
                      </div>
                    </div>

                    {/* Step Number */}
                    <div
                      className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-cyan-500 text-white"
                          : "bg-white/10 text-gray-400"
                        }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${isError
                ? "bg-red-500/10"
                : isSuccess
                  ? "bg-emerald-500/10"
                  : "bg-cyan-500/10"
                }`}
            >
              {isError ? (
                <AlertTriangle className="h-6 w-6 text-red-400" />
              ) : isSuccess ? (
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">
                  {isError
                    ? "Error occurred"
                    : isSuccess
                      ? "Success!"
                      : "Current Status"}
                </h4>
                {isSuccess && (
                  <div className="rounded-full bg-emerald-500/20 px-3 py-1">
                    <span className="text-xs font-medium text-emerald-300">
                      Complete
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-300">{currentStepMessage}</p>

              {/* Additional Instructions */}
              {creationStep === "creating_onchain" && (
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-amber-400" />
                    <div className="text-xs text-amber-300">
                      Please check your wallet and confirm the transaction to
                      continue.
                    </div>
                  </div>
                </div>
              )}

              {creationStep === "waiting_confirmation" && (
                <div className="mt-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 text-indigo-400" />
                    <div className="text-xs text-indigo-300">
                      Waiting for blockchain confirmation. This usually takes
                      15-30 seconds.
                    </div>
                  </div>
                </div>
              )}

              {isSuccess && (
                <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <div className="text-xs text-emerald-300">
                      Your escrow is now live! The page will refresh
                      automatically.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Hash */}
          {txHash && !isSuccess && !isError && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Transaction
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(txHash);
                      toast.success("Transaction hash copied!");
                    }}
                    className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Hash
                  </button>
                  <button
                    onClick={() => {
                      // Open in block explorer (you'll need to implement this based on chain)
                      window.open(
                        `https://etherscan.io/tx/${txHash}`,
                        "_blank",
                      );
                    }}
                    className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </button>
                </div>
              </div>
              <div className="mt-3 overflow-hidden rounded-md bg-black/30 p-3">
                <div className="font-mono text-sm text-gray-300">
                  {txHash.slice(0, 30)}...
                  {txHash.slice(-30)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {isError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
              <div>
                <h4 className="font-medium text-red-300">Error Details</h4>
                <p className="mt-1 text-sm text-red-200/80">
                  Please check your connection and try again. If the problem
                  persists, contact support.
                </p>
                <button
                  onClick={() => {
                    resetMessages();
                    setCreationStep("idle");
                  }}
                  className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const previewCreationSteps = () => {
    setCreationStep("idle");
    setCurrentStepMessage("Starting preview...");

    // Simulate each step with delays
    const steps = [
      {
        step: "creating_backend",
        message: "Creating agreement in database...",
      },
      {
        step: "awaiting_approval",
        message: "Token approval required. Please check your wallet...",
      },
      { step: "approving", message: "Approving token spending..." },
      { step: "creating_onchain", message: "Creating escrow on blockchain..." },
      {
        step: "waiting_confirmation",
        message:
          "Transaction submitted. Waiting for blockchain confirmation...",
      },
      { step: "success", message: "Escrow created successfully!" },
    ];

    steps.forEach(({ step, message }, index) => {
      setTimeout(() => {
        updateStep(step as CreationStep, message);
      }, index * 2500);
    });

    // Auto-reset after preview
    setTimeout(
      () => {
        setCreationStep("idle");
        setCurrentStepMessage("");
      },
      steps.length * 2500 + 3000,
    );
  };

  // Update the StatusMessages component to include CreationProgress
  const StatusMessages = () => (
    <div className="space-y-2">
      {uiError && (
        <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {uiError}
        </div>
      )}
      {uiSuccess && (
        <div className="rounded-md border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {uiSuccess}
        </div>
      )}
      {(isTxPending || isApprovalPending) && (
        <div className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Transaction pending...
        </div>
      )}
      {/* Add the creation progress here */}
      <CreationProgress />
    </div>
  );

  // Skeleton loading component
  const EscrowSkeleton = () => (
    <div className="web3-corner-border group relative rounded-3xl p-[2px]">
      <div className="h-fit rounded-[1.4rem] bg-black/40 p-8 shadow-[0_0_40px_#00eaff20] backdrop-blur-xl">
        <div className="mb-4">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-cyan-500/20"></div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-4 w-12 animate-pulse rounded bg-white/10"></div>
              <div className="h-5 w-20 animate-pulse rounded bg-cyan-400/20"></div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 h-4 w-full animate-pulse rounded bg-white/10"></div>
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10"></div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10"></div>
          <div className="h-9 w-20 animate-pulse rounded bg-cyan-400/20"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <NetworkWarning />

      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl"></div>

      <div className="space-y-4">
        <div className="justify-between lg:flex">
          <header className="flex flex-col gap-3">
            <div>
              <h2 className="space mb-4 text-[22px] font-semibold text-white/90">
                Escrow Center
              </h2>
              <div className="mb-4 flex items-center gap-3">
                <Button
                  variant="neon"
                  className="neon-hover w-fit"
                  onClick={() => setOpen(true)}
                >
                  Create Escrow
                </Button>
                <Button
                  variant="outline"
                  className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  onClick={previewCreationSteps}
                >
                  Preview Creation Steps
                </Button>
              </div>

              <p className="text-muted-foreground max-w-[20rem] text-lg">
                Browse public escrows. Create, review, and manage funds
                securely.
              </p>
            </div>

            <StatusMessages />

            {/* Enhanced Modal */}
            {open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setOpen(false);
                      resetMessages();
                    }
                  }}
                  className="relative w-full max-w-2xl rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6 shadow-xl"
                >
                  <button
                    onClick={() => {
                      setOpen(false);
                      resetMessages();
                    }}
                    className="absolute top-3 right-3 text-white/70 hover:text-white"
                  >
                    ✕
                  </button>

                  <div className="mb-5 border-b border-white/10 pb-3">
                    <h2 className="text-lg font-semibold text-white/90">
                      Create New Escrow
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Set up agreement details, funding, and milestones.
                    </p>
                  </div>

                  <form
                    onSubmit={createEscrowSubmit}
                    className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
                  >
                    {/* Escrow Type Selection */}
                    <div>
                      <label className="text-muted-foreground mb-3 block text-sm font-semibold">
                        Who is this escrow for?{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setEscrowType("myself")}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${escrowType === "myself"
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                            }`}
                        >
                          <User className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">
                            Myself & Counterparty
                          </span>
                          <span className="mt-1 text-xs opacity-70">
                            Escrow between you and someone else
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEscrowType("others")}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${escrowType === "others"
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                            }`}
                        >
                          <Users className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">
                            Two Other Parties
                          </span>
                          <span className="mt-1 text-xs opacity-70">
                            Escrow between two other users
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-400/20 bg-blue-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-300">
                            Understanding Escrow Roles
                          </h4>
                          <ul className="mt-1 space-y-1 text-xs text-blue-300/80">
                            <li className="flex items-center gap-1">
                              <span className="font-medium">
                                Service Provider:
                              </span>{" "}
                              Receives funds, delivers work/service
                            </li>
                            <li className="flex items-center gap-1">
                              <span className="font-medium">
                                Service Recipient:
                              </span>{" "}
                              Pays funds into escrow, receives work/service
                            </li>
                            <li className="flex items-center gap-1 text-blue-200">
                              <span className="font-medium">⚠️ Important:</span>{" "}
                              The same party cannot be both provider and
                              recipient
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-muted-foreground text-sm">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <div className="group relative cursor-help">
                          <Info className="h-4 w-4 text-cyan-300" />
                          <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            A clear title helps both parties understand the
                            agreement scope.
                          </div>
                        </div>
                      </div>
                      <input
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                        placeholder="e.g. Website Design & Development"
                        required
                      />
                      {!form.title.trim() && (
                        <div className="mt-1 text-xs text-red-400">
                          Please enter a title
                        </div>
                      )}
                    </div>

                    {/* Type and Payer */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="relative flex w-full flex-col gap-2"
                        ref={typeRef}
                      >
                        <label className="text-muted-foreground text-sm">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <div
                          onClick={() => setIsTypeOpen((prev) => !prev)}
                          className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400/40"
                        >
                          <span>
                            {form.type
                              ? typeOptions.find((t) => t.value === form.type)
                                ?.label
                              : "Select Type"}
                          </span>
                          <ChevronDown
                            className={`transition-transform ${isTypeOpen ? "rotate-180" : ""
                              }`}
                          />
                        </div>
                        {isTypeOpen && (
                          <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                            {typeOptions.map((option) => (
                              <div
                                key={option.value}
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    type: option.value as any,
                                  });
                                  setIsTypeOpen(false);
                                }}
                                className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                        {!form.type && (
                          <div className="mt-1 text-xs text-red-400">
                            Please select escrow type
                          </div>
                        )}
                      </div>

                      {escrowType === "myself" ? (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-muted-foreground text-sm">
                              Who Pays? <span className="text-red-500">*</span>
                            </label>
                            <div className="group relative cursor-help">
                              <Info className="h-4 w-4 text-cyan-300" />
                              <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                                The payer is the{" "}
                                <strong>service recipient</strong> who funds the
                                escrow.
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {(["me", "counterparty"] as const).map((p) => (
                              <label
                                key={p}
                                className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${form.payer === p
                                  ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                                  : "border-white/10 bg-white/5 text-white/70"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="payer"
                                  className="hidden"
                                  checked={form.payer === p}
                                  onChange={() =>
                                    setForm({ ...form, payer: p })
                                  }
                                />
                                {p === "me" ? "Me" : "Counterparty"}
                              </label>
                            ))}
                          </div>
                          {!form.payer && (
                            <div className="mt-1 text-xs text-red-400">
                              Please select who pays
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-muted-foreground text-sm">
                              Who Pays? <span className="text-red-500">*</span>
                            </label>
                            <div className="group relative cursor-help">
                              <Info className="h-4 w-4 text-cyan-300" />
                              <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                                The payer is the{" "}
                                <strong>service recipient</strong> who funds the
                                escrow.
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {(["partyA", "partyB"] as const).map((p) => (
                              <label
                                key={p}
                                className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${form.payerOther === p
                                  ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                                  : "border-white/10 bg-white/5 text-white/70"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="payerOther"
                                  className="hidden"
                                  checked={form.payerOther === p}
                                  onChange={() =>
                                    setForm({ ...form, payerOther: p })
                                  }
                                />
                                {p === "partyA"
                                  ? "First Party"
                                  : "Second Party"}
                              </label>
                            ))}
                          </div>
                          {!form.payerOther && (
                            <div className="mt-1 text-xs text-red-400">
                              Please select who pays
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Parties based on escrow type */}
                    {escrowType === "myself" ? (
                      <div>
                        <label className="text-muted-foreground mb-2 block text-sm">
                          Counterparty <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={form.counterparty}
                          onChange={(e) =>
                            setForm({ ...form, counterparty: e.target.value })
                          }
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="0x..."
                          required
                        />
                        {!form.counterparty.trim() && (
                          <div className="mt-1 text-xs text-red-400">
                            Please enter counterparty's wallet address
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            First Party <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={form.partyA}
                            onChange={(e) =>
                              setForm({ ...form, partyA: e.target.value })
                            }
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                            placeholder="0x..."
                            required
                          />
                          {!form.partyA.trim() && (
                            <div className="mt-1 text-xs text-red-400">
                              Please enter first party's wallet address
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            Second Party <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={form.partyB}
                            onChange={(e) =>
                              setForm({ ...form, partyB: e.target.value })
                            }
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                            placeholder="0x..."
                            required
                          />

                          {!form.partyB.trim() && (
                            <div className="mt-1 text-xs text-red-400">
                              Please enter second party's wallet address
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Token and Amount */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="relative flex w-full flex-col gap-2"
                        ref={tokenRef}
                      >
                        <label className="text-muted-foreground text-sm">
                          Payment Token <span className="text-red-500">*</span>
                        </label>
                        <div
                          onClick={() => setIsTokenOpen((prev) => !prev)}
                          className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400/40"
                        >
                          <span>
                            {form.token
                              ? tokenOptions.find((t) => t.value === form.token)
                                ?.label
                              : "Select Token"}
                          </span>
                          <ChevronDown
                            className={`transition-transform ${isTokenOpen ? "rotate-180" : ""
                              }`}
                          />
                        </div>
                        {isTokenOpen && (
                          <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                            {tokenOptions.map((option) => (
                              <div
                                key={option.value}
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    token: option.value,
                                    customTokenAddress:
                                      option.value === "custom"
                                        ? form.customTokenAddress
                                        : "",
                                  });
                                  setIsTokenOpen(false);
                                }}
                                className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                        {form.token === "custom" && (
                          <div className="mt-3">
                            <label className="text-muted-foreground mb-2 block text-sm">
                              Paste Contract Address{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={form.customTokenAddress}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  customTokenAddress: e.target.value,
                                })
                              }
                              placeholder="0x..."
                              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                              required
                            />
                          </div>
                        )}

                        {form.token === "custom" &&
                          !form.customTokenAddress.trim() && (
                            <div className="mt-1 text-xs text-red-400">
                              Please enter custom token address
                            </div>
                          )}
                        {!form.token && (
                          <div className="mt-1 text-xs text-red-400">
                            Please select payment token
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-muted-foreground mb-2 block text-sm">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.amount}
                          onChange={(e) =>
                            setForm({ ...form, amount: e.target.value })
                          }
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="1000"
                          min="0"
                          step="0.01"
                          required
                        />
                        {(!form.amount.trim() ||
                          isNaN(Number(form.amount)) ||
                          Number(form.amount) <= 0) && (
                            <div className="mt-1 text-xs text-red-400">
                              Please enter a valid amount
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Detailed Description{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                        placeholder="Describe deliverables, expectations, and terms"
                        required
                      />
                      {!form.description.trim() && (
                        <div className="mt-1 text-xs text-red-400">
                          Please enter a description
                        </div>
                      )}
                    </div>

                    {/* Evidence Upload */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Supporting Documents
                      </label>

                      <div
                        className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${isDragOver
                          ? "border-cyan-400/60 bg-cyan-500/20"
                          : "border-white/15 bg-white/5 hover:border-cyan-400/40"
                          }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <input
                          onChange={handleFileSelect}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          className="hidden"
                          id="escrow-upload"
                        />
                        <label
                          htmlFor="escrow-upload"
                          className="flex cursor-pointer flex-col items-center justify-center px-4 py-8 text-center"
                        >
                          <Upload className="mb-3 h-8 w-8 text-cyan-400" />
                          <div className="text-sm text-cyan-300">
                            {isDragOver
                              ? "Drop files here"
                              : "Click to upload or drag and drop"}
                          </div>
                          <div className="text-muted-foreground mt-1 text-xs">
                            Supports images, PDFs, and documents
                          </div>
                        </label>
                      </div>

                      {form.evidence.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-medium text-cyan-200">
                            Selected Files ({form.evidence.length})
                          </h4>
                          {form.evidence.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3"
                            >
                              <div className="flex items-center gap-3">
                                {file.type === "image" && file.preview ? (
                                  <img
                                    src={file.preview}
                                    alt={file.file.name}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                ) : (
                                  <Paperclip className="h-5 w-5 text-cyan-400" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {file.file.name}
                                  </div>
                                  <div className="text-xs text-cyan-200/70">
                                    {file.size} • {file.type}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Milestones */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Milestones (optional)
                      </label>
                      <p className="text-muted-foreground mb-2 text-xs">
                        Enter milestone lines as{" "}
                        <code>percentBP:offsetSeconds</code> (e.g.{" "}
                        <code>50:604800</code> meaning 50% at +7 days). Percent
                        values are converted to basis points automatically.
                      </p>
                      {form.milestones.map((m, idx) => (
                        <div key={idx} className="mb-2 flex gap-2">
                          <input
                            value={m}
                            onChange={(e) => {
                              const next = [...form.milestones];
                              next[idx] = e.target.value;
                              setForm({ ...form, milestones: next });
                            }}
                            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                            placeholder="percent:offsetSeconds (e.g. 50:604800)"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              const next = form.milestones.filter(
                                (_, i) => i !== idx,
                              );
                              setForm({
                                ...form,
                                milestones: next.length ? next : [""],
                              });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setForm({
                            ...form,
                            milestones: [...form.milestones, ""],
                          })
                        }
                      >
                        Add milestone
                      </Button>
                    </div>

                    {/* Deadline */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Deadline <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute top-[1.3rem] left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                        <ReactDatePicker
                          selected={deadline}
                          onChange={(date) => setDeadline(date)}
                          placeholderText="Select a date"
                          dateFormat="dd/MM/yyyy"
                          className="w-full cursor-pointer rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                          calendarClassName="!bg-cyan-700 !text-white rounded-lg border border-white/10"
                          popperClassName="z-50"
                          minDate={new Date()}
                          required
                        />
                        {!deadline && (
                          <div className="mt-1 text-xs text-red-400">
                            Please select a deadline
                          </div>
                        )}
                      </div>
                    </div>

                    {(uiError || uiSuccess) && (
                      <div className="rounded-lg border border-white/10 p-3">
                        <StatusMessages />
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                        onClick={() => {
                          toast.message("Draft saved", {
                            description: "Your escrow has been saved as draft",
                          });
                          setOpen(false);
                          resetMessages();
                        }}
                        disabled={
                          isSubmitting || isTxPending || isApprovalPending
                        }
                      >
                        Save Draft
                      </Button>
                      <Button
                        type="submit"
                        variant="neon"
                        className="neon-hover"
                        disabled={
                          isSubmitting ||
                          isTxPending ||
                          isApprovalPending ||
                          createApprovalState.isApprovingToken
                        }
                      >
                        {creationStep !== "idle" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {creationStep === "creating_backend" &&
                              "Creating Backend..."}
                            {creationStep === "awaiting_approval" &&
                              "Awaiting Approval..."}
                            {creationStep === "approving" &&
                              "Approving Token..."}
                            {creationStep === "creating_onchain" &&
                              "Creating On-Chain..."}
                            {creationStep === "waiting_confirmation" &&
                              "Waiting Confirmation..."}
                            {creationStep === "success" && "Success!"}
                            {creationStep === "error" && "Error - Retry"}
                          </>
                        ) : isSubmitting ||
                          isTxPending ||
                          isApprovalPending ||
                          createApprovalState.isApprovingToken ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {createApprovalState.isApprovingToken
                              ? "Approving..."
                              : "Creating..."}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Create Escrow
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Conditional note */}
                  {escrowType === "myself" && form.payer === "me" ? (
                    <p className="text-muted-foreground mt-4 text-xs">
                      After signing, you will be prompted to deposit{" "}
                      <span className="text-cyan-300">
                        {form.amount || "amount"} {form.token}
                      </span>{" "}
                      to activate this escrow.
                    </p>
                  ) : escrowType === "myself" &&
                    form.payer === "counterparty" ? (
                    <p className="text-muted-foreground mt-4 text-xs">
                      Counterparty will be notified to deposit funds. You can
                      sign immediately.
                    </p>
                  ) : escrowType === "others" ? (
                    <p className="text-muted-foreground mt-4 text-xs">
                      {form.payerOther === "partyA" ? form.partyA : form.partyB}{" "}
                      will be notified to deposit funds. Both parties can sign
                      immediately.
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative grow sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search escrows by title, party, or description"
                  className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white ring-0 outline-none focus:border-cyan-400/40"
                />
              </div>
              <Button
                variant="outline"
                className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                onClick={() => setSortAsc((v) => !v)}
              >
                {sortAsc ? (
                  <SortAsc className="mr-2 h-4 w-4" />
                ) : (
                  <SortDesc className="mr-2 h-4 w-4" />
                )}{" "}
                {sortAsc ? "Old → New" : "New → Old"}
              </Button>
            </div>
          </header>

          <aside className="space-y-4">
            <div className="mb-3 flex items-center justify-between"></div>

            {/* Custom Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "all",
                  label: "All",
                  count: allEscrows.length,
                },
                {
                  value: "pending",
                  label: "Pending",
                  count: allEscrows.filter((e) => e.status === "pending")
                    .length,
                },
                {
                  value: "signed",
                  label: "Signed",
                  count: allEscrows.filter((e) => e.status === "signed").length,
                },
                {
                  value: "pending_approval",
                  label: "Pending Approval",
                  count: allEscrows.filter(
                    (e) => e.status === "pending_approval",
                  ).length,
                },
                {
                  value: "completed",
                  label: "Completed",
                  count: allEscrows.filter((e) => e.status === "completed")
                    .length,
                },
                {
                  value: "disputed",
                  label: "Disputed",
                  count: allEscrows.filter((e) => e.status === "disputed")
                    .length,
                },
                {
                  value: "cancelled",
                  label: "Cancelled",
                  count: allEscrows.filter((e) => e.status === "cancelled")
                    .length,
                },
                {
                  value: "expired",
                  label: "Expired",
                  count: allEscrows.filter((e) => e.status === "expired")
                    .length,
                },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusTab(tab.value)}
                  className={`relative flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 ${statusTab === tab.value
                    ? "border border-cyan-400/30 bg-cyan-500/20 text-cyan-200 shadow-lg shadow-cyan-500/20"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    } `}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${statusTab === tab.value
                      ? "bg-cyan-400/30 text-cyan-200"
                      : "bg-white/10 text-white/60"
                      } `}
                  >
                    {tab.count}
                  </span>

                  {statusTab === tab.value && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"></div>
                  )}
                </button>
              ))}
            </div>
          </aside>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-sm text-cyan-300">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400/40"
          >
            <option className="text-black" value={10}>
              10
            </option>
            <option className="text-black" value={20}>
              20
            </option>
            <option className="text-black" value={30}>
              30
            </option>
            <option className="text-black" value={40}>
              40
            </option>
          </select>
          <span className="text-sm text-cyan-300">per page</span>
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <EscrowSkeleton key={index} />
            ))}
          </div>
        ) : escrowsWithOnChainData.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-cyan-500/10 p-6">
              <Search className="h-12 w-12 text-cyan-400/60" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white/90">
              No escrows found
            </h3>
            <p className="text-muted-foreground max-w-md text-sm">
              {query.trim() || statusTab !== "pending"
                ? "Try adjusting your search or filter criteria to find more escrows."
                : "There are no public escrows available yet. Be the first to create one!"}
            </p>
            {!query.trim() && statusTab === "pending" && (
              <Button
                variant="neon"
                className="neon-hover mt-4"
                onClick={() => setOpen(true)}
              >
                Create First Escrow
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {escrowsWithOnChainData.map((e) => (
                <Link
                  to={`/escrow/${e.id}`}
                  key={e.id}
                  className="web3-corner-border group relative rounded-3xl p-[2px]"
                >
                  <div className="flex h-full flex-col rounded-[1.4rem] bg-black/40 p-8 shadow-[0_0_40px_#00eaff20] backdrop-blur-xl transition-all duration-500 group-hover:shadow-[0_0_70px_#00eaff40]">
                    <div>
                      <div className="mb-4 min-h-[3.5rem]">
                        <h3 className="line-clamp-2 text-lg font-semibold tracking-wide text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                          {e.title}
                        </h3>
                      </div>

                      <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Payer</div>
                          <div className="text-cyan-300/90">
                            {formatWalletAddress(e.from)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Payee</div>
                          <div className="text-pink-300/90">
                            {formatWalletAddress(e.to)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Amount</div>
                          <div className="font-bold text-green-500/90">
                            {e.amount} {e.token}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="text-muted-foreground">Status</div>
                          <div className="flex flex-col gap-1">
                            <div>
                              <span
                                className={`badge w-fit ${e.status === "pending"
                                  ? "badge-yellow"
                                  : e.status === "signed"
                                    ? "badge-blue"
                                    : e.status === "pending_approval"
                                      ? "badge-orange"
                                      : e.status === "completed"
                                        ? "badge-green"
                                        : e.status === "disputed"
                                          ? "badge-purple"
                                          : e.status === "cancelled"
                                            ? "badge-red"
                                            : e.status === "expired"
                                              ? "badge-gray"
                                              : "badge-orange"
                                  }`}
                              >
                                {e.status === "pending_approval"
                                  ? "Pending Approval"
                                  : e.status.charAt(0).toUpperCase() +
                                  e.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 min-h-[2.5rem]">
                      <p className="line-clamp-2 text-sm text-gray-300/70">
                        {e.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-muted-foreground text-xs">
                        {e.onChainDeadline ? (
                          <>
                            Deadline:{" "}
                            {new Date(
                              Number(e.onChainDeadline) * 1000,
                            ).toLocaleDateString()}
                          </>
                        ) : (
                          <>Deadline: {e.deadline}</>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {!loading && totalEscrows > 0 && (
              <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
                <div className="text-sm whitespace-nowrap text-cyan-300">
                  Showing {startItem} to {endItem} of {filteredEscrows.length}{" "}
                  escrows
                </div>

                <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="order-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">
                      Previous
                    </span>
                  </Button>

                  {/* Page Numbers - Hide on very small screens, show on sm+ */}
                  <div className="xs:flex order-3 hidden items-center gap-1 sm:order-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "neon" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`${currentPage === pageNum
                            ? "neon-hover"
                            : "border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                            } h-8 min-w-[2rem] px-2 text-xs sm:h-9 sm:min-w-[2.5rem] sm:px-3 sm:text-sm`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Current Page Indicator (for very small screens) */}
                  <div className="xs:hidden order-2 text-sm text-cyan-300 sm:order-3">
                    Page {currentPage} of {totalPages}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="order-4 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-4"
                  >
                    <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
