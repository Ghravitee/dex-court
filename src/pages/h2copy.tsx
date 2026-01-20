// web3escrow.tsx copy

import { useCallback, useEffect, useState } from "react";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useChainId
} from "wagmi";
import { formatEther } from "viem";
import {
  FileText,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Lock,
  UserCheck,
  Package,
  PackageCheck,
  Ban,
} from "lucide-react";
import { formatAmount } from "../web3/helper";
import { ERC20_ABI, ESCROW_ABI, ESCROW_CA, ZERO_ADDRESS } from "../web3/config";
import { Button } from "../components/ui/button";

// Add CountdownTimer component
// Replace the existing CountdownTimer component with this improved version
function CountdownTimer({
  targetTimestamp,
  onComplete,
}: {
  targetTimestamp: bigint;
  onComplete?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const target = Number(targetTimestamp);
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        onComplete?.();
        return;
      }

      // Convert to appropriate time units
      const days = Math.floor(difference / (60 * 60 * 24));
      const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((difference % (60 * 60)) / 60);
      const seconds = difference % 60;

      // Format based on the time remaining
      if (days > 0) {
        // Show days + hours for periods longer than a day
        setTimeLeft(
          `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`,
        );
      } else if (hours > 0) {
        // Show hours + minutes for periods less than a day but more than an hour
        setTimeLeft(
          `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`,
        );
      } else if (minutes > 0) {
        // Show minutes + seconds for periods less than an hour
        setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
      } else {
        // Show only seconds for very short periods
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp, onComplete]);

  return (
    <span
      className={`font-mono ${timeLeft === "Expired" ? "text-green-400" : "text-yellow-400"}`}
    >
      {timeLeft}
    </span>
  );
}

