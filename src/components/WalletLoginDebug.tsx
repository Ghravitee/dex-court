// Temporary Debug Component
import { useAuth } from "../hooks/useAuth";
import { useAccount } from "wagmi";

export function WalletLoginDebug() {
  const { user, isAuthenticated } = useAuth();
  const { address, isConnected } = useAccount();

  return (
    <div className="fixed top-20 right-4 z-50 rounded-lg bg-black/80 p-4 text-xs">
      <div>Connected: {isConnected ? "✅" : "❌"}</div>
      <div>Address: {address ? `${address.slice(0, 8)}...` : "None"}</div>
      <div>Authenticated: {isAuthenticated ? "✅" : "❌"}</div>
      <div>User ID: {user?.id || "None"}</div>
      <div>Username: {user?.username || "None"}</div>
      <div>
        Wallet:{" "}
        {user?.walletAddress ? `${user.walletAddress.slice(0, 8)}...` : "None"}
      </div>
    </div>
  );
}
