import { XCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

interface NotFoundScreenProps {
  isAccessRestricted?: boolean;
}

export function NotFoundScreen({
  isAccessRestricted = false,
}: NotFoundScreenProps) {
  return (
    <div className="relative min-h-screen p-8">
      <div className="absolute inset-0 -z-10 bg-cyan-500/10 blur-3xl"></div>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="glass rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent p-8">
          {isAccessRestricted ? (
            <>
              <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-amber-400" />
              <h2 className="mb-2 text-2xl font-semibold text-white/90">
                Access Restricted
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                You don't have permission to view this escrow. Only the parties
                involved can access it.
              </p>
            </>
          ) : (
            <>
              <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
              <h2 className="mb-2 text-2xl font-semibold text-white/90">
                Escrow Not Found
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                The escrow you're looking for doesn't exist or may have been
                removed.
              </p>
            </>
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
  );
}
