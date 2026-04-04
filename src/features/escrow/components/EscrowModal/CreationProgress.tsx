import {
  Loader2,
  Server,
  Clock,
  ShieldCheck,
  Link2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { CreationStep } from "../../types";

interface CreationProgressProps {
  creationStep: CreationStep;
  currentStepMessage: string;
  txHash?: string;
  onRetry: () => void;
}

const STEPS = [
  {
    id: "creating_backend",
    label: "Backend Setup",
    description: "Creating agreement in database",
    icon: Server,
  },
  {
    id: "awaiting_approval",
    label: "Awaiting Approval",
    description: "Waiting for token approval",
    icon: Clock,
  },
  {
    id: "approving",
    label: "Token Approval",
    description: "Approving token spending",
    icon: ShieldCheck,
  },
  {
    id: "creating_onchain",
    label: "On-Chain Creation",
    description: "Deploying smart contract",
    icon: Link2,
  },
  {
    id: "waiting_confirmation",
    label: "Confirmation",
    description: "Waiting for blockchain",
    icon: Loader2,
  },
  {
    id: "success",
    label: "Success",
    description: "Escrow created successfully",
    icon: Sparkles,
  },
];

export function CreationProgress({
  creationStep,
  currentStepMessage,
  txHash,
  onRetry,
}: CreationProgressProps) {
  if (creationStep === "idle") return null;

  const currentIdx = STEPS.findIndex((s) => s.id === creationStep);
  const isError = creationStep === "error";
  const isSuccess = creationStep === "success";

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-900/30 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full ${
              isError
                ? "bg-red-500/10"
                : isSuccess
                  ? "bg-emerald-500/10"
                  : "bg-cyan-500/10"
            }`}
          >
            {isError ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : isSuccess ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isError
                ? "Creation Failed"
                : isSuccess
                  ? "Escrow Created!"
                  : "Creating Escrow"}
            </h3>
            <p className="text-xs text-gray-400">
              {isError
                ? "An error occurred"
                : isSuccess
                  ? "Live on the blockchain"
                  : "Setting up your escrow…"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-2 py-1 text-xs font-medium text-cyan-300">
          {Math.min(currentIdx + 1, STEPS.length - 1)}/{STEPS.length - 1}
        </span>
      </div>

      {/* Step indicators — 5-column compact grid */}
      <div className="mb-3 grid grid-cols-5 gap-1.5">
        {STEPS.slice(0, -1).map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentIdx;
          const isCurrent = index === currentIdx;

          return (
            <div
              key={step.id}
              title={step.label}
              className={`relative flex flex-col items-center rounded-lg border px-1 py-2 transition-all duration-300 ${
                isCompleted
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : isCurrent
                    ? "border-cyan-500/50 bg-cyan-500/10 shadow-md shadow-cyan-500/20"
                    : "border-white/10 bg-white/5"
              }`}
            >
              {/* Step number badge */}
              <span
                className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-cyan-500 text-white"
                      : "bg-white/10 text-gray-400"
                }`}
              >
                {index + 1}
              </span>

              {/* Icon circle */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  isCompleted
                    ? "border-emerald-500/50 bg-emerald-500/20"
                    : isCurrent
                      ? "border-cyan-500/50 bg-cyan-500/20"
                      : "border-white/20 bg-white/5"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <StepIcon
                    className={`h-3.5 w-3.5 ${isCurrent ? "text-cyan-400" : "text-gray-500"}`}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-1 text-center text-[10px] leading-tight font-medium ${
                  isCompleted
                    ? "text-emerald-300"
                    : isCurrent
                      ? "text-cyan-300"
                      : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current status bar */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              isError
                ? "bg-red-500/10"
                : isSuccess
                  ? "bg-emerald-500/10"
                  : "bg-cyan-500/10"
            }`}
          >
            {isError ? (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            ) : isSuccess ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white">
                {isError
                  ? "Error occurred"
                  : isSuccess
                    ? "Success!"
                    : "Current Status"}
              </span>
              {isSuccess && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  Complete
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs leading-snug text-gray-400">
              {currentStepMessage}
            </p>

            {/* Contextual hints */}
            {creationStep === "creating_onchain" && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1.5">
                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
                <span className="text-[10px] text-amber-300">
                  Check your wallet and confirm the transaction.
                </span>
              </div>
            )}
            {creationStep === "waiting_confirmation" && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-1.5">
                <Clock className="mt-0.5 h-3 w-3 flex-shrink-0 text-indigo-400" />
                <span className="text-[10px] text-indigo-300">
                  Usually takes 15–30 seconds.
                </span>
              </div>
            )}
            {isSuccess && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5">
                <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
                <span className="text-[10px] text-emerald-300">
                  Page will refresh automatically.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tx hash — compact single row */}
        {txHash && !isSuccess && !isError && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link2 className="h-3 w-3 flex-shrink-0 text-cyan-400" />
              <span className="truncate font-mono text-[10px] text-gray-400">
                {txHash.slice(0, 18)}…{txHash.slice(-10)}
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(txHash);
                  toast.success("Copied!");
                }}
                className="flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300 hover:bg-cyan-500/20"
              >
                <Copy className="h-2.5 w-2.5" /> Copy
              </button>
              <button
                onClick={() =>
                  window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
                }
                className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-300 hover:bg-white/10"
              >
                <ExternalLink className="h-2.5 w-2.5" /> View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
          <div>
            <p className="text-xs text-red-200/80">
              Check your connection and try again. If the problem persists,
              contact support.
            </p>
            <button
              onClick={onRetry}
              className="mt-1.5 rounded border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
