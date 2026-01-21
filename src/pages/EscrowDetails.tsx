/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Clock,
  Eye,
  // EyeOff,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Globe,
  Lock,
  Package,
  // Ban,
  // Send,
  // ThumbsUp,
  // ThumbsDown,
  // PackageCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Ban,
  Upload,
  Info,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { UserAvatar } from "../components/UserAvatar";
import { VscVerifiedFilled } from "react-icons/vsc";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { Image, Paperclip } from "lucide-react";
import EvidenceViewer from "../components/disputes/modals/EvidenceViewer";
import { EvidenceDisplay } from "../components/disputes/EvidenceDisplay";
import { api } from "../lib/apiClient";

// Use the same services as Escrow.tsx
import { agreementService } from "../services/agreementServices";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import {
  getAgreement,
  getMilestoneCount,
  getTokenDecimals,
  getTokenSymbol,
} from "../web3/readContract";
import { ERC20_ABI, ESCROW_ABI, ESCROW_CA, ZERO_ADDRESS } from "../web3/config";
import {
  formatAmount,
  formatDateWithTime,
  formatNumberWithCommas,
} from "../web3/helper";
import {
  useAccount,
  useContractReads,
  useWaitForTransactionReceipt,
  useWriteContract,
  useSwitchChain,
  useChainId,
} from "wagmi";
import type { LoadingStates, MilestoneData } from "../web3/interfaces";
import { MilestoneTableRow } from "../web3/MilestoneTableRow";
import { CountdownTimer } from "../web3/Timer";
import { disputeService } from "../services/disputeServices";
import {
  DisputeTypeEnum,
  type CreateDisputeFromAgreementRequest,
} from "../types";

// API Enum Mappings (from your Escrow.tsx)
const AgreementTypeEnum = {
  REPUTATION: 1,
  ESCROW: 2,
} as const;

const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
  PARTY_SUBMITTED_DELIVERY: 7,
} as const;

// Helper function to convert API status to frontend status
const apiStatusToFrontend = (status: number): string => {
  switch (status) {
    case AgreementStatusEnum.PENDING_ACCEPTANCE:
      return "pending";
    case AgreementStatusEnum.ACTIVE:
      return "active";
    case AgreementStatusEnum.COMPLETED:
      return "completed";
    case AgreementStatusEnum.DISPUTED:
      return "disputed";
    case AgreementStatusEnum.CANCELLED:
    case AgreementStatusEnum.EXPIRED:
      return "cancelled";
    case AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY:
      return "pending_approval";
    default:
      return "pending";
  }
};

// Helper function to process agreement files for display
// Helper function to process agreement files for display (with draft filtering)
const processEscrowFiles = (files: any[], escrowId: string): any[] => {
  return files
    .filter((file) => !file.fileName.toLowerCase().includes("escrow-draft")) // Filter out draft files
    .map((file) => {
      const name = file.fileName;

      // Function to get file URL
      const getFileUrl = (): string => {
        const API_BASE =
          import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";
        return `${API_BASE}/agreement/${escrowId}/file/${file.id}`;
      };

      const fileUrl = getFileUrl();

      // Determine file type
      if (/\.(webp|jpg|jpeg|png|gif)$/i.test(name)) {
        return {
          name,
          type: "image",
          url: fileUrl,
          preview: fileUrl,
        };
      } else if (/\.pdf($|\?)/i.test(name)) {
        return {
          name,
          type: "pdf",
          url: fileUrl,
          preview:
            "https://placehold.co/600x800/059669/white?text=PDF+Document",
        };
      } else if (name.match(/chat|screenshot|conversation/i)) {
        return {
          name,
          type: "chat",
          url: fileUrl,
          preview:
            "https://placehold.co/600x800/1f2937/white?text=Chat+Screenshot",
        };
      } else {
        return {
          name,
          type: "document",
          url: fileUrl,
          preview: "https://placehold.co/600x800/059669/white?text=Document",
        };
      }
    });
};

// Helper function to determine file type
const getFileType = (filename: string): string => {
  if (!filename) return "document";

  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "svg":
      return "image";
    case "doc":
    case "docx":
      return "word";
    case "xls":
    case "xlsx":
      return "excel";
    case "zip":
    case "rar":
    case "7z":
      return "archive";
    case "txt":
      return "text";
    default:
      return "document";
  }
};

// Helper function to get appropriate file icon
const getFileIcon = (fileType: string) => {
  const className = "h-5 w-5";

  switch (fileType) {
    case "pdf":
      return <FileText className={`${className} text-red-400`} />;
    case "image":
      return <Image className={`${className} text-green-400`} />;
    case "word":
      return <FileText className={`${className} text-blue-400`} />;
    case "excel":
      return <FileText className={`${className} text-green-500`} />;
    case "archive":
      return <Paperclip className={`${className} text-yellow-400`} />;
    case "text":
      return <FileText className={`${className} text-gray-400`} />;
    default:
      return <Paperclip className={`${className} text-cyan-400`} />;
  }
};

// IMPROVED: Better wallet address extraction that checks multiple possible fields
const getWalletAddressFromParty = (party: any): string => {
  if (!party) return "Unknown";

  // Check multiple possible field names for wallet address
  const walletAddress =
    party?.walletAddress ||
    party?.username ||
    party?.wallet ||
    party?.WalletAddress ||
    party?.address;

  if (walletAddress) return walletAddress;

  // If no wallet address found, try to use telegram username or other identifier
  const telegramUsername = party?.telegramUsername || party?.username;
  if (telegramUsername) {
    return telegramUsername.startsWith("@")
      ? telegramUsername
      : `@${telegramUsername}`;
  }

  return "Unknown";
};

// Helper function to get user ID from party data
const getUserIdFromParty = (party: any) => {
  return party?.id?.toString();
};

// Helper function to extract avatar ID from party data
const getAvatarIdFromParty = (party: any): number | null => {
  const avatarId = party?.avatarId || party?.avatar?.id;
  return avatarId ? Number(avatarId) : null;
};

// Format wallet address for display
// Format wallet address for display
const formatWalletAddress = (address: string): string => {
  if (!address || address === "Unknown") return "Unknown";

  // Check if it's a username (starts with @ or doesn't look like a wallet address)
  if (address.startsWith("@")) {
    return address; // Already has @
  }

  if (address.startsWith("0x") && address.length === 42) {
    // It's a wallet address
    return `${address.slice(0, 4)}...${address.slice(-6)}`;
  }

  // If it's not a wallet address and doesn't start with @, assume it's a username
  // and add @ prefix
  if (!address.includes("0x") && address.length <= 15) {
    return `@${address}`;
  }

  return address;
};

// Add this helper function to specifically format usernames for display
const formatUsernameForDisplay = (username: string): string => {
  if (!username) return "Unknown";

  // Check if it looks like a wallet address
  if (username.startsWith("0x") && username.length === 42) {
    return `${username.slice(0, 4)}...${username.slice(-6)}`;
  }

  // Check if it looks like a Telegram username (no spaces, alphanumeric + underscores)
  const telegramPattern = /^[a-zA-Z0-9_]+$/;
  if (
    telegramPattern.test(username.replace(/^@/, "")) &&
    username.length <= 30
  ) {
    return username.startsWith("@") ? username : `@${username}`;
  }

  // Default: return as-is
  return username;
};

const getDisputeRaisedEvent = (timeline: any[] | undefined) => {
  if (!timeline || !Array.isArray(timeline)) return null;

  // Find the DisputeRaised event (type 17 based on your data)
  return timeline.find((event) => event.type === 17);
};

// Helper to get actor info from event
const getEventActorInfo = (event: any) => {
  if (!event || !event.actor) return null;

  return {
    username: event.actor.username || getWalletAddressFromParty(event.actor),
    avatarId: event.actor.avatarId || getAvatarIdFromParty(event.actor),
    userId: event.actor.id?.toString(),
  };
};

// Helper to get event note/description
const getEventNote = (event: any) => {
  if (!event) return null;
  return event.note || event.description;
};

// Add this helper function to get dispute information from timeline
const getDisputeInfo = (
  escrowData: any,
): {
  filedAt: string | null;
  filedBy: string | null;
  filedById: number | null;
  filedByAvatarId: number | null;
} => {
  if (!escrowData?._raw?.timeline)
    return {
      filedAt: null,
      filedBy: null,
      filedById: null,
      filedByAvatarId: null,
    };

  // Look for dispute events (type 17 or DELIVERY_REJECTED type 6 that leads to DISPUTED status)
  const disputeEvent = escrowData._raw.timeline.find(
    (event: any) =>
      (event.eventType === 6 || // DELIVERY_REJECTED
        event.type === 17) && // Type 17 is "raised a dispute"
      event.toStatus === AgreementStatusEnum.DISPUTED,
  );

  if (!disputeEvent)
    return {
      filedAt: null,
      filedBy: null,
      filedById: null,
      filedByAvatarId: null,
    };

  return {
    filedAt: disputeEvent.createdAt || null,
    filedBy: disputeEvent.actor?.username || null,
    filedById: disputeEvent.actor?.id || null,
    filedByAvatarId: disputeEvent.actor?.avatarId || null,
  };
};

// Also add the normalizeUsername helper if not already there
const normalizeUsername = (username: string): string => {
  if (!username) return "";
  return username.replace(/^@/, "").toLowerCase().trim();
};

interface EscrowDetailsData {
  id: string;
  title: string;
  description: string;
  type: "public" | "private";
  from: string; // Service Recipient = Payer
  to: string; // Service Provider = Payee
  status: string;
  dateCreated: string;
  deadline: string;
  amount?: string;
  token?: string;
  includeFunds: "yes" | "no";
  useEscrow: boolean;
  secureTheFunds: boolean;
  escrowAddress?: string;
  files: number;
  images: string[];
  fromAvatarId: number | null;
  toAvatarId: number | null;
  fromUserId: string;
  toUserId: string;
  creator: string;
  creatorUserId: string;
  creatorAvatarId: number | null;
  _raw: any;
}

// Helper badge components for better styling
const StatusBadge = ({ value }: { value: boolean }) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
      value
        ? "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
        : "border border-amber-400/30 bg-amber-500/20 text-amber-300"
    }`}
  >
    <div
      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-amber-400"}`}
    ></div>
    {value ? "Yes" : "No"}
  </div>
);

const SafetyBadge = ({ value }: { value: boolean }) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
      value
        ? "border border-rose-400/30 bg-rose-500/20 text-rose-300"
        : "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
    }`}
  >
    <div
      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-rose-400" : "bg-emerald-400"}`}
    ></div>
    {value ? "Yes" : "No"}
  </div>
);

