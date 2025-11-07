// Update your VoteOption component to accept disabled prop
export const VoteOption = ({
  label,
  active,
  onClick,
  icon,
  disabled = false,
}: {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-4 text-center text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform hover:bg-cyan-500/20 active:scale-[0.98] ${
        active
          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
          : "border-white/10 bg-white/5 hover:border-cyan-400/30"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
};
