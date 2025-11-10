import {} from "viem";
import { getTransactionCount as viemGetTransactionCount } from "viem/actions";
import { getClientForChain } from "../config/publicConfig";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isZeroAddress(address: `0x${string}`) {
  return address === ZERO_ADDRESS;
}

export const getTransactionCount = async (
  chainId: number,
  address: `0x${string}`,
) => {
  const publicClient = getClientForChain(chainId);

  return isZeroAddress(address)
    ? 0n
    : await viemGetTransactionCount(publicClient, {
        address,
      });
};
