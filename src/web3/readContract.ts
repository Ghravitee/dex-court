import type { PublicClient, Abi } from "viem";
import { getTransactionCount as viemGetTransactionCount } from "viem/actions";
import { getClientForChain } from "../config/publicConfig";
import { ESCROW_ABI, ESCROW_CA } from "./config";
import { AGREEMENT_FALLBACK, type Agreement } from "./interfaces";
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
