/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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
import User from "../components/ui/svgcomponents/UserIcon";
import { useAuth } from "../context/AuthContext";
import { LoginModal } from "../components/LoginModal";

import { loginTelegram } from "../lib/apiClient";

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
  const { isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  async function handleTelegramLogin() {
    setLoading(true);
    try {
      const { token } = await loginTelegram(otp);
      localStorage.setItem("authToken", token);
      console.log("✅ Login successful:", token);

      setShowLoginModal(false);
    } catch (err: any) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      alert("Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disputes = [
    { id: 1, title: "Escrow breach – CryptoSwap", status: "Resolved" },
    { id: 2, title: "NFT delivery delay", status: "Pending" },
    { id: 3, title: "Smart contract audit dispute", status: "Resolved" },
    {
      id: 4,
      title: "Payment delay for development work",
      status: "In Progress",
    },
  ];

  const agreements = [
    { id: 1, name: "Marketing deal with @alice", date: "Sep 10, 2025" },
    { id: 2, name: "NFT collaboration with @bob", date: "Oct 2, 2025" },
    {
      id: 3,
      name: "Smart contract development with @charlie",
      date: "Nov 15, 2025",
    },
    {
      id: 4,
      name: "DAO consulting agreement with @diana",
      date: "Dec 5, 2025",
    },
  ];

  const reputation = [
    { id: 1, event: "Completed dispute as Judge", impact: "+5 trust" },
    { id: 2, event: "Agreement completed successfully", impact: "+2 trust" },
    { id: 3, event: "Failed to deliver on time", impact: "-3 trust" },
    { id: 4, event: "Successful escrow completion", impact: "+4 trust" },
    { id: 5, event: "Lost dispute as Defendant", impact: "-6 trust" },
    { id: 6, event: "Helped resolve community issue", impact: "+3 trust" },
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

  // Filter states
  const [escrowFilter, setEscrowFilter] = useState("All");
  const [disputesFilter, setDisputesFilter] = useState("All");
  const [agreementsFilter, setAgreementsFilter] = useState("All");
  const [reputationFilter, setReputationFilter] = useState("All");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter functions
  const filteredDeals =
    escrowFilter === "All"
      ? escrowDeals
      : escrowDeals.filter((d) => d.status === escrowFilter);

  const filteredDisputes =
    disputesFilter === "All"
      ? disputes
      : disputes.filter((d) => d.status === disputesFilter);

  const filteredAgreements =
    agreementsFilter === "All"
      ? agreements
      : agreementsFilter === "Recent"
        ? agreements.slice(0, 2) // Show only recent 2 for demo
        : agreements;

  const filteredReputation =
    reputationFilter === "All"
      ? reputation
      : reputationFilter === "Positive"
        ? reputation.filter((r) => r.impact.includes("+"))
        : reputation.filter((r) => r.impact.includes("-"));

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
    {
      title: "Smart contract bug dispute",
      parties: "Zoe vs Ethan",
      status: "In Review",
    },
  ];

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="relative space-y-8">
        <header className="flex items-center justify-between">
          <h2 className="space text-lg font-semibold text-white/90 lg:text-2xl">
            Profile
          </h2>
        </header>

        <div className="glass card-cyan mx-auto flex max-w-[50rem] flex-col items-center justify-center rounded-2xl border border-cyan-400/30 p-12 text-center">
          <div className="mb-6 grid h-20 w-20 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            <FaUser className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white/90">
            Please log in to view your profile
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your wallet or login via Telegram to access your DexCourt
            profile, view your agreements, disputes, and reputation.
          </p>
          <Button
            onClick={() => setShowLoginModal(true)}
            className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
          >
            Login to Continue
          </Button>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white/90">Profile</h2>
      </header>

      {/* ===== Top Summary Section ===== */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile Summary */}
        <div className="space-y-4">
          <div className="glass card-cyan row-span-1 flex h-fit flex-col justify-between rounded-2xl px-6 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                <FaUser className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
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
                  <div className="font-semibold text-white/90">{handle}</div>
                  {wallet}
                </div>
              </div>
              <div className="self-center">
                <MiniTrust score={score} />
              </div>
            </div>
          </div>

          <section className="glass card-cyan h-fit rounded-2xl p-4 lg:p-6">
            <div className="space text-muted-foreground mb-4 text-lg">
              Verifications
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* Telegram Verification */}
              <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <FiSend className="h-5 w-5 text-cyan-300" />
                  <div>
                    <div className="text-sm text-white/90">Telegram</div>
                    <div className="text-muted-foreground text-xs">
                      {isAuthenticated ? "Connected" : "Not linked"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="outline"
                        className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                      >
                        Verify
                      </Button>
                      <Button
                        onClick={logout}
                        variant="ghost"
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setShowLoginModal(true)}
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              {/* Twitter Verification */}
              <div className="flex cursor-not-allowed items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <FaXTwitter className="h-5 w-5 text-white" />
                  <div>
                    <div className="text-sm text-white/90">Twitter</div>
                    <div className="text-muted-foreground text-xs">
                      @you_web3
                    </div>
                  </div>
                </div>
                <Tooltip content="Coming soon in v2">
                  <Button
                    variant="outline"
                    disabled
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Connect
                  </Button>
                </Tooltip>
              </div>

              {/* Instagram Verification */}
              <div className="flex cursor-not-allowed items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <FaInstagram className="h-5 w-5 text-pink-400" />
                  <div>
                    <div className="text-sm text-white/90">Instagram</div>
                    <div className="text-muted-foreground text-xs">
                      Not linked
                    </div>
                  </div>
                </div>
                <Tooltip content="Coming soon in v2">
                  <Button
                    variant="outline"
                    disabled
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Connect
                  </Button>
                </Tooltip>
              </div>

              {/* TikTok Verification */}
              <div className="flex cursor-not-allowed items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 opacity-50">
                <div className="flex items-center gap-3">
                  <FaTiktok className="h-5 w-5 text-gray-200" />
                  <div>
                    <div className="text-sm text-white/90">TikTok</div>
                    <div className="text-muted-foreground text-xs">
                      Not linked
                    </div>
                  </div>
                </div>
                <Tooltip content="Coming soon in v2">
                  <Button
                    variant="outline"
                    disabled
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Connect
                  </Button>
                </Tooltip>
              </div>
            </div>
          </section>
        </div>

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
        </div>

        {/* Judged Disputes & Reputation */}
        <div className="flex flex-col gap-4">
          {roles.judge && (
            <section className="glass rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white/90">
                Judged Disputes
              </h3>

              <div className="overflow-x-auto">
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
                                : d.status === "Pending"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-cyan-500/20 text-cyan-300"
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

          {/* Reputation History with Filter */}
          <BentoCard
            title="My Reputation History"
            icon={<RiShieldCheckFill />}
            color="cyan"
            scrollable
            maxHeight="260px"
          >
            {/* Reputation Filter Tabs */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {["All", "Positive", "Negative"].map((filterType) => {
                const colorMap: Record<string, string> = {
                  All: "bg-white/5 text-white/70 hover:text-cyan-300",
                  Positive:
                    reputationFilter === "Positive"
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                      : "bg-white/5 text-emerald-200/60 hover:text-emerald-300",
                  Negative:
                    reputationFilter === "Negative"
                      ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30"
                      : "bg-white/5 text-rose-200/60 hover:text-rose-300",
                };

                return (
                  <button
                    key={filterType}
                    onClick={() => setReputationFilter(filterType)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${colorMap[filterType]}`}
                  >
                    {filterType}
                  </button>
                );
              })}
            </div>

            <ul className="mt-4 space-y-2">
              {filteredReputation.map((r) => {
                const isPositive = r.impact.includes("+");
                return (
                  <li
                    key={r.id}
                    className="flex justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm"
                  >
                    <span>{r.event}</span>
                    <span
                      className={`text-xs font-medium ${
                        isPositive ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {r.impact}
                    </span>
                  </li>
                );
              })}
              {filteredReputation.length === 0 && (
                <div className="py-4 text-center text-sm text-white/50">
                  No reputation events found for this filter.
                </div>
              )}
            </ul>
          </BentoCard>

          {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="card-cyan w-[90%] max-w-sm rounded-xl p-6 text-white shadow-lg">
                <h3 className="mb-4 text-lg font-semibold">Telegram Login</h3>

                <label className="mb-2 block text-sm text-gray-300">
                  Enter your OTP from the DexCourt's Telegram bot:
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  className="mb-4 w-full rounded-md border border-cyan-400/30 bg-black/40 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowLoginModal(false)}
                    className="border-gray-500/30 text-gray-300 hover:bg-gray-700/40"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleTelegramLogin}
                    className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== Bento Grid Section ===== */}
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        {/* My Disputes with Filter */}
        <BentoCard
          title="My Disputes"
          icon={<FiAlertCircle />}
          color="cyan"
          count={filteredDisputes.length}
          scrollable
          maxHeight="260px"
        >
          {/* Disputes Filter Tabs */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {["All", "Resolved", "Pending", "In Progress"].map((status) => {
              const colorMap: Record<string, string> = {
                All: "bg-white/5 text-white/70 hover:text-cyan-300",
                Resolved:
                  disputesFilter === "Resolved"
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                    : "bg-white/5 text-emerald-200/60 hover:text-emerald-300",
                Pending:
                  disputesFilter === "Pending"
                    ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/30"
                    : "bg-white/5 text-yellow-200/60 hover:text-yellow-300",
                "In Progress":
                  disputesFilter === "In Progress"
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30"
                    : "bg-white/5 text-cyan-200/60 hover:text-cyan-300",
              };

              return (
                <button
                  key={status}
                  onClick={() => setDisputesFilter(status)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${colorMap[status]}`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          <ul className="mt-4 space-y-2">
            {filteredDisputes.map((d) => (
              <li
                key={d.id}
                className="flex justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm"
              >
                <span className="flex-1 pr-2">{d.title}</span>
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    d.status === "Resolved"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : d.status === "Pending"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-cyan-500/20 text-cyan-300"
                  }`}
                >
                  {d.status}
                </span>
              </li>
            ))}
            {filteredDisputes.length === 0 && (
              <div className="py-4 text-center text-sm text-white/50">
                No disputes found for this filter.
              </div>
            )}
          </ul>
        </BentoCard>

        {/* My Agreements with Filter */}
        <BentoCard
          title="My Agreements"
          icon={<FaHandshake />}
          color="cyan"
          count={filteredAgreements.length}
          scrollable
          maxHeight="260px"
        >
          {/* Agreements Filter Tabs */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {["All", "Recent"].map((filterType) => {
              const colorMap: Record<string, string> = {
                All: "bg-white/5 text-white/70 hover:text-cyan-300",
                Recent:
                  agreementsFilter === "Recent"
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30"
                    : "bg-white/5 text-cyan-200/60 hover:text-cyan-300",
              };

              return (
                <button
                  key={filterType}
                  onClick={() => setAgreementsFilter(filterType)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${colorMap[filterType]}`}
                >
                  {filterType}
                </button>
              );
            })}
          </div>

          <ul className="mt-4 space-y-2">
            {filteredAgreements.map((a) => (
              <li
                key={a.id}
                className="flex justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium text-white/90">{a.name}</div>
                  <div className="text-muted-foreground text-xs">{a.date}</div>
                </div>
              </li>
            ))}
            {filteredAgreements.length === 0 && (
              <div className="py-4 text-center text-sm text-white/50">
                No agreements found for this filter.
              </div>
            )}
          </ul>
        </BentoCard>

        {/* Escrow Deals with Filter */}
        <BentoCard
          title="Escrow Deals"
          icon={<FaHandshake />}
          color="cyan"
          count={filteredDeals.length}
          scrollable
          maxHeight="260px"
        >
          {/* Escrow Filter Tabs */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {["All", "Pending", "Completed", "Cancelled", "Disputed"].map(
              (status) => {
                const colorMap: Record<string, string> = {
                  All: "bg-white/5 text-white/70 hover:text-cyan-300",
                  Pending:
                    escrowFilter === "Pending"
                      ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/30"
                      : "bg-white/5 text-yellow-200/60 hover:text-yellow-300",
                  Completed:
                    escrowFilter === "Completed"
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                      : "bg-white/5 text-emerald-200/60 hover:text-emerald-300",
                  Cancelled:
                    escrowFilter === "Cancelled"
                      ? "bg-gray-500/20 text-gray-300 ring-1 ring-gray-400/30"
                      : "bg-white/5 text-gray-300/60 hover:text-gray-300",
                  Disputed:
                    escrowFilter === "Disputed"
                      ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30"
                      : "bg-white/5 text-rose-200/60 hover:text-rose-300",
                };

                return (
                  <button
                    key={status}
                    onClick={() => setEscrowFilter(status)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${colorMap[status]}`}
                  >
                    {status}
                  </button>
                );
              },
            )}
          </div>

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
      </section>
    </div>
  );
}

export function BentoCard({
  title,
  icon,
  color,
  count,
  children,
  scrollable = false,
  maxHeight = "250px",
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold text-white/90">
          {icon}
          <span>{title}</span>
        </div>
        {count !== undefined && (
          <div className="text-2xl font-bold text-white/90">{count}</div>
        )}
      </div>

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
