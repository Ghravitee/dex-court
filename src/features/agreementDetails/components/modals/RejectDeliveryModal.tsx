/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import {
  X,
  AlertTriangle,
  Scale,
  Wallet,
  Info,
  Ban,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { useAuth } from "../../../../hooks/useAuth";
import { DisputeTypeEnum, type DisputeTypeEnumValue } from "../../types/index";
import {
  isCurrentUserFirstParty,
  formatCreatorUsername,
} from "../../utils/helpers";
import { useChainSelection } from "../../../../config/useChainSelection";
import { useAccount, useSwitchChain } from "wagmi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    claim: string,
    requestKind: DisputeTypeEnumValue,
    chainId?: number,
    votingId?: string,
    transactionHash?: string,
  ) => Promise<void>;
  claim: string;
  setClaim: (claim: string) => void;
  isSubmitting: boolean;
  agreement: any;
}

export const RejectDeliveryModal = ({
  isOpen,
  onClose,
  onConfirm,
  claim,
  setClaim,
  isSubmitting,
  agreement,
}: Props) => {
  const [requestKind, setRequestKind] = useState<DisputeTypeEnumValue | null>(
    null,
  );

  const { isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { resolveChainId, displayChains, isProd } = useChainSelection();
  const [selectedMainnetId, setSelectedMainnetId] = useState<number | null>(
    null,
  );

  const { user: currentUser } = useAuth();

  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const handleSelectChain = async (mainnetId: number) => {
    if (isSwitchingChain) return; // prevent duplicate requests

    setIsSwitchingChain(true);
    setSelectedMainnetId(mainnetId); // optimistic update
    const resolved = resolveChainId(mainnetId);
    try {
      await switchChainAsync({ chainId: resolved });
    } catch (err: any) {
      // -32002 means MetaMask already has a pending request
      if (err?.code === -32002) {
        toast.error("MetaMask is busy", {
          description:
            "Please open MetaMask and complete the pending request first.",
        });
      } else {
        toast.error("Failed to switch chain");
      }
      setSelectedMainnetId(null); // revert optimistic update
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const resolvedChainId = selectedMainnetId
    ? resolveChainId(selectedMainnetId)
    : null;

  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }, []);

  const getDefendant = () => {
    if (!agreement || !currentUser) return "Unknown";
    const isFirstParty = isCurrentUserFirstParty(agreement, currentUser);
    const raw = isFirstParty ? agreement.counterparty : agreement.createdBy;
    return formatCreatorUsername(raw);
  };

  const defendant = getDefendant();

  const handleSubmit = async () => {
    if (!requestKind) {
      toast.error("Please select a dispute type");
      return;
    }
    if (!claim.trim()) {
      toast.error("Claim description is required");
      return;
    }
    if (requestKind === DisputeTypeEnum.Paid) {
      if (!isConnected) {
        toast.error("Wallet required", {
          description: "Please connect your wallet to create a paid dispute.",
        });
        return;
      }
      if (!selectedMainnetId || !resolvedChainId) {
        toast.error("Please select a network");
        return;
      }
    }
    try {
      await onConfirm(
        claim,
        requestKind,
        resolvedChainId ?? undefined,
        votingIdToUse.toString(),
      );
      setClaim("");
      onClose();
    } catch (error: any) {
      toast.error("Failed to create dispute", {
        description: error.message || "Please try again.",
        duration: 5000,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-black/90 p-6 shadow-2xl sm:max-w-[40rem]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
            <AlertTriangle className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Reject Delivery & Open Dispute
            </h2>
            <p className="text-sm text-red-300">
              This will create a dispute with the other party
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
          <h4 className="mb-2 text-base font-medium text-purple-300">
            Summary
          </h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-sm text-purple-200/80">
                Agreement Title:
              </span>
              <p className="text-sm font-medium break-words text-white">
                {agreement?.title || "No title"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-purple-200/80">
                Agreement Description:
              </span>
              <p className="text-sm break-words whitespace-pre-line text-white/90">
                {agreement?.description || "No description provided"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-purple-200/80">Defendant</span>
              <p className="text-sm break-words whitespace-pre-line text-white/90">
                {defendant}
              </p>
            </div>
          </div>
        </div>

        {/* Dispute type selection */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-purple-300">
            Dispute Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                kind: DisputeTypeEnum.ProBono,
                Icon: Scale,
                label: "Pro Bono",
                sub: "Free dispute resolution",
                activeClass: "border-cyan-400/40 bg-cyan-500/20 text-cyan-200",
              },
              {
                kind: DisputeTypeEnum.Paid,
                Icon: Wallet,
                label: "Paid",
                sub: "Priority resolution",
                activeClass:
                  "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
              },
            ].map(({ kind, Icon, label, sub, activeClass }) => (
              <label
                key={kind}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-4 text-center transition ${
                  requestKind === kind
                    ? activeClass
                    : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="disputeType"
                  className="hidden"
                  checked={requestKind === kind}
                  onChange={() => setRequestKind(kind)}
                />
                <Icon className="h-5 w-5" />
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs opacity-80">{sub}</div>
                </div>
              </label>
            ))}
          </div>

          {/* ── Chain selector (only for Paid disputes) ─────────── */}
          {requestKind === DisputeTypeEnum.Paid && (
            <div>
              <label className="text-muted-foreground mb-3 block text-sm font-semibold">
                Select Network <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {displayChains.map((chain) => (
                  <button
                    key={chain.mainnetId}
                    type="button"
                    onClick={() => handleSelectChain(chain.mainnetId)}
                    disabled={isSwitchingChain}
                    className={`relative flex flex-col ${isSwitchingChain ? "cursor-wait opacity-60" : "rounded-lg border border-purple-500/30 py-2"}`}
                  >
                    <img
                      src={chain.icon}
                      alt={chain.name}
                      className="mx-auto h-8 w-8 rounded-full"
                    />
                    <span className="text-xs font-medium">{chain.name}</span>
                    <span className="text-[10px] opacity-60">
                      {isProd ? chain.symbol : `${chain.symbol} Testnet`}
                    </span>
                    {selectedMainnetId === chain.mainnetId &&
                      (isSwitchingChain ? (
                        <Loader2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <CheckCircle className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-cyan-400" />
                      ))}
                  </button>
                ))}
              </div>
              {!selectedMainnetId && (
                <div className="mt-1 text-xs text-red-400">
                  Please select a network
                </div>
              )}

              {/* Wallet warning */}
              {!isConnected && (
                <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/5 p-3 text-xs text-amber-300">
                  ⚠️ You need to connect and authenticate your wallet to create
                  a paid dispute.
                </div>
              )}
            </div>
          )}

          <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
              <div className="text-xs text-cyan-200">
                {requestKind === DisputeTypeEnum.ProBono ? (
                  <span>
                    <span className="font-medium">Pro Bono:</span> No fee
                    required. Judges will handle your case when available.
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">Paid:</span> A fee is required
                    to prioritize your case and notify all judges immediately.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Paid dispute wallet info */}
        {requestKind === DisputeTypeEnum.Paid && (
          <div className="mb-6 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-300" />
              <h4 className="text-sm font-medium text-emerald-200">
                Smart Contract Transaction Required
              </h4>
            </div>
            <p className="mt-2 text-xs text-emerald-300/80">
              For paid disputes, you'll need to confirm a transaction in your
              wallet after creating the dispute.
            </p>
            <div className="mt-3 text-xs text-emerald-400">
              <div className="flex items-center gap-1">
                <span>•</span>
                <span>
                  Network:{" "}
                  {displayChains.find((c) => c.mainnetId === selectedMainnetId)
                    ?.name ?? "Not selected"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Claim */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-muted-foreground text-sm">
              Claim <span className="text-red-500">*</span>
            </label>
            <div className="group relative cursor-help">
              <Info className="h-4 w-4 text-cyan-300" />
              <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                Make sure it's reasonable, as that might help your case when the
                judges look into it.
              </div>
            </div>
          </div>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Describe why you're rejecting this delivery (optional)"
            className="h-32 w-full rounded-lg border border-purple-500/30 bg-black/50 p-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            You can add more details and evidence on the dispute page.
          </p>
        </div>

        {/* What will happen */}
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
            <div className="text-xs">
              <p className="font-medium text-yellow-300">What will happen:</p>
              <ul className="mt-1 space-y-1 text-yellow-200/80">
                <li>• Dispute will be created with {defendant}</li>
                <li>
                  • Type:{" "}
                  {requestKind === DisputeTypeEnum.ProBono
                    ? "Pro Bono"
                    : "Paid"}
                </li>
                {requestKind === DisputeTypeEnum.Paid && (
                  <li>
                    • Smart contract transaction will be required after creation
                  </li>
                )}
                <li>• You can add evidence, witnesses in the Dispute page</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className={`w-full py-2 sm:w-auto ${
              requestKind === DisputeTypeEnum.Paid
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400 hover:bg-purple-500/20"
            }`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Dispute...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Reject & Open Dispute
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
