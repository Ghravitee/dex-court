// src/pages/Web3Vote.tsx
import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { parseEther } from "viem";
import { VOTING_ABI, VOTING_CA, ZERO_ADDRESS } from "../web3/config";
import { toUtf8Bytes, hexlify, solidityPackedKeccak256 } from "ethers";
import { getTransactionCount } from "../web3/readContract";

type DisputeTuple = readonly [
  id: bigint | number | string,
  plaintiff: string,
  defendant: string,
  active: boolean,
  createdAt: bigint | number | string,
  endTime: bigint | number | string,
  finalized: boolean,
  result: number,
  totalVotes: bigint | number | string,
  weightedPlaintiff: bigint | number | string,
  weightedDefendant: bigint | number | string,
  weightedDismiss: bigint | number | string,
];

type VoterRevealTuple = readonly [
  isRevealed: boolean,
  vote: number,
  tier: number,
  weight: bigint | number | string,
  timestamp: bigint | number | string,
];

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object") {
    const v = value as { toNumber?: () => number; toString?: () => string };
    if (typeof v.toNumber === "function") {
      try {
        return v.toNumber();
      } catch {
        // fallthrough
      }
    }
    if (typeof v.toString === "function") {
      const parsed = Number(v.toString());
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }
  return 0;
}

function isValidAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// Helper functions
const isVotingPeriodEnded = (endTime: number): boolean => {
  return Date.now() / 1000 > endTime;
};

const canUserVote = (tier: number): boolean => {
  return tier > 0; // Tier 1, 2, or 3 (Judge)
};

const canCommitToDispute = (
  dispute: DisputeTuple | null,
): { canCommit: boolean; error?: string } => {
  if (!dispute) return { canCommit: false, error: "Dispute not found" };
  if (!dispute[3]) return { canCommit: false, error: "Dispute is not active" };
  if (dispute[6])
    return { canCommit: false, error: "Dispute is already finalized" };
  if (isVotingPeriodEnded(Number(dispute[5])))
    return { canCommit: false, error: "Voting period has ended" };
  return { canCommit: true };
};

const canRevealForDispute = (
  dispute: DisputeTuple | null,
): { canReveal: boolean; error?: string } => {
  if (!dispute) return { canReveal: false, error: "Dispute not found" };
  if (!dispute[3]) return { canReveal: false, error: "Dispute is not active" };
  if (dispute[6])
    return { canReveal: false, error: "Dispute is already finalized" };
  if (!isVotingPeriodEnded(Number(dispute[5])))
    return { canReveal: false, error: "Voting period has not ended yet" };
  return { canReveal: true };
};

