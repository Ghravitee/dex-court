// src/pages/Escrow.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useRef, useEffect } from "react";
// import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
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
  useChainId,
  useContractReads,
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import { ESCROW_ABI, ESCROW_CA, ERC20_ABI, ZERO_ADDRESS } from "../web3/config";
import { agreementService } from "../services/agreementServices";
import { cleanTelegramUsername } from "../lib/usernameUtils";
import { useAgreementsWithDetailsAndFundsFilter } from "../hooks/useAgreementsWithDetails";

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

// Helper function to extract transaction hash from description
const extractTxHashFromDescription = (
  description: string,
): string | undefined => {
  const match = description?.match(/Transaction Hash: (0x[a-fA-F0-9]{64})/);
  return match?.[1];
};

// Helper function to extract on-chain ID from description
// const extractOnChainIdFromDescription = (
//   description: string,
// ): string | undefined => {
//   const match = description?.match(/Contract Agreement ID: (\d+)/);
//   return match?.[1];
// };

const extractServiceProviderFromDescription = (
  description: string,
): string | undefined => {
  const match = description?.match(/Service Provider: (0x[a-fA-F0-9]{40})/i);
  return match?.[1];
};

// Helper function to extract service recipient from description
const extractServiceRecipientFromDescription = (
  description: string,
): string | undefined => {
  const match = description?.match(/Service Recipient: (0x[a-fA-F0-9]{40})/i);
  return match?.[1];
};

// Add this helper function near the top of your component
function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
    const n = Number(value);
    if (!Number.isNaN(n)) return n !== 0;
  }
  return false;
}

// Helper function to format wallet addresses for display
const formatWalletAddress = (address: string): string => {
  if (!address) return "@unknown";

  // If it's already a short format like "@you" or Telegram handle, return as is
  if (address.startsWith("@") || address.length <= 15) {
    return address;
  }

  // If it's a wallet address (0x...), slice it
  if (address.startsWith("0x") && address.length === 42) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Return original for any other case
  return address;
};

const normalizeAddress = (address: string): string => {
  if (!address) return "";
  return address.toLowerCase();
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
  | "frozen"
  | "disputed"
  | "pending_approval"
  | "pending_delivery";

// Create a base type without the status conflict
type ExtendedEscrowBase = Omit<ExtendedEscrow, "status">;

// Extended Escrow type to include on-chain data
interface ExtendedEscrowWithOnChain extends ExtendedEscrowBase {
  txHash?: string;
  onChainId?: string;
  // whether the API/agreement included funds metadata ("yes" | "no")
  includeFunds?: "yes" | "no";
  // whether this agreement uses the escrow contract on-chain
  useEscrow?: boolean;
  // optional escrow contract address returned/stored by API
  escrowAddress?: string;
  // optional UI-side marker for create form type
  escrowType?: EscrowType;
  // Use the expanded status type
  status: EscrowStatus;
}

// Enhanced interface for on-chain escrow data
interface OnChainEscrowData extends ExtendedEscrowWithOnChain {
  onChainStatus: EscrowStatus;
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

function isValidAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
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
      return "cancelled"; // EXPIRED
    default:
      return "pending";
  }
};

// Enhanced transform function for escrow agreements
// Enhanced transform function for escrow agreements
const transformApiAgreementToEscrow = (
  apiAgreement: any,
): ExtendedEscrowWithOnChain => {
  // Extract from on-chain metadata in description - this is the most reliable source
  const serviceProvider = extractServiceProviderFromDescription(
    apiAgreement.description,
  );
  const serviceRecipient = extractServiceRecipientFromDescription(
    apiAgreement.description,
  );

  // Fallback to API party data if description extraction fails
  const getPartyIdentifier = (party: any): string => {
    // Try multiple possible field names
    return (
      party?.walletAddress ||
      party?.wallet || // This might be the correct field name
      party?.WalletAddress ||
      cleanTelegramUsername(party?.telegramUsername) ||
      "@unknown"
    );
  };

  const fallbackServiceProvider = getPartyIdentifier(apiAgreement.firstParty);
  const fallbackServiceRecipient = getPartyIdentifier(
    apiAgreement.counterParty,
  );

  // Use extracted addresses first, fallback to API data
  const finalServiceProvider = serviceProvider || fallbackServiceProvider;
  const finalServiceRecipient = serviceRecipient || fallbackServiceRecipient;

  const includeFunds = apiAgreement.includesFunds ? "yes" : "no";
  const useEscrow = apiAgreement.hasSecuredFunds;

  // Use the contractAgreementId from the API response directly
  const onChainId = apiAgreement.contractAgreementId;

  return {
    id: `${apiAgreement.id}`,
    title: apiAgreement.title,
    from: finalServiceRecipient, // Service Recipient = Payer (sends funds)
    to: finalServiceProvider, // Service Provider = Payee (receives funds)
    token: apiAgreement.tokenSymbol || "ETH",
    amount: apiAgreement.amount ? parseFloat(apiAgreement.amount) : 0,
    // Note: We'll override this status with on-chain data when available
    status: mapAgreementStatusToEscrow(apiAgreement.status),
    deadline: apiAgreement.deadline
      ? new Date(apiAgreement.deadline).toISOString().split("T")[0]
      : "No deadline",
    type: apiAgreement.visibility === 1 ? "private" : "public",
    description: apiAgreement.description || "",
    createdAt: new Date(
      apiAgreement.dateCreated || apiAgreement.createdAt,
    ).getTime(),
    // On-chain references - use the direct contractAgreementId from API
    txHash: extractTxHashFromDescription(apiAgreement.description),
    onChainId: onChainId, // Use the direct contractAgreementId from API
    includeFunds: includeFunds,
    useEscrow: useEscrow,
    escrowAddress: apiAgreement.escrowContractAddress,
  };
};

