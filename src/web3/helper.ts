// src/web3/helper.ts

import { useState, useEffect } from "react";
import {
  DISPUTE_STATS_FALLBACK,
  type Agreement,
  // type BatchCreatorsResult,
  type DisputeStats,
} from "./interfaces";
import type { RawAgreementArray } from "./tuples";
import { ZERO_ADDRESS } from "./config";
// import { getAgreementExistOnchain } from "./readContract";

export function useCountdown(targetTimestamp: bigint) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!targetTimestamp || targetTimestamp === 0n) {
      setTimeLeft("N/A");
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const target = Number(targetTimestamp);
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Ready to claim");
        return;
      }

      const days = Math.floor(difference / (60 * 60 * 24));
      const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((difference % (60 * 60)) / 60);
      const seconds = Math.floor(difference % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return timeLeft;
}

export const isValidAddress = (addr: string): boolean => {
  if (!addr || typeof addr !== "string") return false;
  // Handle empty string, "0x", or malformed addresses
  if (addr === "0x" || addr.trim() === "" || addr.length !== 42) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
};

export const normalizeAddress = (address: `0x${string}`): string => {
  if (!address || typeof address !== `string`) return "";
  // Handle empty or invalid addresses
  if (!isValidAddress(address)) return address.toLowerCase(); // Return as is if not valid
  return address.toLowerCase();
};

