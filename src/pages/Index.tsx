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
  Vote,
} from "lucide-react";

export default function Index() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight text-white glow-text space">
            Dex Court dApp
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A decentralized platform for trustless agreements, transparent
            dispute resolution, and on-chain reputation. Govern your deals and
            votes with full cryptographic assurance.
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
          description="Draft, sign, and manage tamper-proof smart agreements."
        />
        <Card
          title="Disputes"
          icon={<Scale className="h-4 w-4" />}
          to="/disputes"
          color="from-cyan-500/10"
          description="Resolve conflicts through transparent voting and evidence."
        />
        <Card
          title="Escrow"
          icon={<BadgeDollarSign className="h-4 w-4" />}
          to="/escrow"
          color="from-sky-500/10"
          description="Secure funds in trustless, automated escrow vaults."
        />
        <Card
          title="Voting Hub"
          icon={<Vote className="h-4 w-4" />}
          to="/voting"
          color="from-cyan-500/10"
          description="Participate in community verdicts and shape case outcomes."
        />
        <Card
          title="Reputation"
          icon={<Star className="h-4 w-4" />}
          to="/reputation"
          color="from-cyan-500/10"
          description="Earn credibility as you engage with agreements & disputes."
        />
        <Card
          title="Profile"
          icon={<User className="h-4 w-4" />}
          to="/profile"
          color="from-cyan-500/10"
          description="View your activity, reputation, and arbitration history."
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass p-5  border border-white/10 ring-white/10 bg-gradient-to-br from-cyan-500/10 ">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90 space">
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
        <div className="glass p-5  border border-white/10 ring-white/10 bg-gradient-to-br from-cyan-500/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90 space">
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
        <div className="glass p-5 ring-1 ring-white/10 relative overflow-hidden bg-gradient-to-br from-cyan-500/10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90 tracking-wide uppercase">
              Flow
            </h3>
          </div>

          <ol className="relative border-l border-cyan-500/30 space-y-6 ml-3">
            {[
              "Create Agreement",
              "Raise Dispute",
              "Voting",
              "Verdict",
              "Escrow / Reputation Update",
            ].map((step, idx) => (
              <li key={idx} className="relative pl-6 group">
                {/* Bullet */}
                <span className="absolute -left-[10px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-400/40 group-hover:scale-110 group-hover:bg-cyan-500/20 transition">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]"></span>
                </span>

                <span className="text-sm text-white/80 group-hover:text-cyan-300 transition">
                  {idx + 1}. {step}
                </span>
              </li>
            ))}
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
  description,
}: {
  title: string;
  icon: React.ReactNode;
  to: string;
  color: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className={
        "group glass flex flex-col gap-1 justify-between px-5 py-3 border border-white/10 group-hover:border-cyan-400 transition-all transform hover:scale-[1.04] " +
        `bg-gradient-to-br ${color}`
      }
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 neon">
          {icon}
        </div>
        <div>
          <div className="font-medium text-white/90 space text-lg">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-cyan-300 opacity-0 transition group-hover:opacity-100 self-end" />
    </Link>
  );
}
