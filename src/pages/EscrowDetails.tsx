import { useParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

// Sample data source (replace with real API or context)
import { escrowsData } from "../lib/mockEscrowApi"; // optional external source

export default function EscrowDetails() {
  const { id } = useParams<{ id: string }>();
  const escrow = escrowsData.find((e) => e.id === id);

  if (!escrow) {
    return (
      <div className="p-8 text-center text-white/70">
        <p>Escrow not found.</p>
        <Link to="/escrow">
          <Button variant="outline" className="mt-4">
            Back to Escrows
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative p-8">
      <div className="absolute inset-0 -z-10 bg-cyan-500/10 blur-3xl"></div>

      <Link to="/escrow">
        <Button
          variant="ghost"
          className="mb-6 text-cyan-300 hover:text-cyan-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/90">
        <h2 className="mb-2 text-2xl font-semibold">{escrow.title}</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          {escrow.description}
        </p>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-muted-foreground">Payer</div>
            <div>{escrow.from}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Payee</div>
            <div>{escrow.to}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Amount</div>
            <div>
              {escrow.amount} {escrow.token}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Deadline</div>
            <div>{escrow.deadline}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  escrow.status === "completed"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : escrow.status === "frozen"
                      ? "bg-rose-500/20 text-rose-300"
                      : escrow.status === "cancelled"
                        ? "bg-red-500/20 text-red-300"
                        : escrow.status === "active"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {escrow.status}
              </span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Visibility</div>
            <div className="capitalize">{escrow.type}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
