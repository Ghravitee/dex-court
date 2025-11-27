/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Clock,
  Eye,
  // EyeOff,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Globe,
  Lock,
  Package,
  // Ban,
  // Send,
  // ThumbsUp,
  // ThumbsDown,
  // PackageCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { UserAvatar } from "../components/UserAvatar";
import { VscVerifiedFilled } from "react-icons/vsc";
import { FaArrowRightArrowLeft } from "react-icons/fa6";

// Use the same services as Escrow.tsx
import { agreementService } from "../services/agreementServices";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { getAgreement } from "../web3/readContract";
import { ERC20_ABI, ZERO_ADDRESS } from "../web3/config";
import { formatAmount } from "../web3/helper";
import { useReadContract } from "wagmi";

// API Enum Mappings (from your Escrow.tsx)
const AgreementTypeEnum = {
  REPUTATION: 1,
  ESCROW: 2,
} as const;

const AgreementVisibilityEnum = {
  PRIVATE: 1,
  PUBLIC: 2,
  AUTO_PUBLIC: 3,
} as const;

const AgreementStatusEnum = {
  PENDING_ACCEPTANCE: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
  PARTY_SUBMITTED_DELIVERY: 7,
} as const;

// Helper function to convert API status to frontend status
const apiStatusToFrontend = (status: number): string => {
  switch (status) {
    case AgreementStatusEnum.PENDING_ACCEPTANCE:
      return "pending";
    case AgreementStatusEnum.ACTIVE:
      return "active";
    case AgreementStatusEnum.COMPLETED:
      return "completed";
    case AgreementStatusEnum.DISPUTED:
      return "disputed";
    case AgreementStatusEnum.CANCELLED:
    case AgreementStatusEnum.EXPIRED:
      return "cancelled";
    case AgreementStatusEnum.PARTY_SUBMITTED_DELIVERY:
      return "pending_approval";
    default:
      return "pending";
  }
};

// IMPROVED: Better wallet address extraction that checks multiple possible fields
const getWalletAddressFromParty = (party: any): string => {
  if (!party) return "Unknown";

  // Check multiple possible field names for wallet address
  const walletAddress =
    party?.walletAddress ||
    party?.username ||
    party?.wallet ||
    party?.WalletAddress ||
    party?.address;

  if (walletAddress) return walletAddress;

  // If no wallet address found, try to use telegram username or other identifier
  const telegramUsername = party?.telegramUsername || party?.username;
  if (telegramUsername) {
    return telegramUsername.startsWith("@")
      ? telegramUsername
      : `@${telegramUsername}`;
  }

  return "Unknown";
};

// Helper function to get user ID from party data
const getUserIdFromParty = (party: any) => {
  return party?.id?.toString();
};

// Helper function to extract avatar ID from party data
const getAvatarIdFromParty = (party: any): number | null => {
  const avatarId = party?.avatarId || party?.avatar?.id;
  return avatarId ? Number(avatarId) : null;
};

// Format date with time
const formatDateWithTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format number with commas
const formatNumberWithCommas = (value: string | undefined): string => {
  if (!value) return "";
  const numericValue = value.replace(/,/g, "");
  const parts = numericValue.split(".");
  let wholePart = parts[0];
  const decimalPart = parts[1] || "";

  if (wholePart) {
    wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart;
};

// Format wallet address for display
const formatWalletAddress = (address: string): string => {
  if (!address || address === "Unknown") return "Unknown";
  if (address.startsWith("@") || address.length <= 15) {
    return address;
  }
  if (address.startsWith("0x") && address.length === 42) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return address;
};

interface EscrowDetailsData {
  id: string;
  title: string;
  description: string;
  type: "public" | "private";
  from: string; // Service Recipient = Payer
  to: string; // Service Provider = Payee
  status: string;
  dateCreated: string;
  deadline: string;
  amount?: string;
  token?: string;
  includeFunds: "yes" | "no";
  useEscrow: boolean;
  secureTheFunds: boolean;
  escrowAddress?: string;
  files: number;
  images: string[];
  fromAvatarId: number | null;
  toAvatarId: number | null;
  fromUserId: string;
  toUserId: string;
  creator: string;
  creatorUserId: string;
  creatorAvatarId: number | null;
  _raw: any;
}

// Helper badge components for better styling
const StatusBadge = ({ value }: { value: boolean }) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
      value
        ? "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
        : "border border-amber-400/30 bg-amber-500/20 text-amber-300"
    }`}
  >
    <div
      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-emerald-400" : "bg-amber-400"}`}
    ></div>
    {value ? "Yes" : "No"}
  </div>
);

