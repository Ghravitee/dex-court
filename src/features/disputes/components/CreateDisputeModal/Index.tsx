import { useEffect, useState } from "react";
import { X, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
// import { cleanTelegramUsername } from "../../../../lib/usernameUtils";
import { DisputeForm } from "./DisputeForm";
import { useDisputeForm } from "../../hooks/useDisputeForm";
import { useDisputeSubmit } from "../../hooks/useDisputeSubmit";
import { useUserSearch } from "../../hooks/useUserSearch";
import { useAccount, useSwitchChain } from "wagmi";
import { useChainSelection } from "../../../../config/useChainSelection";
// import { INITIAL_FORM_STATE } from "../../types/form";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDisputeCreated: () => void;
}

export const CreateDisputeModal = ({
  isOpen,
  onClose,
  onDisputeCreated,
}: Props) => {
  const {
    form,
    setForm,
    resetForm,
    isDragOver,
    addWitness,
    updateWitness,
    removeWitness,
    removeFile,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDisputeForm();

  const userSearch = useUserSearch();

  const { isConnected, address } = useAccount();
  const { resolveChainId, displayChains, isProd } = useChainSelection();
  const [selectedMainnetId, setSelectedMainnetId] = useState<number | null>(null);
  const { switchChainAsync } = useSwitchChain();

  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const handleSelectChain = async (mainnetId: number) => {
    if (isSwitchingChain) return; // prevent duplicate requests

    setIsSwitchingChain(true);
    setSelectedMainnetId(mainnetId); // optimistic update
    const resolved = resolveChainId(mainnetId);
    try {
      await switchChainAsync({ chainId: resolved });
    } catch (err) {
      // -32002 means MetaMask already has a pending request
      if (err === -32002) {
        toast.error("MetaMask is busy", {
          description: "Please open MetaMask and complete the pending request first.",
        });
      } else {
        toast.error("Failed to switch chain");
      }
      setSelectedMainnetId(null); // revert optimistic update
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const resolvedChainId = selectedMainnetId
    ? resolveChainId(selectedMainnetId)
    : null;

  const {
    submit,
    isSubmitting,
    transactionStep,
    isProcessingPaidDispute,
    retryTransaction,
    resetOnModalClose,
    votingIdToUse,

    isDisabled,
  } = useDisputeSubmit({
    onSuccess: () => {
      resetForm();
      onClose();
      onDisputeCreated();
    },
    reloadDisputes: onDisputeCreated,
    selectedChainId: resolvedChainId,
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetOnModalClose();
    }
  }, [isOpen, resetOnModalClose]);

  if (!isOpen) return null;

  const handleUserSelect = (
    username: string,
    field: "defendant" | "witness",
    index?: number,
  ) => {
    const valueWithAt = `@${username}`;
    if (field === "defendant") {
      setForm((prev) => ({ ...prev, defendant: valueWithAt }));
      userSearch.defendant.setShowSuggestions(false);
      userSearch.defendant.setSearchQuery("");
    } else if (field === "witness" && index !== undefined) {
      updateWitness(index, valueWithAt);
      userSearch.witness.setShowSuggestions(false);
      userSearch.witness.setSearchQuery("");
    }
  };

  const handleSaveDraft = () => {
    toast.message("Draft saved", {
      description: "Your dispute has been saved as draft",
    });
    onClose();
  };

  const handleClose = () => {
    if (!isSubmitting && !isProcessingPaidDispute) onClose();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-cyan-300" />
              <h3 className="text-xl font-semibold text-cyan-300">
                Raise New Dispute
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
              disabled={
                isSubmitting ||
                transactionStep === "pending" ||
                isProcessingPaidDispute
              }
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <DisputeForm
            form={form}
            setForm={setForm}
            isDisabled={isDisabled}
            isSubmitting={isSubmitting}
            transactionStep={transactionStep}
            votingIdToUse={votingIdToUse}
            isDragOver={isDragOver}
            defendantSearch={userSearch.defendant}
            witnessSearch={userSearch.witness}
            onSubmit={(e) => {
              if (form.kind === "Paid") {
                if (!isConnected || !address) {
                  toast.error("Wallet required", {
                    description: "Please connect and authenticate your wallet to create a paid dispute.",
                  });
                  return;
                }
                if (!selectedMainnetId) {
                  toast.error("Please select a network");
                  return;
                }
              }
              submit(e, form);
            }}
            onRetryTransaction={() => retryTransaction(form.kind)}
            onSaveDraft={handleSaveDraft}
            onAddWitness={addWitness}
            onUpdateWitness={updateWitness}
            onRemoveWitness={removeWitness}
            onRemoveFile={removeFile}
            onFileSelect={handleFileSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onUserSelect={handleUserSelect}
            displayChains={displayChains}
            isProd={isProd}
            selectedMainnetId={selectedMainnetId}
            isConnected={isConnected}
            onSelectChain={handleSelectChain}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
