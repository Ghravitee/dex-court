import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { useChainSelection } from "../../config/useChainSelection";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";
import { ERC20_ABI, ESCROW_CA, SUPPORTED_CHAINS } from "../../web3/config";
import { isValidAddress } from "../../web3/helper";
import { useAuth } from "../../hooks/useAuth";

// Feature imports
import { useEscrowList } from "./hooks/useEscrowList";
import { useEscrowForm } from "./hooks/useEscrowForm";
import { useEscrowCreation } from "./hooks/useEscrowCreation";
import { EscrowCard } from "./components/EscrowCard";
import { EscrowSkeleton } from "./components/EscrowSkeleton";
import { EscrowFilters } from "./components/EscrowFilters";
import { EscrowModal } from "./components/EscrowModal";
import { NetworkWarning } from "./components/EscrowModal/NetworkWarning";
import { StatusMessages } from "./components/EscrowModal/StatusMessages";
import { MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE, MAX_TOTAL_SIZE } from "./constants";

export default function EscrowPage() {
  const { isConnected } = useAccount();
  const { user: currentUser } = useAuth();
  const { switchChainAsync } = useSwitchChain();

  // ── Chain selection ───────────────────────────────────────────────────────
  const { resolveChainId, displayChains, isProd } = useChainSelection();
  const [selectedMainnetId, setSelectedMainnetId] = useState<number | null>(
    null,
  );

  const activeChainId = selectedMainnetId
    ? resolveChainId(selectedMainnetId)
    : resolveChainId(SUPPORTED_CHAINS[0].mainnetId);

  // ── Contract address ──────────────────────────────────────────────────────
  const contractAddress = useMemo(() => {
    if (!activeChainId) return undefined;
    const addr = ESCROW_CA[activeChainId as number];
    if (addr && isValidAddress(addr)) return addr as `0x${string}`;
    return undefined;
  }, [activeChainId]);

  const [chainConfigError, setChainConfigError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Feature hooks ────────────────────────────────────────────────────────
  const {
    allEscrows,
    visibleEscrows,
    filteredEscrows,
    loading,
    error,
    loadEscrowAgreements,
    statusTab,
    setStatusTab,
    sortAsc,
    setSortAsc,
    query,
    setQuery,
    currentPage,
    totalPages,
    startItem,
    endItem,
    handlePageChange,
    handlePageSizeChange,
    pageSize,
  } = useEscrowList();

  const {
    form,
    setForm,
    deadline,
    setDeadline,
    escrowType,
    setEscrowType,
    resetForm,
    handleFileSelect,
    removeFile,
    handleDrop,
  } = useEscrowForm();

  const handleSuccess = useCallback(() => {
    setOpen(false);
    resetForm();
    setSelectedMainnetId(null);
    loadEscrowAgreements();
  }, [resetForm, loadEscrowAgreements]);

  const {
    creationStep,
    currentStepMessage,
    uiError,
    uiSuccess,
    isTxPending,
    isApprovalPending,
    createApprovalState,
    txHash,
    createEscrowOnChain,
    resetMessages,
    resetCreationStep,
    previewStep,
  } = useEscrowCreation({
    contractAddress,
    networkChainId: activeChainId,
    onSuccess: handleSuccess,
  });

  // ── Token decimals for custom token ─────────────────────────────────────
  const { data: createTokenDecimals } = useReadContract({
    address: isValidAddress(form.customTokenAddress)
      ? (form.customTokenAddress as `0x${string}`)
      : undefined,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
    query: {
      enabled:
        isValidAddress(form.customTokenAddress) && form.token === "custom",
    },
  });

  useEffect(() => {
    if (
      typeof createTokenDecimals === "number" ||
      typeof createTokenDecimals === "bigint"
    ) {
      setForm((prev) => ({
        ...prev,
        tokenDecimals: Number(createTokenDecimals),
      }));
    }
  }, [createTokenDecimals, setForm]);

  // ── Chain config error ────────────────────────────────────────────────────
  useEffect(() => {
    if (isConnected && selectedMainnetId) {
      if (!contractAddress || !isValidAddress(contractAddress)) {
        setChainConfigError(
          `Escrow contract not configured for chain ${activeChainId}. Please switch to a supported network.`,
        );
        toast.error("Unsupported Network", {
          description: `Chain ID ${activeChainId} is not supported. Please switch to a supported network.`,
        });
      } else {
        setChainConfigError(null);
      }
    } else {
      setChainConfigError(null);
    }
  }, [activeChainId, isConnected, contractAddress, selectedMainnetId]);

  // ── Preview creation steps (demo) ────────────────────────────────────────
  const previewCreationSteps = useCallback(() => {
    const PREVIEW_STEPS: Array<{
      step: Parameters<typeof previewStep>[0];
      msg: string;
    }> = [
      { step: "creating_backend", msg: "Creating agreement in database..." },
      {
        step: "awaiting_approval",
        msg: "Token approval required. Please check your wallet...",
      },
      { step: "approving", msg: "Approving token spending..." },
      { step: "creating_onchain", msg: "Creating escrow on blockchain..." },
      {
        step: "waiting_confirmation",
        msg: "Transaction submitted. Waiting for blockchain confirmation...",
      },
      { step: "success", msg: "Escrow created successfully!" },
    ];

    PREVIEW_STEPS.forEach(({ step, msg }, i) => {
      setTimeout(() => previewStep(step, msg), i * 2000);
    });

    // Auto-reset after the full preview completes
    setTimeout(() => resetCreationStep(), PREVIEW_STEPS.length * 2000 + 2000);
  }, [previewStep, resetCreationStep]);

  // ── Form submission ───────────────────────────────────────────────────────
  const handleModalClose = () => {
    setOpen(false);
    resetMessages();
    setSelectedMainnetId(null);
  };

  const createEscrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    // Basic client-side validation
    const totalSize = form.evidence.reduce((t, f) => t + f.file.size, 0);

    if (!form.title.trim()) return;
    if (!form.type) return;
    if (escrowType === "myself") {
      if (!form.payer || !form.counterparty.trim()) return;
    } else {
      if (!form.payerOther || !form.partyA.trim() || !form.partyB.trim())
        return;
    }
    if (!isConnected) {
      toast.error("Please connect a wallet to create an agreement");
      return;
    }
    if (!currentUser?.walletAddress) {
      toast.error("Please authenticate your wallet to create an agreement");
      return;
    }
    if (!selectedMainnetId) {
      toast.error("Please select a chain");
      return;
    }
    if (!form.token) return;
    if (form.token === "custom" && !form.customTokenAddress.trim()) return;
    if (
      !form.amount.trim() ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    )
      return;
    if (!form.description.trim()) return;
    if (!deadline) return;
    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error("Total file size exceeds 50MB limit");
      return;
    }
    for (const file of form.evidence) {
      const maxSize =
        file.type === "image" ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
      if (file.file.size > maxSize) {
        toast.error(`File "${file.file.name}" exceeds size limit`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isConnected && contractAddress) {
        await createEscrowOnChain(form, deadline, escrowType);
        setIsSubmitting(false);
        return;
      }

      // Fallback mock (no wallet connected)
      toast.success("Escrow created (demo mode)", {
        description: "Connect your wallet to create real escrows.",
      });
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to create escrow");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <NetworkWarning chainConfigError={chainConfigError} />

      <div className="absolute inset-0 -z-[50] bg-cyan-500/15 blur-3xl" />

      <div className="space-y-4">
        <div className="justify-between lg:flex">
          <header className="flex flex-col gap-3">
            <div>
              <h2 className="space mb-4 text-[22px] font-semibold text-white/90">
                Escrow Center
              </h2>

              <div className="mb-4 flex items-center gap-3">
                <Button
                  variant="neon"
                  className="group rounded-xl border-2 border-cyan-400/40 bg-cyan-500/5 px-6 py-3 font-semibold text-cyan-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-100 hover:shadow-lg hover:shadow-cyan-500/20 active:translate-y-0"
                  onClick={() => setOpen(true)}
                >
                  Create Escrow
                </Button>
                <Button
                  variant="outline"
                  className="group rounded-xl border-2 border-cyan-400/40 bg-cyan-500/5 px-6 py-3 font-semibold text-cyan-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-100 hover:shadow-lg hover:shadow-cyan-500/20 active:translate-y-0"
                  onClick={previewCreationSteps}
                >
                  Preview Steps
                </Button>
              </div>

              <p className="text-muted-foreground max-w-[20rem] text-lg">
                Browse public escrows. Create, review, and manage funds
                securely.
              </p>
            </div>

            {/* Global status bar */}
            <StatusMessages
              uiError={uiError}
              uiSuccess={uiSuccess}
              isTxPending={isTxPending}
              isApprovalPending={isApprovalPending}
            />

            {/* Modal */}
            <EscrowModal
              open={open}
              onClose={handleModalClose}
              form={form}
              setForm={setForm}
              deadline={deadline}
              setDeadline={setDeadline}
              escrowType={escrowType}
              setEscrowType={setEscrowType}
              onSubmit={createEscrowSubmit}
              isSubmitting={isSubmitting}
              isTxPending={isTxPending}
              isApprovalPending={isApprovalPending}
              isApprovingToken={createApprovalState.isApprovingToken}
              handleFileSelect={handleFileSelect}
              removeFile={removeFile}
              handleDrop={handleDrop}
              uiError={uiError}
              uiSuccess={uiSuccess}
              creationStep={creationStep}
              currentStepMessage={currentStepMessage}
              txHash={txHash}
              onRetry={resetCreationStep}
              // Chain selection
              displayChains={displayChains}
              isProd={isProd}
              selectedMainnetId={selectedMainnetId}
              resolvedChainId={activeChainId ?? null}
              onSelectChain={async (mainnetId) => {
                setSelectedMainnetId(mainnetId);
                const resolved = resolveChainId(mainnetId);
                try {
                  await switchChainAsync({ chainId: resolved });
                  const chain = displayChains.find(
                    (c) => c.mainnetId === mainnetId,
                  );
                  toast.success(`Switched to ${chain?.label ?? "chain"}`);
                } catch {
                  toast.error("Failed to switch chain");
                  setSelectedMainnetId(null);
                }
              }}
            />

            {/* Filters (search, sort, tabs, pagination) */}
            <EscrowFilters
              query={query}
              setQuery={setQuery}
              sortAsc={sortAsc}
              setSortAsc={setSortAsc}
              statusTab={statusTab}
              setStatusTab={setStatusTab}
              allEscrows={allEscrows}
              loading={loading}
              onRefresh={loadEscrowAgreements}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              currentPage={currentPage}
              totalPages={totalPages}
              startItem={startItem}
              endItem={endItem}
              filteredCount={filteredEscrows.length}
              totalEscrows={allEscrows.length}
              onPageChange={handlePageChange}
            />
          </header>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <EscrowSkeleton key={i} />
            ))}
          </div>
        ) : error ? ( // 👈 new — before empty check
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white/90">
              Failed to load escrows
            </h3>
            <p className="mb-5 max-w-[280px] text-sm leading-relaxed text-slate-500">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={loadEscrowAgreements}
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : visibleEscrows.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-cyan-500/10 p-6">
              <Search className="h-12 w-12 text-cyan-400/60" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white/90">
              No escrows found
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleEscrows.map((e) => (
              <EscrowCard key={e.id} escrow={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
