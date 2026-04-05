import { useMemo } from "react";
import { SUPPORTED_CHAINS } from "../web3/config";

const IS_PROD = import.meta.env.VITE_ENVIRONMENT === "Prod";

export const useChainSelection = () => {
  // Given a user's UI selection (by mainnetId), resolve the actual chain ID
  // to use based on the current environment
  const resolveChainId = useMemo(() => {
    return (selectedMainnetId: number): number => {
      const chain = SUPPORTED_CHAINS.find(
        (c) => c.mainnetId === selectedMainnetId,
      );
      if (!chain) return selectedMainnetId;
      return IS_PROD ? chain.mainnetId : chain.testnetId;
    };
  }, []);

  // The list of chains to show in UI — always keyed by mainnetId for consistency
  const displayChains = useMemo(() => {
    return SUPPORTED_CHAINS.map((chain) => ({
      ...chain,
      resolvedChainId: IS_PROD ? chain.mainnetId : chain.testnetId,
      label: IS_PROD ? chain.name : `${chain.name} (Testnet)`,
      isProd: IS_PROD, // 👈 add this
    }));
  }, []);

  return { resolveChainId, displayChains, isProd: IS_PROD };
};
