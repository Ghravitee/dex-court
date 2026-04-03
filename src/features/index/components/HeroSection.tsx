import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";

export const HeroSection = () => {
  return (
    <section className="w-full">
      <div className="relative items-center gap-6 rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-transparent px-6 py-6">
        <div className="relative z-[1]">
          <h1 className="space text-3xl font-bold tracking-tight text-white">
            DexCourt dApp
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
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
                Create Dispute
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
