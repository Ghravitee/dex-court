import { Link } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import type { DisputeRow } from "../../../types";

interface Props {
  agreement: NonNullable<DisputeRow["agreement"]>;
}

export const SourceAgreementCard = ({ agreement }: Props) => (
  <div className="rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-transparent p-4">
    <div className="space-y-4">
      <div className="px-4">
        <h2>Source Agreement</h2>
        <div className="flex flex-col justify-between gap-2">
          <div>
            <h4 className="mb-2 font-bold text-cyan-400 lg:text-[22px]">
              {agreement.title || `Agreement #${agreement.id}`}
            </h4>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                  agreement.type === 2
                    ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border border-blue-400/30 bg-blue-500/10 text-blue-300"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                {agreement.type === 2
                  ? "Escrow Agreement"
                  : "Reputational Agreement"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={
                agreement.type === 2
                  ? `/escrow/${agreement.id}`
                  : `/agreements/${agreement.id}`
              }
              className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-500/30 hover:text-white"
            >
              <FileText className="h-4 w-4" />
              View Source Agreement
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);
