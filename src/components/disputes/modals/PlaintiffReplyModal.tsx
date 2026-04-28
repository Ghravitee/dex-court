import { toast } from "sonner";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
  isValidTelegramUsername,
  formatTelegramUsernameForDisplay,
} from "../../../lib/usernameUtils";
import type { DisputeRow, UploadedFile } from "../../../types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  FileText,
  Loader2,
  Search,
  Send,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
import { useAuth } from "../../../hooks/useAuth";
import { UserSearchResult } from "../UserSearchResult";
import { useAllAccounts } from "../../../hooks/useAccounts";
import type { AccountSummaryDTO } from "../../../services/accountService";

const getTotalFileSize = (files: UploadedFile[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
  const mb = totalBytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

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
  const [requestKind, setRequestKind] = useState<number>(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Witness search state
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const witnessSearchRef = useRef<HTMLDivElement>(null);
  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  const currentUserTelegram = getCurrentUserTelegram(currentUser);

  // ✅ Backend does the searching now
  const { data: accountsResponse, isLoading: isWitnessSearchLoading } =
    useAllAccounts(
      { search: debouncedWitnessQuery, top: 20 },
      { enabled: debouncedWitnessQuery.length >= 2 },
    );

  // ✅ useMemo only excludes current user now
  const witnessSearchResults = useMemo(() => {
    if (debouncedWitnessQuery.length < 2) return [];

    return (accountsResponse?.results ?? []).filter((u) => {
      const telegram = cleanTelegramUsername(
        u.telegram?.username ?? u.telegramInfo ?? "",
      );
      if (
        telegram &&
        telegram.toLowerCase() === currentUserTelegram.toLowerCase()
      )
        return false;

      return true;
    });
  }, [accountsResponse, debouncedWitnessQuery, currentUserTelegram]);

  useEffect(() => {
    setShowWitnessSuggestions(debouncedWitnessQuery.length >= 2);
  }, [debouncedWitnessQuery]);

  // Click-outside handler
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

  // Witness select handler
  const handleWitnessSelect = useCallback(
    (user: AccountSummaryDTO) => {
      const telegram = cleanTelegramUsername(
        user.telegram?.username ?? user.telegramInfo ?? user.username ?? "",
      );
      if (!telegram) {
        toast.error("Selected user has no valid Telegram username");
        return;
      }
      if (witnesses.includes(telegram)) {
        toast.error("Witness already added");
        return;
      }
      setWitnesses((prev) => [...prev, telegram]);
      setWitnessSearchQuery("");
      setShowWitnessSuggestions(false);
    },
    [witnesses],
  );

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

    Array.from(selectedFiles).forEach((file) => {
      const fileSizeMB = file.size / 1024 / 1024;
      const fileType = file.type.startsWith("image/") ? "image" : "document";

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

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSizeMB.toFixed(2) + " MB",
      };

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

    if (hasTextChanges && title.trim() !== dispute?.title && !title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    if (
      hasTextChanges &&
      description.trim() !== dispute?.description &&
      !description.trim()
    ) {
      toast.error("Description cannot be empty");
      return;
    }
    if (hasTextChanges && claim.trim() !== dispute?.claim && !claim.trim()) {
      toast.error("Formal claim cannot be empty");
      return;
    }

    const invalidWitnesses = witnesses.filter(
      (witness) => !witness.trim() || !isValidTelegramUsername(witness),
    );
    if (invalidWitnesses.length > 0) {
      toast.error("All witnesses must have valid Telegram usernames");
      return;
    }

    if (files.length > 10) {
      toast.error("Maximum 10 files allowed for evidence");
      return;
    }

    const totalSize = files.reduce((total, file) => total + file.file.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      toast.error("Total file size too large", {
        description: `Total file size is ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum total size is 50MB.`,
        duration: 8000,
      });
      return;
    }

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/PNG",
    ];
    const allowedDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    for (const file of files) {
      if (file.file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.file.name} exceeds 10MB size limit`);
        return;
      }
      if (
        !allowedImageTypes.includes(file.file.type) &&
        !allowedDocumentTypes.includes(file.file.type)
      ) {
        toast.error(
          `File ${file.file.name} has unsupported type. Allowed: images, PDFs, Word docs, text files`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(title, description, claim, requestKind, files, witnesses);
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
          className="glass card-cyan relative top-10 max-h-[90vh] min-h-0 w-full max-w-2xl overflow-hidden rounded-2xl"
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
                      {/* This will show @username for Telegram, or sliced wallet for 0x addresses */}
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
                      {/* This will show @username for Telegram, or sliced wallet for 0x addresses */}
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
                {/* Witness Tags */}
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
                          {/* Apply wallet address formatting to witness usernames too */}
                          {formatTelegramUsernameForDisplay(witness)}
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
                  {files.length > 0 && (
                    <span className="ml-2 text-xs text-cyan-400">
                      (Total: {getTotalFileSize(files)})
                    </span>
                  )}
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
                    <div className="text-muted-foreground mt-1 text-xs">
                      Supports images{" "}
                      <span className="text-yellow-300">(max 2MB) </span>,
                      documents{" "}
                      <span className="text-yellow-300">(max 3MB)</span>
                    </div>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-cyan-200">
                        Selected Files ({files.length})
                      </h4>
                      <div className="text-xs text-cyan-400">
                        Total: {getTotalFileSize(files)}
                      </div>
                    </div>
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

                    <div className="h-4 sm:h-8"></div>
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

export default PlaintiffReplyModal;
