import { useEffect, useState } from "react";
import { Gavel, Clock, AlertTriangle, Hourglass } from "lucide-react";

interface Props {
  votePendingAt: string | null | undefined;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const getTimeLeft = (targetDate: string): TimeLeft => {
  const total = new Date(targetDate).getTime() - Date.now();
  if (total <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };

  const hours = Math.floor(total / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, total };
};

const pad = (n: number) => String(n).padStart(2, "0");

export const JudgeCountdownBanner = ({ votePendingAt }: Props) => {
  const deadline = (() => {
    if (!votePendingAt) return null;
    const d = new Date(votePendingAt);
    d.setHours(d.getHours() + 48);
    return d.toISOString();
  })();

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!deadline) return;

    setTimeLeft(getTimeLeft(deadline));

    const interval = setInterval(() => {
      const t = getTimeLeft(deadline);
      setTimeLeft(t);
      if (t.total <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  // votePendingAt not set = dispute not activated yet = render nothing
  if (!deadline || !timeLeft) return null;

  const isExpired = timeLeft.total <= 0;
  const isUrgent = !isExpired && timeLeft.total < 1000 * 60 * 60; // under 1 hour
  const isVeryUrgent = !isExpired && timeLeft.total < 1000 * 60 * 10; // under 10 minutes
  const totalDuration = 48 * 60 * 60 * 1000; // 48 hours in ms
  const elapsedPercent = Math.min(
    100,
    ((totalDuration - timeLeft.total) / totalDuration) * 100,
  );

  // Color mapping similar to BentoCard
  const colorScheme = isExpired
    ? {
        border: "border-emerald-400/30",
        text: "text-emerald-200",
        gradient: "from-emerald-500/20",
        muted: "text-emerald-400/80",
        bg: "bg-emerald-500/20",
        progress: "bg-gradient-to-r from-emerald-600 to-emerald-400",
      }
    : isVeryUrgent
      ? {
          border: "border-rose-400/30",
          text: "text-rose-200",
          gradient: "from-rose-500/20",
          muted: "text-rose-400/80",
          bg: "bg-rose-500/20",
          progress: "bg-gradient-to-r from-rose-600 to-rose-400",
        }
      : isUrgent
        ? {
            border: "border-orange-400/30",
            text: "text-orange-200",
            gradient: "from-orange-500/20",
            muted: "text-orange-400/80",
            bg: "bg-orange-500/20",
            progress: "bg-gradient-to-r from-orange-600 to-amber-400",
          }
        : {
            border: "border-cyan-400/30",
            text: "text-cyan-200",
            gradient: "from-cyan-500/20",
            muted: "text-cyan-400/80",
            bg: "bg-cyan-500/20",
            progress: "bg-gradient-to-r from-cyan-600 to-cyan-400",
          };

  return (
    <div
      className={`max-w-xl rounded-2xl border p-4 sm:p-5 md:p-6 ${colorScheme.border} ${colorScheme.gradient} bg-gradient-to-br to-transparent shadow-lg`}
    >
      {/* Icon + heading with badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold text-white/90">
          <Gavel className="h-5 w-5" />
          <span>Notice for Judges</span>
        </div>

        {/* Status badge */}
        {isVeryUrgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-200">
            <AlertTriangle className="h-3 w-3" />
            Urgent
          </span>
        )}
        {isUrgent && !isVeryUrgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-semibold text-orange-200">
            <Hourglass className="h-3 w-3" />
            Soon
          </span>
        )}
        {isExpired && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">
            Ready
          </span>
        )}
      </div>

      {/* Message */}
      <p className="mb-5 text-sm leading-relaxed text-gray-300">
        Judges may cross-examine all parties involved — including witnesses —
        using the <span className="font-bold text-white/90">chat feature</span>{" "}
        below. Please review all evidence and statements carefully before voting
        commences.
      </p>

      {/* Countdown or expired state */}
      {isExpired ? (
        <div
          className={`flex items-center gap-3 rounded-xl ${colorScheme.bg} border p-3 ${colorScheme.border}`}
        >
          <Clock className="h-5 w-5 flex-shrink-0" />
          <span className={`text-sm font-medium ${colorScheme.text}`}>
            The review period has ended. Voting can now be escalated.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock
              className={`h-4 w-4 flex-shrink-0 ${isVeryUrgent ? "animate-pulse" : ""}`}
            />
            <span
              className={`text-xs font-semibold tracking-wider uppercase ${colorScheme.muted}`}
            >
              Voting opens in
            </span>
          </div>

          {/* Large digit blocks */}
          <div
            className={`flex items-stretch gap-2 ${isVeryUrgent ? "animate-pulse" : ""}`}
          >
            <div
              className={`flex-1 rounded-xl border ${colorScheme.border} ${colorScheme.bg} p-3 text-center`}
            >
              <span
                className={`block font-mono text-3xl font-bold tabular-nums ${colorScheme.text}`}
              >
                {pad(timeLeft.hours)}
              </span>
              <span className="mt-1 block text-xs font-medium tracking-wider text-gray-400 uppercase">
                Hours
              </span>
            </div>

            <div className="flex items-center">
              <span className={`text-2xl font-bold ${colorScheme.muted}`}>
                :
              </span>
            </div>

            <div
              className={`flex-1 rounded-xl border ${colorScheme.border} ${colorScheme.bg} p-3 text-center`}
            >
              <span
                className={`block font-mono text-3xl font-bold tabular-nums ${colorScheme.text}`}
              >
                {pad(timeLeft.minutes)}
              </span>
              <span className="mt-1 block text-xs font-medium tracking-wider text-gray-400 uppercase">
                Minutes
              </span>
            </div>

            <div className="flex items-center">
              <span className={`text-2xl font-bold ${colorScheme.muted}`}>
                :
              </span>
            </div>

            <div
              className={`flex-1 rounded-xl border ${colorScheme.border} ${colorScheme.bg} p-3 text-center`}
            >
              <span
                className={`block font-mono text-3xl font-bold tabular-nums ${colorScheme.text}`}
              >
                {pad(timeLeft.seconds)}
              </span>
              <span className="mt-1 block text-xs font-medium tracking-wider text-gray-400 uppercase">
                Seconds
              </span>
            </div>
          </div>

          {/* Progress bar with clear labels */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Vote pending</span>
              <span className="font-medium text-gray-400">
                {Math.round(elapsedPercent)}% elapsed
              </span>
              <span>Voting opens →</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${colorScheme.progress}`}
                style={{
                  width: `${elapsedPercent}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
