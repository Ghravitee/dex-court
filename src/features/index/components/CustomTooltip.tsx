/* eslint-disable @typescript-eslint/no-explicit-any */
export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-cyan-500/50 bg-gray-900 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-1 font-bold text-cyan-300">{label}</p>
        {payload.map((entry: any, idx: number) => {
          const isEth = typeof entry.value === "number" && !Number.isInteger(entry.value);
          const formatted = isEth
            ? `${entry.value.toFixed(6)} ETH`
            : entry.value;
          return (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="ml-1 font-bold">{formatted}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};