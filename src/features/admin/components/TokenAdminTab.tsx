// src/features/admin/components/TokenAdminTab.tsx
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { parseUnits, formatUnits, isAddress } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ERC20_ABI } from "../../../web3/config";

function shortAddress(addr?: string) {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-white/35">{label}</p>
            <p className="mt-1 text-sm font-medium text-white/85">{value}</p>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    hint,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hint?: string;
    error?: string | undefined;
}) {
    return (
        <label className="block space-y-1.5">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-white/45">{label}</span>
                {hint && <span className="text-[11px] text-white/25">{hint}</span>}
            </div>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none ${error
                        ? "border-red-500/50 focus:border-red-400"
                        : "border-white/10 focus:border-purple-400/50"
                    }`}
            />
            {error && <p className="text-xs text-red-400/80">{error}</p>}
        </label>
    );
}

// ─── Validation helpers ────────────────────────────────────────────────

function validateFee(value: string): string | undefined {
    const n = Number(value);
    if (value === "" || isNaN(n)) return "Enter a number";
    if (n < 0 || n > 20) return "Must be 0‑20";
    return undefined;
}

function validateRequiredAddress(value: string): string | undefined {
    if (!value) return "Required";
    if (!isAddress(value)) return "Invalid address";
    return undefined;
}

function validatePositiveNumber(value: string, decimals: number): string | undefined {
    if (value === "") return "Required";
    try {
        const parsed = parseUnits(value, decimals);
        if (parsed <= 0n) return "Must be > 0";
    } catch {
        return "Invalid number for token decimals";
    }
    return undefined;
}

function validateTokenAddress(value: string): string | undefined {
    if (!value) return "Required";
    if (!isAddress(value)) return "Invalid address";
    return undefined;
}

function validateDecimals(value: string): string | undefined {
    const n = Number(value);
    if (value === "" || isNaN(n) || !Number.isInteger(n) || n < 1 || n > 18) {
        return "1‑18";
    }
    return undefined;
}

// ─── Component ─────────────────────────────────────────────────────────

export function TokenAdminTab({
    activeChainId,
    tokenAddress,
    explorerBase,
}: {
    activeChainId: number;
    tokenAddress: `0x${string}`;
    explorerBase: string;
}) {
    const { address: connectedAddress } = useAccount();
    const { writeContractAsync, isPending } = useWriteContract();

    // Form states
    const [feeForm, setFeeForm] = useState({ buyFee: "3", sellFee: "3" });
    const [walletForm, setWalletForm] = useState({
        marketing: "",
        development: "",
        platform: "",
    });
    const [limitsForm, setLimitsForm] = useState({
        taxSwapThreshold: "",
        maxTxnSwap: "",
        maxWalletSize: "",
    });
    const [rescueEthForm, setRescueEthForm] = useState({
        to: "",
        amount: "",
    });
    const [recoverTokenForm, setRecoverTokenForm] = useState({
        token: "",
        amount: "",
        decimals: "18",
    });

    // Validation errors
    const [feeErrors, setFeeErrors] = useState<Record<string, string | undefined>>({});
    const [walletErrors, setWalletErrors] = useState<Record<string, string | undefined>>({});
    const [limitErrors, setLimitErrors] = useState<Record<string, string | undefined>>({});
    const [rescueErrors, setRescueErrors] = useState<Record<string, string | undefined>>({});
    const [recoverErrors, setRecoverErrors] = useState<Record<string, string | undefined>>({});

    // On‑chain reads
    const { data: name } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "name",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: symbol } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "symbol",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: decimalsData } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "decimals",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const decimals = Number(decimalsData ?? 18);

    const { data: owner } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "owner",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: initialOwner } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "initialOwner",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: marketingWallet } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "marketingWallet",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: developmentWallet } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "developmentWallet",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: platformWallet } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "platformWallet",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: buyFee } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "_buyFee",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: sellFee } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "_sellFee",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: taxSwapThreshold } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "_taxSwapThreshold",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: maxTxnSwap } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "_maxTxnSwap",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: maxWalletSize } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "_maxWalletSize",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    const { data: pair } = useReadContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "uniswapV2Pair",
        chainId: activeChainId,
        query: { enabled: Boolean(tokenAddress) },
    });

    // Sync on‑chain values into forms
    useEffect(() => {
        if (buyFee === undefined || sellFee === undefined) return;
        setFeeForm({
            buyFee: String(Number(buyFee)),
            sellFee: String(Number(sellFee)),
        });
    }, [buyFee, sellFee]);

    useEffect(() => {
        if (taxSwapThreshold === undefined) return;
        setLimitsForm({
            taxSwapThreshold: formatUnits(taxSwapThreshold, decimals),
            maxTxnSwap: formatUnits(maxTxnSwap ?? 0n, decimals),
            maxWalletSize: formatUnits(maxWalletSize ?? 0n, decimals),
        });
    }, [taxSwapThreshold, maxTxnSwap, maxWalletSize, decimals]);

    // Run validation on every change
    useEffect(() => {
        setFeeErrors({
            buyFee: validateFee(feeForm.buyFee),
            sellFee: validateFee(feeForm.sellFee),
        });
    }, [feeForm]);

    useEffect(() => {
        setWalletErrors({
            marketing: validateRequiredAddress(walletForm.marketing),
            development: validateRequiredAddress(walletForm.development),
            platform: validateRequiredAddress(walletForm.platform),
        });
    }, [walletForm]);

    useEffect(() => {
        setLimitErrors({
            taxSwapThreshold: validatePositiveNumber(limitsForm.taxSwapThreshold, decimals),
            maxTxnSwap: validatePositiveNumber(limitsForm.maxTxnSwap, decimals),
            maxWalletSize: validatePositiveNumber(limitsForm.maxWalletSize, decimals),
        });
    }, [limitsForm, decimals]);

    useEffect(() => {
        setRescueErrors({
            to: validateRequiredAddress(rescueEthForm.to),
            amount: validatePositiveNumber(rescueEthForm.amount, 18),
        });
    }, [rescueEthForm]);

    useEffect(() => {
        const tokenErr = validateTokenAddress(recoverTokenForm.token);
        setRecoverErrors({
            token: tokenErr,
            amount: validatePositiveNumber(recoverTokenForm.amount, Number(recoverTokenForm.decimals)),
            decimals: validateDecimals(recoverTokenForm.decimals),
        });
    }, [recoverTokenForm]);

    const isOwner =
        connectedAddress &&
        (connectedAddress.toLowerCase() === String(owner ?? initialOwner ?? "").toLowerCase() ||
            connectedAddress.toLowerCase() === String(initialOwner ?? "").toLowerCase());

    const tokenStats = useMemo(
        () => [
            { label: "Name", value: String(name ?? "—") },
            { label: "Symbol", value: String(symbol ?? "—") },
            { label: "Decimals", value: String(decimals) },
            { label: "Owner", value: shortAddress(String(owner ?? initialOwner ?? "")) },
            { label: "Marketing", value: shortAddress(String(marketingWallet ?? "")) },
            { label: "Development", value: shortAddress(String(developmentWallet ?? "")) },
            { label: "Platform", value: shortAddress(String(platformWallet ?? "")) },
            { label: "Pair", value: shortAddress(String(pair ?? "")) },
        ],
        [name, symbol, decimals, owner, initialOwner, marketingWallet, developmentWallet, platformWallet, pair],
    );

    // ─── Submit handlers ───────────────────────────────────────────────

    const updateFees = async () => {
        if (Object.values(feeErrors).some(Boolean)) return;
        await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI.abi,
            functionName: "updateFees",
            args: [BigInt(feeForm.buyFee || "0"), BigInt(feeForm.sellFee || "0")],
            chainId: activeChainId,
        });
    };

    const updateWallets = async () => {
        if (Object.values(walletErrors).some(Boolean)) return;
        await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI.abi,
            functionName: "updateWallets",
            args: [
                walletForm.marketing as `0x${string}`,
                walletForm.development as `0x${string}`,
                walletForm.platform as `0x${string}`,
            ],
            chainId: activeChainId,
        });
    };

    const updateTxnLimits = async () => {
        if (Object.values(limitErrors).some(Boolean)) return;
        await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI.abi,
            functionName: "updateTxnAAmount",
            args: [
                parseUnits(limitsForm.taxSwapThreshold || "0", decimals),
                parseUnits(limitsForm.maxTxnSwap || "0", decimals),
                parseUnits(limitsForm.maxWalletSize || "0", decimals),
            ],
            chainId: activeChainId,
        });
    };

    const enableSwap = async () => {
        await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI.abi,
            functionName: "enableSwap",
            args: [],
            chainId: activeChainId,
        });
    };

    const rescueEth = async () => {
        if (Object.values(rescueErrors).some(Boolean)) return;
        await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI.abi,
            functionName: "rescueEth",
            args: [rescueEthForm.to as `0x${string}`, parseUnits(rescueEthForm.amount || "0", 18)],
            chainId: activeChainId,
        });
    };

    const recoverToken = async () => {
        if (Object.values(recoverErrors).some(Boolean)) return;
        const rawAmount = BigInt(recoverTokenForm.amount || "0");
        const dec = Number(recoverTokenForm.decimals);
        await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI.abi,
            functionName: "recoverStuckToken",
            args: [recoverTokenForm.token as `0x${string}`, rawAmount, BigInt(dec)],
            chainId: activeChainId,
        });
    };

    // Button disabled logic
    const feesValid = !Object.values(feeErrors).some(Boolean);
    const walletsValid = !Object.values(walletErrors).some(Boolean);
    const limitsValid = !Object.values(limitErrors).some(Boolean);
    const rescueValid = !Object.values(rescueErrors).some(Boolean);
    const recoverValid = !Object.values(recoverErrors).some(Boolean);

    if (!tokenAddress) {
        return (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                Token contract is not configured for this chain.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!isOwner && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                    <AlertTriangle size={14} />
                    Connected wallet is not the token owner. Read-only access only.
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {tokenStats.map(item => (
                    <Stat key={item.label} label={item.label} value={item.value} />
                ))}
            </div>

            {/* Fees & Wallets row */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-sm font-semibold text-white/90">Fees</h3>
                    <Field
                        label="Buy fee (%)"
                        value={feeForm.buyFee}
                        onChange={v => setFeeForm(f => ({ ...f, buyFee: v }))}
                        placeholder="3"
                        hint="max 20"
                        error={feeErrors.buyFee}
                    />
                    <Field
                        label="Sell fee (%)"
                        value={feeForm.sellFee}
                        onChange={v => setFeeForm(f => ({ ...f, sellFee: v }))}
                        placeholder="3"
                        hint="max 20"
                        error={feeErrors.sellFee}
                    />
                    <button
                        disabled={isPending || !isOwner || !feesValid}
                        onClick={updateFees}
                        className="w-full rounded-lg bg-purple-500/20 px-4 py-2.5 text-sm font-medium text-purple-300 ring-1 ring-purple-400/30 hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isPending ? "Updating..." : "Update fees"}
                    </button>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-sm font-semibold text-white/90">Wallets</h3>
                    <Field
                        label="Marketing wallet"
                        value={walletForm.marketing}
                        onChange={v => setWalletForm(f => ({ ...f, marketing: v }))}
                        placeholder="0x..."
                        error={walletErrors.marketing}
                    />
                    <Field
                        label="Development wallet"
                        value={walletForm.development}
                        onChange={v => setWalletForm(f => ({ ...f, development: v }))}
                        placeholder="0x..."
                        error={walletErrors.development}
                    />
                    <Field
                        label="Platform wallet"
                        value={walletForm.platform}
                        onChange={v => setWalletForm(f => ({ ...f, platform: v }))}
                        placeholder="0x..."
                        error={walletErrors.platform}
                    />
                    <button
                        disabled={isPending || !isOwner || !walletsValid}
                        onClick={updateWallets}
                        className="w-full rounded-lg bg-purple-500/20 px-4 py-2.5 text-sm font-medium text-purple-300 ring-1 ring-purple-400/30 hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isPending ? "Updating..." : "Update wallets"}
                    </button>
                </div>
            </div>

            {/* Limits, Swap, and Recovery row – three columns */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Limits card (now without the enable button) */}
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-sm font-semibold text-white/90">Limits</h3>
                    <Field
                        label="Tax swap threshold"
                        value={limitsForm.taxSwapThreshold}
                        onChange={v => setLimitsForm(f => ({ ...f, taxSwapThreshold: v }))}
                        placeholder="100000"
                        hint={`token units, decimals=${decimals}`}
                        error={limitErrors.taxSwapThreshold}
                    />
                    <Field
                        label="Max transaction"
                        value={limitsForm.maxTxnSwap}
                        onChange={v => setLimitsForm(f => ({ ...f, maxTxnSwap: v }))}
                        placeholder="200000"
                        hint={`token units, decimals=${decimals}`}
                        error={limitErrors.maxTxnSwap}
                    />
                    <Field
                        label="Max wallet"
                        value={limitsForm.maxWalletSize}
                        onChange={v => setLimitsForm(f => ({ ...f, maxWalletSize: v }))}
                        placeholder="200000"
                        hint={`token units, decimals=${decimals}`}
                        error={limitErrors.maxWalletSize}
                    />
                    <button
                        disabled={isPending || !isOwner || !limitsValid}
                        onClick={updateTxnLimits}
                        className="w-full rounded-lg bg-purple-500/20 px-4 py-2.5 text-sm font-medium text-purple-300 ring-1 ring-purple-400/30 hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isPending ? "Updating..." : "Update limits"}
                    </button>
                </div>

                {/* Swap card – standalone button */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                    <h3 className="mb-4 text-sm font-semibold text-white/90">Swap</h3>
                    <p className="mb-4 text-xs text-white/40">
                        Once enabled, taxed tokens will be automatically swapped for ETH.
                    </p>
                    <button
                        disabled={isPending || !isOwner}
                        onClick={enableSwap}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Enabling...
                            </>
                        ) : (
                            "Enable swap"
                        )}
                    </button>
                </div>

                {/* Recovery card */}
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-sm font-semibold text-white/90">Recovery</h3>
                    <Field
                        label="ETH rescue to"
                        value={rescueEthForm.to}
                        onChange={v => setRescueEthForm(f => ({ ...f, to: v }))}
                        placeholder="0x..."
                        error={rescueErrors.to}
                    />
                    <Field
                        label="ETH amount"
                        value={rescueEthForm.amount}
                        onChange={v => setRescueEthForm(f => ({ ...f, amount: v }))}
                        placeholder="0.01"
                        error={rescueErrors.amount}
                    />
                    <button
                        disabled={isPending || !isOwner || !rescueValid}
                        onClick={rescueEth}
                        className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Rescue ETH
                    </button>

                    <div className="h-px bg-white/10" />

                    <Field
                        label="Token address"
                        value={recoverTokenForm.token}
                        onChange={v => setRecoverTokenForm(f => ({ ...f, token: v }))}
                        placeholder="0x..."
                        error={recoverErrors.token}
                    />
                    <Field
                        label="Token amount"
                        value={recoverTokenForm.amount}
                        onChange={v => setRecoverTokenForm(f => ({ ...f, amount: v }))}
                        placeholder="1000"
                        error={recoverErrors.amount}
                    />
                    <Field
                        label="Token decimals"
                        value={recoverTokenForm.decimals}
                        onChange={v => setRecoverTokenForm(f => ({ ...f, decimals: v }))}
                        placeholder="18"
                        error={recoverErrors.decimals}
                    />
                    <button
                        disabled={isPending || !isOwner || !recoverValid}
                        onClick={recoverToken}
                        className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Recover stuck token
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/40">
                Token: <span className="text-white/70">{tokenAddress}</span> · Explorer:{" "}
                <a
                    href={`${explorerBase}/address/${tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-300 hover:text-purple-200"
                >
                    open
                </a>
            </div>
        </div>
    );
}