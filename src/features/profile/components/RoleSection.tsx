import Admin from "../../../components/ui/svgcomponents/Admin";
import { Button } from "../../../components/ui/button";
import { useNavigate } from "react-router-dom";
// import {
//   Admin,
//   Judge,
//   Community,
//   User,
// } from "../../../components/ui/svgcomponents";

interface RoleSectionProps {
  roles: {
    admin: boolean;
    judge: boolean;
    community: boolean;
    user: boolean;
  };
}

export const RoleSection = ({ roles }: RoleSectionProps) => {
  const navigate = useNavigate();

  if (roles.admin) {
    return (
      <section className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-transparent p-6">
        <h3 className="mb-4 text-lg font-semibold text-white/90">
          Administrator Access
        </h3>
        <div className="py-6 text-center">
          <div className="mb-3 flex justify-center">
            <Admin className="size-10" />
          </div>
          <div className="mb-2 text-lg text-yellow-300">
            Platform Administrator
          </div>
          <div className="mb-4 text-sm text-white/50">
            You have full access to the admin panel for user management and
            platform analytics.
          </div>
          <Button
            onClick={() => navigate("/admin")}
            className="border-yellow-400/40 bg-yellow-600/20 text-yellow-100 hover:bg-yellow-500/30"
          >
            Access Admin Panel
          </Button>
        </div>
      </section>
    );
  }

  if (roles.judge) {
    return (
      <section className="rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
        <h3 className="mb-4 text-lg font-semibold text-white/90">
          Judged Disputes
        </h3>
        <div className="py-8 text-center">
          <div className="mb-2 text-lg text-cyan-300">
            No disputes judged yet
          </div>
          <div className="text-sm text-white/50">
            As a certified judge, you'll be able to participate in dispute
            resolution cases here.
          </div>
        </div>
      </section>
    );
  }

  if (roles.community) {
    return (
      <section className="rounded-2xl border border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-transparent p-6">
        <h3 className="mb-4 text-lg font-semibold text-white/90">
          Community Contributions
        </h3>
        <div className="py-8 text-center">
          <div className="mb-2 text-lg text-emerald-300">
            Active Community Member
          </div>
          <div className="text-sm text-white/50">
            Thank you for being part of the DexCourt community!
          </div>
        </div>
      </section>
    );
  }

  if (roles.user) {
    return (
      <section className="rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
        <h3 className="mb-4 text-lg font-semibold text-white/90">
          Get Started
        </h3>
        <div className="py-8 text-center">
          <div className="mb-2 text-lg text-cyan-300">Welcome to DexCourt!</div>
          <div className="text-sm text-white/50">
            Start by creating agreements and participating in the community to
            unlock more features.
          </div>
        </div>
      </section>
    );
  }

  return null;
};
