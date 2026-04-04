import { Info, Server } from "lucide-react";
import { useAccount } from "wagmi";
import { ESCROW_CA } from "../../../../web3/config";

interface NetworkWarningProps {
  chainConfigError: string | null;
}

export function NetworkWarning({ chainConfigError }: NetworkWarningProps) {
  const { isConnected } = useAccount();
  if (!isConnected || !chainConfigError) return null;

  return (
    <div className="mb-4 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-400" />
        <div>
          <h4 className="text-sm font-medium text-orange-300">Unsupported Network</h4>
          <p className="mt-1 text-xs text-orange-300/80">{chainConfigError}</p>
          <p className="mt-2 text-xs text-orange-200/60">
            Supported networks:{" "}
            {Object.keys(ESCROW_CA)
              .map((id) => `Chain ${id}`)
              .join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ContractFilterInfoProps {
  contractAddress?: string;
  networkChainId?: number;
}

export function ContractFilterInfo({
  contractAddress,
  networkChainId,
}: ContractFilterInfoProps) {
  if (!contractAddress) return null;

  return (
    <div className="mb-4 hidden w-fit rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
      <div className="flex items-start gap-2">
        <Server className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
        <div>
          <h4 className="text-sm font-medium text-cyan-300">Filtered by Contract Address</h4>
          <p className="mt-1 font-mono text-xs text-cyan-300/80">
            {contractAddress.slice(0, 20)}...{contractAddress.slice(-20)}
          </p>
          <p className="mt-2 text-xs text-cyan-200/60">
            Showing escrows using the current contract version on chain {networkChainId}
          </p>
        </div>
      </div>
    </div>
  );
}