export default function Escrow() {
  const [, setEscrows] = useState<ExtendedEscrowWithOnChain[]>([]);
  const [statusTab, setStatusTab] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState("");
  // Removed unused loading state

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTxHash, setLastSyncedTxHash] = useState<string | null>(null);

  // ---------- wagmi / on-chain state ----------
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress =
    (chainId && ESCROW_CA[chainId as number]) || undefined;

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
  const {
    data: agreementsWithSecuredFunds,
    isLoading: agreementsLoading,
    error: agreementsError,
    refetch: refetchAgreements,
  } = useAgreementsWithDetailsAndFundsFilter({
    includesFunds: true,
    hasSecuredFunds: true,
  });

  // Enhanced error handling for contract errors
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Custom hook to fetch on-chain data for agreements
  // Custom hook to fetch on-chain data for agreements
  const useOnChainAgreementData = (agreements: any[]) => {
    const chainId = useChainId();
    const contractAddress =
      (chainId && ESCROW_CA[chainId as number]) || undefined;

    // Create contract calls for each agreement that has a contractAgreementId
    const contracts = useMemo(() => {
      return agreements
        .filter((agreement) => {
          const contractAgreementId = agreement.contractAgreementId;
          return contractAgreementId && contractAddress;
        })
        .map((agreement) => {
          const contractAgreementId = agreement.contractAgreementId;
          return {
            address: contractAddress as `0x${string}`,
            abi: ESCROW_ABI.abi,
            functionName: "getAgreement" as const,
            args: [BigInt(contractAgreementId)],
          };
        });
    }, [agreements, contractAddress]);

    // Fetch on-chain data
    const { data: onChainData, isLoading } = useContractReads({
      contracts,
      query: {
        enabled: contracts.length > 0,
      },
    });

    return { onChainData, isLoading };
  };

  // Replace the useEffect that loads escrows
  useEffect(() => {
    if (agreementsWithSecuredFunds) {
      console.log(
        "📥 Loaded agreements with secured funds:",
        agreementsWithSecuredFunds,
      );

      const escrowAgreements = agreementsWithSecuredFunds
        .filter((agreement: any) => agreement.type === AgreementTypeEnum.ESCROW)
        .map(transformApiAgreementToEscrow);

      console.log("📊 Transformed escrow agreements:", escrowAgreements);
      setEscrows(escrowAgreements);
    }
  }, [agreementsWithSecuredFunds]);

  // Also handle loading and error states
  useEffect(() => {
    if (agreementsError) {
      console.error("Failed to load escrows:", agreementsError);
      toast.error("Failed to load escrows from backend");
      setEscrows([]);
    }
  }, [agreementsError]);

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
      // Extract the actual revert reason if available
      const revertMatch = errorMessage.match(
        /execution reverted: (.+?)(?="|$)/,
      );
      if (revertMatch && revertMatch[1]) {
        return `Contract reverted: ${revertMatch[1]}`;
      }
      return "Transaction reverted by contract";
    }

    // Generic error fallback
    return `Blockchain error: ${errorMessage.substring(0, 100)}...`;
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

  // Extract on-chain IDs from agreements
  // const agreementIds = useMemo(() => {
  //   if (!agreementsWithSecuredFunds) return [];
  //   return agreementsWithSecuredFunds
  //     .filter((agreement: any) => agreement.type === AgreementTypeEnum.ESCROW)
  //     .map((agreement: any) => agreement.description || "");
  // }, [agreementsWithSecuredFunds]);

  // Filter and transform escrow agreements
  const escrowAgreements = useMemo(() => {
    if (!agreementsWithSecuredFunds) return [];

    return agreementsWithSecuredFunds
      .filter((agreement: any) => agreement.type === AgreementTypeEnum.ESCROW)
      .map(transformApiAgreementToEscrow);
  }, [agreementsWithSecuredFunds]);

  const { onChainData } = useOnChainAgreementData(
    agreementsWithSecuredFunds?.filter(
      (agreement: any) => agreement.type === AgreementTypeEnum.ESCROW,
    ) || [],
  );

  // Merge API data with on-chain data
  // Merge API data with on-chain data
  useEffect(() => {
    if (escrowAgreements.length > 0) {
      console.log("📥 Loaded escrow agreements:", escrowAgreements);

      // If we have on-chain data, merge it
      if (onChainData && onChainData.length > 0) {
        console.log("📦 On-chain data received:", onChainData);

        // In your useEffect where you merge data:
        const mergedEscrows = escrowAgreements
          .map((escrow, index) => {
            const onChainAgreement = onChainData[index];

            if (onChainAgreement && onChainAgreement.status === "success") {
              const agreementData = [
                ...(onChainAgreement.result as readonly any[]),
              ];

              console.log(
                `🔗 Merging on-chain data for escrow ${escrow.id}:`,
                agreementData,
              );

              // Map the array indices to meaningful properties
              const onChainStatus = mapOnChainStatusFromArray(agreementData);

              return {
                ...escrow,
                // OVERRIDE status with on-chain status
                status: onChainStatus,
                onChainStatus: onChainStatus,
                onChainAmount: agreementData[5]?.toString(), // amount at index 5
                onChainDeadline: Number(agreementData[8]), // deadline at index 8
                onChainParties: {
                  serviceProvider: agreementData[2], // serviceProvider at index 2
                  serviceRecipient: agreementData[3], // serviceRecipient at index 3
                },
                onChainToken: agreementData[4], // token at index 4
                isOnChainActive: toBool(agreementData[15]), // signed at index 15
                isFunded: toBool(agreementData[14]), // funded at index 14
                isSigned: toBool(agreementData[15]), // signed at index 15
                isCompleted: toBool(agreementData[18]), // completed at index 18
                isDisputed: toBool(agreementData[19]), // disputed at index 19
                isCancelled: toBool(agreementData[23]), // orderCancelled at index 23
                isFrozen: toBool(agreementData[21]), // frozen at index 21
                deliverySubmitted: toBool(agreementData[25]), // deliverySubmited at index 25
                lastUpdated: Date.now(),
              } as OnChainEscrowData;
            }

            return null;
          })
          .filter(Boolean) as OnChainEscrowData[]; // Simple filter and cast

        console.log("✅ Merged escrows with on-chain data:", mergedEscrows);
        setEscrowsWithOnChainData(mergedEscrows);
      } else {
        console.log("⚠️ No on-chain data available");
        setEscrowsWithOnChainData([]); // Empty array since we only want on-chain data
      }
    }
  }, [escrowAgreements, onChainData]);
  // Enhanced status mapping for on-chain agreements
  // Enhanced status mapping for on-chain agreements
  // Enhanced status mapping for on-chain agreements
  const mapOnChainStatusFromArray = (agreementData: any[]): EscrowStatus => {
    if (!agreementData || !Array.isArray(agreementData)) return "pending";

    // Extract the key boolean flags using the indices from normalizeAgreement
    const isSigned = toBool(agreementData[15]); // signed flag (index 15)
    const isCompleted = toBool(agreementData[18]); // completed flag (index 18)
    const isDisputed = toBool(agreementData[19]); // disputed flag (index 19)
    const isCancelled = toBool(agreementData[23]); // orderCancelled flag (index 23)
    const isFrozen = toBool(agreementData[21]); // frozen flag (index 21)
    const deliverySubmitted = toBool(agreementData[25]); // deliverySubmited flag (index 25)

    // Order of precedence based on contract state
    if (isCompleted) return "completed";
    if (isDisputed) return "disputed";
    if (isCancelled) return "cancelled";
    if (isFrozen) return "frozen";

    if (isSigned) {
      if (deliverySubmitted) {
        return "pending_approval"; // Work submitted, waiting for Service Recipient approval
      }
      return "signed"; // This means "pending delivery" - Service Provider needs to deliver
    }

    return "pending"; // Agreement not signed yet
  };

  // Simplified listing logic - now status field contains on-chain data when available
  // Update the listed filter logic to include "all"
  // Filter to show only escrows with on-chain data
  const listed = escrowsWithOnChainData
    .filter((e) => {
      // Only show if we have on-chain status
      return e.onChainStatus !== undefined;
    })
    .filter((e) => e.type === "public")
    // In your filter logic (lines 452-478), update the "pending" case:
    // In your filter logic, update the pending tab to only show truly pending (not signed)
    .filter((e) => {
      switch (statusTab) {
        case "all":
          return true;
        case "pending":
          // Only show truly pending (not signed yet)
          return e.onChainStatus === "pending";
        case "signed":
          // Show signed (which means pending delivery)
          return e.onChainStatus === "signed";
        case "pending_approval":
          // Show pending approval (delivery submitted)
          return e.onChainStatus === "pending_approval";
        case "completed":
          return e.onChainStatus === "completed";
        case "disputed":
          return e.onChainStatus === "disputed";
        case "cancelled":
          return e.onChainStatus === "cancelled";
        default:
          return true;
      }
    })
    .filter((e) =>
      query.trim()
        ? e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.description.toLowerCase().includes(query.toLowerCase()) ||
          e.from.toLowerCase().includes(query.toLowerCase()) ||
          e.to.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .sort((a, b) =>
      sortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt,
    );
  console.log("🔍 Listed escrows after filtering and sorting:", listed);

  // ---------- UI state (unchanged) ----------
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

  // File handlers (unchanged)
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

  // ---------- On-chain helpers (follow sample patterns) ----------
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
  // Only attempt to read decimals for a valid customTokenAddress
  const { data: createTokenDecimals } = useReadContract({
    address: isValidAddress(form.customTokenAddress)
      ? (form.customTokenAddress as `0x${string}`)
      : undefined,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
    query: { enabled: isValidAddress(form.customTokenAddress) },
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
  // Store pending create payload to invoke after approval
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
      // Call createAgreement with the stored payload
      try {
        writeContract(pendingCreatePayload);
        setCreateApprovalState({
          isApprovingToken: false,
          needsApproval: false,
        });
        setPendingCreatePayload(null);
        setUiSuccess("Approval confirmed — creating agreement now");
      } catch (err) {
        console.error("auto-create after approval failed", err);
        setUiError("Failed to create agreement after approval");
      }
    }
  }, [
    approvalSuccess,
    createApprovalState.needsApproval,
    pendingCreatePayload,
    writeContract,
  ]);

  // Ref to store sync data
  const syncDataRef = useRef<{
    agreementIdNumber: number;
    serviceProviderAddr: string;
    serviceRecipientAddr: string;
    tokenAddr: string;
    vestingMode: boolean;
  } | null>(null);

  // 6. Load escrows on component mount

  useEffect(() => {
    // Replace your current syncEscrowToBackend function with this enhanced version
    const syncEscrowToBackend = async () => {
      if (
        !txSuccess ||
        !txHash ||
        txHash === lastSyncedTxHash ||
        isSyncing ||
        !syncDataRef.current
      ) {
        return;
      }

      setIsSyncing(true);
      setLastSyncedTxHash(txHash);

      let normalizedServiceProvider = "";
      let normalizedServiceRecipient = "";

      try {
        const {
          agreementIdNumber,
          serviceProviderAddr,
          serviceRecipientAddr,
          tokenAddr,
          vestingMode,
        } = syncDataRef.current;

        console.log("🔄 Syncing escrow to backend...", {
          txHash,
          agreementId: agreementIdNumber,
        });

        // ===== NORMALIZE ADDRESSES FOR BACKEND =====
        normalizedServiceProvider = normalizeAddress(serviceProviderAddr);
        normalizedServiceRecipient = normalizeAddress(serviceRecipientAddr);
        // const normalizedTokenAddr = normalizeAddress(tokenAddr);
        // const normalizedTokenAddr = normalizeAddress(tokenAddr);

        // ===== VALIDATE PARTIES =====
        if (normalizedServiceProvider === normalizedServiceRecipient) {
          throw new Error(
            "Service provider and recipient cannot be the same address",
          );
        }

        // ===== BUILD ON-CHAIN METADATA =====
        const onChainMetadata = {
          txHash,
          contractId: agreementIdNumber,
          serviceProvider: normalizedServiceProvider, // Use normalized address
          serviceRecipient: normalizedServiceRecipient, // Use normalized address
          token: tokenAddr,
          amount: form.amount,
          vestingMode,
          chainId: chainId,
          createdAt: new Date().toISOString(),
        };

        // Embed metadata in description for easy extraction later
        const metadataString = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ON-CHAIN ESCROW DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transaction Hash: ${txHash}
Contract Agreement ID: ${agreementIdNumber}
Service Provider: ${serviceProviderAddr}
Service Recipient: ${serviceRecipientAddr}
Token Address: ${tokenAddr}
Amount: ${form.amount}
Vesting Enabled: ${vestingMode}
Chain ID: ${chainId}
Created: ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        const fullDescription = form.description + metadataString;

        // ===== PREPARE FILES =====
        let filesToUpload: File[];

        if (form.evidence.length > 0) {
          filesToUpload = form.evidence.map((f) => f.file);
        } else {
          // Create metadata file (backend requires at least 1 file)
          const metadataJson = JSON.stringify(onChainMetadata, null, 2);
          const metadataFile = new File(
            [metadataJson],
            `escrow-${agreementIdNumber}.json`,
            { type: "application/json" },
          );
          filesToUpload = [metadataFile];
        }

        // ===== DETERMINE PARTIES FOR BACKEND =====
        // Backend needs: firstParty = service provider, counterParty = service recipient
        let firstPartyAddr: string;
        let counterPartyAddr: string;

        if (escrowType === "myself") {
          if (form.payer === "me") {
            // Creator pays - creator is service recipient, counterparty is service provider
            // FIXED: Make connected address firstParty (service provider) and counterparty counterParty (service recipient)
            firstPartyAddr = address!.toLowerCase(); // Service provider (creator)
            counterPartyAddr = normalizedServiceProvider; // Service recipient (counterparty)
          } else {
            // Counterparty pays - creator is service provider, counterparty is service recipient
            firstPartyAddr = address!.toLowerCase(); // Service provider (creator)
            counterPartyAddr = normalizedServiceRecipient; // Service recipient (counterparty)
          }
        } else {
          // Two other parties - creator is not involved as a party
          if (form.payerOther === "partyA") {
            firstPartyAddr = form.partyB.toLowerCase();
            counterPartyAddr = form.partyA.toLowerCase();
          } else {
            firstPartyAddr = form.partyA.toLowerCase();
            counterPartyAddr = form.partyB.toLowerCase();
          }
        }

        console.log("🔍 CREATOR PARTY ASSIGNMENT:", {
          creatorAddress: address!.toLowerCase(),
          firstParty: firstPartyAddr,
          counterParty: counterPartyAddr,
          isCreatorFirstParty: firstPartyAddr === address!.toLowerCase(),
          isCreatorCounterParty: counterPartyAddr === address!.toLowerCase(),
          escrowType,
          payer: form.payer,
        });

        console.log("🎯 Party Assignment:", {
          firstParty: firstPartyAddr,
          counterParty: counterPartyAddr,
          serviceProvider: normalizedServiceProvider,
          serviceRecipient: normalizedServiceRecipient,
          areEqual: firstPartyAddr === counterPartyAddr,
        });

        console.log("🔍 Final Party Assignment for Backend:", {
          firstParty: firstPartyAddr,
          counterParty: counterPartyAddr,
          areEqual: firstPartyAddr === counterPartyAddr,
          firstPartyLower: firstPartyAddr.toLowerCase(),
          counterPartyLower: counterPartyAddr.toLowerCase(),
        });

        // Add this new validation
        if (firstPartyAddr.toLowerCase() === counterPartyAddr.toLowerCase()) {
          throw new Error(
            "Service provider and recipient cannot be the same address",
          );
        }

        // Convert the deadline Date object to ISO string for backend
        const deadlineForBackend = deadline?.toISOString();

        if (!deadlineForBackend) {
          throw new Error("Deadline is required");
        }

        console.log("📋 Escrow agreement data for backend:", {
          firstParty: firstPartyAddr,
          counterParty: counterPartyAddr,
          normalizedFirstParty: firstPartyAddr,
          normalizedCounterParty: counterPartyAddr,
          type: AgreementTypeEnum.ESCROW,
          visibility:
            form.type === "private"
              ? AgreementVisibilityEnum.PRIVATE
              : AgreementVisibilityEnum.PUBLIC,
          deadline: deadlineForBackend,
          includesFunds: true,
          secureTheFunds: true,
        });

        // ===== CALL AGREEMENT API =====
        await agreementService.createAgreement(
          {
            title: form.title,
            description: fullDescription,
            type: AgreementTypeEnum.ESCROW, // 2 = ESCROW
            visibility:
              form.type === "private"
                ? AgreementVisibilityEnum.PRIVATE
                : AgreementVisibilityEnum.PUBLIC,
            firstParty: firstPartyAddr,
            counterParty: counterPartyAddr,
            deadline: deadlineForBackend,
            amount: parseFloat(form.amount),
            tokenSymbol: form.token === "custom" ? "custom" : form.token,
            contractAddress:
              form.token === "custom" ? form.customTokenAddress : undefined,
            includesFunds: true, // Always true for escrow
            secureTheFunds: true, // Always true for escrow
            chainId: chainId,
            contractAgreementId: agreementIdNumber.toString(),
            txHash: txHash,
          },
          filesToUpload,
        );

        // ===== SUCCESS =====
        console.log("✅ Escrow synced successfully!");

        setUiSuccess("✅ Escrow created and synced to database!");

        toast.success("Escrow Created Successfully!", {
          description: `Transaction confirmed. Both parties will receive Telegram notifications.`,
        });

        // Close modal and reset
        setTimeout(() => {
          setOpen(false);
          resetForm();
          refetchAgreements();
        }, 1500);
      } catch (err: any) {
        console.error("❌ Backend sync failed:", err);
        handleBackendSyncError(
          err,
          txHash!,
          normalizedServiceProvider,
          normalizedServiceRecipient,
        );
      } finally {
        setIsSyncing(false);
        resetWrite();
        syncDataRef.current = null;
      }
    };

    // Enhanced error handler for backend sync
    const handleBackendSyncError = (
      err: any,
      txHash: string,
      normalizedServiceProvider: string,
      normalizedServiceRecipient: string,
    ) => {
      const errorCode = err.response?.data?.error;
      const errorMessage = err.response?.data?.message;
      const errorDetails = err.response?.data?.details;

      console.error("🔍 Backend Error Details:", {
        errorCode,
        errorMessage,
        errorDetails,
        responseData: err.response?.data,
        status: err.response?.status,
      });

      let userMessage = "Failed to sync escrow to database";
      let userDescription =
        errorMessage || "Please try again or contact support";

      switch (errorCode) {
        case 1: // MissingData
          userMessage = "Missing required information";
          userDescription = "Please ensure all fields are filled correctly";
          break;

        case 5: // InvalidDate
          userMessage = "Invalid deadline";
          userDescription = "Deadline must be a future date";
          break;

        case 7: // AccountNotFound
          userMessage = "User account not found";
          userDescription = `One or both parties must connect their wallet to the platform first. Please ask them to visit the app and connect their wallet.`;
          // Log which addresses are problematic
          console.error("🔍 AccountNotFound - Check addresses:", {
            firstParty: normalizedServiceProvider,
            counterParty: normalizedServiceRecipient,
            accountsInSystem: [
              "0xa008df6bf68f4051b3f664ef6df86edb97a177cb", // Mystyri
              "0x30398368287d2fe4a697238fa815f49c123ce300", // Ghravitee
            ],
          });
          break;

        case 11: // SameAccount
          userMessage = "Invalid party configuration";
          userDescription =
            "Service provider and recipient cannot be the same account. Please ensure both parties have registered accounts.";
          // Log the addresses being compared
          console.error("🔍 SameAccount Error - Addresses:", {
            firstParty: normalizedServiceProvider,
            counterParty: normalizedServiceRecipient,
            areEqual: normalizedServiceProvider === normalizedServiceRecipient,
          });
          break;

        case 12: // MissingWallet
          userMessage = "Wallet not connected";
          userDescription =
            "Your wallet must be connected to create escrow agreements";
          break;

        case 17: // Forbidden
          userMessage = "Account restricted";
          userDescription =
            "Your account is currently restricted from creating agreements";
          break;
      }

      setUiError(`⚠️ ${userMessage}`);

      toast.error(userMessage, {
        description: userDescription,
        action: {
          label: "Copy Transaction Hash",
          onClick: () => {
            navigator.clipboard.writeText(txHash);
            toast.info("Transaction hash copied!");
          },
        },
      });
    };

    // Reset form function
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

    syncEscrowToBackend();
  }, [
    txSuccess,
    txHash,
    lastSyncedTxHash,
    isSyncing,
    form.amount,
    form.description,
    form.evidence,
    form.type,
    form.title,
    form.token,
    form.customTokenAddress,
    form.payer,
    form.counterparty,
    form.payerOther,
    form.partyB,
    form.partyA,
    escrowType,
    deadline,
    address,
    resetWrite,
    refetchAgreements,
    chainId,
  ]);

  // ---------------- Create agreement handler (with enhanced error handling) ----------------
  const handleCreateAgreementOnChain = async () => {
    resetMessages();

    if (!contractAddress) {
      setUiError("Unsupported chain or contract not configured");
      return;
    }
    if (!isConnected) {
      setUiError("Connect your wallet");
      return;
    }
    if (!form.title) {
      setUiError("Title required");
      return;
    }
    if (!form.type) {
      setUiError("Type required");
      return;
    }
    if (!deadline) {
      setUiError("Deadline required");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setUiError("Amount must be > 0");
      return;
    }

    // Determine parties
    let serviceProviderAddr = "";
    let serviceRecipientAddr = "";
    if (escrowType === "myself") {
      if (!isValidAddress(form.counterparty)) {
        setUiError("Counterparty must be a valid address (0x...)");
        return;
      }
      if (form.payer === "me") {
        serviceRecipientAddr = address!;
        serviceProviderAddr = form.counterparty;
      } else {
        serviceProviderAddr = address!;
        serviceRecipientAddr = form.counterparty;
      }
    } else {
      if (!isValidAddress(form.partyA) || !isValidAddress(form.partyB)) {
        setUiError("Both parties must be valid addresses");
        return;
      }
      if (form.payerOther === "partyA") {
        serviceRecipientAddr = form.partyA;
        serviceProviderAddr = form.partyB;
      } else {
        serviceRecipientAddr = form.partyB;
        serviceProviderAddr = form.partyA;
      }
    }

    // Check for same address error (contract will revert with CannotBeTheSame)
    if (
      serviceProviderAddr.toLowerCase() === serviceRecipientAddr.toLowerCase()
    ) {
      setUiError("Service provider and recipient cannot be the same address");
      return;
    }

    // token parsing
    let tokenAddr: string = ZERO_ADDRESS;
    if (form.token === "custom") {
      if (!isValidAddress(form.customTokenAddress)) {
        setUiError("Custom token must be a valid address");
        return;
      }
      tokenAddr = form.customTokenAddress;
    } else if (form.token === "ETH") {
      tokenAddr = ZERO_ADDRESS;
    } else {
      // For known tokens like USDC/DAI the UI currently expects a custom address to be pasted
      if (
        !form.customTokenAddress ||
        !isValidAddress(form.customTokenAddress)
      ) {
        setUiError(
          `${form.token} selected — paste its contract address in Custom Token field`,
        );
        return;
      }
      tokenAddr = form.customTokenAddress;
    }

    // deadlineDuration
    const now = Math.floor(Date.now() / 1000);
    const deadlineSeconds = Math.floor((deadline as Date).getTime() / 1000);
    if (deadlineSeconds <= now) {
      setUiError("Deadline must be in the future");
      return;
    }
    const deadlineDuration = deadlineSeconds - now;

    // parse milestones
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
          return;
        }
      }
    } catch (err: any) {
      setUiError(err.message || "Invalid milestones");
      return;
    }

    // amount BN
    let amountBN: bigint;
    try {
      amountBN = parseAmount(
        form.amount,
        tokenAddr,
        form.tokenDecimals,
      ) as bigint;
      if (amountBN <= 0n) {
        setUiError("Parsed amount invalid");
        return;
      }
    } catch (err) {
      console.error("parse amount error", err);
      setUiError("Invalid amount format");
      return;
    }

    // Agreement id: random
    const agreementIdNumber = Number(Math.floor(Math.random() * 1_000_000_000));

    const callerIsDepositor =
      serviceRecipientAddr.toLowerCase() === address?.toLowerCase();
    const tokenIsETH = tokenAddr === ZERO_ADDRESS;

    // Store sync data for backend integration
    syncDataRef.current = {
      agreementIdNumber,
      serviceProviderAddr,
      serviceRecipientAddr,
      tokenAddr,
      vestingMode,
    };

    // If ERC20 and caller is depositor (serviceRecipient), we must approve token first
    if (!tokenIsETH && callerIsDepositor) {
      setCreateApprovalState({ isApprovingToken: true, needsApproval: true });

      // build the create payload and store it so we can call it after approval
      const milestonePercsBN = milestonePercs.map((p) => BigInt(p));
      const milestoneOffsetsBN = milestoneOffsets.map((o) => BigInt(o));

      const payload = {
        address: contractAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "createAgreement",
        args: [
          BigInt(agreementIdNumber),
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

      // Trigger approval tx
      try {
        writeApproval({
          address: tokenAddr as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: "approve",
          args: [contractAddress as `0x${string}`, amountBN],
        });
        setUiSuccess(
          "Approval submitted; will create agreement after confirmation",
        );
      } catch (err) {
        console.error("approve error", err);
        setUiError("ERC20 approve failed");
        setCreateApprovalState({
          isApprovingToken: false,
          needsApproval: false,
        });
        setPendingCreatePayload(null);
      }

      return;
    }

    // Otherwise call createAgreement directly
    try {
      const milestonePercsBN = milestonePercs.map((p) => BigInt(p));
      const milestoneOffsetsBN = milestoneOffsets.map((o) => BigInt(o));

      const valueToSend = tokenIsETH && callerIsDepositor ? amountBN : 0n;

      writeContract({
        address: contractAddress as `0x${string}`,
        abi: ESCROW_ABI.abi,
        functionName: "createAgreement",
        args: [
          BigInt(agreementIdNumber),
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

      setUiSuccess("CreateAgreement tx submitted — check wallet");

      // optimistic UI add (mirror prior mock behavior)
      const id = `E-${agreementIdNumber}`;
      const from = callerIsDepositor ? "@you" : serviceProviderAddr;
      const to = callerIsDepositor ? serviceProviderAddr : "@you";
      const next: ExtendedEscrowWithOnChain = {
        id,
        title: form.title,
        from,
        to,
        token: form.token === "custom" ? form.customTokenAddress : form.token,
        amount: Number(form.amount),
        status: callerIsDepositor ? "signed" : "pending",
        deadline: (deadline as Date).toISOString().split("T")[0],
        type: form.type as "public" | "private",
        description: form.description,
        createdAt: Date.now(),
        escrowType,
      };
      setEscrows((arr) => [next, ...arr]);
      // setOpen(false);
    } catch (err: any) {
      console.error("createAgreement error:", err);
      // Error will be handled by the useEffect that monitors writeError
    }
  };

  // Wrapper for modal submit: prefer on-chain if wallet connected, otherwise fallback to mock
  const createEscrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    // local validations (same as original)
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
      // if wallet connected and contract configured — do on-chain flow
      if (isConnected && contractAddress) {
        await handleCreateAgreementOnChain();
        setIsSubmitting(false);
        return;
      }

      // fallback mock (existing behavior)
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

      setEscrows((arr) => [next, ...arr]);
      setOpen(false);

      const successMessage =
        escrowType === "myself"
          ? `Escrow created between you and ${form.counterparty}`
          : `Escrow created between ${form.partyA} and ${form.partyB}`;

      setUiSuccess("Escrow created successfully");
      toast.success("Escrow created successfully", {
        description: `${successMessage} • ${form.amount} ${form.token} • ${form.evidence.length} files uploaded`,
      });

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
    } catch (error) {
      setUiError("Failed to create escrow");
      toast.error("Failed to create escrow", {
        description: "Please try again later",
      });
      console.error("Failed to create escrow:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    </div>
  );

  // Temporary debug component - add it somewhere in your JSX
  // Enhanced debug component to show what's actually being loaded
  // const DebugAgreementInfo = () => {
  //   const { data, isLoading, error } = useAgreementsWithDetailsAndFundsFilter({
  //     includesFunds: true,
  //     hasSecuredFunds: true,
  //   });

  //   if (isLoading) {
  //     return <div className="text-cyan-300">Loading agreements...</div>;
  //   }

  //   if (error) {
  //     return (
  //       <div className="text-red-300">
  //         Error loading agreements: {error.message}
  //       </div>
  //     );
  //   }

  //   return (
  //     <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
  //       <h3 className="font-semibold text-yellow-300">
  //         Debug: Party Information
  //       </h3>
  //       <div className="mt-2 text-xs text-yellow-200/70">
  //         Showing {data?.length || 0} agreements with hasSecuredFunds=true
  //       </div>
  //       <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
  //         {data?.map((agreement) => {
  //           const serviceProvider = agreement.firstParty?.wallet;
  //           const serviceRecipient = agreement.counterParty?.wallet;

  //           return (
  //             <div
  //               key={agreement.id}
  //               className="border-b border-yellow-500/20 pb-2 text-xs text-yellow-200/70"
  //             >
  //               <div>
  //                 <strong>ID:</strong> {agreement.id}
  //               </div>
  //               <div>
  //                 <strong>Title:</strong> {agreement.title}
  //               </div>
  //               <div>
  //                 <strong>First Party (Service Provider = Payee):</strong>{" "}
  //                 {serviceProvider}
  //               </div>
  //               <div>
  //                 <strong>Counter Party (Service Recipient = Payer):</strong>{" "}
  //                 {serviceRecipient}
  //               </div>
  //               <div>
  //                 <strong>Displayed as:</strong> {serviceRecipient} →{" "}
  //                 {serviceProvider}
  //               </div>
  //             </div>
  //           );
  //         })}
  //       </div>
  //     </div>
  //   );
  // };

  const DebugOnChainData = () => {
    if (!onChainData) return null;

    return (
      <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
        <h3 className="font-semibold text-yellow-300">Debug: On-Chain Data</h3>
        <div className="mt-2 text-xs text-yellow-200/70">
          Contracts queried: {onChainData.length}
        </div>
        <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
          {onChainData.map((item, index) => (
            <div
              key={index}
              className="border-b border-yellow-500/20 pb-2 text-xs text-yellow-200/70"
            >
              <div>
                <strong>Status:</strong> {item.status}
              </div>
              {item.status === "success" &&
                item.result &&
                Array.isArray(item.result) && (
                  <>
                    <div>
                      <strong>ID:</strong>{" "}
                      {(item.result[0] as bigint)?.toString()}
                    </div>
                    <div>
                      <strong>Funded:</strong> {item.result[14]?.toString()}
                    </div>
                    <div>
                      <strong>Signed:</strong> {item.result[15]?.toString()}
                    </div>
                    <div>
                      <strong>Completed:</strong> {item.result[18]?.toString()}
                    </div>
                    <div>
                      <strong>Disputed:</strong> {item.result[19]?.toString()}
                    </div>
                    <div>
                      <strong>Cancelled:</strong> {item.result[21]?.toString()}
                    </div>
                  </>
                )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add <DebugAgreementInfo /> temporarily to your JSX to see what agreements are available

  return (
    <div className="relative">
      {/* Main */}
      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl"></div>

      <div className="space-y-4">
        {/* <DebugAgreementInfo /> */}
        <div className="justify-between lg:flex">
          <header className="flex flex-col gap-3">
            <div>
              <h2 className="space mb-4 text-[22px] font-semibold text-white/90">
                Escrow Center
              </h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="neon"
                  className="neon-hover mb-4 w-fit"
                  onClick={() => setOpen(true)}
                >
                  Create Escrow
                </Button>

                {/* {connectHint} */}
              </div>

              <p className="text-muted-foreground max-w-[20rem] text-lg">
                Browse public escrows. Create, review, and manage funds
                securely.
              </p>
            </div>

            {/* Display status messages */}
            <StatusMessages />

            {/* Enhanced Modal */}
            {open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div
                  onClick={(e) => {
                    // Only close if clicking the backdrop itself, not children
                    if (e.target === e.currentTarget) {
                      setOpen(false);
                      resetMessages();
                    }
                  }}
                  className="relative w-full max-w-2xl rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6 shadow-xl"
                >
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setOpen(false);
                      resetMessages();
                    }}
                    className="absolute top-3 right-3 text-white/70 hover:text-white"
                  >
                    ✕
                  </button>

                  {/* Modal Header */}
                  <div className="mb-5 border-b border-white/10 pb-3">
                    <h2 className="text-lg font-semibold text-white/90">
                      Create New Escrow
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Set up agreement details, funding, and milestones.
                    </p>
                  </div>

                  {/* Enhanced Form */}
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
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                            escrowType === "myself"
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
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                            escrowType === "others"
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
                    </div>

                    {/* Type and Payer */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Type Dropdown */}
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
                            className={`transition-transform ${
                              isTypeOpen ? "rotate-180" : ""
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
                      </div>

                      {/* Who Pays based on escrow type */}
                      {escrowType === "myself" ? (
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            Who Pays? <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["me", "counterparty"] as const).map((p) => (
                              <label
                                key={p}
                                className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${
                                  form.payer === p
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
                        </div>
                      ) : (
                        <div>
                          <label className="text-muted-foreground mb-2 block text-sm">
                            Who Pays? <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["partyA", "partyB"] as const).map((p) => (
                              <label
                                key={p}
                                className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${
                                  form.payerOther === p
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
                          placeholder="@0xHandle or address"
                          required
                        />
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
                            placeholder="@0xHandle or address"
                            required
                          />
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
                            placeholder="@0xHandle or address"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Token and Amount */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Token Dropdown with Custom Option */}
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
                            className={`transition-transform ${
                              isTokenOpen ? "rotate-180" : ""
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
                    </div>

                    {/* Evidence Upload */}
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Supporting Documents
                      </label>

                      <div
                        className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${
                          isDragOver
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
                        <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
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
                        {isSubmitting ||
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

                  {/* Conditional note (unchanged) */}
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
            {/* Custom Filter Component */}

            <div className="mb-3 flex items-center justify-between"></div>

            {/* Custom Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "all",
                  label: "All",
                  count: escrowsWithOnChainData.length,
                },
                {
                  value: "pending",
                  label: "Pending",
                  count: escrowsWithOnChainData.filter(
                    (e) => e.onChainStatus === "pending",
                  ).length,
                },
                {
                  value: "signed",
                  label: "Signed",
                  count: escrowsWithOnChainData.filter(
                    (e) => e.onChainStatus === "signed",
                  ).length,
                },

                {
                  value: "pending_approval",
                  label: "Pending Approval",
                  count: escrowsWithOnChainData.filter(
                    (e) => e.onChainStatus === "pending_approval",
                  ).length,
                },
                {
                  value: "completed",
                  label: "Completed",
                  count: escrowsWithOnChainData.filter(
                    (e) => e.onChainStatus === "completed",
                  ).length,
                },
                {
                  value: "disputed",
                  label: "Disputed",
                  count: escrowsWithOnChainData.filter(
                    (e) => e.onChainStatus === "disputed",
                  ).length,
                },
                {
                  value: "cancelled",
                  label: "Cancelled",
                  count: escrowsWithOnChainData.filter(
                    (e) => e.onChainStatus === "cancelled",
                  ).length,
                },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusTab(tab.value)}
                  className={`relative flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 ${
                    statusTab === tab.value
                      ? "border border-cyan-400/30 bg-cyan-500/20 text-cyan-200 shadow-lg shadow-cyan-500/20"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  } `}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      statusTab === tab.value
                        ? "bg-cyan-400/30 text-cyan-200"
                        : "bg-white/10 text-white/60"
                    } `}
                  >
                    {tab.count}
                  </span>

                  {/* Active indicator dot */}
                  {statusTab === tab.value && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"></div>
                  )}
                </button>
              ))}
            </div>
          </aside>
        </div>

        {agreementsLoading ? (
          // Enhanced loading state with skeleton cards
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="web3-corner-border group relative rounded-3xl p-[2px]"
              >
                <div className="h-fit rounded-[1.4rem] bg-black/40 p-8 shadow-[0_0_40px_#00eaff20] backdrop-blur-xl">
                  {/* Skeleton title */}
                  <div className="mb-4">
                    <div className="h-6 w-3/4 animate-pulse rounded-lg bg-cyan-500/20"></div>
                  </div>

                  {/* Skeleton content grid */}
                  <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i}>
                        <div className="mb-2 h-4 w-12 animate-pulse rounded bg-white/10"></div>
                        <div className="h-5 w-20 animate-pulse rounded bg-cyan-400/20"></div>
                      </div>
                    ))}
                  </div>

                  {/* Skeleton description */}
                  <div className="mt-4">
                    <div className="mb-2 h-4 w-full animate-pulse rounded bg-white/10"></div>
                    <div className="h-4 w-2/3 animate-pulse rounded bg-white/10"></div>
                  </div>

                  {/* Skeleton footer */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-white/10"></div>
                    <div className="h-9 w-20 animate-pulse rounded bg-cyan-400/20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listed.length === 0 ? (
          // Only show "No escrows found" after loading is complete AND there are no escrows
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
          // Actual escrows grid
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listed.map((e) => (
              <Link
                to={`/escrow/${e.id}`}
                key={e.id}
                className="web3-corner-border group relative rounded-3xl p-[2px]"
              >
                <div className="h-fit rounded-[1.4rem] bg-black/40 p-8 shadow-[0_0_40px_#00eaff20] backdrop-blur-xl transition-all duration-500 group-hover:shadow-[0_0_70px_#00eaff40]">
                  <div>
                    <div className="text-lg font-semibold tracking-wide text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                      {e.title}
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
                          {/* Always show on-chain status - we've filtered out escrows without it */}

                          <span
                            className={`badge w-fit ${
                              e.onChainStatus === "pending"
                                ? "badge-yellow"
                                : e.onChainStatus === "signed"
                                  ? "badge-blue" // signed = pending delivery
                                  : e.onChainStatus === "pending_approval"
                                    ? "badge-orange" // waiting for approval
                                    : e.onChainStatus === "completed"
                                      ? "badge-green"
                                      : e.onChainStatus === "disputed"
                                        ? "badge-purple"
                                        : e.onChainStatus === "cancelled"
                                          ? "badge-red"
                                          : e.onChainStatus === "frozen"
                                            ? "badge-gray"
                                            : "badge-orange"
                            }`}
                          >
                            {e.onChainStatus === "pending"
                              ? "Pending"
                              : e.onChainStatus === "signed"
                                ? "Signed"
                                : e.onChainStatus === "pending_approval"
                                  ? "Pending Approval"
                                  : e.onChainStatus === "completed"
                                    ? "Completed"
                                    : e.onChainStatus === "disputed"
                                      ? "Disputed"
                                      : e.onChainStatus === "cancelled"
                                        ? "Cancelled"
                                        : e.onChainStatus === "frozen"
                                          ? "Frozen"
                                          : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* On-chain indicators */}
                    {/* On-chain indicators */}
                  </div>

                  <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
                    {e.description}
                  </p>

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
        )}
      </div>
      <DebugOnChainData />
    </div>
  );
}
