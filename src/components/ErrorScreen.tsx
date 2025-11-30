import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

interface ErrorScreenProps {
  onRetry?: () => void;
  errorMessage?: string;
}

export function ErrorScreen({ onRetry, errorMessage }: ErrorScreenProps) {
  return (
    <div className="relative min-h-screen p-8">
      <div className="absolute inset-0 -z-10 bg-rose-500/10 blur-3xl"></div>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="glass rounded-2xl border border-white/10 bg-gradient-to-br from-rose-500/10 to-transparent p-8">
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
          <h2 className="mb-2 text-2xl font-semibold text-white/90">
            Something Went Wrong
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            {errorMessage ||
              "We encountered an error while loading the escrow details."}
          </p>
          <p className="mb-6 text-sm text-rose-300/70">
            Please check your connection and try again.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="border-rose-400/30 text-rose-200 hover:bg-rose-500/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            <Link to="/escrow">
              <Button variant="neon" className="neon-hover">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Escrows
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
