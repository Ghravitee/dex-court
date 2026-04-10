/* eslint-disable @typescript-eslint/no-explicit-any */
import { Info, Search, Loader2, Wallet, Send, CheckCircle } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { UserSearchResult } from "../UserSearchResult";
import { EvidenceUpload } from "./EvidenceUpload";
import { WitnessFields } from "./WitnessFields";
import { TransactionStatus } from "../TransactionStatus";
import type { DisputeFormState } from "../../types/form";
// import type { UploadedFile } from "../../types/form";

interface DefendantSearchState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  results: any[];
  isLoading: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  ref: React.RefObject<HTMLDivElement | null>;
}

interface WitnessSearchState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  results: any[];
  isLoading: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  ref: React.RefObject<HTMLDivElement | null>;
}

interface Props {
  form: DisputeFormState;
  setForm: React.Dispatch<React.SetStateAction<DisputeFormState>>;
  isDisabled: boolean;
  isSubmitting: boolean;
  transactionStep: "idle" | "pending" | "success" | "error";
  votingIdToUse: number;
  isDragOver: boolean;
  defendantSearch: DefendantSearchState;
  witnessSearch: WitnessSearchState;
  onSubmit: (e: React.FormEvent) => void;
  onRetryTransaction: () => void;
  onSaveDraft: () => void;
  onAddWitness: () => void;
  onUpdateWitness: (i: number, v: string) => void;
  onRemoveWitness: (i: number) => void;
  onRemoveFile: (id: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onUserSelect: (
    username: string,
    field: "defendant" | "witness",
    index?: number,
  ) => void;

  displayChains: Array<{
    mainnetId: number;
    name: string;
    symbol: string;
    icon: string;
  }>;
  isProd: boolean;
  selectedMainnetId: number | null;
  isConnected: boolean;
  onSelectChain: (mainnetId: number) => Promise<void>;
}

export const DisputeForm = ({
  form,
  setForm,
  isDisabled,
  isSubmitting,
  transactionStep,
  votingIdToUse,
  isDragOver,
  defendantSearch,
  witnessSearch,
  onSubmit,
  onRetryTransaction,
  onSaveDraft,
  onAddWitness,
  onUpdateWitness,
  onRemoveWitness,
  onRemoveFile,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onUserSelect,
  displayChains,
  isProd,
  selectedMainnetId,
  isConnected,
  onSelectChain,
}: Props) => (
  <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
    {/* Transaction status banner */}
    {transactionStep !== "idle" && (
      <div className="mb-4">
        <TransactionStatus
          status={transactionStep}
          onRetry={onRetryTransaction}
        />
      </div>
    )}

    <form
      onSubmit={onSubmit}
      className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
    >
      {/* Title */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-muted-foreground text-sm">
            Title <span className="text-red-500">*</span>
          </label>
          <div className="group relative cursor-help">
            <Info className="h-4 w-4 text-cyan-300" />
            <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
              Never underestimate the power of a catchy title — it can grab
              attention and attract judges to your case faster.
            </div>
          </div>
        </div>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
          placeholder="e.g. He refused to issue a refund despite going AWOL for weeks!"
          disabled={isDisabled}
        />
      </div>

      {/* Request Kind */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-muted-foreground text-sm">
            Request Kind <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3 text-xs">
            {[
              {
                label: "Pro Bono",
                tip: "No payment required. Judges will handle your case pro bono when available.",
              },
              {
                label: "Paid",
                tip: "A fee is required to initiate your dispute. This helps prioritize your case.",
              },
            ].map(({ label, tip }) => (
              <div key={label} className="group relative cursor-pointer">
                <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                  {label}
                </span>
                <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  {tip}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["Pro Bono", "Paid"] as const).map((kind) => (
            <label
              key={kind}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${form.kind === kind
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

      {/* ── Chain selector (only for Paid disputes) ─────────── */}
      {form.kind === "Paid" && (
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
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 p-3 transition-all ${selectedMainnetId === chain.mainnetId
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                  }`}
              >
                <img src={chain.icon} alt={chain.name} className="h-8 w-8 rounded-full" />
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
            <div className="mt-1 text-xs text-red-400">Please select a network</div>
          )}

          {/* Wallet warning */}
          {!isConnected && (
            <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              ⚠️ You need to connect and authenticate your wallet to create a paid dispute.
            </div>
          )}
        </div>
      )}

      {/* Defendant */}
      <div className="relative" ref={defendantSearch.ref}>
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
              defendantSearch.setSearchQuery(value);
            }}
            onFocus={() => {
              if (form.defendant.replace(/^@/, "").trim().length >= 1) {
                defendantSearch.setShowSuggestions(true);
              }
            }}
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="Type username (with or without @)..."
            required
            disabled={isDisabled}
          />
          {defendantSearch.isLoading && (
            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
          )}
        </div>

        {/* Suggestions */}
        {defendantSearch.showSuggestions && (
          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
            {defendantSearch.results.length > 0 ? (
              defendantSearch.results.map((user) => (
                <UserSearchResult
                  key={user.id}
                  user={user}
                  onSelect={onUserSelect}
                  field="defendant"
                />
              ))
            ) : defendantSearch.searchQuery.replace(/^@/, "").trim().length >=
              1 && !defendantSearch.isLoading ? (
              <div className="px-4 py-3 text-center text-sm text-cyan-300">
                No users found for "
                {defendantSearch.searchQuery.replace(/^@/, "")}"
                <div className="mt-1 text-xs text-cyan-400">
                  You may also enter a wallet address directly
                </div>
              </div>
            ) : null}

            {defendantSearch.searchQuery.replace(/^@/, "").trim().length <
              1 && (
                <div className="px-4 py-3 text-center text-sm text-cyan-300">
                  Type at least 1 character to search
                </div>
              )}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-muted-foreground mb-2 block text-sm">
          Detailed Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
          placeholder="Describe the situation, milestones, messages, and expectations"
          disabled={isDisabled}
        />
      </div>

      {/* Claim */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-muted-foreground text-sm">
            Claim <span className="text-red-500">*</span>
          </label>
          <div className="group relative cursor-help">
            <Info className="h-4 w-4 text-cyan-300" />
            <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
              Make sure it's reasonable, as that might help your case when the
              judges look into it.
            </div>
          </div>
        </div>
        <textarea
          value={form.claim || ""}
          onChange={(e) => setForm({ ...form, claim: e.target.value })}
          className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-sm focus:border-cyan-400/40"
          placeholder="What do you want the court to do for you?"
          disabled={isDisabled}
        />
      </div>

      {/* Evidence */}
      <EvidenceUpload
        evidence={form.evidence}
        isDragOver={isDragOver}
        isDisabled={isDisabled}
        onFileSelect={onFileSelect}
        onRemoveFile={onRemoveFile}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />

      {/* Witnesses */}
      <WitnessFields
        witnesses={form.witnesses}
        isDisabled={isDisabled}
        witnessSearch={witnessSearch}
        onAddWitness={onAddWitness}
        onUpdateWitness={onUpdateWitness}
        onRemoveWitness={onRemoveWitness}
        onUserSelect={onUserSelect}
      />

      {/* Paid dispute info card */}
      {form.kind === "Paid" && transactionStep === "idle" && !isSubmitting && (
        <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-cyan-300" />
            <h4 className="text-sm font-medium text-cyan-200">
              Smart Contract Transaction Required
            </h4>
          </div>
          <p className="mt-2 text-xs text-cyan-300/80">
            For paid disputes, you'll need to confirm a transaction in your
            wallet to record the dispute on-chain. This ensures transparency and
            security for your case.
          </p>
          <div className="mt-3 text-xs text-cyan-400">
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Generated Voting ID: {votingIdToUse}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Network: {displayChains.find(c => c.mainnetId === selectedMainnetId)?.name ?? "Not selected"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-3">
        <Button
          type="button"
          variant="outline"
          className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
          onClick={onSaveDraft}
          disabled={isDisabled}
        >
          Save Draft
        </Button>
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
              <Send className="mr-2 h-4 w-4" />
              {form.kind === "Paid" ? "Pay & Submit Dispute" : "Submit Dispute"}
            </>
          )}
        </Button>
      </div>
    </form>
  </div>
);
