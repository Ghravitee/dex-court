import { useState } from "react";
import { Search, RefreshCw, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
// import { formatEther } from "viem";
// import type { AgreementStatus } from "../types";
import { useAdminAgreementList, type AdminAgreementFilter } from "../hooks/useAdminAgreementList";
import { useAdminOnChainActions } from "../hooks/useAdminOnChainActions";
import type { AdminAgreement } from "../types";
// import { ZERO_ADDRESS } from "../../../web3/config";

const STATUS_FILTERS: { key: AdminAgreementFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "disputed", label: "Disputed" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
];

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        disputed: "bg-red-500/10 text-red-400 border border-red-500/20",
        active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        completed: "bg-white/5 text-white/40 border border-white/10",
        cancelled: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    };
    return (
        <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${styles[status] ?? styles.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
        </span>
    );
}

// ─── Finalize dispute modal ────────────────────────────────────
function FinalizeDisputeModal({
    agreementId,
    escrowAddress,
    votingIdPrefill,
    onClose,
    onConfirm,
    isPending,
}: {
    agreementId: number;
    escrowAddress: `0x${string}`;
    votingIdPrefill?: string;
    onClose: () => void;
    onConfirm: (id: bigint, outcome: 0 | 1 | 2, toProvider: bigint, toRecipient: bigint, votingId: bigint,
        contractAddress: `0x${string}`) => void;
    isPending: boolean;
}) {
    const [outcome, setOutcome] = useState<0 | 1 | 2>(0);
    const [toProvider, setToProvider] = useState("");
    const [toRecipient, setToRecipient] = useState("");
    const [votingId, setVotingId] = useState(votingIdPrefill ?? "");

    const isDropped = outcome === 2;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 space-y-5">
                <h3 className="text-base font-semibold text-white/90">
                    Finalize Dispute — Agreement #{agreementId}
                </h3>

                <div className="space-y-2">
                    <p className="text-xs text-white/40">Outcome</p>
                    <div className="grid grid-cols-3 gap-2">
                        {([
                            { value: 0, label: "Resolved" },
                            { value: 1, label: "Dismissed" },
                            { value: 2, label: "Dropped" },
                        ] as const).map((o) => (
                            <button
                                key={o.value}
                                onClick={() => setOutcome(o.value)}
                                className={`rounded-lg px-3 py-2 text-sm border transition-all ${outcome === o.value
                                    ? "border-purple-400/50 bg-purple-500/20 text-purple-300"
                                    : "border-white/10 text-white/50 hover:bg-white/5"
                                    }`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>

                {!isDropped && (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-xs text-white/40">Amount to service provider (ETH)</label>
                            <input
                                type="text"
                                value={toProvider}
                                onChange={e => setToProvider(e.target.value)}
                                placeholder="e.g. 0.5"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-400/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-white/40">Amount to service recipient (ETH)</label>
                            <input
                                type="text"
                                value={toRecipient}
                                onChange={e => setToRecipient(e.target.value)}
                                placeholder="e.g. 0.5"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-400/50"
                            />
                        </div>
                    </>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Voting ID</label>
                    <input
                        type="text"
                        value={votingId}
                        onChange={e => setVotingId(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-400/50"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-white/50 hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() =>
                            onConfirm(
                                BigInt(agreementId),
                                outcome,
                                isDropped ? 0n : BigInt(Math.round(Number(toProvider || "0") * 1e18)),
                                isDropped ? 0n : BigInt(Math.round(Number(toRecipient || "0") * 1e18)),
                                BigInt(votingId || "0"),
                                escrowAddress,
                            )
                        }
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-purple-500/20 py-2.5 text-sm font-medium text-purple-300 ring-1 ring-purple-400/30 hover:bg-purple-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                        {isPending && <Loader2 size={13} className="animate-spin" />}
                        {isPending ? "Confirming..." : "Finalize"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main tab ──────────────────────────────────────────────────
interface AgreementOperationsTabProps {
    activeChainId: number;
    escrowAddress: `0x${string}`;
    explorerBase: string;
}

export function AgreementOperationsTab({
    activeChainId,
    escrowAddress,
}: AgreementOperationsTabProps) {
    const {
        filteredAgreements,
        loading,
        error,
        query,
        setQuery,
        statusFilter,
        setStatusFilter,
        hasLoaded,
        loadAgreements,
    } = useAdminAgreementList(activeChainId);

    const {
        finalizeEscrowDispute,
        loadingStates,
        uiError,
        uiSuccess,
    } = useAdminOnChainActions({ activeChainId });

    const [finalizeTarget, setFinalizeTarget] = useState<{
        onChainId: number;
        escrowAddress: `0x${string}`;
        votingId?: string;
    } | null>(null)

    const handleFinalizeConfirm = (
        id: bigint,
        outcome: 0 | 1 | 2,
        toProvider: bigint,
        toRecipient: bigint,
        votingId: bigint,
        contractAddress: `0x${string}`,
    ) => {
        finalizeEscrowDispute(id, outcome, toProvider, toRecipient, votingId, contractAddress);
        setFinalizeTarget(null);
    };

    return (
        <div className="space-y-5">

            {/* Feedback */}
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

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">

                {/* Header row */}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-white/40">
                        Look up agreements to finalize disputes.
                    </p>
                    <button
                        onClick={loadAgreements}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
                    >
                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                        {hasLoaded ? "Refresh" : "Load agreements"}
                    </button>
                </div>

                {/* Search + filter */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search by ID, title, or address..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-400/50 transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as AdminAgreementFilter)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white/60 focus:outline-none focus:border-purple-400/50 transition-colors cursor-pointer"
                        >
                            {STATUS_FILTERS.map(f => (
                                <option key={f.key} value={f.key} className="bg-gray-900">{f.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                </div>

                {/* States */}
                {!hasLoaded && !loading && (
                    <div className="py-10 text-center">
                        <p className="text-sm text-white/30">Click "Load agreements" to fetch data.</p>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/40">
                        <Loader2 size={14} className="animate-spin" />
                        Loading agreements...
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-center gap-2 py-6 text-sm text-red-400">
                        <AlertTriangle size={14} />
                        {error}
                    </div>
                )}

                {/* List */}
                {hasLoaded && !loading && (
                    <div className="divide-y divide-white/[0.06]">
                        {filteredAgreements.length === 0 && (
                            <p className="py-8 text-center text-sm text-white/30">No agreements found.</p>
                        )}
                        
                        {filteredAgreements.map((agreement: AdminAgreement) => {
                            const raw = agreement._raw;
                            const isDisputed = agreement.status === "disputed";
                            const agreementEscrowAddress = agreement.escrowAddress as `0x${string}`;
                            const onChainId = agreement.onChainId ?? agreement.id;
                            const disputeVotingId = raw?.disputes?.[0]?.votingId?.toString();

                            return (
                                <div key={agreement.id} className="py-4 flex items-start justify-between gap-4">
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <a
                                                href={`/escrow/${agreement.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-mono text-white/80 hover:text-white transition-colors"
                                            >
                                                #{agreement.id}
                                            </a>
                                            <StatusBadge status={agreement.status} />
                        
                                        </div>
                                        <p className="text-xs text-white/50 truncate max-w-[280px]">
                                            {agreement.title}
                                        </p>
                                        <p className="text-xs text-white/30">
                                            {agreement.token} · {agreement.amount} · chain {agreement.chainId}
                                        </p>
                                        {isDisputed && raw?.disputes?.[0] && (
                                            <p className="text-xs text-red-400/70">
                                                Voting ID: {raw.disputes[0].votingId ?? "—"}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                        {isDisputed && (
                                            <button
                                                onClick={() => setFinalizeTarget({
                                                    onChainId: Number(onChainId),
                                                    escrowAddress: agreementEscrowAddress,
                                                    votingId: disputeVotingId,
                                                })}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                            >
                                                Finalize dispute
                                            </button>
                                        )}

                                        {escrowAddress && (
                                            <a
                                                href={`/escrow/${agreement.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/60 transition-all"
                                            >
                                                View ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {finalizeTarget !== null && (
                <FinalizeDisputeModal
                    agreementId={finalizeTarget.onChainId}
                    escrowAddress={finalizeTarget.escrowAddress}
                    votingIdPrefill={finalizeTarget.votingId}
                    onClose={() => setFinalizeTarget(null)}
                    onConfirm={handleFinalizeConfirm}
                    isPending={loadingStates.finalizeEscrowDispute}
                />
            )}
        </div>
    );
}