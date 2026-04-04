/* eslint-disable @typescript-eslint/no-explicit-any */
import { FiAlertCircle } from "react-icons/fi";
import { Button } from "../../../components/ui/button";
import { Loader2 } from "lucide-react";

interface ErrorStateProps {
  error: string;
  handle?: string;
  onRetry: () => void;
  onGoToMyProfile: () => void;
  currentUser?: any;
  onNavigateToProfile?: (path: string) => void;
}

export const ErrorState = ({
  error,
  handle,
  onRetry,
  onGoToMyProfile,
  //   currentUser,
  //   onNavigateToProfile,
}: ErrorStateProps) => {
  return (
    <div className="flex min-h-screen justify-center">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
            <FiAlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            {error?.includes("not found")
              ? "User Profile Not Found"
              : "Unable to Load Profile"}
          </h2>
          <div className="mb-6 max-w-md text-cyan-200/80">
            {error?.includes("not found") ? (
              <p>
                The user profile for "{handle}" doesn't exist or may have been
                removed. Please check the details and try again.
              </p>
            ) : (
              <p>
                We encountered an issue loading this profile. Please try again
                or check the troubleshooting tips below.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Retry Loading Profile
          </Button>
          <Button
            onClick={onGoToMyProfile}
            className="border-white/15 bg-cyan-600/20 text-cyan-200 hover:bg-cyan-500/30"
          >
            Go to My Profile
          </Button>
        </div>
        <div className="mt-8 flex w-fit justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="text-sm text-cyan-300">
            <p className="mb-1 font-medium">Troubleshooting tips:</p>
            <ul className="space-y-1">
              <li>• Check if the username/wallet address is correct</li>
              <li>• Verify your internet connection</li>
              <li>• The profile may have been deleted or made private</li>
              <li>• Try refreshing the page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
