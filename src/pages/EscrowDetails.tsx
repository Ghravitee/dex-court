import { useParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Users,
  User,
  DollarSign,
  Clock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// Sample data source (replace with real API or context)
import { escrowsData } from "../lib/mockEscrowApi"; // optional external source

export default function EscrowDetails() {
  const { id } = useParams<{ id: string }>();
  const escrow = escrowsData.find((e) => e.id === id);

  if (!escrow) {
    return (
      <div className="relative min-h-screen p-8">
        <div className="absolute inset-0 -z-10 bg-cyan-500/10 blur-3xl"></div>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="glass rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent p-8">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
            <h2 className="mb-2 text-2xl font-semibold text-white/90">
              Escrow Not Found
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              The escrow you're looking for doesn't exist or may have been
              removed.
            </p>
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

  // Status configuration - Map "frozen" status to "Disputed" in UI
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/30",
      label: "Pending",
      description: "Awaiting deposit and signatures",
    },
    active: {
      icon: Loader2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/30",
      label: "Active",
      description: "Funds secured, agreement active",
    },
    completed: {
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-400/30",
      label: "Completed",
      description: "Successfully completed and settled",
    },
    frozen: {
      // This handles both "frozen" and "disputed" statuses
      icon: AlertTriangle,
      color: "text-rose-400",
      bgColor: "bg-rose-500/20",
      borderColor: "border-rose-400/30",
      label: "Disputed",
      description: "Under dispute resolution",
    },
    cancelled: {
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-400/30",
      label: "Cancelled",
      description: "Agreement cancelled",
    },
    // Add disputed if your data actually has "disputed" status
    disputed: {
      icon: AlertTriangle,
      color: "text-rose-400",
      bgColor: "bg-rose-500/20",
      borderColor: "border-rose-400/30",
      label: "Disputed",
      description: "Under dispute resolution",
    },
  };

  // Safe status access - map "disputed" to "frozen" if needed
  const getStatusInfo = (status: string) => {
    // If status is "disputed", use the "frozen" config (which shows as "Disputed")
    const mappedStatus = status === "disputed" ? "frozen" : status;
    return (
      statusConfig[mappedStatus as keyof typeof statusConfig] ||
      statusConfig.pending
    );
  };

  const statusInfo = getStatusInfo(escrow.status);
  const StatusIcon = statusInfo.icon;

  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (new Date(escrow.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

  return (
    <div className="relative min-h-screen p-4 lg:p-8">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 bg-cyan-500/10 blur-3xl"></div>
      <div className="absolute top-20 right-10 size-72 rounded-full bg-cyan-500/20 blur-3xl"></div>
      <div className="absolute bottom-20 left-10 size-60 rounded-full bg-cyan-500/15 blur-3xl"></div>

      {/* Header Navigation */}
      <div className="mb-8">
        <Link to="/escrow">
          <Button
            variant="ghost"
            className="group text-cyan-300 transition-all duration-300 hover:bg-cyan-500/10 hover:text-cyan-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Escrows
          </Button>
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header Card */}
          <div className="glass card-cyan rounded-2xl p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <StatusIcon
                    className={`h-6 w-6 ${statusInfo.color} animate-pulse`}
                  />
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}
                  >
                    {statusInfo.label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      isOverdue
                        ? "border border-rose-400/30 bg-rose-500/20 text-rose-300"
                        : isUrgent
                          ? "border border-yellow-400/30 bg-yellow-500/20 text-yellow-300"
                          : "border border-cyan-400/30 bg-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    {isOverdue ? "Overdue" : `${daysRemaining} days left`}
                  </span>
                </div>

                <h1 className="mb-3 text-3xl leading-tight font-bold text-white/90 lg:text-4xl">
                  {escrow.title}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {escrow.description}
                </p>
                <p className="mt-2 text-sm text-cyan-300/80">
                  {statusInfo.description}
                </p>
              </div>

              {/* Amount Display */}
              <div className="lg:text-right">
                <div className="inline-flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-4 lg:items-end">
                  <div className="mb-1 text-2xl font-bold text-emerald-400 lg:text-3xl">
                    {escrow.amount} {escrow.token}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Escrowed Amount
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Parties Information */}
            <div className="glass card-cyan rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-lg font-semibold text-white/90">
                <Users className="h-5 w-5 text-cyan-400" />
                Parties Involved
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-cyan-400" />
                    <div>
                      <div className="text-muted-foreground text-sm">Payer</div>
                      <div className="font-medium text-cyan-300">
                        {escrow.from}
                      </div>
                    </div>
                  </div>
                  <div className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                    Deposits
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-pink-400" />
                    <div>
                      <div className="text-muted-foreground text-sm">Payee</div>
                      <div className="font-medium text-pink-300">
                        {escrow.to}
                      </div>
                    </div>
                  </div>
                  <div className="rounded bg-pink-500/20 px-2 py-1 text-xs text-pink-300">
                    Receives
                  </div>
                </div>
              </div>
            </div>

            {/* Agreement Details */}
            <div className="glass card-cyan rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-lg font-semibold text-white/90">
                <FileText className="h-5 w-5 text-cyan-400" />
                Agreement Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div className="text-muted-foreground text-sm">Type</div>
                  <div className="flex items-center gap-2">
                    {escrow.type === "public" ? (
                      <Eye className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="font-medium capitalize">
                      {escrow.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div className="text-muted-foreground text-sm">Token</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">{escrow.token}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div className="text-muted-foreground text-sm">Created</div>
                  <div className="text-sm font-medium">
                    {new Date(escrow.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline & Deadline */}
            <div className="glass card-cyan rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-lg font-semibold text-white/90">
                <Calendar className="h-5 w-5 text-cyan-400" />
                Timeline
              </h3>
              <div className="space-y-4">
                <div
                  className={`rounded-lg border p-4 ${
                    isOverdue
                      ? "border-rose-400/30 bg-rose-500/10"
                      : isUrgent
                        ? "border-yellow-400/30 bg-yellow-500/10"
                        : "border-cyan-400/30 bg-cyan-500/10"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Deadline</div>
                    <div
                      className={`text-sm font-bold ${
                        isOverdue
                          ? "text-rose-300"
                          : isUrgent
                            ? "text-yellow-300"
                            : "text-cyan-300"
                      }`}
                    >
                      {escrow.deadline}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {isOverdue
                      ? `Overdue by ${Math.abs(daysRemaining)} days`
                      : isUrgent
                        ? "Deadline approaching soon"
                        : "Active agreement"}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>Progress</span>
                    <span>
                      {escrow.status === "completed" ? "100%" : "In Progress"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        escrow.status === "completed"
                          ? "w-full bg-emerald-400"
                          : escrow.status === "frozen" ||
                              escrow.status === "disputed"
                            ? "w-3/4 bg-rose-400"
                            : escrow.status === "active"
                              ? "w-2/3 bg-blue-400"
                              : "w-1/3 bg-yellow-400"
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Actions */}
            <div className="glass card-cyan rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-lg font-semibold text-white/90">
                <Shield className="h-5 w-5 text-cyan-400" />
                Security & Actions
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-400/20 bg-white/5 p-3">
                  <div className="mb-1 text-sm font-medium text-emerald-300">
                    Funds Secured
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Amount is safely held in smart contract
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {escrow.status === "pending" && (
                    <>
                      <Button variant="neon" className="neon-hover flex-1">
                        Deposit Funds
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-cyan-400/30 text-cyan-200"
                      >
                        Sign Agreement
                      </Button>
                    </>
                  )}
                  {(escrow.status === "active" ||
                    escrow.status === "completed") && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 border-emerald-400/30 text-emerald-200"
                      >
                        Release Funds
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-rose-400/30 text-rose-200"
                      >
                        Raise Dispute
                      </Button>
                    </>
                  )}
                  {(escrow.status === "frozen" ||
                    escrow.status === "disputed") && (
                    <Button
                      variant="outline"
                      className="flex-1 border-rose-400/30 text-rose-200"
                    >
                      View Dispute
                    </Button>
                  )}
                  {escrow.status === "cancelled" && (
                    <Button
                      variant="outline"
                      className="flex-1 border-red-400/30 text-red-200"
                      disabled
                    >
                      Cancelled
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="glass card-cyan rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white/90">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2">
                <div className="text-muted-foreground text-sm">Escrow ID</div>
                <div className="font-mono text-sm text-cyan-300">
                  {escrow.id}
                </div>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="text-muted-foreground text-sm">Created</div>
                <div className="text-sm">
                  {new Date(escrow.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="text-muted-foreground text-sm">Status</div>
                <div className="text-sm font-medium capitalize">
                  {statusInfo.label}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="glass card-cyan rounded-2xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white/90">
              Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Escrow Created</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(escrow.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {escrow.status !== "pending" && (
                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Funds Deposited</div>
                    <div className="text-muted-foreground text-xs">
                      2 days ago
                    </div>
                  </div>
                </div>
              )}
              {escrow.status === "completed" && (
                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Funds Released</div>
                    <div className="text-muted-foreground text-xs">
                      1 day ago
                    </div>
                  </div>
                </div>
              )}
              {(escrow.status === "frozen" || escrow.status === "disputed") && (
                <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                  <div className="h-2 w-2 rounded-full bg-rose-400"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Dispute Raised</div>
                    <div className="text-muted-foreground text-xs">
                      1 day ago
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
