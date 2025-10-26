// Agreements.tsx
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
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "../components/UserAvatar";
// Add imports at the top
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
  isValidTelegramUsername,
} from "../lib/usernameUtils";

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
} as const;

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
      return "cancelled";
    default:
      return "pending";
  }
};

const UserSearchResult = ({
  user,
  onSelect,
}: {
  user: any;
  onSelect: (username: string) => void;
  field: "counterparty" | "partyA" | "partyB";
}) => {
  // Use consistent Telegram username extraction
  const telegramUsername = cleanTelegramUsername(
    user.telegram?.username ||
      user.telegramUsername ||
      user.telegramInfo ||
      user.username ||
      user.handle,
  );

  // Add @ prefix for display
  const displayUsername = telegramUsername ? `@${telegramUsername}` : "Unknown";
  const displayName = user.displayName || displayUsername;
  const isCurrentUser = user.id === user?.id;

  return (
    <div
      onClick={() => onSelect(telegramUsername)}
      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-cyan-500/30 ${
        isCurrentUser ? "opacity-50" : ""
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
            @{telegramUsername}
          </div>
        )}
        {user.bio && (
          <div className="mt-1 truncate text-xs text-cyan-200/70">
            {user.bio}
          </div>
        )}
      </div>
      {isCurrentUser && (
        <span className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400">
          You
        </span>
      )}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-cyan-400" />
    </div>
  );
};

