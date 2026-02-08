// src/pages/Agreements.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../components/ui/button";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Search,
  SortAsc,
  SortDesc,
  X,
  Upload,
  Paperclip,
  Trash2,
  Loader2,
  User,
  Users,
  RefreshCw,
} from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import ReactDatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import type {
  Agreement,
  AgreementStatus,
  AgreementStatusFilter,
} from "../types";
import { toast } from "sonner";
import { agreementService } from "../services/agreementServices";
import { useAuth } from "../hooks/useAuth";
import { UserAvatar } from "../components/UserAvatar";
// Add imports at the top
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
  // isValidTelegramUsername,
  formatTelegramUsernameForDisplay,
} from "../lib/usernameUtils";
import { FaArrowRightArrowLeft } from "react-icons/fa6";

// File upload types
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

// Agreement type options
type AgreementType = "myself" | "others";

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

const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
  PARTY_SUBMITTED_DELIVERY: 7, // Add pending approval status
} as const;

// Helper function to convert API status to frontend status
// Helper function to convert API status to frontend status
const apiStatusToFrontend = (status: number): AgreementStatus => {
  switch (status) {
    case AgreementStatusEnum.PENDING_ACCEPTANCE:
      return "pending";
    case AgreementStatusEnum.ACTIVE:
      return "signed";
    case AgreementStatusEnum.COMPLETED:
      return "completed";
    case AgreementStatusEnum.DISPUTED:
      return "disputed";
    case AgreementStatusEnum.CANCELLED:
      return "cancelled";
    case AgreementStatusEnum.EXPIRED:
      return "expired";
    case AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY:
      return "pending_approval"; // Map to pending_approval
    default:
      return "pending";
  }
};

const isValidUserIdentity = (value?: string) => {
  if (!value) return false;

  const v = value.trim();

  // Telegram username
  if (/^@?[a-zA-Z0-9_]{2,}$/.test(v)) return true;

  // Wallet address (EVM)
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;

  return false;
};