// Add this modal component (place it near the RejectDeliveryModal in AgreementDetails or create a new one)
// Enhanced RaiseDisputeModal Component
const RaiseDisputeModal = ({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  title = "",
  description = "",
  disputeType = DisputeTypeEnum.ProBono,
  defendant = "",
  witnesses = [],
  files = [],
  isSubmitting,
  agreement,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    data: CreateDisputeFromAgreementRequest,
    files: File[],
  ) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  title?: string;
  description?: string;
  disputeType?: DisputeTypeEnum;
  defendant?: string;
  witnesses?: string[];
  files?: File[];
  isSubmitting: boolean;
  agreement?: any;
  currentUser?: any;
}) => {
  const [localTitle, setLocalTitle] = useState(title || agreement?.title || "");
  const [localDescription, setLocalDescription] = useState(
    description || agreement?.description || "",
  );

  const [localDisputeType, setLocalDisputeType] =
    useState<DisputeTypeEnum>(disputeType);
  const [localDefendant, setLocalDefendant] = useState(defendant);
  const [localWitnesses, setLocalWitnesses] = useState<string[]>(witnesses);
  const [localFiles, setLocalFiles] = useState<File[]>(files);
  const [witnessInput, setWitnessInput] = useState("");

  const defendantOptions = useMemo(() => {
    if (!agreement) return [];

    const options = [];
    const currentUsername = currentUser?.username || "";

    // Add both parties as potential defendants
    if (
      agreement.firstParty?.username &&
      agreement.firstParty.username !== currentUsername
    ) {
      options.push(agreement.firstParty.username);
    }

    if (
      agreement.counterParty?.username &&
      agreement.counterParty.username !== currentUsername
    ) {
      options.push(agreement.counterParty.username);
    }

    return options;
  }, [agreement, currentUser]);

  useEffect(() => {
    if (agreement && !localDefendant && defendantOptions.length > 0) {
      // Auto-select the other party as defendant
      const currentUsername = currentUser?.username || "";
      const otherParty = defendantOptions.find(
        (opt) => opt !== currentUsername,
      );
      if (otherParty) {
        setLocalDefendant(otherParty);
      }
    }
  }, [agreement, localDefendant, defendantOptions, currentUser]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      if (localFiles.length + newFiles.length > 10) {
        toast.error("Maximum 10 files allowed");
        return;
      }
      setLocalFiles([...localFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setLocalFiles(localFiles.filter((_, i) => i !== index));
  };

  const addWitness = () => {
    const trimmed = witnessInput.trim();
    if (trimmed && !localWitnesses.includes(trimmed)) {
      setLocalWitnesses([...localWitnesses, trimmed]);
      setWitnessInput("");
    }
  };

  const removeWitness = (index: number) => {
    setLocalWitnesses(localWitnesses.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWitness();
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!localTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!localDescription.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!localDefendant.trim()) {
      toast.error("Defendant is required");
      return;
    }

    if (localFiles.length === 0) {
      toast.error("At least one evidence file is required");
      return;
    }

    const disputeData: CreateDisputeFromAgreementRequest = {
      title: localTitle,
      description: localDescription,
      requestKind: localDisputeType,
      defendant: localDefendant,
      claim: claim,
      witnesses: localWitnesses,
    };

    await onConfirm(disputeData, localFiles);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-[32rem] overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-4 shadow-2xl sm:p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          disabled={isSubmitting}
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 sm:h-10 sm:w-10">
            <AlertTriangle className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white sm:text-xl">
              Raise a Dispute from Agreement
            </h2>
            <p className="text-xs text-purple-300 sm:text-sm">
              Create a formal dispute linked to this agreement
            </p>
          </div>
        </div>

        {/* Scrollable form content */}
        <div className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Title *
              </label>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Enter dispute title"
                className="w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Description *
              </label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="Describe the dispute in detail"
                className="h-32 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Claim */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Formal Claim *
              </label>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="State your formal claim against the defendant"
                className="h-24 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Dispute Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Dispute Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value={DisputeTypeEnum.ProBono}
                    checked={localDisputeType === DisputeTypeEnum.ProBono}
                    onChange={() =>
                      setLocalDisputeType(DisputeTypeEnum.ProBono)
                    }
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  <span className="text-white">Pro Bono</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value={DisputeTypeEnum.Paid}
                    checked={localDisputeType === DisputeTypeEnum.Paid}
                    onChange={() => setLocalDisputeType(DisputeTypeEnum.Paid)}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  <span className="text-white">Paid</span>
                </label>
              </div>
            </div>

            {/* Defendant */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Defendant *
              </label>
              <div className="flex gap-2">
                <select
                  value={localDefendant}
                  onChange={(e) => setLocalDefendant(e.target.value)}
                  className="flex-1 rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  disabled={isSubmitting}
                >
                  <option value="">Select defendant</option>
                  {defendantOptions.map((username, index) => (
                    <option key={index} value={username}>
                      {username}
                    </option>
                  ))}
                </select>
                {defendantOptions.length === 0 && (
                  <input
                    type="text"
                    value={localDefendant}
                    onChange={(e) => setLocalDefendant(e.target.value)}
                    placeholder="Enter defendant username"
                    className="flex-1 rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>

            {/* Witnesses */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Witnesses (Optional)
              </label>
              <div className="mb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={witnessInput}
                    onChange={(e) => setWitnessInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter witness username"
                    className="flex-1 rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={addWitness}
                    disabled={isSubmitting || !witnessInput.trim()}
                    className="border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                  >
                    Add
                  </Button>
                </div>
              </div>
              {localWitnesses.length > 0 && (
                <div className="space-y-2">
                  {localWitnesses.map((witness, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-purple-500/10 p-2"
                    >
                      <span className="text-sm text-white">{witness}</span>
                      <button
                        type="button"
                        onClick={() => removeWitness(index)}
                        className="text-red-400 hover:text-red-300"
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Evidence Files * (Max 10 files)
              </label>
              <div className="mb-2">
                <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-purple-500/30 bg-purple-500/10 p-4 hover:border-purple-500/50">
                  <Upload className="mr-2 h-5 w-5 text-purple-400" />
                  <span className="text-purple-300">Click to upload files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
              {localFiles.length > 0 && (
                <div className="space-y-2">
                  {localFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-purple-500/10 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-white">{file.name}</span>
                        <span className="text-xs text-purple-300">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Upload supporting documents, screenshots, or evidence (PDF,
                images, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-600 py-2 text-sm text-gray-300 hover:bg-gray-800 sm:w-auto sm:text-base"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="w-full border-purple-500/30 bg-purple-500/10 py-2 text-sm text-purple-300 hover:border-purple-400 hover:bg-purple-500/20 sm:w-auto sm:text-base"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Creating Dispute...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Raise Dispute
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Reject Delivery Modal Component
const RejectDeliveryModal = ({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  isSubmitting,
  transactionHash,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (claim: string) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  isSubmitting: boolean;
  transactionHash?: `0x${string}` | null;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-[20rem] overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-4 shadow-2xl sm:max-w-md sm:p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
          disabled={isSubmitting}
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 sm:h-10 sm:w-10">
            <AlertTriangle className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white sm:text-xl">
              Reject Delivery
            </h2>
            <p className="text-xs text-red-300 sm:text-sm">
              This will open a dispute immediately
            </p>
          </div>
        </div>

        {/* Warning message */}
        <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 sm:mb-6 sm:p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
            <div className="min-w-0">
              <p className="text-xs text-red-200 sm:text-sm">
                <span className="font-semibold">Important:</span> Rejecting the
                delivery will:
              </p>
              <ul className="mt-1 space-y-1 text-xs text-red-200/80 sm:mt-2">
                <li>• Immediately create a dispute</li>
                <li>
                  • Require dispute resolution through voting or manually
                  settling the dispute by you.
                </li>
                <li>• You can add more evidence on the dispute page later</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Claim input */}
        <div className="mb-4 sm:mb-6">
          <label className="mb-1 block text-sm font-medium text-purple-300 sm:mb-2">
            <div className="flex items-center gap-2">
              <span>Claim Description (Optional)</span>
              <div className="group relative hidden sm:inline-block">
                <Info className="h-4 w-4 text-gray-400 hover:text-purple-300" />
                <div className="invisible absolute top-1/2 left-6 z-10 w-64 -translate-y-1/2 rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-200 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <p className="font-medium text-white">What is a Claim?</p>
                  <p className="mt-1">
                    A claim is your formal statement explaining why you're
                    rejecting the delivery. This helps voters understand your
                    position. You can leave this empty if you prefer to add
                    details later on the dispute page.
                  </p>
                  <p className="mt-2 font-medium text-white">Examples:</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    <li>"Work does not meet quality standards"</li>
                    <li>"Delivered after deadline"</li>
                    <li>"Incomplete deliverables"</li>
                  </ul>
                </div>
              </div>
            </div>
          </label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Briefly describe why you're rejecting this delivery (optional)"
            className="h-24 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none sm:h-32"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-400">
            You can add more details and evidence on the dispute page.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-600 py-2 text-sm text-gray-300 hover:bg-gray-800 sm:w-auto sm:text-base"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="w-full border-purple-500/30 bg-purple-500/10 py-2 text-sm text-purple-300 hover:border-purple-400 hover:bg-purple-500/20 sm:w-auto sm:text-base"
            onClick={() => onConfirm(claim)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                {transactionHash
                  ? "Confirming Transaction..."
                  : "Creating Dispute..."}
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Reject Delivery & Open Dispute
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function EscrowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { user } = useAuth();
  const { switchChain } = useSwitchChain();
  const wagmiChainId = useChainId();
  const [escrow, setEscrow] = useState<EscrowDetailsData | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [showEscrowAddress, setShowEscrowAddress] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
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

  const [depositState, setDepositState] = useState({
    isApprovingToken: false,
    approvalHash: null,
    needsApproval: false,
  });

  const networkInfo = useNetworkEnvironment();
  const [onChainAgreement, setOnChainAgreement] = useState<any | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(
    BigInt(Math.floor(Date.now() / 1000)),
  );
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);

  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const contractAddress = ESCROW_CA[networkInfo.chainId as number];

  const [onChainTokenDecimalsState, setOnChainTokenDecimalsState] = useState<
    number | null
  >(null);
  const [manageMilestoneCount, setManageMilestoneCount] = useState<
    bigint | null
  >(null);
  const [onChainTokenSymbolState, setOnChainTokenSymbolState] = useState<
    string | null
  >(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);

  // Add these state variables near the other state declarations
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeClaim, setDisputeClaim] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectClaim, setRejectClaim] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const [pendingRejectClaim, setPendingRejectClaim] = useState<{
    agreementId: number;
    claim: string;
    votingId: string;
  } | null>(null);

  const disputeInfo = escrow
    ? getDisputeInfo(escrow)
    : { filedAt: null, filedBy: null, filedById: null, filedByAvatarId: null };

  // Status configuration
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/30",
      label: "Pending",
      description: "Awaiting deposit and signatures",
    },
    signed: {
      icon: FileText, // Changed from UserCheck to match getStatusIcon
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/30",
      label: "Signed",
      description: "Agreement signed by both parties",
    },
    pending_delivery: {
      icon: Package,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-400/30",
      label: "Pending Delivery",
      description: "Waiting for work delivery",
    },
    pending_approval: {
      icon: Package, // Changed from Clock to match getStatusIcon
      color: "text-orange-400", // Changed from purple to orange to match getStatusIcon
      bgColor: "bg-orange-500/20", // Changed from purple to orange
      borderColor: "border-orange-400/30", // Changed from purple to orange
      label: "Pending Approval",
      description: "Delivery submitted, awaiting approval",
    },
    completed: {
      icon: CheckCircle,
      color: "text-green-400", // Changed from emerald to green to match getStatusIcon
      bgColor: "bg-green-500/20", // Changed from emerald to green
      borderColor: "border-green-400/30", // Changed from emerald to green
      label: "Completed",
      description: "Successfully completed and settled",
    },
    disputed: {
      icon: AlertTriangle,
      color: "text-purple-400", // Changed from rose to purple to match getStatusIcon
      bgColor: "bg-purple-500/20", // Changed from rose to purple
      borderColor: "border-purple-400/30", // Changed from rose to purple
      label: "Disputed",
      description: "Under dispute resolution",
    },
    cancelled: {
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-400/30",
      label: "Cancelled",
      description: "Agreement cancelled",
    },
  };

  // Handler functions for file viewing
  const handleViewEvidence = (evidence: any) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
  };

  // File download handler
  // File download handler with draft filtering
  const handleDownloadFile = async (fileIndex: number) => {
    if (!id || !escrow) return;

    try {
      const escrowId = parseInt(id);

      // Filter out escrow-draft.json files
      const allFiles = escrow._raw?.files || [];
      const filteredFiles = allFiles.filter(
        (file: any) => !file.fileName.toLowerCase().includes("escrow-draft"),
      );

      if (filteredFiles.length === 0 || fileIndex >= filteredFiles.length) {
        toast.error("File not found in escrow data");
        return;
      }

      const file = filteredFiles[fileIndex];
      const fileId = file.id;

      if (!fileId) {
        toast.error("File ID not found");
        return;
      }

      // Find the original index in the full files array
      const originalFile = allFiles.find((f: any) => f.id === fileId);
      if (!originalFile) {
        toast.error("Original file not found");
        return;
      }

      // Show loading state
      toast.info("Downloading file...");

      // Create a custom download function that preserves the original filename
      await downloadFileWithOriginalName(
        escrowId,
        fileId,
        originalFile.fileName,
      );
      toast.success("File downloaded successfully!");
    } catch (error: any) {
      console.error("Failed to download file:", error);
      const errorMessage =
        error.message || "Failed to download file. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Enhanced download function that preserves original filename
  const downloadFileWithOriginalName = async (
    escrowId: number,
    fileId: number,
    originalFileName: string,
  ) => {
    try {
      const response = await api.get(`/agreement/${escrowId}/file/${fileId}`, {
        responseType: "blob",
      });

      // Use the original filename from the file data
      let filename = originalFileName;

      // If the original filename doesn't have an extension, try to get it from headers
      if (!filename.includes(".")) {
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
      }

      // Create blob with proper MIME type
      const contentType = response.headers["content-type"];
      const blob = contentType
        ? new Blob([response.data], { type: contentType })
        : new Blob([response.data]);

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  };

  const getCurrentStatus = () => {
    if (!onChainAgreement) return escrow?.status || "pending";

    if (onChainAgreement.completed) return "completed";
    if (onChainAgreement.disputed) return "disputed";
    if (onChainAgreement.orderCancelled) return "cancelled";
    if (onChainAgreement.deliverySubmited) return "pending_approval";
    if (
      onChainAgreement.signed &&
      onChainAgreement.acceptedByServiceProvider &&
      onChainAgreement.acceptedByServiceRecipient
    ) {
      return "signed";
    }
    if (onChainAgreement.signed) return "pending_delivery";

    return "pending";
  };

  // Safe status access
  const getStatusInfo = (status: string) => {
    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
  };

  // helper to reset messages
  const resetMessages = () => {
    setUiError(null);
    setUiSuccess(null);
  };

  const triggerMilestoneRefetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const fetchOnChainAgreement = useCallback(
    async (agreementData: any) => {
      if (!agreementData) return;
      if (!networkInfo.chainId) {
        console.warn("chainId not available - skipping on-chain fetch");
        return;
      }

      // FIX: Use contractAgreementId instead of the database ID
      const onChainId = agreementData.contractAgreementId;
      if (!onChainId) {
        console.warn("No contractAgreementId found - skipping on-chain fetch");
        return;
      }

      setOnChainLoading(true);
      try {
        const res = await getAgreement(
          networkInfo.chainId as number,
          BigInt(onChainId), // Use the contractAgreementId here
        );
        console.log("📦 On-chain agreement data:", res);
        setOnChainAgreement(res);
      } catch (err) {
        console.error("Failed to fetch on-chain agreement:", err);
        setOnChainAgreement(null);
      } finally {
        setOnChainLoading(false);
      }
    },
    [networkInfo.chainId],
  );

  // Fetch escrow details using agreementService (same as Escrow.tsx)
  const fetchEscrowDetails = useCallback(async () => {
    if (!id) return;

    setLoading("loadAgreement", true);
    setInitialLoading(true);
    try {
      const escrowId = parseInt(id);
      const agreementData =
        await agreementService.getAgreementDetails(escrowId);

      console.log("📋 EscrowDetails API Response:", agreementData);
      console.log(
        "🔍 Contract Agreement ID:",
        agreementData.contractAgreementId,
      );

      // Transform API data to frontend format
      const transformedEscrow: EscrowDetailsData = {
        id: `${agreementData.id}`,
        title: agreementData.title,
        description: agreementData.description,
        type:
          agreementData.visibility === AgreementVisibilityEnum.PRIVATE
            ? "private"
            : "public",
        from: getWalletAddressFromParty(agreementData.firstParty),

        to: getWalletAddressFromParty(agreementData.counterParty),
        status: apiStatusToFrontend(agreementData.status),
        dateCreated: agreementData.createdAt,
        deadline: agreementData.deadline,
        amount: agreementData.amount
          ? agreementData.amount.toString()
          : undefined,
        token: agreementData.tokenSymbol || undefined,
        includeFunds: agreementData.includesFunds ? "yes" : "no",
        useEscrow: agreementData.type === AgreementTypeEnum.ESCROW,
        secureTheFunds: agreementData.hasSecuredFunds || false,
        escrowAddress: agreementData.escrowContract || undefined,
        files: agreementData.files?.length || 0,
        images: agreementData.files?.map((file: any) => file.fileName) || [],
        fromAvatarId: getAvatarIdFromParty(agreementData.firstParty), // FIXED: Mystyri's avatar
        toAvatarId: getAvatarIdFromParty(agreementData.counterParty), // FIXED: SaffronSonder's avatar
        fromUserId: getUserIdFromParty(agreementData.firstParty), // FIXED: Mystyri's user ID
        toUserId: getUserIdFromParty(agreementData.counterParty),
        creator: getWalletAddressFromParty(agreementData.creator),
        creatorUserId: getUserIdFromParty(agreementData.creator),
        creatorAvatarId: getAvatarIdFromParty(agreementData.creator),
        _raw: agreementData,
      };

      console.log("🔄 Transformed Escrow:", transformedEscrow);

      // so it can extract the contractAgreementId
      fetchOnChainAgreement(agreementData).catch((e) => console.warn(e));
      setEscrow(transformedEscrow);
      const disputeEvent = getDisputeRaisedEvent(agreementData.timeline);
      if (disputeEvent) {
        console.log("⚖️ Found DisputeRaised event in timeline:", disputeEvent);
        // You could store this in state if needed, or access it from escrow._raw.timeline
      }
    } catch (error) {
      console.error("Failed to fetch escrow:", error);
      toast.error("Failed to load escrow details");
      setEscrow(null);
    } finally {
      setLoading("loadAgreement", false);
      setInitialLoading(false);
    }
  }, [id, fetchOnChainAgreement]);

  // Background refresh
  // Background refresh
  const fetchEscrowDetailsBackground = useCallback(async () => {
    if (isRefreshing || !id) return;

    setIsRefreshing(true);
    try {
      const escrowId = parseInt(id);
      const agreementData =
        await agreementService.getAgreementDetails(escrowId);

      // Transform API data to frontend format - FIX THIS MAPPING
      const transformedEscrow: EscrowDetailsData = {
        id: `${agreementData.id}`,
        title: agreementData.title,
        description: agreementData.description,
        type:
          agreementData.visibility === AgreementVisibilityEnum.PRIVATE
            ? "private"
            : "public",
        // FIXED: First party (Mystyri) is "from"
        from: getWalletAddressFromParty(agreementData.firstParty),
        // FIXED: Counter party (SaffronSonder) is "to"
        to: getWalletAddressFromParty(agreementData.counterParty),
        status: apiStatusToFrontend(agreementData.status),
        dateCreated: agreementData.createdAt,
        deadline: agreementData.deadline,
        amount: agreementData.amount
          ? agreementData.amount.toString()
          : undefined,
        token: agreementData.tokenSymbol || undefined,
        includeFunds: agreementData.includesFunds ? "yes" : "no",
        useEscrow: agreementData.type === AgreementTypeEnum.ESCROW,
        secureTheFunds: agreementData.hasSecuredFunds || false,
        escrowAddress: agreementData.escrowContract || undefined,
        files: agreementData.files?.length || 0,
        images: agreementData.files?.map((file: any) => file.fileName) || [],
        // FIXED: Match avatar IDs with the "from" and "to" assignments
        fromAvatarId: getAvatarIdFromParty(agreementData.firstParty),
        toAvatarId: getAvatarIdFromParty(agreementData.counterParty),
        fromUserId: getUserIdFromParty(agreementData.firstParty),
        toUserId: getUserIdFromParty(agreementData.counterParty),
        creator: getWalletAddressFromParty(agreementData.creator),
        creatorUserId: getUserIdFromParty(agreementData.creator),
        creatorAvatarId: getAvatarIdFromParty(agreementData.creator),
        _raw: agreementData,
      };

      setEscrow(transformedEscrow);
      const disputeEvent = getDisputeRaisedEvent(agreementData.timeline);
      if (disputeEvent) {
        console.log("⚖️ Found DisputeRaised event in timeline:", disputeEvent);
        // You could store this in state if needed, or access it from escrow._raw.timeline
      }

      fetchOnChainAgreement(agreementData).catch((e) => console.warn(e));
    } catch (error) {
      console.error("Background escrow fetch failed:", error);
    } finally {
      setIsRefreshing(false);
      setLastUpdate(Date.now());
    }
  }, [id, isRefreshing, fetchOnChainAgreement]);

  const isLoadedAgreement = !!onChainAgreement;
  const isServiceProvider =
    isLoadedAgreement &&
    address &&
    onChainAgreement &&
    address.toLowerCase() ===
      onChainAgreement.serviceProvider.toString().toLowerCase();
  const isServiceRecipient =
    isLoadedAgreement &&
    address &&
    onChainAgreement &&
    address.toLowerCase() ===
      onChainAgreement.serviceRecipient.toString().toLowerCase();
  const now = currentTime;

  const switchToTokenChain = useCallback(async () => {
    if (!networkInfo.chainId || !switchChain) return;

    try {
      switchChain({ chainId: networkInfo.chainId });
    } catch (error) {
      console.error("Failed to switch network:", error);
      // Fallback: show message asking user to switch manually
    }
  }, [networkInfo.chainId, switchChain]);

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({
    hash,
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

  // Create contracts array for milestones ONLY when we have a valid count
  const contractsForMilestones = useMemo(() => {
    if (
      !manageMilestoneCount ||
      !onChainAgreement?.id ||
      !onChainAgreement.vesting
    ) {
      return [];
    }

    const count = Number(manageMilestoneCount);
    if (count === 0) return [];

    console.log(
      `Creating ${count} milestone contracts, trigger: ${refetchTrigger}`,
    );

    return Array.from({ length: count }, (_, i) => ({
      address: contractAddress as `0x${string}`,
      abi: ESCROW_ABI.abi,
      functionName: "getMilestone" as const,
      args: [onChainAgreement.id, BigInt(i)],
    }));
  }, [
    manageMilestoneCount,
    onChainAgreement?.id,
    onChainAgreement?.vesting,
    refetchTrigger,
    contractAddress,
  ]);

  // Fetch all milestones
  const { data: rawMilestonesData, refetch: refetchMilestonesData } =
    useContractReads({
      contracts: contractsForMilestones,
      query: {
        enabled: contractsForMilestones.length > 0,
      },
    });

  const handleClaimMilestone = async (index: number) => {
    resetMessages();
    setLoading("claimMilestone", true);
    try {
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider)
        return setUiError("Only serviceProvider can claim milestones");
      if (!onChainAgreement.vesting)
        return setUiError("Agreement is not in vesting mode");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (!onChainAgreement.signed)
        return setUiError("Agreement not signed completely");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");

      if (now > onChainAgreement.grace1Ends && !onChainAgreement.completed)
        return setUiError("Can not claim after cancellation expired");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "claimMilestone",
        args: [onChainAgreement.id, BigInt(index)],
      });
      setUiSuccess("Claim milestone transaction submitted");
    } catch (error) {
      setLoading("claimMilestone", false);
      setUiError("Error claiming milestone");
      console.error("Error claiming milestone:", error);
    }
  };

  const handleSetMilestoneHold = async (index: number, hold: boolean) => {
    resetMessages();
    setLoading("setMilestoneHold", true);
    try {
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceRecipient)
        return setUiError("Only serviceRecipient can set milestone hold");
      if (!onChainAgreement.vesting)
        return setUiError("Agreement is not in vesting mode");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (!onChainAgreement.signed)
        return setUiError("Agreement not signed completely");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");
      if (!manageMilestoneCount)
        return setUiError("Milestone count not loaded");
      if (index >= Number(manageMilestoneCount))
        return setUiError("Invalid milestone index");

      // Check if milestone is already claimed
      if (milestones[index]?.claimed)
        return setUiError("Milestone already claimed");

      console.log(
        `Calling setMilestoneHold for agreement ${onChainAgreement.id}, milestone ${index}, hold: ${hold}`,
      );

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "setMilestoneHold",
        args: [onChainAgreement.id, BigInt(index), hold],
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

  const handleSignAgreement = () => {
    resetMessages();
    setLoading("signAgreement", true);
    try {
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can sign");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (onChainAgreement.signed && !onChainAgreement.completed)
        return setUiError("Agreement already signed");
      if (
        isServiceProvider &&
        onChainAgreement.acceptedByServiceProvider &&
        !onChainAgreement.completed
      )
        return setUiError("You already signed the Agreement");
      if (
        isServiceRecipient &&
        onChainAgreement.acceptedByServiceRecipient &&
        !onChainAgreement.completed
      )
        return setUiError("You already signed the Agreement");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "signAgreement",
        args: [onChainAgreement.id],
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
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !onChainAgreement.completed)
        return setUiError("Only serviceProvider can submit delivery");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (!onChainAgreement.signed) return setUiError("Agreement not signed");
      if (
        onChainAgreement.grace1Ends !== 0n &&
        !onChainAgreement.pendingCancellation &&
        !onChainAgreement.completed
      )
        return setUiError("Submission is pending already");
      if (onChainAgreement.pendingCancellation)
        return setUiError("Cancellation requested");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "submitDelivery",
        args: [onChainAgreement.id],
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
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceRecipient && final)
        return setUiError("Only serviceRecipient can approve delivery");
      if (!isServiceRecipient && !final)
        return setUiError("Only serviceRecipient can reject delivery");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (!onChainAgreement.signed) return setUiError("Agreement not signed");
      if (onChainAgreement.grace1Ends === 0n && final)
        return setUiError("There are no pending delivery to approve");
      if (onChainAgreement.grace1Ends === 0n && !final)
        return setUiError("There are no pending delivery to reject");
      if (onChainAgreement.pendingCancellation)
        return setUiError("Cancellation requested");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "approveDelivery",
        args: [onChainAgreement.id, final, BigInt(votingId)],
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
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can deposit funds");
      if (onChainAgreement.funded && !onChainAgreement.completed)
        return setUiError("Agreement is funded already");
      if (onChainAgreement.completed)
        return setUiError("Agreement is already completed");
      if (onChainAgreement.frozen)
        return setUiError("Agreement is frozen already");

      const isERC20 = onChainAgreement.token !== ZERO_ADDRESS;

      if (isERC20) {
        const amount = onChainAgreement.amount;
        if (amount <= 0n) return setUiError("Invalid deposit amount");

        setDepositState((prev) => ({
          ...prev,
          needsApproval: true,
          isApprovingToken: true,
        }));
        setUiSuccess("Approving token for deposit...");

        writeApproval({
          address: onChainAgreement.token as `0x${string}`,
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
      if (!onChainAgreement) return setUiError("Agreement not loaded");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");

      const amount = onChainAgreement.amount;
      const isERC20 = onChainAgreement.token !== ZERO_ADDRESS;

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "depositFunds",
        args: [onChainAgreement.id],
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
  }, [onChainAgreement, contractAddress, writeContract]);

  const handleCancelOrder = () => {
    resetMessages();
    setLoading("cancelOrder", true);
    try {
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can cancel the order");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (!onChainAgreement.signed) return setUiError("Agreement not signed");
      if (
        onChainAgreement.grace1Ends !== 0n &&
        !onChainAgreement.pendingCancellation &&
        !onChainAgreement.completed
      )
        return setUiError("Submission is pending");
      if (onChainAgreement.pendingCancellation)
        return setUiError("Cancellation requested Already");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "cancelOrder",
        args: [onChainAgreement.id],
      });
      setUiSuccess("Cancel transaction submitted");
    } catch (error) {
      setLoading("cancelOrder", false);
      setUiError("Error cancelling order");
      console.error("Error cancelling order:", error);
    }
  };

  const handleApproveCancellation = (final: boolean) => {
    resetMessages();
    setLoading("approveCancellation", true);
    try {
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can cancel the order");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (!onChainAgreement.signed) return setUiError("Agreement not signed");
      if (onChainAgreement.grace1Ends === 0n && final)
        return setUiError("There are no pending order cancellation to approve");
      if (onChainAgreement.grace1Ends === 0n && !final)
        return setUiError("There are no pending order cancellation to reject");
      if (!onChainAgreement.pendingCancellation && !onChainAgreement.completed)
        return setUiError("No Cancellation requested");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");

      if (now > onChainAgreement.grace1Ends && !onChainAgreement.completed)
        return setUiError("24 hour Grace period not yet ended");

      const initiator = onChainAgreement.grace1EndsCalledBy;
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
        args: [BigInt(onChainAgreement?.id), final],
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

  const handlePartialRelease = () => {
    resetMessages();
    setLoading("partialRelease", true);
    try {
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (onChainAgreement.grace1Ends === 0n)
        return setUiError("No approved delivery yet");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (onChainAgreement.pendingCancellation)
        return setUiError("Cancellation is in process");
      if (onChainAgreement.vesting)
        return setUiError("You cannot release partial funds on Vesting");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");

      if (now < onChainAgreement.grace1Ends && !onChainAgreement.completed)
        return setUiError("24 hours Grace period not yet ended");

      const remaining = onChainAgreement.remainingAmount;
      if (remaining / 2n === 0n)
        return setUiError("Not enough funds to partial release");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "partialAutoRelease",
        args: [BigInt(onChainAgreement?.id)],
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
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (onChainAgreement.grace1Ends === 0n)
        return setUiError("No approved delivery yet");
      if (now < onChainAgreement.grace1Ends && !onChainAgreement.completed)
        return setUiError("24 hours Grace period not yet ended");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (!onChainAgreement.pendingCancellation && !onChainAgreement.completed)
        return setUiError("There is not pending cancellation");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "enforceCancellationTimeout",
        args: [BigInt(onChainAgreement?.id)],
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
      if (!onChainAgreement?.id) return setUiError("Agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (onChainAgreement.grace2Ends === 0n && !onChainAgreement.completed)
        return setUiError("48 hours grace period has not started");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (onChainAgreement.vesting)
        return setUiError("You cannot release full funds on vesting");
      if (
        onChainAgreement.remainingAmount === 0n &&
        !onChainAgreement.completed
      )
        return setUiError("Not enough funds to release");
      if (now < onChainAgreement.grace2Ends && !onChainAgreement.completed)
        return setUiError("48 hours Grace period not yet ended");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "finalAutoRelease",
        args: [BigInt(onChainAgreement?.id)],
      });
      setUiSuccess("Final release tx submitted");
    } catch (error) {
      setLoading("finalRelease", false);
      setUiError("Error processing final release");
      console.error("Error processing final release:", error);
    }
  };

  const votingId = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Generate a 6-digit number (100000 - 999999)
    return 100000 + (array[0] % 900000);
  }, []);

  // Updated function to handle rejecting delivery with claim
  const handleConfirmRejectDelivery = async (claim: string) => {
    setIsSubmittingReject(true);
    setLoading("rejectDelivery", true);
    resetMessages();

    try {
      if (!id || !onChainAgreement?.id) {
        setUiError("Agreement ID required");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (!isLoadedAgreement) {
        setUiError("Load the agreement first");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (!isServiceRecipient) {
        setUiError("Only serviceRecipient can reject delivery");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (!onChainAgreement.funded) {
        setUiError("Agreement not funded");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (!onChainAgreement.signed) {
        setUiError("Agreement not signed");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (onChainAgreement.grace1Ends === 0n) {
        setUiError("There are no pending delivery to reject");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (onChainAgreement.pendingCancellation) {
        setUiError("Cancellation requested");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (onChainAgreement.completed) {
        setUiError("The agreement is completed");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      if (onChainAgreement.frozen) {
        setUiError("The agreement is frozen");
        setIsSubmittingReject(false);
        setLoading("rejectDelivery", false);
        return;
      }

      const agreementId = parseInt(id);
      const generatedVotingId = votingId;

      console.log("🚀 Starting delivery rejection process:", {
        agreementId,
        contractAgreementId: onChainAgreement.id,
        votingId: generatedVotingId,
        claim: claim.trim(),
      });

      // Store the claim data temporarily to use after transaction success
      const pendingClaimData = {
        agreementId,
        claim: claim.trim(),
        votingId: generatedVotingId.toString(),
      };

      // Store in state for later use in transaction success handler
      setPendingRejectClaim(pendingClaimData);

      // STEP 1: First save the claim to backend
      try {
        console.log("📤 Making API call to save claim...");
        await agreementService.rejectDelivery(
          agreementId,
          claim.trim(),
          generatedVotingId.toString(),
        );
        console.log("✅ Claim saved to backend successfully");
      } catch (apiError: any) {
        console.error("❌ Failed to save claim to backend:", apiError);

        // Check if it's a 400 error
        if (apiError.response?.status === 400) {
          console.error("📋 400 Error details:", {
            status: apiError.response?.status,
            data: apiError.response?.data,
            message: apiError.response?.data?.message || apiError.message,
          });

          // Try alternative payload format (votingId as number)
          try {
            console.log(
              "🔄 Trying alternative payload format with votingId as number...",
            );
            await api.patch(`/agreement/${agreementId}/delivery/reject`, {
              claim: claim.trim(),
              votingId: Number(generatedVotingId), // Try as number instead of string
            });
            console.log("✅ Alternative payload worked!");
          } catch (altError: any) {
            console.error("❌ Alternative payload also failed:", {
              status: altError.response?.status,
              data: altError.response?.data,
              message: altError.message,
            });

            // Continue with blockchain call even if claim save fails
            // Show warning but don't stop the process
            toast.warning(
              "Claim not saved, but proceeding with blockchain rejection",
              {
                description:
                  "The dispute will be created but your claim description may not be saved.",
                duration: 3000,
              },
            );
          }
        } else {
          // For non-400 errors, show warning and continue
          toast.warning(
            "Claim not saved, but proceeding with blockchain rejection",
            {
              description:
                "The dispute will be created but your claim description may not be saved.",
              duration: 3000,
            },
          );
        }
      }

      // STEP 2: Then do the blockchain transaction
      console.log("🔗 Calling blockchain contract to reject delivery...");
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "approveDelivery",
        args: [onChainAgreement.id, false, BigInt(generatedVotingId)],
      });

      // Don't close modal yet - wait for transaction success
      setUiSuccess(
        "Claim saved and rejection transaction submitted. Waiting for confirmation...",
      );
    } catch (error: any) {
      console.error("❌ Failed to initiate delivery rejection:", error);

      setIsSubmittingReject(false);
      setLoading("rejectDelivery", false);

      // Clear pending claim on error
      setPendingRejectClaim(null);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to initiate delivery rejection. Please try again.";

      toast.error("Failed to reject delivery", {
        description: errorMessage,
        duration: 5000,
      });

      setUiError(errorMessage);
    }
  };

  // Replace the existing handleRaiseDispute function with this:
  const handleRaiseDispute = async (
    data: CreateDisputeFromAgreementRequest,
    files: File[],
  ) => {
    resetMessages();
    setLoading("raiseDispute", true);
    setIsSubmittingDispute(true);

    try {
      if (!id) return setUiError("Agreement ID required");
      if (!onChainAgreement?.id)
        return setUiError("On-chain agreement ID required");
      if (!isLoadedAgreement) return setUiError("Load the agreement first");
      if (!isServiceProvider && !isServiceRecipient)
        return setUiError("Only parties to the agreement can raise a dispute");
      if (!onChainAgreement.funded) return setUiError("Agreement not funded");
      if (!onChainAgreement.signed) return setUiError("Agreement not signed");
      if (onChainAgreement.completed)
        return setUiError("The agreement is completed");
      if (onChainAgreement.frozen) return setUiError("The agreement is frozen");
      if (onChainAgreement.disputed)
        return setUiError("The agreement is already in dispute");

      // Validation for Paid disputes
      if (data.requestKind === DisputeTypeEnum.Paid && !user?.walletAddress) {
        return setUiError("Wallet address required for paid disputes");
      }

      const agreementId = parseInt(id);

      console.log("🚀 Creating dispute from agreement:", {
        agreementId,
        data,
        files: files.map((f) => f.name),
        onChainAgreementId: onChainAgreement.id,
      });

      // Call the API to create dispute
      const disputeResponse = await disputeService.createDisputeFromAgreement(
        agreementId,
        data,
        files,
      );

      console.log("✅ Dispute created via API:", disputeResponse);

      // Now TypeScript knows disputeResponse.votingId exists (optional)
      const votingIdToUse = disputeResponse.votingId || votingId;

      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: "raiseDispute",
        args: [BigInt(onChainAgreement?.id), BigInt(votingIdToUse)],
      });

      setUiSuccess("Dispute raised successfully! Telegram notifications sent.");

      // Close the modal
      setIsDisputeModalOpen(false);
      setDisputeClaim("");

      // Refresh data to show updated status
      setTimeout(() => {
        fetchEscrowDetailsBackground().catch(console.error);
      }, 2000);
    } catch (error: unknown) {
      setLoading("raiseDispute", false);
      setIsSubmittingDispute(false);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create dispute. Please check all required fields and try again.";

      setUiError(errorMessage);
      console.error("Error raising dispute:", error);

      // Show error toast
      toast.error("Failed to create dispute", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      if (!isSuccess) {
        setIsSubmittingDispute(false);
      }
    }
  };

  // Add a function to open the dispute modal
  const handleOpenDisputeModal = () => {
    setIsDisputeModalOpen(true);
  };

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

  useEffect(() => {
    if (manageMilestoneCount) {
      // refetch contract reads if milestone count changed
      refetchMilestonesData();
    } else {
      setMilestones([]);
    }
  }, [manageMilestoneCount, refetchMilestonesData]);

  useEffect(() => {
    if (writeError) {
      resetAllLoading();
      setUiError("Transaction was rejected or failed");
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
      setDepositState({
        isApprovingToken: false,
        needsApproval: false,
        approvalHash: null,
      });
      resetApproval();
    }
  }, [approvalError, resetApproval]);

  useEffect(() => {
    if (user?.walletAddress && wagmiChainId !== networkInfo.chainId) {
      toast.info(
        `Wallet Connected, switching to supported chain ${networkInfo.chainId === 1 ? "Ethereum [id:1]" : "Sepolia [id:11155111]"}...`,
      );
      switchToTokenChain();
    }
  }, [
    networkInfo.chainId,
    switchToTokenChain,
    user?.walletAddress,
    wagmiChainId,
  ]);

  useEffect(() => {
    resetMessages();
  }, []);

  useEffect(() => {
    if (approvalSuccess && depositState.needsApproval) {
      // proceed immediately to deposit
      depositDirectly();
    }
  }, [
    approvalSuccess,
    depositState.needsApproval,
    onChainAgreement?.id,
    onChainAgreement,
    depositDirectly,
  ]);

  // Handle delivery rejection transaction success
  // Handle delivery rejection transaction success
  useEffect(() => {
    if (isSuccess && hash && isSubmittingReject && pendingRejectClaim) {
      const handleTransactionSuccess = async () => {
        try {
          console.log("✅ Blockchain transaction confirmed!");

          // Show success message with voting ID
          toast.success("Delivery rejected! A dispute has been created.", {
            description: `Voting ID: ${pendingRejectClaim.votingId}. Transaction confirmed and dispute is now active.`,
            duration: 5000,
          });

          // Close modal and reset
          setIsRejectModalOpen(false);
          setRejectClaim("");
          setUiSuccess("Delivery rejected successfully! Dispute created.");

          // Refresh data to show updated status
          setTimeout(() => {
            fetchEscrowDetailsBackground().catch(console.error);
          }, 2000);
        } catch (error: any) {
          console.error("❌ Error in post-transaction processing:", error);
          toast.error("Error in post-transaction processing", {
            description:
              error.message ||
              "Please check the transaction and contact support if needed.",
            duration: 5000,
          });
        } finally {
          setIsSubmittingReject(false);
          setLoading("rejectDelivery", false);
          setPendingRejectClaim(null); // Clear pending data
          resetWrite(); // Reset write state
        }
      };

      handleTransactionSuccess();
    }
  }, [
    isSuccess,
    hash,
    isSubmittingReject,
    pendingRejectClaim,
    resetWrite,
    fetchEscrowDetailsBackground,
  ]);

  // Clean up modal state when closing
  useEffect(() => {
    if (!isRejectModalOpen) {
      // Reset states when modal closes
      setIsSubmittingReject(false);
      setRejectClaim("");
      setPendingRejectClaim(null);
      setUiError(null);
      setUiSuccess(null);
      resetWrite();
    }
  }, [isRejectModalOpen, resetWrite]);

  useEffect(() => {
    fetchEscrowDetails();
  }, [id, fetchEscrowDetails]);

  // Polling for updates
  useEffect(() => {
    if (!id) return;

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible" && !isRefreshing) {
        fetchEscrowDetailsBackground();
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [id, isRefreshing, fetchEscrowDetailsBackground]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(BigInt(Math.floor(Date.now() / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const tokenAddress =
    onChainAgreement &&
    onChainAgreement.token &&
    onChainAgreement.token !== ZERO_ADDRESS
      ? (onChainAgreement.token as `0x${string}`)
      : undefined;

  // Fetch token decimals & symbol from your public client helpers (file: web3/readContract.ts)
  useEffect(() => {
    // don't run if no tokenAddress or chainId
    if (!tokenAddress || !networkInfo.chainId) {
      setOnChainTokenDecimalsState(null);
      setOnChainTokenSymbolState(null);
      return;
    }

    if (!onChainAgreement || !networkInfo.chainId) {
      setManageMilestoneCount(null);
      return;
    }

    let cancelled = false;
    setTokenLoading(true);

    (async () => {
      try {
        const dec = await getTokenDecimals(
          networkInfo.chainId as number,
          tokenAddress as `0x${string}`,
        );
        if (!cancelled) setOnChainTokenDecimalsState(Number(dec)); // convert bigint -> number
      } catch (err) {
        console.warn("Failed to fetch token decimals:", err);
        if (!cancelled) setOnChainTokenDecimalsState(null);
      }

      try {
        const sym = await getTokenSymbol(
          networkInfo.chainId as number,
          tokenAddress as `0x${string}`,
        );
        if (!cancelled) setOnChainTokenSymbolState(sym);
      } catch (err) {
        console.warn("Failed to fetch token symbol:", err);
        if (!cancelled) setOnChainTokenSymbolState(null);
      } finally {
        if (!cancelled && !tokenLoading) setTokenLoading(false);
      }

      try {
        const mlc = await getMilestoneCount(
          networkInfo.chainId as number,
          onChainAgreement?.id as bigint,
        );
        if (!cancelled) setManageMilestoneCount(mlc);
      } catch (err) {
        console.warn("Failed to fetch token symbol:", err);
        if (!cancelled) setManageMilestoneCount(null);
      } finally {
        if (!cancelled) setTokenLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenAddress, networkInfo.chainId, tokenLoading, onChainAgreement]);
  const decimalsNumber =
    typeof onChainTokenDecimalsState === "number"
      ? onChainTokenDecimalsState
      : 18;

  // use symbol (fall back to ETH if zero address, else use escrow token or "TOKEN")
  const tokenSymbol =
    onChainTokenSymbolState ??
    (onChainAgreement?.token === ZERO_ADDRESS
      ? "ETH"
      : (escrow?.token ?? "TOKEN"));

  // helper to format bigints from on-chain data
  const formatOnChainAmount = (amt: bigint | number | string | undefined) => {
    try {
      if (amt === undefined || amt === null) return "";
      // ensure bigint
      const a = typeof amt === "bigint" ? amt : BigInt(amt);
      return formatAmount(a, decimalsNumber);
    } catch {
      return String(amt);
    }
  };

  // FIXED Role detection - Use on-chain data which has reliable wallet addresses

  const userId = user?.id?.toString();

  // Get user IDs from raw agreement data (most accurate)
  const firstPartyUserId = escrow?._raw?.firstParty?.id?.toString();
  const counterPartyUserId = escrow?._raw?.counterParty?.id?.toString();
  const creatorUserId = escrow?._raw?.creator?.id?.toString();

  // Simple comparison: check if logged-in user matches any party by user ID
  const isFirstParty = userId === firstPartyUserId;
  const isCounterparty = userId === counterPartyUserId;
  const isCreator = userId === creatorUserId;

  // Calculate days remaining
  const daysRemaining = escrow
    ? Math.ceil(
        (new Date(escrow.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

  // Show loading screen only when the loadAgreement flag is active to avoid
  // narrowing the loadingStates type to 'never' in TypeScript.
  if (initialLoading || loadingStates.loadAgreement) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-8">
            <div className="mx-auto size-32 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400"></div>
            <div className="absolute inset-0 mx-auto size-32 animate-ping rounded-full border-2 border-cyan-400/40"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-cyan-300">
              Loading Escrow
            </h3>
            <p className="text-sm text-cyan-200/70">
              Preparing your escrow details...
            </p>
          </div>
          <div className="mt-4 flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="relative min-h-screen p-8">
        <div className="absolute inset-0 -z-10 bg-cyan-500/10 blur-3xl"></div>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="card-cyan rounded-2xl border border-white/10 p-8">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
            <h2 className="mb-2 text-2xl font-semibold text-white/90">
              Escrow Not Found
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              The escrow you're looking for doesn't exist or may have been
              removed.
            </p>
            <Link to="/escrow">
              <Button variant="neon" className="neon-hover">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Escrows
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = getCurrentStatus();
  const statusInfo = getStatusInfo(currentStatus);
  const StatusIcon = statusInfo.icon;
  return (
    <div className="min-h-screen">
      <div className="mt-1 text-xs text-cyan-300">
        Debug: From = {escrow.from} | To = {escrow.to} | isFirstParty ={" "}
        {isFirstParty.toString()} | isCounterparty = {isCounterparty.toString()}
      </div>
      <div className="container mx-auto py-2 lg:px-4 lg:py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center justify-between space-y-4 sm:flex-row">
          <div className="flex space-x-4 self-start lg:mr-4">
            <Button
              variant="outline"
              onClick={() => navigate("/escrow")}
              className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Escrows
            </Button>
          </div>

          <div className="flex items-center space-x-2 md:mr-auto">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            <span
              className={`rounded-full border px-3 py-1 text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
            >
              {statusInfo.label}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                isOverdue
                  ? "border border-rose-400/30 bg-rose-500/20 text-rose-300"
                  : isUrgent
                    ? "border border-yellow-400/30 bg-yellow-500/20 text-yellow-300"
                    : "border border-cyan-400/30 bg-cyan-500/20 text-cyan-300"
              }`}
            >
              {isOverdue ? "Overdue" : `${daysRemaining} days left`}
            </span>

            {escrow._raw?.disputes && escrow._raw.disputes.length > 0 && (
              <Link
                to={`/disputes/${escrow._raw.disputes[0].disputeId}`}
                className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/20 hover:text-purple-200"
              >
                <AlertTriangle className="h-4 w-4" />
                View Dispute
              </Link>
            )}
          </div>

          <div className="flex items-end space-x-2 text-xs text-cyan-400/60 sm:self-end">
            {isRefreshing && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            )}
            <span>
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Escrow Overview Card */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 px-4 py-6 sm:px-4">
              <div className="mb-6 flex flex-col items-start justify-between sm:flex-row">
                <div>
                  <h1 className="mb-2 max-w-[30rem] text-2xl font-bold text-white lg:text-[1.5rem]">
                    {escrow.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-cyan-300">
                    {escrow.type === "public" ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public Escrow</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Private Escrow</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-cyan-300">Created by</div>
                  <div className="flex items-center justify-end gap-2 font-medium text-white">
                    <UserAvatar
                      userId={escrow.creatorUserId || escrow.creator || ""}
                      avatarId={escrow.creatorAvatarId || null}
                      username={escrow.creator || ""}
                      size="sm"
                    />
                    <span className="text-[11px] text-cyan-300 sm:text-base">
                      {formatWalletAddress(escrow.creator)}
                    </span>
                    {isCreator && (
                      <VscVerifiedFilled className="size-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[.6fr_.4fr]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Parties</div>
                      <div className="flex items-center gap-2 text-white">
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={escrow.fromUserId || escrow.from}
                            avatarId={escrow.fromAvatarId || null}
                            username={escrow.from}
                            size="sm"
                          />
                          <span className="text-xs text-cyan-300 sm:text-base">
                            {formatWalletAddress(escrow.from)}
                          </span>
                          {isFirstParty && ( // THIS SHOULD SHOW TICK ON "FROM" USER
                            <VscVerifiedFilled className="size-5 text-green-400" />
                          )}
                        </div>

                        <span className="text-sm text-cyan-400 sm:text-base">
                          <FaArrowRightArrowLeft />
                        </span>
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={escrow.toUserId || escrow.from}
                            avatarId={escrow.toAvatarId || null}
                            username={escrow.to}
                            size="sm"
                          />
                          <span className="text-xs text-cyan-300 sm:text-base">
                            {formatWalletAddress(escrow.to)}
                          </span>
                          {isCounterparty && ( // THIS SHOULD SHOW TICK ON "TO" USER
                            <VscVerifiedFilled className="size-5 text-green-400" />
                          )}
                        </div>
                      </div>

                      {/* In your Parties section, add this debug: */}
                      {/* <div className="mt-2 text-xs text-red-400">
                        Debug: User: {userWalletAddress} | To: {toWallet} |
                        From: {fromWallet} | isCounterparty:{" "}
                        {isCounterparty.toString()} | isFirstParty:{" "}
                        {isFirstParty.toString()}
                      </div> */}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Date Created</div>
                      <div className="text-white">
                        {formatDateWithTime(escrow.dateCreated)}
                      </div>
                    </div>
                  </div>
                  {escrow.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Amount</div>
                        <div className="text-white">
                          {formatNumberWithCommas(escrow.amount)} {escrow.token}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Deadline</div>
                      <div className="text-white">
                        {formatDateWithTime(escrow.deadline)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Escrow Type</div>
                      <div className="text-white capitalize">{escrow.type}</div>
                    </div>
                  </div>
                  {escrow.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Escrow Used</div>
                        <div className="text-white">
                          {escrow.useEscrow ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Description & Scope
                </h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="leading-relaxed wrap-break-word whitespace-pre-line text-white/80">
                    {escrow.description}
                  </p>
                </div>
              </div>

              {escrow._raw?.files && escrow._raw.files.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    Supporting Documents
                  </h3>

                  {/* Filter out escrow-draft.json files */}
                  {(() => {
                    // Filter out escrow-draft.json files
                    const filteredFiles = escrow._raw.files.filter(
                      (file: any) =>
                        !file.fileName.toLowerCase().includes("escrow-draft"),
                    );

                    // If no files remain after filtering, don't show the section
                    if (filteredFiles.length === 0) {
                      return null;
                    }

                    return (
                      <>
                        {/* Preview Section */}
                        <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-cyan-400" />
                            <h4 className="font-medium text-cyan-300">
                              Preview Files ({filteredFiles.length})
                            </h4>
                          </div>

                          <EvidenceDisplay
                            evidence={processEscrowFiles(
                              filteredFiles,
                              escrow.id,
                            )}
                            color="cyan"
                            onViewEvidence={handleViewEvidence}
                          />
                        </div>

                        {/* Download Section */}
                        <div className="space-y-2">
                          {filteredFiles.map((file: any, index: number) => {
                            const fileType = getFileType(file.fileName);
                            const fileIcon = getFileIcon(fileType);

                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                              >
                                <div className="flex min-w-0 flex-1 items-center space-x-3">
                                  {fileIcon}
                                  <div className="min-w-0 flex-1">
                                    <span className="block truncate text-white">
                                      {file.fileName}
                                    </span>
                                    <span className="text-xs text-cyan-300/70 capitalize">
                                      {fileType}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-white/15 whitespace-nowrap text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                                  onClick={() => handleDownloadFile(index)}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Complete On-Chain Agreement Details */}
              {/* Complete On-Chain Agreement Details */}
              {onChainAgreement && (
                <div className="card-cyan mt-6 rounded-2xl border border-cyan-500/60 p-2 backdrop-blur-sm lg:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
                        On-Chain Agreement Details
                      </h3>
                      <p className="mt-1 text-sm text-cyan-300/80">
                        Live blockchain data • Contract ID:{" "}
                        {escrow?._raw?.contractAgreementId || "N/A"}
                      </p>
                    </div>
                    <div className="text-xs text-cyan-400/60">
                      {onChainLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        "Live"
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {/* Basic Information Card */}
                    <div className="card-cyan rounded-xl border border-cyan-400/60 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold text-cyan-300">
                          Parties & Basic Info
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-cyan-300/80">
                            Creator
                          </div>
                          <div className="rounded bg-cyan-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.creator || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-cyan-300/80">
                            Service Provider
                          </div>
                          <div className="rounded bg-cyan-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.serviceProvider || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-cyan-300/80">
                            Service Recipient
                          </div>
                          <div className="rounded bg-cyan-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.serviceRecipient || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Details Card */}
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-emerald-300">
                          Financial Details
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-emerald-300/80">
                            Token
                          </div>
                          <div className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.token === ZERO_ADDRESS
                              ? "ETH"
                              : onChainAgreement.token}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-emerald-300/80">
                              Amount
                            </div>
                            <div className="font-mono text-sm text-white">
                              {formatOnChainAmount(onChainAgreement.amount)}{" "}
                              {tokenSymbol}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-emerald-300/80">
                              Remaining
                            </div>
                            <div className="font-mono text-sm text-white">
                              {formatOnChainAmount(
                                onChainAgreement.remainingAmount,
                              )}{" "}
                              {tokenSymbol}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-emerald-300/80">
                            Funded
                          </div>
                          <div
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              onChainAgreement.funded
                                ? "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
                                : "border border-yellow-400/30 bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${onChainAgreement.funded ? "bg-emerald-400" : "bg-yellow-400"}`}
                            ></div>
                            {onChainAgreement.funded ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agreement Status Card */}
                    <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <h4 className="text-sm font-semibold text-blue-300">
                          Agreement Status
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Signed
                            </div>
                            <StatusBadge value={onChainAgreement.signed} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Completed
                            </div>
                            <StatusBadge value={onChainAgreement.completed} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Provider Accepted
                            </div>
                            <StatusBadge
                              value={onChainAgreement.acceptedByServiceProvider}
                            />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Recipient Accepted
                            </div>
                            <StatusBadge
                              value={
                                onChainAgreement.acceptedByServiceRecipient
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Features Card */}
                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <h4 className="text-sm font-semibold text-purple-300">
                          Timeline & Features
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-purple-300/80">
                            Deadline Duration
                          </div>
                          <div className="rounded bg-purple-500/10 px-2 py-1 font-mono text-sm text-white">
                            {onChainAgreement.deadlineDuration?.toString() ||
                              "N/A"}{" "}
                            seconds
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-purple-300/80">
                              Vesting
                            </div>
                            <StatusBadge value={onChainAgreement.vesting} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-purple-300/80">
                              Private
                            </div>
                            <StatusBadge value={onChainAgreement.privateMode} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-purple-300/80">
                            Delivery Submitted
                          </div>
                          <StatusBadge
                            value={onChainAgreement.deliverySubmitted}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dispute & Cancellation Card */}
                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        <h4 className="text-sm font-semibold text-rose-300">
                          Dispute & Safety
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Disputed
                            </div>
                            <SafetyBadge value={onChainAgreement.disputed} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Frozen
                            </div>
                            <SafetyBadge value={onChainAgreement.frozen} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Pending Cancel
                            </div>
                            <SafetyBadge
                              value={onChainAgreement.pendingCancellation}
                            />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Cancelled
                            </div>
                            <SafetyBadge
                              value={onChainAgreement.orderCancelled}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-rose-300/80">
                            Voting ID
                          </div>
                          <div className="w-fit rounded bg-rose-500/10 px-2 py-1 font-mono text-sm text-white">
                            {onChainAgreement.votingId?.toString() || "0"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Section */}
            {onChainAgreement && (
              <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-4 backdrop-blur-sm lg:p-6">
                {/* Status Indicators */}
                <div className="mt-4 space-y-2">
                  {onChainAgreement.grace1Ends > 0n &&
                    onChainAgreement.pendingCancellation && (
                      <div className="flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-orange-300">
                          Pending Order Cancellation:{" "}
                          <CountdownTimer
                            targetTimestamp={onChainAgreement.grace1Ends}
                            // onComplete={refetchAgreement}
                          />
                        </span>
                      </div>
                    )}
                  {onChainAgreement.frozen && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-red-300">Agreement is Frozen!</span>
                    </div>
                  )}
                  {onChainAgreement.grace1Ends > 0n &&
                    onChainAgreement.pendingCancellation && (
                      <div className="flex items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-3">
                        <Info className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-300">
                          {(() => {
                            const initiator =
                              onChainAgreement.grace1EndsCalledBy;
                            const serviceProvider =
                              onChainAgreement.serviceProvider;
                            const serviceRecipient =
                              onChainAgreement.serviceRecipient;

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
                  {onChainAgreement.grace1Ends > 0n &&
                    onChainAgreement.deliverySubmited &&
                    !onChainAgreement.vesting && (
                      <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-300">
                          Pending Delivery [Grace period 1]:{" "}
                          <CountdownTimer
                            targetTimestamp={onChainAgreement.grace1Ends}
                            // onComplete={refetchAgreement}
                          />
                        </span>
                      </div>
                    )}
                  {onChainAgreement.grace1Ends > 0n &&
                    onChainAgreement.deliverySubmited && (
                      <div className="flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                        <Package className="h-4 w-4 text-green-400" />
                        <span className="text-green-300">
                          Delivery submitted, waiting for service recipient
                        </span>
                      </div>
                    )}
                  <div className="mb-2 flex flex-col items-center gap-4 sm:flex-row">
                    {!onChainAgreement.acceptedByServiceProvider && (
                      <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                        <UserCheck className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-300">
                          Waiting for Service Provider Signature
                        </span>
                      </div>
                    )}
                    {!onChainAgreement.acceptedByServiceRecipient && (
                      <div className="flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 p-3">
                        <UserCheck className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-300">
                          Waiting for Service Recipient Signature
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Check if any action buttons are available */}
                {(isServiceProvider || isServiceRecipient) &&
                ((((isServiceProvider &&
                  !onChainAgreement.acceptedByServiceProvider) ||
                  (isServiceRecipient &&
                    !onChainAgreement.acceptedByServiceRecipient)) &&
                  onChainAgreement.funded) ||
                  (!onChainAgreement.funded && !onChainAgreement.signed) ||
                  (onChainAgreement.signed &&
                    isServiceProvider &&
                    !onChainAgreement.frozen &&
                    !onChainAgreement.pendingCancellation &&
                    !onChainAgreement.deliverySubmited) ||
                  (onChainAgreement.signed &&
                    isServiceRecipient &&
                    !onChainAgreement.pendingCancellation &&
                    onChainAgreement.deliverySubmited) ||
                  (now < onChainAgreement.grace1Ends &&
                    onChainAgreement.signed &&
                    onChainAgreement.pendingCancellation &&
                    address &&
                    address.toLowerCase() !==
                      String(
                        onChainAgreement.grace1EndsCalledBy,
                      ).toLowerCase() &&
                    !onChainAgreement.deliverySubmited) ||
                  (onChainAgreement.signed &&
                    !onChainAgreement.pendingCancellation &&
                    !onChainAgreement.deliverySubmited &&
                    !onChainAgreement.frozen) ||
                  (onChainAgreement.grace1Ends !== BigInt(0) &&
                    !onChainAgreement.vesting &&
                    now > onChainAgreement.grace1Ends &&
                    onChainAgreement.funded &&
                    !onChainAgreement.pendingCancellation &&
                    onChainAgreement.signed) ||
                  (onChainAgreement.signed &&
                    !onChainAgreement.vesting &&
                    now > onChainAgreement.grace2Ends &&
                    onChainAgreement.grace2Ends !== BigInt(0) &&
                    onChainAgreement.funded &&
                    onChainAgreement.pendingCancellation) ||
                  (onChainAgreement.signed &&
                    now > onChainAgreement.grace1Ends &&
                    onChainAgreement.pendingCancellation &&
                    onChainAgreement.grace1Ends !== BigInt(0)) ||
                  (onChainAgreement.funded &&
                    onChainAgreement.signed &&
                    !onChainAgreement.disputed &&
                    !onChainAgreement.completed &&
                    !onChainAgreement.frozen &&
                    !onChainAgreement.pendingCancellation)) ? (
                  <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Agreement Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Action Buttons */}

                      {onChainAgreement &&
                        ((isServiceProvider &&
                          !onChainAgreement.acceptedByServiceProvider) ||
                          (isServiceRecipient &&
                            !onChainAgreement.acceptedByServiceRecipient)) &&
                        onChainAgreement.funded && (
                          <>
                            <Button
                              onClick={handleSignAgreement}
                              disabled={
                                !onChainAgreement?.id ||
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

                      {onChainAgreement &&
                        isServiceRecipient &&
                        !onChainAgreement.funded &&
                        !onChainAgreement.signed && (
                          <Button
                            onClick={handleDepositFunds}
                            disabled={
                              !onChainAgreement?.id ||
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
                      {onChainAgreement &&
                        onChainAgreement.signed &&
                        isServiceProvider &&
                        !onChainAgreement.frozen &&
                        !onChainAgreement.pendingCancellation &&
                        !onChainAgreement.deliverySubmited && (
                          <Button
                            onClick={handleSubmitDelivery}
                            disabled={
                              !onChainAgreement?.id ||
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
                      {onChainAgreement &&
                        onChainAgreement.signed &&
                        isServiceRecipient &&
                        !onChainAgreement.pendingCancellation &&
                        onChainAgreement.deliverySubmited &&
                        !onChainAgreement.completed && (
                          <Button
                            onClick={() => handleApproveDelivery(true)}
                            disabled={
                              !onChainAgreement?.id ||
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

                      {onChainAgreement &&
                        onChainAgreement.signed &&
                        isServiceRecipient &&
                        !onChainAgreement.pendingCancellation &&
                        onChainAgreement.deliverySubmited &&
                        !onChainAgreement.completed && (
                          <Button
                            onClick={() => setIsRejectModalOpen(true)} // Open modal instead of direct call
                            disabled={
                              !onChainAgreement?.id ||
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

                      {onChainAgreement &&
                        now < onChainAgreement.grace1Ends &&
                        onChainAgreement.signed &&
                        onChainAgreement.pendingCancellation &&
                        address &&
                        address.toLowerCase() !==
                          String(
                            onChainAgreement.grace1EndsCalledBy,
                          ).toLowerCase() &&
                        !onChainAgreement.deliverySubmited && (
                          <Button
                            onClick={() => handleApproveCancellation(true)}
                            disabled={
                              !onChainAgreement?.id ||
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

                      {onChainAgreement &&
                        now < onChainAgreement.grace1Ends &&
                        onChainAgreement.signed &&
                        onChainAgreement.pendingCancellation &&
                        address &&
                        address.toLowerCase() !==
                          String(
                            onChainAgreement.grace1EndsCalledBy,
                          ).toLowerCase() &&
                        !onChainAgreement.deliverySubmited && (
                          <Button
                            onClick={() => handleApproveCancellation(false)}
                            disabled={
                              !onChainAgreement?.id ||
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

                      {onChainAgreement &&
                        onChainAgreement.signed &&
                        !onChainAgreement.pendingCancellation &&
                        !onChainAgreement.deliverySubmited &&
                        !onChainAgreement.frozen && (
                          <Button
                            onClick={handleCancelOrder}
                            disabled={
                              !onChainAgreement?.id ||
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

                      {onChainAgreement &&
                        onChainAgreement.grace1Ends !== BigInt(0) &&
                        !onChainAgreement.vesting &&
                        now > onChainAgreement.grace1Ends &&
                        onChainAgreement.funded &&
                        !onChainAgreement.pendingCancellation &&
                        onChainAgreement.signed && (
                          <Button
                            onClick={handlePartialRelease}
                            disabled={
                              !onChainAgreement?.id ||
                              isPending ||
                              onChainAgreement.vesting ||
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

                      {onChainAgreement &&
                        onChainAgreement.signed &&
                        !onChainAgreement.vesting &&
                        now > onChainAgreement.grace2Ends &&
                        onChainAgreement.grace2Ends !== BigInt(0) &&
                        onChainAgreement.funded &&
                        onChainAgreement.pendingCancellation && (
                          <Button
                            onClick={handleFinalRelease}
                            disabled={
                              !onChainAgreement?.id ||
                              isPending ||
                              onChainAgreement.vesting ||
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

                      {onChainAgreement &&
                        onChainAgreement.signed &&
                        now > onChainAgreement.grace1Ends &&
                        onChainAgreement.pendingCancellation &&
                        onChainAgreement.grace1Ends !== BigInt(0) && (
                          <Button
                            onClick={handleCancellationTImeout}
                            disabled={
                              !onChainAgreement?.id ||
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

                      {onChainAgreement &&
                        onChainAgreement.funded &&
                        onChainAgreement.signed &&
                        !onChainAgreement.disputed &&
                        !onChainAgreement.completed &&
                        !onChainAgreement.frozen &&
                        !onChainAgreement.pendingCancellation && (
                          <Button
                            onClick={handleOpenDisputeModal}
                            disabled={
                              !onChainAgreement?.id ||
                              isPending ||
                              loadingStates.raiseDispute
                            }
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-300/15"
                            variant="outline"
                          >
                            {loadingStates.raiseDispute ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
                                Raising Dispute...
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
                      {onChainAgreement &&
                        onChainAgreement.vesting &&
                        manageMilestoneCount! > 0 &&
                        onChainAgreement.signed && (
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
                                      manageTokenDecimals={
                                        onChainTokenDecimalsState as number
                                      }
                                      manageTokenSymbol={
                                        onChainTokenSymbolState as string
                                      }
                                      isServiceProvider={
                                        isServiceProvider as boolean
                                      }
                                      isServiceRecipient={
                                        isServiceRecipient as boolean
                                      }
                                      onClaimMilestone={handleClaimMilestone}
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
              </div>
            )}

            {/* Add this section after the Complete On-Chain Agreement Details section */}
            {/* Dispute Information Section */}
            {escrow._raw?.disputes && escrow._raw.disputes.length > 0 && (
              <div className="mt-6 rounded-xl border border-purple-400/60 bg-gradient-to-br from-purple-500/20 to-transparent p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Active Dispute
                </h3>

                <div className="space-y-4">
                  <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {/* DISPUTE FILING INFORMATION */}
                        {disputeInfo.filedAt && (
                          <div className="mt-2 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-purple-300/80">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Filed on{" "}
                                {formatDateWithTime(disputeInfo.filedAt)}
                              </span>
                            </div>
                            {disputeInfo.filedBy && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-purple-300/80">
                                  <Users className="h-3 w-3" />
                                  <span>Filed by:</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {disputeInfo.filedById && (
                                    <UserAvatar
                                      userId={disputeInfo.filedById.toString()}
                                      avatarId={disputeInfo.filedByAvatarId}
                                      username={disputeInfo.filedBy}
                                      size="sm"
                                    />
                                  )}
                                  <button
                                    onClick={() => {
                                      const cleanUsername =
                                        disputeInfo.filedBy?.replace(
                                          /^@/,
                                          "",
                                        ) || "";
                                      navigate(`/profile/${cleanUsername}`);
                                    }}
                                    className="text-xs font-medium text-purple-200 hover:text-purple-100 hover:underline"
                                  >
                                    {formatUsernameForDisplay(
                                      disputeInfo.filedBy,
                                    )}
                                  </button>
                                  {user &&
                                    disputeInfo.filedBy &&
                                    normalizeUsername(user.username) ===
                                      normalizeUsername(
                                        disputeInfo.filedBy,
                                      ) && (
                                      <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/disputes/${escrow._raw.disputes[0].disputeId}`}
                        className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-200 transition-colors hover:bg-purple-500/30 hover:text-white"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Go to Dispute
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                    <div>
                      <p className="text-sm text-amber-300">
                        This dispute was filed when the delivery was rejected.
                        Please visit the dispute page to view evidence,
                        participate in voting, or see the resolution process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

            {/* Activity Timeline */}
            {/* Activity Timeline */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">
                Escrow Timeline
              </h3>

              <div className="flex items-start space-x-8 overflow-x-auto pb-4">
                {/* Step 1 - Escrow Created */}
                <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                  <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300"></div>
                  <div className="mt-3 font-medium text-white">
                    Escrow Created
                  </div>
                  <div className="text-sm text-cyan-300">
                    {formatDateWithTime(escrow.dateCreated)}
                  </div>
                  <div className="mt-1 text-xs text-blue-400/70">
                    <div className="flex flex-col items-center gap-2">
                      Created by{" "}
                      <div className="flex items-center gap-1">
                        <UserAvatar
                          userId={escrow.creatorUserId || escrow.creator || ""}
                          avatarId={escrow.creatorAvatarId || null}
                          username={escrow.creator || ""}
                          size="sm"
                        />
                        {formatWalletAddress(escrow.creator)}

                        {isCreator && (
                          <VscVerifiedFilled className="size-5 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-blue-400/50"></div>
                </div>

                {/* Step 2 - Both Parties Signed */}
                {onChainAgreement?.signed && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Both Parties Signed
                    </div>
                    <div className="text-sm text-cyan-300">
                      {onChainAgreement?.acceptedByServiceProvider &&
                      onChainAgreement?.acceptedByServiceRecipient
                        ? "Fully Executed"
                        : "Partially Signed"}
                    </div>
                    <div className="mt-1 space-y-2 text-xs text-emerald-400/70">
                      {onChainAgreement?.acceptedByServiceProvider && (
                        <div className="flex flex-col items-center gap-1">
                          Signed by{" "}
                          <div className="flex items-center gap-1">
                            <UserAvatar
                              userId={escrow.fromUserId || escrow.from}
                              avatarId={escrow.fromAvatarId || null}
                              username={escrow.from}
                              size="sm"
                            />
                            {formatWalletAddress(escrow.from)}
                          </div>
                        </div>
                      )}
                      {onChainAgreement?.acceptedByServiceRecipient && (
                        <div className="flex flex-col items-center gap-1 text-blue-400/70">
                          Signed by{" "}
                          <div className="flex items-center gap-1">
                            <UserAvatar
                              userId={escrow.toUserId || escrow.to}
                              avatarId={escrow.toAvatarId || null}
                              username={escrow.to}
                              size="sm"
                            />
                            {formatWalletAddress(escrow.to)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-emerald-400/50"></div>
                  </div>
                )}

                {/* Step 3 - Work Delivered */}
                {onChainAgreement?.deliverySubmited && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Work Delivered
                    </div>
                    <div className="text-sm text-cyan-300">
                      Submitted for Review
                    </div>
                    <div className="mt-1 text-xs text-blue-400/70">
                      <div className="flex flex-col items-center gap-1">
                        Delivered by
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={escrow.fromUserId || escrow.from}
                            avatarId={escrow.fromAvatarId || null}
                            username={escrow.from}
                            size="sm"
                          />
                          {formatWalletAddress(escrow.from)}
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-blue-400/50"></div>
                  </div>
                )}

                {/* Step 4 - Approval Pending */}
                {onChainAgreement?.deliverySubmited &&
                  !onChainAgreement?.completed && (
                    <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                      <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-orange-400"></div>
                      <div className="mt-3 font-medium text-white">
                        Approval Pending
                      </div>
                      <div className="text-sm text-cyan-300">
                        Waiting for Recipient Approval
                      </div>
                      <div className="mt-1 text-xs text-orange-400/70">
                        <div className="flex flex-col items-center gap-[2px]">
                          Awaiting approval from{" "}
                          <div className="flex items-center gap-1">
                            <UserAvatar
                              userId={escrow.toUserId || escrow.to}
                              avatarId={escrow.toAvatarId || null}
                              username={escrow.to}
                              size="sm"
                            />
                            {formatWalletAddress(escrow.to)}
                          </div>
                        </div>
                      </div>
                      {!onChainAgreement?.completed && (
                        <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-orange-400/50"></div>
                      )}
                    </div>
                  )}

                {/* Step 5 - Work Completed & Approved */}
                {onChainAgreement?.completed && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Completed & Approved
                    </div>
                    <div className="text-sm text-cyan-300">
                      Successfully Finalized
                    </div>
                    <div className="mt-1 text-xs text-purple-400/70">
                      <div className="flex items-center gap-1">
                        <UserAvatar
                          userId={escrow.toUserId || escrow.to}
                          avatarId={escrow.toAvatarId || null}
                          username={escrow.to}
                          size="sm"
                        />
                        Approved by {formatWalletAddress(escrow.to)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6 - Dispute State */}
                {(onChainAgreement?.disputed ||
                  escrow._raw?.timeline?.some(
                    (e: { type: number }) => e.type === 17,
                  )) &&
                  (() => {
                    // Get the actual dispute event from timeline
                    const disputeEvent = getDisputeRaisedEvent(
                      escrow._raw?.timeline,
                    );
                    const actorInfo = getEventActorInfo(disputeEvent);
                    const eventNote = getEventNote(disputeEvent);
                    const eventTime = disputeEvent?.createdAt;

                    return (
                      <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                        <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-purple-400"></div>
                        <div className="mt-3 font-medium text-white">
                          Dispute Raised
                        </div>

                        {/* Show timestamp from actual event */}
                        <div className="text-sm text-cyan-300">
                          {eventTime
                            ? formatDateWithTime(eventTime)
                            : "Recently"}
                        </div>

                        {/* Show who raised the dispute */}
                        <div className="mt-1 text-xs text-purple-400/70">
                          {actorInfo ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <UserAvatar
                                  userId={actorInfo.userId || ""}
                                  avatarId={actorInfo.avatarId}
                                  username={actorInfo.username}
                                  size="sm"
                                />
                                Raised by{" "}
                                {formatWalletAddress(actorInfo.username)}
                              </div>
                              {/* {eventNote && (
                                <div className="mt-1 max-w-[10rem] text-red-300/80">
                                  {eventNote}
                                </div>
                              )} */}
                            </div>
                          ) : eventNote ? (
                            <div className="max-w-[10rem]">{eventNote}</div>
                          ) : (
                            "Agreement moved to Disputed status"
                          )}
                        </div>

                        {/* Show connection line if not final state */}
                        {!onChainAgreement?.completed &&
                          !onChainAgreement?.orderCancelled && (
                            <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-purple-400/50"></div>
                          )}
                      </div>
                    );
                  })()}

                {/* Step 7 - Cancelled State */}
                {onChainAgreement?.orderCancelled && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-400"></div>
                    <div className="mt-3 font-medium text-white">Cancelled</div>
                    <div className="text-sm text-cyan-300">
                      Agreement Terminated
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Role Information */}
            {/* Your Role Information */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Your Role
              </h3>
              <div className="space-y-3">
                {/* Show all applicable roles using accurate data */}
                {isCreator && (
                  <div className="rounded-lg bg-purple-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span className="font-medium text-purple-300">
                        Creator
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-purple-200/80">
                      You created this escrow agreement in the system.
                    </p>
                  </div>
                )}

                {/* Use on-chain roles for accurate financial role display */}
                {isServiceProvider && (
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-300">
                        Service Provider (Payee)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-green-200/80">
                      You provide the service and receive payment upon
                      completion.
                    </p>
                  </div>
                )}

                {isServiceRecipient && (
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-blue-300">
                        Service Recipient (Payer)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-200/80">
                      You receive the service and provide payment secured in
                      escrow.
                    </p>
                  </div>
                )}

                {/* Show UI relationship role separately if needed */}
                {(isFirstParty || isCounterparty) &&
                  !isServiceProvider &&
                  !isServiceRecipient && (
                    <div className="rounded-lg bg-yellow-500/10 p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium text-yellow-300">
                          {isFirstParty ? "First Party" : "Counterparty"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-yellow-200/80">
                        {isFirstParty
                          ? "You are the first party in this agreement."
                          : "You are the counterparty in this agreement."}
                      </p>
                    </div>
                  )}

                {!isServiceProvider && !isServiceRecipient && !isCreator && (
                  <div className="rounded-lg bg-gray-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-300">Viewer</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-200/80">
                      You are viewing this escrow agreement.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Information */}
            {/* In the Contract Information sidebar section, add this after the deadline */}
            <div className="card-cyan rounded-xl border border-cyan-400/60 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Contract Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Created</span>
                  <span className="text-white">
                    {formatDateWithTime(escrow.dateCreated)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Deadline</span>
                  <span className="text-white">
                    {formatDateWithTime(escrow.deadline)}
                  </span>
                </div>
                {escrow.status === "completed" && (
                  <div className="flex justify-between">
                    <span className="text-emerald-300">Completed</span>
                    <span className="text-emerald-300">Recently</span>
                  </div>
                )}
                {/* ADD DISPUTE FILED DATE */}
                {/* DISPUTE FILED INFORMATION */}
                {(escrow.status === "disputed" || onChainAgreement?.disputed) &&
                  disputeInfo.filedAt && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-purple-300">Dispute Filed</span>
                        <span className="text-purple-300">
                          {formatDateWithTime(disputeInfo.filedAt)}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Evidence Viewer Modal */}
      {/* Evidence Viewer Modal */}
      <EvidenceViewer
        isOpen={evidenceViewerOpen}
        onClose={() => {
          setEvidenceViewerOpen(false);
          setSelectedEvidence(null); // Clear selected evidence when closing
        }}
        selectedEvidence={selectedEvidence}
      />

      {/* Add this at the end of your JSX, before the closing </div> */}
      {isDisputeModalOpen && (
        <RaiseDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => {
            setIsDisputeModalOpen(false);
            setDisputeClaim("");
          }}
          onConfirm={handleRaiseDispute}
          claim={disputeClaim}
          setClaim={setDisputeClaim}
          agreement={escrow?._raw}
          currentUser={user}
          isSubmitting={isSubmittingDispute || loadingStates.raiseDispute}
        />
      )}

      {/* Reject Delivery Modal */}
      <RejectDeliveryModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectClaim("");
        }}
        onConfirm={handleConfirmRejectDelivery}
        claim={rejectClaim}
        setClaim={setRejectClaim}
        isSubmitting={isSubmittingReject || loadingStates.rejectDelivery}
        transactionHash={hash}
      />
    </div>
  );
}
