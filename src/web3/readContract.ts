// src/web3/readContract.ts
import type { PublicClient, Abi } from "viem";
import { getTransactionCount as viemGetTransactionCount } from "viem/actions";
import { getClientForChain } from "../config/publicConfig";
import { ERC20_ABI, ESCROW_ABI, ESCROW_CA, VOTING_ABI, VOTING_CA, ZERO_ADDRESS } from "./config";
import { AGREEMENT_FALLBACK, DISPUTE_STATS_FALLBACK, LEADERBOARD_FALLBACK, VOTER_STATS_FALLBACK, VOTER_TIER_FALLBACK, VOTING_CONFIG_FALLBACK, VOTING_STATS_WITH_AVG_FALLBACK, type Agreement, type DisputeStats, type Leaderboard, type VoterReveal, type VoterStats, type VoterTier, type VOTING_CONFIG, type VotingStatsWithAvg } from "./interfaces";
import { isZeroAddress, normalizeAgreement, normalizeDisputeStats, normalizeLeaderboard, normalizeVoterReveal, normalizeVoterStats, normalizeVoterTier, normalizeVotingConfig, normalizeVotingStatsWithAvg } from "./helper";


/**
 * Returns the nonce (transaction count) for an address on a chain.
 */
export const getTransactionCount = async (
  chainId: number,
  address: `0x${string}`,
): Promise<bigint> => {
  const publicClient: PublicClient = getClientForChain(chainId);

  if (isZeroAddress(address)) return 0n;

  try {
    const txCount = await viemGetTransactionCount(publicClient, { address });
    return BigInt(txCount);
  } catch (err) {
    console.error(`getTransactionCount failed (chain=${chainId}, addr=${address}):`, err);
    throw err;
  }
};

/**
 * Typed getAgreement wrapper.
 */
export const getAgreement = async (
  chainId: number,
  agreementId: bigint,
): Promise<Agreement> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = ESCROW_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return AGREEMENT_FALLBACK;
  }

  // optional short-circuit if you treat id === 0 as "empty"
  if (agreementId === 0n) return AGREEMENT_FALLBACK;

  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ESCROW_ABI as AbiLike;
    const abi = (("abi" in (maybe as object) ? (maybe as { abi?: Abi }).abi : (maybe as Abi))) ?? (ESCROW_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getAgreement",
      args: [agreementId],
    });

    return normalizeAgreement(raw);
  } catch (err) {
    console.error(`getAgreement failed (chain=${chainId}, id=${agreementId}):`, err);
    // choose whether to rethrow or return fallback; here we rethrow for visibility
    throw err;
  }
};

export const getAgreementExistOnchain = async (
  chainId: number,
  agreementIds: bigint[],
): Promise<`0x${string}`[]> => {  // Changed return type
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = ESCROW_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return [];  // Return empty array instead of CREATORS_FALLBACK
  }

  if (agreementIds.length === 0) return [];

  // Filter out any zero IDs if needed
  const validIds = agreementIds.filter(id => id !== 0n);
  if (validIds.length === 0) return [];

  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ESCROW_ABI as AbiLike;
    const abi = (("abi" in (maybe as object) ? (maybe as { abi?: Abi }).abi : (maybe as Abi))) ?? (ESCROW_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getCreatorsBatch",
      args: [validIds],
    });

    // The contract returns an array of addresses
    if (Array.isArray(raw)) {
      return raw.map(addr => (addr as `0x${string}`) || ZERO_ADDRESS as `0x${string}`);
    }

    return [];
  } catch (err) {
    console.error(`getAgreementExistOnchain failed (chain=${chainId}, ids=${agreementIds}):`, err);
    // Return empty array on error
    return [];
  }
};

/**
 *  getTokenDecimals reads the symbol of an ERC-20 token.
 */
export const getTokenDecimals = async (
  chainId: number,
  tokenAddr: `0x${string}`,
): Promise<bigint> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = tokenAddr;

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return 18n;
  }


  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ERC20_ABI as AbiLike;
    const abi = (("abi" in (maybe as object) ? (maybe as { abi?: Abi }).abi : (maybe as Abi))) ?? (ERC20_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "decimals",
      args: [],
    });

    return BigInt(raw as number);
  } catch (err) {
    console.error(` (chain=${chainId}, id=${tokenAddr}):`, err);
    // choose whether to rethrow or return fallback; here we rethrow for visibility
    throw err;
  }
};

/**
 * getTokenSymbol reads the symbol of an ERC-20 token.
 */
export const getTokenSymbol = async (
  chainId: number,
  tokenAddr: `0x${string}`,
): Promise<string> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = tokenAddr;

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return 'ETH';
  }


  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ERC20_ABI as AbiLike;
    const abi = (("abi" in (maybe as object) ? (maybe as { abi?: Abi }).abi : (maybe as Abi))) ?? (ERC20_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "symbol",
      args: [],
    });

    return (raw as string);
  } catch (err) {
    console.error(` (chain=${chainId}, id=${tokenAddr}):`, err);
    // choose whether to rethrow or return fallback; here we rethrow for visibility
    throw err;
  }
};

