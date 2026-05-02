import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { fetchAgreements } from "../../../services/agreementServices";
import { transformApiAgreementToEscrow } from "../../escrow/utils/transformers";
import { AgreementTypeEnum } from "../../escrow/constants";
// import type { OnChainEscrowData } from "../../escrow/types";
import { getAgreementExistOnchain } from "../../../web3/readContract";
import type { AdminAgreement } from "../types";

export type AdminAgreementFilter = "all" | "disputed" | "frozen" | "active" | "completed";

export function useAdminAgreementList(activeChainId: number) {
    const [allAgreements, setAllAgreements] = useState<AdminAgreement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<AdminAgreementFilter>("all");
    const [hasLoaded, setHasLoaded] = useState(false);

    const loadAgreements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchAgreements({
                top: 200,
                skip: 0,
                sort: "desc",
                type: AgreementTypeEnum.ESCROW,
            });

            const list = response.results || [];
            const transformed = list
                .map(transformApiAgreementToEscrow)
                .filter((e) => !activeChainId || e.chainId === activeChainId);

            const confirmed = transformed.filter(
                (e) => e.status !== "pending" && e.status !== "pending_approval",
            );
            const pending = transformed.filter(
                (e) => e.status === "pending" || e.status === "pending_approval",
            );

            const groups: Record<string, {
                chainId: number;
                escrowContractAddress: string;
                agreements: typeof pending;
                onChainIds: bigint[];
            }> = {};

            pending.forEach((agreement) => {
                if (!agreement.onChainId || !agreement.escrowAddress) return;
                const chainId = agreement.chainId;
                if (!chainId) return;
                const key = `${chainId}-${agreement.escrowAddress.toLowerCase()}`;
                if (!groups[key]) {
                    groups[key] = {
                        chainId,
                        escrowContractAddress: agreement.escrowAddress.toLowerCase(),
                        agreements: [],
                        onChainIds: [],
                    };
                }
                groups[key].agreements.push(agreement);
                groups[key].onChainIds.push(BigInt(agreement.onChainId));
            });

            const verifiedPending: typeof pending = [];

            await Promise.all(
                Object.entries(groups).map(async ([, group]) => {
                    try {
                        if (group.onChainIds.length === 0) return;
                        const existOnChain = await getAgreementExistOnchain(
                            group.chainId,
                            group.onChainIds,
                            group.escrowContractAddress as `0x${string}`,
                        );
                        group.agreements.forEach((agreement, i) => {
                            if (existOnChain[i]) verifiedPending.push(agreement);
                        });
                    } catch {
                        // Skip group on error
                    }
                }),
            );

            const final = [...confirmed, ...verifiedPending].sort(
                (a, b) => b.createdAt - a.createdAt,
            );

            setAllAgreements(final);
            setHasLoaded(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load agreements";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [activeChainId]);

    // Don't auto-load — admin explicitly triggers this
    const filteredAgreements = useMemo(() => {
        let result = allAgreements;

        if (statusFilter !== "all") {
            result = result.filter((e) => {
                if (statusFilter === "disputed") return e.status === "disputed";
                if (statusFilter === "frozen") {
                    return (e as { _raw?: { onChainData?: { frozen?: boolean } } })._raw?.onChainData?.frozen === true;
                }
                if (statusFilter === "completed") return e.status === "completed";
                if (statusFilter === "active") return (
                    e.status !== "disputed" &&
                    e.status !== "completed" &&
                    e.status !== "cancelled"
                );
                return true;
            });
        }

        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter((e) =>
                e.id.toString().includes(q) ||
                e.title?.toLowerCase().includes(q) ||
                e.from?.toLowerCase().includes(q) ||
                e.to?.toLowerCase().includes(q)
            );
        }

        return result;
    }, [allAgreements, statusFilter, query]);

    return {
        allAgreements,
        filteredAgreements,
        loading,
        error,
        query,
        setQuery,
        statusFilter,
        setStatusFilter,
        hasLoaded,
        loadAgreements,
    };
}