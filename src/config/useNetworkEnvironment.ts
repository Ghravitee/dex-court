// Updated useNetworkEnvironment hook

// import { useAccount, useChainId } from "wagmi";
import { ALL_CHAINS } from "./config";
import { useMemo } from "react";

// Precompute default chain IDs
const DEFAULT_MAINNET_CHAIN_ID = 1;
const DEFAULT_TESTNET_CHAIN_ID = 11155111;

export const useNetworkEnvironment = () => {
  // const { isConnected } = useAccount();
  // const wagmiChainId = useChainId();
  const isClient = typeof window !== "undefined";

  // Determine effective chain ID
  const effectiveChainId = useMemo(() => {
    // if (isConnected) return wagmiChainId;

    if (!isClient) return DEFAULT_TESTNET_CHAIN_ID;

    const hostname = window.location.hostname;
    if (hostname === "app.dexcourt.com") {
      return DEFAULT_MAINNET_CHAIN_ID;
    }

    if (hostname === "dexcourt.com") {
      return DEFAULT_MAINNET_CHAIN_ID;
    }

    // if (hostname === "http://localhost:5173/") {
    //   return DEFAULT_MAINNET_CHAIN_ID;
    // }

    // Default to testnet for dev/localhost
    return DEFAULT_TESTNET_CHAIN_ID;
    // }, [isConnected, wagmiChainId, isClient]);
  }, [isClient]);

  return useMemo(() => {
    const chain =
      ALL_CHAINS.find((c) => c.id === effectiveChainId) || ALL_CHAINS[0];
    const isTestnet = chain.testnet;

    // Ensure URLs end with a trailing slash
    const testnetUrl = import.meta.env.VITE_DEV_API_URL;

    const mainnetUrl = import.meta.env.VITE_PROD_API_URL;

    const testnetCA = "";
    const mainnetCA = "";

    return {
      chainId: effectiveChainId,
      chainName: chain.name,
      environmentMatch: true,
      currentChain: chain,
      apiBaseUrl: isTestnet ? testnetUrl : mainnetUrl,
      explorerUrl: chain.blockExplorers?.default?.url || "",
      safuContract: isTestnet ? testnetCA : mainnetCA,
    };
  }, [effectiveChainId]);
};