// Format amount for display
export const formatAmount = (amount: bigint, decimals?: number) => {
  const actualDecimals = decimals || 18;
  // avoid Number(...) on huge BigInts — convert via string math
  try {
    const asStr = amount.toString();
    if (actualDecimals === 0) return asStr;
    const padded = asStr.padStart(actualDecimals + 1, "0");
    const intPart = padded.slice(0, -actualDecimals);
    const fracPart = padded.slice(-actualDecimals).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart.slice(0, 6)}` : `${intPart}`;
  } catch {
    return "0";
  }
};

export function isZeroAddress(address: string | undefined): boolean {
  return !!address && address.toLowerCase() === ZERO_ADDRESS;
}

/** Helper converters from unknown -> the types we need. */
function toBigInt(value: unknown): bigint {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(Math.trunc(value));
    if (typeof value === "string") {
      // allow hex string or decimal
      if (value.startsWith("0x") || value.startsWith("0X"))
        return BigInt(value);
      return BigInt(value);
    }
  } catch {
    // fall through to 0n
  }
  return 0n;
}

function toAddress(value: unknown): `0x${string}` {
  if (
    typeof value === "string" &&
    value.startsWith("0x") &&
    value.length === 42
  ) {
    return value as `0x${string}`;
  }
  return ZERO_ADDRESS as `0x${string}`;
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
    const n = Number(value);
    if (!Number.isNaN(n)) return n !== 0;
  }
  return false;
}

export function normalizeAgreement(res: unknown): Agreement {
  // If viem returns an array-like tuple
  if (Array.isArray(res)) {
    const tuple = res as RawAgreementArray;

    return {
      id: toBigInt(tuple[0]),
      creator: toAddress(tuple[1]),
      serviceProvider: toAddress(tuple[2]),
      serviceRecipient: toAddress(tuple[3]),
      token: toAddress(tuple[4]),
      amount: toBigInt(tuple[5]),
      remainingAmount: toBigInt(tuple[6]),
      createdAt: toBigInt(tuple[7]),
      deadline: toBigInt(tuple[8]),
      deadlineDuration: toBigInt(tuple[9]),
      grace1Ends: toBigInt(tuple[10]),
      grace2Ends: toBigInt(tuple[11]),
      grace1EndsCalledBy: toAddress(tuple[12]),
      grace2EndsCalledBy: toAddress(tuple[13]),
      funded: toBool(tuple[14]),
      signed: toBool(tuple[15]),
      acceptedByServiceProvider: toBool(tuple[16]),
      acceptedByServiceRecipient: toBool(tuple[17]),
      completed: toBool(tuple[18]),
      disputed: toBool(tuple[19]),
      privateMode: toBool(tuple[20]),
      frozen: toBool(tuple[21]),
      pendingCancellation: toBool(tuple[22]),
      orderCancelled: toBool(tuple[23]),
      vesting: toBool(tuple[24]),
      deliverySubmited: toBool(tuple[25]),
      votingId: toBigInt(tuple[26]),
      voteStartedAt: toBigInt(tuple[27]),
      plaintiff: toAddress(tuple[28]),
      defendant: toAddress(tuple[29]),
    };
  }

  // If viem returns an object with named properties (some viem setups return objects)
  const obj = (res ?? {}) as Record<string, unknown>;
  const get = (k1: string, k2: number) => {
    if (k1 in obj) return obj[k1];
    return obj[k2];
  };

  return {
    id: toBigInt(get("_id", 0)),
    creator: toAddress(get("creator", 1)),
    serviceProvider: toAddress(get("serviceProvider", 2)),
    serviceRecipient: toAddress(get("serviceRecipient", 3)),
    token: toAddress(get("token", 4)),
    amount: toBigInt(get("amount", 5)),
    remainingAmount: toBigInt(get("remainingAmount", 6)),
    createdAt: toBigInt(get("createdAt", 7)),
    deadline: toBigInt(get("deadline", 8)),
    deadlineDuration: toBigInt(get("deadlineDuration", 9)),
    grace1Ends: toBigInt(get("grace1Ends", 10)),
    grace2Ends: toBigInt(get("grace2Ends", 11)),
    grace1EndsCalledBy: toAddress(get("grace1EndsCalledBy", 12)),
    grace2EndsCalledBy: toAddress(get("grace2EndsCalledBy", 13)),
    funded: toBool(get("funded", 14)),
    signed: toBool(get("signed", 15)),
    acceptedByServiceProvider: toBool(get("acceptedByServiceProvider", 16)),
    acceptedByServiceRecipient: toBool(get("acceptedByServiceRecipient", 17)),
    completed: toBool(get("completed", 18)),
    disputed: toBool(get("disputed", 19)),
    privateMode: toBool(get("privateMode", 20)),
    frozen: toBool(get("frozen", 21)),
    pendingCancellation: toBool(get("pendingCancellation", 22)),
    orderCancelled: toBool(get("orderCancelled", 23)),
    vesting: toBool(get("vesting", 24)),
    deliverySubmited: toBool(get("deliverySubmited", 25)),
    votingId: toBigInt(get("votingId", 26)),
    voteStartedAt: toBigInt(get("voteStartedAt", 27)),
    plaintiff: toAddress(get("plaintiff", 28)),
    defendant: toAddress(get("defendant", 29)),
  };
}

export const normalizeDisputeStats = (raw: unknown): DisputeStats => {
  if (!raw || !Array.isArray(raw) || raw.length < 10) {
    return DISPUTE_STATS_FALLBACK;
  }

  return {
    id: BigInt(raw[0] ?? 0),
    active: Boolean(raw[1]),
    createdAt: BigInt(raw[2] ?? 0),
    endTime: BigInt(raw[3] ?? 0),
    finalized: Boolean(raw[4]),
    result: BigInt(raw[5] ?? 0),
    totalVotes: BigInt(raw[6] ?? 0),
    weightedPlaintiff: BigInt(raw[7] ?? 0),
    weightedDefendant: BigInt(raw[8] ?? 0),
    weightedDismiss: BigInt(raw[9] ?? 0),
  };
};

// Format date with time
export const formatDateWithTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format number with commas
export const formatNumberWithCommas = (value: string | undefined): string => {
  if (!value) return "";
  const numericValue = value.replace(/,/g, "");
  const parts = numericValue.split(".");
  let wholePart = parts[0];
  const decimalPart = parts[1] || "";

  if (wholePart) {
    wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart;
};

// export async function checkMultipleAgreementsExist(
//   chainId: number,
//   agreementIds: bigint[],
// ): Promise<BatchCreatorsResult> {
//   try {
//     const creators = await getAgreementExistOnchain(chainId, agreementIds);

//     // Map IDs to their creators
//     const results = agreementIds.map((id, index) => ({
//       id,
//       creator: creators[index] || (ZERO_ADDRESS as `0x${string}`),
//       exists: creators[index] !== undefined && creators[index] !== ZERO_ADDRESS,
//     }));

//     return results;
//   } catch (error) {
//     console.error("Error checking multiple agreements:", error);
//     // Return fallback results with all false
//     return agreementIds.map((id) => ({
//       id,
//       creator: ZERO_ADDRESS as `0x${string}`,
//       exists: false,
//     }));
//   }
// }
