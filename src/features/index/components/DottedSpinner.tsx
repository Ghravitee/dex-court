interface DottedSpinnerProps {
  size?: "small" | "medium" | "large";
}

export const DottedSpinner = ({ size = "medium" }: DottedSpinnerProps) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8",
    large: "h-10 w-10",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 rounded-full border-4 border-dotted border-cyan-400/30"></div>
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-dotted border-cyan-400 border-t-transparent"></div>
    </div>
  );
};
