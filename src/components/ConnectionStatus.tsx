// components/ConnectionStatus.tsx
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function ConnectionStatus() {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isConnecting) {
      setMessage("Connecting wallet...");
      setShow(true);
    } else if (isReconnecting) {
      setMessage("Reconnecting wallet...");
      setShow(true);
    } else if (isConnected) {
      setMessage("Wallet connected!");
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setMessage("Wallet disconnected");
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isConnecting, isReconnecting]);

  if (!show) return null;

  return (
    <div className="fixed top-10 right-4 z-50">
      <div
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 shadow-lg ${
          isConnecting || isReconnecting
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : isConnected
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
        }`}
      >
        {isConnecting || isReconnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isConnected ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
