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
import { FiSend, FiAlertCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
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

  const judgedDisputes = [
    {
      title: "Escrow breach – CryptoSwap",
      parties: "Alice vs Bob",
      status: "Resolved",
    },
    {
      title: "NFT delivery delay",
      parties: "Eve vs Mallory",
      status: "Pending",
    },
    {
      title: "DAO treasury misuse",
      parties: "Liam vs Noah",
      status: "Resolved",
    },
  ];

  return (
    <div className="space-y-8 relative">
      <div className="absolute inset-0 bg-cyan-500/15 blur-3xl -z-[50]" />
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white/90">Profile</h2>
      </header>

      {/* ===== Top Summary Section ===== */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="glass ring-1 ring-white/10 bg-gradient-to-br from-cyan-500/10 p-6 flex items-center gap-4 rounded-2xl">
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
        <div className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10 flex flex-col gap-4 justify-center rounded-2xl">
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
        <div className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10 to-transparent flex flex-col gap-4 justify-center relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-cyan-500/20 blur-3xl opacity-40 -z-10" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <FaDollarSign className="h-4 w-4 text-cyan-300 animate-pulse" />
              <span className="tracking-wide">Revenue Earned</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Unclaimed</div>
              <div className="text-cyan-300 font-semibold text-base">$132</div>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(stats.revenue).map(([period, amount]) => (
              <div key={period} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {period.toUpperCase()}
                </span>
                <span className="font-semibold text-cyan-300">
                  ${amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <Button
            variant="neon"
            className="mt-4 bg-cyan-600/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-300"
          >
            Claim Revenue
          </Button>
        </div>
      </section>

      {/* ===== Bento Grid Section ===== */}
      <section className="grid md:grid-cols-3 gap-6">
        <BentoCard
          title="My Disputes"
          icon={<FiAlertCircle />}
          color="rose"
          count={2}
        />
        <BentoCard
          title="My Agreements"
          icon={<FaHandshake />}
          color="emerald"
          count={19}
        />
        <BentoCard
          title="My Reputation History"
          icon={<RiShieldCheckFill />}
          color="cyan"
        />
      </section>

      {/* ===== Judged Disputes Leaderboard ===== */}
      {roles.judge && (
        <section className="glass ring-1 ring-white/10 p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10">
          <h3 className="text-lg font-semibold text-white/90 mb-4">
            Judged Disputes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-white/80">
              <thead className="text-xs uppercase text-cyan-300 border-b border-cyan-500/20">
                <tr>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Parties</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {judgedDisputes.map((d, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="py-2 px-3">{d.title}</td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {d.parties}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          d.status === "Resolved"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===== Verifications ===== */}
      <section className="glass ring-1 ring-white/10 p-6 bg-gradient-to-br from-cyan-500/10 rounded-2xl">
        <div className="mb-2 text-xs text-muted-foreground">Verifications</div>
        <div className="grid gap-3 md:grid-cols-2">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                <v.icon
                  className={`h-5 w-5 ${
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

function BentoCard({
  title,
  icon,
  color = "cyan",
  count,
}: {
  title: string;
  icon: React.ReactNode;
  color?: "cyan" | "emerald" | "rose";
  count?: number;
}) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan-500/20 border-cyan-400/30 text-cyan-200",
    emerald: "from-emerald-500/20 border-emerald-400/30 text-emerald-200",
    rose: "from-rose-500/20 border-rose-400/30 text-rose-200",
  };

  return (
    <div
      className={`glass p-6 rounded-2xl ring-1 ring-white/10 border ${colorMap[color]} bg-gradient-to-br to-transparent flex flex-col justify-between hover:scale-[1.02] transition-transform`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold text-white/90">
          {icon}
          <span>{title}</span>
        </div>
        {count !== undefined && (
          <div className="text-2xl font-bold text-white/90">{count}</div>
        )}
      </div>
      <Button
        variant="outline"
        className={`mt-4 border-white/10 text-xs ${colorMap[color]
          .split(" ")[2]
          .replace("text-", "hover:text-")}`}
      >
        View
      </Button>
    </div>
  );
}
