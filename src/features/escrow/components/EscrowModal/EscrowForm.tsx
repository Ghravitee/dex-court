import { useRef, useState, useEffect } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Info,
  User,
  Users,
  ChevronDown,
  Calendar,
  Upload,
  Paperclip,
  Trash2,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { TYPE_OPTIONS, TOKEN_OPTIONS } from "../../constants";
import { getTotalFileSize } from "../../utils/formatters";
import {
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_TOTAL_SIZE,
} from "../../constants";
import type {
  CreationStep,
  EscrowFormState,
  EscrowType,
  UploadedFile,
} from "../../types";
import { CreationProgress } from "./CreationProgress";
import { StatusMessages } from "./StatusMessages";

interface EscrowFormProps {
  form: EscrowFormState;
  setForm: React.Dispatch<React.SetStateAction<EscrowFormState>>;
  deadline: Date | null;
  setDeadline: (d: Date | null) => void;
  escrowType: EscrowType;
  setEscrowType: (t: EscrowType) => void;
  isSubmitting: boolean;
  isTxPending: boolean;
  isApprovalPending: boolean;
  isApprovingToken: boolean;
  onSubmit: (e: React.FormEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;
  handleDrop: (e: React.DragEvent) => void;
  // Status messages
  uiError: string | null;
  uiSuccess: string | null;
  // Creation progress
  creationStep: CreationStep;
  currentStepMessage: string;
  txHash?: string;
  onRetry: () => void;
  // Chain selection
  displayChains: Array<{
    mainnetId: number;
    label: string;
    name: string;
    symbol: string;
    icon: string;
  }>;
  isProd: boolean;
  selectedMainnetId: number | null;
  onSelectChain: (mainnetId: number) => Promise<void>;
}

export function EscrowForm({
  form,
  setForm,
  deadline,
  setDeadline,
  escrowType,
  setEscrowType,
  isSubmitting,
  isTxPending,
  isApprovalPending,
  isApprovingToken,
  onSubmit,
  handleFileSelect,
  removeFile,
  handleDrop,
  uiError,
  uiSuccess,
  creationStep,
  currentStepMessage,
  txHash,
  onRetry,
  displayChains,
  isProd,
  selectedMainnetId,
  onSelectChain,
}: EscrowFormProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node))
        setIsTypeOpen(false);
      if (tokenRef.current && !tokenRef.current.contains(e.target as Node))
        setIsTokenOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const busy =
    isSubmitting || isTxPending || isApprovalPending || isApprovingToken;

  return (
    <form
      onSubmit={onSubmit}
      className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
    >
      {/* ── Escrow type ─────────────────────────────────────────────────── */}
      <div>
        <label className="text-muted-foreground mb-3 block text-sm font-semibold">
          Who is this escrow for? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {(["myself", "others"] as EscrowType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEscrowType(t)}
              className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                escrowType === t
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
              }`}
            >
              {t === "myself" ? (
                <User className="mb-2 h-6 w-6" />
              ) : (
                <Users className="mb-2 h-6 w-6" />
              )}
              <span className="text-sm font-medium">
                {t === "myself" ? "Myself & Counterparty" : "Two Other Parties"}
              </span>
              <span className="mt-1 text-xs opacity-70">
                {t === "myself"
                  ? "Escrow between you and someone else"
                  : "Escrow between two other users"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Role info banner ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-400/20 bg-blue-500/5 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
          <div>
            <h4 className="text-sm font-medium text-blue-300">
              Understanding Escrow Roles
            </h4>
            <ul className="mt-1 space-y-1 text-xs text-blue-300/80">
              <li>
                <span className="font-medium">Service Provider:</span> Receives
                funds, delivers work/service
              </li>
              <li>
                <span className="font-medium">Service Recipient:</span> Pays
                funds into escrow, receives work/service
              </li>
              <li className="text-blue-200">
                <span className="font-medium">⚠️ Important:</span> The same
                party cannot be both provider and recipient
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Chain selector ────────────────────────────────────────────────── */}
      <div>
        <label className="text-muted-foreground mb-3 block text-sm font-semibold">
          Select Network <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {displayChains.map((chain) => (
            <button
              key={chain.mainnetId}
              type="button"
              onClick={() => onSelectChain(chain.mainnetId)}
              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                selectedMainnetId === chain.mainnetId
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
              }`}
            >
              <img
                src={chain.icon}
                alt={chain.name}
                className="h-8 w-8 rounded-full"
              />
              <span className="text-xs font-medium">{chain.name}</span>
              <span className="text-[10px] opacity-60">
                {isProd ? chain.symbol : `${chain.symbol} Testnet`}
              </span>
              {selectedMainnetId === chain.mainnetId && (
                <CheckCircle className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-cyan-400" />
              )}
            </button>
          ))}
        </div>
        {!selectedMainnetId && (
          <div className="mt-1 text-xs text-red-400">
            Please select a network
          </div>
        )}
      </div>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-muted-foreground text-sm">
            Title <span className="text-red-500">*</span>
          </label>
          <div className="group relative cursor-help">
            <Info className="h-4 w-4 text-cyan-300" />
            <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
              A clear title helps both parties understand the agreement scope.
            </div>
          </div>
        </div>
        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
          placeholder="e.g. Website Design & Development"
          required
        />
        {!form.title.trim() && (
          <div className="mt-1 text-xs text-red-400">Please enter a title</div>
        )}
      </div>

      {/* ── Type + Who Pays ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Type dropdown */}
        <div className="relative flex w-full flex-col gap-2" ref={typeRef}>
          <label className="text-muted-foreground text-sm">
            Type <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => setIsTypeOpen((p) => !p)}
            className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          >
            <span>
              {form.type
                ? TYPE_OPTIONS.find((t) => t.value === form.type)?.label
                : "Select Type"}
            </span>
            <ChevronDown
              className={`transition-transform ${isTypeOpen ? "rotate-180" : ""}`}
            />
          </div>
          {isTypeOpen && (
            <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
              {TYPE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      type: opt.value as "public" | "private",
                    }));
                    setIsTypeOpen(false);
                  }}
                  className="cursor-pointer px-4 py-2 text-sm text-white/80 hover:bg-cyan-500/30 hover:text-white"
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
          {!form.type && (
            <div className="mt-1 text-xs text-red-400">
              Please select escrow type
            </div>
          )}
        </div>

        {/* Who pays */}
        {escrowType === "myself" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-muted-foreground text-sm">
                Who Pays? <span className="text-red-500">*</span>
              </label>
              <div className="group relative cursor-help">
                <Info className="h-4 w-4 text-cyan-300" />
                <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  The payer is the <strong>service recipient</strong> who funds
                  the escrow.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["me", "counterparty"] as const).map((p) => (
                <label
                  key={p}
                  className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${
                    form.payer === p
                      ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  <input
                    type="radio"
                    name="payer"
                    className="hidden"
                    checked={form.payer === p}
                    onChange={() => setForm((prev) => ({ ...prev, payer: p }))}
                  />
                  {p === "me" ? "Me" : "Counterparty"}
                </label>
              ))}
            </div>
            {!form.payer && (
              <div className="mt-1 text-xs text-red-400">
                Please select who pays
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-muted-foreground text-sm">
                Who Pays? <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["partyA", "partyB"] as const).map((p) => (
                <label
                  key={p}
                  className={`cursor-pointer rounded-md border px-2 py-3 text-center text-xs transition hover:border-cyan-400/40 ${
                    form.payerOther === p
                      ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  <input
                    type="radio"
                    name="payerOther"
                    className="hidden"
                    checked={form.payerOther === p}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, payerOther: p }))
                    }
                  />
                  {p === "partyA" ? "First Party" : "Second Party"}
                </label>
              ))}
            </div>
            {!form.payerOther && (
              <div className="mt-1 text-xs text-red-400">
                Please select who pays
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Party addresses ───────────────────────────────────────────────── */}
      {escrowType === "myself" ? (
        <div>
          <label className="text-muted-foreground mb-2 block text-sm">
            Counterparty <span className="text-red-500">*</span>
          </label>
          <input
            value={form.counterparty}
            onChange={(e) =>
              setForm((p) => ({ ...p, counterparty: e.target.value }))
            }
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="0x..."
            required
          />
          {!form.counterparty.trim() && (
            <div className="mt-1 text-xs text-red-400">
              Please enter counterparty's wallet address
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(["partyA", "partyB"] as const).map((key) => (
            <div key={key}>
              <label className="text-muted-foreground mb-2 block text-sm">
                {key === "partyA" ? "First Party" : "Second Party"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                value={form[key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
                placeholder="0x..."
                required
              />
              {!form[key].trim() && (
                <div className="mt-1 text-xs text-red-400">
                  Please enter {key === "partyA" ? "first" : "second"} party's
                  wallet address
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Token + Amount ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Token dropdown */}
        <div className="relative flex w-full flex-col gap-2" ref={tokenRef}>
          <label className="text-muted-foreground text-sm">
            Payment Token <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => setIsTokenOpen((p) => !p)}
            className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          >
            <span>
              {form.token
                ? TOKEN_OPTIONS.find((t) => t.value === form.token)?.label
                : "Select Token"}
            </span>
            <ChevronDown
              className={`transition-transform ${isTokenOpen ? "rotate-180" : ""}`}
            />
          </div>
          {isTokenOpen && (
            <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
              {TOKEN_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      token: opt.value,
                      customTokenAddress:
                        opt.value === "custom" ? p.customTokenAddress : "",
                    }));
                    setIsTokenOpen(false);
                  }}
                  className="cursor-pointer px-4 py-2 text-sm text-white/80 hover:bg-cyan-500/30 hover:text-white"
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
          {form.token === "custom" && (
            <div className="mt-3">
              <label className="text-muted-foreground mb-2 block text-sm">
                Paste Contract Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.customTokenAddress}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customTokenAddress: e.target.value }))
                }
                placeholder="0x..."
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                required
              />
            </div>
          )}
          {form.token === "custom" && !form.customTokenAddress.trim() && (
            <div className="mt-1 text-xs text-red-400">
              Please enter custom token address
            </div>
          )}
          {!form.token && (
            <div className="mt-1 text-xs text-red-400">
              Please select payment token
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-muted-foreground mb-2 block text-sm">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="1000"
            min="0"
            step="0.01"
            required
          />
          {(!form.amount.trim() ||
            isNaN(Number(form.amount)) ||
            Number(form.amount) <= 0) && (
            <div className="mt-1 text-xs text-red-400">
              Please enter a valid amount
            </div>
          )}
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <div>
        <label className="text-muted-foreground mb-2 block text-sm">
          Detailed Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-sm placeholder:text-white/50 focus:border-cyan-400/40"
          placeholder="Describe deliverables, expectations, and terms"
          required
        />
        {!form.description.trim() && (
          <div className="mt-1 text-xs text-red-400">
            Please enter a description
          </div>
        )}
      </div>

      {/* ── File upload ───────────────────────────────────────────────────── */}
      <div>
        <label className="text-muted-foreground mb-2 block text-sm">
          Supporting Documents
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
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            setIsDragOver(false);
            handleDrop(e);
          }}
        >
          <input
            onChange={handleFileSelect}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt"
            className="hidden"
            id="escrow-upload"
          />
          <label
            htmlFor="escrow-upload"
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
              <span className="text-yellow-300">
                (max {MAX_IMAGE_SIZE / 1024 / 1024}MB)
              </span>
              , documents{" "}
              <span className="text-yellow-300">
                (max {MAX_DOCUMENT_SIZE / 1024 / 1024}MB)
              </span>
            </div>
            <div className="mt-1 text-xs text-red-400">
              Total limit: {MAX_TOTAL_SIZE / 1024 / 1024}MB
            </div>
          </label>
        </div>

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
            {form.evidence.map((file: UploadedFile) => (
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

      {/* ── Milestones ────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <label className="text-muted-foreground block text-sm font-medium">
              Payment Milestones{" "}
              <span className="font-normal text-white/40">(optional)</span>
            </label>
            <p className="mt-0.5 text-xs text-white/40">
              Split the payment into stages — set what % is released and when.
              Percentages must add up to 100%.
            </p>
          </div>
        </div>

        {form.milestones.length > 0 && (
          <div className="mb-3 space-y-2">
            {form.milestones.map((m, idx) => {
              const totalSoFar = form.milestones.reduce(
                (sum, ms, i) =>
                  i !== idx ? sum + (Number(ms.percent) || 0) : sum,
                0,
              );
              const remaining = 100 - totalSoFar;

              return (
                <div
                  key={idx}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-300">
                      Milestone {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = form.milestones.filter(
                          (_, i) => i !== idx,
                        );
                        setForm((p) => ({ ...p, milestones: next }));
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Percentage */}
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs">
                        % of total amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={m.percent}
                          onChange={(e) => {
                            const next = [...form.milestones];
                            next[idx] = {
                              ...next[idx],
                              percent: e.target.value,
                            };
                            setForm((p) => ({ ...p, milestones: next }));
                          }}
                          placeholder={`e.g. ${remaining > 0 ? remaining : 50}`}
                          className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-8 pl-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/40"
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-white/50">
                          %
                        </span>
                      </div>
                      {m.percent &&
                        (Number(m.percent) <= 0 || Number(m.percent) > 100) && (
                          <p className="mt-1 text-[10px] text-red-400">
                            Must be between 1–100
                          </p>
                        )}
                    </div>

                    {/* Release date */}
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs">
                        Release date
                      </label>
                      <ReactDatePicker
                        selected={m.date}
                        onChange={(date) => {
                          const next = [...form.milestones];
                          next[idx] = { ...next[idx], date };
                          setForm((p) => ({ ...p, milestones: next }));
                        }}
                        placeholderText="Pick a date"
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        maxDate={deadline ?? undefined}
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/40"
                        calendarClassName="!bg-cyan-700 !text-white rounded-lg border border-white/10"
                        popperClassName="z-50"
                      />
                      {!m.date && (
                        <p className="mt-1 text-[10px] text-white/40">
                          Optional — defaults to deadline
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline amount preview */}
                  {m.percent && form.amount && Number(m.percent) > 0 && (
                    <p className="mt-2 text-[10px] text-cyan-300/70">
                      ≈{" "}
                      {(
                        (Number(m.percent) / 100) *
                        Number(form.amount)
                      ).toFixed(4)}{" "}
                      {form.token || "tokens"} released on this milestone
                    </p>
                  )}
                </div>
              );
            })}

            {/* Running total */}
            {form.milestones.length > 0 && (
              <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs text-white/50">Total allocated</span>
                <span
                  className={`text-xs font-semibold ${
                    form.milestones.reduce(
                      (s, m) => s + (Number(m.percent) || 0),
                      0,
                    ) === 100
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {form.milestones.reduce(
                    (s, m) => s + (Number(m.percent) || 0),
                    0,
                  )}
                  % / 100%
                </span>
              </div>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
          onClick={() =>
            setForm((p) => ({
              ...p,
              milestones: [...p.milestones, { percent: "", date: null }],
            }))
          }
        >
          + Add Milestone
        </Button>
      </div>

      {/* ── Deadline ──────────────────────────────────────────────────────── */}
      <div>
        <label className="text-muted-foreground mb-2 block text-sm">
          Deadline <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="pointer-events-none absolute top-[1.3rem] left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
          <ReactDatePicker
            selected={deadline}
            onChange={setDeadline}
            placeholderText="Select a date"
            dateFormat="dd/MM/yyyy"
            className="w-full cursor-pointer rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
            calendarClassName="!bg-cyan-700 !text-white rounded-lg border border-white/10"
            popperClassName="z-50"
            minDate={new Date()}
            required
          />
          {!deadline && (
            <div className="mt-1 text-xs text-red-400">
              Please select a deadline
            </div>
          )}
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-3">
        <Button
          type="submit"
          variant="neon"
          className="neon-hover"
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isApprovingToken ? "Approving..." : "Creating..."}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Create Escrow
            </>
          )}
        </Button>
      </div>

      {/* ── Status messages ────────────────────────────────────────────── */}
      <StatusMessages
        uiError={uiError}
        uiSuccess={uiSuccess}
        isTxPending={isTxPending}
        isApprovalPending={isApprovalPending}
      />

      {/* ── Creation progress ──────────────────────────────────────────── */}
      <CreationProgress
        creationStep={creationStep}
        currentStepMessage={currentStepMessage}
        txHash={txHash}
        onRetry={onRetry}
      />
    </form>
  );
}