/**
 * getTokenSymbol reads the symbol of an ERC-20 token.
 */
export const getMilestoneCount = async (
  chainId: number,
  agreementId: bigint,
): Promise<bigint> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = ESCROW_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr) || !agreementId || agreementId === 0n) {
    return 0n;
  }

  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ESCROW_ABI as AbiLike;
    const abi = (("abi" in (maybe as object) ? (maybe as { abi?: Abi }).abi : (maybe as Abi))) ?? (ESCROW_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getMilestoneCount",
      args: [agreementId],
    });

    return (raw as bigint);
  } catch (err) {
    console.error(` (chain=${chainId}, id=${agreementId}):`, err);
    // choose whether to rethrow or return fallback; here we rethrow for visibility
    throw err;
  }
};

/**
 * .
 */
export const getVotingConfig = async (
  chainId: number,
): Promise<VOTING_CONFIG> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return VOTING_CONFIG_FALLBACK;
  }


  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = VOTING_ABI as AbiLike;
    const abi = (("abi" in (maybe as object) ? (maybe as { abi?: Abi }).abi : (maybe as Abi))) ?? (VOTING_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getVotingConfig",
      args: [],
    });

    return normalizeVotingConfig(raw);
  } catch (err) {
    console.error(` (chain=${chainId}, id=${contractAddr}):`, err);
    // choose whether to rethrow or return fallback; here we rethrow for visibility
    throw err;
  }
};

export const getVotingStatsWithAvg = async (
  chainId: number,
): Promise<VotingStatsWithAvg> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return VOTING_STATS_WITH_AVG_FALLBACK;
  }

  try {
    const abi = VOTING_ABI.abi as Abi;

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getVotingStatsWithAvg",
      args: [],
    });

    return normalizeVotingStatsWithAvg(raw);
  } catch (err) {
    console.error(`getVotingStatsWithAvg failed (chain=${chainId}):`, err);
    return VOTING_STATS_WITH_AVG_FALLBACK;
  }
};

export const getLeaderboard = async (
  chainId: number,
): Promise<Leaderboard> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return LEADERBOARD_FALLBACK;
  }

  try {
    const abi = VOTING_ABI.abi as Abi;

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getLeaderboard",
      args: [],
    });

    return normalizeLeaderboard(raw);
  } catch (err) {
    console.error(`getLeaderboard failed (chain=${chainId}):`, err);
    return LEADERBOARD_FALLBACK;
  }
};

export const getVoterStats = async (
  chainId: number,
  voter: `0x${string}`,
): Promise<VoterStats> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return VOTER_STATS_FALLBACK;
  }

  try {
    const abi = VOTING_ABI.abi as Abi;

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getVoterStats",
      args: [voter],
    });

    return normalizeVoterStats(raw);
  } catch (err) {
    console.error(`getVoterStats failed (chain=${chainId}, voter=${voter}):`, err);
    return VOTER_STATS_FALLBACK;
  }
};

export const getVoterTier = async (
  chainId: number,
  voter: `0x${string}`,
): Promise<VoterTier> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return VOTER_TIER_FALLBACK;
  }

  try {
    const abi = VOTING_ABI.abi as Abi;

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getVoterTier",
      args: [voter],
    });

    return normalizeVoterTier(raw);
  } catch (err) {
    console.error(`getVoterTier failed (chain=${chainId}, voter=${voter}):`, err);
    return VOTER_TIER_FALLBACK;
  }
};

export const getDisputeStats = async (
  chainId: number,
  disputeId: bigint,
): Promise<DisputeStats> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return DISPUTE_STATS_FALLBACK;
  }

  try {
    const abi = VOTING_ABI.abi as Abi;

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getDisputeStats",
      args: [disputeId],
    });

    return normalizeDisputeStats(raw);
  } catch (err) {
    console.error(`getDisputeStats failed (chain=${chainId}, disputeId=${disputeId}):`, err);
    return DISPUTE_STATS_FALLBACK;
  }
};

export const getRevealedVoters = async (
  chainId: number,
  disputeId: bigint,
): Promise<`0x${string}`[]> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return [];
  }

  try {
    const abi = VOTING_ABI.abi as Abi;

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getRevealedVoters",
      args: [disputeId],
    });

    return (raw as `0x${string}`[]) || [];
  } catch (err) {
    console.error(`getRevealedVoters failed (chain=${chainId}, disputeId=${disputeId}):`, err);
    return [];
  }
};

export const getVoterReveal = async (
  chainId: number,
  disputeId: bigint,
  voter: `0x${string}`,
): Promise<VoterReveal> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId];

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return normalizeVoterReveal(null);
  }

  try {
    const abi = VOTING_ABI.abi as Abi;

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getVoterReveal",
      args: [disputeId, voter],
    });

    return normalizeVoterReveal(raw);
  } catch (err) {
    console.error(`getVoterReveal failed (chain=${chainId}, disputeId=${disputeId}, voter=${voter}):`, err);
    return normalizeVoterReveal(null);
  }
};