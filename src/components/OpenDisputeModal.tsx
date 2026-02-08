/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "../components/ui/button";
import {
  Search,
  Upload,
  Paperclip,
  Trash2,
  Loader2,
  Users,
  Scale,
  Info,
  ChevronRight,
  X,
  Wallet,
  // CheckCircle2,
  // AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { disputeService } from "../services/disputeServices";
import { DisputeTypeEnum } from "../types";
import type { UploadedFile } from "../types";
import { UserAvatar } from "../components/UserAvatar";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
  isValidTelegramUsername,
} from "../lib/usernameUtils";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useDisputeTransaction } from "../hooks/useDisputeTransaction";
import { TransactionStatus } from "../components/TransactionStatus";

const formatDefendantDisplay = (defendant: string): string => {
  const cleanDefendant = defendant.replace(/^@/, "");
  if (isWalletAddress(cleanDefendant)) {
    return cleanDefendant;
  }
  return defendant.startsWith("@") ? defendant : `@${defendant}`;
};

const getTotalFileSize = (files: UploadedFile[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
  const mb = totalBytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

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

const isSecondRejection = (agreement: any): boolean => {
  if (!agreement?.timeline) return false;
  const rejectionEvents = agreement.timeline.filter(
    (event: any) => event.eventType === 6,
  );
  return rejectionEvents.length >= 2;
};

const isWalletAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: any;
  onDisputeCreated: () => void;
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

export default function OpenDisputeModal({
  isOpen,
  onClose,
  agreement,
  onDisputeCreated,
}: OpenDisputeModalProps) {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const networkInfo = useNetworkEnvironment();
  const [form, setForm] = useState({
    title: "",
    kind: "Pro Bono" as "Pro Bono" | "Paid",
    defendant: "",
    description: "",
    claim: "",
    evidence: [] as UploadedFile[],
    witnesses: [""] as string[],
  });

  // Search states for witnesses
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [activeWitnessIndex, setActiveWitnessIndex] = useState<number>(0);

  // File upload state
  const [isDragOver, setIsDragOver] = useState(false);

  // Use the custom hook for transaction management
  const {
    transactionStep,
    isProcessing,
    transactionHash,
    transactionError,
    createDisputeOnchain,
    retryTransaction,
    resetTransaction,
    // isPending,
    isSuccess,
    // isError,
  } = useDisputeTransaction(networkInfo.chainId);

  // Add this ref to track if form has been initialized
  const hasInitialized = useRef(false);

  // Refs for form data that changes
  const formRef = useRef(form);
  const agreementIdRef = useRef(agreement?.id);
  const networkInfoRef = useRef(networkInfo);

  // Generate random voting ID
  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  // Update refs when dependencies change
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    agreementIdRef.current = agreement?.id;
  }, [agreement?.id]);

  useEffect(() => {
    networkInfoRef.current = networkInfo;
  }, [networkInfo]);

  // Initialize form from agreement
  useEffect(() => {
    if (isOpen && agreement && !hasInitialized.current) {
      const isFirstParty =
        agreement._raw?.firstParty?.username === currentUser?.username;
      const defendant = isFirstParty
        ? agreement.counterparty
        : agreement.createdBy;

      const formattedDefendant = defendant
        ? formatDefendantDisplay(defendant)
        : "";

      const isFromSecondRejection = isSecondRejection(agreement._raw);

      let title = `Dispute from Agreement: ${agreement.title}`;
      let description = `This dispute originates from agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: `;

      if (isFromSecondRejection) {
        title = `Dispute: ${agreement.title} - Second Delivery Rejection`;
        description = `This dispute was automatically triggered after the second rejection of delivery for agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: The delivery has been rejected twice, indicating unresolved issues with the work performed.`;
      }

      setForm({
        title,
        kind: "Pro Bono",
        defendant: formattedDefendant,
        description,
        claim: "",
        evidence: [],
        witnesses: [""],
      });

      hasInitialized.current = true;
    }
  }, [isOpen, agreement, currentUser]);

  // Reset the initialized flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      resetTransaction();
    }
  }, [isOpen, resetTransaction]);

  // Helper function to reset and close
  const resetFormAndClose = useCallback(() => {
    setForm({
      title: "",
      kind: "Pro Bono",
      defendant: "",
      description: "",
      claim: "",
      evidence: [],
      witnesses: [""],
    });
    resetTransaction();
    onDisputeCreated();
    onClose();
  }, [resetTransaction, onDisputeCreated, onClose]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && transactionHash && form.kind === "Paid") {
      console.log(
        "✅ [OpenDisputeModal] Transaction successful! Hash:",
        transactionHash,
      );

      // Show success message
      toast.success("Paid dispute created successfully!", {
        description:
          "Transaction confirmed on blockchain. The dispute is now active.",
        duration: 5000,
      });

      setTimeout(() => {
        console.log("🔄 Closing modal after success");
        resetFormAndClose();
      }, 2000);
    }
  }, [isSuccess, transactionHash, form.kind, resetFormAndClose]);

  // Create dispute in backend (used for BOTH Pro Bono AND Paid)
  const createDisputeOffchain = useCallback(
    async (transactionHash?: string) => {
      console.log(
        "🟡 createDisputeOffchain called with hash:",
        transactionHash,
      );

      if (isSubmitting) {
        console.log("⏸️ Already submitting, skipping");
        return;
      }

      setIsSubmitting(true);

      try {
        console.log("🚀 Creating dispute from agreement...");

        const currentForm = formRef.current;
        const currentAgreementId = agreementIdRef.current;
        const currentNetworkInfo = networkInfoRef.current;

        // Clean defendant - remove @ symbol before storing
        const cleanedDefendant = currentForm.defendant.startsWith("@")
          ? currentForm.defendant.substring(1)
          : currentForm.defendant;

        // Clean witness usernames - remove @ symbol before sending
        const cleanedWitnesses = currentForm.witnesses
          .filter((w) => w.trim())
          .map((w) => {
            const cleanW = w.startsWith("@") ? w.substring(1) : w;
            return cleanTelegramUsername(cleanW);
          });

        const requestKind =
          currentForm.kind === "Pro Bono"
            ? DisputeTypeEnum.ProBono
            : DisputeTypeEnum.Paid;

        const files = currentForm.evidence.map((uf) => uf.file);

        console.log("📋 Creating dispute with:", {
          agreementId: currentAgreementId,
          title: currentForm.title,
          kind: currentForm.kind,
          chainId: currentNetworkInfo.chainId,
          transactionHash,
        });

        // Create the dispute
        const result = await disputeService.createDisputeFromAgreement(
          parseInt(agreement.id),
          {
            title: form.title,
            description: form.description,
            requestKind,
            defendant: cleanedDefendant,
            claim: form.claim,
            witnesses: cleanedWitnesses,
            onchainVotingId: votingIdToUse.toString(),
            chainId: networkInfo.chainId,
            txHash: transactionHash,
          },
          files,
          networkInfo.chainId,
        );

        console.log("✅ Dispute created successfully:", result);

        if (currentForm.kind === "Paid") {
          toast.success("Paid dispute created successfully!", {
            description: `${currentForm.title} has been recorded on-chain and in our system`,
          });
        } else {
          toast.success("Pro Bono dispute created successfully!", {
            description: `${currentForm.title} has been submitted for review`,
          });
        }

        // Reset form and close modal
        resetFormAndClose();
      } catch (error: any) {
        console.error("❌ Dispute creation failed:", error);

        const errorMessage = error.message || "Failed to submit dispute";
        toast.error("Submission Failed", {
          description: errorMessage,
          duration: 6000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      resetFormAndClose,
      votingIdToUse,
      isSubmitting,
      agreement.id,
      form.claim,
      form.description,
      form.title,
      networkInfo.chainId,
    ],
  );

  const handleWitnessSearch = useCallback(
    async (query: string) => {
      const cleanQuery = query.startsWith("@") ? query.substring(1) : query;

      if (cleanQuery.length < 2) {
        setWitnessSearchResults([]);
        setShowWitnessSuggestions(false);
        return;
      }

      setIsWitnessSearchLoading(true);
      setShowWitnessSuggestions(true);

      try {
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

  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  useEffect(() => {
    if (debouncedWitnessQuery.length >= 2) {
      handleWitnessSearch(debouncedWitnessQuery);
    } else {
      setWitnessSearchResults([]);
      setShowWitnessSuggestions(false);
    }
  }, [debouncedWitnessQuery, handleWitnessSearch]);

  // Handle witness selection
  const handleWitnessSelect = (username: string, index: number) => {
    updateWitness(index, `@${username}`);
    setShowWitnessSuggestions(false);
    setWitnessSearchQuery("");
  };

  const handleWitnessInputChange = (index: number, value: string) => {
    updateWitness(index, value);
    setWitnessSearchQuery(value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];

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

      const fileSize = fileSizeMB.toFixed(2) + " MB";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSize,
      };

      newFiles.push(newFile);

      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
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

    setForm((prev) => ({
      ...prev,
      evidence: [...prev.evidence, ...newFiles],
    }));
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((file) => file.id !== id),
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

  // Witness management
  const addWitness = () => {
    if (form.witnesses.length < 5) {
      setForm((prev) => ({
        ...prev,
        witnesses: [...prev.witnesses, ""],
      }));
    }
  };

  const updateWitness = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.map((w, i) => (i === index ? value : w)),
    }));
  };

  const removeWitness = (index: number) => {
    setForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index),
    }));
  };

  // Main form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!form.defendant.trim()) {
      toast.error("Defendant information is required");
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
      toast.error("Please upload supporting evidence");
      return;
    }

    const defendant = form.defendant.trim();
    if (!isValidTelegramUsername(defendant) && !isWalletAddress(defendant)) {
      toast.error(
        "Defendant must be a valid Telegram username or wallet address",
      );
      return;
    }

    // Validate witness Telegram usernames
    const invalidWitnesses = form.witnesses
      .filter((w) => w.trim())
      .map((w) => (w.startsWith("@") ? w.substring(1) : w))
      .filter((w) => !isValidTelegramUsername(w));

    if (invalidWitnesses.length > 0) {
      toast.error("Please enter valid Telegram usernames for all witnesses");
      return;
    }

    // Validate file sizes and types
    const maxFileSize = 10 * 1024 * 1024;
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

    const totalSize = form.evidence.reduce(
      (total, file) => total + file.file.size,
      0,
    );
    const maxTotalSize = 50 * 1024 * 1024;

    if (totalSize > maxTotalSize) {
      toast.error("Total file size too large", {
        description: `Total file size is ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum total size is 50MB.`,
        duration: 8000,
      });
      return;
    }

    for (const file of form.evidence) {
      if (file.file.size > maxFileSize) {
        toast.error(`File ${file.file.name} exceeds 10MB size limit`);
        return;
      }

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

    // Handle based on dispute type
    if (form.kind === "Paid") {
      try {
        console.log("🟡 [PAID] Creating dispute in backend first...");

        // Clean defendant - remove @ symbol before storing
        const cleanedDefendant = form.defendant.startsWith("@")
          ? form.defendant.substring(1)
          : form.defendant;

        // Clean witness usernames
        const cleanedWitnesses = form.witnesses
          .filter((w) => w.trim())
          .map((w) => {
            const cleanW = w.startsWith("@") ? w.substring(1) : w;
            return cleanTelegramUsername(cleanW);
          });

        const requestKind = DisputeTypeEnum.Paid;
        const files = form.evidence.map((uf) => uf.file);

        console.log("📋 [PAID] Creating dispute in backend with:", {
          agreementId: agreement?.id,
          title: form.title,
          votingId: votingIdToUse,
          chainId: networkInfo.chainId,
        });

        // STEP 1: Create dispute in backend FIRST (without transaction hash)
        const result = await disputeService.createDisputeFromAgreement(
          parseInt(agreement.id),
          {
            title: form.title,
            description: form.description,
            requestKind,
            defendant: cleanedDefendant,
            claim: form.claim,
            witnesses: cleanedWitnesses,
            onchainVotingId: votingIdToUse.toString(),
            chainId: networkInfo.chainId,
          },
          files,
          networkInfo.chainId,
        );

        console.log("✅ [PAID] Backend dispute created:", result);

        // Use the votingId from response or our generated one
        let votingIdForContract: number;
        if (result.votingId) {
          votingIdForContract =
            typeof result.votingId === "string"
              ? parseInt(result.votingId, 10)
              : result.votingId;

          if (isNaN(votingIdForContract)) {
            console.warn("Invalid votingId from backend, using generated ID");
            votingIdForContract = votingIdToUse;
          }
        } else {
          votingIdForContract = votingIdToUse;
        }

        console.log(
          `🔢 [PAID] Using voting ID for contract: ${votingIdForContract}`,
        );

        toast.info("Dispute created in system. Please confirm transaction...", {
          description: "Now confirming on-chain transaction...",
          duration: 3000,
        });

        // STEP 2: Now call smart contract with the voting ID
        await createDisputeOnchain(votingIdForContract);
      } catch (error: any) {
        console.error("❌ [PAID] Failed to create paid dispute:", error);
        const errorMessage = error.message || "Failed to create dispute";
        toast.error("Submission Failed", {
          description: errorMessage,
          duration: 6000,
        });
      }
    } else {
      // For pro bono disputes, create directly
      await createDisputeOffchain();
    }
  };

  // Retry transaction function
  const handleRetryTransaction = async () => {
    if (form.kind === "Paid") {
      await retryTransaction(votingIdToUse);
    }
  };

  // Separate click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const witnessSearchElement = document.querySelector(
        "[data-witness-search]",
      );
      if (
        witnessSearchElement &&
        !witnessSearchElement.contains(event.target as Node)
      ) {
        setShowWitnessSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Disable form when submitting or processing transaction
  const isDisabled =
    isSubmitting || isProcessing || transactionStep === "pending";

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
                Open Dispute from Agreement
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
              disabled={isDisabled}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-sm text-cyan-200">
                Creating dispute from: <strong>{agreement?.title}</strong>
              </p>
            </div>

            {/* Transaction Status Display */}
            {transactionStep !== "idle" && (
              <div className="mb-4">
                <TransactionStatus
                  status={transactionStep}
                  onRetry={handleRetryTransaction}
                  title={
                    transactionStep === "pending"
                      ? "Processing Transaction..."
                      : transactionStep === "success"
                        ? "Payment Successful!"
                        : "Payment Failed"
                  }
                  description={
                    transactionStep === "pending"
                      ? "Please confirm the transaction in your wallet to complete the payment."
                      : transactionStep === "success"
                        ? "Your paid dispute is being activated..."
                        : transactionError?.message ||
                          "The transaction could not be completed. You can retry the transaction."
                  }
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative cursor-help">
                    <Info className="h-4 w-4 text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      The title has been pre-filled from the agreement. You can
                      modify it as needed.
                    </div>
                  </div>
                </div>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="Dispute title..."
                  required
                  disabled={isDisabled}
                />
              </div>

              {/* Request Kind */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
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
                        A fee is required to initiate your dispute. This fee
                        helps prioritize your case and notifies all judges to
                        begin reviewing it immediately.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["Pro Bono", "Paid"] as const).map((kind) => (
                    <label
                      key={kind}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${
                        form.kind === kind
                          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                          : "border-white/10 bg-white/5"
                      } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <input
                        type="radio"
                        name="kind"
                        className="hidden"
                        checked={form.kind === kind}
                        onChange={() => setForm({ ...form, kind })}
                        disabled={isDisabled}
                      />
                      {kind === "Paid" && <Wallet className="h-4 w-4" />}
                      {kind}
                    </label>
                  ))}
                </div>
              </div>

              {/* Defendant Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Defendant <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-cyan-400">
                    (Pre-filled from agreement)
                  </span>
                </label>
                <div className="relative">
                  <Users className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                  <input
                    value={form.defendant}
                    readOnly
                    className="w-full cursor-not-allowed rounded-md border border-white/10 bg-white/20 py-2 pr-3 pl-9 text-white/70 outline-none"
                    placeholder="Defendant username..."
                    required
                  />
                  {isWalletAddress(form.defendant.replace(/^@/, "")) && (
                    <Wallet className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                  )}
                </div>
                {isWalletAddress(form.defendant.replace(/^@/, "")) ? (
                  <div className="mt-1 text-xs text-cyan-400">
                    <Wallet className="mr-1 inline h-3 w-3" />
                    Wallet address detected
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-cyan-400">
                    <Users className="mr-1 inline h-3 w-3" />
                    Telegram username
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Detailed Description <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-cyan-400">
                    (Agreement description pre-filled)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="Describe the dispute details..."
                  required
                  disabled={isDisabled}
                />
              </div>

              {/* Claim */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
                    Claim <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative cursor-help">
                    <Info className="h-4 w-4 text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      What resolution are you seeking? This field should be
                      filled by you.
                    </div>
                  </div>
                </div>
                <textarea
                  value={form.claim}
                  onChange={(e) => setForm({ ...form, claim: e.target.value })}
                  className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="What resolution are you seeking? (e.g., refund, completion of work, compensation)"
                  required
                  disabled={isDisabled}
                />
              </div>

              {/* Witnesses Section */}
              <div data-witness-search>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
                    Witness list (max 5)
                    <span className="ml-2 text-xs text-cyan-400">
                      (Start typing username with or without @ symbol)
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    onClick={addWitness}
                    disabled={form.witnesses.length >= 5 || isDisabled}
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
                            handleWitnessInputChange(i, value);
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
                          placeholder="Type username with or without @ (min 2 characters)..."
                          disabled={isDisabled}
                        />
                        {isWitnessSearchLoading && activeWitnessIndex === i && (
                          <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                        )}
                      </div>
                      {form.witnesses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWitness(i)}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-cyan-200 hover:text-white"
                          disabled={isDisabled}
                        >
                          Remove
                        </button>
                      )}

                      {/* Witness User Suggestions Dropdown */}
                      {showWitnessSuggestions && activeWitnessIndex === i && (
                        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                          {witnessSearchResults.length > 0 ? (
                            witnessSearchResults.map((user) => (
                              <UserSearchResult
                                key={user.id}
                                user={user}
                                onSelect={(username) =>
                                  handleWitnessSelect(username, i)
                                }
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
                  ))}
                </div>
              </div>

              {/* Evidence Upload Section */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Supporting Evidence <span className="text-red-500">*</span>
                  {form.evidence.length > 0 && (
                    <span className="ml-2 text-xs text-yellow-400">
                      (Total: {getTotalFileSize(form.evidence)})
                    </span>
                  )}
                </label>

                <div
                  className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${
                    isDragOver
                      ? "border-cyan-400/60 bg-cyan-500/20"
                      : "border-white/15 bg-white/5 hover:border-cyan-400/40"
                  } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
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
                    disabled={isDisabled}
                  />
                  <label
                    htmlFor="evidence-upload"
                    className={`flex cursor-pointer flex-col items-center justify-center px-4 py-6 text-center ${
                      isDisabled ? "cursor-not-allowed" : ""
                    }`}
                  >
                    <Upload className="mb-2 h-6 w-6 text-cyan-400" />
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
                              {file.size}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          disabled={isDisabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3 pt-4">
                <div className="text-xs text-cyan-200/70">
                  {form.evidence.length} file(s) selected
                  {form.witnesses.filter((w) => w.trim()).length > 0 &&
                    ` • ${form.witnesses.filter((w) => w.trim()).length} witness(es)`}
                </div>

                <Button
                  type="submit"
                  variant="neon"
                  className="neon-hover"
                  disabled={isDisabled}
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
                      <Scale className="mr-2 h-4 w-4" />
                      {form.kind === "Paid"
                        ? "Pay & Open Dispute"
                        : "Open Dispute"}
                    </>
                  )}
                </Button>
              </div>
            </form>

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
                    For paid disputes, you'll need to confirm a transaction in
                    your wallet to record the dispute on-chain. This ensures
                    transparency and security for your case.
                  </p>
                  <div className="mt-3 text-xs text-cyan-400">
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>Network: {networkInfo.chainName}</span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
