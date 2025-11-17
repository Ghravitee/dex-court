import { useState, useEffect } from "react";

export function useCountdown(targetTimestamp: bigint) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!targetTimestamp || targetTimestamp === 0n) {
      setTimeLeft("N/A");
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const target = Number(targetTimestamp);
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Ready to claim");
        return;
      }

      const days = Math.floor(difference / (60 * 60 * 24));
      const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((difference % (60 * 60)) / 60);
      const seconds = Math.floor(difference % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return timeLeft;
}

// Format amount for display
export const formatAmount = (amount: bigint, decimals?: number) => {
  const actualDecimals = decimals || 18;
  // avoid Number(...) on huge BigInts — convert via string math
  try {
    const asStr = amount.toString();
    if (actualDecimals === 0) return asStr;
    const padded = asStr.padStart(actualDecimals + 1, "0");
    const intPart = padded.slice(0, -actualDecimals);
    const fracPart = padded.slice(-actualDecimals).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart.slice(0, 6)}` : `${intPart}`;
  } catch {
    return "0";
  }
};
