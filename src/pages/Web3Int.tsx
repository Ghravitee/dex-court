import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
    useAccount,
    useWriteContract,
    useReadContract,
    useWaitForTransactionReceipt,
    useChainId,
    useContractReads,
} from 'wagmi';
import { parseEther, formatEther, parseUnits } from 'viem';
import { ESCROW_ABI, ESCROW_CA, ERC20_ABI, ZERO_ADDRESS } from '../web3/config';
import { MilestoneTableRow } from '../web3/MilestoneTableRow';
import { formatAmount } from '../web3/helper';

function isValidAddress(addr: string) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// In your main component, update the MilestoneData interface:
interface MilestoneData {
    percentBP: bigint;
    unlockAt: bigint;
    heldByRecipient: boolean;
    claimed: boolean;
    amount: bigint;
}

// Add CountdownTimer component
function CountdownTimer({ targetTimestamp, onComplete }: { targetTimestamp: bigint; onComplete?: () => void }) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const target = Number(targetTimestamp);
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft('Expired');
                onComplete?.();
                return;
            }

            const days = Math.floor(difference / (60 * 60 * 24));
            const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((difference % (60 * 60)) / 60);
            const seconds = difference % 60;

            setTimeLeft(
                `${days > 0 ? `${days}d ` : ''}${hours.toString().padStart(2, '0')}:${minutes
                    .toString()
                    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [targetTimestamp, onComplete]);

    return (
        <span className={`font-mono ${timeLeft === 'Expired' ? 'text-green-400' : 'text-yellow-400'}`}>
            {timeLeft}
        </span>
    );
}

function Web3Int() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [activeTab, setActiveTab] = useState('create');
    const [agreementId, setAgreementId] = useState('');
    const [depositState, setDepositState] = useState({
        isApprovingToken: false,
        approvalHash: null,
        needsApproval: false,
    });
    const [createApprovalState, setCreateApprovalState] = useState({
        isApprovingToken: false,
        needsApproval: false,
    });
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const [currentTime, setCurrentTime] = useState(BigInt(Math.floor(Date.now() / 1000)));

    // Create Agreement Form
    const [createForm, setCreateForm] = useState({
        agreementId: '',
        serviceProvider: '',
        serviceRecipient: '',
        token: ZERO_ADDRESS,
        amount: '',
        deadlineDuration: '604800',
        privateMode: false,
        vestingMode: false,
        milestonePercs: ['50', '50'], // Default: 50%, 50%
        milestoneOffsets: ['0', '302400'] // Default: immediate, 3.5 days
    });

    // View Agreement
    const [viewId, setViewId] = useState('');
    const [uiError, setUiError] = useState<string | null>(null);
    const [uiSuccess, setUiSuccess] = useState<string | null>(null);

    const [milestones, setMilestones] = useState<MilestoneData[]>([]);

    const contractAddress = ESCROW_CA[chainId as number];

    // Update current time every second for countdowns
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(BigInt(Math.floor(Date.now() / 1000)));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Write Contract Hook
    const { data: hash, writeContract, isPending,
        error: writeError,
        reset: resetWrite } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Read Stats
    const { data: stats, refetch: refetchStats } = useReadContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: 'getStats',
    });

    // Read Agreement (used for both view & manage)
    const { data: agreement, refetch: refetchAgreement } = useReadContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: 'getAgreement',
        args: viewId ? [BigInt(viewId)] : undefined,
        query: { enabled: !!viewId },
    });

    // Approval hooks for ERC20
    const {
        data: approvalHash,
        writeContract: writeApproval,
        isPending: isApprovalPending,
        error: approvalError,
        reset: resetApproval,
    } = useWriteContract();

    const { isSuccess: approvalSuccess } =
        useWaitForTransactionReceipt({ hash: approvalHash });

    // Token decimals for create form
    const { data: createTokenDecimals } = useReadContract({
        address: createForm.token !== ZERO_ADDRESS ? createForm.token as `0x${string}` : undefined,
        abi: ERC20_ABI.abi,
        functionName: 'decimals',
        query: {
            enabled: createForm.token !== ZERO_ADDRESS && isValidAddress(createForm.token)
        },
    });

    // Token decimals for manage tab
    const { data: manageTokenDecimals } = useReadContract({
        address: agreement && agreement[4] !== ZERO_ADDRESS ? agreement[4] as `0x${string}` : undefined,
        abi: ERC20_ABI.abi,
        functionName: 'decimals',
        query: {
            enabled: !!agreement && agreement[4] !== ZERO_ADDRESS
        },
    });

    const { data: manageTokenSymbol } = useReadContract({
        address: agreement && agreement[4] !== ZERO_ADDRESS ? agreement[4] as `0x${string}` : undefined,
        abi: ERC20_ABI.abi,
        functionName: 'symbol',
        query: {
            enabled: !!agreement && agreement[4] !== ZERO_ADDRESS
        },
    });

    // convert a user percent string like "50" or "12.5" -> basis points as number (e.g. 50 -> 5000)
    const percentToBP = (s: string): number => {
        const n = Number(s);
        if (Number.isNaN(n)) return 0;
        // multiply by 100 to get basis points (100% -> 10000)
        // use Math.round to handle decimals safely (e.g. 12.345 -> 1235 bp)
        return Math.round(n * 100);
    };

    // derived roles when agreement is loaded
    const isLoadedAgreement = !!agreement;
    const isServiceProvider = isLoadedAgreement && address && agreement && address.toLowerCase() === agreement[2].toString().toLowerCase();
    const isServiceRecipient = isLoadedAgreement && address && agreement && address.toLowerCase() === agreement[3].toString().toLowerCase();
    const now = currentTime;

    // helper to reset messages
    const resetMessages = () => {
        setUiError(null);
        setUiSuccess(null);
    };

    // Safe getters for agreement fields
    const getField = useCallback((idx: number): unknown => {
        if (!agreement) return undefined;
        if (agreement.length <= idx) return undefined;
        return agreement[idx];
    }, [agreement]);

    const getBigIntField = useCallback((idx: number): bigint => {
        const v = getField(idx);
        if (v === undefined || v === null) return 0n;
        try {
            // handle both BigInt and numeric strings
            if (typeof v === 'bigint') return v;
            if (typeof v === 'string') return BigInt(v);
            // some libs return objects with toString
            return BigInt(v.toString());
        } catch {
            return 0n;
        }
    }, [getField]);

    const getBoolField = useCallback((idx: number): boolean => {
        const v = getField(idx);
        return !!v;
    }, [getField]);

    // Fetch milestone count - enable when viewId exists and vesting is enabled
    const {
        data: milestoneCount,
        refetch: refetchMilestoneCount,
        // error: milestoneCountError
    } = useReadContract({
        address: contractAddress,
        abi: ESCROW_ABI.abi,
        functionName: 'getMilestoneCount',
        args: viewId ? [BigInt(viewId)] : undefined,
        query: {
            enabled: !!viewId && getBoolField(24),
        },
    });

    // Create contracts array for milestones ONLY when we have a valid count
    const contractsForMilestones = useMemo(() => {
        if (!milestoneCount || !viewId || !getBoolField(24)) {
            return [];
        }

        const count = Number(milestoneCount);
        if (count === 0) return [];

        console.log(`Creating ${count} milestone contracts, trigger: ${refetchTrigger}`);

        return Array.from({ length: count }, (_, i) => ({
            address: contractAddress as `0x${string}`,
            abi: ESCROW_ABI.abi,
            functionName: 'getMilestone' as const,
            args: [BigInt(viewId), BigInt(i)],
        }));
    }, [milestoneCount, viewId, getBoolField, refetchTrigger, contractAddress]);

    // Fetch all milestones
    const {
        data: rawMilestonesData,
        refetch: refetchMilestonesData,
        // error: milestonesError
    } = useContractReads({
        contracts: contractsForMilestones,
        query: {
            enabled: contractsForMilestones.length > 0,
        },
    });

    // helper to safely convert various on-chain shapes to bigint
    const toBigIntSafe = (v: unknown): bigint => {
        if (typeof v === 'bigint') return v;
        if (typeof v === 'number') return BigInt(Math.floor(v));
        if (typeof v === 'string' && /^\d+$/.test(v)) return BigInt(v);
        // some libs return objects with toString()
        if (v && typeof (v as { toString?: () => string }).toString === 'function') {
            const s = (v as { toString: () => string }).toString();
            if (/^\d+$/.test(s)) return BigInt(s);
        }
        return 0n;
    };

    const triggerMilestoneRefetch = useCallback(() => {
        setRefetchTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (!rawMilestonesData || !Array.isArray(rawMilestonesData)) {
            setMilestones([]);
            return;
        }

        try {
            const mapped = rawMilestonesData
                .filter(item => item.status === 'success' && item.result)
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
                    if (typeof r === 'object') {
                        const obj = r as unknown as Record<string, unknown>;
                        const percentBP = toBigIntSafe(obj.percentBP ?? obj['0']);
                        const unlockAt = toBigIntSafe(obj.unlockAt ?? obj['1']);
                        const heldByRecipient = !!(obj.heldByRecipient ?? obj['2']);
                        const claimed = !!(obj.claimed ?? obj['3']);
                        const amount = toBigIntSafe(obj.amount ?? obj['4']);
                        return { percentBP, unlockAt, heldByRecipient, claimed, amount };
                    }

                    return null;
                })
                .filter(Boolean) as MilestoneData[];

            setMilestones(mapped);
        } catch (err) {
            console.error('Error mapping milestones:', err);
            setMilestones([]);
        }
    }, [rawMilestonesData]);

    // Helper function to parse amount with correct decimals
    const parseAmount = (amount: string, tokenAddress: string, decimals?: number) => {
        const tokenIsETH = tokenAddress === ZERO_ADDRESS;
        if (tokenIsETH) {
            return parseEther(amount);
        } else {
            // Default to 18 if decimals not available, but this should be handled by the decimals fetch
            const actualDecimals = decimals || 18;
            return parseUnits(amount, actualDecimals);
        }
    };

    // ===================== VALIDATED ACTIONS ===================== //
    const handleCreateAgreement = async () => {
        resetMessages();
        try {
            if (!isConnected) return setUiError('Connect your wallet');
            if (!createForm.agreementId) return setUiError('Agreement ID is required');
            if (!isValidAddress(createForm.serviceProvider)) return setUiError('Invalid service provider address');
            if (!isValidAddress(createForm.serviceRecipient)) return setUiError('Invalid service recipient address');
            if (createForm.serviceProvider.toLowerCase() === createForm.serviceRecipient.toLowerCase()) return setUiError('serviceProvider and serviceRecipient cannot be the same');

            if (!createForm.amount || Number(createForm.amount) <= 0) return setUiError('Amount must be greater than 0');

            const tokenIsETH = createForm.token === ZERO_ADDRESS;
            const callerIsServiceRecipient = address && address.toLowerCase() === createForm.serviceRecipient.toLowerCase();

            if (!tokenIsETH && !isValidAddress(createForm.token)) return setUiError('Invalid token address');

            let value: bigint = 0n;
            try {
                value = parseAmount(createForm.amount, createForm.token, createTokenDecimals as unknown as number);
                if (value <= 0n) return setUiError('Parsed amount is zero or invalid');
            } catch (err) {
                setUiError('Invalid amount format');
                console.error('parseAmount error', err);
                return;
            }

            if (createForm.vestingMode) {
                if (createForm.milestonePercs.length === 0 || createForm.milestoneOffsets.length === 0) {
                    return setUiError('Milestone percentages and offsets are required for vesting mode');
                }
                if (createForm.milestonePercs.length !== createForm.milestoneOffsets.length) {
                    return setUiError('Milestone percentages and offsets arrays must have the same length');
                }

                const deadlineNum = Number(createForm.deadlineDuration);
                if (!Number.isFinite(deadlineNum) || deadlineNum <= 0) {
                    return setUiError('Deadline must be a positive number (seconds) for vesting');
                }

                // validate each offset is numeric, >= 0 and <= deadlineDuration
                for (let idx = 0; idx < createForm.milestoneOffsets.length; idx++) {
                    const offStr = createForm.milestoneOffsets[idx];
                    const offNum = Number(offStr);
                    if (!Number.isFinite(offNum) || offNum < 0) {
                        return setUiError(`Milestone offset #${idx} is invalid`);
                    }
                    if (offNum > deadlineNum) {
                        return setUiError(`Milestone offset #${idx} (${offNum}s) cannot be greater than deadline (${deadlineNum}s)`);
                    }
                }

                const totalBP = createForm.milestonePercs
                    .reduce((sum, perc) => sum + percentToBP(perc), 0);
                if (totalBP !== 10000) {
                    return setUiError('Total milestone percentages must equal 100 (sum of percentages)');
                    // UI shows perc values, but we enforce 10000 bp under the hood
                }

            }

            if (!tokenIsETH && callerIsServiceRecipient) {
                setCreateApprovalState(prev => ({ ...prev, needsApproval: true, isApprovingToken: true }));
                setUiSuccess('Approving tokens for contract...');

                writeApproval({
                    address: createForm.token as `0x${string}`,
                    abi: ERC20_ABI.abi,
                    functionName: 'approve',
                    args: [contractAddress as `0x${string}`, value],
                });
                return;
            }

            const shouldSendETH = tokenIsETH && callerIsServiceRecipient;

            const milestonePercsBigInt = createForm.milestonePercs
                .map(perc => BigInt(percentToBP(perc)));
            const milestoneOffsetsBigInt = createForm.milestoneOffsets.map(offset => BigInt(offset));

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: 'createAgreement',
                args: [
                    BigInt(createForm.agreementId),
                    createForm.serviceProvider as `0x${string}`,
                    createForm.serviceRecipient as `0x${string}`,
                    createForm.token as `0x${string}`,
                    BigInt(value),
                    BigInt(createForm.deadlineDuration),
                    createForm.vestingMode,
                    createForm.privateMode,
                    milestonePercsBigInt,
                    milestoneOffsetsBigInt
                ],
                value: shouldSendETH ? value : BigInt(0),
            });

            setUiSuccess('Transaction submitted — check your wallet');
        } catch (error: unknown) {
            setUiError(typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Error creating agreement'));
            console.error('Error creating agreement:', error);
        }
    };

    const addMilestone = () => {
        setCreateForm(prev => ({
            ...prev,
            milestonePercs: [...prev.milestonePercs, '0'],
            milestoneOffsets: [...prev.milestoneOffsets, '0']
        }));
    };

    // Remove milestone input row
    const removeMilestone = (index: number) => {
        setCreateForm(prev => ({
            ...prev,
            milestonePercs: prev.milestonePercs.filter((_, i) => i !== index),
            milestoneOffsets: prev.milestoneOffsets.filter((_, i) => i !== index)
        }));
    };

    // Update milestone value
    const updateMilestone = (index: number, field: 'percs' | 'offsets', value: string) => {
        setCreateForm(prev => ({
            ...prev,
            [`milestone${field === 'percs' ? 'Percs' : 'Offsets'}`]: prev[`milestone${field === 'percs' ? 'Percs' : 'Offsets'}`].map((item, i) =>
                i === index ? value : item
            )
        }));
    };

    // Vesting management functions
    const handleClaimMilestone = async (index: number) => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (!isServiceProvider) return setUiError('Only serviceProvider can claim milestones');
        if (!getBoolField(24)) return setUiError('Agreement is not in vesting mode');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (!getBoolField(15)) return setUiError('Agreement not signed completely');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'claimMilestone',
            args: [BigInt(viewId), BigInt(index)],
        });
        setUiSuccess('Claim milestone transaction submitted');
    };

    const handleSetMilestoneHold = async (index: number, hold: boolean) => {
        console.log('handleSetMilestoneHold called with:', { index, hold, agreementId, viewId, address });

        resetMessages();
        try {
            if (!viewId) return setUiError('Agreement ID required');
            if (!isLoadedAgreement) return setUiError('Load the agreement first');
            if (!isServiceRecipient) return setUiError('Only serviceRecipient can set milestone hold');
            if (!getBoolField(24)) return setUiError('Agreement is not in vesting mode');
            if (getBoolField(18)) return setUiError('The agreement is completed');
            if (!getBoolField(15)) return setUiError('Agreement not signed completely');
            if (getBoolField(21)) return setUiError('The agreement is frozen');
            if (!milestoneCount) return setUiError('Milestone count not loaded');
            if (index >= Number(milestoneCount)) return setUiError('Invalid milestone index');

            // Check if milestone is already claimed
            if (milestones[index]?.claimed) return setUiError('Milestone already claimed');

            console.log(`Calling setMilestoneHold for agreement ${viewId}, milestone ${index}, hold: ${hold}`);

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: 'setMilestoneHold',
                args: [BigInt(viewId), BigInt(index), hold],
            });

            setUiSuccess(`Milestone ${hold ? 'held' : 'unheld'} transaction submitted`);
            triggerMilestoneRefetch();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            setUiError(`Failed to set milestone hold: ${msg}`);
            console.error('handleSetMilestoneHold error:', error);
        }
    };

    const handleLoadAgreementForManage = async () => {
        resetMessages();
        if (!agreementId) return setUiError('Enter an agreement id to load');
        setViewId(agreementId);
        try {
            await refetchAgreement();
            setUiSuccess('Agreement loaded');
        } catch (err) {
            setUiError('Unable to load agreement');
            console.error(err);
            return;
        }
    };

    const handleSignAgreement = () => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (!isServiceProvider && !isServiceRecipient) return setUiError('Only parties to the agreement can sign');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (getBoolField(15) && !getBoolField(18)) return setUiError('Agreement already signed');
        if (isServiceProvider && getBoolField(16) && !getBoolField(18)) return setUiError('You already signed the Agreement');
        if (isServiceRecipient && getBoolField(17) && !getBoolField(18)) return setUiError('You already signed the Agreement');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'signAgreement',
            args: [BigInt(agreementId)],
        });
        setUiSuccess('Sign transaction submitted');
    };

    const handleSubmitDelivery = () => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (!isServiceProvider && !getBoolField(18)) return setUiError('Only serviceProvider can submit delivery');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (!getBoolField(15)) return setUiError('Agreement not signed');
        if (getBigIntField(10) !== 0n && !getBoolField(22) && !getBoolField(18)) return setUiError('Submission is pending already');
        if (getBoolField(22)) return setUiError('Cancellation requested');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');


        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'submitDelivery',
            args: [BigInt(agreementId)],
        });
        setUiSuccess('Submit delivery transaction sent');
    };

    const handleApproveDelivery = (final: boolean) => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (!isServiceRecipient && final) return setUiError('Only serviceRecipient can approve delivery');
        if (!isServiceRecipient && !final) return setUiError('Only serviceRecipient can reject delivery');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (!getBoolField(15)) return setUiError('Agreement not signed');
        if (getBigIntField(10) === 0n && final) return setUiError('There are no pending delivery to approve');
        if (getBigIntField(10) === 0n && !final) return setUiError('There are no pending delivery to reject');
        if (getBoolField(22)) return setUiError('Cancellation requested');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'approveDelivery',
            args: [BigInt(agreementId), final],
        });
        setUiSuccess(final ? 'Approval submitted' : 'Rejection submitted');
    };

    const handleDepositFunds = async () => {
        resetMessages();
        try {
            if (!agreementId) return setUiError('Agreement ID required');
            if (!isLoadedAgreement) return setUiError('Load the agreement first');
            if (!isServiceProvider && !isServiceRecipient)
                return setUiError('Only parties to the agreement can deposit funds');
            if (getBoolField(14) && !getBoolField(18)) return setUiError('Agreement is funded already');
            if (getBoolField(18)) return setUiError('Agreement is already completed');
            if (getBoolField(21)) return setUiError('Agreement is frozen already');
            if (getBoolField(18)) return setUiError('The agreement is completed');
            if (getBoolField(21)) return setUiError('The agreement is frozen');

            const isERC20 = getField(4) !== ZERO_ADDRESS;

            if (isERC20) {
                const amount = getBigIntField(5);
                if (amount <= 0n) return setUiError('Invalid deposit amount');

                setDepositState(prev => ({ ...prev, needsApproval: true, isApprovingToken: true }));
                setUiSuccess('Approving token for deposit...');

                writeApproval({
                    address: getField(4) as `0x${string}`,
                    abi: ERC20_ABI.abi,
                    functionName: 'approve',
                    args: [contractAddress as `0x${string}`, amount],
                });
            } else {
                depositDirectly();
            }
        } catch (error) {
            setUiError(
                typeof error === 'string'
                    ? error
                    : error instanceof Error
                        ? error.message
                        : 'Error preparing deposit'
            );
            console.error('Error in handleDepositFunds:', error);
        }
    };

    const depositDirectly = useCallback(() => {
        try {
            if (!agreement) return setUiError('Agreement not loaded');
            if (getBoolField(18)) return setUiError('The agreement is completed');
            if (getBoolField(21)) return setUiError('The agreement is frozen');

            const amount = getBigIntField(5);
            const isERC20 = getField(4) !== ZERO_ADDRESS;

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: 'depositFunds',
                args: [BigInt(agreementId)],
                value: isERC20 ? BigInt(0) : amount,
            });

            setUiSuccess('Deposit transaction submitted');
            setDepositState(prev => ({ ...prev, needsApproval: false, isApprovingToken: false }));
        } catch (error) {
            setUiError(
                typeof error === 'string'
                    ? error
                    : error instanceof Error
                        ? error.message
                        : 'Error submitting deposit'
            );
            console.error('Error depositing funds:', error);
        }
    }, [agreement, agreementId, contractAddress, getBigIntField, getBoolField, getField, writeContract]);

    const handleApproveCancellation = (final: boolean) => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (!isServiceProvider && !isServiceRecipient) return setUiError('Only parties to the agreement can cancel the order');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (!getBoolField(15)) return setUiError('Agreement not signed');
        if (getBigIntField(10) === 0n && final) return setUiError('There are no pending order cancellation to approve');
        if (getBigIntField(10) === 0n && !final) return setUiError('There are no pending order cancellation to reject');
        if (!getBoolField(22) && !getBoolField(18)) return setUiError('No Cancellation requested');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        if (now > getBigIntField(10) && !getBoolField(18)) return setUiError('24 hour Grace period not yet ended');

        const initiator = getField(12);
        if (initiator && address && address.toLowerCase() === initiator.toString().toLowerCase() && final) return setUiError("You can't approve your own cancellation request");
        if (initiator && address && address.toLowerCase() === initiator.toString().toLowerCase() && !final) return setUiError("You can't reject your own cancellation request");

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'approveCancellation',
            args: [BigInt(agreementId), final],
        });
        setUiSuccess(final ? 'Cancellation approval submitted' : 'Cancellation rejection submitted');
    };

    const handleCancelOrder = () => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (!isServiceProvider && !isServiceRecipient) return setUiError('Only parties to the agreement can cancel the order');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (!getBoolField(15)) return setUiError('Agreement not signed');
        if (getBigIntField(10) !== 0n && !getBoolField(22) && !getBoolField(18)) return setUiError('Submission is pending');
        if (getBoolField(22)) return setUiError('Cancellation requested Already');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'cancelOrder',
            args: [BigInt(agreementId)],
        });
        setUiSuccess('Cancel transaction submitted');
    };

    const handlePartialRelease = () => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (getBigIntField(10) === 0n) return setUiError('No approved delivery yet');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (getBoolField(22)) return setUiError('Cancellation is in process');
        if (getBoolField(24)) return setUiError('You cannot release partial funds on Vesting');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        if (now < getBigIntField(10) && !getBoolField(18)) return setUiError('24 hours Grace period not yet ended');

        const remaining = getBigIntField(6);
        if (remaining / 2n === 0n) return setUiError('Not enough funds to partial release');

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'partialAutoRelease',
            args: [BigInt(agreementId)],
        });
        setUiSuccess('Partial release tx submitted');
    };

    const handleCancellationTImeout = () => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (getBigIntField(10) === 0n) return setUiError('No approved delivery yet');
        if (now < getBigIntField(10) && !getBoolField(18)) return setUiError('24 hours Grace period not yet ended');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (!getBoolField(22) && !getBoolField(18)) return setUiError('There is not pending cancellation');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'enforceCancellationTimeout',
            args: [BigInt(agreementId)],
        });
        setUiSuccess('Partial release tx submitted');
    };

    const handleFinalRelease = () => {
        resetMessages();
        if (!agreementId) return setUiError('Agreement ID required');
        if (!isLoadedAgreement) return setUiError('Load the agreement first');
        if (getBigIntField(11) === 0n && !getBoolField(18)) return setUiError('48 hours grace period has not started');
        if (!getBoolField(14)) return setUiError('Agreement not funded');
        if (getBoolField(24)) return setUiError('You cannot release full funds on vesting');
        if (getBigIntField(6) === 0n && !getBoolField(18)) return setUiError('Not enough funds to release');
        if (now < getBigIntField(11) && !getBoolField(18)) return setUiError('48 hours Grace period not yet ended');
        if (getBoolField(18)) return setUiError('The agreement is completed');
        if (getBoolField(21)) return setUiError('The agreement is frozen');

        writeContract({
            address: contractAddress,
            abi: ESCROW_ABI.abi,
            functionName: 'finalAutoRelease',
            args: [BigInt(agreementId)],
        });
        setUiSuccess('Final release tx submitted');
    };

    useEffect(() => {
        if (agreement && getBoolField(24)) { // If vesting is enabled
            refetchMilestoneCount();
        }
    }, [agreement, getBoolField, refetchMilestoneCount]);

    useEffect(() => {
        if (milestoneCount) {
            // refetch contract reads if milestone count changed
            refetchMilestonesData();
        } else {
            setMilestones([]);
        }
    }, [milestoneCount, refetchMilestonesData]);

    useEffect(() => {
        if (writeError) {
            setUiError('Transaction was rejected or failed');
            setCreateApprovalState({ isApprovingToken: false, needsApproval: false });
            setDepositState({ isApprovingToken: false, needsApproval: false, approvalHash: null });
            resetWrite();
        }
    }, [writeError, resetWrite]);

    useEffect(() => {
        if (approvalError) {
            setUiError('Token approval was rejected or failed');
            setCreateApprovalState({ isApprovingToken: false, needsApproval: false });
            setDepositState({ isApprovingToken: false, needsApproval: false, approvalHash: null });
            resetApproval();
        }
    }, [approvalError, resetApproval]);

    useEffect(() => {
        resetMessages();
        setCreateApprovalState({ isApprovingToken: false, needsApproval: false });
    }, [activeTab]);

    useEffect(() => {
        if (approvalSuccess && depositState.needsApproval) {
            // proceed immediately to deposit
            depositDirectly();
        }
    }, [approvalSuccess, depositState.needsApproval, agreementId, agreement, depositDirectly]);

    // Add this useEffect hook after your existing useEffect hooks
    useEffect(() => {
        if (isSuccess) {
            // Small delay to ensure blockchain state is updated
            const timer = setTimeout(() => {
                refetchStats();
                if (viewId) {
                    refetchAgreement();
                }
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isSuccess, viewId, refetchStats, refetchAgreement]);

    useEffect(() => {
        if (approvalSuccess && createApprovalState.needsApproval) {
            // After approval is successful, create the agreement
            let value: bigint;
            try {
                value = parseAmount(createForm.amount, createForm.token, createTokenDecimals as unknown as number);
            } catch {
                setUiError('Invalid amount after approval');
                return;
            }

            const milestonePercsBigInt = createForm.milestonePercs
                .map(perc => BigInt(percentToBP(perc)));
            const milestoneOffsetsBigInt = createForm.milestoneOffsets.map(offset => BigInt(offset));

            writeContract({
                address: contractAddress,
                abi: ESCROW_ABI.abi,
                functionName: 'createAgreement',
                args: [
                    BigInt(createForm.agreementId),
                    createForm.serviceProvider as `0x${string}`,
                    createForm.serviceRecipient as `0x${string}`,
                    createForm.token as `0x${string}`,
                    value,
                    BigInt(createForm.deadlineDuration),
                    createForm.vestingMode,
                    createForm.privateMode,
                    milestonePercsBigInt,
                    milestoneOffsetsBigInt
                ],
                value: BigInt(0), // No ETH value for ERC20
            });

            setCreateApprovalState({ needsApproval: false, isApprovingToken: false });
            setUiSuccess('Token approved! Creating agreement...');
        }
    }, [approvalSuccess, createApprovalState.needsApproval, createForm, contractAddress, writeContract, createTokenDecimals]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DexCourt Escrow</h1>
                    <ConnectButton />
                </div>

                {!isConnected ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-400">Please connect your wallet to continue</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Total Agreements</p>
                                <p className="text-2xl font-bold">{stats ? stats[0].toString() : '0'}</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Total Disputes</p>
                                <p className="text-2xl font-bold">{stats ? stats[1].toString() : '0'}</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Smooth Completions</p>
                                <p className="text-2xl font-bold">{stats ? stats[2].toString() : '0'}</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Fees Collected</p>
                                <p className="text-2xl font-bold">{stats ? formatEther(stats[3]).slice(0, 6) : '0'} ETH</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Escrowed ETH</p>
                                <p className="text-2xl font-bold">{stats ? formatEther(stats[4]).slice(0, 6) : '0'} ETH</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Platform Fees</p>
                                <p className="text-2xl font-bold">{stats ? stats[5].toString() : '0'}</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Grace 1 Duration</p>
                                <p className="text-2xl font-bold">{stats ? stats[6].toString() : '0'}</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                                <p className="text-gray-400 text-sm">Grace 2 Duration</p>
                                <p className="text-2xl font-bold">{stats ? stats[7].toString() : '0'}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-gray-700">
                            {['create', 'manage', 'view'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-medium transition-colors ${activeTab === tab ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Create Agreement Tab - UPDATED */}
                        {activeTab === 'create' && (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
                                <h2 className="text-2xl font-bold mb-6">Create New Agreement</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Agreement ID" value={createForm.agreementId} onChange={e => setCreateForm({ ...createForm, agreementId: e.target.value })} className="bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <input type="text" placeholder="serviceProvider Address" value={createForm.serviceProvider} onChange={e => setCreateForm({ ...createForm, serviceProvider: e.target.value })} className="bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <input type="text" placeholder="serviceRecipient Address" value={createForm.serviceRecipient} onChange={e => setCreateForm({ ...createForm, serviceRecipient: e.target.value })} className="bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <input type="text" placeholder="token Address" value={createForm.token} onChange={e => setCreateForm({ ...createForm, token: e.target.value })} className="bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <input type="text" placeholder={`Amount ${createForm.token === ZERO_ADDRESS ? '(ETH)' : '(Tokens)'}`} value={createForm.amount} onChange={e => setCreateForm({ ...createForm, amount: e.target.value })} className="bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <input type="text" placeholder="Deadline Duration (seconds)" value={createForm.deadlineDuration} onChange={e => setCreateForm({ ...createForm, deadlineDuration: e.target.value })} className="bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={createForm.privateMode} onChange={e => setCreateForm({ ...createForm, privateMode: e.target.checked })} className="w-5 h-5" />
                                        <span>Private Mode</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={createForm.vestingMode} onChange={e => setCreateForm({ ...createForm, vestingMode: e.target.checked })} className="w-5 h-5" />
                                        <span>Vesting Mode</span>
                                    </label>
                                </div>

                                {/* Vesting Configuration */}
                                {createForm.vestingMode && (
                                    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4">Vesting Milestones</h3>
                                        <div className="space-y-3">
                                            {createForm.milestonePercs.map((perc, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Percentage (basis points, e.g., 50 for 50%)"
                                                        value={perc}
                                                        onChange={e => updateMilestone(index, 'percs', e.target.value)}
                                                        className="flex-1 bg-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Offset (seconds)"
                                                        value={createForm.milestoneOffsets[index]}
                                                        onChange={e => updateMilestone(index, 'offsets', e.target.value)}
                                                        className="flex-1 bg-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                    {createForm.milestonePercs.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMilestone(index)}
                                                            className="bg-red-600 hover:bg-red-700 rounded-lg px-3 py-2"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addMilestone}
                                            className="mt-3 bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2"
                                        >
                                            Add Milestone
                                        </button>
                                        <p className="mt-2 text-sm text-gray-400">
                                            Total: {createForm.milestonePercs.reduce((sum, perc) => sum + Number(perc), 0)}/100%
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleCreateAgreement}
                                    disabled={isPending || isConfirming || createApprovalState.isApprovingToken || isApprovalPending}
                                    className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg px-6 py-3 font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createApprovalState.isApprovingToken
                                        ? (isApprovalPending ? 'Approving Token...' : 'Confirming Approval...')
                                        : isPending
                                            ? 'Confirming...'
                                            : isConfirming
                                                ? 'Creating...'
                                                : 'Create Agreement'
                                    }
                                </button>
                                {uiError && <p className="mt-4 text-red-400">{uiError}</p>}
                                {uiSuccess && <p className="mt-4 text-green-400">{uiSuccess}</p>}
                                {isSuccess && <p className="mt-4 text-green-400">Agreement created successfully!</p>}
                            </div>
                        )}

                        {/* Manage Agreement Tab - UPDATED */}
                        {activeTab === 'manage' && (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
                                <h2 className="text-2xl font-bold mb-6">Manage Agreement</h2>
                                <div className="flex gap-2 mb-4">
                                    <input type="text" placeholder="Enter Agreement ID" value={agreementId} onChange={e => setAgreementId(e.target.value)} className="flex-1 bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <button onClick={handleLoadAgreementForManage} className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-3">Load</button>
                                </div>

                                {agreement && (
                                    <div className="mb-4 text-sm text-gray-300">
                                        Loaded agreement #{agreement[0].toString()} —
                                        provider: {agreement[2].toString()} recipient: {agreement[3].toString()} —
                                        Amount: {formatAmount(getBigIntField(5), manageTokenDecimals as unknown as number)} {agreement[4] === ZERO_ADDRESS ? 'ETH' : manageTokenSymbol}
                                        {getBoolField(24) && " — VESTING MODE"}

                                        {/* Grace Period Countdowns */}
                                        {getBigIntField(10) > 0n && getBoolField(22) && (
                                            <div className="mt-2">
                                                Pending Order Cancellation: <CountdownTimer targetTimestamp={getBigIntField(10)} onComplete={refetchAgreement} />
                                            </div>
                                        )}

                                        {getBigIntField(10) > 0n && getBoolField(22) && (
                                            <div className="mt-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg px-4 py-3">
                                                {(() => {
                                                    const initiator = getField(12); // grace1EndsCalledBy
                                                    const serviceProvider = getField(2);
                                                    const serviceRecipient = getField(3);

                                                    if (initiator && serviceProvider && serviceRecipient) {
                                                        const initiatorLower = initiator.toString().toLowerCase();
                                                        const serviceProviderLower = serviceProvider.toString().toLowerCase();
                                                        const serviceRecipientLower = serviceRecipient.toString().toLowerCase();

                                                        if (initiatorLower === serviceRecipientLower) {
                                                            return "Cancellation request sent, waiting for service provider";
                                                        } else if (initiatorLower === serviceProviderLower) {
                                                            return "Cancellation request sent, waiting for service recipient";
                                                        }
                                                    }
                                                    // Fallback message
                                                    return "Cancellation request sent, waiting for the other party";
                                                })()}
                                            </div>
                                        )}

                                        {getBigIntField(10) > 0n && getBoolField(25) && !getBoolField(24) && (
                                            <div className="mt-1">
                                                Pending Delivery [Grace period 1] : <CountdownTimer targetTimestamp={getBigIntField(10)} onComplete={refetchAgreement} />
                                            </div>
                                        )}
                                        {getBigIntField(10) > 0n && getBoolField(25) && (
                                            <div className="mt-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg px-4 py-3">
                                                Delivery submitted, waiting for service recipient
                                            </div>
                                        )}

                                        {!getBoolField(16) && (
                                            <div className="mt-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg px-4 py-3">
                                                Waiting for Service Provider Signature
                                            </div>
                                        )}
                                        {!getBoolField(17) && (
                                            <div className="mt-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg px-4 py-3">
                                                Waiting for Service Recipient Signature
                                            </div>
                                        )}


                                        {getBigIntField(11) > 0n && getBoolField(25) && !getBoolField(24) && (
                                            <div className="mt-1">
                                                Pending Delivery [Grace period 2] : <CountdownTimer targetTimestamp={getBigIntField(11)} onComplete={refetchAgreement} />
                                            </div>
                                        )}

                                        {getBigIntField(8) > 0n && (
                                            <div className="mt-1">
                                                Delivery Deadline: <CountdownTimer targetTimestamp={getBigIntField(8)} onComplete={refetchAgreement} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {/* Existing buttons */}
                                    {agreement && (isServiceProvider && !getBoolField(16) || isServiceRecipient && !getBoolField(17)) && getBoolField(14)
                                        &&
                                        <button onClick={handleSignAgreement} disabled={!agreementId || isPending} className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Sign Agreement</button>
                                    }

                                    {agreement && !getBoolField(14) && !getBoolField(15) &&
                                        <button onClick={handleDepositFunds} disabled={!agreementId || isPending || isApprovalPending} className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">
                                            {depositState.isApprovingToken ? (isApprovalPending ? 'Approving...' : 'Confirming...') : 'Deposit Fund'}
                                        </button>
                                    }
                                    {agreement && getBoolField(15) && isServiceProvider && !getBoolField(22) && !getBoolField(25) &&
                                        <button onClick={handleSubmitDelivery} disabled={!agreementId || isPending} className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Submit Delivery</button>
                                    }
                                    {agreement && getBoolField(15) && isServiceRecipient && !getBoolField(22) && getBoolField(25) &&
                                        <button onClick={() => handleApproveDelivery(true)} disabled={!agreementId || isPending} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Approve Delivery</button>
                                    }

                                    {agreement && getBoolField(15) && isServiceRecipient && !getBoolField(22) && getBoolField(25) &&
                                        <button onClick={() => handleApproveDelivery(false)} disabled={!agreementId || isPending} className="bg-yellow-600 hover:bg-yellow-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Reject Delivery</button>
                                    }
                                    {agreement && getBoolField(15) && getBoolField(22) && address && (address.toLowerCase() !== String(getField(12)).toLowerCase()) && !getBoolField(25) &&
                                        <button onClick={() => handleApproveCancellation(true)} disabled={!agreementId || isPending} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Approve Order Cancellation</button>
                                    }
                                    {agreement && getBoolField(15) && getBoolField(22) && address && (address.toLowerCase() !== String(getField(12)).toLowerCase()) && !getBoolField(25) &&
                                        <button onClick={() => handleApproveCancellation(false)} disabled={!agreementId || isPending} className="bg-yellow-600 hover:bg-yellow-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Reject Order Cancellation</button>
                                    }
                                    {agreement && getBoolField(15) && !getBoolField(22) && !getBoolField(25) &&
                                        <button onClick={handleCancelOrder} disabled={!agreementId || isPending} className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Cancel Order</button>
                                    }
                                    {agreement && getBoolField(15) && !getBoolField(24) &&
                                        <button onClick={handlePartialRelease} disabled={!agreementId || isPending || getBoolField(24)} className="bg-orange-600 hover:bg-orange-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Partial Release</button>
                                    }
                                    {agreement && getBoolField(15) && !getBoolField(24) &&
                                        <button onClick={handleFinalRelease} disabled={!agreementId || isPending || getBoolField(24)} className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Final Release</button>
                                    }
                                    {agreement && getBoolField(15) && now > getBigIntField(10) && getBoolField(22) && getBigIntField(10) !== BigInt(0) &&
                                        <button onClick={handleCancellationTImeout} disabled={!agreementId || isPending} className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-3 disabled:opacity-50 transition-colors">Cancellation Timeout</button>
                                    }

                                    {/* Milestones Section */}
                                    {agreement && getBoolField(24) && milestoneCount! > 0 && getBoolField(15) && (
                                        <div className="col-span-full border-t border-gray-600 pt-4 mt-4">
                                            <h3 className="text-xl font-bold mb-4">Vesting Milestones</h3>

                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse bg-gray-700/50 rounded-lg">
                                                    <thead>
                                                        <tr className="border-b border-gray-600">
                                                            <th className="text-left p-4">Milestone</th>
                                                            <th className="text-left p-4">Percentage</th>
                                                            <th className="text-left p-4">Amount</th>
                                                            <th className="text-left p-4">Unlock Time</th>
                                                            <th className="text-left p-4">Time Remaining</th>
                                                            <th className="text-left p-4">Status</th>
                                                            <th className="text-left p-4">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {milestones.map((milestone, index) => (
                                                            <MilestoneTableRow
                                                                key={index}
                                                                milestone={milestone}
                                                                index={index}
                                                                agreement={agreement}
                                                                manageTokenDecimals={manageTokenDecimals as number}
                                                                manageTokenSymbol={manageTokenSymbol as string}
                                                                isServiceProvider={isServiceProvider as boolean}
                                                                isServiceRecipient={isServiceRecipient as boolean}
                                                                onClaimMilestone={handleClaimMilestone}
                                                                onSetMilestoneHold={handleSetMilestoneHold}
                                                            />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {uiError && <p className="mt-4 text-red-400">{uiError}</p>}
                                {uiSuccess && <p className="mt-4 text-green-400">{uiSuccess}</p>}
                                {isSuccess && <p className="mt-4 text-green-400">Transaction successful!</p>}
                            </div>
                        )}

                        {/* View Agreement Tab - UPDATED */}
                        {activeTab === 'view' && (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
                                <h2 className="text-2xl font-bold mb-6">View Agreement Details</h2>
                                <div className="flex gap-4 mb-6">
                                    <input type="text" placeholder="Enter Agreement ID" value={viewId} onChange={e => setViewId(e.target.value)} className="flex-1 bg-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    <button onClick={() => refetchAgreement()} className="bg-purple-600 hover:bg-purple-700 rounded-lg px-6 py-3 transition-colors">Fetch</button>
                                </div>

                                {agreement && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                                            {/* ... existing agreement fields ... */}
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">ID:</span> <span className="font-mono">{agreement[0].toString()}</span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">Creator:</span> <span className="font-mono text-xs">{agreement[1].toString()}</span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">serviceProvider:</span> <span className="font-mono text-xs">{agreement[2].toString()}</span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">serviceRecipient:</span> <span className="font-mono text-xs">{agreement[3].toString()}</span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">token:</span> <span className="font-mono text-xs">{agreement[4].toString()}</span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">Amount:</span> <span className="font-mono text-xs">{formatAmount(getBigIntField(5), manageTokenDecimals as unknown as number)} {agreement[4] === ZERO_ADDRESS ? 'ETH' : manageTokenSymbol}</span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">Remaining:</span> <span className="font-mono">{formatAmount(getBigIntField(6), manageTokenDecimals as unknown as number)} {agreement[4] === ZERO_ADDRESS ? 'ETH' : manageTokenSymbol}</span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">createdAt:</span> <span className="font-mono">{(agreement[7]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">deadline:</span> <span className="font-mono">{(agreement[8]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">deadlineDuration:</span> <span className="font-mono">{(agreement[9]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3">
                                                <span className="text-gray-400">grace1Ends:</span>
                                                <span className="font-mono">{(agreement[10]).toString()} </span>
                                                {getBigIntField(10) > 0n && (
                                                    <span className="ml-2">
                                                        (<CountdownTimer targetTimestamp={getBigIntField(10)} onComplete={refetchAgreement} />)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="bg-gray-700/50 rounded p-3">
                                                <span className="text-gray-400">grace2Ends:</span>
                                                <span className="font-mono">{(agreement[11]).toString()} </span>
                                                {getBigIntField(11) > 0n && (
                                                    <span className="ml-2">
                                                        (<CountdownTimer targetTimestamp={getBigIntField(11)} onComplete={refetchAgreement} />)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">grace1EndsCalledBy:</span> <span className="font-mono">{(agreement[12]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">grace2EndsCalledBy:</span> <span className="font-mono">{(agreement[13]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">funded:</span> <span className="font-mono">{(agreement[14]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">signed:</span> <span className="font-mono">{(agreement[15]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">acceptedByServiceProvider:</span> <span className="font-mono">{(agreement[16]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">acceptedByServiceRecipient:</span> <span className="font-mono">{(agreement[17]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">completed:</span> <span className="font-mono">{(agreement[18]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">disputed:</span> <span className="font-mono">{(agreement[19]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">privateMode:</span> <span className="font-mono">{(agreement[20]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">frozen:</span> <span className="font-mono">{(agreement[21]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">pendingCancellation:</span> <span className="font-mono">{(agreement[22]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">orderCancelled:</span> <span className="font-mono">{(agreement[23]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">Vesting State:</span> <span className="font-mono">{(agreement[24]).toString()} </span></div>
                                            <div className="bg-gray-700/50 rounded p-3"><span className="text-gray-400">votingId:</span> <span className="font-mono">{(agreement[25]).toString()} </span></div>
                                        </div>

                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Web3Int;