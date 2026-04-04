// src/config/useNetworkEnvironment.ts
import { ALL_CHAINS } from "./config";
import { useMemo } from "react";

const DEFAULT_MAINNET_CHAIN_ID = 1;
const DEFAULT_TESTNET_CHAIN_ID = 11155111;

export const useNetworkEnvironment = () => {
  const viteEnv = import.meta.env.VITE_ENVIRONMENT;

  // Determine effective chain ID based on environment
  const effectiveChainId = useMemo(() => {
    if (viteEnv === "Prod") {
      return DEFAULT_MAINNET_CHAIN_ID;
    }
    if (viteEnv === "Dev" || viteEnv === "Test") {
      return DEFAULT_TESTNET_CHAIN_ID;
    }
    // fallback
    return DEFAULT_TESTNET_CHAIN_ID;
  }, [viteEnv]);

  return useMemo(() => {
    const chain =
      ALL_CHAINS.find((c) => c.id === effectiveChainId) || ALL_CHAINS[0];
    const isTestnet = chain.testnet;

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
