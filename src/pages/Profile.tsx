import { useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaUser,
  FaInstagram,
  FaHandshake,
  FaFileAlt,
  FaDollarSign,
} from "react-icons/fa";
import { FaXTwitter, FaTiktok } from "react-icons/fa6";
import { FiSend, FiBell, FiLock, FiAlertCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";

function MiniTrust({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-20 w-20">
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
        <div className="text-lg font-bold text-white">{pct}</div>
        <div className="text-[10px] text-cyan-300">Trust</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const [handle] = useState("@you");
  const [wallet] = useState("0xABCD…1234");
  const [score] = useState(72);
  const [roles] = useState<{ judge: boolean; user: boolean }>({
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
        id: "x",
        name: "Twitter",
        icon: FaXTwitter,
        verified: true,
        handle: "@you_web3",
      },
      {
        id: "telegram",
        name: "Telegram",
        icon: FiSend,
        verified: false,
        handle: "Not linked",
      },
      {
        id: "instagram",
        name: "Instagram",
        icon: FaInstagram,
        verified: false,
        handle: "Not linked",
      },
      {
        id: "tiktok",
        name: "TikTok",
        icon: FaTiktok,
        verified: false,
        handle: "Not linked",
      },
    ],
    []
  );

  const stats = {
    deals: 24,
    agreements: 19,
    disputes: 2,
    revenue: { "7d": 420, "30d": 1760, "90d": 5030 },
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute inset-0 bg-cyan-500/15 blur-3xl -z-[50]" />
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90 space">Profile</h2>
      </header>

      {/* Top Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10 p-6 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            <FaUser className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-white/90">{handle}</div>
              {roles.judge && (
                <RiShieldCheckFill
                  className="h-4 w-4 text-emerald-400"
                  title="Judge"
                />
              )}
              {roles.user && (
                <FaCheckCircle className="h-4 w-4 text-cyan-400" title="User" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">{wallet}</div>
          </div>
          <MiniTrust score={score} />
        </div>

        {/* Escrow Stats */}
        <div className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10 flex flex-col gap-4 justify-center">
          <StatRow
            icon={<FaHandshake className="text-cyan-300" />}
            label="Deals"
            value={stats.deals}
          />
          <StatRow
            icon={<FaFileAlt className="text-emerald-400" />}
            label="Agreements"
            value={stats.agreements}
          />
          <StatRow
            icon={<FiAlertCircle className="text-rose-400" />}
            label="Disputes"
            value={stats.disputes}
          />
        </div>

        {/* Revenue Stats */}
        <div className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10 flex flex-col gap-3 justify-center">
          <div className="flex items-center gap-2 text-sm text-white/80 mb-1">
            <FaDollarSign className="h-4 w-4 text-cyan-300" />
            <span>Revenue Earned</span>
          </div>
          {Object.entries(stats.revenue).map(([period, amount]) => (
            <div key={period} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {period.toUpperCase()}
              </span>
              <span className="font-semibold text-white">${amount}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Verifications */}
      <section className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10">
        <div className="mb-2 text-xs text-muted-foreground">Verifications</div>
        <div className="grid gap-3 md:grid-cols-2">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                <v.icon
                  className={`h-4 w-4 ${
                    v.id === "x"
                      ? "text-white"
                      : v.id === "instagram"
                      ? "text-pink-400"
                      : v.id === "tiktok"
                      ? "text-gray-200"
                      : "text-cyan-300"
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
      </section>

      {/* Notifications & Privacy */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsCard
          icon={<FiBell className="h-4 w-4 text-cyan-300" />}
          title="Notifications"
        >
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
        </SettingsCard>

        <SettingsCard
          icon={<FiLock className="h-4 w-4 text-cyan-300" />}
          title="Privacy"
        >
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
        </SettingsCard>
      </section>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between text-sm text-white/80">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function SettingsCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
      </div>
      {children}
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
    <div className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/5 p-4 mt-3 first:mt-0">
      <div>
        <div className="text-sm font-medium text-white/90">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
