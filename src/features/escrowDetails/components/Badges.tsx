export const StatusBadge = ({ value }: { value: boolean }) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${value ? "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300" : "border border-amber-400/30 bg-amber-500/20 text-amber-300"}`}
  >
    <div
      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-amber-400"}`}
    />
    {value ? "Yes" : "No"}
  </div>
);

export const SafetyBadge = ({ value }: { value: boolean }) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${value ? "border border-rose-400/30 bg-rose-500/20 text-rose-300" : "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"}`}
  >
    <div
      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-rose-400" : "bg-emerald-400"}`}
    />
    {value ? "Yes" : "No"}
  </div>
);
