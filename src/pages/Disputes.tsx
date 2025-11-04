/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
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
import { useAuth } from "../context/AuthContext";

// File upload types
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

// User Search Result Component
const UserSearchResult = ({
  user,
  onSelect,
}: {
  user: any;
  onSelect: (username: string) => void;
  field: "defendant" | "witness";
}) => {
  const { user: currentUser } = useAuth();

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
  const isCurrentUser = user.id === currentUser?.id;

  return (
    <div
      onClick={() => onSelect(telegramUsername)}
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
// Update the useDisputes hook to properly map status values
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
                    : undefined,
        search: filters.search,
        range: rangeValue,
        sort: filters.sort === "asc" ? ("asc" as const) : ("desc" as const),
        top: 50,
        skip: 0,
      };

      const response = await disputeService.getDisputes(apiParams);
      const transformedData = response.results.map((item) =>
        disputeService.transformDisputeListItemToRow(item),
      );

      setData(transformedData);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch disputes:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.search, filters.range, filters.sort]);

  useEffect(() => {
    fetchDisputes();
  }, [
    filters.status,
    filters.search,
    filters.range,
    filters.sort,
    fetchDisputes,
  ]);

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

export default function Disputes() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

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

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<
    "defendant" | "witness"
  >("defendant");
  const [activeWitnessIndex, setActiveWitnessIndex] = useState<number>(0);
  const userSearchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(userSearchQuery, 300);

  // Use the custom hook for data fetching
  const { data, loading, error, refetch } = useDisputes({
    status: status,
    search: query,
    range: dateRange,
    sort: sortAsc ? "asc" : "desc",
  });

  const filterOptions = [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Vote in Progress", value: "Vote in Progress" },
    { label: "Settled", value: "Settled" },
    { label: "Dismissed", value: "Dismissed" },
  ];

  const recentDisputesFilterOptions = [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Vote in Progress", value: "Vote in Progress" },
    { label: "Settled", value: "Settled" },
    { label: "Dismissed", value: "Dismissed" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        recentDisputesDropdownRef.current &&
        !recentDisputesDropdownRef.current.contains(event.target as Node) &&
        userSearchRef.current &&
        !userSearchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsRecentDisputesFilterOpen(false);
        setShowUserSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // User search function
  const handleUserSearch = useCallback(
    async (
      query: string,
      field: "defendant" | "witness",
      witnessIndex: number = 0,
    ) => {
      setUserSearchQuery(query);
      setActiveSearchField(field);
      if (field === "witness") {
        setActiveWitnessIndex(witnessIndex);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("🔍 Searching users for", field, "with query:", query);
      }

      if (query.length < 2) {
        setUserSearchResults([]);
        setShowUserSuggestions(false);
        return;
      }

      setIsUserSearchLoading(true);
      setShowUserSuggestions(true);

      try {
        const results = await disputeService.searchUsers(query);

        if (process.env.NODE_ENV === "development") {
          console.log("🔍 RAW SEARCH RESULTS:", results);
        }

        // Filter out current user AND users without Telegram usernames
        const currentUserTelegram = getCurrentUserTelegram(currentUser);
        const filteredResults = results.filter((resultUser) => {
          // 🚨 FIXED: Look for telegramUsername field (from API response)
          const resultTelegram = cleanTelegramUsername(
            resultUser.telegramUsername ||
              resultUser.telegram?.username ||
              resultUser.telegramInfo,
          );

          // Only include users with Telegram usernames AND not the current user
          // Use case-insensitive comparison
          return (
            resultTelegram &&
            resultTelegram.toLowerCase() !== currentUserTelegram.toLowerCase()
          );
        });

        setUserSearchResults(filteredResults);
      } catch (error) {
        console.error("User search failed:", error);
        setUserSearchResults([]);
      } finally {
        setIsUserSearchLoading(false);
      }
    },
    [currentUser],
  );

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      handleUserSearch(
        debouncedSearchQuery,
        activeSearchField,
        activeWitnessIndex,
      );
    }
  }, [
    debouncedSearchQuery,
    activeSearchField,
    activeWitnessIndex,
    handleUserSearch,
  ]);

  const filtered = data
    .filter((d) => (status === "All" ? true : d.status === status))
    .filter((d) =>
      query.trim()
        ? d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.parties.toLowerCase().includes(query.toLowerCase()) ||
          d.claim.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .filter((d) => {
      if (dateRange === "All") return true;
      const days = dateRange === "7d" ? 7 : 30;
      const dtime = new Date(d.createdAt).getTime();
      return Date.now() - dtime <= days * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => {
      // Parse dates safely
      const parseDate = (dateStr: string): Date => {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date(0) : date; // Fallback to epoch if invalid
      };

      const aDate = parseDate(a.createdAt);
      const bDate = parseDate(b.createdAt);

      return sortAsc
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    });

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

    console.log("New Files:", newFiles);

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
            evidence: [...prev.evidence, newFile],
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setForm((prev) => ({
          ...prev,
          evidence: [...prev.evidence, newFile],
        }));
      }
    });
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Form validation
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

    // Validate Telegram usernames
    if (!isValidTelegramUsername(form.defendant)) {
      toast.error("Please enter a valid defendant Telegram username");
      return;
    }

    // Validate witness Telegram usernames
    const invalidWitnesses = form.witnesses
      .filter((w) => w.trim())
      .filter((w) => !isValidTelegramUsername(w));

    if (invalidWitnesses.length > 0) {
      toast.error("Please enter valid Telegram usernames for all witnesses");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Preparing dispute submission...");

      const cleanedDefendant = cleanTelegramUsername(form.defendant);
      const cleanedWitnesses = form.witnesses
        .filter((w) => w.trim())
        .map((w) => cleanTelegramUsername(w));

      const requestKind =
        form.kind === "Pro Bono"
          ? DisputeTypeEnum.ProBono
          : DisputeTypeEnum.Paid;

      const createDisputeData: CreateDisputeRequest = {
        title: form.title,
        description: form.description,
        requestKind,
        defendant: cleanedDefendant,
        claim: form.claim,
        witnesses: cleanedWitnesses,
      };

      const files = form.evidence.map((uf) => uf.file);

      // ✅ Call updated service method
      const result = await disputeService.createDispute(
        createDisputeData,
        files,
      );

      console.log("✅ Dispute created:", result);
      toast.success("Dispute submitted successfully", {
        description: `${form.title} • ${form.kind} • ${files.length} files uploaded`,
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
      <div className="absolute block size-[20rem] rounded-full bg-cyan-500/20 blur-3xl lg:top-28 lg:right-20 lg:size-[30rem]"></div>
      <div className="absolute -top-20 -left-6 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[25rem]"></div>
      <div className="absolute inset-0 -z-[50] bg-cyan-500/10 blur-3xl"></div>

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
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
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
                      className={`cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white ${
                        status === option.value
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
                onClick={() => setSortAsc((v) => !v)}
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
                {filtered.length}{" "}
                {filtered.length === 1 ? "dispute" : "disputes"}
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
                  {filtered.map((d) => (
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
                          <div className="truncate font-medium">{d.title}</div>
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
                              {formatTelegramUsernameForDisplay(d.plaintiff)}
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
                              {formatTelegramUsernameForDisplay(d.defendant)}
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
                        ) : (
                          <span className="badge border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                            Vote in Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No disputes found matching your criteria.
                  </p>
                </div>
              )}
            </div>
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
                    className={`transform text-2xl text-white transition-transform duration-300 ${
                      isRecentDisputesFilterOpen ? "rotate-180" : ""
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
                      className={`cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-cyan-300 hover:text-white ${
                        idx === 0 ? "rounded-t-xl" : ""
                      } ${
                        idx === recentDisputesFilterOptions.length - 1
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

          <div className="glass border border-white/10 bg-gradient-to-br from-cyan-500/10 p-4">
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
                      className={`badge ml-2 text-xs ${
                        dispute.status === "Pending"
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
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6 shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="mb-5 border-b border-white/10 pb-3">
              <h2 className="text-lg font-semibold text-white/90">
                Raise New Dispute
              </h2>
              <p className="text-muted-foreground text-sm">
                Provide details and evidence. Max 5 witnesses.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={submit}
              className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-muted-foreground text-sm">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative cursor-help">
                    <Info className="h-4 w-4 text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      Never underestimate the power of a catchy title — it can
                      grab attention and attract judges to your case faster.
                    </div>
                  </div>
                </div>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
                  placeholder="e.g. He refused to issue a refund despite going AWOL for weeks!"
                />
              </div>
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
                        No payment required. Judges will handle your case pro
                        bono when available.
                      </div>
                    </div>
                    <div className="group relative cursor-pointer">
                      <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                        Paid
                      </span>
                      <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                        A fee of 0.01 ETH is required to initiate your dispute.
                        This fee helps prioritize your case and notifies all
                        judges to begin reviewing it immediately.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["Pro Bono", "Paid"] as const).map((k) => (
                    <label
                      key={k}
                      className={`cursor-pointer rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${
                        form.kind === k
                          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="kind"
                        className="hidden"
                        checked={form.kind === k}
                        onChange={() => setForm({ ...form, kind: k })}
                      />
                      {k}
                    </label>
                  ))}
                </div>
              </div>

              {/* Defendant Field with User Search */}
              <div className="relative" ref={userSearchRef}>
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
                      handleUserSearch(value, "defendant");
                    }}
                    onFocus={() => {
                      if (form.defendant.length >= 2) {
                        setShowUserSuggestions(true);
                      }
                    }}
                    className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                    placeholder="Type username (min 2 characters)..."
                    required
                  />
                  {isUserSearchLoading && activeSearchField === "defendant" && (
                    <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                  )}
                </div>

                {/* User Suggestions Dropdown */}
                {showUserSuggestions && activeSearchField === "defendant" && (
                  <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                    {userSearchResults.length > 0 ? (
                      userSearchResults.map((user) => (
                        <UserSearchResult
                          key={user.id}
                          user={user}
                          onSelect={(username) => {
                            setForm({ ...form, defendant: username });
                            setShowUserSuggestions(false);
                            setUserSearchQuery(""); // Clear search query
                          }}
                          field="defendant"
                        />
                      ))
                    ) : userSearchQuery.length >= 2 && !isUserSearchLoading ? (
                      <div className="px-4 py-3 text-center text-sm text-cyan-300">
                        No users found for "{userSearchQuery}"
                        <div className="mt-1 text-xs text-cyan-400">
                          Make sure the user exists and has a Telegram username
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

              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
                  placeholder="Describe the situation, milestones, messages, and expectations"
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
                      Make sure it's reasonable, as that might help your case
                      when the judges look into it.
                    </div>
                  </div>
                </div>
                <textarea
                  value={form.claim || ""}
                  onChange={(e) => setForm({ ...form, claim: e.target.value })}
                  className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
                  placeholder="What do you want the court to do for you?"
                />
              </div>

              {/* Enhanced Evidence Upload Section */}
              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  Evidence Upload <span className="text-red-500">*</span>
                </label>

                {/* Drag and Drop Area */}
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
                    id="evidence-upload"
                  />
                  <label
                    htmlFor="evidence-upload"
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

                {/* File List with Previews */}
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

              {/* Witnesses with User Search */}
              <div>
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
                    disabled={form.witnesses.length >= 5}
                  >
                    Add witness
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.witnesses.map((w, i) => (
                    <div key={i} className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                        <input
                          value={w}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateWitness(i, value);
                            handleUserSearch(value, "witness", i);
                          }}
                          onFocus={() => {
                            if (w.length >= 2) {
                              setShowUserSuggestions(true);
                              setActiveWitnessIndex(i);
                            }
                          }}
                          className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder={`Type username (min 2 characters)...`}
                        />
                        {isUserSearchLoading &&
                          activeSearchField === "witness" &&
                          activeWitnessIndex === i && (
                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                          )}
                      </div>
                      {form.witnesses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWitness(i)}
                          className="text-muted-foreground rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs hover:text-white"
                        >
                          Remove
                        </button>
                      )}

                      {/* Witness User Suggestions Dropdown */}
                      {showUserSuggestions &&
                        activeSearchField === "witness" &&
                        activeWitnessIndex === i && (
                          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                            {userSearchResults.length > 0 ? (
                              userSearchResults.map((user) => (
                                <UserSearchResult
                                  key={user.id}
                                  user={user}
                                  onSelect={(username) => {
                                    updateWitness(i, username);
                                    setShowUserSuggestions(false);
                                    setUserSearchQuery(""); // Clear search query
                                  }}
                                  field="witness"
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
                  ))}
                </div>
              </div>

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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Paperclip className="mr-2 h-4 w-4" />
                      Submit Dispute
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function JudgesIntro() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      className={`glass card-cyan relative col-span-2 overflow-hidden p-6 transition-all duration-300 ${
        expanded ? "h-auto" : "lg:h-[14rem]"
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
