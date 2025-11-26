import { useCallback, useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { ERC20_ABI, ZERO_ADDRESS } from "../web3/config";
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
    UserCheck,
    Package,
    PackageCheck,
    Ban,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getAgreement } from "../web3/readContract"; // adjust path if needed
import type { Agreement } from "../web3/interfaces";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";

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
    const [agreement, setAgreement] = useState<Agreement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // reload helper used by CountdownTimer onComplete
    const fetchAgreement = useCallback(async (id?: string) => {
        const idToUse = id;
        setError(null);
        setLoading(true);

        if (!networkInfo.chainId) {
            setError("Chain ID not available");
            setLoading(false);
            return;
        }

        if (!idToUse || idToUse.trim() === "") {
            setError("Please enter an agreement ID");
            setLoading(false);
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
            setLoading(false);
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
            setLoading(false);
        }
    }, [networkInfo.chainId]);

    // Token decimals / symbol using wagmi readContract; enabled only when we have an ERC20 token set
    const tokenAddress = agreement && agreement.token !== ZERO_ADDRESS ? (agreement.token as `0x${string}`) : undefined;

    const { data: manageTokenDecimals } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "decimals",
        query: {
            enabled: !!tokenAddress,
        },
    });

    const { data: manageTokenSymbol } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "symbol",
        query: {
            enabled: !!tokenAddress,
        },
    });

    const decimalsNumber = typeof manageTokenDecimals === "number" ? manageTokenDecimals : Number(manageTokenDecimals ?? 18);
    const tokenSymbol = (manageTokenSymbol as unknown as string) ?? (agreement?.token === ZERO_ADDRESS ? "ETH" : "TOKEN");

    // small helpers to access Agreement safely
    const formatAmountSafe = (amt: bigint) => formatAmount(amt, decimalsNumber);

    // reload when countdown completes
    const reload = useCallback(() => {
        fetchAgreement();
    }, [fetchAgreement]);

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
                            disabled={loading || !networkInfo.chainId}
                        >
                            {loading ? "Fetching..." : "Fetch Details"}
                        </Button>
                    </div>

                    {error && <div className="mb-4 rounded bg-red-800/40 p-3 text-sm text-red-200">{error}</div>}

                    {agreement && (
                        <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                            <h3 className="mb-4 text-xl font-bold text-white">Agreement Information</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    { label: "ID", value: agreement.id.toString(), icon: FileText },
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
                </div>
            </div>
        </div>
    );
}

export default Web3Escrow;