function Web3Vote() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState("stats");
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  const contractAddress = VOTING_CA[chainId as number];

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [openVoteForm, setOpenVoteForm] = useState({
    agreementId: "",
    votingId: "",
    plaintiff: "",
    defendant: "",
    proBono: true,
    feeAmount: "",
  });

  const [commitForm, setCommitForm] = useState({
    disputeId: "",
    vote: "1",
    commitHash: "",
  });

  const [revealForm, setRevealForm] = useState({
    disputeId: "",
    vote: "1",
    nonce: "",
  });

  const [voterLookup, setVoterLookup] = useState("");
  const [disputeLookupId, setDisputeLookupId] = useState("");
  const [disputeData, setDisputeData] = useState<DisputeTuple | null>(null);
  const [revealedList, setRevealedList] = useState<string[] | null>(null);
  const [selectedRevealer, setSelectedRevealer] = useState<string | null>(null);
  const [selectedRevealData, setSelectedRevealData] =
    useState<VoterRevealTuple | null>(null);
  const [isFetchingDispute, setIsFetchingDispute] = useState(false);

  const { data: votingConfig } = useReadContract({
    address: contractAddress,
    abi: VOTING_ABI.abi,
    functionName: "getVotingConfig",
  });

  const { data: votingStatsAvg, refetch: refetchVotingStatsAvg } =
    useReadContract({
      address: contractAddress,
      abi: VOTING_ABI.abi,
      functionName: "getVotingStatsWithAvg",
    });

  const { data: leaderboard, refetch: refetchLeaderboard } = useReadContract({
    address: contractAddress,
    abi: VOTING_ABI.abi,
    functionName: "getLeaderboard",
  });

  const { data: voterStats, refetch: refetchVoterStats } = useReadContract({
    address: contractAddress,
    abi: VOTING_ABI.abi,
    functionName: "getVoterStats",
    args: voterLookup ? [voterLookup as `0x${string}`] : undefined,
    query: {
      enabled: !!voterLookup && isValidAddress(voterLookup),
    },
  });

  const { data: voterTier, refetch: refetchVoterTier } = useReadContract({
    address: contractAddress,
    abi: VOTING_ABI.abi,
    functionName: "getVoterTier",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: disputeStatsRaw, refetch: refetchDisputeStats } =
    useReadContract({
      address: contractAddress,
      abi: VOTING_ABI.abi,
      functionName: "getDisputeStats",
      args: disputeLookupId ? [BigInt(disputeLookupId)] : undefined,
      query: { enabled: !!disputeLookupId },
    });

  const { data: revealedVotersRaw, refetch: refetchRevealedVoters } =
    useReadContract({
      address: contractAddress,
      abi: VOTING_ABI.abi,
      functionName: "getRevealedVoters",
      args: disputeLookupId ? [BigInt(disputeLookupId)] : undefined,
      query: { enabled: !!disputeLookupId },
    });

  const { data: voterRevealRaw, refetch: refetchVoterReveal } = useReadContract(
    {
      address: contractAddress,
      abi: VOTING_ABI.abi,
      functionName: "getVoterReveal",
      args:
        selectedRevealer && disputeLookupId
          ? [BigInt(disputeLookupId), selectedRevealer as `0x${string}`]
          : undefined,
      query: { enabled: !!selectedRevealer && !!disputeLookupId },
    },
  );

  const resetMessages = () => {
    setUiError(null);
    setUiSuccess(null);
  };

  const generateCommitmentHash = useCallback(
    (vote: string, nonce: string): string => {
      if (!address) {
        return "0x" + "".padEnd(64, "0");
      }

      const voteNum = Number(vote);
      if (Number.isNaN(voteNum)) {
        return "0x" + "".padEnd(64, "0");
      }

      const nonceBytes = toUtf8Bytes(nonce);
      const commitment = solidityPackedKeccak256(
        ["uint8", "bytes", "address"],
        [voteNum, nonceBytes, address],
      );

      return commitment;
    },
    [address],
  );

  function saveCommitRecord(record: Record<string, unknown>) {
    try {
      const key = "dexcourt_commits";
      const prevRaw = localStorage.getItem(key);
      const arr = prevRaw ? JSON.parse(prevRaw) : [];
      arr.push(record);
      localStorage.setItem(key, JSON.stringify(arr));

      const blob = new Blob([JSON.stringify(record, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dexcourt-commit-${record.disputeId ?? "unknown"}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to save commit record", e);
    }
  }

  const handleOpenVote = async () => {
    resetMessages();
    try {
      if (!isConnected || !address) return setUiError("Connect your wallet");
      if (!openVoteForm.votingId) return setUiError("Voting ID is required");

      const votingIdNum = Number(openVoteForm.votingId);
      if (!Number.isFinite(votingIdNum) || votingIdNum <= 0) {
        return setUiError("Voting ID must be a positive number");
      }

      // Check if dispute already exists
      try {
        const existingDispute = await refetchDisputeStats?.();
        if (
          existingDispute?.data &&
          existingDispute.data[0]?.toString() !== "0"
        ) {
          return setUiError("Dispute with this ID already exists");
        }
      } catch (e) {
        return e;
        // Dispute doesn't exist, which is good
      }

      if (!isValidAddress(openVoteForm.plaintiff))
        return setUiError("Invalid plaintiff address");
      if (!isValidAddress(openVoteForm.defendant))
        return setUiError("Invalid defendant address");

      // Check for zero addresses
      if (
        openVoteForm.plaintiff === ZERO_ADDRESS ||
        openVoteForm.defendant === ZERO_ADDRESS
      ) {
        return setUiError("Plaintiff and defendant cannot be zero address");
      }

      if (
        openVoteForm.plaintiff.toLowerCase() ===
        openVoteForm.defendant.toLowerCase()
      )
        return setUiError("Plaintiff and defendant cannot be the same");

      if (openVoteForm.agreementId) {
        const agreementIdNum = Number(openVoteForm.agreementId);
        if (!Number.isFinite(agreementIdNum) || agreementIdNum < 0) {
          return setUiError("Agreement ID must be a non-negative number");
        }
      }

      let feeAmount = 0n;
      if (!openVoteForm.proBono) {
        if (!openVoteForm.feeAmount || Number(openVoteForm.feeAmount) <= 0)
          return setUiError("Fee amount is required when not pro bono");

        try {
          feeAmount = parseEther(openVoteForm.feeAmount);
          if (feeAmount <= 0n)
            return setUiError("Parsed fee amount is zero or invalid");
        } catch (err) {
          setUiError("Invalid fee amount format");
          console.error("parseEther error", err);
          return;
        }
      }

      const isETHFee = !openVoteForm.proBono;

      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "openVote",
        args: [
          BigInt(openVoteForm.agreementId || "0"),
          BigInt(openVoteForm.votingId),
          openVoteForm.plaintiff as `0x${string}`,
          openVoteForm.defendant as `0x${string}`,
          openVoteForm.proBono,
          feeAmount,
        ],
        value: isETHFee ? feeAmount : 0n,
      });

      setUiSuccess("Opening vote transaction submitted");
    } catch (error: unknown) {
      setUiError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Error opening vote",
      );
      console.error("Error opening vote:", error);
    }
  };

  const handleAutoCommitVote = async () => {
    resetMessages();
    try {
      if (!isConnected || !address) return setUiError("Connect your wallet");
      if (!commitForm.disputeId) return setUiError("Dispute ID is required");

      const disputeIdNum = Number(commitForm.disputeId);
      if (!Number.isFinite(disputeIdNum) || disputeIdNum <= 0) {
        return setUiError("Dispute ID must be a positive number");
      }

      // Check if dispute exists and is active
      try {
        const disputeData = await refetchDisputeStats?.();
        if (!disputeData?.data || disputeData.data[0]?.toString() === "0") {
          return setUiError("Dispute not found");
        }

        // Check if voting has ended
        const endTime = Number(disputeData.data[5]);
        if (Date.now() / 1000 > endTime) {
          return setUiError("Voting period has ended");
        }

        // Check if dispute is active
        if (!disputeData.data[3]) {
          return setUiError("Dispute is not active");
        }

        // Check if already finalized
        if (disputeData.data[6]) {
          return setUiError("Dispute is already finalized");
        }
      } catch (e) {
        setUiError("Failed to verify dispute status");
        return e;
      }

      const disputeId = BigInt(commitForm.disputeId);
      const voteNum = Number(commitForm.vote);
      if (![1, 2, 3].includes(voteNum))
        return setUiError("Vote must be 1, 2, or 3");

      // Check voter eligibility (tier)
      if (voterTier && Number(voterTier[0]) === 0) {
        return setUiError(
          "You are not eligible to vote (insufficient token balance)",
        );
      }

      let nonceNumber: number | bigint = 0n;
      try {
        nonceNumber = await getTransactionCount(chainId as number, address);
      } catch (e) {
        console.error("Failed to get nonce from provider", e);
        return setUiError("Failed to read wallet nonce");
      }

      const nonceStr = String(nonceNumber);
      const commitment = generateCommitmentHash(String(voteNum), nonceStr);

      if (!commitment || commitment === "0x" + "".padEnd(64, "0")) {
        return setUiError("Failed to generate valid commitment hash");
      }

      setCommitForm((prev) => ({ ...prev, commitHash: commitment }));

      const record = {
        disputeId: String(commitForm.disputeId),
        voter: address,
        vote: voteNum,
        nonce: nonceNumber,
        commitment,
        createdAt: new Date().toISOString(),
      };

      saveCommitRecord(record);

      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "commitVote",
        args: [disputeId, commitment as `0x${string}`],
      });

      setUiSuccess("Commitment generated, saved, and transaction submitted");
    } catch (error: unknown) {
      setUiError(
        error instanceof Error
          ? error.message
          : "Error generating or sending commitment",
      );
      console.error("handleAutoCommitVote error", error);
    }
  };

  const handleRevealVote = async () => {
    resetMessages();
    try {
      if (!isConnected || !address) return setUiError("Connect your wallet");
      if (!revealForm.disputeId) return setUiError("Dispute ID is required");

      const disputeIdNum = Number(revealForm.disputeId);
      if (!Number.isFinite(disputeIdNum) || disputeIdNum <= 0) {
        return setUiError("Dispute ID must be a positive number");
      }

      // Check dispute status for reveal
      try {
        const disputeData = await refetchDisputeStats?.();
        if (!disputeData?.data || disputeData.data[0]?.toString() === "0") {
          return setUiError("Dispute not found");
        }

        const endTime = Number(disputeData.data[5]);
        if (Date.now() / 1000 < endTime) {
          return setUiError("Voting period has not ended yet");
        }

        if (!disputeData.data[3]) {
          return setUiError("Dispute is not active");
        }

        if (disputeData.data[6]) {
          return setUiError("Dispute is already finalized");
        }
      } catch (e) {
        setUiError("Failed to verify dispute status");
        return e;
      }

      if (!revealForm.vote) return setUiError("Vote is required");
      if (!revealForm.nonce) return setUiError("Nonce is required");

      const voteOption = parseInt(revealForm.vote);
      if (voteOption < 1 || voteOption > 3)
        return setUiError("Vote must be 1, 2, or 3");

      if (revealForm.nonce.trim().length === 0) {
        return setUiError("Nonce cannot be empty");
      }

      // Check if user has already revealed
      try {
        const voterRevealData = await refetchVoterReveal?.();
        if (voterRevealData?.data && voterRevealData.data[0]) {
          return setUiError(
            "You have already revealed your vote for this dispute",
          );
        }
      } catch (e) {
        return e;
      }

      const nonceHex = hexlify(toUtf8Bytes(revealForm.nonce));

      if (!nonceHex || nonceHex === "0x") {
        return setUiError("Failed to encode nonce");
      }

      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "revealMyVote",
        args: [
          BigInt(revealForm.disputeId),
          voteOption,
          nonceHex as `0x${string}`,
        ],
      });

      setUiSuccess("Vote reveal submitted");
    } catch (error: unknown) {
      setUiError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Error revealing vote",
      );
      console.error("Error revealing vote:", error);
    }
  };

  const handleGenerateCommitment = () => {
    resetMessages();
    if (!address) {
      setUiError("Connect your wallet to generate commitment");
      return;
    }
    if (!revealForm.vote || !revealForm.nonce) {
      setUiError("Vote and nonce are required to generate commitment");
      return;
    }

    const voteNum = Number(revealForm.vote);
    if (![1, 2, 3].includes(voteNum)) {
      setUiError("Vote must be 1, 2, or 3");
      return;
    }

    if (revealForm.nonce.trim().length === 0) {
      setUiError("Nonce cannot be empty");
      return;
    }

    const commitment = generateCommitmentHash(
      revealForm.vote,
      revealForm.nonce,
    );

    if (!commitment || commitment === "0x" + "".padEnd(64, "0")) {
      setUiError("Failed to generate valid commitment hash");
      return;
    }

    setCommitForm((prev) => ({ ...prev, commitHash: commitment }));
    setUiSuccess(`Commitment generated: ${commitment.slice(0, 16)}...`);
  };

  const fetchDisputeAndReveals = async () => {
    resetMessages();
    setSelectedRevealData(null);
    setSelectedRevealer(null);
    setIsFetchingDispute(true);
    try {
      if (!disputeLookupId) return setUiError("Dispute ID required");

      const disputeIdNum = Number(disputeLookupId);
      if (!Number.isFinite(disputeIdNum) || disputeIdNum <= 0) {
        return setUiError("Dispute ID must be a positive number");
      }

      await refetchDisputeStats?.();
      await refetchRevealedVoters?.();
      setUiSuccess("Dispute data fetched");
    } catch (err: unknown) {
      setUiError(
        err instanceof Error ? err.message : "Error fetching dispute data",
      );
    } finally {
      setIsFetchingDispute(false);
    }
  };

  const fetchVoterReveal = async (voterAddr: string) => {
    resetMessages();
    if (!voterAddr || !isValidAddress(voterAddr)) {
      setUiError("Invalid voter address");
      return;
    }
    if (!disputeLookupId) {
      setUiError("Dispute ID required");
      return;
    }
    setSelectedRevealer(voterAddr);
    try {
      await refetchVoterReveal?.();
    } catch (err: unknown) {
      setUiError(
        err instanceof Error ? err.message : "Error fetching voter reveal",
      );
    }
  };

  const handleFinalizeExpired = async () => {
    resetMessages();
    try {
      if (!isConnected || !address) return setUiError("Connect your wallet");
      if (!disputeLookupId) return setUiError("Dispute ID required");

      const disputeIdNum = Number(disputeLookupId);
      if (!Number.isFinite(disputeIdNum) || disputeIdNum <= 0) {
        return setUiError("Dispute ID must be a positive number");
      }

      // Check if dispute can be finalized
      if (!disputeData) {
        return setUiError("Dispute data not loaded");
      }

      if (!disputeData[3]) {
        // active
        return setUiError("Dispute is not active");
      }

      if (disputeData[6]) {
        // finalized
        return setUiError("Dispute is already finalized");
      }

      const endTime = Number(disputeData[5]);
      if (Date.now() / 1000 <= endTime) {
        return setUiError("Voting period has not ended yet");
      }

      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "finalizeExpiredDisputes",
        args: [[BigInt(disputeLookupId)]],
      });
      setUiSuccess("Finalize tx submitted");
    } catch (err: unknown) {
      setUiError(
        err instanceof Error ? err.message : "Error finalizing dispute",
      );
      console.error(err);
    }
  };

  useEffect(() => {
    if (writeError) {
      setUiError("Transaction was rejected or failed");
      resetWrite();
    }
  }, [writeError, resetWrite]);

  useEffect(() => {
    if (disputeStatsRaw) {
      setDisputeData(disputeStatsRaw);
    }
  }, [disputeStatsRaw]);

  useEffect(() => {
    if (revealedVotersRaw) {
      setRevealedList(revealedVotersRaw as string[]);
    }
  }, [revealedVotersRaw]);

  useEffect(() => {
    if (voterRevealRaw) {
      setSelectedRevealData(voterRevealRaw);
    }
  }, [voterRevealRaw]);

  useEffect(() => {
    resetMessages();
  }, [activeTab]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        refetchVotingStatsAvg();
        refetchLeaderboard();
        if (voterLookup) refetchVoterStats();
        if (address) refetchVoterTier();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    isSuccess,
    voterLookup,
    address,
    refetchVotingStatsAvg,
    refetchLeaderboard,
    refetchVoterStats,
    refetchVoterTier,
  ]);

  const formatTier = (tier: number): string => {
    switch (tier) {
      case 1:
        return "Tier 1";
      case 2:
        return "Tier 2";
      case 3:
        return "Judge";
      default:
        return "Not Eligible";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-4xl font-bold text-transparent">
            DexCourt Voting
          </h1>
        </div>

        <ConnectButton />
        {!isConnected ? (
          <div className="py-20 text-center">
            <p className="text-xl text-gray-400">
              Please connect your wallet to continue
            </p>
          </div>
        ) : (
          <>
            {voterTier && (
              <div className="mb-6 rounded-lg border border-purple-500/50 bg-purple-600/20 p-4">
                <h3 className="mb-2 text-lg font-semibold">
                  Your Voting Status
                </h3>
                <p>
                  Tier:{" "}
                  <span className="font-bold">
                    {formatTier(Number(voterTier[0]))}
                  </span>
                </p>
                <p>
                  Weight:{" "}
                  <span className="font-bold">{voterTier[1]?.toString()}</span>
                </p>
                <p
                  className={`text-sm ${canUserVote(Number(voterTier[0])) ? "text-green-400" : "text-red-400"}`}
                >
                  {canUserVote(Number(voterTier[0]))
                    ? "✓ Eligible to vote"
                    : "✗ Not eligible to vote"}
                </p>
              </div>
            )}

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Total Disputes</p>
                <p className="text-2xl font-bold">
                  {votingStatsAvg ? votingStatsAvg[0]?.toString() : "0"}
                </p>
              </div>
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Total Votes</p>
                <p className="text-2xl font-bold">
                  {votingStatsAvg ? votingStatsAvg[1]?.toString() : "0"}
                </p>
              </div>
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Finalized Votes</p>
                <p className="text-2xl font-bold">
                  {votingStatsAvg ? votingStatsAvg[2]?.toString() : "0"}
                </p>
              </div>
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Avg Resolution Time</p>
                <p className="text-2xl font-bold">
                  {votingStatsAvg
                    ? `${(Number(votingStatsAvg[9]) / 3600).toFixed(1)}h`
                    : "0h"}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-green-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Plaintiff Wins</p>
                <p className="text-2xl font-bold text-green-400">
                  {votingStatsAvg ? votingStatsAvg[3]?.toString() : "0"}
                </p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Defendant Wins</p>
                <p className="text-2xl font-bold text-red-400">
                  {votingStatsAvg ? votingStatsAvg[4]?.toString() : "0"}
                </p>
              </div>
              <div className="rounded-lg border border-yellow-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Dismissed Cases</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {votingStatsAvg ? votingStatsAvg[5]?.toString() : "0"}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-green-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">
                  Tier1 Votes (Greater than 1% supply)
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {votingStatsAvg ? votingStatsAvg[6]?.toString() : "0"}
                </p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">
                  Tier2 Votes (Greater than 0.5% supply)
                </p>
                <p className="text-2xl font-bold text-red-400">
                  {votingStatsAvg ? votingStatsAvg[7]?.toString() : "0"}
                </p>
              </div>
              <div className="rounded-lg border border-yellow-500/20 bg-gray-800/50 p-4 backdrop-blur-sm">
                <p className="text-sm text-gray-400">Tier3 Votes (Judges)</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {votingStatsAvg ? votingStatsAvg[8]?.toString() : "0"}
                </p>
              </div>
            </div>

            <div className="mb-6 flex gap-2 border-b border-gray-700">
              {["stats", "open", "commit", "reveal", "lookup", "dispute"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === tab
                        ? "border-b-2 border-purple-400 text-purple-400"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ),
              )}
            </div>

            {activeTab === "stats" && (
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-6 backdrop-blur-sm">
                <h2 className="mb-6 text-2xl font-bold">
                  Voting Statistics & Leaderboard
                </h2>

                {votingConfig && (
                  <div className="mb-8">
                    <h3 className="mb-4 text-xl font-semibold">
                      Voting Configuration
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded bg-gray-700/50 p-3">
                        <span className="text-gray-400">Tier 1 Threshold:</span>
                        <span className="ml-2 font-mono">
                          {(
                            Number(votingConfig.tier1ThresholdPercent) / 100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                      <div className="rounded bg-gray-700/50 p-3">
                        <span className="text-gray-400">Tier 2 Threshold:</span>
                        <span className="ml-2 font-mono">
                          {(
                            Number(votingConfig.tier2ThresholdPercent) / 100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                      <div className="rounded bg-gray-700/50 p-3">
                        <span className="text-gray-400">Tier 1 Weight:</span>
                        <span className="ml-2 font-mono">
                          {votingConfig.tier1Weight.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-gray-700/50 p-3">
                        <span className="text-gray-400">Tier 2 Weight:</span>
                        <span className="ml-2 font-mono">
                          {votingConfig.tier2Weight.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-gray-700/50 p-3">
                        <span className="text-gray-400">Judge Weight:</span>
                        <span className="ml-2 font-mono">
                          {votingConfig.judgeWeight.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-gray-700/50 p-3">
                        <span className="text-gray-400">Voting Duration:</span>
                        <span className="ml-2 font-mono">
                          {(Number(votingConfig.votingDuration) / 3600).toFixed(
                            1,
                          )}
                          h
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {leaderboard && (
                  <div>
                    <h3 className="mb-4 text-xl font-semibold">Leaderboard</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-purple-500/50 bg-purple-600/20 p-4">
                        <p className="text-sm text-gray-400">
                          Most Active Judge
                        </p>
                        <p className="truncate font-mono text-sm">
                          {leaderboard.mostActiveJudge || "None"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-blue-500/50 bg-blue-600/20 p-4">
                        <p className="text-sm text-gray-400">
                          Most Active Tier 1
                        </p>
                        <p className="truncate font-mono text-sm">
                          {leaderboard.mostActiveTier1 || "None"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-green-500/50 bg-green-600/20 p-4">
                        <p className="text-sm text-gray-400">
                          Most Active Tier 2
                        </p>
                        <p className="truncate font-mono text-sm">
                          {leaderboard.mostActiveTier2 || "None"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-yellow-500/50 bg-yellow-600/20 p-4">
                        <p className="text-sm text-gray-400">
                          Most Active Overall
                        </p>
                        <p className="truncate font-mono text-sm">
                          {leaderboard.mostActiveOverall || "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "open" && (
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-6 backdrop-blur-sm">
                <h2 className="mb-6 text-2xl font-bold">Open New Vote</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Agreement ID (optional)"
                    value={openVoteForm.agreementId}
                    onChange={(e) =>
                      setOpenVoteForm({
                        ...openVoteForm,
                        agreementId: e.target.value,
                      })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Voting ID *"
                    value={openVoteForm.votingId}
                    onChange={(e) =>
                      setOpenVoteForm({
                        ...openVoteForm,
                        votingId: e.target.value,
                      })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Plaintiff Address *"
                    value={openVoteForm.plaintiff}
                    onChange={(e) =>
                      setOpenVoteForm({
                        ...openVoteForm,
                        plaintiff: e.target.value,
                      })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Defendant Address *"
                    value={openVoteForm.defendant}
                    onChange={(e) =>
                      setOpenVoteForm({
                        ...openVoteForm,
                        defendant: e.target.value,
                      })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={openVoteForm.proBono}
                        onChange={(e) =>
                          setOpenVoteForm({
                            ...openVoteForm,
                            proBono: e.target.checked,
                          })
                        }
                        className="h-5 w-5"
                      />
                      <span>Pro Bono (Free of charge)</span>
                    </label>
                  </div>
                  {!openVoteForm.proBono && (
                    <input
                      type="text"
                      placeholder="Fee Amount (ETH)"
                      value={openVoteForm.feeAmount}
                      onChange={(e) =>
                        setOpenVoteForm({
                          ...openVoteForm,
                          feeAmount: e.target.value,
                        })
                      }
                      className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  )}
                </div>

                <button
                  onClick={handleOpenVote}
                  disabled={isPending || isConfirming}
                  className="mt-6 w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium transition-all hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending
                    ? "Confirming..."
                    : isConfirming
                      ? "Opening Vote..."
                      : "Open Vote"}
                </button>
                {uiError && <p className="mt-4 text-red-400">{uiError}</p>}
                {uiSuccess && (
                  <p className="mt-4 text-green-400">{uiSuccess}</p>
                )}
              </div>
            )}

            {activeTab === "commit" && (
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-6 backdrop-blur-sm">
                <h2 className="mb-6 text-2xl font-bold">Commit Vote (Auto)</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Dispute ID *"
                    value={commitForm.disputeId}
                    onChange={(e) =>
                      setCommitForm({
                        ...commitForm,
                        disputeId: e.target.value,
                      })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />

                  <select
                    value={commitForm.vote}
                    onChange={(e) =>
                      setCommitForm({ ...commitForm, vote: e.target.value })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="1">Plaintiff</option>
                    <option value="2">Defendant</option>
                    <option value="3">Dismiss</option>
                  </select>

                  <div className="text-sm text-gray-400">
                    <p>
                      This flow will automatically use your wallet's pending
                      nonce to build the commitment nonce, generate the commit
                      hash, save a small JSON file locally with the details, and
                      submit the `commitVote` transaction for you.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleAutoCommitVote}
                    disabled={isPending || isConfirming}
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-medium transition-all hover:from-blue-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending
                      ? "Confirming..."
                      : isConfirming
                        ? "Committing..."
                        : "Commit Vote (Auto)"}
                  </button>
                </div>

                {commitForm.commitHash && (
                  <div className="mt-4 rounded bg-gray-700/40 p-3 font-mono text-sm break-all">
                    Commitment: {commitForm.commitHash}
                  </div>
                )}

                {uiError && <p className="mt-4 text-red-400">{uiError}</p>}
                {uiSuccess && (
                  <p className="mt-4 text-green-400">{uiSuccess}</p>
                )}
              </div>
            )}

            {activeTab === "reveal" && (
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-6 backdrop-blur-sm">
                <h2 className="mb-6 text-2xl font-bold">Reveal Vote</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Dispute ID *"
                    value={revealForm.disputeId}
                    onChange={(e) =>
                      setRevealForm({
                        ...revealForm,
                        disputeId: e.target.value,
                      })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <select
                    value={revealForm.vote}
                    onChange={(e) =>
                      setRevealForm({ ...revealForm, vote: e.target.value })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="1">Plaintiff</option>
                    <option value="2">Defendant</option>
                    <option value="3">Dismiss</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nonce *"
                    value={revealForm.nonce}
                    onChange={(e) =>
                      setRevealForm({ ...revealForm, nonce: e.target.value })
                    }
                    className="rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleGenerateCommitment}
                    className="flex-1 rounded-lg bg-gray-600 px-6 py-3 font-medium transition-all hover:bg-gray-700"
                  >
                    Generate Commitment
                  </button>
                  <button
                    onClick={handleRevealVote}
                    disabled={isPending || isConfirming}
                    className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-6 py-3 font-medium transition-all hover:from-green-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending
                      ? "Confirming..."
                      : isConfirming
                        ? "Revealing..."
                        : "Reveal Vote"}
                  </button>
                </div>
                {uiError && <p className="mt-4 text-red-400">{uiError}</p>}
                {uiSuccess && (
                  <p className="mt-4 text-green-400">{uiSuccess}</p>
                )}
              </div>
            )}

            {activeTab === "lookup" && (
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-6 backdrop-blur-sm">
                <h2 className="mb-6 text-2xl font-bold">Voter Lookup</h2>
                <div className="mb-6 flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter voter address"
                    value={voterLookup}
                    onChange={(e) => setVoterLookup(e.target.value)}
                    className="flex-1 rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      resetMessages();
                      if (!voterLookup) {
                        setUiError("Enter a voter address");
                        return;
                      }
                      if (!isValidAddress(voterLookup)) {
                        setUiError("Invalid voter address format");
                        return;
                      }
                      refetchVoterStats();
                      setUiSuccess("Fetching voter stats...");
                    }}
                    className="rounded-lg bg-purple-600 px-6 py-3 transition-colors hover:bg-purple-700"
                  >
                    Lookup
                  </button>
                </div>

                {voterStats && (
                  <div className="rounded-lg bg-gray-700/50 p-6">
                    <h3 className="mb-4 text-xl font-semibold">
                      Voter Statistics
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded bg-gray-600/50 p-3">
                        <span className="text-gray-400">Tier:</span>
                        <span className="ml-2 font-mono">
                          {formatTier(Number(voterStats[0]))}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/50 p-3">
                        <span className="text-gray-400">Total Votes:</span>
                        <span className="ml-2 font-mono">
                          {voterStats[1]?.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-green-600/20 p-3">
                        <span className="text-gray-400">Plaintiff Votes:</span>
                        <span className="ml-2 font-mono">
                          {voterStats[2]?.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-red-600/20 p-3">
                        <span className="text-gray-400">Defendant Votes:</span>
                        <span className="ml-2 font-mono">
                          {voterStats[3]?.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-yellow-600/20 p-3">
                        <span className="text-gray-400">Dismiss Votes:</span>
                        <span className="ml-2 font-mono">
                          {voterStats[4]?.toString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {uiError && <p className="mt-4 text-red-400">{uiError}</p>}
                {uiSuccess && (
                  <p className="mt-4 text-green-400">{uiSuccess}</p>
                )}
              </div>
            )}

            {activeTab === "dispute" && (
              <div className="rounded-lg border border-purple-500/20 bg-gray-800/50 p-6 backdrop-blur-sm">
                <h2 className="mb-6 text-2xl font-bold">Dispute Explorer</h2>

                <div className="mb-4 flex gap-4">
                  <input
                    type="text"
                    placeholder="Dispute ID"
                    value={disputeLookupId}
                    onChange={(e) => setDisputeLookupId(e.target.value)}
                    className="flex-1 rounded-lg bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={fetchDisputeAndReveals}
                    className="rounded-lg bg-purple-600 px-6 py-3 hover:bg-purple-700"
                  >
                    Fetch
                  </button>
                  <button
                    onClick={handleFinalizeExpired}
                    disabled={isPending || !disputeLookupId}
                    className="rounded-lg bg-red-600 px-6 py-3 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? "Finalizing..." : "Finalize (if expired)"}
                  </button>
                </div>

                {isFetchingDispute && (
                  <p className="text-gray-400">Fetching dispute...</p>
                )}

                {disputeData && (
                  <div className="mb-4 rounded-lg bg-gray-700/50 p-4">
                    <h3 className="mb-3 text-lg font-semibold">
                      Dispute Details
                    </h3>

                    {/* Status Indicators */}
                    <div className="mb-4 rounded-lg bg-gray-600/30 p-3">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span
                          className={`rounded px-2 py-1 ${disputeData[3] ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}
                        >
                          {disputeData[3] ? "Active" : "Inactive"}
                        </span>
                        <span
                          className={`rounded px-2 py-1 ${disputeData[6] ? "bg-purple-600/20 text-purple-400" : "bg-yellow-600/20 text-yellow-400"}`}
                        >
                          {disputeData[6] ? "Finalized" : "Not Finalized"}
                        </span>
                        <span
                          className={`rounded px-2 py-1 ${isVotingPeriodEnded(Number(disputeData[5])) ? "bg-red-600/20 text-red-400" : "bg-green-600/20 text-green-400"}`}
                        >
                          {isVotingPeriodEnded(Number(disputeData[5]))
                            ? "Voting Ended"
                            : "Voting Ongoing"}
                        </span>
                        <span
                          className={`rounded px-2 py-1 ${canCommitToDispute(disputeData).canCommit ? "bg-blue-600/20 text-blue-400" : "bg-gray-600/20 text-gray-400"}`}
                        >
                          {canCommitToDispute(disputeData).canCommit
                            ? "Can Commit"
                            : "Cannot Commit"}
                        </span>
                        <span
                          className={`rounded px-2 py-1 ${canRevealForDispute(disputeData).canReveal ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"}`}
                        >
                          {canRevealForDispute(disputeData).canReveal
                            ? "Can Reveal"
                            : "Cannot Reveal"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Dispute ID:</span>
                        <span className="ml-2 font-mono">
                          {disputeData[0]?.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">
                          Total Commitments:
                        </span>
                        <span className="ml-2 font-mono">
                          {toNumber(disputeData[8])}
                        </span>
                      </div>
                      <div className="col-span-2 rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Plaintiff:</span>
                        <span className="ml-2 font-mono text-xs break-all">
                          {disputeData[1]}
                        </span>
                      </div>
                      <div className="col-span-2 rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Defendant:</span>
                        <span className="ml-2 font-mono text-xs break-all">
                          {disputeData[2]}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Created At:</span>
                        <span className="ml-2 font-mono text-xs">
                          {new Date(
                            toNumber(disputeData[4]) * 1000,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">End Time:</span>
                        <span className="ml-2 font-mono text-xs">
                          {new Date(
                            toNumber(disputeData[5]) * 1000,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Result:</span>
                        <span className="ml-2 font-mono">
                          {disputeData[7] === 1
                            ? "Plaintiff"
                            : disputeData[7] === 2
                              ? "Defendant"
                              : disputeData[7] === 3
                                ? "Dismiss"
                                : "N/A"}
                        </span>
                      </div>
                      <div className="rounded bg-green-600/20 p-2">
                        <span className="text-gray-400">
                          Weighted Plaintiff:
                        </span>
                        <span className="ml-2 font-mono">
                          {disputeData[9]?.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-red-600/20 p-2">
                        <span className="text-gray-400">
                          Weighted Defendant:
                        </span>
                        <span className="ml-2 font-mono">
                          {disputeData[10]?.toString()}
                        </span>
                      </div>
                      <div className="rounded bg-yellow-600/20 p-2">
                        <span className="text-gray-400">Weighted Dismiss:</span>
                        <span className="ml-2 font-mono">
                          {disputeData[11]?.toString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {revealedList && revealedList.length > 0 && (
                  <div className="mb-4 rounded bg-gray-700/50 p-4">
                    <h3 className="mb-2 font-semibold">
                      Revealed Voters ({revealedList.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {revealedList.map((v) => (
                        <button
                          key={v}
                          onClick={() => fetchVoterReveal(v)}
                          className="truncate rounded bg-gray-600/30 px-3 py-2 text-left font-mono text-xs hover:bg-gray-600/50"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {revealedList && revealedList.length === 0 && disputeData && (
                  <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-600/20 p-4">
                    <p className="text-yellow-200">
                      No votes have been revealed yet for this dispute.
                    </p>
                  </div>
                )}

                {selectedRevealData && selectedRevealer && (
                  <div className="rounded bg-gray-700/50 p-4">
                    <h3 className="mb-3 font-semibold">
                      Reveal Details for Voter
                    </h3>
                    <div className="mb-3 rounded bg-gray-600/30 p-2 font-mono text-xs break-all">
                      {selectedRevealer}
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Revealed:</span>
                        <span
                          className={`ml-2 font-mono ${selectedRevealData[0] ? "text-green-400" : "text-red-400"}`}
                        >
                          {selectedRevealData[0] ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Vote:</span>
                        <span className="ml-2 font-mono">
                          {selectedRevealData[1] === 1
                            ? "Plaintiff"
                            : selectedRevealData[1] === 2
                              ? "Defendant"
                              : selectedRevealData[1] === 3
                                ? "Dismiss"
                                : "N/A"}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Tier:</span>
                        <span className="ml-2 font-mono">
                          {formatTier(selectedRevealData[2])}
                        </span>
                      </div>
                      <div className="rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Weight:</span>
                        <span className="ml-2 font-mono">
                          {selectedRevealData[3]?.toString()}
                        </span>
                      </div>
                      <div className="col-span-2 rounded bg-gray-600/30 p-2">
                        <span className="text-gray-400">Timestamp:</span>
                        <span className="ml-2 font-mono text-xs">
                          {new Date(
                            toNumber(selectedRevealData[4]) * 1000,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {uiError && <p className="mt-4 text-red-400">{uiError}</p>}
                {uiSuccess && (
                  <p className="mt-4 text-green-400">{uiSuccess}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Web3Vote;
