import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useContractReads, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ERC20_ABI, ESCROW_ABI, ESCROW_CA, ZERO_ADDRESS } from "../web3/config";
import { formatAmount } from "../web3/helper";
import {
    FileText,
    Calendar,
    Users,
    DollarSign,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Shield,
    Lock,
    Info,
    Upload,
    UserCheck,
    Package,
    PackageCheck,
    Ban,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getAgreement, getMilestoneCount, getTokenDecimals, getTokenSymbol } from "../web3/readContract"; // adjust path if needed
import type { Agreement, LoadingStates, MilestoneData } from "../web3/interfaces";
import { useNetworkEnvironment, } from "../config/useNetworkEnvironment";
import { MilestoneTableRow } from "../web3/MilestoneTableRow";
import { parseEther } from "ethers";

// CountdownTimer unchanged except styling bits kept
function CountdownTimer({
    targetTimestamp,
    onComplete,
}: {
    targetTimestamp: bigint;
    onComplete?: () => void;
}) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const target = Number(targetTimestamp);
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft("Expired");
                onComplete?.();
                return;
            }

            const days = Math.floor(difference / (60 * 60 * 24));
            const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((difference % (60 * 60)) / 60);
            const seconds = difference % 60;

            if (days > 0) {
                setTimeLeft(
                    `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
                        .toString()
                        .padStart(2, "0")}m`,
                );
            } else if (hours > 0) {
                setTimeLeft(
                    `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds
                        .toString()
                        .padStart(2, "0")}s`,
                );
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetTimestamp, onComplete]);

    return (
        <span className={`font-mono ${timeLeft === "Expired" ? "text-green-400" : "text-yellow-400"}`}>
            {timeLeft}
        </span>
    );
}

