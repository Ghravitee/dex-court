import { ExternalLink } from "lucide-react";
import { shortAddress } from "../types";

export function ContractHeader({
    title,
    address,
    explorerUrl,
}: {
    title: string;
    address: string;
    explorerUrl: string;
}) {
    return (
        <div className="mb-4 flex items-start justify-between border-b border-white/10 pb-4">
            <div>
                <h3 className="text-sm font-semibold text-white/90">{title}</h3>
                <p className="mt-0.5 font-mono text-xs text-white/30">
                    {shortAddress(address)}
                </p>
            </div>
            <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
            >
                <ExternalLink size={10} />
                Explorer
            </a>
        </div>
    );
}