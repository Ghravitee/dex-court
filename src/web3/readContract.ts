// src/web3/readContract.ts

import type { PublicClient, Abi } from "viem";
import { getTransactionCount as viemGetTransactionCount } from "viem/actions";
import { getClientForChain } from "../config/publicConfig";
import {
  ERC20_ABI,
  ESCROW_ABI,
  ESCROW_CA,
  VOTING_ABI,
  VOTING_CA,
  ZERO_ADDRESS,
} from "./config";
import {
  AGREEMENT_FALLBACK,
  ESCROW_CONFIG_FALLBACKS,
  VOTING_CONFIG_FALLBACK,
  type Agreement,
  type Escrow_Configs,
  type VOTING_CONFIG,
} from "./interfaces";
import { isZeroAddress, normalizeAgreement } from "./helper";

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
    console.error(
      `getTransactionCount failed (chain=${chainId}, addr=${address}):`,
      err,
    );
    throw err;
  }
};

/**
 * Typed getAgreement wrapper.
 */
export const getAgreement = async (
  escrowCA: `0x${string}`,
  chainId: number,
  agreementId: bigint,
): Promise<Agreement> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = escrowCA;
  console.log(`getAgreement: chainId=${chainId}, agreementId=${agreementId}, contractAddr=${contractAddr}`);

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
    const abi =
      ("abi" in (maybe as object)
        ? (maybe as { abi?: Abi }).abi
        : (maybe as Abi)) ?? (ESCROW_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getAgreement",
      args: [agreementId],
    });

    return normalizeAgreement(raw);
  } catch (err) {
    console.error(
      `getAgreement failed (chain=${chainId}, id=${agreementId}):`,
      err,
    );
    // choose whether to rethrow or return fallback; here we rethrow for visibility
    throw err;
  }
};

export const getAgreementExistOnchain = async (
  chainId: number,
  contractAgreementIds: bigint[],
  escrowContractAddress: `0x${string}`
): Promise<boolean[]> => {
  // Changed return type
  const publicClient: PublicClient = getClientForChain(chainId);

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!escrowContractAddress || isZeroAddress(escrowContractAddress)) {
    return []; // Return empty array instead of CREATORS_FALLBACK
  }

  if (contractAgreementIds.length === 0) return [];


  try {
    const raw = await publicClient.readContract({
      address: escrowContractAddress,
      abi: ESCROW_ABI.abi,
      functionName: "getCreatorsBatch",
      args: [contractAgreementIds],
    });

    if (Array.isArray(raw)) {
      return raw.map((creator) => creator !== ZERO_ADDRESS);
    }

    return contractAgreementIds.map(() => false);
  } catch (err) {
    console.error(
      `getAgreementExistOnchain failed (chain=${chainId}, ids=${contractAgreementIds}):`,
      err
    );
    // Return false for all on error
    return contractAgreementIds.map(() => false);
  }
};

export const getEscrowConfigs = async (
  escrowAddress: `0x${string}`,
  chainId: number,
  // escrowContractAddr: `0x${string}`,
): Promise<Escrow_Configs> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  // const contractAddr = escrowContractAddr[chainId] as `0x${string}`;
  const contractAddr = escrowAddress;

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    return ESCROW_CONFIG_FALLBACKS;
  }

  try {
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ESCROW_ABI as AbiLike;
    const abi =
      ("abi" in (maybe as object)
        ? (maybe as { abi?: Abi }).abi
        : (maybe as Abi)) ?? (ESCROW_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getEscrowConfigs",
      args: [],
    });

    return (raw as Escrow_Configs) || ESCROW_CONFIG_FALLBACKS;
  } catch (err) {
    console.error(`getEscrowConfigs failed (chain=${chainId}):`, err);
    return ESCROW_CONFIG_FALLBACKS;
  }
};

export const getVoteConfigs = async (
  chainId: number,
): Promise<VOTING_CONFIG> => {
  const publicClient: PublicClient = getClientForChain(chainId);
  const contractAddr = VOTING_CA[chainId] as `0x${string}`;

  if (!publicClient) {
    throw new Error(`No public client configured for chain ${chainId}`);
  }

  if (!contractAddr || isZeroAddress(contractAddr)) {
    console.warn(`getVoteConfigs: No contract address for chain ${chainId}`);
    return VOTING_CONFIG_FALLBACK;
  }

  try {
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = VOTING_ABI as AbiLike;
    const abi =
      ("abi" in (maybe as object)
        ? (maybe as { abi?: Abi }).abi
        : (maybe as Abi)) ?? (VOTING_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getVotingConfig",
      args: [],
    });

    return (raw as VOTING_CONFIG) || VOTING_CONFIG_FALLBACK;
  } catch (err) {
    console.error(`getVoteConfigs failed (chain=${chainId}):`, err);
    return VOTING_CONFIG_FALLBACK;
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
    const abi =
      ("abi" in (maybe as object)
        ? (maybe as { abi?: Abi }).abi
        : (maybe as Abi)) ?? (ERC20_ABI as unknown as Abi);

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
    return "ETH";
  }

  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ERC20_ABI as AbiLike;
    const abi =
      ("abi" in (maybe as object)
        ? (maybe as { abi?: Abi }).abi
        : (maybe as Abi)) ?? (ERC20_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "symbol",
      args: [],
    });

    return raw as string;
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

  if (
    !contractAddr ||
    isZeroAddress(contractAddr) ||
    !agreementId ||
    agreementId === 0n
  ) {
    return 0n;
  }

  try {
    // avoid 'any' by coercing ESCROW_ABI into viem's Abi type
    type AbiLike = { abi?: Abi } | Abi;
    const maybe = ESCROW_ABI as AbiLike;
    const abi =
      ("abi" in (maybe as object)
        ? (maybe as { abi?: Abi }).abi
        : (maybe as Abi)) ?? (ESCROW_ABI as unknown as Abi);

    const raw = await publicClient.readContract({
      address: contractAddr,
      abi,
      functionName: "getMilestoneCount",
      args: [agreementId],
    });

    return raw as bigint;
  } catch (err) {
    console.error(` (chain=${chainId}, id=${agreementId}):`, err);
    // choose whether to rethrow or return fallback; here we rethrow for visibility
    throw err;
  }
};