function Web3Escrow() {
    const networkInfo = useNetworkEnvironment();
    const { address } = useAccount();

    const [agreement, setAgreement] = useState<Agreement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uiError, setUiError] = useState<string | null>(null);
    const [uiSuccess, setUiSuccess] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(
        BigInt(Math.floor(Date.now() / 1000)),
    );
    const [milestones, setMilestones] = useState<MilestoneData[]>([]);

    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const contractAddress = ESCROW_CA[networkInfo.chainId as number];

    const [manageTokenDecimals, setManageTokenDecimals] = useState<number | null>(null);
    const [manageMilestoneCount, setManageMilestoneCount] = useState<number | null>(null);
    const [manageTokenSymbol, setManageTokenSymbol] = useState<string | null>(null);
    const [tokenReadLoading, setTokenReadLoading] = useState(false);
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        createAgreement: false,
        signAgreement: false,
        depositFunds: false,
        submitDelivery: false,
        approveDelivery: false,
        rejectDelivery: false,
        cancelOrder: false,
        approveCancellation: false,
        partialRelease: false,
        finalRelease: false,
        cancellationTimeout: false,
        claimMilestone: false,
        setMilestoneHold: false,
        raiseDispute: false,
        loadAgreement: false,
    });
    const [depositState, setDepositState] = useState({
        isApprovingToken: false,
        approvalHash: null,
        needsApproval: false,
    });

    const [showDisputeModal, setShowDisputeModal] = useState(false);

    const [disputeForm, setDisputeForm] = useState({
        votingId: "",
        plaintiffIsServiceRecipient: true,
        proBono: false,
        feeAmount: "",
    });

    // Helper function to set loading states
    const setLoading = (action: keyof LoadingStates, isLoading: boolean) => {
        setLoadingStates((prev) => ({
            ...prev,
            [action]: isLoading,
        }));
    };

    // Enhanced dispute handler with modal
    const openDisputeModal = () => {
        const votingId = Math.floor(Math.random() * 1000000).toString();
        const newDisputeForm = {
            votingId: votingId,
            plaintiffIsServiceRecipient: isServiceRecipient as boolean,
            proBono: true,
            feeAmount: "0.01", // Default fee
        };

        setDisputeForm(newDisputeForm);
        setShowDisputeModal(true);
    };

    // Reset all loading states
    const resetAllLoading = () => {
        setLoadingStates({
            createAgreement: false,
            signAgreement: false,
            depositFunds: false,
            submitDelivery: false,
            approveDelivery: false,
            rejectDelivery: false,
            cancelOrder: false,
            approveCancellation: false,
            partialRelease: false,
            finalRelease: false,
            cancellationTimeout: false,
            claimMilestone: false,
            setMilestoneHold: false,
            raiseDispute: false,
            loadAgreement: false,
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(BigInt(Math.floor(Date.now() / 1000)));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const {
        data: hash,
        writeContract,
        isPending,
        error: writeError,
        reset: resetWrite,
    } = useWriteContract();
    const { isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Approval hooks for ERC20
    const {
        data: approvalHash,
        writeContract: writeApproval,
        isPending: isApprovalPending,
        error: approvalError,
        reset: resetApproval,
    } = useWriteContract();

    const { isSuccess: approvalSuccess } = useWaitForTransactionReceipt({
        hash: approvalHash,
    });

    // Create contracts array for milestones ONLY when we have a valid count
    const contractsForMilestones = useMemo(() => {
        if (!manageMilestoneCount || !agreement?.id || !agreement.vesting) {
            return [];
        }

        const count = Number(manageMilestoneCount);
        if (count === 0) return [];

        console.log(
            `Creating ${count} milestone contracts, trigger: ${refetchTrigger}`,
        );

        return Array.from({ length: count }, (_, i) => ({
            address: contractAddress as `0x${string}`,
            abi: ESCROW_ABI.abi,
            functionName: "getMilestone" as const,
            args: [agreement.id, BigInt(i)],
        }));
    }, [manageMilestoneCount, agreement?.id, agreement?.vesting, refetchTrigger, contractAddress]);

    // Fetch all milestones
    const {
        data: rawMilestonesData,
        refetch: refetchMilestonesData,
    } = useContractReads({
        contracts: contractsForMilestones,
        query: {
            enabled: contractsForMilestones.length > 0,
        },
    });

    // helper to safely convert various on-chain shapes to bigint
    const toBigIntSafe = (v: unknown): bigint => {
        if (typeof v === "bigint") return v;
        if (typeof v === "number") return BigInt(Math.floor(v));
        if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
        // some libs return objects with toString()
        if (
            v &&
            typeof (v as { toString?: () => string }).toString === "function"
        ) {
            const s = (v as { toString: () => string }).toString();
            if (/^\d+$/.test(s)) return BigInt(s);
        }
        return 0n;
    };

    useEffect(() => {
        if (!rawMilestonesData || !Array.isArray(rawMilestonesData)) {
            setMilestones([]);
            return;
        }

        try {
            const mapped = rawMilestonesData
                .filter((item) => item.status === "success" && item.result)
                .map((item): MilestoneData | null => {
                    const r = item.result;

                    if (Array.isArray(r)) {
                        const percentBP = toBigIntSafe(r[0]);
                        const unlockAt = toBigIntSafe(r[1]);
                        const heldByRecipient = !!r[2];
                        const claimed = !!r[3];
                        const amount = toBigIntSafe(r[4]);

                        return { percentBP, unlockAt, heldByRecipient, claimed, amount };
                    }

                    // Handle object format if needed
                    if (typeof r === "object") {
                        const obj = r as unknown as Record<string, unknown>;
                        const percentBP = toBigIntSafe(obj.percentBP ?? obj["0"]);
                        const unlockAt = toBigIntSafe(obj.unlockAt ?? obj["1"]);
                        const heldByRecipient = !!(obj.heldByRecipient ?? obj["2"]);
                        const claimed = !!(obj.claimed ?? obj["3"]);
                        const amount = toBigIntSafe(obj.amount ?? obj["4"]);
                        return { percentBP, unlockAt, heldByRecipient, claimed, amount };
                    }

                    return null;
                })
                .filter(Boolean) as MilestoneData[];

            setMilestones(mapped);
        } catch (err) {
            console.error("Error mapping milestones:", err);
            setMilestones([]);
        }
    }, [rawMilestonesData]);

    // reload helper used by CountdownTimer onComplete
    const fetchAgreement = useCallback(async (id?: string) => {
        const idToUse = id;
        setError(null);
        setLoading("loadAgreement", true);

        if (!networkInfo.chainId) {
            setError("Chain ID not available");
            setLoading("loadAgreement", false);
            return;
        }

        if (!idToUse || idToUse.trim() === "") {
            setError("Please enter an agreement ID");
            setLoading("loadAgreement", false);
            return;
        }

        let agreementId: bigint;
        try {
            // allow decimal or hex-like strings
            if (idToUse.startsWith("0x")) {
                agreementId = BigInt(idToUse);
            } else {
                agreementId = BigInt(idToUse);
            }
        } catch (e) {
            setError("Invalid agreement ID");
            setLoading("loadAgreement", false);
            return e;
        }

        try {
            // getAgreement exported default or named - adjust import accordingly
            const res = await getAgreement(networkInfo.chainId as number, agreementId);
            setAgreement(res);
        } catch (err: unknown) {
            console.error(err);
            setError(String(err));
            setAgreement(null);
        } finally {
            setLoading("loadAgreement", false);
        }
    }, [networkInfo.chainId]);

    // Token address (only when agreement exists and token isn't zero address)
    const tokenAddress = agreement && agreement.token !== ZERO_ADDRESS ? (agreement.token as `0x${string}`) : undefined;

    useEffect(() => {
        let mounted = true;
        if (!tokenAddress) {
            // reset to defaults when no token
            setManageTokenDecimals(null);
            setManageMilestoneCount(null);
            setManageTokenSymbol(null);
            return;
        }

        setTokenReadLoading(true);
        (async () => {
            try {
                const decimalsRaw = getTokenDecimals(networkInfo.chainId as number, tokenAddress);
                const symbolRaw = getTokenSymbol(networkInfo.chainId as number, tokenAddress);
                const milestoneRaw = getMilestoneCount(networkInfo.chainId as number, agreement?.id as bigint);

                if (!mounted) return;

                // decimals might come as bigint/number/string depending on client; normalize to number
                const decimalsNumber = typeof decimalsRaw === "bigint" ? Number(decimalsRaw) : Number(decimalsRaw ?? 18);
                setManageTokenDecimals(Number.isFinite(decimalsNumber) ? decimalsNumber : 18);

                const milestoneNumber = typeof milestoneRaw === "bigint" ? Number(milestoneRaw) : Number(milestoneRaw ?? 0);
                setManageMilestoneCount(Number.isFinite(milestoneNumber) ? milestoneNumber : 0);

                setManageTokenSymbol(symbolRaw ? String(symbolRaw) : null);
            } catch (e) {
                console.error("Failed to read token via publicClient:", e);
                if (!mounted) return;
                setManageTokenDecimals(null);
                setManageMilestoneCount(null);
                setManageTokenSymbol(null);
            } finally {
                if (mounted && !tokenReadLoading) setTokenReadLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [tokenAddress, tokenReadLoading, networkInfo.chainId, agreement?.id]);

    // compute decimals & symbol with fallbacks
    const decimalsNumber = typeof manageTokenDecimals === "number" ? manageTokenDecimals : Number(manageTokenDecimals ?? 18);
    const tokenSymbol = (manageTokenSymbol ?? (agreement?.token === ZERO_ADDRESS ? "ETH" : "TOKEN"));

    // small helpers to access Agreement safely
    const formatAmountSafe = (amt: bigint) => formatAmount(amt, decimalsNumber);

    const isLoadedAgreement = !!agreement;
    const isServiceProvider =
        isLoadedAgreement &&
        address &&
        agreement &&
        address.toLowerCase() === agreement.serviceProvider.toString().toLowerCase();
    const isServiceRecipient =
        isLoadedAgreement &&
        address &&
        agreement &&
        address.toLowerCase() === agreement.serviceRecipient.toString().toLowerCase();
    const now = currentTime;

    // reload when countdown completes
    const reload = useCallback(() => {
        fetchAgreement();
    }, [fetchAgreement]);

    // helper to reset messages
    const resetMessages = () => {
        setUiError(null);
        setUiSuccess(null);
    };

    const triggerMilestoneRefetch = useCallback(() => {
        setRefetchTrigger((prev) => prev + 1);
    }, []);

    const handleClaimMilestone = async (index: number) => {
        resetMessages();
        setLoading("claimMilestone", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceProvider)
                return setUiError("Only serviceProvider can claim milestones");
            if (!agreement.vesting)
                return setUiError("Agreement is not in vesting mode");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (!agreement.signed)
                return setUiError("Agreement not signed completely");
            if (agreement.frozen) return setUiError("The agreement is frozen");

            if (now > agreement.grace1Ends && !agreement.completed)
                return setUiError("Can not claim after cancellation expired");
            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "claimMilestone",
                args: [agreement.id, BigInt(index)],
            });
            setUiSuccess("Claim milestone transaction submitted");
        } catch (error) {
            setLoading("claimMilestone", false);
            setUiError("Error claiming milestone");
            console.error("Error claiming milestone:", error);
        }
    };

    const handleSetMilestoneHold = async (index: number, hold: boolean) => {
        resetMessages();
        setLoading("setMilestoneHold", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceRecipient)
                return setUiError("Only serviceRecipient can set milestone hold");
            if (!agreement.vesting)
                return setUiError("Agreement is not in vesting mode");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (!agreement.signed)
                return setUiError("Agreement not signed completely");
            if (agreement.frozen) return setUiError("The agreement is frozen");
            if (!manageMilestoneCount) return setUiError("Milestone count not loaded");
            if (index >= Number(manageMilestoneCount))
                return setUiError("Invalid milestone index");

            // Check if milestone is already claimed
            if (milestones[index]?.claimed)
                return setUiError("Milestone already claimed");

            console.log(
                `Calling setMilestoneHold for agreement ${agreement.id}, milestone ${index}, hold: ${hold}`,
            );

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "setMilestoneHold",
                args: [agreement.id, BigInt(index), hold],
            });

            setUiSuccess(
                `Milestone ${hold ? "held" : "unheld"} transaction submitted`,
            );
            triggerMilestoneRefetch();
        } catch (error: unknown) {
            setLoading("setMilestoneHold", false);
            const msg = error instanceof Error ? error.message : String(error);
            setUiError(`Failed to set milestone hold: ${msg}`);
            console.error("handleSetMilestoneHold error:", error);
        }
    };

    const handleSignAgreement = () => {
        resetMessages();
        setLoading("signAgreement", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceProvider && !isServiceRecipient)
                return setUiError("Only parties to the agreement can sign");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (agreement.signed && !agreement.completed)
                return setUiError("Agreement already signed");
            if (isServiceProvider && agreement.acceptedByServiceProvider && !agreement.completed)
                return setUiError("You already signed the Agreement");
            if (isServiceRecipient && agreement.acceptedByServiceRecipient && !agreement.completed)
                return setUiError("You already signed the Agreement");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "signAgreement",
                args: [agreement.id],
            });
            setUiSuccess("Sign transaction submitted");
        } catch (error) {
            setLoading("signAgreement", false);
            setUiError("Error signing agreement");
            console.error("Error signing agreement:", error);
        }
    };

    const handleSubmitDelivery = () => {
        resetMessages();
        setLoading("submitDelivery", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceProvider && !agreement.completed)
                return setUiError("Only serviceProvider can submit delivery");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (!agreement.signed) return setUiError("Agreement not signed");
            if (agreement.grace1Ends !== 0n && !agreement.pendingCancellation && !agreement.completed)
                return setUiError("Submission is pending already");
            if (agreement.pendingCancellation) return setUiError("Cancellation requested");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "submitDelivery",
                args: [agreement.id],
            });
            setUiSuccess("Submit delivery transaction sent");
        } catch (error) {
            setLoading("submitDelivery", false);
            setUiError("Error submitting delivery");
            console.error("Error submitting delivery:", error);
        }
    };

    const handleApproveDelivery = (final: boolean) => {
        resetMessages();
        if (final) {
            setLoading("approveDelivery", true);
        } else {
            setLoading("rejectDelivery", true);
        }
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceRecipient && final)
                return setUiError("Only serviceRecipient can approve delivery");
            if (!isServiceRecipient && !final)
                return setUiError("Only serviceRecipient can reject delivery");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (!agreement.signed) return setUiError("Agreement not signed");
            if (agreement.grace1Ends === 0n && final)
                return setUiError("There are no pending delivery to approve");
            if (agreement.grace1Ends === 0n && !final)
                return setUiError("There are no pending delivery to reject");
            if (agreement.pendingCancellation) return setUiError("Cancellation requested");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");
            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "approveDelivery",
                args: [agreement.id, final],
            });
            setUiSuccess(final ? "Approval submitted" : "Rejection submitted");
        } catch (error) {
            if (final) {
                setLoading("approveDelivery", false);
            } else {
                setLoading("rejectDelivery", false);
            }
            setUiError("Error processing delivery approval");
            console.error("Error processing delivery approval:", error);
        }
    };

    const handleDepositFunds = async () => {
        resetMessages();
        setLoading("depositFunds", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceProvider && !isServiceRecipient)
                return setUiError("Only parties to the agreement can deposit funds");
            if (agreement.funded && !agreement.completed)
                return setUiError("Agreement is funded already");
            if (agreement.completed) return setUiError("Agreement is already completed");
            if (agreement.frozen) return setUiError("Agreement is frozen already");

            const isERC20 = agreement.token !== ZERO_ADDRESS;

            if (isERC20) {
                const amount = agreement.amount;
                if (amount <= 0n) return setUiError("Invalid deposit amount");

                setDepositState((prev) => ({
                    ...prev,
                    needsApproval: true,
                    isApprovingToken: true,
                }));
                setUiSuccess("Approving token for deposit...");

                writeApproval({
                    address: agreement.token as `0x${string}`,
                    abi: ERC20_ABI.abi,
                    functionName: "approve",
                    args: [contractAddress as `0x${string}`, amount],
                });
            } else {
                depositDirectly();
            }
        } catch (error) {
            setLoading("depositFunds", false);
            setUiError(
                typeof error === "string"
                    ? error
                    : error instanceof Error
                        ? error.message
                        : "Error preparing deposit",
            );
            console.error("Error in handleDepositFunds:", error);
        }
    };

    const depositDirectly = useCallback(() => {
        try {
            if (!agreement) return setUiError("Agreement not loaded");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");

            const amount = agreement.amount;
            const isERC20 = agreement.token !== ZERO_ADDRESS;

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "depositFunds",
                args: [agreement.id],
                value: isERC20 ? BigInt(0) : amount,
            });

            setUiSuccess("Deposit transaction submitted");
            setDepositState((prev) => ({
                ...prev,
                needsApproval: false,
                isApprovingToken: false,
            }));
        } catch (error) {
            setUiError(
                typeof error === "string"
                    ? error
                    : error instanceof Error
                        ? error.message
                        : "Error submitting deposit",
            );
            console.error("Error depositing funds:", error);
        }
    }, [agreement, contractAddress, writeContract]);

    const handleCancelOrder = () => {
        resetMessages();
        setLoading("cancelOrder", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceProvider && !isServiceRecipient)
                return setUiError("Only parties to the agreement can cancel the order");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (!agreement.signed) return setUiError("Agreement not signed");
            if (agreement.grace1Ends !== 0n && !agreement.pendingCancellation && !agreement.completed)
                return setUiError("Submission is pending");
            if (agreement.pendingCancellation) return setUiError("Cancellation requested Already");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");
            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "cancelOrder",
                args: [agreement.id],
            });
            setUiSuccess("Cancel transaction submitted");
        } catch (error) {
            setLoading("cancelOrder", false);
            setUiError("Error cancelling order");
            console.error("Error cancelling order:", error);
        }
    };

    const handleApproveCancellation = (final: boolean) => {
        resetMessages();
        setLoading("approveCancellation", true);
        try {

            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceProvider && !isServiceRecipient)
                return setUiError("Only parties to the agreement can cancel the order");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (!agreement.signed) return setUiError("Agreement not signed");
            if (agreement.grace1Ends === 0n && final)
                return setUiError("There are no pending order cancellation to approve");
            if (agreement.grace1Ends === 0n && !final)
                return setUiError("There are no pending order cancellation to reject");
            if (!agreement.pendingCancellation && !agreement.completed)
                return setUiError("No Cancellation requested");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");

            if (now > agreement.grace1Ends && !agreement.completed)
                return setUiError("24 hour Grace period not yet ended");

            const initiator = agreement.grace1EndsCalledBy;
            if (
                initiator &&
                address &&
                address.toLowerCase() === initiator.toString().toLowerCase() &&
                final
            )
                return setUiError("You can't approve your own cancellation request");
            if (
                initiator &&
                address &&
                address.toLowerCase() === initiator.toString().toLowerCase() &&
                !final
            )
                return setUiError("You can't reject your own cancellation request");
            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "approveCancellation",
                args: [BigInt(agreement?.id), final],
            });
            setUiSuccess(
                final
                    ? "Cancellation approval submitted"
                    : "Cancellation rejection submitted",
            );
        } catch (error) {
            setLoading("approveCancellation", false);
            setUiError("Error processing cancellation");
            console.error("Error processing cancellation:", error);
        }
    };

    const handlePartialRelease = () => {
        resetMessages();
        setLoading("partialRelease", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (agreement.grace1Ends === 0n)
                return setUiError("No approved delivery yet");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (agreement.pendingCancellation) return setUiError("Cancellation is in process");
            if (agreement.vesting)
                return setUiError("You cannot release partial funds on Vesting");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");

            if (now < agreement.grace1Ends && !agreement.completed)
                return setUiError("24 hours Grace period not yet ended");

            const remaining = agreement.remainingAmount;
            if (remaining / 2n === 0n)
                return setUiError("Not enough funds to partial release");
            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "partialAutoRelease",
                args: [BigInt(agreement?.id)],
            });
            setUiSuccess("Partial release tx submitted");
        } catch (error) {
            setLoading("partialRelease", false);
            setUiError("Error processing partial release");
            console.error("Error processing partial release:", error);
        }
    };

    const handleCancellationTImeout = () => {
        resetMessages();
        setLoading("cancellationTimeout", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (agreement.grace1Ends === 0n)
                return setUiError("No approved delivery yet");
            if (now < agreement.grace1Ends && !agreement.completed)
                return setUiError("24 hours Grace period not yet ended");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (!agreement.pendingCancellation && !agreement.completed)
                return setUiError("There is not pending cancellation");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");
            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "enforceCancellationTimeout",
                args: [BigInt(agreement?.id)],
            });
            setUiSuccess("enforceCancellationTimeout tx submitted");
        } catch (error) {
            setLoading("cancellationTimeout", false);
            setUiError("Error processing cancellation timeout");
            console.error("Error processing cancellation timeout:", error);
        }
    };

    const handleFinalRelease = () => {
        resetMessages();
        setLoading("finalRelease", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (agreement.grace2Ends === 0n && !agreement.completed)
                return setUiError("48 hours grace period has not started");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (agreement.vesting)
                return setUiError("You cannot release full funds on vesting");
            if (agreement.remainingAmount === 0n && !agreement.completed)
                return setUiError("Not enough funds to release");
            if (now < agreement.grace2Ends && !agreement.completed)
                return setUiError("48 hours Grace period not yet ended");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");
            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "finalAutoRelease",
                args: [BigInt(agreement?.id)],
            });
            setUiSuccess("Final release tx submitted");
        } catch (error) {
            setLoading("finalRelease", false);
            setUiError("Error processing final release");
            console.error("Error processing final release:", error);
        }
    };

    const handleRaiseDisputeWithModal = async () => {
        resetMessages();
        setLoading("raiseDispute", true);
        try {
            if (!agreement?.id) return setUiError("Agreement ID required");
            if (!isLoadedAgreement) return setUiError("Load the agreement first");
            if (!isServiceProvider && !isServiceRecipient)
                return setUiError("Only parties to the agreement can raise a dispute");
            if (!agreement.funded) return setUiError("Agreement not funded");
            if (!agreement.signed) return setUiError("Agreement not signed");
            if (agreement.completed) return setUiError("The agreement is completed");
            if (agreement.frozen) return setUiError("The agreement is frozen");
            if (agreement.disputed)
                return setUiError("The agreement is already in dispute");

            // Validate dispute form
            if (!disputeForm.votingId) return setUiError("Voting ID is required");

            let feeAmount = 0n;
            if (!disputeForm.proBono) {
                if (!disputeForm.feeAmount || Number(disputeForm.feeAmount) <= 0)
                    return setUiError("Fee amount is required when not pro bono");

                try {
                    feeAmount = parseEther(disputeForm.feeAmount);
                } catch (err) {
                    setUiError("Invalid fee amount format");
                    return err;
                }
            }

            const isETHFee = !disputeForm.proBono;
            const votingId = 35050; // Fix voting ID to be random

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: "raiseDispute",
                args: [
                    BigInt(agreement?.id),
                    BigInt(votingId)
                ],
                value: isETHFee ? feeAmount : 0n,
            });

            setUiSuccess("Dispute raised successfully!");
            setShowDisputeModal(false);
        } catch (error: unknown) {
            setLoading("raiseDispute", false);
            setUiError(
                typeof error === "string"
                    ? error
                    : error instanceof Error
                        ? error.message
                        : "Error raising dispute",
            );
            console.error("Error raising dispute:", error);
        }
    };

    useEffect(() => {
        if (manageMilestoneCount) {
            // refetch contract reads if milestone count changed
            refetchMilestonesData();
        } else {
            setMilestones([]);
        }
    }, [manageMilestoneCount, refetchMilestonesData]);

    useEffect(() => {
        if (writeError) {
            resetAllLoading();
            setUiError("Transaction was rejected or failed");
            setDepositState({
                isApprovingToken: false,
                needsApproval: false,
                approvalHash: null,
            });
            resetWrite();
        }
    }, [writeError, resetWrite]);

    useEffect(() => {
        if (approvalError) {
            resetAllLoading();
            setUiError("Token approval was rejected or failed");
            setDepositState({
                isApprovingToken: false,
                needsApproval: false,
                approvalHash: null,
            });
            resetApproval();
        }
    }, [approvalError, resetApproval]);

    useEffect(() => {
        resetMessages();
    }, []);

    useEffect(() => {
        if (approvalSuccess && depositState.needsApproval) {
            // proceed immediately to deposit
            depositDirectly();
        }
    }, [
        approvalSuccess,
        depositState.needsApproval,
        agreement?.id,
        agreement,
        depositDirectly,
    ]);

    return (
        <div className="min-h-screen">
            <div className="container mx-auto py-8 lg:px-4">
                <div className="glass max-w-[1000px] rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                    <h2 className="mb-6 text-2xl font-bold text-white">View Agreement Details</h2>

                    <div className="mb-6 flex gap-3">
                        <Button
                            onClick={() => fetchAgreement(491347400n.toString())}
                            className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                            variant="outline"
                            disabled={loadingStates.loadAgreement || !networkInfo.chainId}
                        >
                            {loadingStates.loadAgreement ? "Fetching..." : "Fetch Details"}
                        </Button>
                    </div>

                    {agreement && (
                        <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                            <h3 className="mb-4 text-xl font-bold text-white">Agreement Information</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    { label: "ID", value: agreement?.id.toString(), icon: FileText },
                                    { label: "Creator", value: agreement.creator, icon: Users },
                                    { label: "Service Provider", value: agreement.serviceProvider, icon: UserCheck },
                                    { label: "Service Recipient", value: agreement.serviceRecipient, icon: Users },
                                    { label: "Token", value: agreement.token, icon: DollarSign },
                                    {
                                        label: "Amount",
                                        value: `${formatAmountSafe(agreement.amount)} ${agreement.token === ZERO_ADDRESS ? "ETH" : tokenSymbol}`,
                                        icon: DollarSign,
                                    },
                                    {
                                        label: "Remaining",
                                        value: `${formatAmountSafe(agreement.remainingAmount)} ${agreement.token === ZERO_ADDRESS ? "ETH" : tokenSymbol}`,
                                        icon: DollarSign,
                                    },
                                    { label: "createdAt", value: agreement.createdAt.toString(), icon: Calendar },
                                    { label: "deadline", value: agreement.deadline.toString(), icon: Clock },
                                    { label: "deadlineDuration", value: agreement.deadlineDuration.toString(), icon: Clock },
                                    {
                                        label: "grace1Ends",
                                        value: (
                                            <span>
                                                {agreement.grace1Ends.toString()}
                                                {agreement.grace1Ends > 0n && (
                                                    <span className="ml-2">
                                                        (<CountdownTimer targetTimestamp={agreement.grace1Ends} onComplete={reload} />)
                                                    </span>
                                                )}
                                            </span>
                                        ),
                                        icon: Clock,
                                    },
                                    {
                                        label: "grace2Ends",
                                        value: (
                                            <span>
                                                {agreement.grace2Ends.toString()}
                                                {agreement.grace2Ends > 0n && (
                                                    <span className="ml-2">
                                                        (<CountdownTimer targetTimestamp={agreement.grace2Ends} onComplete={reload} />)
                                                    </span>
                                                )}
                                            </span>
                                        ),
                                        icon: Clock,
                                    },
                                    { label: "grace1EndsCalledBy", value: agreement.grace1EndsCalledBy, icon: Users },
                                    { label: "grace2EndsCalledBy", value: agreement.grace2EndsCalledBy, icon: Users },
                                    { label: "funded", value: String(agreement.funded), icon: DollarSign },
                                    { label: "signed", value: String(agreement.signed), icon: FileText },
                                    { label: "acceptedByServiceProvider", value: String(agreement.acceptedByServiceProvider), icon: UserCheck },
                                    { label: "acceptedByServiceRecipient", value: String(agreement.acceptedByServiceRecipient), icon: UserCheck },
                                    { label: "completed", value: String(agreement.completed), icon: CheckCircle },
                                    { label: "disputed", value: String(agreement.disputed), icon: AlertTriangle },
                                    { label: "privateMode", value: String(agreement.privateMode), icon: Lock },
                                    { label: "frozen", value: String(agreement.frozen), icon: Shield },
                                    { label: "pendingCancellation", value: String(agreement.pendingCancellation), icon: Ban },
                                    { label: "orderCancelled", value: String(agreement.orderCancelled), icon: XCircle },
                                    { label: "Vesting State", value: String(agreement.vesting), icon: Package },
                                    { label: "deliverySubmitted", value: String(agreement.deliverySubmited), icon: PackageCheck },
                                    { label: "votingId", value: agreement.votingId.toString(), icon: FileText },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start space-x-3 rounded-lg border border-white/10 bg-white/5 p-3">
                                        <item.icon className="mt-0.5 h-4 w-4 text-cyan-400" />
                                        <div>
                                            <div className="text-sm text-cyan-300">{item.label}:</div>
                                            <div className="font-mono text-xs break-all text-white">{item.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {agreement && (
                        <div className="glass mb-6 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                            <h3 className="mb-4 text-lg font-semibold text-white">
                                Agreement Overview
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-cyan-400" />
                                    <div>
                                        <div className="text-sm text-cyan-300">
                                            Agreement ID
                                        </div>
                                        <div className="font-mono text-white">
                                            {agreement.id.toString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Users className="h-5 w-5 text-purple-400" />
                                    <div>
                                        <div className="text-sm text-cyan-300">Parties</div>
                                        <div className="text-white">
                                            Provider: {agreement.serviceProvider.toString().slice(0, 8)}...
                                            <br />
                                            Recipient: {agreement.serviceRecipient.toString().slice(0, 8)}...
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <DollarSign className="h-5 w-5 text-emerald-400" />
                                    <div>
                                        <div className="text-sm text-cyan-300">Amount</div>
                                        <div className="text-white">
                                            {formatAmount(
                                                agreement.amount,
                                                manageTokenDecimals as unknown as number,
                                            )}{" "}
                                            {agreement.token === ZERO_ADDRESS
                                                ? "ETH"
                                                : manageTokenSymbol}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Shield className="h-5 w-5 text-cyan-400" />
                                    <div>
                                        <div className="text-sm text-cyan-300">Mode</div>
                                        <div className="text-white">
                                            {agreement.vesting ? "Vesting" : "Standard"}
                                            {agreement.privateMode ? " • Private" : " • Public"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Indicators */}
                            <div className="mt-4 space-y-2">
                                {agreement.grace1Ends > 0n && agreement.pendingCancellation && (
                                    <div className="flex items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
                                        <Clock className="h-4 w-4 text-orange-400" />
                                        <span className="text-orange-300">
                                            Pending Order Cancellation:{" "}
                                            <CountdownTimer
                                                targetTimestamp={agreement.grace1Ends}
                                            // onComplete={refetchAgreement}
                                            />
                                        </span>
                                    </div>
                                )}
                                {agreement.frozen && (
                                    <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                                        <AlertTriangle className="h-4 w-4 text-red-400" />
                                        <span className="text-red-300">
                                            Agreement is Frozen!
                                        </span>
                                    </div>
                                )}
                                {agreement.grace1Ends > 0n && agreement.pendingCancellation && (
                                    <div className="flex items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-3">
                                        <Info className="h-4 w-4 text-yellow-400" />
                                        <span className="text-yellow-300">
                                            {(() => {
                                                const initiator = agreement.grace1EndsCalledBy;
                                                const serviceProvider = agreement.serviceProvider;
                                                const serviceRecipient = agreement.serviceRecipient;

                                                if (
                                                    initiator &&
                                                    serviceProvider &&
                                                    serviceRecipient
                                                ) {
                                                    const initiatorLower = initiator
                                                        .toString()
                                                        .toLowerCase();
                                                    const serviceProviderLower = serviceProvider
                                                        .toString()
                                                        .toLowerCase();
                                                    const serviceRecipientLower = serviceRecipient
                                                        .toString()
                                                        .toLowerCase();

                                                    if (initiatorLower === serviceRecipientLower) {
                                                        return "Cancellation request sent, waiting for service provider";
                                                    } else if (
                                                        initiatorLower === serviceProviderLower
                                                    ) {
                                                        return "Cancellation request sent, waiting for service recipient";
                                                    }
                                                }
                                                return "Cancellation request sent, waiting for the other party";
                                            })()}
                                        </span>
                                    </div>
                                )}
                                {agreement.grace1Ends > 0n &&
                                    agreement.deliverySubmited &&
                                    !agreement.vesting && (
                                        <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                                            <Clock className="h-4 w-4 text-blue-400" />
                                            <span className="text-blue-300">
                                                Pending Delivery [Grace period 1]:{" "}
                                                <CountdownTimer
                                                    targetTimestamp={agreement.grace1Ends}
                                                // onComplete={refetchAgreement}
                                                />
                                            </span>
                                        </div>
                                    )}
                                {agreement.grace1Ends > 0n && agreement.deliverySubmited && (
                                    <div className="flex items-center gap-2 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                                        <Package className="h-4 w-4 text-green-400" />
                                        <span className="text-green-300">
                                            Delivery submitted, waiting for service recipient
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col items-center gap-4 sm:flex-row">
                                    {!agreement.acceptedByServiceProvider && (
                                        <div className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                                            <UserCheck className="h-4 w-4 text-blue-400" />
                                            <span className="text-blue-300">
                                                Waiting for Service Provider Signature
                                            </span>
                                        </div>
                                    )}
                                    {!agreement.acceptedByServiceRecipient && (
                                        <div className="flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 p-3">
                                            <UserCheck className="h-4 w-4 text-purple-400" />
                                            <span className="text-purple-300">
                                                Waiting for Service Recipient Signature
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* start here */}

                    {agreement && (
                        <>
                            {/* Check if any action buttons are available */}
                            {(((isServiceProvider && !agreement.acceptedByServiceProvider) ||
                                (isServiceRecipient && !agreement.acceptedByServiceRecipient)) &&
                                agreement.funded) ||
                                (!agreement.funded && !agreement.signed) ||
                                (agreement.signed &&
                                    isServiceProvider &&
                                    !agreement.frozen &&
                                    !agreement.pendingCancellation &&
                                    !agreement.deliverySubmited) ||
                                (agreement.signed &&
                                    isServiceRecipient &&
                                    !agreement.pendingCancellation &&
                                    agreement.deliverySubmited) ||
                                (now < agreement.grace1Ends &&
                                    agreement.signed &&
                                    agreement.pendingCancellation &&
                                    address &&
                                    address.toLowerCase() !==
                                    String(agreement.grace1EndsCalledBy).toLowerCase() &&
                                    !agreement.deliverySubmited) ||
                                (agreement.signed &&
                                    !agreement.pendingCancellation &&
                                    !agreement.deliverySubmited &&
                                    !agreement.frozen) ||
                                (agreement.grace1Ends !== BigInt(0) &&
                                    !agreement.vesting &&
                                    now > agreement.grace1Ends &&
                                    agreement.funded &&
                                    !agreement.pendingCancellation &&
                                    agreement.signed) ||
                                (agreement.signed &&
                                    !agreement.vesting &&
                                    now > agreement.grace2Ends &&
                                    agreement.grace2Ends !== BigInt(0) &&
                                    agreement.funded &&
                                    agreement.pendingCancellation) ||
                                (agreement.signed &&
                                    now > agreement.grace1Ends &&
                                    agreement.pendingCancellation &&
                                    agreement.grace1Ends !== BigInt(0)) ||
                                (agreement.funded &&
                                    agreement.signed &&
                                    !agreement.disputed &&
                                    !agreement.completed &&
                                    !agreement.frozen &&
                                    !agreement.pendingCancellation) ? (
                                <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-white">
                                        Agreement Actions
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {/* Action Buttons */}

                                        {agreement &&
                                            ((isServiceProvider && !agreement.acceptedByServiceProvider) ||
                                                (isServiceRecipient && !agreement.acceptedByServiceRecipient)) &&
                                            agreement.funded && (
                                                <>
                                                    <Button
                                                        onClick={handleSignAgreement}
                                                        disabled={
                                                            !agreement?.id ||
                                                            isPending ||
                                                            loadingStates.signAgreement
                                                        }
                                                        className="w-fit border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                                                        variant="outline"
                                                    >
                                                        {loadingStates.signAgreement ? (
                                                            <>
                                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
                                                                Signing Agreement...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                Sign Agreement
                                                            </>
                                                        )}
                                                    </Button>
                                                </>
                                            )}

                                        {agreement && (isServiceRecipient) &&
                                            !agreement.funded &&
                                            !agreement.signed && (
                                                <Button
                                                    onClick={handleDepositFunds}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        isApprovalPending ||
                                                        loadingStates.depositFunds
                                                    }
                                                    className="neon-hover w-fit border-green-500/50 bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-400"
                                                    variant="outline"
                                                >
                                                    {loadingStates.depositFunds ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent"></div>
                                                            Depositing...
                                                        </>
                                                    ) : depositState.isApprovingToken ? (
                                                        isApprovalPending ? (
                                                            "Approving..."
                                                        ) : (
                                                            "Confirming..."
                                                        )
                                                    ) : (
                                                        <>
                                                            <DollarSign className="mr-2 h-4 w-4" />
                                                            Deposit Funds
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        {agreement &&
                                            agreement.signed &&
                                            isServiceProvider &&
                                            !agreement.frozen &&
                                            !agreement.pendingCancellation &&
                                            !agreement.deliverySubmited && (
                                                <Button
                                                    onClick={handleSubmitDelivery}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.submitDelivery
                                                    }
                                                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.submitDelivery ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent"></div>
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Package className="mr-2 h-4 w-4" />
                                                            Submit Delivery
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        {agreement &&
                                            agreement.signed &&
                                            isServiceRecipient &&
                                            !agreement.pendingCancellation &&
                                            agreement.deliverySubmited &&
                                            !agreement.completed && (
                                                <Button
                                                    onClick={() => handleApproveDelivery(true)}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.approveDelivery
                                                    }
                                                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.approveDelivery ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                                                            Approving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PackageCheck className="mr-2 h-4 w-4" />
                                                            Approve Delivery
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            agreement.signed &&
                                            isServiceRecipient &&
                                            !agreement.pendingCancellation &&
                                            agreement.deliverySubmited &&
                                            !agreement.completed && (
                                                <Button
                                                    onClick={() => handleApproveDelivery(false)}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.rejectDelivery
                                                    }
                                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.rejectDelivery ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                                            Rejecting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="mr-2 h-4 w-4" />
                                                            Reject Delivery
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            now < agreement.grace1Ends &&
                                            agreement.signed &&
                                            agreement.pendingCancellation &&
                                            address &&
                                            address.toLowerCase() !==
                                            String(agreement.grace1EndsCalledBy).toLowerCase() &&
                                            !agreement.deliverySubmited && (
                                                <Button
                                                    onClick={() => handleApproveCancellation(true)}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.approveCancellation
                                                    }
                                                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.approveCancellation ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                                                            Approving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Approve Cancellation
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            now < agreement.grace1Ends &&
                                            agreement.signed &&
                                            agreement.pendingCancellation &&
                                            address &&
                                            address.toLowerCase() !==
                                            String(agreement.grace1EndsCalledBy).toLowerCase() &&
                                            !agreement.deliverySubmited && (
                                                <Button
                                                    onClick={() => handleApproveCancellation(false)}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.approveCancellation
                                                    }
                                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.approveCancellation ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                                            Rejecting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Reject Cancellation
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            agreement.signed &&
                                            !agreement.pendingCancellation &&
                                            !agreement.deliverySubmited &&
                                            !agreement.frozen && (
                                                <Button
                                                    onClick={handleCancelOrder}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.cancelOrder
                                                    }
                                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.cancelOrder ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                                            Cancelling...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="mr-2 h-4 w-4" />
                                                            Cancel Order
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            agreement.grace1Ends !== BigInt(0) &&
                                            !agreement.vesting &&
                                            now > agreement.grace1Ends &&
                                            agreement.funded &&
                                            !agreement.pendingCancellation &&
                                            agreement.signed && (
                                                <Button
                                                    onClick={handlePartialRelease}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        agreement.vesting ||
                                                        loadingStates.partialRelease
                                                    }
                                                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.partialRelease ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent"></div>
                                                            Releasing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Partial Release
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            agreement.signed &&
                                            !agreement.vesting &&
                                            now > agreement.grace2Ends &&
                                            agreement.grace2Ends !== BigInt(0) &&
                                            agreement.funded &&
                                            agreement.pendingCancellation && (
                                                <Button
                                                    onClick={handleFinalRelease}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        agreement.vesting ||
                                                        loadingStates.finalRelease
                                                    }
                                                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.finalRelease ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
                                                            Releasing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Final Release
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            agreement.signed &&
                                            now > agreement.grace1Ends &&
                                            agreement.pendingCancellation &&
                                            agreement.grace1Ends !== BigInt(0) && (
                                                <Button
                                                    onClick={handleCancellationTImeout}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.cancellationTimeout
                                                    }
                                                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                                                    variant="outline"
                                                >
                                                    {loadingStates.cancellationTimeout ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            Cancellation Timeout
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {agreement &&
                                            agreement.funded &&
                                            agreement.signed &&
                                            !agreement.disputed &&
                                            !agreement.completed &&
                                            !agreement.frozen &&
                                            !agreement.pendingCancellation && (
                                                <Button
                                                    onClick={openDisputeModal}
                                                    disabled={
                                                        !agreement?.id ||
                                                        isPending ||
                                                        loadingStates.raiseDispute
                                                    }
                                                    className="border-purple-500/30 text-purple-400 hover:bg-purple-300/15"
                                                    variant="outline"
                                                >
                                                    {loadingStates.raiseDispute ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
                                                            Opening...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                                            Raise Dispute
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                        {/* Milestones Section */}
                                        {agreement &&
                                            agreement.vesting &&
                                            manageMilestoneCount! > 0 &&
                                            agreement.signed && (
                                                <div className="glass col-span-full mt-6 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                                                    <h3 className="mb-4 text-xl font-bold text-white">
                                                        Vesting Milestones
                                                    </h3>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full border-collapse rounded-lg bg-white/5">
                                                            <thead>
                                                                <tr className="border-b border-cyan-400/30">
                                                                    <th className="p-4 text-left text-cyan-300">
                                                                        Milestone
                                                                    </th>
                                                                    <th className="p-4 text-left text-cyan-300">
                                                                        Percentage
                                                                    </th>
                                                                    <th className="p-4 text-left text-cyan-300">
                                                                        Amount
                                                                    </th>
                                                                    <th className="p-4 text-left text-cyan-300">
                                                                        Unlock Time
                                                                    </th>
                                                                    <th className="p-4 text-left text-cyan-300">
                                                                        Time Remaining
                                                                    </th>
                                                                    <th className="p-4 text-left text-cyan-300">
                                                                        Status
                                                                    </th>
                                                                    <th className="p-4 text-left text-cyan-300">
                                                                        Actions
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {milestones.map((milestone, index) => (
                                                                    <MilestoneTableRow
                                                                        key={index}
                                                                        milestone={milestone}
                                                                        index={index}
                                                                        manageTokenDecimals={
                                                                            manageTokenDecimals as number
                                                                        }
                                                                        manageTokenSymbol={
                                                                            manageTokenSymbol as string
                                                                        }
                                                                        isServiceProvider={
                                                                            isServiceProvider as boolean
                                                                        }
                                                                        isServiceRecipient={
                                                                            isServiceRecipient as boolean
                                                                        }
                                                                        onClaimMilestone={
                                                                            handleClaimMilestone
                                                                        }
                                                                        onSetMilestoneHold={
                                                                            handleSetMilestoneHold
                                                                        }
                                                                        isLoadingClaim={
                                                                            loadingStates.claimMilestone
                                                                        }
                                                                        isLoadingHold={
                                                                            loadingStates.setMilestoneHold
                                                                        }
                                                                    />
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}

                    {showDisputeModal && (
                        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                            <div className="glass w-full max-w-md rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                                <h3 className="mb-4 text-xl font-bold text-white">
                                    Raise Dispute
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm text-cyan-300">
                                            Voting ID
                                        </label>
                                        <input
                                            type="text"
                                            value={disputeForm.votingId}
                                            onChange={(e) =>
                                                setDisputeForm({
                                                    ...disputeForm,
                                                    votingId: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                                            placeholder="Unique voting ID"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={disputeForm.proBono}
                                            onChange={(e) =>
                                                setDisputeForm({
                                                    ...disputeForm,
                                                    proBono: e.target.checked,
                                                })
                                            }
                                            className="h-4 w-4 rounded border-white/10 bg-white/5 text-cyan-400 focus:ring-cyan-400/20"
                                        />
                                        <label className="text-cyan-300">
                                            Pro Bono (Free of charge)
                                        </label>
                                    </div>

                                    {!disputeForm.proBono && (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-sm text-cyan-300">
                                                    Fee Amount
                                                </label>
                                                <input
                                                    type="text"
                                                    value={disputeForm.feeAmount}
                                                    onChange={(e) =>
                                                        setDisputeForm({
                                                            ...disputeForm,
                                                            feeAmount: e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                                                    placeholder="0.01"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Button
                                        onClick={handleRaiseDisputeWithModal}
                                        disabled={
                                            !agreement?.id || isPending || loadingStates.raiseDispute
                                        }
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        variant="outline"
                                    >
                                        {loadingStates.raiseDispute ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                                                Raising Dispute...
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                Raise Dispute
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => setShowDisputeModal(false)}
                                        className="flex-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <div className="mb-4 rounded bg-red-800/40 p-3 text-sm text-red-200">{error}</div>}
                    {uiError && (
                        <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                            <p className="text-red-400">{uiError}</p>
                        </div>
                    )}
                    {uiSuccess && (
                        <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                            <p className="text-green-400">{uiSuccess}</p>
                        </div>
                    )}
                    {isSuccess && (
                        <div className="mt-4 flex w-fit items-start gap-3 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                            <p className="text-green-400">Transaction successful!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Web3Escrow;
