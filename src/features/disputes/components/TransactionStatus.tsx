import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface Props {
  status: "idle" | "pending" | "success" | "error";
  onRetry?: () => void;
}

const CONFIGS = {
  pending: {
    Icon: Loader2,
    text: "Processing transaction...",
    className: "text-yellow-400",
    iconClassName: "animate-spin",
  },
  success: {
    Icon: CheckCircle2,
    text: "Transaction confirmed!",
    className: "text-green-400",
    iconClassName: "",
  },
  error: {
    Icon: AlertCircle,
    text: "Transaction failed",
    className: "text-red-400",
    iconClassName: "",
  },
} as const;

export const TransactionStatus = ({ status, onRetry }: Props) => {
  if (status === "idle") return null;

  const { Icon, text, className, iconClassName } = CONFIGS[status];

  return (
    <div
      className={`rounded-lg border p-3 ${className} border-current/20 bg-current/5`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClassName}`} />
        <span className="text-sm font-medium">{text}</span>
        {status === "error" && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-auto border-current text-current hover:bg-current/10"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};
