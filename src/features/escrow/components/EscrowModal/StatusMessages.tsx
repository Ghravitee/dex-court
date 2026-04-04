import { Loader2 } from "lucide-react";

interface StatusMessagesProps {
  uiError: string | null;
  uiSuccess: string | null;
  isTxPending: boolean;
  isApprovalPending: boolean;
}

export function StatusMessages({
  uiError,
  uiSuccess,
  isTxPending,
  isApprovalPending,
}: StatusMessagesProps) {
  const hasContent = uiError || uiSuccess || isTxPending || isApprovalPending;
  if (!hasContent) return null;

  return (
    <div className="space-y-2">
      {uiError && (
        <div className="w-fit rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {uiError}
        </div>
      )}
      {uiSuccess && (
        <div className="w-fit rounded-md border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {uiSuccess}
        </div>
      )}
      {(isTxPending || isApprovalPending) && (
        <div className="w-fit rounded-md border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Transaction pending...
        </div>
      )}
    </div>
  );
}
