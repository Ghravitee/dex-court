import { EscrowForm } from "./EscrowForm";
import type { CreationStep, EscrowFormState, EscrowType } from "../../types";
import { SUPPORTED_CHAINS } from "../../../../web3/config";

interface DisplayChain {
  mainnetId: number;
  label: string;
  name: string;
  symbol: string;
  icon: string;
}

interface EscrowModalProps {
  open: boolean;
  onClose: () => void;
  // Form
  form: EscrowFormState;
  setForm: React.Dispatch<React.SetStateAction<EscrowFormState>>;
  deadline: Date | null;
  setDeadline: (d: Date | null) => void;
  escrowType: EscrowType;
  setEscrowType: (t: EscrowType) => void;
  // Submit
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isTxPending: boolean;
  isApprovalPending: boolean;
  isApprovingToken: boolean;
  // File handlers
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;
  handleDrop: (e: React.DragEvent) => void;
  // Status
  uiError: string | null;
  uiSuccess: string | null;
  creationStep: CreationStep;
  currentStepMessage: string;
  txHash?: string;
  onRetry: () => void;
  // Chain selection
  displayChains: DisplayChain[];
  isProd: boolean;
  resolvedChainId: number | null;
  selectedMainnetId: number | null;
  onSelectChain: (mainnetId: number) => Promise<void>;
}

export function EscrowModal({
  open,
  onClose,
  form,
  setForm,
  deadline,
  setDeadline,
  escrowType,
  setEscrowType,
  onSubmit,
  isSubmitting,
  isTxPending,
  isApprovalPending,
  isApprovingToken,
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
  resolvedChainId,
  selectedMainnetId,
  onSelectChain,
}: EscrowModalProps) {
  if (!open) return null;

  const footerNote = () => {
    // Get the native symbol from SUPPORTED_CHAINS using the mainnetId
    const nativeSymbol =
      form.token === "ETH" && selectedMainnetId
        ? (SUPPORTED_CHAINS.find((c) => c.mainnetId === selectedMainnetId)?.symbol ?? "ETH")
        : form.token;

    if (escrowType === "myself" && form.payer === "me") {
      return (
        <p className="text-muted-foreground mt-4 text-xs">
          After signing, you will be prompted to deposit{" "}
          <span className="text-cyan-300">
            {form.amount || "amount"} {nativeSymbol}
          </span>{" "}
          to activate this escrow.
        </p>
      );
    }
    if (escrowType === "myself" && form.payer === "counterparty") {
      return (
        <p className="text-muted-foreground mt-4 text-xs">
          Counterparty will be notified to deposit funds. You can sign immediately.
        </p>
      );
    }
    if (escrowType === "others") {
      const payer = form.payerOther === "partyA" ? form.partyA : form.partyB;
      return (
        <p className="text-muted-foreground mt-4 text-xs">
          {payer || "The selected party"} will be notified to deposit funds. Both
          parties can sign immediately.
        </p>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="relative w-full max-w-2xl rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6 shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          ✕
        </button>

        <div className="mb-5 border-b border-white/10 pb-3">
          <h2 className="text-lg font-semibold text-white/90">
            Create New Escrow
          </h2>
          <p className="text-muted-foreground text-sm">
            Set up agreement details, funding, and milestones.
          </p>
        </div>

        <EscrowForm
          form={form}
          setForm={setForm}
          deadline={deadline}
          setDeadline={setDeadline}
          escrowType={escrowType}
          setEscrowType={setEscrowType}
          isSubmitting={isSubmitting}
          isTxPending={isTxPending}
          isApprovalPending={isApprovalPending}
          isApprovingToken={isApprovingToken}
          uiError={uiError}
          uiSuccess={uiSuccess}
          onSubmit={onSubmit}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          handleDrop={handleDrop}
          creationStep={creationStep}
          currentStepMessage={currentStepMessage}
          txHash={txHash}
          onRetry={onRetry}
          displayChains={displayChains}
          isProd={isProd}
          selectedMainnetId={selectedMainnetId}
          resolvedChainId={resolvedChainId}
          onSelectChain={onSelectChain}
        />

        {footerNote()}
      </div>
    </div>
  );
}
