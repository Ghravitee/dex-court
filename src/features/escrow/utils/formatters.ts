import { SUPPORTED_CHAINS } from "../../../web3/config";
import type { UploadedFile } from "../types";

/** Extract a tx hash embedded in an agreement description string */
export const extractTxHashFromDescription = (
  description: string,
): string | undefined => {
  const match = description?.match(/Transaction Hash: (0x[a-fA-F0-9]{64})/);
  return match?.[1];
};

/** Human-readable display of a wallet address or Telegram handle */
export const formatWalletAddress = (address: string): string => {
  if (!address || address === "@unknown") return "@unknown";

  if (address.startsWith("@")) return address;

  if (address.length <= 15 && !address.startsWith("0x")) return `@${address}`;

  if (address.startsWith("0x") && address.length === 42) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return address;
};

/** Normalise a contract address for safe equality comparisons */
export const normalizeContractAddress = (
  address: string | null | undefined,
): string | null => {
  if (!address) return null;
  return address.toLowerCase().trim();
};

/** Sum of file sizes formatted as "X.XX MB" */
export const getTotalFileSize = (files: UploadedFile[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
  return `${(totalBytes / 1024 / 1024).toFixed(2)} MB`;
};

export const resolveTokenDisplay = (token: string, chainId?: number | null): string => {
  if (token !== "ETH" || !chainId) return token;
  // Find by mainnetId or testnetId
  const chain = SUPPORTED_CHAINS.find(
    (c) => c.mainnetId === chainId || c.testnetId === chainId,
  );
  return chain?.symbol ?? token;
};