const UserSearchResult = ({
  user,
  onSelect,
  field,
}: {
  user: any;
  onSelect: (
    username: string,
    field: "counterparty" | "partyA" | "partyB",
  ) => void;
  field: "counterparty" | "partyA" | "partyB";
}) => {
  // 🚨 FIXED: Look for telegramUsername field (from API response)
  const telegramUsername = cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );

  // If no Telegram username exists, don't show this user
  if (!telegramUsername) {
    return null;
  }

  // PRESERVES ORIGINAL CASE: No .toLowerCase() here
  const displayUsername = telegramUsername ? `@${telegramUsername}` : "Unknown";
  const displayName = user.displayName || displayUsername;
  const isCurrentUser = user.id === user?.id;

  return (
    <div
      onClick={() => {
        onSelect(`@${telegramUsername}`, field);
      }} // 🆕 FIX: Add @ symbol here
      className={`glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60 ${
        isCurrentUser ? "opacity-80" : ""
      }`}
    >
      <UserAvatar
        userId={user.id}
        avatarId={user.avatarId || user.avatar?.id}
        username={telegramUsername}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="hidden truncate text-sm font-medium text-white">
          {displayName}
        </div>
        {telegramUsername && (
          <div className="truncate text-sm text-cyan-300">
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
const formatNumberWithCommas = (value: string): string => {
  if (!value) return "";

  // Allow numbers, decimal point, and commas - be more permissive
  const numericValue = value.replace(/[^\d.,]/g, "");

  // Handle empty value
  if (!numericValue) return "";

  // Split into whole and decimal parts
  const parts = numericValue.split(".");
  let wholePart = parts[0];
  const decimalPart = parts[1] || "";

  // Format whole part with commas (only if it has content)
  if (wholePart) {
    // Remove existing commas first
    wholePart = wholePart.replace(/,/g, "");
    // Add commas for thousands (only if it's a valid number)
    if (wholePart.length > 0) {
      wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }

  // Combine parts
  if (decimalPart) {
    return `${wholePart}.${decimalPart}`;
  } else if (numericValue.includes(".")) {
    // Handle case where user just typed a decimal point
    return `${wholePart}.`;
  } else {
    return wholePart;
  }
};

const parseFormattedNumber = (formattedValue: string): string => {
  // Remove commas for storage and calculations, keep decimal point
  return formattedValue.replace(/,/g, "");
};

// Validation helper function - cleaner version
const getValidationState = (field: string, value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return { isValid: false, message: "" };

  // Handle different field types
  if (field === "title") {
    const isValid = trimmedValue.length >= 3;
    return {
      isValid,
      message: isValid
        ? "✓ Title looks good"
        : "Title must be at least 3 characters",
    };
  }

  if (field === "description") {
    const isValid = trimmedValue.length >= 10;
    return {
      isValid,
      message: isValid
        ? "✓ Description looks good"
        : "Description must be at least 10 characters",
    };
  }

  if (["counterparty", "partyA", "partyB"].includes(field)) {
    const username = trimmedValue.replace(/^@/, "");
    const isValid = username.length >= 2 && /^[a-zA-Z0-9_]+$/.test(username);
    return {
      isValid,
      message: isValid
        ? "✓ Valid username format"
        : username.length < 2
          ? "Username must be at least 2 characters"
          : "Only letters, numbers, and underscores allowed",
    };
  }

  if (field === "amount") {
    if (trimmedValue === "") return { isValid: true, message: "" };
    const numValue = parseFloat(trimmedValue.replace(/,/g, ""));
    const isValid = !isNaN(numValue) && numValue > 0;
    return {
      isValid,
      message: isValid ? "✓ Valid amount" : "Amount must be a positive number",
    };
  }

  return { isValid: false, message: "" };
};

// Add skeleton loading component
const AgreementSkeleton = () => (
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

export default function Agreements() {
  const navigate = useNavigate();
  const [typeValue, setTypeValue] = useState<"Public" | "Private" | "">("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [includeFunds, setIncludeFunds] = useState<"yes" | "no" | "">("");
  const [secureWithEscrow, setSecureWithEscrow] = useState<"yes" | "no" | "">(
    "",
  );
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [fundsWithoutEscrow, setFundsWithoutEscrow] = useState({
    token: "",
    amount: "",
    customTokenAddress: "",
  });
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  const [deadline, setDeadline] = useState<Date | null>(null);
  // In Agreements.tsx - Replace the current user search implementation
  const [userSearchQuery, setUserSearchQuery] = useState("");
  // Separate search results for each field
  const [counterpartySearchResults, setCounterpartySearchResults] = useState<
    any[]
  >([]);
  const [partyASearchResults, setPartyASearchResults] = useState<any[]>([]);
  const [partyBSearchResults, setPartyBSearchResults] = useState<any[]>([]);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<
    "counterparty" | "partyA" | "partyB"
  >("counterparty");
  const userSearchRef = useRef<HTMLDivElement>(null);

  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [isTableFilterOpen, setIsTableFilterOpen] = useState(false);
  const [isRecentFilterOpen, setIsRecentFilterOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const tableFilterRef = useRef<HTMLDivElement>(null);
  const recentFilterRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, user, isAuthInitialized } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const [totalAgreements, setTotalAgreements] = useState(0);
  const [, setTotalResults] = useState(0);
  // const [allAgreements, setAllAgreements] = useState<Agreement[]>([]);

  // New state for agreement type selection
  const [agreementType, setAgreementType] = useState<AgreementType>("myself");

  // Enhanced Form state
  const [form, setForm] = useState({
    title: "",
    // For "myself" type
    counterparty: "",
    // For "others" type
    partyA: "",
    partyB: "",
    description: "",
    amount: "",
    images: [] as UploadedFile[],
  });

  const [validation, setValidation] = useState({
    title: { isValid: false, message: "", isTouched: false },
    counterparty: { isValid: false, message: "", isTouched: false },
    partyA: { isValid: false, message: "", isTouched: false },
    partyB: { isValid: false, message: "", isTouched: false },
    description: { isValid: false, message: "", isTouched: false },
    amount: { isValid: true, message: "", isTouched: false },
  });

  const updateValidation = (field: keyof typeof validation, value: string) => {
    const validationState = getValidationState(field, value);
    setValidation((prev) => ({
      ...prev,
      [field]: {
        ...validationState,
        isTouched: true,
      },
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);

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

  const debouncedSearchQuery = useDebounce(userSearchQuery, 300);

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

      if (
        tableFilterRef.current &&
        !tableFilterRef.current.contains(event.target as Node)
      ) {
        setIsTableFilterOpen(false);
      }

      if (
        recentFilterRef.current &&
        !recentFilterRef.current.contains(event.target as Node)
      ) {
        setIsRecentFilterOpen(false);
      }

      if (
        userSearchRef.current &&
        !userSearchRef.current.contains(event.target as Node)
      ) {
        setShowUserSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const tableFilterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "signed", label: "Signed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "expired", label: "Expired" }, // Add expired
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
    { value: "pending_approval", label: "Pending Approval" }, // Add pending_approval
  ];
  const recentFilterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
  ];

  const [tableFilter, setTableFilter] = useState<AgreementStatusFilter>("all");
  const [recentFilter, setRecentFilter] = useState<
    "all" | "active" | "completed" | "disputed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadAgreements = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters for API
      const queryParams: any = {
        top: pageSize,
        skip: (currentPage - 1) * pageSize,
        sort: sortOrder, // API accepts "asc" or "desc"
        type: 1, // Reputational agreements only
      };

      // Add status filter if not "all"
      if (tableFilter !== "all") {
        // Convert frontend status to API status
        const statusMap: Record<string, number> = {
          pending: AgreementStatusEnum.PENDING_ACCEPTANCE,
          signed: AgreementStatusEnum.ACTIVE,
          completed: AgreementStatusEnum.COMPLETED,
          disputed: AgreementStatusEnum.DISPUTED,
          cancelled: AgreementStatusEnum.CANCELLED,
          expired: AgreementStatusEnum.EXPIRED,
          pending_approval: AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY,
        };

        if (statusMap[tableFilter]) {
          queryParams.status = statusMap[tableFilter];
        }
      }

      // Add search query if provided (API searches title, parties, telegram, wallet)
      if (searchQuery.trim()) {
        queryParams.search = searchQuery;
      }

      console.log("🔍 API Request Params:", queryParams);

      // Get paginated agreements with ALL filters from API
      const allAgreementsResponse =
        await agreementService.getAgreements(queryParams);

      const pageAgreements = allAgreementsResponse.results || [];

      console.log("📊 API Response:", {
        page: currentPage,
        pageSize: pageSize,
        totalAgreements: allAgreementsResponse.totalAgreements,
        totalResults: allAgreementsResponse.totalResults,
        returnedCount: pageAgreements.length,
        filters: {
          status: tableFilter,
          search: searchQuery,
          sort: sortOrder,
        },
      });

      // 🚀 OPTIMIZATION: Transform agreements WITHOUT fetching additional details
      // All needed information is already in the main API response
      const transformedAgreements = pageAgreements.map((agreement) =>
        transformApiAgreement(agreement),
      );

      // Set agreements immediately for display
      setAgreements(transformedAgreements);
      setTotalAgreements(allAgreementsResponse.totalAgreements || 0);
      setTotalResults(allAgreementsResponse.totalResults || 0);

      console.log("✅ Displaying", transformedAgreements.length, "agreements");
    } catch (error: any) {
      console.error("Failed to fetch agreements:", error);

      // Show user-friendly error message
      if (error.message?.includes("timeout") || error.code === "ECONNABORTED") {
        toast.error("Request timed out", {
          description:
            "Please try again with fewer results or a smaller page size",
        });
      } else {
        toast.error(error.message || "Failed to load agreements");
      }

      setAgreements([]);
      setTotalAgreements(0);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, tableFilter, searchQuery, sortOrder]);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableFilter, searchQuery, sortOrder]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // loadAgreements will be triggered by the useEffect
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    // loadAgreements will be triggered by the useEffect
  };

  const transformApiAgreement = (apiAgreement: any): Agreement => {
    const getAgreementType = (visibility: number) => {
      switch (visibility) {
        case AgreementVisibilityEnum.PRIVATE:
          return "Private";
        case AgreementVisibilityEnum.PUBLIC:
          return "Public";
        case AgreementVisibilityEnum.AUTO_PUBLIC:
          return "Public";
        default:
          return "Public";
      }
    };

    const getTelegramUsernameFromParty = (party: any): string => {
      if (!party) return "Unknown";

      // Priority 1: Check for telegramUsername field (from API response)
      const telegramUsername = party?.telegramUsername || party?.username;

      if (!telegramUsername) return "Unknown";

      // Ensure it starts with @ for display consistency
      return telegramUsername.startsWith("@")
        ? telegramUsername
        : `@${telegramUsername}`;
    };

    // 🚀 OPTIMIZATION: Check for escrow directly from type field
    const useEscrow = apiAgreement.type === AgreementTypeEnum.ESCROW;

    // 🚀 OPTIMIZATION: Check for funds from the main payload
    const includesFunds = Boolean(
      apiAgreement.amount ||
        apiAgreement.tokenSymbol ||
        apiAgreement.type === AgreementTypeEnum.ESCROW,
    );

    const includeFunds = includesFunds ? "yes" : "no";

    const formatDateSafely = (dateString: string) => {
      if (!dateString) return "No deadline";

      try {
        const date = new Date(dateString);
        return isNaN(date.getTime())
          ? "Invalid Date"
          : date.toLocaleDateString();
      } catch (error) {
        console.warn("Invalid date:", dateString, error);
        return "Invalid Date";
      }
    };

    const getAvatarIdFromParty = (party: any): number | null => {
      const avatarId = party?.avatarId || party?.avatar?.id;
      return avatarId ? Number(avatarId) : null;
    };

    const getFirstPartyTelegramUsername = (party: any): string => {
      return getTelegramUsernameFromParty(party);
    };

    const getCounterpartyTelegramUsername = (party: any): string => {
      return getTelegramUsernameFromParty(party);
    };

    // Get the creator/createdBy - Telegram only
    const rawCreatedBy = getFirstPartyTelegramUsername(apiAgreement.firstParty);
    const createdBy = formatTelegramUsernameForDisplay(rawCreatedBy);

    const createdByUserId =
      apiAgreement.firstParty?.id?.toString() ||
      apiAgreement.creator?.id?.toString();

    const createdByAvatarId =
      getAvatarIdFromParty(apiAgreement.firstParty) ||
      getAvatarIdFromParty(apiAgreement.creator);

    // Get counterparty - Telegram only
    const rawCounterparty = getCounterpartyTelegramUsername(
      apiAgreement.counterParty,
    );
    const counterparty = formatTelegramUsernameForDisplay(rawCounterparty);

    const counterpartyUserId = apiAgreement.counterParty?.id?.toString();
    const counterpartyAvatarId = getAvatarIdFromParty(
      apiAgreement.counterParty,
    );

    let amountValue: string | undefined;

    if (includesFunds && apiAgreement.amount) {
      // Format the amount from the main payload
      if (typeof apiAgreement.amount === "string") {
        amountValue = parseFloat(apiAgreement.amount).toString();
      } else if (typeof apiAgreement.amount === "number") {
        amountValue = apiAgreement.amount.toString();
      }
    }

    // 🚀 OPTIMIZATION: Return agreement using data from main payload
    return {
      id: apiAgreement.id, // Keep as number
      title: apiAgreement.title || "Untitled Agreement",
      description: apiAgreement.description || "",
      type: getAgreementType(apiAgreement.visibility),
      counterparty: counterparty,
      createdBy: createdBy,
      status: apiStatusToFrontend(apiAgreement.status),
      dateCreated: formatDateSafely(
        apiAgreement.dateCreated || apiAgreement.createdAt,
      ),
      deadline: formatDateSafely(apiAgreement.deadline),
      amount: amountValue,
      token: apiAgreement.tokenSymbol || undefined,
      files: apiAgreement.files?.length || 0,

      includeFunds: includeFunds,
      useEscrow: useEscrow,
      escrowAddress: apiAgreement.escrowContractAddress || undefined, // Use from main payload

      createdByAvatarId: createdByAvatarId,
      counterpartyAvatarId: counterpartyAvatarId,
      createdByUserId: createdByUserId,
      counterpartyUserId: counterpartyUserId,

      cancelPending: apiAgreement.cancelPending || false,
      cancelRequestedById: apiAgreement.cancelRequestedById?.toString() || null,
    };
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tableFilter, searchQuery, sortOrder]);

  // Update pagination info calculations
  const totalPages = Math.ceil(totalAgreements / pageSize);
  // const startItem = (currentPage - 1) * pageSize + 1;
  // const endItem = Math.min(currentPage * pageSize, totalAgreements);

  const filteredRecentAgreements: Agreement[] = agreements
    .filter((a) => a.status === "disputed")
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  const typeOptions = [
    { value: "Public", label: "Public" },
    { value: "Private", label: "Private" },
  ];

  const tokenOptions = [
    { value: "USDC", label: "USDC" },
    { value: "DAI", label: "DAI" },
    { value: "ETH", label: "ETH" },
    { value: "custom", label: "Custom Token" },
  ];

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file) => {
      // 🆕 ADD FILE SIZE VALIDATION
      const fileSizeMB = file.size / 1024 / 1024; // Convert to MB
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

      const fileSize = fileSizeMB.toFixed(2) + " MB";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSize,
      };

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setForm((prev) => ({
            ...prev,
            images: [...prev.images, newFile],
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, newFile],
        }));
      }
    });
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((file) => file.id !== id),
    }));
  };

  const handleUsernameInput = (
    value: string,
    field: "counterparty" | "partyA" | "partyB",
  ) => {
    // 🚨 FIX: Don't remove the @ symbol here - just trim whitespace
    const cleanedValue = value.trim();

    // Update form state with the raw value (including @)
    setForm((prev) => ({
      ...prev,
      [field]: cleanedValue,
    }));

    // For search, remove the @ if present at the beginning
    const searchValue = cleanedValue.replace(/^@/, "");

    // Trigger search with cleaned value (without @)
    if (searchValue.length >= 2) {
      handleUserSearch(searchValue, field);
    } else {
      setShowUserSuggestions(false);
    }

    // Update validation with the actual input value
    updateValidation(field, cleanedValue);
  };

  // Drag and drop handlers
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication first
    if (!isAuthenticated) {
      toast.error("Please log in to create agreements");
      return;
    }

    // Form validation
    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!typeValue) {
      toast.error("Please select agreement type");
      return;
    }
    if (agreementType === "myself" && !form.counterparty.trim()) {
      toast.error("Please enter counterparty information");
      return;
    }
    if (
      agreementType === "others" &&
      (!form.partyA.trim() || !form.partyB.trim())
    ) {
      toast.error("Please enter both parties' information");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsSubmitting(true);

    try {
      // 🚨 CRITICAL FIX: Use consistent username cleaning for all parties
      const cleanCounterparty = cleanTelegramUsername(form.counterparty);
      const cleanPartyA = cleanTelegramUsername(form.partyA);
      const cleanPartyB = cleanTelegramUsername(form.partyB);

      // 🚨 CRITICAL FIX: Get current user's Telegram username with consistent formatting
      const currentUserTelegram = getCurrentUserTelegram(user);
      const cleanUserTelegram = currentUserTelegram;

      console.log("🔍 DEBUG - Standardized Telegram usernames:", {
        currentUserTelegram: cleanUserTelegram,
        userTelegramObject: user?.telegram,
        counterparty: cleanCounterparty,
        partyA: cleanPartyA,
        partyB: cleanPartyB,
      });

      // 🚨 CRITICAL FIX: Validate that we have valid Telegram usernames
      if (
        agreementType === "myself" &&
        !currentUserTelegram &&
        !user?.walletAddress
      ) {
        toast.error(
          "Unable to identify your account. Please connect a wallet or Telegram.",
        );
        setIsSubmitting(false);
        return;
      }

      if (
        agreementType === "myself" &&
        !isValidUserIdentity(form.counterparty)
      ) {
        toast.error("Please enter a valid counterparty (Telegram or wallet)");
        setIsSubmitting(false);
        return;
      }

      if (
        agreementType === "others" &&
        (!isValidUserIdentity(form.partyA) || !isValidUserIdentity(form.partyB))
      ) {
        toast.error("Please enter valid identities for both parties");
        setIsSubmitting(false);
        return;
      }

      // Validation with cleaned usernames
      if (
        agreementType === "myself" &&
        cleanCounterparty === cleanUserTelegram
      ) {
        toast.error("Counterparty cannot be yourself");
        return;
      }

      if (agreementType === "others" && cleanPartyA === cleanPartyB) {
        toast.error("First party and second party cannot be the same");
        return;
      }

      // Prepare agreement data with consistently formatted usernames
      const agreementData: any = {
        title: form.title,
        description: form.description,
        type: AgreementTypeEnum.REPUTATION, // Default to reputation type
        visibility:
          typeValue === "Public"
            ? AgreementVisibilityEnum.PUBLIC
            : AgreementVisibilityEnum.PRIVATE,
        // 🚨 CRITICAL: Use consistently cleaned Telegram usernames
        firstParty:
          agreementType === "myself"
            ? cleanUserTelegram || user?.walletAddress || "" // ADD NULL CHECK
            : cleanPartyA,

        counterParty:
          agreementType === "myself" ? cleanCounterparty : cleanPartyB,
      };

      if (deadline) {
        agreementData.deadline = deadline.toISOString();
      }

      // 🆕 NEW: Apply the updated API implementation for funds
      if (includeFunds === "yes") {
        agreementData.includesFunds = true;

        if (secureWithEscrow === "yes") {
          agreementData.secureTheFunds = true;
          agreementData.type = AgreementTypeEnum.ESCROW;

          // Add token and amount details only for escrow
          if (selectedToken && selectedToken !== "custom") {
            agreementData.tokenSymbol = selectedToken;
          }
          if (selectedToken === "custom" && customTokenAddress) {
            agreementData.contractAddress = customTokenAddress;
          }
          if (form.amount) {
            agreementData.amount = parseFloat(form.amount);
          }
        } else {
          agreementData.secureTheFunds = false;

          // For funds without escrow, still capture the financial information
          if (
            fundsWithoutEscrow.token &&
            fundsWithoutEscrow.token !== "custom"
          ) {
            agreementData.tokenSymbol = fundsWithoutEscrow.token;
          }
          if (
            fundsWithoutEscrow.token === "custom" &&
            fundsWithoutEscrow.customTokenAddress
          ) {
            agreementData.contractAddress =
              fundsWithoutEscrow.customTokenAddress;
          }
          if (fundsWithoutEscrow.amount) {
            agreementData.amount = parseFloat(fundsWithoutEscrow.amount);
          }
        }
      } else {
        agreementData.includesFunds = false;
        agreementData.secureTheFunds = false;
      }

      console.log("🔍 DEBUG - Final agreement data:", agreementData);

      // Add optional fields only if they have values
      if (includeFunds === "yes" && secureWithEscrow === "yes") {
        if (selectedToken && selectedToken !== "custom") {
          agreementData.tokenSymbol = selectedToken;
        }
        if (selectedToken === "custom" && customTokenAddress) {
          agreementData.contractAddress = customTokenAddress;
        }
        if (form.amount) {
          agreementData.amount = parseFloat(form.amount);
        }
      }

      // Add funds information regardless of escrow usage
      if (includeFunds === "yes") {
        const token =
          secureWithEscrow === "yes" ? selectedToken : fundsWithoutEscrow.token;
        const amount =
          secureWithEscrow === "yes" ? form.amount : fundsWithoutEscrow.amount;
        const contractAddress =
          secureWithEscrow === "yes"
            ? customTokenAddress
            : fundsWithoutEscrow.customTokenAddress;

        if (token && token !== "custom") {
          agreementData.tokenSymbol = token;
        }
        if (token === "custom" && contractAddress) {
          agreementData.contractAddress = contractAddress;
        }
        if (amount) {
          agreementData.amount = parseFloat(amount);
        }

        // Add escrow-specific data only if escrow is used
        if (secureWithEscrow === "yes") {
          agreementData.useEscrow = true;
        }
      }

      // Use the real API to create the agreement - let the API handle user validation
      await agreementService.createAgreement(
        agreementData,
        form.images.length > 0 ? form.images.map((f) => f.file) : [],
      );

      // 🚨 REMOVED: agreementService.clearUserCache(); - This method no longer exists

      // Success message
      const successMessage =
        agreementType === "myself"
          ? `Agreement created between you and ${form.counterparty}`
          : `Agreement created between ${form.partyA} and ${form.partyB}`;

      toast.success("Agreement created successfully", {
        description: `${successMessage} • ${typeValue} • ${form.images.length} files uploaded`,
      });

      setIsModalOpen(false);

      // Reset form
      setForm({
        title: "",
        counterparty: "",
        partyA: "",
        partyB: "",
        description: "",
        amount: "",
        images: [],
      });
      setTypeValue("");
      setDeadline(null);
      setIncludeFunds("");
      setSecureWithEscrow("");
      setSelectedToken("");
      setCustomTokenAddress("");
      setAgreementType("myself");

      // 🚨 NEW: Refresh agreements list to include the new one
      setTimeout(() => {
        // Reload agreements to get the new one
        window.location.reload(); // Or use your existing loadAgreements function
      }, 1000);
    } catch (error: any) {
      console.error("❌ Failed to create agreement:", error);
      console.error("📋 Error response:", error.response?.data);

      // Enhanced error handling based on Swagger docs
      const errorCode = error.response?.data?.error;
      const errorMessage = error.response?.data?.message;

      switch (errorCode) {
        case 1: // MissingData - Missing required fields
          toast.error("Missing required information", {
            description:
              "Please check all required fields including title, parties, deadline, and files",
          });
          break;

        case 13: // InvalidEnum - Invalid Type or Visibility value
          toast.error("Invalid agreement settings", {
            description: "Please check agreement type and visibility settings",
          });
          break;

        case 12: // MissingWallet - Escrow requires a wallet but user has none
          toast.error("Wallet required", {
            description:
              "You need a connected wallet to create escrow agreements",
          });
          break;

        case 5: // InvalidDate - Deadline invalid or not after today
          toast.error("Invalid deadline", {
            description: "Deadline must be a future date",
          });
          break;

        case 7: // AccountNotFound - One or both parties not found
          toast.error("User not found", {
            description:
              "One or both parties could not be found. Please check the Telegram usernames and try different formats (with or without @).",
          });
          break;

        case 11: // SameAccount - Creator and counterparty are the same
          toast.error("Same user error", {
            description: "First party and counterparty cannot be the same user",
          });
          break;

        case 17: // Forbidden - Creator is banned from creating agreements
          toast.error("Account restricted", {
            description:
              "Your account is currently restricted from creating new agreements",
          });
          break;

        case 10: // InternalServerError - Unexpected validation error
          toast.error("Server error", {
            description:
              "An unexpected error occurred. Please try again later.",
          });
          break;

        default:
          // Handle network errors and other unexpected errors
          if (error.message?.includes("Network Error")) {
            toast.error("Network error", {
              description:
                "Unable to connect to server. Please check your internet connection.",
            });
          } else if (errorMessage) {
            toast.error("Creation failed", {
              description: errorMessage,
            });
          } else {
            toast.error("Failed to create agreement", {
              description: "Please check your information and try again.",
            });
          }
          break;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSearch = useCallback(
    async (query: string, field: "counterparty" | "partyA" | "partyB") => {
      setUserSearchQuery(query);
      setActiveSearchField(field);

      if (process.env.NODE_ENV === "development") {
        console.log("🔍 Searching users for", field, "with query:", query);
      }

      if (query.length < 2) {
        // Clear the specific field's search results
        if (field === "counterparty") setCounterpartySearchResults([]);
        if (field === "partyA") setPartyASearchResults([]);
        if (field === "partyB") setPartyBSearchResults([]);
        setShowUserSuggestions(false);
        return;
      }

      setIsUserSearchLoading(true);
      setShowUserSuggestions(true);

      try {
        const results = await agreementService.searchUsers(query);

        if (process.env.NODE_ENV === "development") {
          console.log("🔍 RAW SEARCH RESULTS for", field, ":", results);
        }

        // Filter out current user AND users without Telegram usernames
        const currentUserTelegram = getCurrentUserTelegram(user);
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

        // Update the correct field's search results
        if (field === "counterparty") {
          setCounterpartySearchResults(filteredResults);
        } else if (field === "partyA") {
          setPartyASearchResults(filteredResults);
        } else if (field === "partyB") {
          setPartyBSearchResults(filteredResults);
        }
      } catch (error) {
        console.error("User search failed:", error);
        // Clear the specific field's search results
        if (field === "counterparty") setCounterpartySearchResults([]);
        if (field === "partyA") setPartyASearchResults([]);
        if (field === "partyB") setPartyBSearchResults([]);
      } finally {
        setIsUserSearchLoading(false);
      }
    },
    [user],
  );

  // Debounced search effect
  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2 && activeSearchField) {
      handleUserSearch(debouncedSearchQuery, activeSearchField);
    }
  }, [debouncedSearchQuery, activeSearchField, handleUserSearch]);

  return (
    <div className="relative">
      {/* <div className="absolute top-32 right-10 -z-[50] block rounded-full bg-cyan-500/20 blur-3xl lg:size-[30rem]"></div>
      <div className="absolute -top-20 left-0 -z-[50] block rounded-full bg-cyan-500/20 blur-3xl lg:size-[15rem]"></div>
      <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div> */}

      {/* Agreements Filter */}
      <div className="grid grid-cols-1 gap-6">
        <div className="w-full">
          <div className="">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-xl text-white">Agreements</h1>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="neon"
                className="neon-hover"
              >
                <FileText className="mr-2 h-4 w-4" />
                Create Agreement
              </Button>

              <div className="hidden sm:flex">
                {isAuthenticated && isAuthInitialized ? (
                  <div className="flex items-center gap-2 text-sm text-cyan-300">
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    {/* UPDATED: Only show if user has Telegram */}
                    <span>
                      {user?.telegram?.username
                        ? `Authenticated as @${user.telegram.username}`
                        : "Please connect Telegram account"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-orange-300">
                    <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                    <span>Not authenticated</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rest of your JSX remains the same */}
          <div className="mt-10 mb-5 flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative grow sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or parties"
                className="placeholder:text-muted-foreground w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white outline-none focus:border-cyan-400/40"
              />
            </div>

            <Button
              onClick={loadAgreements}
              variant="outline"
              className="flex items-center gap-2 border-white/15 text-cyan-200 hover:bg-cyan-500/10"
              disabled={loading}
              title="Reload agreements"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Refetch Agreements</span>
            </Button>

            {/* Status Filter Dropdown */}
            <div className="group relative w-48" ref={tableFilterRef}>
              <div
                onClick={() => setIsTableFilterOpen((prev) => !prev)}
                className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-cyan-400/30"
              >
                <span className="capitalize">
                  {tableFilterOptions.find((f) => f.value === tableFilter)
                    ?.label || "All"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isTableFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {isTableFilterOpen && (
                <div className="absolute top-[110%] right-0 z-50 w-full overflow-hidden rounded-md border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                  {tableFilterOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setTableFilter(option.value as AgreementStatusFilter);
                        setIsTableFilterOpen(false);
                      }}
                      className={`cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white ${
                        tableFilter === option.value
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

            {/* Sort Controls */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
                Sort
              </Button>
            </div>

            {/* Agreements Table */}
            <div className="w-full overflow-x-auto rounded-xl border border-b-2 border-white/10 ring-1 ring-white/10">
              <div className="p-5">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-cyan-300">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
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
              <div className="min-w-max">
                <table className="w-full text-sm md:min-w-full">
                  <thead>
                    <tr className="text-left text-sm font-semibold">
                      <th className="px-5 py-3 text-cyan-300">Date Created</th>
                      <th className="px-5 py-3 text-emerald-300">Title</th>
                      <th className="px-5 py-3 text-yellow-300">Parties</th>
                      <th className="px-5 py-3 text-pink-300">Amount</th>
                      <th className="px-5 py-3 text-indigo-300">Deadline</th>
                      <th className="px-5 py-3 text-purple-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <>
                        {Array.from({ length: pageSize }).map((_, index) => (
                          <AgreementSkeleton key={index} />
                        ))}
                      </>
                    ) : agreements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-cyan-300"
                        >
                          No agreements found.
                        </td>
                      </tr>
                    ) : agreements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-muted-foreground px-5 py-4 text-center"
                        >
                          No agreements found.
                        </td>
                      </tr>
                    ) : (
                      agreements.map((a) => (
                        <tr
                          key={a.id}
                          className="cursor-pointer border-t border-white/10 text-xs transition hover:bg-white/5"
                          onClick={() => {
                            // Navigate to escrow details if it's an escrow agreement (has secured funds)
                            // Otherwise navigate to regular agreement details
                            if (a.useEscrow) {
                              navigate(`/escrow/${a.id}`);
                            } else {
                              navigate(`/agreements/${a.id}`);
                            }
                          }}
                        >
                          <td className="text-muted-foreground px-5 py-4">
                            {a.dateCreated}
                          </td>
                          <td className="max-w-xs truncate px-5 py-4 font-medium text-white/90">
                            {a.title}
                          </td>
                          <td className="px-5 py-4 text-white/90">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <UserAvatar
                                  userId={
                                    a.createdByUserId ||
                                    cleanTelegramUsername(a.createdBy)
                                  }
                                  avatarId={a.createdByAvatarId || null}
                                  username={cleanTelegramUsername(a.createdBy)}
                                  size="sm"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanUsername = cleanTelegramUsername(
                                      a.createdBy,
                                    );
                                    const encodedUsername =
                                      encodeURIComponent(cleanUsername);
                                    navigate(`/profile/${encodedUsername}`);
                                  }}
                                  className="text-cyan-300 hover:text-cyan-200 hover:underline"
                                >
                                  {a.createdBy.startsWith("@0x")
                                    ? `${a.createdBy.slice(1, 5)}..${a.createdBy.slice(-6)}`
                                    : formatTelegramUsernameForDisplay(
                                        a.createdBy,
                                      )}
                                </button>
                              </div>
                              <span className="text-cyan-400">
                                <FaArrowRightArrowLeft />
                              </span>
                              <div className="flex items-center gap-1">
                                <UserAvatar
                                  userId={
                                    a.counterpartyUserId ||
                                    cleanTelegramUsername(a.counterparty)
                                  }
                                  avatarId={a.counterpartyAvatarId || null}
                                  username={cleanTelegramUsername(
                                    a.counterparty,
                                  )}
                                  size="sm"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanUsername = cleanTelegramUsername(
                                      a.counterparty,
                                    );
                                    const encodedUsername =
                                      encodeURIComponent(cleanUsername);
                                    navigate(`/profile/${encodedUsername}`);
                                  }}
                                  className="text-cyan-300 hover:text-cyan-200 hover:underline"
                                >
                                  {a.counterparty.startsWith("@0x")
                                    ? `${a.counterparty.slice(1, 5)}..${a.counterparty.slice(-6)}`
                                    : formatTelegramUsernameForDisplay(
                                        a.counterparty,
                                      )}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white/90">
                            {a.useEscrow
                              ? `${a.amount || "0"} ${a.token || ""} (Escrow)`
                              : a.includeFunds === "yes"
                                ? `${a.amount || "0"} ${a.token || ""} (No escrow)`
                                : "No amount"}
                          </td>
                          <td className="px-5 py-4 text-white/90">
                            {a.deadline}
                          </td>
                          <td className="px-5 py-4">
                            {a.status === "pending" ? (
                              <span className="badge badge-yellow">
                                Pending
                              </span>
                            ) : a.status === "signed" ? (
                              <span className="badge badge-blue">Signed</span>
                            ) : a.status === "cancelled" ? (
                              <span className="badge badge-red">Cancelled</span>
                            ) : a.status === "expired" ? ( // Add expired badge
                              <span className="badge badge-gray">Expired</span>
                            ) : a.status === "completed" ? (
                              <span className="badge badge-green">
                                Completed
                              </span>
                            ) : a.status === "pending_approval" ? ( // Add pending_approval badge
                              <span className="badge badge-orange">
                                Pending Approval
                              </span>
                            ) : (
                              <span className="badge badge-purple">
                                Disputed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {/* Pagination Controls */}
            {!loading && totalAgreements > 0 && (
              <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
                {/* <div className="text-sm whitespace-nowrap text-cyan-300">
                  Showing {startItem} to {endItem} of{" "}
                  {filteredTableAgreements.length} agreements
                </div> */}

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
                          className={`${
                            currentPage === pageNum
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

                {/* <div className="flex items-center justify-between border-b border-white/10 p-5">
    <h3 className="font-semibold text-white/90">Agreements</h3>
    <div className="text-sm text-cyan-300">
      {totalAgreements} {totalAgreements === 1 ? "agreement" : "agreements"}
    </div>
  </div> */}
              </div>
            )}
          </div>
        </div>

        <aside className="w-full space-y-4 sm:w-[50%]">
          <div className="flex items-center justify-between">
            <h1 className="space mb-2 text-xl text-white">
              Agreements Turned Sour
            </h1>

            {/* Filter Dropdown */}
            <div className="group relative hidden w-36" ref={recentFilterRef}>
              <div
                onClick={() => setIsRecentFilterOpen((prev) => !prev)}
                className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-1 text-white transition-all hover:border-cyan-400/30 hover:bg-white/10"
              >
                <span className="text-sm capitalize">
                  {recentFilterOptions.find((f) => f.value === recentFilter)
                    ?.label || "Filter"}
                </span>
                <div className="bg-Primary flex h-8 w-8 items-center justify-center rounded-md">
                  <ChevronDown
                    className={`transform text-2xl text-white transition-transform duration-300 ${
                      isRecentFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {isRecentFilterOpen && (
                <div className="absolute top-[110%] right-0 z-50 w-full rounded-xl bg-cyan-800 shadow-md">
                  {recentFilterOptions.map((option, idx) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setRecentFilter(option.value as any);
                        setIsRecentFilterOpen(false);
                      }}
                      className={`cursor-pointer px-4 py-2 transition-colors hover:bg-cyan-300 hover:text-white ${
                        idx === 0 ? "rounded-t-xl" : ""
                      } ${
                        idx === recentFilterOptions.length - 1
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

          {/* Swiping Card Section */}
          <div className="glass relative overflow-hidden border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-400" />
                <span className="text-xs text-cyan-300">Loading...</span>
              </div>
            ) : filteredRecentAgreements.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-xs">
                No sour agreements found.
              </div>
            ) : (
              <SourAgreementsSwiper agreements={filteredRecentAgreements} />
            )}
          </div>
        </aside>

        {/* Create Agreement Modal */}
        {isModalOpen && (
          <div
            // onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-[0.75rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 text-cyan-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-lg font-semibold text-white/90">
                  Create New Agreement
                </h2>
                <p className="text-muted-foreground text-sm">
                  Provide agreement details and supporting documents
                </p>
              </div>

              {/* Agreement Type Selection */}
              <div>
                <label className="text-muted-foreground mb-3 block text-sm font-semibold">
                  Who is this agreement for?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAgreementType("myself")}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                      agreementType === "myself"
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                    }`}
                  >
                    <User className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">
                      Myself & Counterparty
                    </span>
                    <span className="mt-1 text-xs opacity-70">
                      Agreement between you and someone else
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgreementType("others")}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                      agreementType === "others"
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                    }`}
                  >
                    <Users className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">
                      Two Other Parties
                    </span>
                    <span className="mt-1 text-xs opacity-70">
                      Agreement between two other users
                    </span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="space mb-2 block font-semibold text-white">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    updateValidation("title", e.target.value);
                  }}
                  onBlur={() => updateValidation("title", form.title)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                  placeholder="e.g. Design Sprint Phase 1"
                  required
                />
                {validation.title.isTouched && (
                  <div
                    className={`mt-1 text-xs ${validation.title.isValid ? "text-green-400" : "text-amber-400"}`}
                  >
                    {validation.title.message}
                  </div>
                )}
              </div>

              {/* Type + Parties */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Type */}
                <div
                  className="relative flex w-full flex-col gap-2"
                  ref={typeRef}
                >
                  <label className="space text-sm font-semibold text-white">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => setIsTypeOpen((prev) => !prev)}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400/40"
                  >
                    <span>{typeValue || "Select Type"}</span>
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
                            setTypeValue(option.value as "Public" | "Private");
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

                {/* Parties based on agreement type */}
                {agreementType === "myself" ? (
                  // In your modal form - Update the counterparty field
                  <div className="relative" ref={userSearchRef}>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Counterparty <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-cyan-400">
                        (Start typing to search users)
                      </span>
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-[20px] left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                      <input
                        value={form.counterparty}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleUsernameInput(value, "counterparty");
                          updateValidation("counterparty", value);
                        }}
                        onBlur={() =>
                          updateValidation("counterparty", form.counterparty)
                        }
                        onFocus={() => {
                          if (form.counterparty.length >= 2) {
                            setShowUserSuggestions(true);
                          }
                        }}
                        className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                        placeholder="Type username (min 2 characters)..."
                        required
                      />
                      {validation.counterparty.isTouched && (
                        <div
                          className={`mt-1 text-xs ${validation.counterparty.isValid ? "text-green-400" : "text-amber-400"}`}
                        >
                          {validation.counterparty.message}
                        </div>
                      )}
                      {isUserSearchLoading && (
                        <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                      )}
                    </div>

                    {/* User Suggestions Dropdown */}
                    {showUserSuggestions &&
                      activeSearchField === "counterparty" && (
                        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                          {counterpartySearchResults.length > 0 ? (
                            counterpartySearchResults.map((user) => (
                              <UserSearchResult
                                key={`counterparty-${user.id}`}
                                user={user}
                                onSelect={(username) => {
                                  setForm({ ...form, counterparty: username });
                                  setShowUserSuggestions(false);
                                  setCounterpartySearchResults([]); // Clear counterparty results
                                }}
                                field="counterparty"
                              />
                            ))
                          ) : userSearchQuery.length >= 2 &&
                            !isUserSearchLoading ? (
                            <div className="px-4 py-3 text-center text-sm text-cyan-300">
                              No users found for "{userSearchQuery}"
                              <div className="mt-1 text-xs text-cyan-400">
                                Make sure the user exists and has a Telegram
                                username
                              </div>
                            </div>
                          ) : null}

                          {userSearchQuery.length < 2 && (
                            <div className="px-4 py-3 text-center text-sm text-cyan-300">
                              Type at least 2 characters to search
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <>
                    <div className="relative" ref={userSearchRef}>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        First Party <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs text-cyan-400">
                          (Start typing to search users)
                        </span>
                      </label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                        <input
                          value={form.partyA}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUsernameInput(value, "partyA");
                            updateValidation("partyA", value);
                          }}
                          onBlur={() => updateValidation("partyA", form.partyA)}
                          onFocus={() => {
                            setActiveSearchField("partyA");
                            // Always show suggestions when focused if we have search results
                            if (
                              partyASearchResults.length > 0 ||
                              form.partyA.replace(/^@/, "").length >= 2
                            ) {
                              setShowUserSuggestions(true);
                            }
                          }}
                          className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="Type username (min 2 characters)..."
                          required
                        />

                        {isUserSearchLoading &&
                          activeSearchField === "partyA" && (
                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                          )}
                      </div>

                      {/* 🆕 Add validation message display for Party A */}
                      {validation.partyA.isTouched && (
                        <div
                          className={`mt-1 text-xs ${validation.partyA.isValid ? "text-green-400" : "text-amber-400"}`}
                        >
                          {validation.partyA.message}
                        </div>
                      )}

                      {/* User Suggestions Dropdown for Party A */}

                      <div className="mt-2">
                        {partyASearchResults.map((user) => {
                          const telegramUsername = cleanTelegramUsername(
                            user.telegramUsername ||
                              user.telegram?.username ||
                              user.telegramInfo,
                          );
                          return (
                            <div
                              key={`partyA-${user.id}`}
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  partyA: `@${telegramUsername}`,
                                }));
                                // Clear Party A search results after selection
                                setPartyASearchResults([]);
                                setShowUserSuggestions(false);
                              }}
                              className="glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60"
                            >
                              <UserAvatar
                                userId={user.id}
                                avatarId={user.avatarId || user.avatar?.id}
                                username={telegramUsername}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                {/* <div className="truncate text-sm font-medium text-white">
                                  {user.displayName || `@${telegramUsername}`}
                                </div> */}
                                {telegramUsername && (
                                  <div className="truncate text-sm text-cyan-300">
                                    @{telegramUsername}
                                  </div>
                                )}
                                {user.bio && (
                                  <div className="mt-1 truncate text-xs text-cyan-200/70">
                                    {user.bio}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative" ref={userSearchRef}>
                      <label className="text-muted-foreground mb-2 block text-sm">
                        Second Party <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs text-cyan-400">
                          (Start typing to search users)
                        </span>
                      </label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                        <input
                          value={form.partyB}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUsernameInput(value, "partyB");
                            updateValidation("partyB", value);
                          }}
                          onBlur={() => updateValidation("partyB", form.partyB)}
                          onFocus={() => {
                            if (form.partyB.length >= 2) {
                              setShowUserSuggestions(true);
                            }
                          }}
                          className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="Type username (min 2 characters)..."
                          required
                        />
                        {isUserSearchLoading &&
                          activeSearchField === "partyB" && (
                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                          )}
                      </div>

                      {/* 🆕 Add validation message display for Party B */}
                      {validation.partyB.isTouched && (
                        <div
                          className={`mt-1 text-xs ${validation.partyB.isValid ? "text-green-400" : "text-amber-400"}`}
                        >
                          {validation.partyB.message}
                        </div>
                      )}

                      {/* User Suggestions Dropdown for Party B */}
                      {showUserSuggestions &&
                        activeSearchField === "partyB" && (
                          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                            {partyBSearchResults.length > 0 ? (
                              partyBSearchResults.map((user) => (
                                <UserSearchResult
                                  key={`partyB-${user.id}`}
                                  user={user}
                                  onSelect={(username) => {
                                    setForm({ ...form, partyB: username });
                                    setShowUserSuggestions(false);
                                    setPartyBSearchResults([]); // Clear Party B results
                                  }}
                                  field="partyB"
                                />
                              ))
                            ) : userSearchQuery.length >= 2 &&
                              !isUserSearchLoading ? (
                              <div className="px-4 py-3 text-center text-sm text-cyan-300">
                                No users found for "{userSearchQuery}"
                              </div>
                            ) : null}
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => {
                    setForm({ ...form, description: e.target.value });
                    updateValidation("description", e.target.value);
                  }}
                  onBlur={() =>
                    updateValidation("description", form.description)
                  }
                  className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                  placeholder="Scope, deliverables, timelines..."
                  required
                />
                {validation.description.isTouched && (
                  <div
                    className={`mt-1 text-xs ${validation.description.isValid ? "text-green-400" : "text-amber-400"}`}
                  >
                    {validation.description.message}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1">
                  <Info className="size-4 text-cyan-300" />
                  <p className="text-xs text-cyan-300/80">
                    If you'd like to add videos, simply add the link to the
                    video URL in the description (e.g. a public Google Drive
                    link).
                  </p>
                </div>
              </div>

              {/* File Upload Section */}
              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  Upload Supporting Documents{" "}
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
                    id="agreement-upload"
                  />
                  <label
                    htmlFor="agreement-upload"
                    className="flex cursor-pointer flex-col items-center justify-center px-4 py-8 text-center"
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
                    </div>
                  </label>
                </div>

                {/* File List */}
                {form.images.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-cyan-200">
                      Selected Files ({form.images.length})
                    </h4>
                    {form.images.map((file) => (
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

              {/* Deadline */}
              {/* Deadline - Updated with clear button */}
              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  Deadline <span className="text-cyan-400">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                    <ReactDatePicker
                      selected={deadline}
                      onChange={(date) => setDeadline(date)}
                      placeholderText="Select a date (optional)"
                      dateFormat="dd/MM/yyyy"
                      className="w-full cursor-pointer rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                      calendarClassName="!bg-cyan-700 !text-white rounded-lg border border-white/10"
                      popperClassName="z-50"
                      minDate={new Date()}
                      isClearable={true}
                      clearButtonTitle="Clear deadline"
                    />
                  </div>
                  {deadline && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeadline(null)}
                      className="border-amber-400/30 text-amber-300 hover:bg-amber-500/10"
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Clear</span>
                    </Button>
                  )}
                </div>
                <div className="mt-1 flex items-start gap-1">
                  <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-cyan-300/70" />
                  <p className="text-xs text-cyan-300/70">
                    {deadline
                      ? `Deadline set to: ${deadline.toLocaleDateString()}`
                      : "Optional: If no deadline is set, the agreement will remain active until completed or cancelled."}
                  </p>
                </div>
              </div>

              {/* Include Funds Toggle */}
              {/* Include Funds Toggle */}
              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  Does this Agreement Include Funds{" "}
                  <span className="text-cyan-400">(Optional)</span>
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIncludeFunds("yes")}
                    className={`rounded-md border px-4 py-2 transition-colors ${
                      includeFunds === "yes"
                        ? "border-cyan-400 bg-cyan-500/30 text-cyan-200"
                        : "border-white/10 text-white/70 hover:border-cyan-400/40"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeFunds("no")}
                    className={`rounded-md border px-4 py-2 transition-colors ${
                      includeFunds === "no"
                        ? "border-cyan-400 bg-cyan-500/30 text-cyan-200"
                        : "border-white/10 text-white/70 hover:border-cyan-400/40"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Funds Information Panel - Show when funds are included */}
              {includeFunds === "yes" && (
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-3">
                  {/* Token Dropdown */}
                  <div
                    className="relative flex w-full flex-col gap-2"
                    ref={tokenRef}
                  >
                    <label className="text-sm font-semibold text-white">
                      Token <span className="text-cyan-400">(Optional)</span>
                    </label>
                    <div
                      onClick={() => setIsTokenOpen((prev) => !prev)}
                      className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400/40"
                    >
                      <span>{fundsWithoutEscrow.token || "Select Token"}</span>
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
                              setFundsWithoutEscrow((prev) => ({
                                ...prev,
                                token: option.value,
                              }));
                              setIsTokenOpen(false);
                              if (option.value !== "custom") {
                                setFundsWithoutEscrow((prev) => ({
                                  ...prev,
                                  customTokenAddress: "",
                                }));
                              }
                            }}
                            className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                    {fundsWithoutEscrow.token === "custom" && (
                      <div className="mt-3">
                        <label className="text-muted-foreground mb-2 block text-sm">
                          Paste Contract Address{" "}
                          <span className="text-cyan-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={fundsWithoutEscrow.customTokenAddress}
                          onChange={(e) => {
                            setFundsWithoutEscrow((prev) => ({
                              ...prev,
                              customTokenAddress: e.target.value,
                            }));
                          }}
                          placeholder="0x..."
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                        />
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  {/* Amount */}
                  <div>
                    <label className="text-muted-foreground mb-2 block text-sm">
                      Amount <span className="text-cyan-400">(Optional)</span>
                    </label>
                    <input
                      value={formatNumberWithCommas(fundsWithoutEscrow.amount)}
                      onChange={(e) => {
                        const rawValue = parseFormattedNumber(e.target.value);
                        setFundsWithoutEscrow((prev) => ({
                          ...prev,
                          amount: rawValue,
                        }));
                        updateValidation("amount", rawValue);
                      }}
                      onBlur={() =>
                        updateValidation("amount", fundsWithoutEscrow.amount)
                      }
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                      placeholder="10,000 or 0.5"
                      type="text"
                      inputMode="decimal"
                    />
                    {validation.amount.isTouched &&
                      fundsWithoutEscrow.amount && (
                        <div
                          className={`mt-1 text-xs ${validation.amount.isValid ? "text-green-400" : "text-amber-400"}`}
                        >
                          {validation.amount.message}
                        </div>
                      )}
                  </div>

                  {/* Information text */}
                  <div className="md:col-span-3">
                    <div className="flex items-start gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
                      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
                      <div>
                        <p className="text-sm text-cyan-300">
                          Funds information is for reference only in
                          reputational agreements.
                        </p>
                        <p className="mt-1 text-xs text-cyan-300/70">
                          This helps track the financial scope of the agreement
                          without automated fund handling.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="submit"
                  variant="neon"
                  className="neon-hover"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Create Agreement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// SourAgreementsSwiper component (unchanged)
// SourAgreementsSwiper component
function SourAgreementsSwiper({ agreements }: { agreements: any[] }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delay = 4800; // ms

  const next = useCallback(
    () => setIndex((prev) => (prev + 1) % agreements.length),
    [agreements.length],
  );
  const prev = useCallback(
    () =>
      setIndex((prev) => (prev - 1 + agreements.length) % agreements.length),
    [agreements.length],
  );

  useEffect(() => {
    if (!agreements.length) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(next, delay);
    return () => clearTimeout(timeoutRef.current || undefined);
  }, [index, agreements.length, next]);

  const handleUsernameClick = (username: string) => {
    const cleanUsername = cleanTelegramUsername(username);
    const encodedUsername = encodeURIComponent(cleanUsername);
    navigate(`/profile/${encodedUsername}`);
  };

  return (
    <div className="relative">
      {/* Swiper Navigation */}
      <div className="absolute -top-8 right-0 hidden items-center gap-2">
        <button onClick={prev}>
          <ChevronLeft className="text-cyan-300 hover:text-cyan-400" />
        </button>
        <button onClick={next}>
          <ChevronRight className="text-cyan-300 hover:text-cyan-400" />
        </button>
      </div>

      {/* Swiper Items */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {agreements.map((agreement, i) => (
          <div
            key={agreement.id}
            style={{
              transform: i === index ? "scale(1)" : "scale(0.9)",
              opacity: i === index ? 1 : 0.4,
            }}
            className="flex min-w-full flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-6 transition-all duration-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{agreement.title}</div>
                <div className="text-muted-foreground text-xs">
                  <button
                    onClick={() => handleUsernameClick(agreement.createdBy)}
                    className="text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    {agreement.createdBy}
                  </button>
                  {" ↔ "}
                  <button
                    onClick={() => handleUsernameClick(agreement.counterparty)}
                    className="text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    {agreement.counterparty}
                  </button>
                </div>
              </div>
              <span
                className={`badge ${
                  agreement.status === "pending"
                    ? "badge-orange"
                    : agreement.status === "completed"
                      ? "badge-green"
                      : agreement.status === "disputed"
                        ? "badge-purple"
                        : agreement.status === "signed"
                          ? "badge-blue"
                          : agreement.status === "cancelled"
                            ? "badge-red"
                            : ""
                }`}
              >
                {agreement.status}
              </span>
            </div>
            {agreement.reason && (
              <p className="text-xs text-white/70 italic">
                "{agreement.reason}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
