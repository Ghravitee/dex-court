import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../components/UserAvatar";
import { formatWalletAddress, resolveTokenDisplay } from "../utils/formatters";
import type { OnChainEscrowData } from "../types";
import { SUPPORTED_CHAINS } from "../../../web3/config";

interface EscrowCardProps {
  escrow: OnChainEscrowData;
}

function PartyInfo({
  label,
  wallet,
  details,
  color,
}: {
  label: string;
  wallet: string;
  details?: OnChainEscrowData["payerDetails"];
  color: "cyan" | "pink";
}) {
  const colorClass = color === "cyan" ? "text-cyan-300/90" : "text-pink-300/90";
  const borderClass =
    color === "cyan" ? "border-cyan-500/20" : "border-pink-500/20";

  return (
    <div>
      <div className="text-muted-foreground mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <UserAvatar
          userId={details?.id?.toString() || wallet}
          avatarId={details?.avatarId || null}
          username={details?.username || wallet}
          size="md"
          className={`border ${borderClass}`}
        />
        <div className="min-w-0">
          <div className={`font-medium ${colorClass}`}>
            {formatWalletAddress(wallet)}
          </div>
          {details?.telegramUsername && (
            <div className="flex items-center gap-[1px] text-xs text-white">
              <span className="opacity-70">@</span>
              {details.telegramUsername}
            </div>
          )}
          {!details?.telegramUsername && details?.username && (
            <div className="truncate text-xs text-gray-400">
              {details.username.startsWith("0x") &&
                details.username.length === 42
                ? `${details.username.slice(0, 6)}...${details.username.slice(-4)}`
                : details.username}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-yellow",
  signed: "badge-blue",
  pending_approval: "badge-orange",
  completed: "badge-green",
  disputed: "badge-purple",
  cancelled: "badge-red",
  expired: "badge-gray",
};

export function EscrowCard({ escrow: e }: EscrowCardProps) {
  const tokenDisplay = resolveTokenDisplay(e.token, e.chainId);
  const chain = SUPPORTED_CHAINS.find(
    (c) => c.mainnetId === e.chainId || c.testnetId === e.chainId,
  );

  return (
    <Link
      to={`/escrow/${e.id}`}
      className="web3-corner-border group relative rounded-3xl p-[2px]"
    >
      <div className="flex h-full flex-col rounded-[1.4rem] bg-black/40 p-8 shadow-[0_0_40px_#00eaff20] backdrop-blur-xl transition-all duration-500 group-hover:shadow-[0_0_70px_#00eaff40]">
        <div>
          <div className="mb-4 min-h-[3.5rem]">
            <h3 className="line-clamp-2 text-lg font-semibold tracking-wide text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              {e.title}
            </h3>
            {/* Chain badge */}
            {chain && (
              <div className="ml-2 flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                <img
                  src={chain.icon}
                  alt={chain.name}
                  className="h-4 w-4 rounded-full"
                />
                <span className="text-xs text-white/60">{chain.name}</span>
              </div>
            )}
          </div>

          <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <PartyInfo
              label="Payer"
              wallet={e.from}
              details={e.payerDetails}
              color="cyan"
            />
            <PartyInfo
              label="Payee"
              wallet={e.to}
              details={e.payeeDetails}
              color="pink"
            />
            <div>
              <div className="text-muted-foreground">Amount</div>
              <div className="flex items-center gap-1.5 font-bold text-green-500/90">
                {chain && (
                  <img src={chain.icon} alt={chain.name} className="h-4 w-4 rounded-full" />
                )}
                {e.amount} {tokenDisplay}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground">Status</div>
              <span
                className={`badge w-fit ${STATUS_BADGE[e.status] ?? "badge-orange"}`}
              >
                {e.status === "pending_approval"
                  ? "Pending Approval"
                  : e.status.charAt(0).toUpperCase() + e.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 min-h-[2.5rem]">
          <p className="line-clamp-2 text-sm text-gray-300/70">
            {e.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-muted-foreground text-xs">
            {e.onChainDeadline
              ? `Deadline: ${new Date(Number(e.onChainDeadline) * 1000).toLocaleDateString()}`
              : `Deadline: ${e.deadline}`}
          </div>
          <Button
            variant="outline"
            className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
          >
            <Eye className="mr-2 h-4 w-4" /> View
          </Button>
        </div>
      </div>
    </Link>
  );
}
