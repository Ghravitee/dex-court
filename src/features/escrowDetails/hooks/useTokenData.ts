/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useContractReads } from "wagmi";
import { useNetworkEnvironment } from "../../../config/useNetworkEnvironment";
import {
  getTokenDecimals,
  getTokenSymbol,
  getMilestoneCount,
} from "../../../web3/readContract";
import { ESCROW_ABI, ZERO_ADDRESS } from "../../../web3/config";
import type { MilestoneData } from "../../../web3/interfaces";
import type { EscrowDetailsData } from "../types";

export function useTokenData(
  onChainAgreement: any,
  escrow: EscrowDetailsData | null,
) {
  const networkInfo = useNetworkEnvironment();
  const [onChainTokenDecimals, setOnChainTokenDecimals] = useState<
    number | null
  >(null);
  const [onChainTokenSymbol, setOnChainTokenSymbol] = useState<string | null>(
    null,
  );
  const [manageMilestoneCount, setManageMilestoneCount] = useState<
    bigint | null
  >(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [, setRefetchTrigger] = useState(0);

  const tokenAddress =
    onChainAgreement?.token && onChainAgreement.token !== ZERO_ADDRESS
      ? (onChainAgreement.token as `0x${string}`)
      : undefined;

  const decimalsNumber =
    typeof onChainTokenDecimals === "number" ? onChainTokenDecimals : 18;
  const tokenSymbol =
    onChainTokenSymbol ??
    (onChainAgreement?.token === ZERO_ADDRESS
      ? "ETH"
      : (escrow?.token ?? "TOKEN"));

  const triggerMilestoneRefetch = useCallback(
    () => setRefetchTrigger((p) => p + 1),
    [],
  );

  // Fetch token metadata
  useEffect(() => {
    if (!tokenAddress || !networkInfo.chainId || !onChainAgreement) {
      setOnChainTokenDecimals(null);
      setOnChainTokenSymbol(null);
      setManageMilestoneCount(null);
      return;
    }

    let cancelled = false;
    setTokenLoading(true);

    (async () => {
      try {
        const dec = await getTokenDecimals(
          networkInfo.chainId as number,
          tokenAddress,
        );
        if (!cancelled) setOnChainTokenDecimals(Number(dec));
      } catch {
        if (!cancelled) setOnChainTokenDecimals(null);
      }

      try {
        const sym = await getTokenSymbol(
          networkInfo.chainId as number,
          tokenAddress,
        );
        if (!cancelled) setOnChainTokenSymbol(sym);
      } catch {
        if (!cancelled) setOnChainTokenSymbol(null);
      }

      try {
        const mlc = await getMilestoneCount(
          networkInfo.chainId as number,
          onChainAgreement?.id as bigint,
        );
        if (!cancelled) setManageMilestoneCount(mlc);
      } catch {
        if (!cancelled) setManageMilestoneCount(null);
      }

      if (!cancelled) setTokenLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenAddress, networkInfo.chainId, onChainAgreement]);

  // Build milestone contracts
  const contractsForMilestones = useMemo(() => {
    if (
      !manageMilestoneCount ||
      !onChainAgreement?.id ||
      !onChainAgreement.vesting
    )
      return [];
    const count = Number(manageMilestoneCount);
    if (count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: escrow?.escrowAddress as `0x${string}`,
      abi: ESCROW_ABI.abi,
      functionName: "getMilestone" as const,
      args: [onChainAgreement.id, BigInt(i)],
    }));
  }, [
    manageMilestoneCount,
    onChainAgreement?.id,
    onChainAgreement?.vesting,

    escrow?.escrowAddress,
  ]);

  const { data: rawMilestonesData, refetch: refetchMilestonesData } =
    useContractReads({
      contracts: contractsForMilestones,
      query: { enabled: contractsForMilestones.length > 0 },
    });

  // Map milestone data
  const toBigIntSafe = (v: unknown): bigint => {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(Math.floor(v));
    if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
    if (v && typeof (v as any).toString === "function") {
      const s = (v as any).toString();
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
            return {
              percentBP: toBigIntSafe(r[0]),
              unlockAt: toBigIntSafe(r[1]),
              heldByRecipient: !!r[2],
              claimed: !!r[3],
              amount: toBigIntSafe(r[4]),
            };
          }
          if (typeof r === "object") {
            const o = r as any;
            return {
              percentBP: toBigIntSafe(o.percentBP ?? o["0"]),
              unlockAt: toBigIntSafe(o.unlockAt ?? o["1"]),
              heldByRecipient: !!(o.heldByRecipient ?? o["2"]),
              claimed: !!(o.claimed ?? o["3"]),
              amount: toBigIntSafe(o.amount ?? o["4"]),
            };
          }
          return null;
        })
        .filter(Boolean) as MilestoneData[];
      setMilestones(mapped);
    } catch {
      setMilestones([]);
    }
  }, [rawMilestonesData]);

  useEffect(() => {
    if (manageMilestoneCount) refetchMilestonesData();
    else setMilestones([]);
  }, [manageMilestoneCount, refetchMilestonesData]);

  return {
    decimalsNumber,
    tokenSymbol,
    tokenLoading,
    manageMilestoneCount,
    milestones,
    triggerMilestoneRefetch,
  };
}