export default function Agreements() {
  const navigate = useNavigate();
  const [typeValue, setTypeValue] = useState<"Public" | "Private" | "">("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [includeFunds, setIncludeFunds] = useState<"yes" | "no" | "">("");
  const [secureWithEscrow, setSecureWithEscrow] = useState<"yes" | "no" | "">(
    "",
  );
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  const [deadline, setDeadline] = useState<Date | null>(null);
  // In Agreements.tsx - Replace the current user search implementation
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
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
  const { isAuthenticated, user } = useAuth();

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

  // Sync authentication with agreement service
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && isAuthenticated) {
      agreementService.setAuthToken(token);
      console.log("🔐 Agreement service authenticated");
    } else {
      agreementService.clearAuthToken();
      console.log("🔓 Agreement service not authenticated");
    }
  }, [isAuthenticated]);

  // Load agreements
  useEffect(() => {
    const loadAgreements = async () => {
      try {
        setLoading(true);

        // Load both public agreements and user's agreements
        const [publicAgreements, myAgreements] = await Promise.all([
          agreementService.getAgreements(),
          agreementService.getMyAgreements(),
        ]);

        console.log("📋 Public agreements response:", publicAgreements);
        console.log("👤 My agreements response:", myAgreements);

        // Handle the response structure properly
        const publicAgreementsList = publicAgreements.results || [];
        const myAgreementsList = myAgreements.results || [];

        const transformedAgreements = [
          ...publicAgreementsList.map(transformApiAgreement),
          ...myAgreementsList.map(transformApiAgreement),
        ];

        console.log("🔄 Transformed agreements:", transformedAgreements);

        // Remove duplicates by ID
        const uniqueAgreements = transformedAgreements.filter(
          (agreement, index, self) =>
            index === self.findIndex((a) => a.id === agreement.id),
        );

        setAgreements(uniqueAgreements);
        console.log("✅ Final agreements:", uniqueAgreements);
      } catch (error: any) {
        console.error("Failed to fetch agreements:", error);

        // Show user-friendly error message
        if (error.message.includes("Network error")) {
          toast.error(
            "Network error: Unable to connect to server. Please check your internet connection.",
          );
        } else if (error.message.includes("Authentication required")) {
          toast.error("Please log in to view agreements");
        } else {
          toast.error("Failed to load agreements: " + error.message);
        }

        // Set empty array to prevent further errors
        setAgreements([]);
      } finally {
        setLoading(false);
      }
    };

    loadAgreements();
  }, []);

  // Helper function to transform API agreement to frontend format
  const transformApiAgreement = (apiAgreement: any): Agreement => {
    console.log("🔄 Transforming API agreement - Full object:", apiAgreement);

    // Handle date conversion safely
    const formatDateSafely = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString();
      } catch (error) {
        console.warn("Invalid date:", dateString, error);
        return "Invalid Date";
      }
    };

    console.log("FirstParty object:", apiAgreement.firstParty);
    console.log("CounterParty object:", apiAgreement.counterParty);

    // Helper function to extract avatar ID and convert to number
    const getAvatarIdFromParty = (party: any): number | null => {
      const avatarId = party?.avatarId || party?.avatar?.id;
      return avatarId ? Number(avatarId) : null;
    };

    // Get the creator/createdBy - check multiple possible fields
    const rawCreatedBy =
      apiAgreement.firstParty?.username ||
      apiAgreement.firstParty?.handle ||
      apiAgreement.creator?.username ||
      "Unknown";

    // Add @ prefix for display
    const createdBy = rawCreatedBy.startsWith("@")
      ? rawCreatedBy
      : `@${rawCreatedBy}`;

    const createdByUserId =
      apiAgreement.firstParty?.id?.toString() ||
      apiAgreement.creator?.id?.toString();

    // Check for avatar in multiple possible fields
    const createdByAvatarId =
      getAvatarIdFromParty(apiAgreement.firstParty) ||
      getAvatarIdFromParty(apiAgreement.creator);

    // Get counterparty - check multiple possible fields
    const rawCounterparty =
      apiAgreement.counterParty?.username ||
      apiAgreement.counterParty?.handle ||
      "Unknown";

    // Add @ prefix for display
    const counterparty = rawCounterparty.startsWith("@")
      ? rawCounterparty
      : `@${rawCounterparty}`;

    const counterpartyUserId = apiAgreement.counterParty?.id?.toString();

    // Check for avatar in multiple possible fields
    const counterpartyAvatarId = getAvatarIdFromParty(
      apiAgreement.counterParty,
    );

    console.log(
      `Avatar info - CreatedBy: ${createdBy}, AvatarId: ${createdByAvatarId}`,
    );
    console.log(
      `Avatar info - Counterparty: ${counterparty}, AvatarId: ${counterpartyAvatarId}`,
    );

    return {
      id: apiAgreement.id.toString(),
      title: apiAgreement.title || "Untitled Agreement",
      description: apiAgreement.description || "",
      type: "Public",
      counterparty: counterparty,
      createdBy: createdBy,
      status: apiStatusToFrontend(apiAgreement.status),
      dateCreated: formatDateSafely(
        apiAgreement.dateCreated || apiAgreement.createdAt,
      ),
      deadline: formatDateSafely(apiAgreement.deadline),
      amount: apiAgreement.amount ? apiAgreement.amount.toString() : undefined,
      token: apiAgreement.tokenSymbol || undefined,
      files: 0,

      // Add avatar information
      createdByAvatarId: createdByAvatarId,
      counterpartyAvatarId: counterpartyAvatarId,
      createdByUserId: createdByUserId,
      counterpartyUserId: counterpartyUserId,
    };
  };

  const tableFilterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "signed", label: "Signed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
    { value: "pending_approval", label: "Pending Approval" },
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

  // Update the filter logic
  const filteredTableAgreements: Agreement[] = agreements
    .filter((a) => {
      // Status filter - "all" means no filtering
      if (tableFilter !== "all" && a.status !== tableFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(query) ||
          a.counterparty.toLowerCase().includes(query) ||
          (a.amount && a.amount.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.title.localeCompare(b.title);
      } else {
        return b.title.localeCompare(a.title);
      }
    });

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
      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + " MB";
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

  // In Agreements.tsx - replace the handleSubmit function with this updated version
  // In Agreements.tsx - revert handleSubmit to the working version without validation
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
    if (!deadline) {
      toast.error("Please select a deadline");
      return;
    }
    if (form.images.length === 0) {
      toast.error("Please upload at least one supporting document");
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
        !isValidTelegramUsername(currentUserTelegram)
      ) {
        toast.error(
          "Unable to identify your Telegram account. Please ensure your profile is properly connected.",
        );
        setIsSubmitting(false);
        return;
      }

      if (
        agreementType === "myself" &&
        !isValidTelegramUsername(form.counterparty)
      ) {
        toast.error("Please enter a valid counterparty Telegram username");
        setIsSubmitting(false);
        return;
      }

      if (
        agreementType === "others" &&
        (!isValidTelegramUsername(form.partyA) ||
          !isValidTelegramUsername(form.partyB))
      ) {
        toast.error("Please enter valid Telegram usernames for both parties");
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
        type:
          includeFunds === "yes"
            ? AgreementTypeEnum.ESCROW
            : AgreementTypeEnum.REPUTATION,
        visibility:
          typeValue === "Public"
            ? AgreementVisibilityEnum.PUBLIC
            : AgreementVisibilityEnum.PRIVATE,
        // 🚨 CRITICAL: Use consistently cleaned Telegram usernames
        firstParty:
          agreementType === "myself" ? cleanUserTelegram : cleanPartyA,
        counterParty:
          agreementType === "myself" ? cleanCounterparty : cleanPartyB,
        deadline: deadline.toISOString(),
      };

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

      // Use the real API to create the agreement - let the API handle user validation
      await agreementService.createAgreement(
        agreementData,
        form.images.map((f) => f.file),
      );

      // Success message
      const successMessage =
        agreementType === "myself"
          ? `Agreement created between you and @${form.counterparty}`
          : `Agreement created between @${form.partyA} and @${form.partyB}`;

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

      console.log("🔍 Searching users for", field, "with query:", query);

      if (query.length < 2) {
        setUserSearchResults([]);
        setShowUserSuggestions(false);
        return;
      }

      setIsUserSearchLoading(true);
      setShowUserSuggestions(true);

      try {
        const results = await agreementService.searchUsers(query);
        console.log("🔍 RAW SEARCH RESULTS:", results);

        // Filter out current user from results to prevent self-agreements
        const currentUserTelegram = getCurrentUserTelegram(user);
        const filteredResults = results.filter((resultUser) => {
          const resultTelegram = cleanTelegramUsername(
            resultUser.telegram?.username ||
              resultUser.telegramUsername ||
              resultUser.telegramInfo ||
              resultUser.username,
          );
          return resultTelegram !== currentUserTelegram;
        });

        setUserSearchResults(filteredResults);
      } catch (error) {
        console.error("User search failed:", error);
        setUserSearchResults([]);

        if (query.length >= 2) {
          toast.error("User search temporarily unavailable");
        }
      } finally {
        setIsUserSearchLoading(false);
      }
    },
    [user],
  );

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      handleUserSearch(debouncedSearchQuery, activeSearchField);
    }
  }, [debouncedSearchQuery, activeSearchField, handleUserSearch]);

  // const testWithKnownUsers = async () => {

  //   const testData = {
  //     title: "Test Agreement - Known Users",
  //     description: "Testing with users we know exist",
  //     type: 1,
  //     visibility: 2,
  //     firstParty: "Ghravitee",
  //     counterParty: "@LuminalLink",
  //     deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  //   };

  //   const testFiles = [new File(["test"], "test.txt", { type: "text/plain" })];

  //   try {
  //     console.log("🧪 Testing with known users (bypassing validation)");
  //     await agreementService.createAgreement(testData, testFiles);
  //     console.log("✅ TEST SUCCESS: Agreement created with known users");
  //     toast.success("Test agreement created successfully");
  //   } catch (error) {
  //     console.error("❌ TEST FAILED:", error);
  //     toast.error("Test failed - check console");
  //   }
  // };

  return (
    <div className="relative">
      <div className="absolute top-32 right-10 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[30rem]"></div>
      <div className="absolute -top-20 left-0 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[15rem]"></div>
      <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div>

      {/* Agreements Filter */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="col-span-3">
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

              {isAuthenticated ? (
                <div className="flex items-center gap-2 text-sm text-cyan-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Authenticated as {user?.handle}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-300">
                  <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                  <span>Not authenticated</span>
                </div>
              )}

              {/* Test button */}
              {/* <button
                onClick={testWithKnownUsers}
                className="ml-4 rounded-md border border-cyan-400/40 bg-cyan-600/20 px-3 py-1 text-sm text-cyan-100 hover:bg-cyan-500/30"
              >
                Test with known users
              </button> */}
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
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <h3 className="font-semibold text-white/90">All Agreements</h3>
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
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-400" />
                            <span className="text-cyan-300">
                              Loading agreements...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTableAgreements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-muted-foreground px-5 py-4 text-center"
                        >
                          No agreements found.
                        </td>
                      </tr>
                    ) : (
                      filteredTableAgreements.map((a) => (
                        <tr
                          key={a.id}
                          className="cursor-pointer border-t border-white/10 text-xs transition hover:bg-white/5"
                          onClick={() => navigate(`/agreements/${a.id}`)}
                        >
                          <td className="text-muted-foreground px-5 py-4">
                            {a.dateCreated}
                          </td>
                          <td className="px-5 py-4 font-medium text-white/90">
                            {a.title}
                          </td>
                          <td className="px-5 py-4 text-white/90">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <UserAvatar
                                  userId={
                                    a.createdByUserId ||
                                    a.createdBy.replace(/^@/, "")
                                  }
                                  avatarId={a.createdByAvatarId || null}
                                  username={a.createdBy.replace(/^@/, "")}
                                  size="sm"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanUsername = a.createdBy.replace(
                                      /^@/,
                                      "",
                                    );
                                    const encodedUsername =
                                      encodeURIComponent(cleanUsername);
                                    navigate(`/profile/${encodedUsername}`);
                                  }}
                                  className="text-cyan-300 hover:text-cyan-200 hover:underline"
                                >
                                  {a.createdBy}
                                </button>
                              </div>
                              <span className="text-cyan-400">↔</span>
                              <div className="flex items-center gap-1">
                                <UserAvatar
                                  userId={
                                    a.counterpartyUserId ||
                                    a.counterparty.replace(/^@/, "")
                                  }
                                  avatarId={a.counterpartyAvatarId || null}
                                  username={a.counterparty.replace(/^@/, "")}
                                  size="sm"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanUsername =
                                      a.counterparty.replace(/^@/, "");
                                    const encodedUsername =
                                      encodeURIComponent(cleanUsername);
                                    navigate(`/profile/${encodedUsername}`);
                                  }}
                                  className="text-cyan-300 hover:text-cyan-200 hover:underline"
                                >
                                  {a.counterparty}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white/90">
                            {a.amount
                              ? `${a.amount} ${a.token || ""}`
                              : "No amount"}
                          </td>
                          <td className="px-5 py-4 text-white/90">
                            {a.deadline}
                          </td>
                          <td className="px-5 py-4">
                            {a.status === "pending" ? (
                              <span className="badge badge-orange">
                                Pending
                              </span>
                            ) : a.status === "signed" ? (
                              <span className="badge badge-blue">Signed</span>
                            ) : a.status === "cancelled" ? (
                              <span className="badge badge-red">Cancelled</span>
                            ) : a.status === "completed" ? (
                              <span className="badge badge-green">
                                Completed
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
          </div>
        </div>

        <aside className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="space mb-2 text-xl text-white">
              Agreements Turned Sour 😬
            </h1>

            {/* Filter Dropdown */}
            <div className="group relative hidden w-36" ref={recentFilterRef}>
              <div
                onClick={() => setIsRecentFilterOpen((prev) => !prev)}
                className="flex cursor-pointer items-center justify-between rounded-md bg-white px-3 py-1 text-black transition-all dark:bg-[#d5f2f80a] dark:text-white"
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
            onClick={() => setIsModalOpen(false)}
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
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                  placeholder="e.g. Design Sprint Phase 1"
                  required
                />
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
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                      <input
                        value={form.counterparty}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm({ ...form, counterparty: value });
                          handleUserSearch(value, "counterparty");
                        }}
                        onFocus={() => {
                          if (form.counterparty.length >= 2) {
                            setShowUserSuggestions(true);
                          }
                        }}
                        className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                        placeholder="Type username (min 2 characters)..."
                        required
                      />
                      {isUserSearchLoading && (
                        <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                      )}
                    </div>

                    {/* User Suggestions Dropdown */}
                    {showUserSuggestions &&
                      activeSearchField === "counterparty" && (
                        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                          {userSearchResults.length > 0 ? (
                            userSearchResults.map((user) => (
                              <UserSearchResult
                                key={user.id}
                                user={user}
                                onSelect={(username) => {
                                  setForm({ ...form, counterparty: username });
                                  setShowUserSuggestions(false);
                                  setUserSearchQuery(""); // Clear search query
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
                            setForm({ ...form, partyA: value });
                            handleUserSearch(value, "partyA");
                          }}
                          onFocus={() => {
                            if (form.partyA.length >= 2) {
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

                      {/* User Suggestions Dropdown for Party A */}
                      {showUserSuggestions &&
                        activeSearchField === "partyA" && (
                          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                            {userSearchResults.length > 0 ? (
                              userSearchResults.map((user) => (
                                <UserSearchResult
                                  key={user.id}
                                  user={user}
                                  onSelect={(username) => {
                                    setForm({ ...form, partyA: username });
                                    setShowUserSuggestions(false);
                                    setUserSearchQuery(""); // Clear search query
                                  }}
                                  field="partyA"
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
                            setForm({ ...form, partyB: value });
                            handleUserSearch(value, "partyB");
                          }}
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

                      {/* User Suggestions Dropdown for Party B */}
                      {showUserSuggestions &&
                        activeSearchField === "partyB" && (
                          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                            {userSearchResults.length > 0 ? (
                              userSearchResults.map((user) => (
                                <UserSearchResult
                                  key={user.id}
                                  user={user}
                                  onSelect={(username) => {
                                    setForm({ ...form, partyB: username });
                                    setShowUserSuggestions(false);
                                    setUserSearchQuery(""); // Clear search query
                                  }}
                                  field="partyB"
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
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                  placeholder="Scope, deliverables, timelines..."
                  required
                />
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
                  <span className="text-red-500">*</span>
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
                      Supports images, PDFs, and documents
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

              {/* Escrow Panel */}
              {includeFunds === "yes" && (
                <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-all">
                  <p className="text-sm text-white/90">
                    Would you like to secure the funds in an escrow contract?{" "}
                    <span className="text-cyan-400">(Optional)</span>
                  </p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setSecureWithEscrow("yes")}
                      className={`rounded-md border px-4 py-2 transition-colors ${
                        secureWithEscrow === "yes"
                          ? "border-cyan-400 bg-cyan-500/30 text-cyan-200"
                          : "border-white/10 text-white/70 hover:border-cyan-400/40"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecureWithEscrow("no")}
                      className={`rounded-md border px-4 py-2 transition-colors ${
                        secureWithEscrow === "no"
                          ? "border-cyan-400 bg-cyan-500/30 text-cyan-200"
                          : "border-white/10 text-white/70 hover:border-cyan-400/40"
                      }`}
                    >
                      No
                    </button>
                  </div>
                  {secureWithEscrow === "yes" && (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {/* Token Dropdown */}
                      <div
                        className="relative flex w-full flex-col gap-2"
                        ref={tokenRef}
                      >
                        <label className="text-sm font-semibold text-white">
                          Token{" "}
                          <span className="text-cyan-400">(Optional)</span>
                        </label>
                        <div
                          onClick={() => setIsTokenOpen((prev) => !prev)}
                          className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan-400/40"
                        >
                          <span>{selectedToken || "Select Token"}</span>
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
                                  setSelectedToken(option.value);
                                  setIsTokenOpen(false);
                                  if (option.value !== "custom") {
                                    setCustomTokenAddress("");
                                  }
                                }}
                                className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedToken === "custom" && (
                          <div className="mt-3">
                            <label className="text-muted-foreground mb-2 block text-sm">
                              Paste Contract Address{" "}
                              <span className="text-cyan-400">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={customTokenAddress}
                              onChange={(e) =>
                                setCustomTokenAddress(e.target.value)
                              }
                              placeholder="0x..."
                              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                            />
                          </div>
                        )}
                      </div>
                      {/* Amount */}
                      <div>
                        <label className="text-muted-foreground mb-2 block text-sm">
                          Amount{" "}
                          <span className="text-cyan-400">(Optional)</span>
                        </label>
                        <input
                          value={form.amount}
                          onChange={(e) =>
                            setForm({ ...form, amount: e.target.value })
                          }
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="1000"
                          type="number"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  onClick={() => {
                    toast.message("Draft saved", {
                      description: "Your agreement has been saved as draft",
                    });
                    setIsModalOpen(false);
                  }}
                  disabled={isSubmitting}
                >
                  Save Draft
                </Button>
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
    const cleanUsername = username.replace(/^@/, "");
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
