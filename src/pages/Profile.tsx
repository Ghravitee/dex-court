/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import {
  FaUser,
  FaInstagram,
  FaHandshake,
  // FaDollarSign,
} from "react-icons/fa";
import { FaXTwitter, FaTiktok } from "react-icons/fa6";
import { FiSend, FiAlertCircle } from "react-icons/fi";
import { RiShieldCheckFill } from "react-icons/ri";
import { Button } from "../components/ui/button";
import Judge from "../components/ui/svgcomponents/Judge";
import Community from "../components/ui/svgcomponents/Community";
import User from "../components/ui/svgcomponents/User";
import { toast } from "sonner"; // optional, if you already use toast notifications

import {
  registerTelegram,
  getTelegramOtp,
  loginTelegram,
} from "../lib/apiClient";

// Add this component near the top of your file
const Tooltip = ({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) => (
  <div className="group relative inline-block">
    {children}
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

function MiniTrust({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-28 w-28">
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
  const [roles] = useState<{
    judge: boolean;
    community: boolean;
    user: boolean;
  }>({
    judge: true,
    community: true,
    user: true,
  });
  const [otp, setOtp] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [, setLoading] = useState(false);

  async function handleTelegramConnect() {
    try {
      setLoading(true);
      const telegramId = "7522367627";
      const username = "@LuminalLink";

      await registerTelegram(telegramId, username);
      console.log("✅ Registered successfully!");

      const { otp } = await getTelegramOtp(telegramId);
      console.log("📩 Received OTP:", otp);
      setOtp(otp);

      const { token } = await loginTelegram(otp);
      console.log("🔐 Received token:", token);
      setToken(token);

      localStorage.setItem("authToken", token);
      toast.success("Telegram connected successfully!");
    } catch (err: any) {
      console.error(
        "❌ Telegram connection failed:",
        err.response?.data || err.message,
      );
      toast.error("Failed to connect Telegram.");
    } finally {
      setLoading(false);
    }
  }

  const disputes = [
    { id: 1, title: "Escrow breach – CryptoSwap", status: "Resolved" },
    { id: 2, title: "NFT delivery delay", status: "Pending" },
  ];

  const agreements = [
    { id: 1, name: "Marketing deal with @alice", date: "Sep 10, 2025" },
    { id: 2, name: "NFT collaboration with @bob", date: "Oct 2, 2025" },
  ];

  const reputation = [
    { id: 1, event: "Completed dispute as Judge", impact: "+5 trust" },
    { id: 2, event: "Agreement completed successfully", impact: "+2 trust" },
  ];

  const escrowDeals = [
    {
      id: 1,
      title: "USDT Exchange Deal",
      parties: "Alice ↔ Bob",
      status: "Pending",
    },
    {
      id: 2,
      title: "NFT Art Commission",
      parties: "0xBeta ↔ 0xGamma",
      status: "Completed",
    },
    {
      id: 3,
      title: "Dev Work Escrow",
      parties: "0xZed ↔ 0xNova",
      status: "Cancelled",
    },
    {
      id: 4,
      title: "DAO Funding Round",
      parties: "0xOmega ↔ 0xTheta",
      status: "Disputed",
    },
  ];

  const [filter, setFilter] = useState("All");

  const filteredDeals =
    filter === "All"
      ? escrowDeals
      : escrowDeals.filter((d) => d.status === filter);

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
    [],
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
    <div className="relative space-y-8">
      {/* <div className="absolute inset-0 bg-cyan-500/15 blur-3xl -z-[50]" /> */}
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white/90">Profile</h2>
      </header>

      {/* ===== Top Summary Section ===== */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="space-y-4">
          <div className="glass row-span-1 flex h-fit flex-col justify-between rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent px-6 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                <FaUser className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-white/90">{handle}</div>
                  {roles.judge && (
                    <Tooltip content="You have the Judge badge">
                      <Judge />
                    </Tooltip>
                  )}
                  {roles.community && (
                    <Tooltip content="You have a community member badge">
                      <Community />
                    </Tooltip>
                  )}
                  {roles.user && (
                    <Tooltip content="You are just an explorer">
                      <User />
                    </Tooltip>
                  )}
                </div>
                <div className="text-muted-foreground mt-2 text-xs">
                  {wallet}
                </div>
              </div>
              <MiniTrust score={score} />
            </div>
          </div>

          {/* ===== Escrow Deals ===== */}
          <BentoCard
            title="Escrow Deals"
            icon={<FaHandshake />}
            color="cyan"
            count={escrowDeals.length}
            scrollable
            maxHeight="260px"
          >
            {/* Filter Tabs */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {["All", "Pending", "Completed", "Cancelled", "Disputed"].map(
                (status) => {
                  // Assign consistent colors for each status
                  const colorMap: Record<string, string> = {
                    All: "bg-white/5 text-white/70 hover:text-cyan-300",
                    Pending:
                      filter === "Pending"
                        ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/30"
                        : "bg-white/5 text-yellow-200/60 hover:text-yellow-300",
                    Completed:
                      filter === "Completed"
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                        : "bg-white/5 text-emerald-200/60 hover:text-emerald-300",
                    Cancelled:
                      filter === "Cancelled"
                        ? "bg-gray-500/20 text-gray-300 ring-1 ring-gray-400/30"
                        : "bg-white/5 text-gray-300/60 hover:text-gray-300",
                    Disputed:
                      filter === "Disputed"
                        ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30"
                        : "bg-white/5 text-rose-200/60 hover:text-rose-300",
                  };

                  return (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${colorMap[status]}`}
                    >
                      {status}
                    </button>
                  );
                },
              )}
            </div>

            {/* Escrow Deals List */}
            <ul className="space-y-2">
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => (
                  <li
                    key={deal.id}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-white/90">
                        {deal.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {deal.parties}
                      </span>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        deal.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : deal.status === "Pending"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : deal.status === "Cancelled"
                              ? "bg-gray-500/20 text-gray-300"
                              : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {deal.status}
                    </span>
                  </li>
                ))
              ) : (
                <div className="text-muted-foreground py-6 text-center text-sm">
                  No deals found for this category.
                </div>
              )}
            </ul>
          </BentoCard>
        </div>

        {/* Escrow Stats */}

        {/* Revenue Stats */}
        <div className="space-y-4">
          <div className="glass flex flex-col justify-between rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-transparent p-8 shadow-[0_0_40px_rgba(34,211,238,0.2)] ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,211,238,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white/90">
                Revenue Earned
              </h3>
              <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-sm text-cyan-300/80">
                Updated 1h ago
              </span>
            </div>

            <div className="space-y-3 text-lg">
              {Object.entries(stats.revenue).map(([period, amount]) => (
                <div key={period} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {period.toUpperCase()}
                  </span>
                  <span className="text-xl font-semibold text-cyan-300">
                    ${amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center space-y-3">
              <div className="text-muted-foreground text-sm">
                Unclaimed Reward
              </div>
              <div className="text-3xl font-bold text-emerald-400">($132)</div>
              <Button
                variant="neon"
                className="mt-2 w-full border border-cyan-400/40 bg-cyan-600/20 py-4 text-lg font-medium text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all hover:bg-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
              >
                Claim Revenue
              </Button>
            </div>
          </div>

          {/* Reputation History */}
          <BentoCard
            title="My Reputation History"
            icon={<RiShieldCheckFill />}
            color="cyan"
            scrollable
            maxHeight="260px"
          >
            <ul className="mt-4 space-y-2">
              {reputation.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm"
                >
                  <span>{r.event}</span>
                  <span className="text-xs text-cyan-300">{r.impact}</span>
                </li>
              ))}
            </ul>
          </BentoCard>
        </div>

        {/* ===== Verifications ===== */}
        {/* ===== Judged Disputes Leaderboard ===== */}
        <div className="flex flex-col gap-4">
          {roles.judge && (
            <section className="glass rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white/90">
                Judged Disputes
              </h3>

              {/* ✅ Added horizontal scroll container */}
              <div className="overflow-x-auto">
                {/* ✅ Added min-w-max so table overflows */}
                <table className="min-w-max text-left text-sm text-white/80">
                  <thead className="border-b border-cyan-500/20 text-xs text-cyan-300 uppercase">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap">Title</th>
                      <th className="px-3 py-2 whitespace-nowrap">Parties</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {judgedDisputes.map((d, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 transition hover:bg-white/5"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          {d.title}
                        </td>
                        <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                          {d.parties}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <span
                            className={`rounded px-2 py-1 text-xs ${
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

          <section className="glass h-fit rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
            <div className="space text-muted-foreground mb-4 text-lg">
              Verifications
            </div>
            <div className="grid grid-cols-1 gap-6">
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
                      <div className="text-muted-foreground text-xs">
                        {v.handle}
                      </div>
                    </div>
                  </div>
                  {v.verified ? (
                    <span className="badge badge-green">Verified</span>
                  ) : (
                    <Button
                      onClick={handleTelegramConnect}
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Connect
                    </Button>
                  )}
                  {otp && (
                    <div className="mt-4 hidden rounded-md border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-200">
                      <div>
                        <strong>OTP:</strong> {otp}
                      </div>
                      {token && (
                        <div className="mt-2 break-all">
                          <strong>Token:</strong> {token}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      {/* ===== Bento Grid Section ===== */}
      {/* Bento Grid */}
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        {/* My Disputes */}
        <BentoCard
          title="My Disputes"
          icon={<FiAlertCircle />}
          color="cyan"
          count={disputes.length}
          scrollable
          maxHeight="260px"
        >
          <ul className="mt-4 space-y-2">
            {disputes.map((d) => (
              <li
                key={d.id}
                className="flex justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm"
              >
                <span>{d.title}</span>
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    d.status === "Resolved"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        </BentoCard>

        {/* My Agreements */}
        <BentoCard
          title="My Agreements"
          icon={<FaHandshake />}
          color="cyan"
          count={agreements.length}
        >
          <ul className="mt-4 space-y-2">
            {agreements.map((a) => (
              <li
                key={a.id}
                className="flex justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm"
              >
                <span>{a.name}</span>
                <span className="text-muted-foreground text-xs">{a.date}</span>
              </li>
            ))}
          </ul>
        </BentoCard>
      </section>
    </div>
  );
}

function BentoCard({
  title,
  icon,
  color,
  count,
  children,
  scrollable = false, // 👈 optional
  maxHeight = "250px", // 👈 adjustable height cap
}: {
  title: string;
  icon: React.ReactNode;
  color: "rose" | "emerald" | "cyan";
  count?: number;
  children?: React.ReactNode;
  scrollable?: boolean;
  maxHeight?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan-500/20 border-cyan-400/30 text-cyan-200",
    emerald: "from-emerald-500/20 border-emerald-400/30 text-emerald-200",
    rose: "from-rose-500/20 border-rose-400/30 text-rose-200",
  };

  return (
    <div
      className={`glass rounded-2xl border p-6 ring-1 ring-white/10 ${colorMap[color]} flex flex-col justify-between bg-gradient-to-br to-transparent`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold text-white/90">
          {icon}
          <span>{title}</span>
        </div>
        {count !== undefined && (
          <div className="text-2xl font-bold text-white/90">{count}</div>
        )}
      </div>

      {/* Scrollable content if needed */}
      <div
        className={`mt-4 ${
          scrollable
            ? "scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent overflow-y-auto pr-2"
            : ""
        }`}
        style={scrollable ? { maxHeight } : {}}
      >
        {children}
      </div>
    </div>
  );
}
