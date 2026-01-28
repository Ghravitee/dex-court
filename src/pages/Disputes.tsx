/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Wallet,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";

import {
  Info,
  Search,
  SortAsc,
  SortDesc,
  Upload,
  Scale,
  Paperclip,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { disputeService } from "../services/disputeServices";
import { DisputeStatusEnum, DisputeTypeEnum } from "../types";
import type { DisputeRow, CreateDisputeRequest } from "../types";
import { UserAvatar } from "../components/UserAvatar";
import {
  cleanTelegramUsername,
  formatTelegramUsernameForDisplay,
  getCurrentUserTelegram,
  isValidTelegramUsername,
} from "../lib/usernameUtils";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { VOTING_ABI, VOTING_CA } from "../web3/config";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { getVoteConfigs } from "../web3/readContract";

// File upload types
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// Helper function to calculate total file size
const getTotalFileSize = (files: UploadedFile[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
  const mb = totalBytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

const isValidWalletAddress = (value: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(value);

// User Search Result Component - FIXED
const UserSearchResult = ({
  user,
  onSelect,
  field,
  index,
}: {
  user: any;
  onSelect: (
    username: string,
    field: "defendant" | "witness",
    index?: number,
  ) => void;
  field: "defendant" | "witness";
  index?: number;
}) => {
  const { user: currentUser } = useAuth();

  // 🚨 FIXED: Look for telegramUsername field (from API response)
  const telegramUsername = cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );

  const wallet = user.walletAddress;

  if (!telegramUsername && !wallet) return null;

  // PRESERVES ORIGINAL CASE: No .toLowerCase() here
  const displayUsername = telegramUsername
    ? `@${telegramUsername}`
    : `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;

  const displayName = user.displayName || displayUsername;
  const isCurrentUser = user.id === currentUser?.id;

  return (
    <div
      onClick={() => onSelect(telegramUsername, field, index)}
      className={`glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60 ${isCurrentUser ? "opacity-80" : ""
        }`}
    >
      <UserAvatar
        userId={user.id}
        avatarId={user.avatarId || user.avatar?.id}
        username={telegramUsername}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">
          {displayName}
        </div>
        {telegramUsername && (
          <div className="truncate text-xs text-cyan-300">
            @{telegramUsername} {/* PRESERVES ORIGINAL CASE */}
          </div>
        )}
        {user.bio && (
          <div className="mt-1 truncate text-xs text-cyan-200/70">
            {user.bio}
          </div>
        )}
      </div>

      <ChevronRight className="h-4 w-4 flex-shrink-0 text-cyan-400" />
    </div>
  );
};

// Custom hook for fetching disputes
const useDisputes = (filters: {
  status?: string;
  search?: string;
  range?: string;
  sort?: string;
}) => {
  const [data, setData] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Properly type the range parameter
      const rangeValue =
        filters.range === "All"
          ? ("all" as const)
          : filters.range === "7d"
            ? ("last7d" as const)
            : filters.range === "30d"
              ? ("last30d" as const)
              : ("all" as const);

      const apiParams = {
        status:
          filters.status === "All"
            ? undefined
            : filters.status === "Pending"
              ? DisputeStatusEnum.Pending
              : filters.status === "Vote in Progress"
                ? DisputeStatusEnum.VoteInProgress
                : filters.status === "Settled"
                  ? DisputeStatusEnum.Settled
                  : filters.status === "Dismissed"
                    ? DisputeStatusEnum.Dismissed
                    : filters.status === "pendingPayment"
                      ? DisputeStatusEnum.pendingPayment
                      : undefined,
        // REMOVE search from here
        // search: filters.search,
        range: rangeValue,
        sort: filters.sort === "asc" ? ("asc" as const) : ("desc" as const),
        top: 100, // Increase to fetch more disputes for client-side pagination
        skip: 0,
      };

      const response = await disputeService.getDisputes(apiParams);
      const transformedData = response.results.map((item) =>
        disputeService.transformDisputeListItemToRow(item),
      );

      console.log("Fetched disputes:", transformedData.length);
      console.log("response", response);

      setData(transformedData);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch disputes:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.range, filters.sort]); // Remove filters.search from dependencies

  useEffect(() => {
    fetchDisputes();
  }, [filters.status, filters.range, filters.sort, fetchDisputes]);

  return { data, loading, error, refetch: fetchDisputes };
};

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const formatPartyDisplay = (username: string) => {
  // Check if it's a wallet address (starts with 0x and is 42 chars)
  if (username.startsWith("0x") && username.length === 42) {
    return `${username.slice(0, 4)}...${username.slice(-6)}`;
  }
  return formatTelegramUsernameForDisplay(username);
};

// Skeleton loading component for disputes
const DisputeSkeleton = () => (
  <tr className="animate-pulse border-t border-white/10">
    <td className="px-5 py-4">
      <div className="h-4 w-20 rounded bg-white/10"></div>
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-40 rounded bg-white/10"></div>
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-32 rounded bg-white/10"></div>
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-24 rounded bg-white/10"></div>
    </td>
    <td className="px-5 py-4">
      <div className="h-4 w-16 rounded bg-white/10"></div>
    </td>
    <td className="px-5 py-4">
      <div className="h-6 w-16 rounded bg-white/10"></div>
    </td>
  </tr>
);

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
      text: "Processing transaction...",
      className: "text-yellow-400",
      iconClassName: "animate-spin",
    },
    success: {
      icon: CheckCircle2,
      text: "Transaction confirmed!",
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

export default function Disputes() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const networkInfo = useNetworkEnvironment();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DisputeRow["status"] | "All">("All");
  const [dateRange, setDateRange] = useState("All");
  const [sortAsc, setSortAsc] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    kind: "Pro Bono" as "Pro Bono" | "Paid",
    defendant: "",
    description: "",
    claim: "",
    evidence: [] as UploadedFile[],
    witnesses: [""] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentDisputesFilter, setRecentDisputesFilter] =
    useState<string>("All");
  const [isRecentDisputesFilterOpen, setIsRecentDisputesFilterOpen] =
    useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recentDisputesDropdownRef = useRef<HTMLDivElement>(null);

  // User search state - SIMPLIFIED LIKE OpenDisputeModal
  const [defendantSearchQuery, setDefendantSearchQuery] = useState("");
  const [defendantSearchResults, setDefendantSearchResults] = useState<any[]>(
    [],
  );
  const [isDefendantSearchLoading, setIsDefendantSearchLoading] =
    useState(false);
  const [showDefendantSuggestions, setShowDefendantSuggestions] =
    useState(false);

  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [activeWitnessIndex, setActiveWitnessIndex] = useState<number>(0);

  // Refs for click outside detection
  const defendantSearchRef = useRef<HTMLDivElement>(null);
  const witnessSearchRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [allDisputes, setAllDisputes] = useState<DisputeRow[]>([]);
  const [paginatedDisputes, setPaginatedDisputes] = useState<DisputeRow[]>([]);

  const debouncedDefendantQuery = useDebounce(defendantSearchQuery, 300);
  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);
  const [transactionStep, setTransactionStep] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [isProcessingPaidDispute, setIsProcessingPaidDispute] = useState(false);

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

  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  // Use the custom hook for data fetching
  const { data, loading, error, refetch } = useDisputes({
    status: status,
    range: dateRange,
    sort: sortAsc ? "asc" : "desc",
  });

  const filterOptions = [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Vote in Progress", value: "Vote in Progress" },
    { label: "Settled", value: "Settled" },
    { label: "Dismissed", value: "Dismissed" },
    { label: "pendingPayment", value: "pending Payment" },
  ];

  const recentDisputesFilterOptions = [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Vote in Progress", value: "Vote in Progress" },
    { label: "Settled", value: "Settled" },
    { label: "Dismissed", value: "Dismissed" },
    { label: "Dismissed", value: "pending Payment" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        recentDisputesDropdownRef.current &&
        !recentDisputesDropdownRef.current.contains(event.target as Node) &&
        defendantSearchRef.current &&
        !defendantSearchRef.current.contains(event.target as Node) &&
        witnessSearchRef.current &&
        !witnessSearchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsRecentDisputesFilterOpen(false);
        setShowDefendantSuggestions(false);
        setShowWitnessSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Defendant search function - SEPARATE from witnesses
  const handleDefendantSearch = useCallback(
    async (query: string) => {
      // Remove @ symbol from query for searching
      const cleanQuery = query.startsWith("@") ? query.substring(1) : query;

      if (cleanQuery.length < 1) {
        setDefendantSearchResults([]);
        setShowDefendantSuggestions(false);
        return;
      }

      setIsDefendantSearchLoading(true);
      setShowDefendantSuggestions(true);

      try {
        // Search with the cleaned query (without @)
        const results = await disputeService.searchUsers(cleanQuery);

        const currentUserTelegram = getCurrentUserTelegram(currentUser);
        const filteredResults = results.filter((resultUser) => {
          const resultTelegram = cleanTelegramUsername(
            resultUser.telegramUsername ||
            resultUser.telegram?.username ||
            resultUser.telegramInfo,
          );

          return (
            resultTelegram &&
            resultTelegram.toLowerCase() !== currentUserTelegram.toLowerCase()
          );
        });

        setDefendantSearchResults(filteredResults);
      } catch (error) {
        console.error("Defendant search failed:", error);
        setDefendantSearchResults([]);
      } finally {
        setIsDefendantSearchLoading(false);
      }
    },
    [currentUser],
  );

  // Witness search function - SEPARATE from defendant
  const handleWitnessSearch = useCallback(
    async (query: string) => {
      // Remove @ symbol from query for searching
      const cleanQuery = query.startsWith("@") ? query.substring(1) : query;

      if (cleanQuery.length < 2) {
        setWitnessSearchResults([]);
        setShowWitnessSuggestions(false);
        return;
      }

      setIsWitnessSearchLoading(true);
      setShowWitnessSuggestions(true);

      try {
        // Search with the cleaned query (without @)
        const results = await disputeService.searchUsers(cleanQuery);

        const currentUserTelegram = getCurrentUserTelegram(currentUser);
        const filteredResults = results.filter((resultUser) => {
          const resultTelegram = cleanTelegramUsername(
            resultUser.telegramUsername ||
            resultUser.telegram?.username ||
            resultUser.telegramInfo,
          );

          return (
            resultTelegram &&
            resultTelegram.toLowerCase() !== currentUserTelegram.toLowerCase()
          );
        });

        setWitnessSearchResults(filteredResults);
      } catch (error) {
        console.error("Witness search failed:", error);
        setWitnessSearchResults([]);
      } finally {
        setIsWitnessSearchLoading(false);
      }
    },
    [currentUser],
  );

  // Debounced search effects
  useEffect(() => {
    if (debouncedDefendantQuery.length >= 1) {
      handleDefendantSearch(debouncedDefendantQuery);
    } else {
      setDefendantSearchResults([]);
      setShowDefendantSuggestions(false);
    }
  }, [debouncedDefendantQuery, handleDefendantSearch]);

  useEffect(() => {
    if (debouncedWitnessQuery.length >= 2) {
      handleWitnessSearch(debouncedWitnessQuery);
    } else {
      setWitnessSearchResults([]);
      setShowWitnessSuggestions(false);
    }
  }, [debouncedWitnessQuery, handleWitnessSearch]);

  // Handle user selection
  const handleUserSelect = (
    username: string,
    field: "defendant" | "witness",
    index?: number,
  ) => {
    // Display with @ symbol, but store without it
    const valueWithAt = `@${username}`;

    if (field === "defendant") {
      setForm((prev) => ({ ...prev, defendant: valueWithAt }));
      setShowDefendantSuggestions(false);
      setDefendantSearchQuery(""); // Clear search query
    } else if (field === "witness" && index !== undefined) {
      updateWitness(index, valueWithAt);
      setShowWitnessSuggestions(false);
      setWitnessSearchQuery(""); // Clear search query
    }
  };

  // Filter and sort disputes
  const filteredDisputes = useMemo(() => {
    if (!data.length) return [];

    let result = data.filter((d) => {
      // Status filter
      if (status !== "All" && d.status !== status) return false;

      // Date range filter
      if (dateRange !== "All") {
        const days = dateRange === "7d" ? 7 : 30;
        const dtime = new Date(d.createdAt).getTime();
        if (Date.now() - dtime > days * 24 * 60 * 60 * 1000) return false;
      }

      // Search query filter - search across multiple fields
      if (query.trim()) {
        const searchTerm = query.toLowerCase().trim();

        // Get all searchable fields
        const searchableText = [
          d.title || "",
          d.plaintiff || "",
          d.defendant || "",
          d.claim || "",
          d.parties || "",
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchTerm);
      }

      return true;
    });

    // Sort by date
    result = result.sort((a, b) => {
      const parseDate = (dateStr: string): Date => {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date(0) : date;
      };

      const aDate = parseDate(a.createdAt);
      const bDate = parseDate(b.createdAt);

      return sortAsc
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    });

    return result;
  }, [data, status, dateRange, query, sortAsc]);

  // Store all filtered disputes
  useEffect(() => {
    setAllDisputes(filteredDisputes);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredDisputes]);

  // Apply pagination
  const applyPagination = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = allDisputes.slice(startIndex, endIndex);
    setPaginatedDisputes(paginated);
  }, [allDisputes, currentPage, pageSize]);

  // Apply pagination when dependencies change
  useEffect(() => {
    applyPagination();
  }, [applyPagination]);

  // Calculate pagination info
  const totalPages = Math.ceil(allDisputes.length / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, allDisputes.length);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Add this computed value near your other filtered data
  const filteredRecentDisputes = useMemo(() => {
    return data
      .slice(0, 5) // Show only recent 5 disputes
      .filter((d) =>
        recentDisputesFilter === "All"
          ? true
          : d.status === recentDisputesFilter,
      );
  }, [data, recentDisputesFilter]);

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];

    // Calculate current total size
    const currentTotalSize = form.evidence.reduce(
      (total, file) => total + file.file.size,
      0,
    );

    Array.from(selectedFiles).forEach((file) => {
      const fileSizeMB = file.size / 1024 / 1024;
      const fileType = file.type.startsWith("image/") ? "image" : "document";

      // Apply file size limits based on file type
      if (fileType === "image" && fileSizeMB > 2) {
        toast.error(
          `Image "${file.name}" exceeds 2MB limit (${fileSizeMB.toFixed(2)}MB)`,
        );
        return;
      }

      if (fileType === "document" && fileSizeMB > 3) {
        toast.error(
          `Document "${file.name}" exceeds 3MB limit (${fileSizeMB.toFixed(2)}MB)`,
        );
        return;
      }

      // Check if adding this file would exceed total size limit
      if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
        toast.error(
          `Adding "${file.name}" would exceed total 50MB limit. Current total: ${(currentTotalSize / 1024 / 1024).toFixed(2)}MB`,
        );
        return;
      }

      // Validate file type
      if (
        !ALLOWED_IMAGE_TYPES.includes(file.type) &&
        !ALLOWED_DOCUMENT_TYPES.includes(file.type)
      ) {
        toast.error(
          `File "${file.name}" has unsupported type. Allowed: images (JPEG, PNG, GIF, WebP), PDFs, Word docs, text files`,
        );
        return;
      }

      const fileSize = fileSizeMB.toFixed(2) + " MB";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSize,
      };

      newFiles.push(newFile);

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          // Update the specific file with preview
          setForm((prev) => ({
            ...prev,
            evidence: prev.evidence.map((f) =>
              f.id === newFile.id ? { ...f, preview: newFile.preview } : f,
            ),
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    // Add all valid files to evidence
    if (newFiles.length > 0) {
      setForm((prev) => ({
        ...prev,
        evidence: [...prev.evidence, ...newFiles],
      }));
    }
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((file) => file.id !== id),
    }));
  };

  // Drag and drop handlers
  const [isDragOver, setIsDragOver] = useState(false);

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
    // Create a DataTransfer to set files
    const dataTransfer = new DataTransfer();
    Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;

    // Trigger the file input change event
    const event = new Event("change", { bubbles: true });
    input.dispatchEvent(event);

    // Use our existing file handler
    handleFileSelect({
      target: { files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  function addWitness() {
    setForm((f) =>
      f.witnesses.length >= 5 ? f : { ...f, witnesses: [...f.witnesses, ""] },
    );
  }

  function updateWitness(i: number, v: string) {
    setForm((f) => ({
      ...f,
      witnesses: f.witnesses.map((w, idx) => (idx === i ? v : w)),
    }));
  }

  function removeWitness(i: number) {
    setForm((f) => ({
      ...f,
      witnesses: f.witnesses.filter((_, idx) => idx !== i),
    }));
  }

  const transactionProcessingRef = useRef({
    hasProcessed: false,
    transactionHash: null as string | null,
  });

  const createDisputeAfterTransaction = useCallback(
    async (transactionHash: string) => {
      setIsSubmitting(true);

      try {
        console.log("🚀 Creating paid dispute after transaction...", {
          txHash: transactionHash, // Use it here
        });

        const cleanedDefendant = isValidWalletAddress(form.defendant)
          ? form.defendant
          : cleanTelegramUsername(form.defendant);

        const cleanedWitnesses = form.witnesses
          .filter((w) => w.trim())
          .map((w) => (isValidWalletAddress(w) ? w : cleanTelegramUsername(w)));

        const requestKind = DisputeTypeEnum.Paid;

        const createDisputeData: CreateDisputeRequest = {
          title: form.title,
          description: form.description,
          requestKind,
          defendant: cleanedDefendant,
          claim: form.claim,
          witnesses: cleanedWitnesses,
          chainId: networkInfo.chainId, // Send chainId for paid disputes
        };

        const files = form.evidence.map((uf) => uf.file);

        // Call the updated createDispute method with chainId
        const result = await disputeService.createDispute(
          createDisputeData,
          files,
          networkInfo.chainId,
        );

        console.log("✅ Paid dispute created:", result);
        toast.success("Paid dispute submitted successfully!", {
          description: `${form.title} has been recorded on-chain and in our system`,
        });

        // Reset form
        setOpen(false);
        setForm({
          title: "",
          kind: "Pro Bono",
          defendant: "",
          description: "",
          claim: "",
          evidence: [],
          witnesses: [""],
        });

        refetch();
      } catch (error: any) {
        console.error("❌ Dispute creation failed after transaction:", error);
        toast.error("Failed to create dispute", {
          description:
            error.message ||
            "Transaction succeeded but dispute creation failed",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      form.title,
      form.description,
      form.defendant,
      form.claim,
      form.witnesses,
      form.evidence,
      networkInfo.chainId,
      refetch,
      setOpen,
      setForm,
      setIsSubmitting,
      // Note: Add any other dependencies that are used inside the function
    ],
  );

  // Handle transaction status changes
  useEffect(() => {
    console.log("🔄 Transaction effect running:", {
      isWritePending,
      isTransactionSuccess,
      writeError,
      isTransactionError,
      isProcessingPaidDispute,
      hash,
      hasProcessed: transactionProcessingRef.current.hasProcessed,
    });

    if (isWritePending) {
      console.log("⏳ Transaction pending...");
      setTransactionStep("pending");
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
    } else if (isTransactionSuccess && hash && isProcessingPaidDispute) {
      console.log("✅ Transaction successful!");

      // Check if we've already processed this transaction
      if (
        transactionProcessingRef.current.hasProcessed &&
        transactionProcessingRef.current.transactionHash === hash
      ) {
        console.log("⏸️ Already processed this transaction, skipping");
        return;
      }

      // Mark as processed
      transactionProcessingRef.current = {
        hasProcessed: true,
        transactionHash: hash,
      };

      console.log("🚀 Creating dispute for successful transaction");
      setTransactionStep("success");
      setIsProcessingPaidDispute(false);

      // Create the dispute after successful transaction
      createDisputeAfterTransaction(hash);
    } else if (writeError || isTransactionError) {
      console.log("❌ Transaction failed");
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
    }
  }, [
    isWritePending,
    isTransactionSuccess,
    writeError,
    isTransactionError,
    isProcessingPaidDispute,
    hash,
    createDisputeAfterTransaction,
  ]);

  // Reset processing ref when modal closes
  useEffect(() => {
    if (!open) {
      transactionProcessingRef.current = {
        hasProcessed: false,
        transactionHash: null,
      };
      setTransactionStep("idle");
      setIsProcessingPaidDispute(false);
      resetWrite();
    }
  }, [open, resetWrite]);

  // Function to create dispute after successful transaction

  // Function to create dispute on-chain (for paid disputes)
  const createDisputeOnchain = useCallback(async (): Promise<void> => {
    console.log("🟡 [DEBUG] createDisputeOnchain STARTED");

    try {
      console.log("🔍 [DEBUG] Network Info:", {
        chainId: networkInfo.chainId,
      });

      const contractAddress = VOTING_CA[networkInfo.chainId as number];
      console.log("📝 [DEBUG] Contract lookup:", {
        chainId: networkInfo.chainId,
        contractAddress,
        availableChains: Object.keys(VOTING_CA),
      });

      if (!contractAddress) {
        console.error(
          "❌ [DEBUG] No contract address found for chain ID",
          networkInfo.chainId,
        );
        throw new Error(
          `No contract address found for chain ID ${networkInfo.chainId}`,
        );
      }

      // Fetch on-chain vote configs for fee amount
      const configs = await getVoteConfigs(networkInfo.chainId);

      console.log("📊 [DEBUG] On-chain configs:", {
        feeAmount: configs?.feeAmount?.toString(),
        configsExist: !!configs,
      });

      console.log("🎯 [DEBUG] Voting ID to use:", votingIdToUse);
      console.log("🔢 [DEBUG] BigInt conversion:", {
        original: votingIdToUse,
        bigInt: BigInt(votingIdToUse),
      });

      const feeValue = configs ? configs.feeAmount : undefined;

      console.log("💰 [DEBUG] Transaction details:", {
        contractAddress,
        functionName: "raiseDispute",
        args: [BigInt(votingIdToUse), false],
        value: feeValue?.toString(),
        hasFee: !!feeValue,
      });

      console.log("⏳ [DEBUG] Calling writeContract...");

      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "raiseDispute",
        args: [BigInt(votingIdToUse), false],
        value: feeValue,
      });

      console.log("✅ [DEBUG] writeContract called successfully");
      console.log(
        "🟢 [DEBUG] Transaction initiated - waiting for confirmation",
      );
    } catch (error: any) {
      console.error("❌ [DEBUG] createDisputeOnchain ERROR:", error);

      toast.error("Failed to initiate smart contract transaction", {
        description:
          error.message || "Please check your wallet connection and try again.",
      });

      console.log("🔧 [DEBUG] Setting error state");
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);
    }
  }, [networkInfo.chainId, votingIdToUse, writeContract]);

  // Retry transaction function
  const retryTransaction = useCallback(() => {
    setTransactionStep("idle");
    resetWrite();
    if (form.kind === "Paid") {
      createDisputeOnchain();
    }
  }, [form.kind, createDisputeOnchain, resetWrite]);

  // Replace your existing submit function with this updated version
  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Form validation (same as before)
    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!form.defendant.trim()) {
      toast.error("Please enter defendant information");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!form.claim.trim()) {
      toast.error("Please enter your claim");
      return;
    }
    if (form.evidence.length === 0) {
      toast.error("Please upload at least one evidence file");
      return;
    }

    // Validate file sizes and types
    const totalSize = form.evidence.reduce(
      (total, file) => total + file.file.size,
      0,
    );

    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error("Total file size too large", {
        description: `Total file size is ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum total size is 50MB.`,
        duration: 8000,
      });
      return;
    }

    // Check individual file sizes and types
    for (const file of form.evidence) {
      if (file.file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.file.name} exceeds 10MB size limit`);
        return;
      }

      const fileType = file.file.type;
      if (
        !ALLOWED_IMAGE_TYPES.includes(fileType) &&
        !ALLOWED_DOCUMENT_TYPES.includes(fileType)
      ) {
        toast.error(
          `File ${file.file.name} has unsupported type. Allowed: images, PDFs, Word docs, text files`,
        );
        return;
      }
    }

    // Validate Telegram usernames
    const cleanedDefendantInput = cleanTelegramUsername(form.defendant);
    if (
      !isValidTelegramUsername(cleanedDefendantInput) &&
      !isValidWalletAddress(form.defendant)
    ) {
      toast.error("Enter a valid Telegram username or wallet address");
      return;
    }

    const invalidWitnesses = form.witnesses
      .filter((w) => w.trim())
      .map((w) => cleanTelegramUsername(w))
      .filter((w) => !isValidTelegramUsername(w) && !isValidWalletAddress(w));

    if (invalidWitnesses.length > 0) {
      toast.error("Please enter valid Telegram usernames for all witnesses");
      return;
    }

    // Handle based on dispute type
    if (form.kind === "Paid") {
      // For paid disputes, FIRST call smart contract
      setIsProcessingPaidDispute(true);
      await createDisputeOnchain();
    } else {
      // For pro bono disputes, create directly
      setIsSubmitting(true);

      try {
        console.log("🚀 Preparing pro bono dispute submission...");

        const cleanedDefendant = isValidWalletAddress(form.defendant)
          ? form.defendant
          : cleanTelegramUsername(form.defendant);

        const cleanedWitnesses = form.witnesses
          .filter((w) => w.trim())
          .map((w) => (isValidWalletAddress(w) ? w : cleanTelegramUsername(w)));

        const requestKind = DisputeTypeEnum.ProBono;

        const createDisputeData: CreateDisputeRequest = {
          title: form.title,
          description: form.description,
          requestKind,
          defendant: cleanedDefendant,
          claim: form.claim,
          witnesses: cleanedWitnesses,
        };

        const files = form.evidence.map((uf) => uf.file);

        // Call service method for pro bono dispute (without chainId)
        const result = await disputeService.createDispute(
          createDisputeData,
          files,
        );

        console.log("✅ Pro bono dispute created:", result);
        toast.success("Pro Bono dispute submitted successfully", {
          description: `${form.title} has been submitted for review`,
        });

        // Reset form
        setOpen(false);
        setForm({
          title: "",
          kind: "Pro Bono",
          defendant: "",
          description: "",
          claim: "",
          evidence: [],
          witnesses: [""],
        });

        refetch();
      } catch (error: any) {
        console.error("❌ Submission failed:", error);
        toast.error("Failed to submit dispute", { description: error.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="relative space-y-8">
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-muted-foreground">Loading disputes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative space-y-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-400">Failed to load disputes</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* <div className="absolute block size-[20rem] rounded-full bg-cyan-500/20 blur-3xl lg:top-28 lg:right-20 lg:size-[30rem]"></div>
      <div className="absolute -top-20 -left-6 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[25rem]"></div>
      <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div> */}

      {/* Intro section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* left column */}
        <div className="col-span-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl text-white">Disputes</h1>
            <Button
              variant="neon"
              className="neon-hover"
              onClick={() => setOpen(true)}
            >
              <Scale className="mr-2 h-4 w-4" />
              Raise New Dispute
            </Button>
          </div>
          <JudgesIntro />
        </div>

        <section className="col-span-5 mt-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative grow sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent Enter key from submitting forms
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                placeholder="Search by username, title, or claim"
                className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm ring-0 outline-none focus:border-cyan-400/40"
              />
            </div>
            <div className="relative w-48" ref={dropdownRef}>
              {/* Dropdown Trigger */}
              <div
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-cyan-400/30"
              >
                <span>
                  {filterOptions.find((f) => f.value === status)?.label ||
                    "All"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""
                    }`}
                />
              </div>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-[110%] right-0 z-50 w-full overflow-hidden rounded-md border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                  {filterOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setStatus(option.value as DisputeRow["status"] | "All");
                        setIsOpen(false);
                      }}
                      className={`cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white ${status === option.value
                        ? "bg-cyan-500/20 text-cyan-200"
                        : ""
                        }`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="appearance-none rounded-md border border-white/10 bg-white/5 px-3 py-1.5 pr-8 text-xs text-white outline-none focus:border-cyan-400/40 focus:ring-0"
                  >
                    <option className="text-black" value="All">
                      All
                    </option>
                    <option className="text-black" value="7d">
                      Last 7d
                    </option>
                    <option className="text-black" value="30d">
                      Last 30d
                    </option>
                  </select>

                  <svg
                    className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                onClick={(e) => {
                  e.preventDefault(); // Add this line
                  setSortAsc((v) => !v);
                }}
              >
                {sortAsc ? (
                  <SortAsc className="mr-2 h-4 w-4" />
                ) : (
                  <SortDesc className="mr-2 h-4 w-4" />
                )}{" "}
                Sort
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-b-2 border-white/10 p-0 ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="font-semibold text-white/90">Disputes</h3>
              <div className="text-sm text-cyan-300">
                {allDisputes.length}{" "}
                {allDisputes.length === 1 ? "dispute" : "disputes"}
              </div>
            </div>

            {/* Page Size Selector */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-cyan-300">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  <option className="text-black" value={5}>
                    5
                  </option>
                  <option className="text-black" value={10}>
                    10
                  </option>
                  <option className="text-black" value={20}>
                    20
                  </option>
                  <option className="text-black" value={50}>
                    50
                  </option>
                </select>
                <span className="text-sm text-cyan-300">per page</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full lg:text-sm">
                <thead>
                  <tr className="text-left text-sm font-semibold">
                    <th className="px-5 py-3 text-cyan-300">Creation date</th>
                    <th className="px-5 py-3 text-emerald-300">Title</th>
                    <th className="px-5 py-3 text-yellow-300">Request type</th>
                    <th className="px-5 py-3 text-pink-300">Parties</th>
                    <th className="px-5 py-3 text-purple-300">Claim</th>
                    <th className="px-5 py-3 text-indigo-300">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <>
                      {Array.from({ length: pageSize }).map((_, index) => (
                        <DisputeSkeleton key={index} />
                      ))}
                    </>
                  ) : paginatedDisputes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-cyan-300"
                      >
                        No disputes found.
                      </td>
                    </tr>
                  ) : (
                    paginatedDisputes.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => navigate(`/disputes/${d.id}`)}
                        className="cursor-pointer border-t border-white/10 text-xs transition hover:bg-cyan-500/10"
                      >
                        <td className="text-muted-foreground min-w-[120px] px-5 py-4">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 font-medium text-white/90">
                          <div className="max-w-[200px]">
                            <div className="truncate font-medium">
                              {d.title}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">{d.request}</td>
                        <td className="px-5 py-4 text-white/90">
                          <div className="flex items-center gap-2">
                            {/* Plaintiff with Avatar */}
                            <div className="flex items-center gap-1">
                              <UserAvatar
                                userId={
                                  d.plaintiffData?.userId ||
                                  cleanTelegramUsername(d.plaintiff)
                                }
                                avatarId={d.plaintiffData?.avatarId || null}
                                username={cleanTelegramUsername(d.plaintiff)}
                                size="sm"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cleanUsername = cleanTelegramUsername(
                                    d.plaintiff,
                                  );
                                  const encodedUsername =
                                    encodeURIComponent(cleanUsername);
                                  navigate(`/profile/${encodedUsername}`);
                                }}
                                className="text-cyan-300 hover:text-cyan-200 hover:underline"
                              >
                                {formatPartyDisplay(d.plaintiff)}{" "}
                                {/* Updated here */}
                              </button>
                            </div>

                            {/* VS Icon */}
                            <span className="text-cyan-400">
                              <FaArrowRightArrowLeft />
                            </span>

                            {/* Defendant with Avatar */}
                            <div className="flex items-center gap-1">
                              <UserAvatar
                                userId={
                                  d.defendantData?.userId ||
                                  cleanTelegramUsername(d.defendant)
                                }
                                avatarId={d.defendantData?.avatarId || null}
                                username={cleanTelegramUsername(d.defendant)}
                                size="sm"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cleanUsername = cleanTelegramUsername(
                                    d.defendant,
                                  );
                                  const encodedUsername =
                                    encodeURIComponent(cleanUsername);
                                  navigate(`/profile/${encodedUsername}`);
                                }}
                                className="text-cyan-300 hover:text-cyan-200 hover:underline"
                              >
                                {formatPartyDisplay(d.defendant)}{" "}
                                {/* Updated here */}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="max-w-[250px]">
                            <div className="text-muted-foreground line-clamp-2 text-xs">
                              {d.claim}
                            </div>
                          </div>
                        </td>
                        <td className="min-w-[200px] px-2 py-4">
                          {d.status === "Settled" ? (
                            <span className="badge badge-blue">Settled</span>
                          ) : d.status === "Pending" ? (
                            <span className="badge badge-orange">Pending</span>
                          ) : d.status === "Dismissed" ? (
                            <span className="badge badge-red">Dismissed</span>
                          ) : d.status === "pending Payment" ? (
                            <span className="badge border-yellow" >pending Payment</span>
                          )
                            : (
                              <span className="badge border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                                Vote in Progress
                              </span>
                            )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {paginatedDisputes.length === 0 && !loading && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No disputes found matching your criteria.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && allDisputes.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
                <div className="text-sm whitespace-nowrap text-cyan-300">
                  Showing {startItem} to {endItem} of {allDisputes.length}{" "}
                  disputes
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
          </div>
        </section>

        {/* Recent Disputes Sidebar */}
        <div className="col-span-2 hidden">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white/90">Recent Disputes</h3>
            <div
              className="group relative w-[10rem]"
              ref={recentDisputesDropdownRef}
            >
              <div
                onClick={() =>
                  setIsRecentDisputesFilterOpen(!isRecentDisputesFilterOpen)
                }
                className="flex cursor-pointer items-center justify-between rounded-md bg-white px-3 py-1 text-sm text-black transition-all dark:bg-[#d5f2f80a] dark:text-white"
              >
                {
                  recentDisputesFilterOptions.find(
                    (f) => f.value === recentDisputesFilter,
                  )?.label
                }
                <div className="bg-Primary flex h-8 w-8 items-center justify-center rounded-md">
                  <ChevronDown
                    className={`transform text-2xl text-white transition-transform duration-300 ${isRecentDisputesFilterOpen ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </div>

              {isRecentDisputesFilterOpen && (
                <div className="absolute top-[110%] right-0 z-50 w-full rounded-xl bg-cyan-800 shadow-md">
                  {recentDisputesFilterOptions.map((option, idx) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setRecentDisputesFilter(option.value);
                        setIsRecentDisputesFilterOpen(false);
                      }}
                      className={`cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-cyan-300 hover:text-white ${idx === 0 ? "rounded-t-xl" : ""
                        } ${idx === recentDisputesFilterOptions.length - 1
                          ? "rounded-b-xl"
                          : ""
                        }`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card-cyan border p-4">
            <ul className="space-y-3 text-sm">
              {filteredRecentDisputes.length === 0 ? (
                <li className="text-muted-foreground py-3 text-center text-xs">
                  No disputes found.
                </li>
              ) : (
                filteredRecentDisputes.map((dispute) => (
                  <li
                    key={dispute.id}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-white">
                        {dispute.title}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {dispute.parties.replace(" vs ", " ↔ ")}
                      </div>
                      <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {dispute.claim}
                      </div>
                    </div>
                    <span
                      className={`badge ml-2 text-xs ${dispute.status === "Pending"
                        ? "badge-orange"
                        : dispute.status === "Vote in Progress"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : dispute.status === "Settled"
                            ? "badge-blue"
                            : dispute.status === "Dismissed"
                              ? "badge-red"
                              : ""
                        }`}
                    >
                      {dispute.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Create Dispute Modal */}
      {open && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() =>
              !isSubmitting && !isProcessingPaidDispute && setOpen(false)
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
                <div className="flex items-center gap-3">
                  <Scale className="h-6 w-6 text-cyan-300" />
                  <h3 className="text-xl font-semibold text-cyan-300">
                    Raise New Dispute
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-white/70 hover:text-white"
                  disabled={
                    isSubmitting ||
                    transactionStep === "pending" ||
                    isProcessingPaidDispute
                  }
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
                {/* Transaction Status Display */}
                {transactionStep !== "idle" && (
                  <div className="mb-4">
                    <TransactionStatus
                      status={transactionStep}
                      onRetry={retryTransaction}
                    />
                  </div>
                )}

                <form
                  onSubmit={submit}
                  className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
                >
                  {/* Title field */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-muted-foreground text-sm">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative cursor-help">
                        <Info className="h-4 w-4 text-cyan-300" />
                        <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                          Never underestimate the power of a catchy title — it
                          can grab attention and attract judges to your case
                          faster.
                        </div>
                      </div>
                    </div>
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
                      placeholder="e.g. He refused to issue a refund despite going AWOL for weeks!"
                      disabled={
                        isSubmitting ||
                        transactionStep === "pending" ||
                        isProcessingPaidDispute
                      }
                    />
                  </div>

                  {/* Request Kind */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-muted-foreground text-sm">
                        Request Kind <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="group relative cursor-pointer">
                          <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                            Pro Bono
                          </span>
                          <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            No payment required. Judges will handle your case
                            pro bono when available.
                          </div>
                        </div>
                        <div className="group relative cursor-pointer">
                          <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                            Paid
                          </span>
                          <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                            A fee is required to initiate your dispute. This fee
                            helps prioritize your case and notifies all judges
                            to begin reviewing it immediately.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(["Pro Bono", "Paid"] as const).map((kind) => (
                        <label
                          key={kind}
                          className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${form.kind === kind
                            ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                            : "border-white/10 bg-white/5"
                            } ${isSubmitting ||
                              transactionStep === "pending" ||
                              isProcessingPaidDispute
                              ? "cursor-not-allowed opacity-50"
                              : ""
                            }`}
                        >
                          <input
                            type="radio"
                            name="kind"
                            className="hidden"
                            checked={form.kind === kind}
                            onChange={() => setForm({ ...form, kind })}
                            disabled={
                              isSubmitting ||
                              transactionStep === "pending" ||
                              isProcessingPaidDispute
                            }
                          />
                          {kind === "Paid" && <Wallet className="h-4 w-4" />}
                          {kind}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Defendant Field with User Search */}
                  <div className="relative" ref={defendantSearchRef}>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Defendant <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-cyan-400">
                        (Start typing to search users)
                      </span>
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                      <input
                        value={form.defendant}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm({ ...form, defendant: value });
                          setDefendantSearchQuery(value);
                        }}
                        onFocus={() => {
                          if (
                            form.defendant.replace(/^@/, "").trim().length >= 1
                          ) {
                            setShowDefendantSuggestions(true);
                          }
                        }}
                        className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                        placeholder="Type username (with or without @)..."
                        required
                        disabled={
                          isSubmitting ||
                          transactionStep === "pending" ||
                          isProcessingPaidDispute
                        }
                      />
                      {isDefendantSearchLoading && (
                        <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                      )}
                    </div>

                    {/* Defendant Suggestions Dropdown */}
                    {showDefendantSuggestions && (
                      <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                        {defendantSearchResults.length > 0 ? (
                          defendantSearchResults.map((user) => (
                            <UserSearchResult
                              key={user.id}
                              user={user}
                              onSelect={handleUserSelect}
                              field="defendant"
                            />
                          ))
                        ) : defendantSearchQuery.replace(/^@/, "").trim()
                          .length >= 1 && !isDefendantSearchLoading ? (
                          <div className="px-4 py-3 text-center text-sm text-cyan-300">
                            No users found for "
                            {defendantSearchQuery.replace(/^@/, "")}"
                            <div className="mt-1 text-xs text-cyan-400">
                              You may also enter a wallet address directly
                            </div>
                          </div>
                        ) : null}

                        {defendantSearchQuery.replace(/^@/, "").trim().length <
                          1 && (
                            <div className="px-4 py-3 text-center text-sm text-cyan-300">
                              Type at least 1 character to search
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Description field */}
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
                      className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
                      placeholder="Describe the situation, milestones, messages, and expectations"
                      disabled={
                        isSubmitting ||
                        transactionStep === "pending" ||
                        isProcessingPaidDispute
                      }
                    />
                  </div>

                  {/* Claim Section */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-muted-foreground text-sm">
                        Claim <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative cursor-help">
                        <Info className="h-4 w-4 text-cyan-300" />
                        <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                          Make sure it's reasonable, as that might help your
                          case when the judges look into it.
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={form.claim || ""}
                      onChange={(e) =>
                        setForm({ ...form, claim: e.target.value })
                      }
                      className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
                      placeholder="What do you want the court to do for you?"
                      disabled={
                        isSubmitting ||
                        transactionStep === "pending" ||
                        isProcessingPaidDispute
                      }
                    />
                  </div>

                  {/* Evidence Upload Section */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Evidence Upload <span className="text-red-500">*</span>
                      {form.evidence.length > 0 && (
                        <span className="ml-2 text-xs text-yellow-400">
                          (Total: {getTotalFileSize(form.evidence)})
                        </span>
                      )}
                    </label>

                    {/* Drag and Drop Area */}
                    <div
                      className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${isDragOver
                        ? "border-cyan-400/60 bg-cyan-500/20"
                        : "border-white/15 bg-white/5 hover:border-cyan-400/40"
                        } ${isSubmitting ||
                          transactionStep === "pending" ||
                          isProcessingPaidDispute
                          ? "cursor-not-allowed opacity-50"
                          : ""
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
                        id="evidence-upload"
                        disabled={
                          isSubmitting ||
                          transactionStep === "pending" ||
                          isProcessingPaidDispute
                        }
                      />
                      <label
                        htmlFor="evidence-upload"
                        className={`flex cursor-pointer flex-col items-center justify-center px-4 py-8 text-center ${isSubmitting ||
                          transactionStep === "pending" ||
                          isProcessingPaidDispute
                          ? "cursor-not-allowed"
                          : ""
                          }`}
                      >
                        <Upload className="mb-3 h-8 w-8 text-cyan-400" />
                        <div className="text-sm text-cyan-300">
                          {isDragOver
                            ? "Drop files here"
                            : "Click to upload or drag and drop"}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          Supports images{" "}
                          <span className="text-yellow-300">(max 2MB) </span>,
                          documents{" "}
                          <span className="text-yellow-300">(max 3MB)</span>
                          <br />
                          <span className="text-yellow-300">
                            Max total size: 50MB
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* File List with Previews */}
                    {form.evidence.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-cyan-200">
                            Selected Files ({form.evidence.length})
                          </h4>
                          <div className="text-xs text-yellow-400">
                            Total: {getTotalFileSize(form.evidence)}
                          </div>
                        </div>
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
                              disabled={
                                isSubmitting ||
                                transactionStep === "pending" ||
                                isProcessingPaidDispute
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Witnesses with User Search */}
                  <div ref={witnessSearchRef}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-muted-foreground text-sm">
                        Witness list (max 5)
                        <span className="ml-2 text-xs text-cyan-400">
                          (Start typing to search users)
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                        onClick={addWitness}
                        disabled={
                          form.witnesses.length >= 5 ||
                          isSubmitting ||
                          transactionStep === "pending" ||
                          isProcessingPaidDispute
                        }
                      >
                        Add witness
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {form.witnesses.map((w, i) => (
                        <div
                          key={i}
                          className="relative flex items-center gap-2"
                        >
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                            <input
                              value={w}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateWitness(i, value);
                                setWitnessSearchQuery(value);
                              }}
                              onFocus={() => {
                                setActiveWitnessIndex(i);
                                const searchValue = w.startsWith("@")
                                  ? w.substring(1)
                                  : w;
                                if (searchValue.length >= 2) {
                                  setShowWitnessSuggestions(true);
                                }
                              }}
                              className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                              placeholder={`Type username with or without @ (min 2 characters)...`}
                              disabled={
                                isSubmitting ||
                                transactionStep === "pending" ||
                                isProcessingPaidDispute
                              }
                            />
                            {isWitnessSearchLoading &&
                              activeWitnessIndex === i && (
                                <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                              )}
                          </div>
                          {form.witnesses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWitness(i)}
                              className="text-muted-foreground rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs hover:text-white"
                              disabled={
                                isSubmitting ||
                                transactionStep === "pending" ||
                                isProcessingPaidDispute
                              }
                            >
                              Remove
                            </button>
                          )}

                          {/* Witness User Suggestions Dropdown */}
                          {showWitnessSuggestions &&
                            activeWitnessIndex === i && (
                              <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                                {witnessSearchResults.length > 0 ? (
                                  witnessSearchResults.map((user) => (
                                    <UserSearchResult
                                      key={user.id}
                                      user={user}
                                      onSelect={handleUserSelect}
                                      field="witness"
                                      index={i}
                                    />
                                  ))
                                ) : witnessSearchQuery.length >= 2 &&
                                  !isWitnessSearchLoading ? (
                                  <div className="px-4 py-3 text-center text-sm text-cyan-300">
                                    No users found for "{witnessSearchQuery}"
                                    <div className="mt-1 text-xs text-cyan-400">
                                      Make sure the user exists and has a
                                      Telegram username
                                    </div>
                                  </div>
                                ) : null}

                                {witnessSearchQuery.length < 2 && (
                                  <div className="px-4 py-3 text-center text-sm text-cyan-300">
                                    Type at least 2 characters to search
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Contract Info for Paid Disputes */}
                  {form.kind === "Paid" &&
                    transactionStep === "idle" &&
                    !isSubmitting && (
                      <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-cyan-300" />
                          <h4 className="text-sm font-medium text-cyan-200">
                            Smart Contract Transaction Required
                          </h4>
                        </div>
                        <p className="mt-2 text-xs text-cyan-300/80">
                          For paid disputes, you'll need to confirm a
                          transaction in your wallet to record the dispute
                          on-chain. This ensures transparency and security for
                          your case.
                        </p>
                        <div className="mt-3 text-xs text-cyan-400">
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <span>Generated Voting ID: {votingIdToUse}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>•</span>
                            <span>Network: {networkInfo.chainName}</span>
                          </div>
                        </div>
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
                          description: "Your dispute has been saved as draft",
                        });
                        setOpen(false);
                      }}
                      disabled={
                        isSubmitting ||
                        transactionStep === "pending" ||
                        isProcessingPaidDispute
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
                        transactionStep === "pending" ||
                        isProcessingPaidDispute
                      }
                    >
                      {isSubmitting || transactionStep === "pending" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {form.kind === "Paid" && transactionStep === "pending"
                            ? "Processing Transaction..."
                            : "Creating Dispute..."}
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {form.kind === "Paid"
                            ? "Pay & Submit Dispute"
                            : "Submit Dispute"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function JudgesIntro() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      className={`card-cyan relative col-span-2 overflow-hidden rounded-2xl p-6 transition-all duration-300 ${expanded ? "h-auto" : "lg:h-[14rem]"
        }`}
    >
      {/* Cyan glow effect */}
      <div className="absolute top-0 -right-10 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[20rem]"></div>

      {/* Heading */}
      <h3 className="space text-lg font-semibold text-white/90">
        Have you been wronged or cheated? Don't stay silent, start a{" "}
        <span className="text-[#0891b2]">dispute</span>.
      </h3>

      {/* Judges info */}
      <div className="text-muted-foreground mt-3 text-sm">
        <h3 className="font-semibold text-white/90">Who Judges Your Case?</h3>
        <p className="text-muted-foreground space mt-1 text-cyan-400">Judges</p>
        <p>
          DexCourt's panel of judges consists of reputable and well-known
          figures across both Web3 and traditional spaces.
        </p>

        {/* Always visible part */}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Top influencers (e.g., IncomeSharks)</li>

          {/* Hidden part starts here */}
          {expanded && (
            <>
              <li>Leading project founders (e.g., CZ)</li>
              <li>Experienced blockchain developers</li>
              <li>Respected degens with strong community reputation</li>
              <li>Licensed lawyers and real-world judges</li>
              <li>Prominent Web2 personalities</li>
            </>
          )}
        </ul>

        {/* Hidden explanatory text */}
        {expanded && (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              These individuals are selected based on proven{" "}
              <span className="text-cyan-400">
                credibility, influence, and integrity
              </span>{" "}
              within their respective domains.
            </p>

            <p className="text-muted-foreground space mt-3 text-cyan-400">
              The Community
            </p>
            <p className="text-muted-foreground text-sm">
              In addition to the judges, the broader DexCourt community also
              plays a vital role. Holders of the $LAW token can review cases and
              cast their votes, ensuring that justice remains decentralized and
              inclusive.
            </p>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm text-cyan-300 hover:underline"
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      </div>
    </section>
  );
}
