// components/TransactionStatus.tsx
import { Loader2, CheckCircle2, AlertCircle, Wallet } from "lucide-react";
import { Button } from "./ui/button";

export type TransactionStep = "idle" | "pending" | "success" | "error";

interface TransactionStatusProps {
  status: TransactionStep;
  onRetry?: () => void;
  title?: string;
  description?: string;
  showRetryButton?: boolean;
  className?: string;
}

export const TransactionStatus = ({
  status,
  onRetry,
  title,
  description,
  showRetryButton = true,
  className = "",
}: TransactionStatusProps) => {
  if (status === "idle") return null;

  const configs = {
    pending: {
      icon: Loader2,
      defaultTitle: "Processing Transaction...",
      defaultDescription: "Confirm the transaction in your wallet to continue.",
      className: "text-blue-400 border-blue-400/20 bg-blue-500/10",
      iconClassName: "animate-spin",
      showSpinner: true,
    },
    success: {
      icon: CheckCircle2,
      defaultTitle: "Transaction Confirmed!",
      defaultDescription: "Your transaction was successful.",
      className: "text-green-400 border-green-400/20 bg-green-500/10",
      iconClassName: "",
      showSpinner: false,
    },
    error: {
      icon: AlertCircle,
      defaultTitle: "Transaction Failed",
      defaultDescription: "The transaction could not be completed.",
      className: "text-red-400 border-red-400/20 bg-red-500/10",
      iconClassName: "",
      showSpinner: false,
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.className} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {config.showSpinner ? (
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-current/30 border-t-current"></div>
              <Wallet className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <Icon className={`h-8 w-8 ${config.iconClassName}`} />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold">{title || config.defaultTitle}</h4>
          <p className="mt-1 text-sm opacity-90">
            {description || config.defaultDescription}
          </p>

          {/* Retry button for error state */}
          {status === "error" && showRetryButton && onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-current text-current hover:bg-current/10"
              >
                Retry Transaction
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
