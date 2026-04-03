// ─── Loader ───────────────────────────────────────────────────────────────────

interface PulseLoaderProps {
  size?: "small" | "medium" | "large";
}

export const PulseLoader = ({ size = "medium" }: PulseLoaderProps) => {
  const dotSize = {
    small: "h-1.5 w-1.5",
    medium: "h-2 w-2",
    large: "h-2.5 w-2.5",
  };
  const gap = { small: "gap-1.5", medium: "gap-2", large: "gap-2.5" };

  return (
    <div className={`flex items-center ${gap[size]}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${dotSize[size]} animate-pulse rounded-full bg-cyan-400`}
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
};