function Web3Escrow() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState("view");
  
  // View Agreement
  const [viewId, setViewId] = useState("");

  const contractAddress = ESCROW_CA[chainId as number];

  // Read Stats
  const { data: stats } = useReadContract({
    address: contractAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getStats",
  });

  // Read Agreement (used for both view & manage)
  const { data: agreement, refetch: refetchAgreement } = useReadContract({
    address: contractAddress,
    abi: ESCROW_ABI.abi,
    functionName: "getAgreement",
    args: viewId ? [BigInt(viewId)] : undefined,
    query: { enabled: !!viewId },
  });

  // Token decimals for manage tab
  const { data: manageTokenDecimals } = useReadContract({
    address:
      agreement && agreement[4] !== ZERO_ADDRESS
        ? (agreement[4] as `0x${string}`)
        : undefined,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
    query: {
      enabled: !!agreement && agreement[4] !== ZERO_ADDRESS,
    },
  });

  const { data: manageTokenSymbol } = useReadContract({
    address:
      agreement && agreement[4] !== ZERO_ADDRESS
        ? (agreement[4] as `0x${string}`)
        : undefined,
    abi: ERC20_ABI.abi,
    functionName: "symbol",
    query: {
      enabled: !!agreement && agreement[4] !== ZERO_ADDRESS,
    },
  });

  // Safe getters for agreement fields
  const getField = useCallback(
    (idx: number): unknown => {
      if (!agreement) return undefined;
      if (agreement.length <= idx) return undefined;
      return agreement[idx];
    },
    [agreement],
  );

  const getBigIntField = useCallback(
    (idx: number): bigint => {
      const v = getField(idx);
      if (v === undefined || v === null) return 0n;
      try {
        // handle both BigInt and numeric strings
        if (typeof v === "bigint") return v;
        if (typeof v === "string") return BigInt(v);
        // some libs return objects with toString
        return BigInt(v.toString());
      } catch {
        return 0n;
      }
    },
    [getField],
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 lg:px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-cyan-300">Escrow Center</h1>
          </div>
        </div>

        {/* <ConnectButton /> */}
        {!isConnected ? (
          <div className="card-cyan glass mx-auto mt-20 max-w-[1000px] rounded-xl p-4 lg:p-8">
            <div className="flex flex-col justify-center text-center">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Welcome to Escrow Platform
              </h2>
              <p className="mx-auto mb-6 max-w-[600px] text-cyan-200/80">
                Connect your wallet to create and manage secure escrow
                agreements with milestone-based payments, dispute resolution,
                and automated releases.
              </p>
              <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-4">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
                  <h3 className="font-semibold text-green-300">
                    Secure Payments
                  </h3>
                  <p className="text-sm text-green-200/70">
                    Funds held in escrow until conditions are met
                  </p>
                </div>
                <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-4">
                  <Package className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                  <h3 className="font-semibold text-blue-300">
                    Milestone Tracking
                  </h3>
                  <p className="text-sm text-blue-200/70">
                    Release payments as work progresses
                  </p>
                </div>
                <div className="rounded-lg border border-purple-400/30 bg-purple-500/10 p-4">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                  <h3 className="font-semibold text-purple-300">
                    Dispute Resolution
                  </h3>
                  <p className="text-sm text-purple-200/70">
                    Fair resolution process for disagreements
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Dashboard */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                <p className="text-sm text-cyan-300">Total Agreements</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats[0].toString() : "0"}
                </p>
              </div>
              <div className="glass rounded-xl border border-purple-400/30 bg-gradient-to-br from-purple-500/20 to-transparent p-4">
                <p className="text-sm text-purple-300">Total Disputes</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats[1].toString() : "0"}
                </p>
              </div>
              <div className="glass rounded-xl border border-green-400/30 bg-gradient-to-br from-green-500/20 to-transparent p-4">
                <p className="text-sm text-green-300">Smooth Completions</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats[2].toString() : "0"}
                </p>
              </div>
              <div className="glass rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-transparent p-4">
                <p className="text-sm text-yellow-300">Fees Collected</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? formatEther(stats[3]).slice(0, 6) : "0"} ETH
                </p>
              </div>
              <div className="glass rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-transparent p-4">
                <p className="text-sm text-blue-300">Escrowed ETH</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? formatEther(stats[4]).slice(0, 6) : "0"} ETH
                </p>
              </div>
            </div>


            {/* Tabs
            <div className="mb-6 flex gap-2 border-b border-cyan-400/30">
              {["view"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === tab ? "border-b-2 border-cyan-400 text-cyan-400" : "text-cyan-300 hover:text-cyan-200"}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div> */}

            {/* View Agreement Tab - TRANSFORMED */}
            {activeTab === "view" && (
              <div className="glass max-w-[1000px] rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                <h2 className="mb-6 text-2xl font-bold text-white">
                  View Agreement Details
                </h2>
                <div className="mb-6 flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter Agreement ID"
                      value={viewId}
                      onChange={(e) => setViewId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-cyan-300/50 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
                    />
                  </div>
                  <Button
                    onClick={() => refetchAgreement()}
                    className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
                    variant="outline"
                  >
                    Fetch Details
                  </Button>
                </div>

                {agreement && (
                  <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
                    <h3 className="mb-4 text-xl font-bold text-white">
                      Agreement Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        {
                          label: "ID",
                          value: agreement[0].toString(),
                          icon: FileText,
                        },
                        {
                          label: "Creator",
                          value: agreement[1].toString(),
                          icon: Users,
                        },
                        {
                          label: "serviceProvider",
                          value: agreement[2].toString(),
                          icon: UserCheck,
                        },
                        {
                          label: "serviceRecipient",
                          value: agreement[3].toString(),
                          icon: Users,
                        },
                        {
                          label: "token",
                          value: agreement[4].toString(),
                          icon: DollarSign,
                        },
                        {
                          label: "Amount",
                          value: `${formatAmount(getBigIntField(5), manageTokenDecimals as unknown as number)} ${agreement[4] === ZERO_ADDRESS ? "ETH" : manageTokenSymbol}`,
                          icon: DollarSign,
                        },
                        {
                          label: "Remaining",
                          value: `${formatAmount(getBigIntField(6), manageTokenDecimals as unknown as number)} ${agreement[4] === ZERO_ADDRESS ? "ETH" : manageTokenSymbol}`,
                          icon: DollarSign,
                        },
                        {
                          label: "createdAt",
                          value: agreement[7].toString(),
                          icon: Calendar,
                        },
                        {
                          label: "deadline",
                          value: agreement[8].toString(),
                          icon: Clock,
                        },
                        {
                          label: "deadlineDuration",
                          value: agreement[9].toString(),
                          icon: Clock,
                        },
                        {
                          label: "grace1Ends",
                          value: (
                            <span>
                              {agreement[10].toString()}
                              {getBigIntField(10) > 0n && (
                                <span className="ml-2">
                                  (
                                  <CountdownTimer
                                    targetTimestamp={getBigIntField(10)}
                                    onComplete={refetchAgreement}
                                  />
                                  )
                                </span>
                              )}
                            </span>
                          ),
                          icon: Clock,
                        },
                        {
                          label: "grace2Ends",
                          value: (
                            <span>
                              {agreement[11].toString()}
                              {getBigIntField(11) > 0n && (
                                <span className="ml-2">
                                  (
                                  <CountdownTimer
                                    targetTimestamp={getBigIntField(11)}
                                    onComplete={refetchAgreement}
                                  />
                                  )
                                </span>
                              )}
                            </span>
                          ),
                          icon: Clock,
                        },
                        {
                          label: "grace1EndsCalledBy",
                          value: agreement[12].toString(),
                          icon: Users,
                        },
                        {
                          label: "grace2EndsCalledBy",
                          value: agreement[13].toString(),
                          icon: Users,
                        },
                        {
                          label: "funded",
                          value: agreement[14].toString(),
                          icon: DollarSign,
                        },
                        {
                          label: "signed",
                          value: agreement[15].toString(),
                          icon: FileText,
                        },
                        {
                          label: "acceptedByServiceProvider",
                          value: agreement[16].toString(),
                          icon: UserCheck,
                        },
                        {
                          label: "acceptedByServiceRecipient",
                          value: agreement[17].toString(),
                          icon: UserCheck,
                        },
                        {
                          label: "completed",
                          value: agreement[18].toString(),
                          icon: CheckCircle,
                        },
                        {
                          label: "disputed",
                          value: agreement[19].toString(),
                          icon: AlertTriangle,
                        },
                        {
                          label: "privateMode",
                          value: agreement[20].toString(),
                          icon: Lock,
                        },
                        {
                          label: "frozen",
                          value: agreement[21].toString(),
                          icon: Shield,
                        },
                        {
                          label: "pendingCancellation",
                          value: agreement[22].toString(),
                          icon: Ban,
                        },
                        {
                          label: "orderCancelled",
                          value: agreement[23].toString(),
                          icon: XCircle,
                        },
                        {
                          label: "Vesting State",
                          value: agreement[24].toString(),
                          icon: Package,
                        },
                        {
                          label: "deliverySubmitted",
                          value: agreement[25].toString(),
                          icon: PackageCheck,
                        },
                        {
                          label: "votingId",
                          value: agreement[26].toString(),
                          icon: FileText,
                        },
                        {
                          label: "vote Started At",
                          value: agreement[27].toString(),
                          icon: FileText,
                        },
                        {
                          label: "plaintiff",
                          value: agreement[28].toString(),
                          icon: FileText,
                        },
                        {
                          label: "defendant",
                          value: agreement[29].toString(),
                          icon: FileText,
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 rounded-lg border border-white/10 bg-white/5 p-3"
                        >
                          <item.icon className="mt-0.5 h-4 w-4 text-cyan-400" />
                          <div>
                            <div className="text-sm text-cyan-300">
                              {item.label}:
                            </div>
                            <div className="font-mono text-xs break-all text-white">
                              {item.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Web3Escrow;