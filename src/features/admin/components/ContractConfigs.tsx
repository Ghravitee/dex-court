// src/features/admin/components/ContractConfigs.tsx
import { useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useReadContract } from "wagmi";
import { formatDuration, shortAddress, type ContractConfigsTabProps } from "../types";
import { ESCROW_ABI, VOTING_ABI } from "../../../web3/config";
import { ConfigField } from "./ConfigField";
import { ContractHeader } from "./ContractHeader";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 p-4">
      <p className="mb-1 text-xs text-white/40">{label}</p>
      <p className="text-xl font-semibold text-white/90">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/30">{sub}</p>}
    </div>
  );
}

export function ContractConfigsTab({
  activeChainId,
  escrowAddress,
  votingAddress,
  explorerBase,
  onUpdateEscrowConfig,
  onUpdateVotingConfig,
  onSetDisputeResolver,
  onSetFeeRecipient,
  onFreezeAgreement,
  onRecoverStuckEthEscrow,
  onRecoverStuckEthVoting,
  onRecoverStuckTokenEscrow,
  onRecoverStuckTokenVoting,
  isUpdatingEscrow,
  isUpdatingVoting,
  isFreezingAgreement,
  isRecoveringEscrowEth,
  isRecoveringVotingEth,
  isRecoveringEscrowToken,
  isRecoveringVotingToken,
}: ContractConfigsTabProps) {
  const [escrowForm, setEscrowForm] = useState({
    platformFeeBp: "",
    feeAmount: "",
    disputeDuration: "",
    grace1Duration: "",
    grace2Duration: "",
  });

  const [votingForm, setVotingForm] = useState({
    disputeDuration: "",
    vToken: "",
    feeRec: "",
    disputeResolver: "",
    feeAmount: "",
  });

  const [resolverForm, setResolverForm] = useState("");
  const [feeRecipientForm, setFeeRecipientForm] = useState("");

  const [freezeForm, setFreezeForm] = useState({
    id: "",
    status: false,
  });

  const [recoverForm, setRecoverForm] = useState({
    token: "",
    amount: "",
  });

  const { data: escrowConfigRaw } = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getEscrowConfigs",
    chainId: activeChainId, 
    query: {
      enabled: Boolean(escrowAddress),
    },
  });

  const { data: escrowStatsRaw } = useReadContract({
    address: escrowAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getStats",
    chainId: activeChainId,
    query: {
      enabled: Boolean(escrowAddress),
    },
  });

  const { data: votingConfigRaw } = useReadContract({
    address: votingAddress,
    abi: VOTING_ABI.abi,
    functionName: "getVotingConfig",
    chainId: activeChainId,
    query: {
      enabled: Boolean(votingAddress),
    },
  });

  const { data: votingStatsRaw } = useReadContract({
    address: votingAddress,
    abi: VOTING_ABI.abi,
    functionName: "getStats",
    chainId: activeChainId,
    query: {
      enabled: Boolean(votingAddress),
    },
  });

  const escrowConfig = escrowConfigRaw as
    | { platformFeeBp: bigint; feeAmount: bigint; disputeDuration: bigint; grace1Duration: bigint; grace2Duration: bigint }
    | undefined;

  const escrowStats = escrowStatsRaw as
    | { agreementsTotal: bigint; disputesTotal: bigint; smoothTotal: bigint; feesTaken: bigint; escrowedEth: bigint; _feeRecipient: string }
    | undefined;

  const votingConfig = votingConfigRaw as
    | { disputeDuration: bigint; vToken: string; feeRec: string; disputeResolver: string; feeAmount: bigint }
    | undefined;

  useEffect(() => {
    if (!escrowConfig) return;
    setEscrowForm({
      platformFeeBp: String(Number(escrowConfig.platformFeeBp) / 100),
      feeAmount: formatEther(escrowConfig.feeAmount ?? 0n),
      disputeDuration: String(escrowConfig.disputeDuration ?? 0n),
      grace1Duration: String(escrowConfig.grace1Duration ?? 0n),
      grace2Duration: String(escrowConfig.grace2Duration ?? 0n),
    });
  }, [escrowConfig]);

  useEffect(() => {
    if (!votingConfig) return;
    setVotingForm({
      disputeDuration: String(votingConfig.disputeDuration ?? 0n),
      vToken: votingConfig.vToken ?? "",
      feeRec: votingConfig.feeRec ?? "",
      disputeResolver: votingConfig.disputeResolver ?? "",
      feeAmount: formatEther(votingConfig.feeAmount ?? 0n),
    });
    setResolverForm(votingConfig.disputeResolver ?? "");
    setFeeRecipientForm(votingConfig.feeRec ?? "");
  }, [votingConfig]);

  const escrowAgreements = String(escrowStats?.agreementsTotal ?? 0n);
  const escrowDisputes = String(escrowStats?.disputesTotal ?? 0n);
  const escrowFees = formatEther(escrowStats?.feesTaken ?? 0n);
  const escrowedEth = formatEther(escrowStats?.escrowedEth ?? 0n);

  const votingStats = votingStatsRaw as
    | { totalDisputes_: bigint; totalFeesCollected_: bigint }
    | undefined;

  const votingDisputes = String(votingStats?.totalDisputes_ ?? 0n);
  const votingFees = formatEther(votingStats?.totalFeesCollected_ ?? 0n);

  const handleUpdateEscrow = async () => {
    console.log("Updating escrow config with", escrowForm);
    console.log("Parsed values", {
      platformFeeBp: BigInt(Math.round(Number(escrowForm.platformFeeBp || "0") * 100)),
      feeAmount: parseEther(escrowForm.feeAmount || "0"),
      disputeDuration: BigInt(escrowForm.disputeDuration || "0"),
      grace1Duration: BigInt(escrowForm.grace1Duration || "0"),
      grace2Duration: BigInt(escrowForm.grace2Duration || "0"),
    });

    await onUpdateEscrowConfig({
      platformFeeBp: BigInt(Math.round(Number(escrowForm.platformFeeBp || "0") * 100)),
      feeAmount: parseEther(escrowForm.feeAmount || "0"),
      disputeDuration: BigInt(escrowForm.disputeDuration || "0"),
      grace1Duration: BigInt(escrowForm.grace1Duration || "0"),
      grace2Duration: BigInt(escrowForm.grace2Duration || "0"),
    });
  };

  const handleUpdateVoting = async () => {
    await onUpdateVotingConfig({
      disputeDuration: BigInt(votingForm.disputeDuration || "0"),
      voteToken: votingForm.vToken as `0x${string}`,
      feeRecipient: votingForm.feeRec as `0x${string}`,
      disputeResolver: votingForm.disputeResolver as `0x${string}`,
      feeAmount: parseEther(votingForm.feeAmount || "0"),
    });
  };

  const handleFreeze = async () => {
    await onFreezeAgreement(BigInt(freezeForm.id || "0"), freezeForm.status);
  };

  const handleRecoverEscrowEth = async () => {
    await onRecoverStuckEthEscrow(parseEther(recoverForm.amount || "0"));
  };

  const handleRecoverVotingEth = async () => {
    await onRecoverStuckEthVoting(parseEther(recoverForm.amount || "0"));
  };

  const handleRecoverEscrowToken = async () => {
    await onRecoverStuckTokenEscrow(
      recoverForm.token as `0x${string}`,
      BigInt(recoverForm.amount || "0")
    );
  };

  const handleRecoverVotingToken = async () => {
    await onRecoverStuckTokenVoting(
      recoverForm.token as `0x${string}`,
      BigInt(recoverForm.amount || "0")
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total agreements" value={escrowAgreements} />
        <StatCard label="Total disputes" value={escrowDisputes} />
        <StatCard label="Fees taken" value={`${escrowFees} ETH`} />
        <StatCard label="Total escrowed" value={`${escrowedEth} ETH`} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <ContractHeader
            title="AgreementEscrow"
            address={escrowAddress}
            explorerUrl={`${explorerBase}/address/${escrowAddress}`}
          />

          <ConfigField
            label="Platform fee"
            hint="e.g. 3 for 3%"
            current={escrowConfig ? `${Number(escrowConfig.platformFeeBp) / 100}%` : "—"}
            value={escrowForm.platformFeeBp}
            onChange={(v) => setEscrowForm((f) => ({ ...f, platformFeeBp: v }))}
          />
          <ConfigField
            label="Dispute fee"
            hint="e.g. 0.01 ETH"
            current={escrowConfig ? `${formatEther(escrowConfig.feeAmount)} ETH` : "—"}
            value={escrowForm.feeAmount}
            onChange={(v) => setEscrowForm((f) => ({ ...f, feeAmount: v }))}
          />
          <ConfigField
            label="Dispute duration"
            hint="e.g. 86400 seconds"
            current={escrowConfig ? formatDuration(String(escrowConfig.disputeDuration)) : "—"}
            value={escrowForm.disputeDuration}
            onChange={(v) => setEscrowForm((f) => ({ ...f, disputeDuration: v }))}
          />
          <ConfigField
            label="Grace 1 duration"
            hint="e.g. 86400 seconds"
            current={escrowConfig ? formatDuration(String(escrowConfig.grace1Duration)) : "—"}
            value={escrowForm.grace1Duration}
            onChange={(v) => setEscrowForm((f) => ({ ...f, grace1Duration: v }))}
          />
          <ConfigField
            label="Grace 2 duration"
            hint="e.g. 86400 seconds"
            current={escrowConfig ? formatDuration(String(escrowConfig.grace2Duration)) : "—"}
            value={escrowForm.grace2Duration}
            onChange={(v) => setEscrowForm((f) => ({ ...f, grace2Duration: v }))}
          />

          <button
            onClick={handleUpdateEscrow}
            disabled={isUpdatingEscrow}
            className="mt-2 w-full rounded-lg bg-purple-500/20 px-4 py-2.5 text-sm font-medium text-purple-300 ring-1 ring-purple-400/30 transition-all hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdatingEscrow ? "Updating escrow config..." : "Update escrow config"}
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <ContractHeader
            title="Voting"
            address={votingAddress}
            explorerUrl={`${explorerBase}/address/${votingAddress}`}
          />

          <div className="mb-2 grid grid-cols-2 gap-3">
            <StatCard label="Total disputes" value={votingDisputes} />
            <StatCard label="Fees collected" value={`${votingFees} ETH`} />
          </div>

          <ConfigField
            label="Dispute duration (s)"
            hint="86400 = 1 day"
            current={votingConfig ? formatDuration(String(votingConfig?.disputeDuration ?? 0n)) : "—"}
            value={votingForm.disputeDuration}
            onChange={(v) =>
              setVotingForm((f) => ({ ...f, disputeDuration: v }))
            }
          />
          <ConfigField
            label="Vote token address"
            hint="0x..."
            current={shortAddress(votingConfig?.vToken)}
            value={votingForm.vToken}
            onChange={(v) => setVotingForm((f) => ({ ...f, vToken: v }))}
          />
          <ConfigField
            label="Fee recipient"
            hint="0x..."
            current={shortAddress(votingConfig?.feeRec)}
            value={votingForm.feeRec}
            onChange={(v) => setVotingForm((f) => ({ ...f, feeRec: v }))}
          />
          <ConfigField
            label="Dispute resolver"
            hint="0x..."
            current={shortAddress(votingConfig?.disputeResolver)}
            value={votingForm.disputeResolver}
            onChange={(v) =>
              setVotingForm((f) => ({ ...f, disputeResolver: v }))
            }
          />
          <ConfigField
            label="Dispute fee (ETH)"
            hint="e.g. 0.01"
            current={formatEther(votingConfig?.feeAmount ?? 0n)}
            value={votingForm.feeAmount}
            onChange={(v) => setVotingForm((f) => ({ ...f, feeAmount: v }))}
          />

          <button
            onClick={handleUpdateVoting}
            disabled={isUpdatingVoting}
            className="mt-2 w-full rounded-lg bg-purple-500/20 px-4 py-2.5 text-sm font-medium text-purple-300 ring-1 ring-purple-400/30 transition-all hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdatingVoting ? "Updating voting config..." : "Update voting config"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-white/90">Resolver / fee recipient</h3>

          <ConfigField
            label="Dispute resolver"
            hint="0x..."
            current={shortAddress(votingConfig?.disputeResolver)}
            value={resolverForm}
            onChange={setResolverForm}
          />
          <button
            onClick={() => onSetDisputeResolver(resolverForm as `0x${string}`)}
            className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-all hover:bg-white/10"
          >
            Update escrow dispute resolver
          </button>

          <ConfigField
            label="Fee recipient"
            hint="0x..."
            current={shortAddress(votingConfig?.feeRec)}
            value={feeRecipientForm}
            onChange={setFeeRecipientForm}
          />
          <button
            onClick={() => onSetFeeRecipient(feeRecipientForm as `0x${string}`)}
            className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 transition-all hover:bg-white/10"
          >
            Update escrow fee recipient
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-white/90">Maintenance</h3>

          <ConfigField
            label="Agreement ID"
            hint="123"
            current="used for freeze / unfreeze"
            value={freezeForm.id}
            onChange={(v) => setFreezeForm((f) => ({ ...f, id: v }))}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFreezeForm((f) => ({ ...f, status: true }))}
              className="flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10"
            >
              Freeze
            </button>
            <button
              onClick={() => setFreezeForm((f) => ({ ...f, status: false }))}
              className="flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10"
            >
              Unfreeze
            </button>
          </div>

          <button
            onClick={handleFreeze}
            disabled={isFreezingAgreement}
            className="w-full rounded-lg bg-purple-500/20 px-4 py-2.5 text-sm font-medium text-purple-300 ring-1 ring-purple-400/30 transition-all hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFreezingAgreement
              ? "Updating freeze status..."
              : "Apply freeze status"}
          </button>

          <div className="h-px bg-white/10" />

          <ConfigField
            label="Token address"
            hint="0x... or leave blank for ETH"
            current="maintenance recovery"
            value={recoverForm.token}
            onChange={(v) => setRecoverForm((f) => ({ ...f, token: v }))}
          />
          <ConfigField
            label="Amount"
            hint="0.01 or token units"
            current="amount to recover"
            value={recoverForm.amount}
            onChange={(v) => setRecoverForm((f) => ({ ...f, amount: v }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRecoverEscrowEth}
              disabled={isRecoveringEscrowEth}
              className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRecoveringEscrowEth ? "Recovering..." : "Recover ETH escrow"}
            </button>
            <button
              onClick={handleRecoverVotingEth}
              disabled={isRecoveringVotingEth}
              className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRecoveringVotingEth ? "Recovering..." : "Recover ETH voting"}
            </button>
            <button
              onClick={handleRecoverEscrowToken}
              disabled={isRecoveringEscrowToken}
              className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRecoveringEscrowToken ? "Recovering..." : "Recover token escrow"}
            </button>
            <button
              onClick={handleRecoverVotingToken}
              disabled={isRecoveringVotingToken}
              className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRecoveringVotingToken ? "Recovering..." : "Recover token voting"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}