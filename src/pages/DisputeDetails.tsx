/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  ArrowLeft,
  Clock,
  Users,
  FileText,
  Scale,
  MessageCircle,
  Upload,
  UserCheck,
  User,
  Shield,
  X,
  ExternalLink,
  Image as ImageIcon,
  File,
  MessageSquare,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Info,
  BarChart3,
  Send,
  Trash2,
  Search,
  ChevronRight,
} from "lucide-react";
import { VscVerifiedFilled } from "react-icons/vsc";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { disputeService } from "../services/disputeServices";
// Add these imports with your other imports
import { UserAvatar } from "../components/UserAvatar";
import {
  cleanTelegramUsername,
  formatTelegramUsernameForDisplay,
  getCurrentUserTelegram,
  isValidTelegramUsername,
} from "../lib/usernameUtils";

import type {
  DefendantClaimRequest,
  DisputeRow,
  EvidenceFile,
  UploadedFile,
} from "../types";

// Simplified evidence type definitions - only images and docs
type EvidenceType = "image" | "pdf" | "transaction" | "chat" | "document";

interface EvidenceItem {
  name: string;
  type: EvidenceType;
  url: string;
  preview?: string;
}

// Voting types
interface VoteData {
  choice: "plaintiff" | "defendant" | "dismissed" | null;
  comment: string;
}

const UserSearchResult = ({
  user,
  onSelect,
}: {
  user: any;
  onSelect: (username: string) => void;
  field: "defendant" | "witness";
}) => {
  const { user: currentUser } = useAuth();

  const telegramUsername = cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );

  if (!telegramUsername) {
    return null;
  }

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
            @{telegramUsername}
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

// File upload types

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

// Mock vote outcome data
const mockVoteOutcome = {
  winner: "plaintiff" as const,
  judgeVotes: 7,
  communityVotes: 124,
  judgePct: 72,
  communityPct: 61,
  comments: [
    {
      handle: "@judgeNova",
      text: "Compelling evidence of breach of agreement.",
    },
    {
      handle: "@judgeAres",
      text: "Clear violation of terms based on the evidence provided.",
    },
  ],
};

