import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";

export const NotFoundScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen justify-center">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Dispute Not Found
          </h2>
          <div className="mb-6 max-w-md text-cyan-200/80">
            <p>
              The dispute you're looking for doesn't exist or may have been
              removed. Please check the dispute ID and try again.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Refresh & Retry
          </Button>
          <Button
            onClick={() => navigate("/disputes")}
            className="border-white/15 bg-cyan-600/20 text-cyan-200 hover:bg-cyan-500/30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Disputes
          </Button>
        </div>

        <div className="mt-8 flex w-fit justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="text-sm text-cyan-300">
            <p className="mb-1 font-medium">Troubleshooting tips:</p>
            <ul className="space-y-1">
              <li>• Check if the dispute ID is correct</li>
              <li>• Verify your internet connection</li>
              <li>• The dispute may have been deleted</li>
              <li>• Try refreshing the page</li>
              <li>• Check if you have permission to view this dispute</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
