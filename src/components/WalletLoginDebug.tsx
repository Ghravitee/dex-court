import { useAuth } from "../hooks/useAuth";
import { useAccount } from "wagmi";

const formatUsername = (username?: string) => {
  if (!username) return "None";

  if (/^0x[a-fA-F0-9]{40}$/.test(username)) {
    return `${username.slice(0, 6)}...${username.slice(-4)}`;
  }

  return username;
};

export function WalletLoginDebug() {
  const { user, isAuthenticated } = useAuth();
  const { address, isConnected } = useAccount();

  return (
    <div className="mb-2 w-fit rounded-lg bg-black/80 p-4 text-xs">
      <div>Connected: {isConnected ? "✅" : "❌"}</div>
      <div>Address: {address ? `${address.slice(0, 8)}...` : "None"}</div>
      <div>Authenticated: {isAuthenticated ? "✅" : "❌"}</div>
      <div>User ID: {user?.id || "None"}</div>
      <div>Username: {formatUsername(user?.username)}</div>
      <div>
        Wallet:{" "}
        {user?.walletAddress
          ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
          : "None"}
      </div>
    </div>
  );
}
