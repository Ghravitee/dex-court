/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  AlertTriangle,
  Users,
  Search,
  Loader2,
  Upload,
  Paperclip,
  Info,
  DollarSign,
  Send,
  Wallet,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { toast } from "sonner";
import { disputeService } from "../../../../services/disputeServices";
import { useAuth } from "../../../../hooks/useAuth";
import { useNetworkEnvironment } from "../../../../config/useNetworkEnvironment";
import { useDisputeTransaction } from "../../../../hooks/useDisputeTransaction";
import { TransactionStatus } from "../../../../components/TransactionStatus";
import { DisputeTypeEnum } from "../../../../types";
import { UserSearchResult } from "./../UserSearchResult";
import { useDebounce } from "../../hooks/useDebounce";
import { normalizeUsername, getTotalFileSize } from "../../utils/helpers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    claim: string,
    requestKind: DisputeTypeEnum,
    chainId?: number,
    votingId?: string,
    transactionHash?: string,
  ) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  isSubmitting: boolean;
  agreement: any;
  votingId?: string;
}

export const EscrowRejectDeliveryModal = ({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  isSubmitting,
  agreement,
  votingId,
}: Props) => {
  const [requestKind, setRequestKind] = useState<DisputeTypeEnum | null>(null);
  const [localTitle, setLocalTitle] = useState(agreement?.title || "");
  const [localDescription, setLocalDescription] = useState(
    agreement?.description || "",
  );
  const [localDefendant, setLocalDefendant] = useState("");
  const [localWitnesses, setLocalWitnesses] = useState<string[]>([]);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [witnessInput, setWitnessInput] = useState("");
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  const networkInfo = useNetworkEnvironment();
  const { user: currentUser } = useAuth();
  const {
    transactionStep,
    isProcessing,
    transactionHash,
    retryTransaction,
    resetTransaction,
  } = useDisputeTransaction(networkInfo.chainId);

  const votingIdToUse = useMemo(() => {
    if (votingId) return votingId;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (100000 + (array[0] % 900000)).toString();
  }, [votingId]);

  // Auto-detect defendant
  useEffect(() => {
    if (agreement && currentUser && !localDefendant) {
      const currentUsername = currentUser?.username;
      if (!currentUsername) return;
      const firstPartyUsername = agreement.firstParty?.username;
      const counterPartyUsername = agreement.counterParty?.username;
      if (
        firstPartyUsername &&
        normalizeUsername(currentUsername) ===
          normalizeUsername(firstPartyUsername)
      ) {
        setLocalDefendant(counterPartyUsername || "Unknown");
      } else if (
        counterPartyUsername &&
        normalizeUsername(currentUsername) ===
          normalizeUsername(counterPartyUsername)
      ) {
        setLocalDefendant(firstPartyUsername || "Unknown");
      }
    }
  }, [agreement, currentUser, localDefendant]);

  // Transaction success handler
  useEffect(() => {
    if (
      transactionStep === "success" &&
      transactionHash &&
      requestKind !== null
    ) {
      onConfirm(
        claim,
        requestKind,
        networkInfo.chainId,
        votingIdToUse.toString(),
        transactionHash,
      )
        .then(() => {
          setTimeout(() => {
            onClose();
            setClaim("");
            resetTransaction();
          }, 2000);
        })
        .catch((error: any) =>
          toast.error("Failed to finalize dispute", {
            description: error.message || "Please try again.",
          }),
        );
    }
  }, [
    transactionStep,
    transactionHash,
    onConfirm,
    claim,
    requestKind,
    networkInfo.chainId,
    votingIdToUse,
    onClose,
    setClaim,
    resetTransaction,
  ]);

  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  const handleWitnessSearch = useCallback(
    async (query: string) => {
      const clean = query.startsWith("@") ? query.substring(1) : query;
      if (clean.length < 2) {
        setWitnessSearchResults([]);
        setShowWitnessSuggestions(false);
        return;
      }
      setIsWitnessSearchLoading(true);
      setShowWitnessSuggestions(true);
      try {
        const results = await disputeService.searchUsers(clean);
        const currentUserTelegram = currentUser?.username || "";
        setWitnessSearchResults(
          results.filter((u) => {
            const t = u.telegramUsername || u.username;
            return t && t.toLowerCase() !== currentUserTelegram.toLowerCase();
          }),
        );
      } catch {
        setWitnessSearchResults([]);
      } finally {
        setIsWitnessSearchLoading(false);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    if (debouncedWitnessQuery.length >= 2)
      handleWitnessSearch(debouncedWitnessQuery);
    else {
      setWitnessSearchResults([]);
      setShowWitnessSuggestions(false);
    }
  }, [debouncedWitnessQuery, handleWitnessSearch]);

  const addWitness = (witness?: string) => {
    const trimmed = witness || witnessInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    const currentUsername = currentUser?.username || "";
    if (normalizeUsername(formatted) === normalizeUsername(currentUsername)) {
      toast.error("You cannot add yourself as a witness");
      setWitnessInput("");
      return;
    }
    if (normalizeUsername(formatted) === normalizeUsername(localDefendant)) {
      toast.error("The defendant cannot be added as a witness");
      setWitnessInput("");
      return;
    }
    if (!localWitnesses.includes(formatted) && localWitnesses.length < 5) {
      setLocalWitnesses([...localWitnesses, formatted]);
      setWitnessInput("");
      setWitnessSearchQuery("");
      setShowWitnessSuggestions(false);
    } else if (localWitnesses.length >= 5) {
      toast.error("Maximum 5 witnesses allowed");
    }
  };

  const handleWitnessSelect = (username: string) => {
    const formatted = username.startsWith("@") ? username : `@${username}`;
    const currentUsername = currentUser?.username || "";
    if (normalizeUsername(formatted) === normalizeUsername(currentUsername)) {
      toast.error("You cannot add yourself as a witness");
      return;
    }
    if (normalizeUsername(formatted) === normalizeUsername(localDefendant)) {
      toast.error("The defendant cannot be added as a witness");
      return;
    }
    addWitness(formatted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: File[] = [];
    Array.from(selected).forEach((file) => {
      const mb = file.size / 1024 / 1024;
      const isImg = file.type.startsWith("image/");
      if (isImg && mb > 2) {
        toast.error(`Image "${file.name}" exceeds 2MB`);
        return;
      }
      if (!isImg && mb > 3) {
        toast.error(`Document "${file.name}" exceeds 3MB`);
        return;
      }
      if (localFiles.length + newFiles.length >= 10) {
        toast.error("Maximum 10 files allowed");
        return;
      }
      if (
        localFiles.reduce((t, f) => t + f.size, 0) + file.size >
        50 * 1024 * 1024
      ) {
        toast.error("Total file size exceeds 50MB");
        return;
      }
      newFiles.push(file);
      if (isImg) {
        const reader = new FileReader();
        reader.onload = (ev) =>
          setFilePreviews((p) => ({
            ...p,
            [file.name]: ev.target?.result as string,
          }));
        reader.readAsDataURL(file);
      }
    });
    if (newFiles.length > 0) setLocalFiles([...localFiles, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dt = new DataTransfer();
    Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
    handleFileUpload({
      target: { files: dt.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const removeFile = (index: number) => {
    const newFiles = [...localFiles];
    const removed = newFiles.splice(index, 1)[0];
    setLocalFiles(newFiles);
    setFilePreviews((p) => {
      const n = { ...p };
      delete n[removed.name];
      return n;
    });
  };

  const isDisabled =
    isSubmitting || isProcessing || transactionStep === "pending";

  const handleSubmit = async () => {
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
    if (!claim.trim()) {
      toast.error("Claim description is required");
      return;
    }
    if (requestKind === null) {
      toast.error("Please select a dispute type");
      return;
    }
    if (localFiles.reduce((t, f) => t + f.size, 0) > 50 * 1024 * 1024) {
      toast.error("Total file size too large");
      return;
    }
    await onConfirm(
      claim,
      requestKind,
      networkInfo.chainId,
      votingIdToUse.toString(),
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl">
        <button
          onClick={onClose}
          disabled={isDisabled}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
            <AlertTriangle className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Reject Delivery & Open Dispute
            </h2>
            <p className="text-sm text-red-300">
              This will create a dispute with the other party
            </p>
          </div>
        </div>

        <div className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Original agreement summary */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <h4 className="mb-2 text-base font-medium text-purple-300">
                Original Agreement
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-purple-200/80">Title:</span>
                  <p className="text-sm font-medium text-white">
                    {agreement?.title || "No title"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-purple-200/80">
                    Description:
                  </span>
                  <p className="line-clamp-2 text-sm text-white/90">
                    {agreement?.description || "No description"}
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Dispute Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                disabled={isDisabled}
                placeholder="Enter a clear title for your dispute"
                className="w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Defendant (read-only) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Defendant <span className="text-red-500">*</span>
              </label>
              {localDefendant ? (
                <div className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                      <Users className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {localDefendant.startsWith("@")
                          ? localDefendant
                          : `@${localDefendant}`}
                      </div>
                      <div className="text-xs text-purple-300">
                        Other party in agreement
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-300">
                    Defendant
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-purple-500/30 bg-black/50 p-3 text-center text-sm text-gray-400">
                  Loading defendant information...
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Automatically set to the other party.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Dispute Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                disabled={isDisabled}
                placeholder="Describe the dispute including what went wrong with the delivery"
                className="h-24 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Claim */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-purple-300">
                  Formal Claim <span className="text-red-500">*</span>
                </label>
                <div className="group relative cursor-help">
                  <Info className="h-4 w-4 text-cyan-300" />
                  <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                    Make sure it's reasonable, as that might help your case when
                    judges look into it.
                  </div>
                </div>
              </div>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                disabled={isDisabled}
                placeholder="State your formal claim against the defendant"
                className="h-24 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            {/* Dispute type */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-purple-300">
                Request Kind <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: DisputeTypeEnum.ProBono,
                    label: "Pro Bono",
                    sub: "Free dispute resolution",
                    activeClass:
                      "border-blue-400/50 bg-blue-500/20 text-blue-300",
                  },
                  {
                    value: DisputeTypeEnum.Paid,
                    label: "Paid",
                    sub: "Small fee required",
                    activeClass:
                      "border-green-400/50 bg-green-500/20 text-green-300",
                  },
                ].map(({ value, label, sub, activeClass }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 text-center text-sm transition-all ${requestKind === value ? activeClass : "border-purple-400/20 bg-purple-500/10 text-purple-300 hover:border-purple-400/40"} ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="disputeType"
                      className="hidden"
                      checked={requestKind === value}
                      onChange={() => setRequestKind(value)}
                      disabled={isDisabled}
                    />
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${requestKind === value ? (value === DisputeTypeEnum.ProBono ? "border border-blue-400/50 bg-blue-500/30" : "border border-green-400/50 bg-green-500/30") : "border border-purple-400/30 bg-purple-500/20"}`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full ${requestKind === value ? (value === DisputeTypeEnum.ProBono ? "bg-blue-400" : "bg-green-400") : "border border-purple-400"}`}
                      />
                    </div>
                    <span className="font-medium">{label}</span>
                    <span className="text-xs opacity-80">{sub}</span>
                  </label>
                ))}
              </div>
              {requestKind === null && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-2">
                  <Info className="mt-0.5 h-4 w-4 text-yellow-400" />
                  <p className="text-xs text-yellow-300/90">
                    Please select Pro Bono or Paid to continue.
                  </p>
                </div>
              )}
              {requestKind === DisputeTypeEnum.Paid &&
                transactionStep === "idle" &&
                !isSubmitting && (
                  <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-300" />
                      <h4 className="text-sm font-medium text-emerald-200">
                        Smart Contract Transaction Required
                      </h4>
                    </div>
                    <p className="mt-2 text-xs text-emerald-300/80">
                      For paid disputes, you'll need to confirm a transaction in
                      your wallet.
                    </p>
                  </div>
                )}
              {requestKind === DisputeTypeEnum.Paid && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-green-500/10 p-2">
                  <DollarSign className="mt-0.5 h-4 w-4 text-green-400" />
                  <p className="text-xs text-green-300/90">
                    A fee will be required when you confirm the dispute.
                  </p>
                </div>
              )}
            </div>

            {/* Witnesses */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Witnesses (Optional) - Max 5
              </label>
              <div className="relative mb-2 flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    value={witnessInput}
                    onChange={(e) => {
                      setWitnessInput(e.target.value);
                      setWitnessSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addWitness())
                    }
                    onFocus={() =>
                      witnessInput.length >= 2 &&
                      setShowWitnessSuggestions(true)
                    }
                    placeholder="Type username..."
                    disabled={isDisabled}
                    className="w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 pl-9 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  {isWitnessSearchLoading && (
                    <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-purple-400" />
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => addWitness()}
                  disabled={
                    isDisabled ||
                    !witnessInput.trim() ||
                    localWitnesses.length >= 5
                  }
                  className="border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                >
                  Add
                </Button>
              </div>
              {showWitnessSuggestions && (
                <div className="relative z-10 mt-1">
                  <div className="absolute top-0 right-0 left-0 max-h-48 overflow-y-auto rounded-lg border border-purple-500/30 bg-purple-900/95 shadow-xl backdrop-blur-md">
                    {witnessSearchResults.length > 0 ? (
                      witnessSearchResults.map((u) => (
                        <UserSearchResult
                          key={u.id}
                          user={u}
                          onSelect={handleWitnessSelect}
                          field="witness"
                          currentUsername={currentUser?.username}
                          defendantUsername={localDefendant}
                        />
                      ))
                    ) : witnessSearchQuery.length >= 2 &&
                      !isWitnessSearchLoading ? (
                      <div className="px-4 py-3 text-center text-sm text-purple-300">
                        No users found for "{witnessSearchQuery}"
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-center text-sm text-purple-300">
                        Type at least 2 characters to search
                      </div>
                    )}
                  </div>
                </div>
              )}
              {localWitnesses.length > 0 && (
                <div className="mt-2 space-y-2">
                  {localWitnesses.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-purple-500/10 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-white">{w}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalWitnesses(
                            localWitnesses.filter((_, idx) => idx !== i),
                          )
                        }
                        disabled={isDisabled}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-purple-400">
                    {localWitnesses.length} of 5 witnesses added
                  </p>
                </div>
              )}
            </div>

            {/* Files */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Evidence Files <span className="text-red-500">*</span>
                {localFiles.length > 0 && (
                  <span className="ml-2 text-xs text-yellow-400">
                    Total: {getTotalFileSize(localFiles)}
                  </span>
                )}
              </label>
              <div
                className={`relative mb-2 rounded-lg border-2 border-dashed p-4 transition-colors ${isDragOver ? "border-purple-500/60 bg-purple-500/20" : "border-purple-500/30 bg-purple-500/10 hover:border-purple-500/50"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="reject-evidence-upload"
                  disabled={isDisabled}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="reject-evidence-upload"
                  className={`flex cursor-pointer flex-col items-center justify-center text-center ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Upload className="mb-2 h-5 w-5 text-purple-400" />
                  <span className="text-purple-300">
                    Click to upload or drag and drop
                  </span>
                  <p className="mt-1 text-xs text-gray-400">
                    Images <span className="text-yellow-300">(max 2MB)</span>,
                    documents <span className="text-yellow-300">(max 3MB)</span>{" "}
                    • Max 10 files, 50MB total
                  </p>
                </label>
              </div>
              {localFiles.length > 0 && (
                <div className="space-y-2">
                  {localFiles.map((file, i) => {
                    const isImg = file.type.startsWith("image/");
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-purple-500/10 p-2"
                      >
                        <div className="flex items-center gap-2">
                          {isImg && filePreviews[file.name] ? (
                            <img
                              src={filePreviews[file.name]}
                              alt={file.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <Paperclip className="h-4 w-4 text-purple-400" />
                          )}
                          <div>
                            <div className="text-sm text-white">
                              {file.name}
                            </div>
                            <div className="text-xs text-purple-300">
                              {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                              {isImg ? "Image" : "Document"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={isDisabled}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Transaction status */}
            {transactionStep !== "idle" && (
              <div className="my-4">
                <TransactionStatus
                  status={transactionStep}
                  onRetry={() =>
                    requestKind === DisputeTypeEnum.Paid &&
                    retryTransaction(votingIdToUse)
                  }
                  title={
                    transactionStep === "pending"
                      ? "Waiting for Wallet Confirmation..."
                      : transactionStep === "success"
                        ? "Payment Successful!"
                        : "Payment Failed"
                  }
                  description={
                    transactionStep === "pending"
                      ? "Please confirm the transaction in your wallet."
                      : transactionStep === "success"
                        ? "Your paid dispute is being activated..."
                        : "The transaction could not be completed. You can retry."
                  }
                />
              </div>
            )}

            {/* Summary */}
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                <div className="text-xs">
                  <p className="font-medium text-yellow-300">
                    What will happen:
                  </p>
                  <ul className="mt-1 space-y-1 text-yellow-200/80">
                    <li>• Dispute will be created with {localDefendant}</li>
                    <li>
                      • {localWitnesses.length} witness(es) will be invited
                    </li>
                    <li>
                      • {localFiles.length} evidence file(s) will be uploaded
                    </li>
                    <li>
                      • Type:{" "}
                      {requestKind === DisputeTypeEnum.ProBono
                        ? "Pro Bono"
                        : "Paid"}
                    </li>
                    {requestKind === DisputeTypeEnum.Paid && (
                      <li>• Smart contract transaction required</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDisabled}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className={`w-full py-2 sm:w-auto ${requestKind === DisputeTypeEnum.Paid ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20" : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20"} ${transactionStep === "success" ? "hidden" : ""}`}
            onClick={handleSubmit}
            disabled={isDisabled}
          >
            {isSubmitting || transactionStep === "pending" ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Dispute...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Dispute
              </>
            )}
          </Button>
          {transactionStep === "success" && (
            <Button
              variant="outline"
              className="w-full border-green-500/30 bg-green-500/10 text-green-300 sm:w-auto"
              disabled
            >
              ✓ Transaction Successful
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