// Plaintiff Reply Modal Component
const PlaintiffReplyModal = ({
  isOpen,
  onClose,
  dispute,
  onSubmit,
  navigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeRow | null;
  onSubmit: (
    title: string,
    description: string,
    claim: string,
    requestKind: number,
    files: UploadedFile[],
    witnesses: string[],
  ) => void;
  navigate: (path: string) => void;
}) => {
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState(dispute?.title || "");
  const [description, setDescription] = useState(dispute?.description || "");
  const [claim, setClaim] = useState(dispute?.claim || "");
  const [requestKind, setRequestKind] = useState<number>(1); // Default to Pro Bono
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Witness search state
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const witnessSearchRef = useRef<HTMLDivElement>(null);
  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  // Witness search function
  const handleWitnessSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setWitnessSearchResults([]);
        setShowWitnessSuggestions(false);
        return;
      }

      setIsWitnessSearchLoading(true);
      setShowWitnessSuggestions(true);

      try {
        const results = await disputeService.searchUsers(query);

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

  // Debounced search effect
  useEffect(() => {
    if (debouncedWitnessQuery.length >= 2) {
      handleWitnessSearch(debouncedWitnessQuery);
    } else {
      setWitnessSearchResults([]);
      setShowWitnessSuggestions(false);
    }
  }, [debouncedWitnessQuery, handleWitnessSearch]);

  // Handle witness selection
  const handleWitnessSelect = (username: string) => {
    if (!witnesses.includes(username)) {
      setWitnesses((prev) => [...prev, username]);
    }
    setShowWitnessSuggestions(false);
    setWitnessSearchQuery("");
  };

  // Click outside handler for witness search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        witnessSearchRef.current &&
        !witnessSearchRef.current.contains(event.target as Node)
      ) {
        setShowWitnessSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset form when dispute changes
  // Reset form when dispute changes
  useEffect(() => {
    if (dispute) {
      setTitle(dispute.title || "");
      setDescription(dispute.description || "");
      setClaim(dispute.claim || "");
      setRequestKind(dispute.request === "Pro Bono" ? 1 : 2);
      setWitnesses(dispute.witnesses?.plaintiff?.map((w) => w.username) || []);
    }
  }, [dispute]);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    console.log("new files:", newFiles);

    Array.from(selectedFiles).forEach((file) => {
      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
      };

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setFiles((prev) => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setFiles((prev) => [...prev, newFile]);
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const removeWitness = (witnessToRemove: string) => {
    setWitnesses((prev) =>
      prev.filter((witness) => witness !== witnessToRemove),
    );
  };

  const handleSubmit = async () => {
    // Validation for Plaintiff
    // Check if at least one field is being updated (including witnesses, files, etc.)
    const hasTextChanges =
      title.trim() !== dispute?.title ||
      description.trim() !== dispute?.description ||
      claim.trim() !== dispute?.claim;

    const hasWitnessChanges =
      JSON.stringify(witnesses) !== JSON.stringify(dispute?.witnesses || []);

    const hasRequestKindChanges =
      requestKind !== (dispute?.request === "Pro Bono" ? 1 : 2);
    const hasFileChanges = files.length > 0;

    if (
      !hasTextChanges &&
      !hasWitnessChanges &&
      !hasRequestKindChanges &&
      !hasFileChanges
    ) {
      toast.error("Please provide at least one field to update");
      return;
    }

    // For edits, only validate fields that are actually being changed
    // Don't require all fields to be filled if they're not being updated

    // If title is being changed, validate it
    if (hasTextChanges && title.trim() !== dispute?.title && !title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    // If description is being changed, validate it
    if (
      hasTextChanges &&
      description.trim() !== dispute?.description &&
      !description.trim()
    ) {
      toast.error("Description cannot be empty");
      return;
    }

    // If claim is being changed, validate it
    if (hasTextChanges && claim.trim() !== dispute?.claim && !claim.trim()) {
      toast.error("Formal claim cannot be empty");
      return;
    }

    // Validate witness format only for new witnesses being added
    const invalidWitnesses = witnesses.filter(
      (witness) => !witness.trim() || !isValidTelegramUsername(witness),
    );

    if (invalidWitnesses.length > 0) {
      toast.error("All witnesses must have valid Telegram usernames");
      return;
    }

    // Validate file sizes and types
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    for (const file of files) {
      // Check file size
      if (file.file.size > maxFileSize) {
        toast.error(`File ${file.file.name} exceeds 10MB size limit`);
        return;
      }

      // Check file type
      const fileType = file.file.type;
      if (
        !allowedImageTypes.includes(fileType) &&
        !allowedDocumentTypes.includes(fileType)
      ) {
        toast.error(
          `File ${file.file.name} has unsupported type. Allowed: images, PDFs, Word docs, text files`,
        );
        return;
      }
    }

    // Validate total files count
    if (files.length > 10) {
      toast.error("Maximum 10 files allowed for evidence");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(title, description, claim, requestKind, files, witnesses);

      // Reset form on successful submission
      setTitle("");
      setDescription("");
      setClaim("");
      setRequestKind(1);
      setFiles([]);
      setWitnesses([]);

      onClose();

      toast.success("Dispute updated successfully!");
    } catch (error) {
      console.error("Error submitting reply:", error);

      // More specific error messages based on error type
      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("Network")
        ) {
          toast.error(
            "Network error. Please check your connection and try again.",
          );
        } else if (error.message.includes("timeout")) {
          toast.error("Request timeout. Please try again.");
        } else {
          toast.error(error.message || "Failed to submit. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-cyan-400/30 p-6`}
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <h3 className="text-xl font-semibold text-cyan-300">
                Edit Dispute as Plaintiff
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Case Info */}
              <div
                className={`rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4`}
              >
                <h4 className="mb-2 font-semibold text-cyan-300">
                  {dispute?.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-cyan-200">
                  {/* Plaintiff */}
                  <div className="flex items-center gap-1">
                    <UserAvatar
                      userId={
                        dispute?.plaintiffData?.userId ||
                        cleanTelegramUsername(dispute?.plaintiff || "")
                      }
                      avatarId={dispute?.plaintiffData?.avatarId || null}
                      username={cleanTelegramUsername(dispute?.plaintiff || "")}
                      size="sm"
                    />
                    <button
                      onClick={() => {
                        const cleanUsername = cleanTelegramUsername(
                          dispute?.plaintiff || "",
                        );
                        const encodedUsername =
                          encodeURIComponent(cleanUsername);
                        navigate(`/profile/${encodedUsername}`);
                      }}
                      className="font-medium hover:text-cyan-100 hover:underline"
                    >
                      {formatTelegramUsernameForDisplay(
                        dispute?.plaintiff || "",
                      )}
                    </button>
                  </div>

                  <span>vs</span>

                  {/* Defendant */}
                  <div className="flex items-center gap-1">
                    <UserAvatar
                      userId={
                        dispute?.defendantData?.userId ||
                        cleanTelegramUsername(dispute?.defendant || "")
                      }
                      avatarId={dispute?.defendantData?.avatarId || null}
                      username={cleanTelegramUsername(dispute?.defendant || "")}
                      size="sm"
                    />
                    <button
                      onClick={() => {
                        const cleanUsername = cleanTelegramUsername(
                          dispute?.defendant || "",
                        );
                        const encodedUsername =
                          encodeURIComponent(cleanUsername);
                        navigate(`/profile/${encodedUsername}`);
                      }}
                      className="font-medium hover:text-cyan-100 hover:underline"
                    >
                      {formatTelegramUsernameForDisplay(
                        dispute?.defendant || "",
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Case Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="Update case title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Case Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="Update the case description..."
                  rows={4}
                />
              </div>

              {/* Claim Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Formal Claim
                </label>
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="Update the formal claim..."
                  rows={3}
                />
              </div>

              {/* Request Kind */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Dispute Type
                </label>
                <select
                  value={requestKind}
                  onChange={(e) => setRequestKind(Number(e.target.value))}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                >
                  <option value={1}>Pro Bono</option>
                  <option value={2}>Paid</option>
                </select>

                <p className="mt-1 text-xs text-cyan-200/70">
                  {requestKind === 1
                    ? "Free dispute resolution"
                    : "Paid dispute - requires wallet connection"}
                </p>
              </div>

              {/* Witnesses Section */}
              <div ref={witnessSearchRef}>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Witnesses (Will replace existing witnesses)
                  <span className="ml-2 text-xs text-cyan-400">
                    (Start typing to search users)
                  </span>
                </label>

                {/* Witness Input with Search */}
                <div className="relative mb-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                    <input
                      type="text"
                      value={witnessSearchQuery}
                      onChange={(e) => setWitnessSearchQuery(e.target.value)}
                      placeholder="Type username (min 2 characters)..."
                      className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                    />
                    {isWitnessSearchLoading && (
                      <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                    )}
                  </div>

                  {/* Witness Suggestions Dropdown */}
                  {showWitnessSuggestions && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                      {witnessSearchResults.length > 0 ? (
                        witnessSearchResults.map((user) => (
                          <UserSearchResult
                            key={user.id}
                            user={user}
                            onSelect={handleWitnessSelect}
                            field="witness"
                          />
                        ))
                      ) : witnessSearchQuery.length >= 2 &&
                        !isWitnessSearchLoading ? (
                        <div className="px-4 py-3 text-center text-sm text-cyan-300">
                          No users found for "{witnessSearchQuery}"
                          <div className="mt-1 text-xs text-cyan-400">
                            Make sure the user exists and has a Telegram
                            username
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

                <p className="mt-1 text-xs text-cyan-200/70">
                  Add @handles of witnesses who can support your claim
                </p>

                {/* Witness Tags */}
                {witnesses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {witnesses.map((witness, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300`}
                        >
                          <UserCheck className="h-3 w-3" />
                          {witness}
                          <button
                            type="button"
                            onClick={() => removeWitness(witness)}
                            className="ml-1 rounded-full hover:bg-cyan-500/30"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-cyan-200/70">
                      {witnesses.length} witness(es) added
                    </p>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="mb-3 block text-sm font-medium text-cyan-200">
                  Supporting Evidence (Additional files)
                </label>

                {/* File Input */}
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="plaintiff-file-upload"
                  />
                  <label
                    htmlFor="plaintiff-file-upload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-cyan-400/30 bg-cyan-500/5 px-4 py-6 text-sm transition-colors hover:bg-cyan-500/10"
                  >
                    <Upload className="h-5 w-5 text-cyan-400" />
                    <span className="text-cyan-300">Click to upload files</span>
                    <span className="text-cyan-200/70">
                      (Images, PDFs, Documents)
                    </span>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-cyan-200">
                      Selected Files ({files.length})
                    </h4>
                    {files.map((file) => (
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
                            <FileText className="h-5 w-5 text-cyan-400" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {file.file.name}
                            </div>
                            <div className="text-xs text-cyan-200/70">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
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

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-cyan-200/70">
                  {files.length} file(s) selected
                  {witnesses.length > 0 && ` • ${witnesses.length} witness(es)`}
                </div>

                <Button
                  variant="neon"
                  className="neon-hover"
                  disabled={
                    isSubmitting ||
                    (title.trim() === dispute?.title &&
                      description.trim() === dispute?.description &&
                      claim.trim() === dispute?.claim &&
                      JSON.stringify(witnesses) ===
                        JSON.stringify(dispute?.witnesses || []) &&
                      requestKind ===
                        (dispute?.request === "Pro Bono" ? 1 : 2) &&
                      files.length === 0)
                  }
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Update Dispute
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Defendant Reply Modal Component
const DefendantReplyModal = ({
  isOpen,
  onClose,
  dispute,
  onSubmit,
  navigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeRow | null;
  onSubmit: (
    description: string,
    files: UploadedFile[],
    witnesses: string[],
  ) => void;
  navigate: (path: string) => void;
}) => {
  const { user: currentUser } = useAuth();
  const [description, setDescription] = useState(
    dispute?.defendantResponse?.description || "",
  );
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [witnesses, setWitnesses] = useState<string[]>(
    dispute?.witnesses?.plaintiff?.map((w) => w.username) || [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Witness search state
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const witnessSearchRef = useRef<HTMLDivElement>(null);
  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  // Witness search function
  const handleWitnessSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setWitnessSearchResults([]);
        setShowWitnessSuggestions(false);
        return;
      }

      setIsWitnessSearchLoading(true);
      setShowWitnessSuggestions(true);

      try {
        const results = await disputeService.searchUsers(query);

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

  // Debounced search effect
  useEffect(() => {
    if (debouncedWitnessQuery.length >= 2) {
      handleWitnessSearch(debouncedWitnessQuery);
    } else {
      setWitnessSearchResults([]);
      setShowWitnessSuggestions(false);
    }
  }, [debouncedWitnessQuery, handleWitnessSearch]);

  // Handle witness selection
  const handleWitnessSelect = (username: string) => {
    if (!witnesses.includes(username)) {
      setWitnesses((prev) => [...prev, username]);
    }
    setShowWitnessSuggestions(false);
    setWitnessSearchQuery("");
  };

  // Click outside handler for witness search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        witnessSearchRef.current &&
        !witnessSearchRef.current.contains(event.target as Node)
      ) {
        setShowWitnessSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset form when dispute changes
  useEffect(() => {
    if (dispute) {
      if (dispute.defendantResponse) {
        // Pre-populate defendant response data when editing
        setDescription(dispute.defendantResponse.description || "");
        // Note: Defendant witnesses would need to be fetched from the API
        // For now, we'll start with empty witnesses array
        setWitnesses([]);
      } else {
        // New response - reset everything
        setDescription("");
        setWitnesses([]);
        setFiles([]);
      }
    }
  }, [dispute]);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    console.log("new files:", newFiles);

    Array.from(selectedFiles).forEach((file) => {
      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
      };

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setFiles((prev) => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setFiles((prev) => [...prev, newFile]);
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const removeWitness = (witnessToRemove: string) => {
    setWitnesses((prev) =>
      prev.filter((witness) => witness !== witnessToRemove),
    );
  };

  const handleSubmit = async () => {
    // Validation for Defendant
    // For new defendant response
    if (!dispute?.defendantResponse) {
      if (!description.trim()) {
        toast.error("Defense description is required");
        return;
      }

      // Validate minimum length for new response
      if (description.trim().length < 10) {
        toast.error(
          "Please provide a more detailed defense description (minimum 10 characters)",
        );
        return;
      }
    }
    // For editing existing defendant response
    else {
      // Check if at least one field is being updated
      const hasTextChanges =
        description.trim() !== dispute.defendantResponse.description;

      const hasWitnessChanges = witnesses.length > 0; // For now, any witnesses count as change
      const hasFileChanges = files.length > 0;

      if (!hasTextChanges && !hasWitnessChanges && !hasFileChanges) {
        toast.error("Please provide at least one field to update");
        return;
      }

      // Validate description only if it's being changed AND it's not empty
      if (hasTextChanges) {
        if (!description.trim()) {
          toast.error("Defense description cannot be empty");
          return;
        }

        if (description.trim().length < 10) {
          toast.error(
            "Please provide a more detailed defense description (minimum 10 characters)",
          );
          return;
        }
      }
    }

    // Validate witness format for defendant
    const invalidWitnesses = witnesses.filter(
      (witness) => !witness.trim() || !isValidTelegramUsername(witness),
    );

    if (invalidWitnesses.length > 0) {
      toast.error("All witnesses must have valid Telegram usernames");
      return;
    }

    // Validate file count for defendant
    if (files.length > 10) {
      toast.error("Maximum 10 files allowed for evidence");
      return;
    }

    // Validate file sizes and types
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    for (const file of files) {
      // Check file size
      if (file.file.size > maxFileSize) {
        toast.error(`File ${file.file.name} exceeds 10MB size limit`);
        return;
      }

      // Check file type
      const fileType = file.file.type;
      if (
        !allowedImageTypes.includes(fileType) &&
        !allowedDocumentTypes.includes(fileType)
      ) {
        toast.error(
          `File ${file.file.name} has unsupported type. Allowed: images, PDFs, Word docs, text files`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(description, files, witnesses);

      // Reset form on successful submission
      setDescription("");
      setFiles([]);
      setWitnesses([]);

      onClose();

      if (dispute?.defendantResponse) {
        toast.success("Defense response updated successfully!");
      } else {
        toast.success("Defense response submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting reply:", error);

      // More specific error messages based on error type
      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("Network")
        ) {
          toast.error(
            "Network error. Please check your connection and try again.",
          );
        } else if (error.message.includes("timeout")) {
          toast.error("Request timeout. Please try again.");
        } else {
          toast.error(error.message || "Failed to submit. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = dispute?.defendantResponse !== undefined;

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-yellow-400/30 p-6`}
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <h3 className="text-xl font-semibold text-yellow-300">
                {isEditing ? "Edit Defense Response" : "Respond as Defendant"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Case Info */}
              <div
                className={`rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4`}
              >
                <h4 className="mb-2 font-semibold text-yellow-300">
                  {dispute?.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-yellow-200">
                  {/* Plaintiff */}
                  <div className="flex items-center gap-1">
                    <UserAvatar
                      userId={
                        dispute?.plaintiffData?.userId ||
                        cleanTelegramUsername(dispute?.plaintiff || "")
                      }
                      avatarId={dispute?.plaintiffData?.avatarId || null}
                      username={cleanTelegramUsername(dispute?.plaintiff || "")}
                      size="sm"
                    />
                    <button
                      onClick={() => {
                        const cleanUsername = cleanTelegramUsername(
                          dispute?.plaintiff || "",
                        );
                        const encodedUsername =
                          encodeURIComponent(cleanUsername);
                        navigate(`/profile/${encodedUsername}`);
                      }}
                      className="font-medium hover:text-yellow-100 hover:underline"
                    >
                      {formatTelegramUsernameForDisplay(
                        dispute?.plaintiff || "",
                      )}
                    </button>
                  </div>

                  <span>vs</span>

                  {/* Defendant */}
                  <div className="flex items-center gap-1">
                    <UserAvatar
                      userId={
                        dispute?.defendantData?.userId ||
                        cleanTelegramUsername(dispute?.defendant || "")
                      }
                      avatarId={dispute?.defendantData?.avatarId || null}
                      username={cleanTelegramUsername(dispute?.defendant || "")}
                      size="sm"
                    />
                    <button
                      onClick={() => {
                        const cleanUsername = cleanTelegramUsername(
                          dispute?.defendant || "",
                        );
                        const encodedUsername =
                          encodeURIComponent(cleanUsername);
                        navigate(`/profile/${encodedUsername}`);
                      }}
                      className="font-medium hover:text-yellow-100 hover:underline"
                    >
                      {formatTelegramUsernameForDisplay(
                        dispute?.defendant || "",
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-yellow-200">
                  Your Response
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-yellow-400/40"
                  placeholder={
                    isEditing
                      ? "Update your defense and response to the claims..."
                      : "Provide your detailed defense against the plaintiff's claims..."
                  }
                  rows={4}
                />
              </div>

              {/* Witnesses Section */}
              <div ref={witnessSearchRef}>
                <label className="mb-2 block text-sm font-medium text-yellow-200">
                  Witnesses (Optional)
                  <span className="ml-2 text-xs text-yellow-400">
                    (Start typing to search users)
                  </span>
                </label>

                {/* Witness Input with Search */}
                <div className="relative mb-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-yellow-300" />
                    <input
                      type="text"
                      value={witnessSearchQuery}
                      onChange={(e) => setWitnessSearchQuery(e.target.value)}
                      placeholder="Type username (min 2 characters)..."
                      className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-yellow-400/40"
                    />
                    {isWitnessSearchLoading && (
                      <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-yellow-300" />
                    )}
                  </div>

                  {/* Witness Suggestions Dropdown */}
                  {showWitnessSuggestions && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-yellow-900/95 shadow-lg backdrop-blur-md">
                      {witnessSearchResults.length > 0 ? (
                        witnessSearchResults.map((user) => (
                          <UserSearchResult
                            key={user.id}
                            user={user}
                            onSelect={handleWitnessSelect}
                            field="witness"
                          />
                        ))
                      ) : witnessSearchQuery.length >= 2 &&
                        !isWitnessSearchLoading ? (
                        <div className="px-4 py-3 text-center text-sm text-yellow-300">
                          No users found for "{witnessSearchQuery}"
                          <div className="mt-1 text-xs text-yellow-400">
                            Make sure the user exists and has a Telegram
                            username
                          </div>
                        </div>
                      ) : null}

                      {witnessSearchQuery.length < 2 && (
                        <div className="px-4 py-3 text-center text-sm text-yellow-300">
                          Type at least 2 characters to search
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="mt-1 text-xs text-yellow-200/70">
                  Add @handles of witnesses who can support your defense
                </p>

                {/* Witness Tags */}
                {witnesses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {witnesses.map((witness, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300`}
                        >
                          <UserCheck className="h-3 w-3" />
                          {witness}
                          <button
                            type="button"
                            onClick={() => removeWitness(witness)}
                            className="ml-1 rounded-full hover:bg-yellow-500/30"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-200/70">
                      {witnesses.length} witness(es) added
                    </p>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="mb-3 block text-sm font-medium text-yellow-200">
                  Supporting Evidence
                </label>

                {/* File Input */}
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="defendant-file-upload"
                  />
                  <label
                    htmlFor="defendant-file-upload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-yellow-400/30 bg-yellow-500/5 px-4 py-6 text-sm transition-colors hover:bg-yellow-500/10"
                  >
                    <Upload className="h-5 w-5 text-yellow-400" />
                    <span className="text-yellow-300">
                      Click to upload files
                    </span>
                    <span className="text-yellow-200/70">
                      (Images, PDFs, Documents)
                    </span>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-yellow-200">
                      Selected Files ({files.length})
                    </h4>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-lg border border-yellow-400/20 bg-yellow-500/5 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {file.type === "image" && file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-yellow-400" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {file.file.name}
                            </div>
                            <div className="text-xs text-yellow-200/70">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
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

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-yellow-200/70">
                  {files.length} file(s) selected
                  {witnesses.length > 0 && ` • ${witnesses.length} witness(es)`}
                </div>

                <Button
                  variant="neon"
                  className="neon-hover"
                  disabled={
                    isSubmitting ||
                    (dispute?.defendantResponse &&
                      description.trim() ===
                        dispute.defendantResponse.description &&
                      witnesses.length === 0 &&
                      files.length === 0)
                  }
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {isEditing ? "Update Response" : "Submit Response"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Vote Option Component
const VoteOption = ({
  label,
  active,
  onClick,
  icon,
}: {
  label: React.ReactNode; // Change from string to ReactNode
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-4 text-center text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform hover:bg-cyan-500/20 active:scale-[0.98] ${
        active
          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
          : "border-white/10 bg-white/5 hover:border-cyan-400/30"
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

// Vote Modal Component

// Vote Outcome Modal Component
const VoteOutcomeModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    winner,
    judgeVotes,
    communityVotes,
    judgePct,
    communityPct,
    comments,
  } = mockVoteOutcome;

  // Weighted Voting Logic (DexCourt 70/30 model)
  const totalVotes = judgeVotes + communityVotes;
  const judgeWeight = 0.7;
  const communityWeight = 0.3;
  const weightedPlaintiffPct =
    judgePct * judgeWeight + communityPct * communityWeight;
  const weightedDefendantPct = 100 - weightedPlaintiffPct;
  const plaintiffVotes = Math.round((totalVotes * weightedPlaintiffPct) / 100);
  const defendantVotes = totalVotes - plaintiffVotes;
  const winPct = Math.round(
    Math.max(weightedPlaintiffPct, weightedDefendantPct),
  );

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-400/30 bg-emerald-500/10 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-300" />
              <h3 className="text-xl font-semibold text-emerald-300">
                Vote Outcome - Case Settled
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-6 text-center">
                <div className="mb-2 text-lg text-emerald-200">
                  Final Verdict
                </div>
                <div
                  className={`mb-2 text-2xl font-bold ${
                    winner === "plaintiff"
                      ? "text-cyan-300"
                      : winner === "defendant"
                        ? "text-pink-300"
                        : "text-yellow-300"
                  }`}
                >
                  {winner === "plaintiff"
                    ? "Plaintiff Wins"
                    : winner === "defendant"
                      ? "Defendant Wins"
                      : "Case Dismissed"}
                </div>
                <div className="text-emerald-200">
                  {winPct}% weighted majority
                </div>
              </div>

              {/* Voting Breakdown */}
              <div className="space-y-4">
                <div className="text-lg font-medium text-white/90">
                  Voting Breakdown
                </div>

                {/* Judges Section */}
                <div className="mb-4">
                  <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                    <span>Judges — {judgeVotes} votes</span>
                    <span>{judgePct}% favor Plaintiff</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-800"
                      initial={{ width: 0 }}
                      animate={{ width: `${judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff: {Math.round((judgePct / 100) * judgeVotes)}{" "}
                      votes
                    </span>
                    <span className="text-pink-300">
                      Defendant:{" "}
                      {Math.round(((100 - judgePct) / 100) * judgeVotes)} votes
                    </span>
                  </div>
                </div>

                {/* Community Section */}
                <div className="mb-4">
                  <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                    <span>Community — {communityVotes} votes</span>
                    <span>{communityPct}% favor Plaintiff</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${communityPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-300/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - communityPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff:{" "}
                      {Math.round((communityPct / 100) * communityVotes)} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant:{" "}
                      {Math.round(
                        ((100 - communityPct) / 100) * communityVotes,
                      )}{" "}
                      votes
                    </span>
                  </div>
                </div>

                {/* Weighted Overall Section */}
                <div>
                  <div className="text-muted-foreground mb-2 flex justify-between text-sm">
                    <span>Weighted Total (70% Judges, 30% Community)</span>
                    <span>
                      {weightedPlaintiffPct.toFixed(1)}% favor Plaintiff
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${weightedPlaintiffPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.5,
                      }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-400/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${weightedDefendantPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.5,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff: {plaintiffVotes} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant: {defendantVotes} votes
                    </span>
                  </div>
                </div>
              </div>

              {/* Judges' Comments */}
              {comments.length > 0 && (
                <div>
                  <div className="mb-4 text-lg font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <div className="text-sm font-medium text-cyan-300">
                          {comment.handle}
                        </div>
                        <div className="mt-2 text-white/80">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Evidence Viewer Component
const EvidenceViewer = ({
  isOpen,
  onClose,
  selectedEvidence,
  onPdfLoad,
  onPdfError,
  pdfLoading,
  pdfError,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedEvidence: EvidenceItem | null;
  onPdfLoad: () => void;
  onPdfError: () => void;
  pdfLoading: boolean;
  pdfError: boolean;
}) => {
  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "transaction":
        return <ExternalLink className="h-4 w-4" />;
      case "chat":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const renderEvidenceContent = () => {
    if (!selectedEvidence) return null;

    switch (selectedEvidence.type) {
      case "image":
      case "chat":
        return (
          <div className="flex h-full items-center justify-center p-4">
            <img
              src={selectedEvidence.preview}
              alt={selectedEvidence.name}
              className="max-h-full max-w-full rounded-lg border border-white/10 object-contain"
            />
          </div>
        );
      case "transaction":
        return (
          <div className="flex h-full flex-col items-center justify-center space-y-6 py-6">
            <ExternalLink className="h-16 w-16 text-cyan-400" />
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-white">
                Blockchain Transaction
              </h3>
              <p className="mb-4 text-cyan-200">{selectedEvidence.name}</p>
              <img
                src={selectedEvidence.preview}
                alt="Transaction preview"
                className="mb-4 max-h-48 rounded-lg border border-white/10"
              />
              <Button
                onClick={() => window.open(selectedEvidence.url, "_blank")}
                variant="neon"
                className="neon-hover"
              >
                View on Etherscan
              </Button>
            </div>
          </div>
        );
      case "pdf":
        return (
          <div className="flex h-full flex-col items-center justify-center space-y-6 py-6">
            <div className="h-[80vh] w-full">
              {pdfLoading && (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <p className="text-white/70">Loading PDF document...</p>
                </div>
              )}

              {pdfError && (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                  <FileText className="h-16 w-16 text-red-400" />
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      PDF Not Available
                    </h3>
                    <p className="text-red-200">
                      The PDF document could not be loaded.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(selectedEvidence.url, "_blank")}
                    variant="neon"
                    className="neon-hover"
                  >
                    Try Opening in New Tab
                  </Button>
                </div>
              )}

              {!pdfLoading && !pdfError && (
                <object
                  data={selectedEvidence.url}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="rounded-xl border border-white/10"
                  onLoad={onPdfLoad}
                  onError={onPdfError}
                >
                  <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                    <FileText className="h-16 w-16 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">
                      PDF Not Available
                    </h3>
                    <p className="text-yellow-200">
                      The document isn't available at the moment.
                    </p>
                    <Button
                      onClick={() =>
                        window.open(selectedEvidence.url, "_blank")
                      }
                      variant="neon"
                      className="neon-hover"
                    >
                      Try Opening in New Tab
                    </Button>
                  </div>
                </object>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex h-full flex-col items-center justify-center space-y-6 py-6">
            <File className="h-16 w-16 text-cyan-400" />
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-white">
                Evidence File
              </h3>
              <p className="text-cyan-200">{selectedEvidence.name}</p>
            </div>
          </div>
        );
    }
  };

  if (!isOpen || !selectedEvidence) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="card-cyan relative h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gray-800/50 p-6">
            <div className="flex items-center gap-3">
              {getEvidenceIcon(selectedEvidence.type)}
              <h3 className="text-lg font-semibold text-white">
                {selectedEvidence.name}
              </h3>
              {pdfLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-80px)] overflow-auto p-6">
            {renderEvidenceContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Create this component outside of EvidenceDisplay
const PDFPreview = ({
  item,
  color,
}: {
  item: EvidenceItem;
  color: string;
  index: number;
  onViewEvidence: (evidence: EvidenceItem) => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load PDF as blob for preview - FIXED with proper cleanup
  useEffect(() => {
    let isMounted = true;

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    const loadPdfForPreview = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Clean up previous blob URL
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          setBlobUrl(null);
        }

        // Fetch the PDF with abort signal
        const response = await fetch(item.url, {
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (isMounted) {
          setBlobUrl(url);
          setIsLoading(false);
        }
      } catch (error: any) {
        // Don't set error if it was an abort
        if (error.name === "AbortError") return;

        console.error("Error loading PDF for preview:", error);
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
        }
      }
    };

    loadPdfForPreview();

    // Cleanup on unmount
    return () => {
      isMounted = false;

      // Abort ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cleanup blob URL
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.url]); // Only depend on item.url

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`relative rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className={`text-${color}-400`}>{getEvidenceIcon(item.type)}</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{item.name}</div>
          <div className="text-xs text-gray-400 capitalize">PDF Document</div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open(item.url, "_blank");
          }}
          className={`h-8 w-8 p-0 text-${color}-400 hover:text-${color}-300`}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Improved PDF Preview */}
      <div className="relative h-64 w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm text-white/70">Loading PDF preview...</p>
          </div>
        )}

        {hasError && (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <FileText className="mb-3 h-12 w-12 text-red-400" />
            <p className="mb-1 font-semibold text-red-300">
              PDF Preview Unavailable
            </p>
            <p className="mb-3 text-sm text-red-200">
              The document could not be loaded for preview.
            </p>
            <Button
              onClick={() => window.open(item.url, "_blank")}
              variant="outline"
              size="sm"
              className="border-red-400/30 text-red-300 hover:bg-red-500/10"
            >
              Open PDF Directly
            </Button>
          </div>
        )}

        {!isLoading && !hasError && blobUrl && (
          <object
            data={blobUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            className="rounded-lg"
          >
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <FileText className="mb-2 h-10 w-10 text-yellow-400" />
              <p className="mb-2 text-sm text-yellow-300">
                PDF preview not supported in this browser.
              </p>
              <Button
                onClick={() => window.open(item.url, "_blank")}
                variant="outline"
                size="sm"
                className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
              >
                Download PDF
              </Button>
            </div>
          </object>
        )}
      </div>
    </div>
  );
};

// Evidence Display Component
// Evidence Display Component
// Evidence Display Component
const EvidenceDisplay = ({
  evidence,
  color,
  onViewEvidence,
}: {
  evidence: EvidenceItem[];
  color: string;
  onViewEvidence: (evidence: EvidenceItem) => void;
}) => {
  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "transaction":
        return <ExternalLink className="h-4 w-4" />;
      case "chat":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Regular evidence item component (non-PDF)
  const RegularEvidenceItem = ({ item }: { item: EvidenceItem }) => (
    <div
      className={`relative flex items-center gap-2 rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4 transition-colors hover:bg-${color}-500/10 cursor-pointer`}
      onClick={() => onViewEvidence(item)}
    >
      <div className={`text-${color}-400`}>{getEvidenceIcon(item.type)}</div>
      <div className="">
        <div className="text-sm font-medium break-all text-white">
          {item.name}
        </div>
        <div className="text-xs text-gray-400 capitalize">
          {item.type === "transaction"
            ? "View on Etherscan"
            : "Click to preview"}
        </div>
      </div>
      <div className="absolute top-2 right-2">
        {item.type === "transaction" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.url, "_blank");
            }}
            className={`h-8 w-8 p-0 text-${color}-400 hover:text-${color}-300`}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {evidence.map((item, index) => {
        if (item.type === "pdf") {
          return (
            <PDFPreview
              key={index}
              item={item}
              color={color}
              index={index}
              onViewEvidence={onViewEvidence}
            />
          );
        } else {
          return <RegularEvidenceItem key={index} item={item} />;
        }
      })}
    </div>
  );
};

// Main Component
export default function DisputeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    null,
  );
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  // Voting state
  const [voteData, setVoteData] = useState<VoteData>({
    choice: null,
    comment: "",
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [voteOutcomeModalOpen, setVoteOutcomeModalOpen] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  // Reply modals state
  const [defendantReplyModalOpen, setDefendantReplyModalOpen] = useState(false);
  const [plaintiffReplyModalOpen, setPlaintiffReplyModalOpen] = useState(false);

  const [votingEligibility, setVotingEligibility] = useState<{
    canVote: boolean;
    reason?: string;
  }>({ canVote: false });

  // Replace your current isCurrentUserPlaintiff function with this:
  const isCurrentUserPlaintiff = useCallback(() => {
    if (!user || !dispute) {
      return false;
    }

    const currentUsername = user.username || user.telegramUsername;
    const plaintiffUsername = cleanTelegramUsername(dispute.plaintiff);

    const isPlaintiff =
      normalizeUsername(currentUsername) ===
      normalizeUsername(plaintiffUsername);

    return isPlaintiff;
  }, [user, dispute]);

  // Replace your current isCurrentUserDefendant function with this:
  const isCurrentUserDefendant = useCallback(() => {
    if (!user || !dispute) {
      return false;
    }

    const currentUsername = user.username || user.telegramUsername;
    const defendantUsername = cleanTelegramUsername(dispute.defendant);

    const isDefendant =
      normalizeUsername(currentUsername) ===
      normalizeUsername(defendantUsername);

    return isDefendant;
  }, [user, dispute]);

  // Add normalization helper function
  // Update the normalizeUsername function to handle undefined values
  const normalizeUsername = (username: string | undefined): string => {
    if (!username) return "";
    return username.replace(/^@/, "").toLowerCase().trim();
  };

  // Replace the existing canUserVote function with this:
  // Replace the existing canUserVote function with this improved version:
  const canUserVote = useCallback(async (): Promise<{
    canVote: boolean;
    reason?: string;
  }> => {
    if (!user || !dispute) {
      return { canVote: false, reason: "User or dispute not found" };
    }

    // Quick client-side check first - this is the key fix
    if (isCurrentUserPlaintiff()) {
      return {
        canVote: false,
        reason: "Plaintiffs cannot vote in their own disputes",
      };
    }

    if (isCurrentUserDefendant()) {
      return {
        canVote: false,
        reason: "Defendants cannot vote in their own disputes",
      };
    }

    // Only call the API if user is not plaintiff or defendant
    const disputeId = parseInt(dispute.id);
    if (isNaN(disputeId)) {
      return { canVote: false, reason: "Invalid dispute ID" };
    }

    try {
      return await disputeService.canUserVote(
        disputeId,
        user.id || "current-user",
      );
    } catch (error) {
      console.error("Error checking voting eligibility:", error);
      return { canVote: false, reason: "Error checking eligibility" };
    }
  }, [user, dispute, isCurrentUserPlaintiff, isCurrentUserDefendant]);
  // === ADD THIS useEffect HERE ===
  // Check voting eligibility when dispute loads or user changes
  useEffect(() => {
    const checkEligibility = async () => {
      console.log("🔍 Checking voting eligibility...");
      console.log("Dispute:", dispute?.status);
      console.log("User:", user?.username);

      if (dispute && user && dispute.status === "Vote in Progress") {
        console.log("🔄 Fetching voting eligibility...");
        const eligibility = await canUserVote();
        console.log("✅ Voting eligibility result:", eligibility);
        setVotingEligibility(eligibility);
      } else {
        console.log("❌ Conditions not met for voting check");
        // Reset if not in voting status
        setVotingEligibility({ canVote: false });
      }
    };

    checkEligibility();
  }, [dispute, user, canUserVote]);

  const VoteModal = ({
    isOpen,
    onClose,
    voteData,
    onVoteChange,
    onCastVote,
    hasVoted,
  }: {
    isOpen: boolean;
    onClose: () => void;
    voteData: VoteData;
    onVoteChange: (
      choice: "plaintiff" | "defendant" | "dismissed" | null,
      comment: string,
    ) => void;
    onCastVote: () => void;
    hasVoted: boolean;
  }) => {
    const isJudge = true; // Mock - in real app, check user role
    const canVote = canUserVote(); // Check if user can vote

    const handleModalClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    const handleVoteChoice = useCallback(
      (choice: "plaintiff" | "defendant" | "dismissed") => {
        onVoteChange(choice, voteData.comment);
      },
      [onVoteChange, voteData.comment],
    );

    const handleCommentChange = useCallback(
      (comment: string) => {
        if (comment.length <= 1200) {
          onVoteChange(voteData.choice, comment);
        }
      },
      [onVoteChange, voteData.choice],
    );

    if (!isOpen) return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
            onClick={handleModalClick}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-cyan-300" />
                <h3 className="text-xl font-semibold text-cyan-300">
                  Cast Your Vote
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
              {!canVote ? (
                <div className="py-8 text-center">
                  <div className="mb-4 text-2xl">🚫</div>
                  <div className="mb-2 text-lg font-semibold text-red-400">
                    Cannot Vote
                  </div>
                  <div className="text-sm text-cyan-200">
                    {isCurrentUserPlaintiff() || isCurrentUserDefendant()
                      ? "Plaintiffs and defendants cannot vote in their own disputes."
                      : "You do not have voting privileges for this dispute."}
                  </div>
                </div>
              ) : hasVoted ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-lg font-semibold text-emerald-400">
                    ✓ Vote Submitted
                  </div>
                  <div className="text-sm text-cyan-200">
                    Thank you for participating. Your vote will be revealed when
                    the voting period ends.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rest of your existing vote modal content */}
                  {/* Case Info */}
                  <div
                    className={`rounded-lg border border-red-400/20 bg-red-500/10 p-4`}
                  >
                    <h4 className="mb-2 font-semibold text-cyan-300">
                      {dispute?.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-cyan-200">
                      {/* Plaintiff */}
                      <div className="flex items-center gap-1">
                        <UserAvatar
                          userId={
                            dispute?.plaintiffData?.userId ||
                            cleanTelegramUsername(dispute?.plaintiff || "")
                          }
                          avatarId={dispute?.plaintiffData?.avatarId || null}
                          username={cleanTelegramUsername(
                            dispute?.plaintiff || "",
                          )}
                          size="sm"
                        />
                        <span className="font-medium">
                          {formatTelegramUsernameForDisplay(
                            dispute?.plaintiff || "",
                          )}
                        </span>
                      </div>

                      <span>vs</span>

                      {/* Defendant */}
                      <div className="flex items-center gap-1">
                        <UserAvatar
                          userId={
                            dispute?.defendantData?.userId ||
                            cleanTelegramUsername(dispute?.defendant || "")
                          }
                          avatarId={dispute?.defendantData?.avatarId || null}
                          username={cleanTelegramUsername(
                            dispute?.defendant || "",
                          )}
                          size="sm"
                        />
                        <span className="font-medium">
                          {formatTelegramUsernameForDisplay(
                            dispute?.defendant || "",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voting Options */}
                  <div>
                    <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200">
                      Who is your vote for?
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <VoteOption
                        label={
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              userId={
                                dispute?.plaintiffData?.userId ||
                                cleanTelegramUsername(dispute?.plaintiff || "")
                              }
                              avatarId={
                                dispute?.plaintiffData?.avatarId || null
                              }
                              username={cleanTelegramUsername(
                                dispute?.plaintiff || "",
                              )}
                              size="sm"
                            />
                            <div className="text-left">
                              <div>Plaintiff</div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanUsername = cleanTelegramUsername(
                                      dispute?.plaintiff || "",
                                    );
                                    const encodedUsername =
                                      encodeURIComponent(cleanUsername);
                                    navigate(`/profile/${encodedUsername}`);
                                  }}
                                  className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                                >
                                  {formatTelegramUsernameForDisplay(
                                    dispute?.plaintiff || "",
                                  )}
                                </button>
                                {isCurrentUserPlaintiff() && (
                                  <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        }
                        active={voteData.choice === "plaintiff"}
                        onClick={() => handleVoteChoice("plaintiff")}
                        icon={<ThumbsUp className="h-4 w-4" />}
                      />
                      <VoteOption
                        label={
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              userId={
                                dispute?.defendantData?.userId ||
                                cleanTelegramUsername(dispute?.defendant || "")
                              }
                              avatarId={
                                dispute?.defendantData?.avatarId || null
                              }
                              username={cleanTelegramUsername(
                                dispute?.defendant || "",
                              )}
                              size="sm"
                            />
                            <div className="text-left">
                              <div>Defendant</div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanUsername = cleanTelegramUsername(
                                      dispute?.defendant || "",
                                    );
                                    const encodedUsername =
                                      encodeURIComponent(cleanUsername);
                                    navigate(`/profile/${encodedUsername}`);
                                  }}
                                  className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                                >
                                  {formatTelegramUsernameForDisplay(
                                    dispute?.defendant || "",
                                  )}
                                </button>
                                {isCurrentUserDefendant() && (
                                  <VscVerifiedFilled className="h-3 w-3 text-green-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        }
                        active={voteData.choice === "defendant"}
                        onClick={() => handleVoteChoice("defendant")}
                        icon={<ThumbsDown className="h-4 w-4" />}
                      />
                      <VoteOption
                        label="Dismiss Case"
                        active={voteData.choice === "dismissed"}
                        onClick={() => handleVoteChoice("dismissed")}
                        icon={<Minus className="h-4 w-4" />}
                      />
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Comment{" "}
                        {isJudge && <span className="text-xs">(max 1200)</span>}
                      </span>
                      {!isJudge && (
                        <span className="text-muted-foreground text-xs">
                          Only judges can comment
                        </span>
                      )}
                    </div>
                    <textarea
                      disabled={!isJudge}
                      value={voteData.comment}
                      onChange={(e) => handleCommentChange(e.target.value)}
                      className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40 disabled:opacity-60"
                      placeholder={
                        isJudge
                          ? "Add your reasoning..."
                          : "Comments restricted to judges"
                      }
                    />
                    {isJudge && (
                      <div className="text-muted-foreground mt-1 text-right text-xs">
                        {1200 - voteData.comment.length} characters left
                      </div>
                    )}
                  </div>

                  {/* Vote Button + Info */}
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="neon"
                      className="neon-hover"
                      disabled={!voteData.choice}
                      onClick={onCastVote}
                    >
                      Cast Vote
                    </Button>
                    <div className="group relative cursor-pointer">
                      <Info className="h-4 w-4 text-cyan-300/70 transition group-hover:text-cyan-300" />
                      <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                        Your vote remains private until the voting period ends.
                        During this time, only your participation status is
                        visible — not your decision.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Fetch dispute details
  // Fetch dispute details
  // Fetch dispute details - UPDATED WITH BETTER ERROR HANDLING
  useEffect(() => {
    if (!id) {
      console.error("No dispute ID provided");
      setLoading(false);
      return;
    }

    const disputeId = parseInt(id);
    if (isNaN(disputeId)) {
      console.error("Invalid dispute ID:", id);
      toast.error("Invalid dispute ID");
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchDisputeDetails = async () => {
      try {
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        console.log("✅ Received dispute details:", disputeDetails);

        const transformedDispute =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        console.log("✅ Transformed dispute:", transformedDispute);

        setDispute(transformedDispute);
      } catch (error: any) {
        console.error("❌ Failed to fetch dispute details:", error);
        toast.error("Failed to load dispute details", {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDisputeDetails();
  }, [id]);

  // In your component, update the processEvidence function
  const processEvidence = (
    evidenceList: EvidenceFile[], // Now properly typed
    disputeId: string,
  ): EvidenceItem[] => {
    return evidenceList.map((evidence) => {
      const name = evidence.fileName;

      // Function to get file URL using file ID
      const getFileUrl = (file: EvidenceFile): string => {
        if (file.id) {
          // Use the numeric file ID
          const API_BASE =
            import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";
          return `${API_BASE}/dispute/${disputeId}/file/${file.id}`;
        }
        // Fallback to filename if no ID (shouldn't happen)
        return `/api/dispute/${disputeId}/file/${encodeURIComponent(name)}`;
      };

      const fileUrl = getFileUrl(evidence);

      // Improved PDF detection
      if (name.includes("etherscan.io")) {
        return {
          name,
          type: "transaction",
          url: evidence.url || name, // Use provided URL or fallback
          preview:
            "https://placehold.co/600x400/1e3a8a/white?text=Blockchain+Tx",
        };
      } else if (/\.(webp|jpg|jpeg|png|gif)$/i.test(name)) {
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

  // Safe data access with fallbacks
  // Safe data access with fallbacks
  const safeEvidence = processEvidence(
    dispute?.evidence || [],
    dispute?.id || id || "",
  );
  const plaintiffWitnesses =
    dispute?.witnesses?.plaintiff?.map((w) => w.username) || [];
  const defendantWitnesses =
    dispute?.witnesses?.defendant?.map((w) => w.username) || [];
  const safeDescription = dispute?.description || "No description provided.";
  const safeClaim = dispute?.claim || "No claim specified.";

  const defendantEvidence = dispute?.defendantResponse
    ? processEvidence(
        dispute.defendantResponse.evidence || [],
        dispute?.id || id || "",
      )
    : [];

  // Function to handle evidence viewing
  const handleViewEvidence = (evidence: EvidenceItem) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
    setPdfLoading(evidence.type === "pdf");
    setPdfError(false);
  };

  // Function to handle PDF load events
  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  const handlePdfError = () => {
    setPdfLoading(false);
    setPdfError(true);
  };

  // Voting handlers
  const handleVoteChange = useCallback(
    (
      choice: "plaintiff" | "defendant" | "dismissed" | null,
      comment: string,
    ) => {
      setVoteData({ choice, comment });
    },
    [],
  );

  const handleCastVote = useCallback(async () => {
    if (!voteData.choice || !id) return;

    const disputeId = parseInt(id);
    if (isNaN(disputeId)) {
      toast.error("Invalid dispute ID");
      return;
    }

    try {
      await disputeService.castVote(disputeId, {
        voteType:
          voteData.choice === "plaintiff"
            ? 1
            : voteData.choice === "defendant"
              ? 2
              : 3,
        comment: voteData.comment,
      });

      setHasVoted(true);
      setVoteModalOpen(false);
      toast.success("Vote submitted successfully!");
    } catch (error: any) {
      toast.error("Failed to submit vote", {
        description: error.message,
      });
    }
  }, [voteData, id]);

  const handleOpenVoteModal = useCallback(() => {
    setVoteModalOpen(true);
    // Reset vote data when opening modal
    setVoteData({ choice: null, comment: "" });
  }, []);

  // Reply handlers with witnesses
  const handleDefendantReply = useCallback(
    async (description: string, files: UploadedFile[], witnesses: string[]) => {
      if (!id) return;

      const disputeId = parseInt(id);
      if (isNaN(disputeId)) {
        toast.error("Invalid dispute ID");
        return;
      }

      try {
        const defendantClaimData: DefendantClaimRequest = {
          defendantClaim: description,
          witnesses: witnesses.filter((w) => w.trim()),
        };

        const fileList = files.map((uf) => uf.file);

        // Determine if this is a new response or an edit
        const isEditing = dispute?.defendantResponse !== undefined;

        if (isEditing) {
          // Use PATCH for editing existing response
          await disputeService.editDefendantClaim(
            disputeId,
            defendantClaimData,
            fileList.length > 0 ? fileList : undefined,
          );
          toast.success("Response updated successfully!");
        } else {
          // Use POST for new response
          await disputeService.submitDefendantClaim(
            disputeId,
            defendantClaimData,
            fileList.length > 0 ? fileList : undefined,
          );
          toast.success("Response submitted successfully!");
        }

        // Refresh dispute details
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        const transformedDispute =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        setDispute(transformedDispute);
      } catch (error: any) {
        toast.error("Failed to submit response", {
          description: error.message,
        });
        throw error;
      }
    },
    [id, dispute],
  );
  const handlePlaintiffReply = useCallback(
    async (
      title: string,
      description: string,
      claim: string,
      requestKind: number,
      files: UploadedFile[],
      witnesses: string[],
    ) => {
      if (!id) return;

      const disputeId = parseInt(id);
      if (isNaN(disputeId)) {
        toast.error("Invalid dispute ID");
        return;
      }

      try {
        const plaintiffClaimData: any = {};

        // Check what fields are actually being included
        if (title.trim() && title !== dispute?.title) {
          plaintiffClaimData.title = title;
        }
        if (description.trim() && description !== dispute?.description) {
          plaintiffClaimData.description = description;
        }
        if (claim.trim() && claim !== dispute?.claim) {
          plaintiffClaimData.claim = claim;
        }
        if (requestKind !== undefined) {
          plaintiffClaimData.requestKind = requestKind;
          console.log("🔍 Including requestKind:", requestKind);
        }

        if (witnesses !== undefined) {
          plaintiffClaimData.witnesses = witnesses.filter((w) => w.trim());
        }

        // Check if at least one field is provided
        if (
          Object.keys(plaintiffClaimData).length === 0 &&
          files.length === 0
        ) {
          throw new Error("Please provide at least one field to update");
        }

        const fileList = files.map((uf) => uf.file);

        await disputeService.editPlaintiffClaim(
          disputeId,
          plaintiffClaimData,
          fileList.length > 0 ? fileList : undefined,
        );

        toast.success("Dispute updated successfully!");

        // Refresh dispute details
        const disputeDetails =
          await disputeService.getDisputeDetails(disputeId);
        const transformedDispute =
          disputeService.transformDisputeDetailsToRow(disputeDetails);
        setDispute(transformedDispute);
      } catch (error: any) {
        console.error("❌ Error details:", error);
        toast.error("Failed to update dispute", {
          description: error.message,
        });
        throw error;
      }
    },
    [id, dispute],
  );

  const handleSettleDispute = useCallback(async () => {
    if (!id) return;

    const disputeId = parseInt(id);
    if (isNaN(disputeId)) {
      toast.error("Invalid dispute ID");
      return;
    }

    try {
      await disputeService.settleDispute(disputeId);
      toast.success("Dispute settled successfully!");
      setSettleModalOpen(false);

      // Refresh dispute details
      const disputeDetails = await disputeService.getDisputeDetails(disputeId);
      const transformedDispute =
        disputeService.transformDisputeDetailsToRow(disputeDetails);
      setDispute(transformedDispute);
    } catch (error: any) {
      toast.error("Failed to settle dispute", {
        description: error.message,
      });
    }
  }, [id]);

  const hasValidDefendantResponse = (defendantResponse: any) => {
    if (!defendantResponse) return false;
    if (!defendantResponse.description) return false;

    const trimmedDesc = defendantResponse.description.trim();
    return trimmedDesc !== "" && trimmedDesc !== "No response description";
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-muted-foreground">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="py-6 text-white">
        <Button
          onClick={() => navigate("/disputes")}
          variant="ghost"
          className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Disputes
        </Button>
        <p className="text-red-400">Dispute not found.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 py-6 text-white"
    >
      <div className="flex items-center justify-between">
        {/* Back Button */}
        <Button
          onClick={() => navigate("/disputes")}
          variant="ghost"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Disputes
        </Button>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Show Vote Outcome for Settled/Dismissed disputes */}
          {(dispute.status === "Settled" || dispute.status === "Dismissed") && (
            <Button
              variant="neon"
              className="neon-hover"
              onClick={() => setVoteOutcomeModalOpen(true)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              See Vote Outcome
            </Button>
          )}

          {/* Show Cast Vote button for Vote in Progress disputes */}
          {/* Show Cast Vote button ONLY for Vote in Progress disputes AND eligible voters */}
          {dispute.status === "Vote in Progress" &&
            votingEligibility.canVote && (
              <Button
                variant="neon"
                className="neon-hover ml-auto"
                onClick={handleOpenVoteModal}
              >
                <Scale className="mr-2 h-4 w-4" />
                Cast Vote
              </Button>
            )}
        </div>
      </div>

      {/* Header Card */}
      {/* Header Card */}
      <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 font-bold text-cyan-400 lg:text-[22px]">
              {dispute.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-cyan-300">
                <Clock className="h-4 w-4" />
                <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <FileText className="h-4 w-4" />
                <span>{dispute.request}</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300">
                <Scale className="h-4 w-4" />
                <span>{dispute.status}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-center gap-2 text-sm text-white/70">
              <Users className="h-4 w-4" />
              <span>Parties</span>
            </div>
            <div className="mt-1 flex flex-col items-center gap-2 text-sm">
              {/* Plaintiff with Avatar and Verification */}
              <div className="flex items-center gap-2">
                <UserAvatar
                  userId={
                    dispute.plaintiffData?.userId ||
                    cleanTelegramUsername(dispute.plaintiff)
                  }
                  avatarId={dispute.plaintiffData?.avatarId || null}
                  username={cleanTelegramUsername(dispute.plaintiff)}
                  size="sm"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const cleanUsername = cleanTelegramUsername(
                      dispute.plaintiff,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 hover:underline"
                >
                  {formatTelegramUsernameForDisplay(dispute.plaintiff)}
                  {isCurrentUserPlaintiff() && (
                    <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                  )}
                </button>
              </div>

              <span className="text-white/50">vs</span>

              {/* Defendant with Avatar and Verification */}
              <div className="flex items-center gap-2">
                <UserAvatar
                  userId={
                    dispute.defendantData?.userId ||
                    cleanTelegramUsername(dispute.defendant)
                  }
                  avatarId={dispute.defendantData?.avatarId || null}
                  username={cleanTelegramUsername(dispute.defendant)}
                  size="sm"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const cleanUsername = cleanTelegramUsername(
                      dispute.defendant,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 hover:underline"
                >
                  {formatTelegramUsernameForDisplay(dispute.defendant)}
                  {isCurrentUserDefendant() && (
                    <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plaintiff Column */}
        <div className="space-y-6">
          {/* Plaintiff Header */}
          {/* Plaintiff Header */}
          <motion.div
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 12,
              bounce: 0.4,
              duration: 1.2,
            }}
            className="ml-auto flex w-fit items-center gap-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4"
          >
            <UserAvatar
              userId={
                dispute.plaintiffData?.userId ||
                cleanTelegramUsername(dispute.plaintiff)
              }
              avatarId={dispute.plaintiffData?.avatarId || null}
              username={cleanTelegramUsername(dispute.plaintiff)}
              size="md"
            />
            <div>
              <h2 className="text-lg font-bold text-cyan-400">Plaintiff</h2>
              <div className="flex items-center gap-2 text-sm text-cyan-300">
                <button
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.plaintiff,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="hover:text-cyan-200 hover:underline"
                >
                  {formatTelegramUsernameForDisplay(dispute.plaintiff)}
                </button>
                {isCurrentUserPlaintiff() && (
                  <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                )}
                <button
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.plaintiff,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="text-cyan-400 hover:text-cyan-300"
                ></button>
              </div>
            </div>
          </motion.div>
          {/* Initial Claim */}
          <div className="space-y-4">
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                <MessageCircle className="h-4 w-4" />
                Initial Complaint
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </span>
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-cyan-200">
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed text-cyan-100">
                    {safeDescription}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-green-400">
                    Formal Claim
                  </h4>
                  <p className="text-sm leading-relaxed text-cyan-100">
                    {safeClaim}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence */}
            {safeEvidence.length > 0 && (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                  <Upload className="h-4 w-4" />
                  Supporting Evidence ({safeEvidence.length})
                </h3>
                <EvidenceDisplay
                  evidence={safeEvidence}
                  color="cyan"
                  onViewEvidence={handleViewEvidence}
                />
              </div>
            )}

            {/* Witnesses */}
            {plaintiffWitnesses.length > 0 && (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                  <UserCheck className="h-4 w-4" />
                  Plaintiff's Witnesses ({plaintiffWitnesses.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {plaintiffWitnesses.map((witness, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300"
                    >
                      {witness}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Defendant Column */}
        {/* Defendant Column */}
        <div className="space-y-6">
          {/* Defendant Header */}
          <motion.div
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 12,
              bounce: 0.4,
              duration: 1.2,
              delay: 0.1,
            }}
            className="flex w-fit items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-4"
          >
            <UserAvatar
              userId={
                dispute.defendantData?.userId ||
                cleanTelegramUsername(dispute.defendant)
              }
              avatarId={dispute.defendantData?.avatarId || null}
              username={cleanTelegramUsername(dispute.defendant)}
              size="md"
            />
            <div>
              <h2 className="text-lg font-bold text-yellow-400">Defendant</h2>
              <div className="flex items-center gap-2 text-sm text-yellow-300">
                <button
                  onClick={() => {
                    const cleanUsername = cleanTelegramUsername(
                      dispute.defendant,
                    );
                    const encodedUsername = encodeURIComponent(cleanUsername);
                    navigate(`/profile/${encodedUsername}`);
                  }}
                  className="hover:text-yellow-200 hover:underline"
                >
                  {formatTelegramUsernameForDisplay(dispute.defendant)}
                </button>
                {isCurrentUserDefendant() && (
                  <VscVerifiedFilled className="h-4 w-4 text-green-400" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Defendant Response */}
          {dispute.defendantResponse ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                  <MessageCircle className="h-4 w-4" />
                  Response to Claims
                  <span className="text-muted-foreground ml-auto text-xs">
                    {new Date(
                      dispute.defendantResponse.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </h3>
                <p className="text-sm leading-relaxed text-yellow-100">
                  {dispute.defendantResponse.description}
                </p>
              </div>

              {/* Defendant's Evidence */}
              {defendantEvidence.length > 0 && (
                <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                    <Upload className="h-4 w-4" />
                    Defense Evidence ({defendantEvidence.length})
                  </h3>
                  <EvidenceDisplay
                    evidence={defendantEvidence}
                    color="yellow"
                    onViewEvidence={handleViewEvidence}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-yellow-400/30 bg-yellow-500/5 p-8 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-yellow-400/50" />
              <h3 className="mb-2 text-lg font-semibold text-yellow-300">
                Awaiting Response
              </h3>
              <p className="mb-4 text-sm text-yellow-200/70">
                The defendant has not yet responded to the claims.
              </p>
            </div>
          )}

          {/* Defendant Witnesses Section */}
          {defendantWitnesses.length > 0 && (
            <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                <UserCheck className="h-4 w-4" />
                Defendant's Witnesses ({defendantWitnesses.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {defendantWitnesses.map((witness, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300"
                  >
                    {witness}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Voting Section - Prominent display for Vote in Progress disputes */}
        {/* Voting Section - Prominent display for Vote in Progress disputes */}
        {dispute.status === "Vote in Progress" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-purple-400/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-2 text-xl font-bold text-purple-300">
                  ⚖️ Voting in Progress
                </h3>
                <p className="text-purple-200">
                  This dispute is currently being voted on. Cast your vote to
                  help reach a resolution.
                </p>
                {!votingEligibility.canVote && votingEligibility.reason && (
                  <p className="mt-2 text-sm text-yellow-300">
                    {votingEligibility.reason}
                  </p>
                )}
              </div>
              {votingEligibility.canVote && (
                <Button
                  variant="neon"
                  className="neon-hover border-purple-400/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                  onClick={handleOpenVoteModal}
                  size="lg"
                >
                  <Scale className="mr-2 h-5 w-5" />
                  Cast Your Vote
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      {/* Action Buttons */}
      {/* Action Buttons */}
      <div className="flex gap-3 border-t border-white/10 pt-6">
        {/* Plaintiff Edit Button - Only show when dispute is pending */}
        {dispute.status === "Pending" && isCurrentUserPlaintiff() && (
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
            onClick={() => setPlaintiffReplyModalOpen(true)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Edit as Plaintiff
          </Button>
        )}

        {/* Settle Dispute Button - Only for plaintiff when dispute is pending */}
        {dispute.status === "Pending" && isCurrentUserPlaintiff() && (
          <Button
            variant="outline"
            className="border-green-400/30 text-green-300 hover:bg-green-500/10"
            onClick={() => setSettleModalOpen(true)}
          >
            <Scale className="mr-2 h-4 w-4" />
            Settle Dispute
          </Button>
        )}

        {/* Defendant Response Button - Only for defendant when no response exists and dispute is pending */}
        {dispute.status === "Pending" &&
          isCurrentUserDefendant() &&
          !hasValidDefendantResponse(dispute.defendantResponse) && (
            <Button
              variant="outline"
              className="ml-auto border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
              onClick={() => setDefendantReplyModalOpen(true)}
            >
              <Shield className="mr-2 h-4 w-4" />
              Respond as Defendant
            </Button>
          )}

        {/* Defendant Edit Button - Show when defendant has responded AND dispute is still pending */}
        {dispute.status === "Pending" &&
          isCurrentUserDefendant() &&
          hasValidDefendantResponse(dispute.defendantResponse) && (
            <Button
              variant="outline"
              className="ml-auto border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
              onClick={() => setDefendantReplyModalOpen(true)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Edit as Defendant
            </Button>
          )}

        {/* Show Cast Vote button ONLY for Vote in Progress disputes */}
        {dispute.status === "Vote in Progress" && (
          <Button
            variant="neon"
            className="neon-hover ml-auto"
            onClick={handleOpenVoteModal}
          >
            <Scale className="mr-2 h-4 w-4" />
            Cast Vote
          </Button>
        )}
      </div>

      {/* Evidence Viewer Modal */}
      <EvidenceViewer
        isOpen={evidenceViewerOpen}
        onClose={() => {
          setEvidenceViewerOpen(false);
          setPdfLoading(false);
          setPdfError(false);
        }}
        selectedEvidence={selectedEvidence}
        onPdfLoad={handlePdfLoad}
        onPdfError={handlePdfError}
        pdfLoading={pdfLoading}
        pdfError={pdfError}
      />

      {/* Vote Outcome Modal */}
      <VoteOutcomeModal
        isOpen={voteOutcomeModalOpen}
        onClose={() => setVoteOutcomeModalOpen(false)}
      />

      {/* Vote Modal */}

      <VoteModal
        isOpen={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        voteData={voteData}
        onVoteChange={handleVoteChange}
        onCastVote={handleCastVote}
        hasVoted={hasVoted}
      />
      {/* Plaintiff Reply Modal */}
      <PlaintiffReplyModal
        isOpen={plaintiffReplyModalOpen}
        onClose={() => setPlaintiffReplyModalOpen(false)}
        dispute={dispute}
        onSubmit={handlePlaintiffReply}
        navigate={navigate}
      />

      {/* Defendant Reply Modal */}
      <DefendantReplyModal
        isOpen={defendantReplyModalOpen}
        onClose={() => setDefendantReplyModalOpen(false)}
        dispute={dispute}
        onSubmit={handleDefendantReply}
        navigate={navigate}
      />

      <SettleConfirmationModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        onConfirm={handleSettleDispute}
        disputeTitle={dispute?.title}
      />
    </motion.div>
  );
}

// Settle Confirmation Modal Component
const SettleConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  disputeTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  disputeTitle?: string;
}) => {
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-w-md overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-green-400/30 bg-green-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-green-300" />
              <h3 className="text-xl font-semibold text-green-300">
                Settle Dispute
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-2 text-lg font-semibold text-white">
                  {disputeTitle}
                </div>
                <p className="text-green-200">
                  Are you sure you want to settle this dispute?
                </p>
                <p className="mt-2 text-sm text-green-200/70">
                  This action cannot be undone. The dispute will be marked as
                  settled and no further changes can be made.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="neon"
                  className="flex-1 border-green-400/30 bg-green-500/20 text-green-300 hover:bg-green-500/30"
                  onClick={onConfirm}
                >
                  <Scale className="mr-2 h-4 w-4" />
                  Settle Dispute
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
