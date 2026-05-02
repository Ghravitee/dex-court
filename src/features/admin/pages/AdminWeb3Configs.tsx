// src/features/admin/pages/AdminWeb3Configs.tsx
import { useState, useMemo } from "react";
import { RefreshCw, Shield, Settings, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSwitchChain } from "wagmi";
import {
    ESCROW_CA,
    VOTING_CA,
    getExplorerUrl,
    SUPPORTED_CHAINS,
} from "../../../web3/config";
import { useChainSelection } from "../../../config/useChainSelection";
import { ContractConfigsTab } from "../components/ContractConfigs";
import { AgreementOperationsTab } from "../components/AgreementOperationsTab";
import type { Tab } from "../types";
import { useAdminOnChainActions } from "../hooks/useAdminOnChainActions";

export default function AdminWeb3Configs() {
    const [tab, setTab] = useState<Tab>("configs");
    const [isSwitching, setIsSwitching] = useState(false);

    const { resolveChainId, displayChains, isProd } = useChainSelection();
    const { switchChainAsync } = useSwitchChain();

    const [selectedMainnetId, setSelectedMainnetId] = useState<number | null>(
        SUPPORTED_CHAINS[0].mainnetId
    );

    const activeChainId = useMemo(
        () =>
            selectedMainnetId
                ? resolveChainId(selectedMainnetId)
                : resolveChainId(SUPPORTED_CHAINS[0].mainnetId),
        [selectedMainnetId, resolveChainId]
    );

    const {
        setEscrowConfig,
        setVotingConfig,
        setDisputeResolver,
        setFeeRecipient,
        freezeAgreement,
        recoverStuckEthEscrow,
        recoverStuckEthVoting,
        recoverStuckTokenEscrow,
        recoverStuckTokenVoting,
        loadingStates,
        uiError,
        uiSuccess,
    } = useAdminOnChainActions({ activeChainId });

    const escrowAddress = ESCROW_CA[activeChainId] ?? "";
    const votingAddress = VOTING_CA[activeChainId] ?? "";
    const explorerBase = getExplorerUrl(activeChainId);

    const chainConfigError = useMemo(() => {
        if (!escrowAddress || !votingAddress) {
            return `Contracts not configured for chain ${activeChainId}. Select a supported network.`;
        }
        return null;
    }, [activeChainId, escrowAddress, votingAddress]);

    const handleSelectChain = async (mainnetId: number) => {
        setSelectedMainnetId(mainnetId);
        setIsSwitching(true);
        const resolved = resolveChainId(mainnetId);
        try {
            await switchChainAsync({ chainId: resolved });
            const chain = displayChains.find((c) => c.mainnetId === mainnetId);
            toast.success(`Switched to ${chain?.label ?? "network"}`);
        } catch {
            toast.error("Failed to switch network");
            setSelectedMainnetId(null);
        } finally {
            setIsSwitching(false);
        }
    };

    return (
        <div className="space-y-7">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white/90">
                    Web3 management
                </h1>
                <p className="mt-1 text-sm text-white/40">
                    Smart contract configs and agreement admin operations.
                </p>
            </div>

            <p className="mt-4 text-xs text-white/30"
            >
                ActiveChain: {activeChainId}
            </p>

            <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-widest text-white/40">
                    Network
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    {displayChains.map((chain) => {
                        const isActive = selectedMainnetId === chain.mainnetId;
                        return (
                            <button
                                key={chain.mainnetId}
                                onClick={() => handleSelectChain(chain.mainnetId)}
                                disabled={isSwitching}
                                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all disabled:opacity-50 ${isActive
                                    ? "border-purple-400/50 bg-purple-500/15 text-purple-300"
                                    : "border-white/10 text-white/50 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <img
                                    src={chain.icon}
                                    alt={chain.name}
                                    className="h-4 w-4 rounded-full object-cover"
                                />
                                {chain.label}
                                {isActive && (
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${isProd ? "bg-green-400" : "bg-amber-400"
                                            }`}
                                    />
                                )}
                            </button>
                        );
                    })}

                    <div
                        className={`ml-2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${isProd
                            ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${isProd ? "bg-green-400" : "bg-amber-400"
                                }`}
                        />
                        {isProd ? "Production" : "Testnet"}
                    </div>

                    <button
                        disabled={isSwitching}
                        className="ml-auto flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60 disabled:opacity-40"
                    >
                        <RefreshCw size={12} className={isSwitching ? "animate-spin" : ""} />
                        {isSwitching ? "Switching..." : "Refresh"}
                    </button>
                </div>
            </div>

            {chainConfigError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                    <AlertTriangle size={14} className="shrink-0" />
                    {chainConfigError}
                </div>
            )}

            {uiError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <AlertTriangle size={14} className="shrink-0" />
                    {uiError}
                </div>
            )}
            {uiSuccess && (
                <div className="flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                    {uiSuccess}
                </div>
            )}

            <div className="flex gap-1 border-b border-white/10">
                {(
                    [
                        { key: "configs", label: "Contract configs", icon: Settings },
                        { key: "operations", label: "Agreement operations", icon: Shield },
                    ] as const
                ).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-all ${tab === key
                            ? "border-purple-400 font-medium text-white/90"
                            : "border-transparent text-white/40 hover:text-white/60"
                            }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {tab === "configs" && (
                <ContractConfigsTab
                    activeChainId={activeChainId}
                    escrowAddress={escrowAddress as `0x${string}`}
                    votingAddress={votingAddress as `0x${string}`}
                    explorerBase={explorerBase}
                    onUpdateEscrowConfig={setEscrowConfig}
                    onUpdateVotingConfig={setVotingConfig}
                    onSetDisputeResolver={setDisputeResolver}
                    onSetFeeRecipient={setFeeRecipient}
                    onFreezeAgreement={freezeAgreement}
                    onRecoverStuckEthEscrow={recoverStuckEthEscrow}
                    onRecoverStuckEthVoting={recoverStuckEthVoting}
                    onRecoverStuckTokenEscrow={recoverStuckTokenEscrow}
                    onRecoverStuckTokenVoting={recoverStuckTokenVoting}
                    isUpdatingEscrow={loadingStates.setEscrowConfig}
                    isUpdatingVoting={loadingStates.setVotingConfig}
                    isFreezingAgreement={loadingStates.freezeAgreement}
                    isRecoveringEscrowEth={loadingStates.recoverStuckEthEscrow}
                    isRecoveringVotingEth={loadingStates.recoverStuckEthVoting}
                    isRecoveringEscrowToken={loadingStates.recoverStuckTokenEscrow}
                    isRecoveringVotingToken={loadingStates.recoverStuckTokenVoting}
                />
            )}
            {tab === "operations" && (
                <AgreementOperationsTab
                    activeChainId={activeChainId}
                    escrowAddress={escrowAddress as `0x${string}`}
                    explorerBase={explorerBase}
                />
            )}
        </div>
    );
}