const FeatureBadge = ({ value }: { value: boolean }) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
      value
        ? "border border-blue-400/30 bg-blue-500/20 text-blue-300"
        : "border border-gray-400/30 bg-gray-500/20 text-gray-400"
    }`}
  >
    <div
      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-blue-400" : "bg-gray-400"}`}
    ></div>
    {value ? "Enabled" : "Disabled"}
  </div>
);

const SafetyBadge = ({ value }: { value: boolean }) => (
  <div
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
      value
        ? "border border-rose-400/30 bg-rose-500/20 text-rose-300"
        : "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
    }`}
  >
    <div
      className={`h-1.5 w-1.5 rounded-full ${value ? "bg-rose-400" : "bg-emerald-400"}`}
    ></div>
    {value ? "Yes" : "No"}
  </div>
);

export default function EscrowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [escrow, setEscrow] = useState<EscrowDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  // const [showEscrowAddress, setShowEscrowAddress] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const networkInfo = useNetworkEnvironment();
  const [onChainAgreement, setOnChainAgreement] = useState<any | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);

  // Status configuration
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/30",
      label: "Pending",
      description: "Awaiting deposit and signatures",
    },
    active: {
      icon: Loader2,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/30",
      label: "Active",
      description: "Funds secured, agreement active",
    },
    completed: {
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-400/30",
      label: "Completed",
      description: "Successfully completed and settled",
    },
    disputed: {
      icon: AlertTriangle,
      color: "text-rose-400",
      bgColor: "bg-rose-500/20",
      borderColor: "border-rose-400/30",
      label: "Disputed",
      description: "Under dispute resolution",
    },
    cancelled: {
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-400/30",
      label: "Cancelled",
      description: "Agreement cancelled",
    },
    pending_approval: {
      icon: Package,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-400/30",
      label: "Pending Approval",
      description: "Delivery submitted, awaiting approval",
    },
  };

  // Safe status access
  const getStatusInfo = (status: string) => {
    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
  };

  const fetchOnChainAgreement = useCallback(
    async (agreementData: any) => {
      if (!agreementData) return;
      if (!networkInfo.chainId) {
        console.warn("chainId not available - skipping on-chain fetch");
        return;
      }

      // FIX: Use contractAgreementId instead of the database ID
      const onChainId = agreementData.contractAgreementId;
      if (!onChainId) {
        console.warn("No contractAgreementId found - skipping on-chain fetch");
        return;
      }

      setOnChainLoading(true);
      try {
        const res = await getAgreement(
          networkInfo.chainId as number,
          BigInt(onChainId), // Use the contractAgreementId here
        );
        console.log("📦 On-chain agreement data:", res);
        setOnChainAgreement(res);
      } catch (err) {
        console.error("Failed to fetch on-chain agreement:", err);
        setOnChainAgreement(null);
      } finally {
        setOnChainLoading(false);
      }
    },
    [networkInfo.chainId],
  );

  // Fetch escrow details using agreementService (same as Escrow.tsx)
  const fetchEscrowDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const escrowId = parseInt(id);
      const agreementData =
        await agreementService.getAgreementDetails(escrowId);

      console.log("📋 EscrowDetails API Response:", agreementData);
      console.log(
        "🔍 Contract Agreement ID:",
        agreementData.contractAgreementId,
      );

      // Transform API data to frontend format
      const transformedEscrow: EscrowDetailsData = {
        id: `${agreementData.id}`,
        title: agreementData.title,
        description: agreementData.description,
        type:
          agreementData.visibility === AgreementVisibilityEnum.PRIVATE
            ? "private"
            : "public",
        from: getWalletAddressFromParty(agreementData.counterParty),
        to: getWalletAddressFromParty(agreementData.firstParty),
        status: apiStatusToFrontend(agreementData.status),
        dateCreated: agreementData.createdAt,
        deadline: agreementData.deadline,
        amount: agreementData.amount
          ? agreementData.amount.toString()
          : undefined,
        token: agreementData.tokenSymbol || undefined,
        includeFunds: agreementData.includesFunds ? "yes" : "no",
        useEscrow: agreementData.type === AgreementTypeEnum.ESCROW,
        secureTheFunds: agreementData.hasSecuredFunds || false,
        escrowAddress: agreementData.escrowContract || undefined,
        files: agreementData.files?.length || 0,
        images: agreementData.files?.map((file: any) => file.fileName) || [],
        fromAvatarId: getAvatarIdFromParty(agreementData.counterParty),
        toAvatarId: getAvatarIdFromParty(agreementData.firstParty),
        fromUserId: getUserIdFromParty(agreementData.counterParty),
        toUserId: getUserIdFromParty(agreementData.firstParty),
        creator: getWalletAddressFromParty(agreementData.creator),
        creatorUserId: getUserIdFromParty(agreementData.creator),
        creatorAvatarId: getAvatarIdFromParty(agreementData.creator),
        _raw: agreementData,
      };

      console.log("🔄 Transformed Escrow:", transformedEscrow);

      // FIX: Pass the entire agreementData to fetchOnChainAgreement
      // so it can extract the contractAgreementId
      fetchOnChainAgreement(agreementData).catch((e) => console.warn(e));
      setEscrow(transformedEscrow);
    } catch (error) {
      console.error("Failed to fetch escrow:", error);
      toast.error("Failed to load escrow details");
      setEscrow(null);
    } finally {
      setLoading(false);
    }
  }, [id, fetchOnChainAgreement]);

  // Background refresh
  const fetchEscrowDetailsBackground = useCallback(async () => {
    if (isRefreshing || !id) return;

    setIsRefreshing(true);
    try {
      const escrowId = parseInt(id);
      const agreementData =
        await agreementService.getAgreementDetails(escrowId);

      // Transform API data to frontend format
      const transformedEscrow: EscrowDetailsData = {
        id: `${agreementData.id}`,
        title: agreementData.title,
        description: agreementData.description,
        type:
          agreementData.visibility === AgreementVisibilityEnum.PRIVATE
            ? "private"
            : "public",
        from: getWalletAddressFromParty(agreementData.counterParty),
        to: getWalletAddressFromParty(agreementData.firstParty),
        status: apiStatusToFrontend(agreementData.status),
        dateCreated: agreementData.createdAt,
        deadline: agreementData.deadline,
        amount: agreementData.amount
          ? agreementData.amount.toString()
          : undefined,
        token: agreementData.tokenSymbol || undefined,
        includeFunds: agreementData.includesFunds ? "yes" : "no",
        useEscrow: agreementData.type === AgreementTypeEnum.ESCROW,
        secureTheFunds: agreementData.hasSecuredFunds || false,
        escrowAddress: agreementData.escrowContract || undefined,
        files: agreementData.files?.length || 0,
        images: agreementData.files?.map((file: any) => file.fileName) || [],
        fromAvatarId: getAvatarIdFromParty(agreementData.counterParty),
        toAvatarId: getAvatarIdFromParty(agreementData.firstParty),
        fromUserId: getUserIdFromParty(agreementData.counterParty),
        toUserId: getUserIdFromParty(agreementData.firstParty),
        creator: getWalletAddressFromParty(agreementData.creator),
        creatorUserId: getUserIdFromParty(agreementData.creator),
        creatorAvatarId: getAvatarIdFromParty(agreementData.creator),
        _raw: agreementData,
      };

      setEscrow(transformedEscrow);

      // FIX: Also update on-chain data in background refresh
      fetchOnChainAgreement(agreementData).catch((e) => console.warn(e));
    } catch (error) {
      console.error("Background escrow fetch failed:", error);
    } finally {
      setIsRefreshing(false);
      setLastUpdate(Date.now());
    }
  }, [id, isRefreshing, fetchOnChainAgreement]);

  useEffect(() => {
    fetchEscrowDetails();
  }, [id, fetchEscrowDetails]);

  // Polling for updates
  useEffect(() => {
    if (!id) return;

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible" && !isRefreshing) {
        fetchEscrowDetailsBackground();
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [id, isRefreshing, fetchEscrowDetailsBackground]);

  const tokenAddress =
    onChainAgreement &&
    onChainAgreement.token &&
    onChainAgreement.token !== ZERO_ADDRESS
      ? (onChainAgreement.token as `0x${string}`)
      : undefined;

  const { data: onChainTokenDecimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
    query: { enabled: !!tokenAddress },
  });

  const { data: onChainTokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI.abi,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const decimalsNumber =
    typeof onChainTokenDecimals === "number"
      ? onChainTokenDecimals
      : Number(onChainTokenDecimals ?? 18);

  const tokenSymbol =
    (onChainTokenSymbol as unknown as string) ??
    (onChainAgreement?.token === ZERO_ADDRESS
      ? "ETH"
      : (escrow?.token ?? "TOKEN"));

  // helper to format bigints from on-chain data
  const formatOnChainAmount = (amt: bigint | number | string | undefined) => {
    try {
      if (amt === undefined || amt === null) return "";
      // ensure bigint
      const a = typeof amt === "bigint" ? amt : BigInt(amt);
      return formatAmount(a, decimalsNumber);
    } catch {
      return String(amt);
    }
  };

  // Role detection
  // Role detection - FIXED
  // Role detection using ON-CHAIN data - FIXED
  const isCounterparty =
    onChainAgreement && user
      ? user.walletAddress?.toLowerCase() ===
        onChainAgreement.serviceProvider?.toLowerCase()
      : false;

  const isFirstParty =
    onChainAgreement && user
      ? user.walletAddress?.toLowerCase() ===
        onChainAgreement.serviceRecipient?.toLowerCase()
      : false;

  const isCreator =
    onChainAgreement && user
      ? user.walletAddress?.toLowerCase() ===
        onChainAgreement.creator?.toLowerCase()
      : false;

  const isParticipant = isFirstParty || isCounterparty;

  console.log("Role debug with on-chain data:", {
    isFirstParty,
    isCounterparty,
    isCreator,
    isParticipant,
    userWallet: user?.walletAddress,
    onChainServiceProvider: onChainAgreement?.serviceProvider,
    onChainServiceRecipient: onChainAgreement?.serviceRecipient,
    onChainCreator: onChainAgreement?.creator,
  });

  console.log("Role debug:", {
    isFirstParty,
    isCounterparty,
    isCreator,
    isParticipant,
    userWallet: user?.walletAddress,
    firstParty: escrow?._raw?.firstParty,
    counterParty: escrow?._raw?.counterParty,
    creator: escrow?._raw?.creator,
  });

  // Calculate days remaining
  const daysRemaining = escrow
    ? Math.ceil(
        (new Date(escrow.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="absolute inset-0 z-[50] rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="text-center">
          <div className="relative mx-auto mb-8">
            <div className="mx-auto size-32 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400"></div>
            <div className="absolute inset-0 mx-auto size-32 animate-ping rounded-full border-2 border-cyan-400/40"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-cyan-300">
              Loading Escrow
            </h3>
            <p className="text-sm text-cyan-200/70">
              Preparing your escrow details...
            </p>
          </div>
          <div className="mt-4 flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="relative min-h-screen p-8">
        <div className="absolute inset-0 -z-10 bg-cyan-500/10 blur-3xl"></div>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="glass rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent p-8">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
            <h2 className="mb-2 text-2xl font-semibold text-white/90">
              Escrow Not Found
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              The escrow you're looking for doesn't exist or may have been
              removed.
            </p>
            <Link to="/escrow">
              <Button variant="neon" className="neon-hover">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Escrows
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(escrow.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 lg:px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center justify-between space-y-4 sm:flex-row">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/escrow")}
              className="border-white/15 text-cyan-200 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Escrows
            </Button>
            <div className="flex items-center space-x-2">
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
              >
                {statusInfo.label}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  isOverdue
                    ? "border border-rose-400/30 bg-rose-500/20 text-rose-300"
                    : isUrgent
                      ? "border border-yellow-400/30 bg-yellow-500/20 text-yellow-300"
                      : "border border-cyan-400/30 bg-cyan-500/20 text-cyan-300"
                }`}
              >
                {isOverdue ? "Overdue" : `${daysRemaining} days left`}
              </span>
            </div>
          </div>

          <div className="flex items-end space-x-2 text-xs text-cyan-400/60 sm:self-end">
            {isRefreshing && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
            )}
            <span>
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Escrow Overview Card */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent px-4 py-6 sm:px-4">
              <div className="mb-6 flex flex-col items-start justify-between sm:flex-row">
                <div>
                  <h1 className="mb-2 max-w-[30rem] text-2xl font-bold text-white lg:text-[1.5rem]">
                    {escrow.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-cyan-300">
                    {escrow.type === "public" ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public Escrow</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Private Escrow</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-cyan-300">Created by</div>
                  <div className="flex items-center justify-end gap-2 font-medium text-white">
                    <UserAvatar
                      userId={escrow.creatorUserId || escrow.creator || ""}
                      avatarId={escrow.creatorAvatarId || null}
                      username={escrow.creator || ""}
                      size="sm"
                    />
                    <span className="text-[11px] text-cyan-300 sm:text-base">
                      {formatWalletAddress(escrow.creator)}
                    </span>
                    {isCreator && (
                      <VscVerifiedFilled className="size-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[.6fr_.4fr]">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Parties</div>
                      <div className="flex items-center gap-2 text-white">
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={escrow.fromUserId || escrow.from}
                            avatarId={escrow.fromAvatarId || null}
                            username={escrow.from}
                            size="sm"
                          />
                          <span className="text-xs text-cyan-300 sm:text-base">
                            {formatWalletAddress(escrow.from)}
                          </span>
                          {isCounterparty && (
                            <VscVerifiedFilled className="size-5 text-green-400" />
                          )}
                        </div>
                        <span className="text-sm text-cyan-400 sm:text-base">
                          <FaArrowRightArrowLeft />
                        </span>
                        <div className="flex items-center gap-1">
                          <UserAvatar
                            userId={escrow.toUserId || escrow.to}
                            avatarId={escrow.toAvatarId || null}
                            username={escrow.to}
                            size="sm"
                          />
                          <span className="text-xs text-cyan-300 sm:text-base">
                            {formatWalletAddress(escrow.to)}
                          </span>
                          {isFirstParty && (
                            <VscVerifiedFilled className="size-5 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Date Created</div>
                      <div className="text-white">
                        {formatDateWithTime(escrow.dateCreated)}
                      </div>
                    </div>
                  </div>
                  {escrow.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Amount</div>
                        <div className="text-white">
                          {formatNumberWithCommas(escrow.amount)} {escrow.token}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Deadline</div>
                      <div className="text-white">
                        {formatDateWithTime(escrow.deadline)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-cyan-300">Escrow Type</div>
                      <div className="text-white capitalize">{escrow.type}</div>
                    </div>
                  </div>
                  {escrow.includeFunds === "yes" && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-sm text-cyan-300">Escrow Used</div>
                        <div className="text-white">
                          {escrow.useEscrow ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Description & Scope
                </h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="leading-relaxed whitespace-pre-line text-white/80">
                    {escrow.description}
                  </p>
                </div>
              </div>

              {/* Complete On-Chain Agreement Details */}
              {/* Complete On-Chain Agreement Details */}
              {onChainAgreement && (
                <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-6 backdrop-blur-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
                        On-Chain Agreement Details
                      </h3>
                      <p className="mt-1 text-sm text-cyan-300/80">
                        Live blockchain data • Contract ID:{" "}
                        {escrow?._raw?.contractAgreementId || "N/A"}
                      </p>
                    </div>
                    <div className="text-xs text-cyan-400/60">
                      {onChainLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        "Live"
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {/* Basic Information Card */}
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold text-cyan-300">
                          Parties & Basic Info
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-cyan-300/80">
                            Creator
                          </div>
                          <div className="rounded bg-cyan-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.creator || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-cyan-300/80">
                            Service Provider
                          </div>
                          <div className="rounded bg-cyan-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.serviceProvider || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-cyan-300/80">
                            Service Recipient
                          </div>
                          <div className="rounded bg-cyan-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.serviceRecipient || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Details Card */}
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-emerald-300">
                          Financial Details
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-emerald-300/80">
                            Token
                          </div>
                          <div className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-sm break-all text-white">
                            {onChainAgreement.token === ZERO_ADDRESS
                              ? "ETH"
                              : onChainAgreement.token}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-emerald-300/80">
                              Amount
                            </div>
                            <div className="font-mono text-sm text-white">
                              {formatOnChainAmount(onChainAgreement.amount)}{" "}
                              {tokenSymbol}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-emerald-300/80">
                              Remaining
                            </div>
                            <div className="font-mono text-sm text-white">
                              {formatOnChainAmount(
                                onChainAgreement.remainingAmount,
                              )}{" "}
                              {tokenSymbol}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-emerald-300/80">
                            Funded
                          </div>
                          <div
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              onChainAgreement.funded
                                ? "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
                                : "border border-yellow-400/30 bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${onChainAgreement.funded ? "bg-emerald-400" : "bg-yellow-400"}`}
                            ></div>
                            {onChainAgreement.funded ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agreement Status Card */}
                    <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <h4 className="text-sm font-semibold text-blue-300">
                          Agreement Status
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Signed
                            </div>
                            <StatusBadge value={onChainAgreement.signed} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Completed
                            </div>
                            <StatusBadge value={onChainAgreement.completed} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Provider Accepted
                            </div>
                            <StatusBadge
                              value={onChainAgreement.acceptedByServiceProvider}
                            />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-blue-300/80">
                              Recipient Accepted
                            </div>
                            <StatusBadge
                              value={
                                onChainAgreement.acceptedByServiceRecipient
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Features Card */}
                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <h4 className="text-sm font-semibold text-purple-300">
                          Timeline & Features
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-purple-300/80">
                            Deadline Duration
                          </div>
                          <div className="rounded bg-purple-500/10 px-2 py-1 font-mono text-sm text-white">
                            {onChainAgreement.deadlineDuration?.toString() ||
                              "N/A"}{" "}
                            seconds
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-purple-300/80">
                              Vesting
                            </div>
                            <FeatureBadge value={onChainAgreement.vesting} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-purple-300/80">
                              Private
                            </div>
                            <FeatureBadge
                              value={onChainAgreement.privateMode}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-purple-300/80">
                            Delivery Submitted
                          </div>
                          <StatusBadge
                            value={onChainAgreement.deliverySubmitted}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dispute & Cancellation Card */}
                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        <h4 className="text-sm font-semibold text-rose-300">
                          Dispute & Safety
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Disputed
                            </div>
                            <SafetyBadge value={onChainAgreement.disputed} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Frozen
                            </div>
                            <SafetyBadge value={onChainAgreement.frozen} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Pending Cancel
                            </div>
                            <SafetyBadge
                              value={onChainAgreement.pendingCancellation}
                            />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-rose-300/80">
                              Cancelled
                            </div>
                            <SafetyBadge
                              value={onChainAgreement.orderCancelled}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-rose-300/80">
                            Voting ID
                          </div>
                          <div className="w-fit rounded bg-rose-500/10 px-2 py-1 font-mono text-sm text-white">
                            {onChainAgreement.votingId?.toString() || "0"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Section */}
            {/* {(isParticipant || isCreator) &&
              escrow?.status !== "completed" &&
              escrow?.status !== "disputed" && (
                <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Escrow Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {escrow.status === "pending" && (
                      <>
                        <Button variant="neon" className="neon-hover">
                          <Send className="mr-2 h-4 w-4" />
                          Sign Agreement
                        </Button>
                        {isCounterparty && (
                          <Button
                            variant="outline"
                            className="border-emerald-400/30 text-emerald-200"
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Deposit Funds
                          </Button>
                        )}
                      </>
                    )}
                    {escrow.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          className="border-emerald-400/30 text-emerald-200"
                        >
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Release Funds
                        </Button>
                        <Button
                          variant="outline"
                          className="border-rose-400/30 text-rose-200"
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Raise Dispute
                        </Button>
                      </>
                    )}
                    {escrow.status === "pending_approval" && (
                      <>
                        <Button
                          variant="outline"
                          className="border-emerald-400/30 text-emerald-200"
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Accept Delivery
                        </Button>
                        <Button
                          variant="outline"
                          className="border-rose-400/30 text-rose-200"
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Reject Delivery
                        </Button>
                      </>
                    )}
                    {(escrow.status === "cancelled" ||
                      escrow.status === "disputed") && (
                      <Button
                        variant="outline"
                        className="border-gray-400/30 text-gray-200"
                        disabled
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        {escrow.status === "cancelled"
                          ? "Cancelled"
                          : "Under Dispute"}
                      </Button>
                    )}
                  </div>
                </div>
              )} */}

            {/* Activity Timeline */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-6 text-lg font-semibold text-white">
                Escrow Timeline
              </h3>

              <div className="flex items-start space-x-8 overflow-x-auto pb-4">
                {/* Step 1 - Escrow Created */}
                <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                  <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300"></div>
                  <div className="mt-3 font-medium text-white">
                    Escrow Created
                  </div>
                  <div className="text-sm text-cyan-300">
                    {formatDateWithTime(escrow.dateCreated)}
                  </div>
                  <div className="mt-1 text-xs text-blue-400/70">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        userId={escrow.creatorUserId || escrow.creator || ""}
                        avatarId={escrow.creatorAvatarId || null}
                        username={escrow.creator || ""}
                        size="sm"
                      />
                      {formatWalletAddress(escrow.creator)}
                      {isCreator && (
                        <VscVerifiedFilled className="size-5 text-green-400" />
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-blue-400/50"></div>
                </div>

                {/* Step 2 - Active/Signed */}
                {[
                  "active",
                  "completed",
                  "disputed",
                  "pending_approval",
                ].includes(escrow.status) && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-blue-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Escrow Active
                    </div>
                    <div className="text-sm text-cyan-300">
                      {formatDateWithTime(escrow.dateCreated)}
                    </div>
                    <div className="mt-1 text-xs text-emerald-400/70">
                      Funds secured in contract
                    </div>
                    <div className="absolute top-2 left-[calc(100%+0.5rem)] h-[2px] w-8 bg-emerald-400/50"></div>
                  </div>
                )}

                {/* Step 3 - Completion/Dispute */}
                {escrow.status === "completed" && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-400"></div>
                    <div className="mt-3 font-medium text-white">Completed</div>
                    <div className="text-sm text-cyan-300">Recently</div>
                  </div>
                )}

                {escrow.status === "disputed" && (
                  <div className="relative flex min-w-[10rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-violet-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Dispute Filed
                    </div>
                    <div className="text-sm text-cyan-300">Recently</div>
                  </div>
                )}

                {escrow.status === "cancelled" && (
                  <div className="relative flex min-w-[12rem] flex-col items-center text-center">
                    <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-400"></div>
                    <div className="mt-3 font-medium text-white">
                      Escrow Cancelled
                    </div>
                    <div className="text-sm text-cyan-300">Recently</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Role Information */}
            {/* Your Role Information */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Your Role
              </h3>
              <div className="space-y-3">
                {/* Show all applicable roles */}
                {isCreator && (
                  <div className="rounded-lg bg-purple-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span className="font-medium text-purple-300">
                        Creator
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-purple-200/80">
                      You created this escrow agreement in the system.
                    </p>
                  </div>
                )}
                {isFirstParty && (
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-blue-300">
                        Service Recipient (Payer)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-200/80">
                      You receive the service and provide payment secured in
                      escrow.
                    </p>
                  </div>
                )}
                {isCounterparty && (
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-300">
                        Service Provider (Payee)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-green-200/80">
                      You provide the service and receive payment upon
                      completion.
                    </p>
                  </div>
                )}
                {!isFirstParty && !isCounterparty && !isCreator && (
                  <div className="rounded-lg bg-gray-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-300">Viewer</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-200/80">
                      You are viewing this escrow agreement.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Information */}
            <div className="glass rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Contract Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Created</span>
                  <span className="text-white">
                    {formatDateWithTime(escrow.dateCreated)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-300">Deadline</span>
                  <span className="text-white">
                    {formatDateWithTime(escrow.deadline)}
                  </span>
                </div>
                {escrow.status === "completed" && (
                  <div className="flex justify-between">
                    <span className="text-emerald-300">Completed</span>
                    <span className="text-emerald-300">Recently</span>
                  </div>
                )}
                {escrow.status === "disputed" && (
                  <div className="flex justify-between">
                    <span className="text-purple-300">Dispute Filed</span>
                    <span className="text-purple-300">Recently</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
