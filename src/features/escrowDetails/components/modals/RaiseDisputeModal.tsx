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
  Clock,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { toast } from "sonner";
import { disputeService } from "../../../../services/disputeServices";
import {
  DisputeTypeEnum,
  type CreateDisputeFromAgreementRequest,
} from "../../../../types";
import { UserSearchResult } from "../UserSearchResult";
import { useDebounce } from "../../hooks/useDebounce";
import {
  normalizeUsername,
  getTotalFileSize,
  formatUsernameForDisplay,
} from "../../utils/helpers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    data: CreateDisputeFromAgreementRequest,
    files: File[],
    probono: boolean,
  ) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  title?: string;
  description?: string;
  defendant?: string;
  witnesses?: string[];
  files?: File[];
  isSubmitting: boolean;
  agreement?: any;
  currentUser?: any;
}

export const RaiseDisputeModal = ({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  title = "",
  description = "",
  defendant = "",
  witnesses = [],
  files = [],
  isSubmitting,
  agreement,
  currentUser,
}: Props) => {
  const [proBono, setProBono] = useState<boolean | null>(null);
  const [localTitle, setLocalTitle] = useState(title || agreement?.title || "");
  const [localDescription, setLocalDescription] = useState(
    description || agreement?.description || "",
  );
  const [localDefendant, setLocalDefendant] = useState(defendant);
  const [localWitnesses, setLocalWitnesses] = useState<string[]>(witnesses);
  const [localFiles, setLocalFiles] = useState<File[]>(files);
  const [witnessInput, setWitnessInput] = useState("");
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  const defendantOptions = useMemo(() => {
    if (!agreement) return [];
    const currentUsername = currentUser?.username || "";
    return [
      agreement.firstParty?.username,
      agreement.counterParty?.username,
    ].filter((u) => u && u !== currentUsername);
  }, [agreement, currentUser]);

  useEffect(() => {
    if (agreement && !localDefendant && defendantOptions.length > 0) {
      const currentUsername = currentUser?.username || "";
      const other = defendantOptions.find((opt) => opt !== currentUsername);
      if (other) setLocalDefendant(other);
    }
  }, [agreement, localDefendant, defendantOptions, currentUser]);

  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

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
      setShowWitnessSuggestions(false);
      return;
    }
    if (normalizeUsername(formatted) === normalizeUsername(localDefendant)) {
      toast.error("The defendant cannot be added as a witness");
      setShowWitnessSuggestions(false);
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
      const currentTotal = localFiles.reduce((t, f) => t + f.size, 0);
      if (currentTotal + file.size > 50 * 1024 * 1024) {
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
    if (filePreviews[removed.name])
      setFilePreviews((p) => {
        const n = { ...p };
        delete n[removed.name];
        return n;
      });
  };

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
    if (proBono === null) {
      toast.error("Please select Pro Bono or Paid dispute type");
      return;
    }
    const totalSize = localFiles.reduce((t, f) => t + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      toast.error("Total file size too large");
      return;
    }

    const disputeData: CreateDisputeFromAgreementRequest = {
      title: localTitle,
      description: localDescription,
      requestKind: proBono ? DisputeTypeEnum.ProBono : DisputeTypeEnum.Paid,
      defendant: localDefendant,
      claim,
      witnesses: localWitnesses,
    };
    await onConfirm(disputeData, localFiles, proBono);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-4 shadow-2xl sm:p-6">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
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

        <div className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Enter dispute title"
                disabled={isSubmitting}
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
                        {formatUsernameForDisplay(localDefendant)}
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
                Defendant is automatically set to the other party and cannot be
                changed.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="Describe the dispute in detail"
                disabled={isSubmitting}
                className="h-32 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Claim */}
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-300">
                Formal Claim <span className="text-red-500">*</span>
              </label>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="State your formal claim against the defendant"
                disabled={isSubmitting}
                className="h-24 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Pro Bono / Paid */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-purple-300">
                Request Kind <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: true,
                    label: "Pro Bono",
                    sub: "No payment required",
                    activeClass:
                      "border-blue-400/50 bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/10",
                  },
                  {
                    value: false,
                    label: "Paid",
                    sub: "Small fee required",
                    activeClass:
                      "border-green-400/50 bg-green-500/20 text-green-300 shadow-lg shadow-green-500/10",
                  },
                ].map(({ value, label, sub, activeClass }) => (
                  <label
                    key={String(value)}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 text-center text-sm transition-all ${proBono === value ? activeClass : "border-purple-400/20 bg-purple-500/10 text-purple-300 hover:border-purple-400/40"} ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="feeOption"
                      checked={proBono === value}
                      onChange={() => setProBono(value)}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${proBono === value ? (value ? "border border-blue-400/50 bg-blue-500/30" : "border border-green-400/50 bg-green-500/30") : "border border-purple-400/30 bg-purple-500/20"}`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full ${proBono === value ? (value ? "bg-blue-400" : "bg-green-400") : "border border-purple-400"}`}
                      />
                    </div>
                    <span className="font-medium">{label}</span>
                    <span className="text-xs opacity-80">{sub}</span>
                  </label>
                ))}
              </div>
              {proBono === null && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-2">
                  <Info className="mt-0.5 h-4 w-4 text-yellow-400" />
                  <p className="text-xs text-yellow-300/90">
                    Please select Pro Bono or Paid to continue.
                  </p>
                </div>
              )}
              {proBono !== null && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-purple-500/10 p-2">
                  <Info className="mt-0.5 h-4 w-4 text-purple-400" />
                  <p className="text-xs text-purple-300/90">
                    {proBono
                      ? "Pro Bono disputes may have longer wait times."
                      : "Paid disputes ensure faster processing."}
                  </p>
                </div>
              )}
              {proBono === false && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-green-500/10 p-2">
                  <DollarSign className="mt-0.5 h-4 w-4 text-green-400" />
                  <p className="text-xs text-green-300/90">
                    A small fee will be required when you confirm the dispute.
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
                    disabled={isSubmitting}
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
                    isSubmitting ||
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
                        disabled={isSubmitting}
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
                  id="evidence-upload"
                  disabled={isSubmitting}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="evidence-upload"
                  className={`flex cursor-pointer flex-col items-center justify-center text-center ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
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
                          disabled={isSubmitting}
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
                      {proBono === null
                        ? "Not selected"
                        : proBono
                          ? "Pro Bono"
                          : "Paid"}
                    </li>
                    {proBono === false && <li>• Small fee will be required</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20 sm:w-auto"
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
