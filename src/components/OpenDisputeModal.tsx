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
  X,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { createDisputeFromAgreement } from "../services/disputeServices";
import { DisputeTypeEnum } from "../types";
import type { UploadedFile } from "../types";
// import { UserAvatar } from "../components/UserAvatar";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
  isValidTelegramUsername,
} from "../lib/usernameUtils";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useDisputeTransaction } from "../hooks/useDisputeTransaction";
import { useAllAccounts } from "../hooks/useAccounts";
import { useDebounce } from "../hooks/useDebounce";
import { UserSearchResult } from "./disputes/UserSearchResult";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDefendantDisplay = (defendant: string): string => {
  const cleanDefendant = defendant.replace(/^@/, "");
  if (isWalletAddress(cleanDefendant)) return cleanDefendant;
  return defendant.startsWith("@") ? defendant : `@${defendant}`;
};

const getTotalFileSize = (files: UploadedFile[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
  const mb = totalBytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

const isSecondRejection = (agreement: any): boolean => {
  if (!agreement?.timeline) return false;
  return agreement.timeline.filter((e: any) => e.eventType === 6).length >= 2;
};

const isWalletAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

// ─── Props ─────────────────────────────────────────────────────────────────────

interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: any;
  onDisputeCreated: () => void;
  onPaidDisputeCreated?: (votingId: number | string, flow: "open") => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OpenDisputeModal({
  isOpen,
  onClose,
  agreement,
  onDisputeCreated,
  onPaidDisputeCreated,
}: OpenDisputeModalProps) {
  
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const networkInfo = useNetworkEnvironment();


  const [form, setForm] = useState({
    title: "",
    kind: "" as "" | "Pro Bono" | "Paid",
    defendant: "",
    description: "",
    claim: "",
    evidence: [] as UploadedFile[],
    witnesses: [""] as string[],
  });

  // Witness search state
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [activeWitnessIndex, setActiveWitnessIndex] = useState<number>(0);

  const [isDragOver, setIsDragOver] = useState(false);

  const { transactionStep, transactionHash, resetTransaction, isSuccess } =
    useDisputeTransaction(networkInfo.chainId);

  const hasInitialized = useRef(false);
  const formRef = useRef(form);
  const agreementIdRef = useRef(agreement?.id);
  const networkInfoRef = useRef(networkInfo);

  useEffect(() => {
    formRef.current = form;
  }, [form]);
  useEffect(() => {
    agreementIdRef.current = agreement?.id;
  }, [agreement?.id]);
  useEffect(() => {
    networkInfoRef.current = networkInfo;
  }, [networkInfo]);

  // ─── Account search ──────────────────────────────────────────────────────────

  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  const { data: allAccounts = [], isLoading: isWitnessSearchLoading } =
    useAllAccounts({
      enabled: debouncedWitnessQuery.length >= 2,
    });

  const currentUserTelegram = getCurrentUserTelegram(currentUser);

  const witnessSearchResults = useMemo(() => {
    if (debouncedWitnessQuery.length < 2) return [];

    const cleanQuery = debouncedWitnessQuery.startsWith("@")
      ? debouncedWitnessQuery.slice(1)
      : debouncedWitnessQuery;
    const q = cleanQuery.toLowerCase();

    const cleanDefendant = form.defendant.startsWith("@")
      ? form.defendant.slice(1).toLowerCase()
      : form.defendant.toLowerCase();

    return allAccounts.filter((u) => {
      const telegram = cleanTelegramUsername(
        u.telegram?.username ?? u.telegramInfo ?? "",
      );
      if (!telegram) return false;
      if (telegram.toLowerCase() === currentUserTelegram.toLowerCase())
        return false;
      if (telegram.toLowerCase() === cleanDefendant) return false;

      return (
        u.username?.toLowerCase().includes(q) ||
        u.telegram?.username?.toLowerCase().includes(q) ||
        u.telegramInfo?.toLowerCase().includes(q) ||
        u.walletAddress?.toLowerCase().includes(q)
      );
    });
  }, [allAccounts, debouncedWitnessQuery, currentUserTelegram, form.defendant]);

  useEffect(() => {
    setShowWitnessSuggestions(debouncedWitnessQuery.length >= 2);
  }, [debouncedWitnessQuery]);

  // ─── Form initialization ─────────────────────────────────────────────────────

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

      const title = isFromSecondRejection
        ? `Dispute: ${agreement.title} - Second Delivery Rejection`
        : `Dispute from Agreement: ${agreement.title}`;

      const description = isFromSecondRejection
        ? `This dispute was automatically triggered after the second rejection of delivery for agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: The delivery has been rejected twice, indicating unresolved issues with the work performed.`
        : `This dispute originates from agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: `;

      setForm({
        title,
        kind: "",
        defendant: formattedDefendant,
        description,
        claim: "",
        evidence: [],
        witnesses: [""],
      });

      hasInitialized.current = true;
    }
  }, [isOpen, agreement, currentUser]);

  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      resetTransaction();
    }
  }, [isOpen, resetTransaction]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const resetFormAndClose = useCallback(() => {
    setForm({
      title: "",
      kind: "",
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

  useEffect(() => {
    if (isSuccess && transactionHash && form.kind === "Paid") {
      toast.success("Paid dispute created successfully!", {
        description:
          "Transaction confirmed on blockchain. The dispute is now active.",
        duration: 5000,
      });
      setTimeout(() => resetFormAndClose(), 2000);
    }
  }, [isSuccess, transactionHash, form.kind, resetFormAndClose]);

  const createDisputeOffchain = useCallback(
    async (
      title: string,
      description: string,
      requestKind: DisputeTypeEnum,
      defendant: string,
      claim: string,
      witnesses: string[],
      files: File[],
      txHash?: string,
    ) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        const result = await createDisputeFromAgreement(
          parseInt(agreement.id),
          {
            title,
            description,
            requestKind,
            defendant,
            claim,
            witnesses,
            chainId: networkInfo.chainId,
            txHash,
          },
          files,
          networkInfo.chainId,
        );

        toast.success("Pro Bono dispute created successfully!", {
          description: `${result.id} has been submitted for review`,
        });

        resetFormAndClose();
      } catch (error: any) {
        toast.error("Submission Failed", {
          description: error.message || "Failed to submit dispute",
          duration: 6000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [agreement?.id, networkInfo.chainId, isSubmitting, resetFormAndClose],
  );

  // Witness select — receives full user object from UserSearchResult
  const handleWitnessSelect = useCallback(
    (user: (typeof allAccounts)[number], index: number) => {
      const telegram = cleanTelegramUsername(
        user.telegram?.username ?? user.telegramInfo ?? user.username ?? "",
      );

      if (!telegram) {
        toast.error("Selected user has no valid Telegram username");
        return;
      }

      const cleanDefendant = form.defendant.startsWith("@")
        ? form.defendant.slice(1)
        : form.defendant;

      if (telegram.toLowerCase() === currentUserTelegram.toLowerCase()) {
        toast.error("Invalid Witness", {
          description: "You cannot add yourself as a witness.",
          duration: 4000,
        });
        return;
      }

      if (telegram.toLowerCase() === cleanDefendant.toLowerCase()) {
        toast.error("Invalid Witness", {
          description: "The defendant cannot be a witness.",
          duration: 4000,
        });
        return;
      }

      updateWitness(index, `@${telegram}`);
      setShowWitnessSuggestions(false);
      setWitnessSearchQuery("");
    },
    [form.defendant, currentUserTelegram],
  );

  const handleWitnessInputChange = (index: number, value: string) => {
    updateWitness(index, value);
    setWitnessSearchQuery(value);

    if (value.length >= 2) {
      const clean = value.startsWith("@") ? value.slice(1) : value;
      const cleanDefendant = form.defendant.startsWith("@")
        ? form.defendant.slice(1)
        : form.defendant;

      if (clean.toLowerCase() === currentUserTelegram.toLowerCase()) {
        toast.warning("Invalid Witness", {
          description: "You cannot add yourself as a witness.",
          duration: 5000,
          id: "self-witness-warning",
        });
      } else if (clean.toLowerCase() === cleanDefendant.toLowerCase()) {
        toast.warning("Invalid Witness", {
          description: "The defendant cannot be a witness.",
          duration: 5000,
          id: "defendant-witness-warning",
        });
      }
    }
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

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSizeMB.toFixed(2) + " MB",
      };

      newFiles.push(newFile);

      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          newFile.preview = ev.target?.result as string;
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

    setForm((prev) => ({ ...prev, evidence: [...prev.evidence, ...newFiles] }));
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((f) => f.id !== id),
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
    const dataTransfer = new DataTransfer();
    Array.from(e.dataTransfer.files).forEach((f) => dataTransfer.items.add(f));
    handleFileSelect({
      target: { files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const addWitness = () => {
    if (form.witnesses.length < 5) {
      setForm((prev) => ({ ...prev, witnesses: [...prev.witnesses, ""] }));
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

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const el = document.querySelector("[data-witness-search]");
      if (el && !el.contains(event.target as Node)) {
        setShowWitnessSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!form.kind) {
      toast.error("Please select a request kind (Pro Bono or Paid)");
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

    const cleanDefendant = form.defendant.startsWith("@")
      ? form.defendant.slice(1)
      : form.defendant;

    const invalidWitnesses = form.witnesses
      .filter((w) => w.trim())
      .map((w) => (w.startsWith("@") ? w.slice(1) : w))
      .filter((w) => {
        const isPlaintiff =
          w.toLowerCase() === currentUserTelegram.toLowerCase();
        const isDefendant = w.toLowerCase() === cleanDefendant.toLowerCase();
        return !isValidTelegramUsername(w) || isPlaintiff || isDefendant;
      });

    if (invalidWitnesses.length > 0) {
      const invalidReasons = invalidWitnesses
        .map((w) => {
          if (w.toLowerCase() === currentUserTelegram.toLowerCase())
            return `"${w}" - You cannot add yourself as a witness`;
          if (w.toLowerCase() === cleanDefendant.toLowerCase())
            return `"${w}" - The defendant cannot be a witness`;
          return `"${w}" - Invalid Telegram username format`;
        })
        .join("\n");

      toast.error("Invalid Witness Entries", {
        description: (
          <div className="whitespace-pre-line">
            Please fix the following:\n{invalidReasons}
          </div>
        ),
        duration: 8000,
      });
      return;
    }

    const totalSize = form.evidence.reduce((t, f) => t + f.file.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      toast.error("Total file size too large", {
        description: `${(totalSize / 1024 / 1024).toFixed(2)}MB exceeds 50MB limit.`,
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
    ];
    const allowedDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    for (const file of form.evidence) {
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

    const cleanedDefendant = cleanDefendant;
    const cleanedWitnesses = form.witnesses
      .filter((w) => w.trim())
      .map((w) => cleanTelegramUsername(w.startsWith("@") ? w.slice(1) : w));

    const requestKind =
      form.kind === "Pro Bono" ? DisputeTypeEnum.ProBono : DisputeTypeEnum.Paid;
    const files = form.evidence.map((uf) => uf.file);

    if (requestKind === DisputeTypeEnum.Paid) {
      setIsSubmitting(true);
      try {
        const result = await createDisputeFromAgreement(
          parseInt(agreement.id),
          {
            title: form.title,
            description: form.description,
            requestKind,
            defendant: cleanedDefendant,
            claim: form.claim,
            witnesses: cleanedWitnesses,
            chainId: networkInfo.chainId,
            txHash: transactionHash,
          },
          files,
          networkInfo.chainId,
        );

        toast.success("Dispute created! Complete payment to activate.", {
          description: "You'll be redirected to complete the payment.",
          duration: 5000,
        });

        onPaidDisputeCreated?.(result.votingId ?? result.id, "open");
        onClose();
      } catch (error: any) {
        toast.error("Failed to create dispute", {
          description:
            error.message || "Failed to create dispute. Please try again.",
          duration: 6000,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await createDisputeOffchain(
        form.title,
        form.description,
        requestKind,
        cleanedDefendant,
        form.claim,
        cleanedWitnesses,
        files,
      );
    }
  };

  const isDisabled = isSubmitting;

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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Dispute...
                    </>
                  ) : (
                    <>
                      <Scale className="mr-2 h-4 w-4" />
                      Open Dispute
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
