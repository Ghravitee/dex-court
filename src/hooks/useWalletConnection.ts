// hooks/useWalletConnection.ts - NEW FILE
import { useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { toast } from "sonner";

export function useWalletConnection() {
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // ✅ PURE WALLET CONNECTION - NO AUTH LOGIC
  const handleConnect = useCallback(() => {
    if (!isConnected && connectors[0]) {
      connect({ connector: connectors[0] });
      toast.info("Wallet connected");
    }
  }, [isConnected, connectors, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    toast.info("Wallet disconnected");
    // ✅ IMPORTANT: This does NOT clear auth session
  }, [disconnect]);

  return {
    isConnected,
    address,
    connector,
    handleConnect,
    handleDisconnect,
    displayAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null,
  };
}
