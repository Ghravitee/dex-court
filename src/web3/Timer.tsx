import { useEffect, useState } from "react";

// CountdownTimer unchanged except styling bits kept
export function CountdownTimer({
    targetTimestamp,
    onComplete,
}: {
    targetTimestamp: bigint;
    onComplete?: () => void;
}) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const target = Number(targetTimestamp);
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft("Expired");
                onComplete?.();
                return;
            }

            const days = Math.floor(difference / (60 * 60 * 24));
            const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((difference % (60 * 60)) / 60);
            const seconds = difference % 60;

            if (days > 0) {
                setTimeLeft(
                    `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
                        .toString()
                        .padStart(2, "0")}m`,
                );
            } else if (hours > 0) {
                setTimeLeft(
                    `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds
                        .toString()
                        .padStart(2, "0")}s`,
                );
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetTimestamp, onComplete]);

    return (
        <span className={`font-mono ${timeLeft === "Expired" ? "text-green-400" : "text-yellow-400"}`}>
            {timeLeft}
        </span>
    );
}
