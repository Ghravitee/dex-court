import { AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";

export const LoadingScreen = () => (
  <div className="relative flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="relative mx-auto mb-8">
        <div className="mx-auto size-32 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400" />
        <div className="absolute inset-0 mx-auto size-32 animate-ping rounded-full border-2 border-cyan-400/40" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-cyan-300">
          Loading Agreement
        </h3>
        <p className="text-sm text-cyan-200/70">
          Preparing your agreement details...
        </p>
      </div>
      <div className="mt-4 flex justify-center space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

interface NotFoundProps {
  isAccessRestricted?: boolean;
}

export const NotFoundScreen = ({
  isAccessRestricted = false,
}: NotFoundProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            {isAccessRestricted ? "Access Restricted" : "Agreement Not Found"}
          </h2>
          <div className="mb-6 max-w-md text-cyan-200/80">
            {isAccessRestricted ? (
              <p>
                You don't have permission to view this agreement. Only
                participants and the creator can view private agreements.
              </p>
            ) : (
              <p>
                The agreement you're looking for doesn't exist or may have been
                removed. Please check the agreement ID and try again.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!isAccessRestricted && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Refresh & Retry
            </Button>
          )}
          <Button
            onClick={() => navigate("/agreements")}
            className="border-white/15 bg-cyan-600/20 text-cyan-200 hover:bg-cyan-500/30"
          >
            Back to Agreements
          </Button>
        </div>

        {!isAccessRestricted && (
          <div className="mt-8 flex w-fit justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="text-sm text-cyan-300">
              <p className="mb-1 font-medium">Troubleshooting tips:</p>
              <ul className="space-y-1">
                <li>• Check if the agreement ID is correct</li>
                <li>• Verify your internet connection</li>
                <li>• The agreement may have been deleted</li>
                <li>• Try refreshing the page</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
