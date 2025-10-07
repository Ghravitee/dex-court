import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Lock,
  ShieldCheck,
  Shield,
  Twitter,
  Send,
  User,
} from "lucide-react";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";

function MiniTrust({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-24 w-24">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(rgba(16,185,129,.8) ${
            pct * 3.6
          }deg, rgba(244,63,94,.6) 0)`,
          filter: "drop-shadow(0 0 12px rgba(34,211,238,.25))",
        }}
      />
      <div className="absolute inset-1 grid place-items-center rounded-full bg-black/50 ring-1 ring-white/10">
        <div className="text-xl font-bold text-white">{pct}</div>
        <div className="text-[10px] text-cyan-300">Trust</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const [handle] = useState("@you");
  const [wallet] = useState("0xABCD…1234");
  const [score] = useState(72);
  const [roles, setRoles] = useState<{ judge: boolean; user: boolean }>({
    judge: true,
    user: true,
  });

  const [notify, setNotify] = useState({
    caseUpdates: true,
    marketing: false,
    telegram: true,
    email: false,
  });
  const [privacy, setPrivacy] = useState({
    publicHandle: true,
    showHistory: true,
    showWallets: false,
  });

  const verifications = useMemo(
    () => [
      {
        id: "twitter",
        name: "Twitter",
        icon: Twitter,
        verified: true,
        handle: "@you_web3",
      },
      {
        id: "telegram",
        name: "Telegram",
        icon: Send,
        verified: false,
        handle: "Not linked",
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90">Profile</h2>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass ring-1 ring-white/10 p-6 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Handle / Wallet</div>
            <div className="font-semibold text-white/90">{handle}</div>
            <div className="text-xs text-muted-foreground">{wallet}</div>
          </div>
          <div className="ml-auto">
            <MiniTrust score={score} />
          </div>
        </div>

        <div className="glass ring-1 ring-white/10 p-6">
          <div className="mb-2 text-xs text-muted-foreground">Roles</div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setRoles((r) => ({ ...r, judge: !r.judge }))}
              className={`badge ${roles.judge ? "badge-green" : "badge-red"}`}
            >
              {roles.judge ? (
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Shield className="mr-1 h-3.5 w-3.5" />
              )}{" "}
              Judge
            </button>
            <button
              onClick={() => setRoles((r) => ({ ...r, user: !r.user }))}
              className={`badge ${roles.user ? "badge-blue" : "badge-red"}`}
            >
              <BadgeCheck className="mr-1 h-3.5 w-3.5" /> User
            </button>
          </div>
        </div>

        <div className="glass ring-1 ring-white/10 p-6">
          <div className="mb-2 text-xs text-muted-foreground">
            Verifications
          </div>
          <div className="space-y-3">
            {verifications.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <v.icon
                    className={`h-4 w-4 ${
                      v.id === "twitter" ? "text-sky-400" : "text-cyan-300"
                    }`}
                  />
                  <div>
                    <div className="text-sm text-white/90">{v.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.handle}
                    </div>
                  </div>
                </div>
                {v.verified ? (
                  <span className="badge badge-green">Verified</span>
                ) : (
                  <Button
                    variant="outline"
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass ring-1 ring-white/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-semibold text-white/90">
              Notifications
            </h3>
          </div>
          <Setting
            label="Case updates"
            desc="Get notified when cases you follow change state."
            checked={notify.caseUpdates}
            onCheckedChange={(v) =>
              setNotify((n) => ({ ...n, caseUpdates: v }))
            }
          />
          <Setting
            label="Telegram"
            desc="Receive alerts via Telegram bot."
            checked={notify.telegram}
            onCheckedChange={(v) => setNotify((n) => ({ ...n, telegram: v }))}
          />
          <Setting
            label="Email"
            desc="Weekly summary and critical updates."
            checked={notify.email}
            onCheckedChange={(v) => setNotify((n) => ({ ...n, email: v }))}
          />
          <Setting
            label="Marketing"
            desc="Occasional product announcements."
            checked={notify.marketing}
            onCheckedChange={(v) => setNotify((n) => ({ ...n, marketing: v }))}
          />
        </div>

        <div className="glass ring-1 ring-white/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-semibold text-white/90">Privacy</h3>
          </div>
          <Setting
            label="Public handle"
            desc="Allow others to see your handle."
            checked={privacy.publicHandle}
            onCheckedChange={(v) =>
              setPrivacy((p) => ({ ...p, publicHandle: v }))
            }
          />
          <Setting
            label="Show history"
            desc="Display agreements and disputes on your profile."
            checked={privacy.showHistory}
            onCheckedChange={(v) =>
              setPrivacy((p) => ({ ...p, showHistory: v }))
            }
          />
          <Setting
            label="Show wallets"
            desc="Expose linked wallet addresses on profile."
            checked={privacy.showWallets}
            onCheckedChange={(v) =>
              setPrivacy((p) => ({ ...p, showWallets: v }))
            }
          />
        </div>
      </section>
    </div>
  );
}

function Setting({
  label,
  desc,
  checked,
  onCheckedChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/5 p-4 +:mt-3 mt-3 first:mt-0">
      <div>
        <div className="text-sm font-medium text-white/90">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
