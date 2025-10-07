import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  FileText,
  Scale,
  BadgeDollarSign,
  Star,
  User,
  Timer,
  ArrowRight,
} from "lucide-react";

export default function Index() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight text-white glow-text">
            Dex Court dApp
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create agreements, resolve disputes, vote on cases, and manage
            escrow with neon-fast UX. Your actions update reputation across the
            network.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/agreements">
              <Button variant="neon" className="neon-hover">
                Create Agreement
              </Button>
            </Link>
            <Link to="/disputes">
              <Button
                variant="outline"
                className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
              >
                Raise Dispute
              </Button>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Active Disputes" value="12" />
          <Stat label="Escrows" value="8" />
          <Stat label="Reputation" value="78" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card
          title="Agreements"
          icon={<FileText className="h-4 w-4" />}
          to="/agreements"
          color="from-cyan-500/10"
        />
        <Card
          title="Disputes"
          icon={<Scale className="h-4 w-4" />}
          to="/disputes"
          color="from-rose-500/10"
        />
        <Card
          title="Escrow"
          icon={<BadgeDollarSign className="h-4 w-4" />}
          to="/escrow"
          color="from-sky-500/10"
        />
        <Card
          title="Voting Hub"
          icon={<Scale className="h-4 w-4" />}
          to="/voting"
          color="from-emerald-500/10"
        />
        <Card
          title="Reputation"
          icon={<Star className="h-4 w-4" />}
          to="/reputation"
          color="from-amber-500/10"
        />
        <Card
          title="Profile"
          icon={<User className="h-4 w-4" />}
          to="/profile"
          color="from-fuchsia-500/10"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass p-5 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90">
              Upcoming Deadlines
            </h3>
            <Timer className="h-4 w-4 text-cyan-300" />
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
              <div>
                <div className="font-medium">Agreement #A-104</div>
                <div className="text-xs text-muted-foreground">
                  Review due in 2d
                </div>
              </div>
              <span className="badge badge-orange">pending</span>
            </li>
            <li className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
              <div>
                <div className="font-medium">Dispute #D-229</div>
                <div className="text-xs text-muted-foreground">
                  Vote reveal in 5h
                </div>
              </div>
              <span className="badge badge-red">under review</span>
            </li>
          </ul>
        </div>
        <div className="glass p-5 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90">
              Recent Agreements
            </h3>
            <Link
              to="/agreements"
              className="text-xs text-cyan-300 hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
              <div>
                <div className="font-medium">Design Work - Phase 1</div>
                <div className="text-xs text-muted-foreground">
                  with @0xAlfa
                </div>
              </div>
              <span className="badge badge-green">signed</span>
            </li>
            <li className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
              <div>
                <div className="font-medium">Smart Contract Audit</div>
                <div className="text-xs text-muted-foreground">
                  with @0xBeta
                </div>
              </div>
              <span className="badge badge-orange">pending</span>
            </li>
          </ul>
        </div>
        <div className="glass p-5 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90">Flow</h3>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-cyan-300">1.</span> Create Agreement
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-300">2.</span> Raise Dispute
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-300">3.</span> Voting
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-300">4.</span> Verdict
            </li>
            <li className="flex items-center gap-2">
              <span className="text-cyan-300">5.</span> Escrow/Reputation Update
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Card({
  title,
  icon,
  to,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  to: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className={
        "group glass flex items-center justify-between p-5 ring-1 ring-white/10 hover:ring-cyan-400/30 transition " +
        `bg-gradient-to-br ${color}`
      }
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 neon">
          {icon}
        </div>
        <div>
          <div className="font-medium text-white/90">{title}</div>
          <div className="text-xs text-muted-foreground">
            Go to {title.toLowerCase()}
          </div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-cyan-300 opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}
