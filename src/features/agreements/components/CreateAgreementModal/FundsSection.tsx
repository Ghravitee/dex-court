import { useRef, useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { TOKEN_OPTIONS } from "../../constants/enums";
import {
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../../utils/formatters";
import type { FormValidation } from "../../types/form";

interface FundsWithoutEscrow {
  token: string;
  amount: string;
  customTokenAddress: string;
}

interface Props {
  includeFunds: "yes" | "no" | "";
  setIncludeFunds: (v: "yes" | "no" | "") => void;
  secureWithEscrow: "yes" | "no" | "";
  setSecureWithEscrow: (v: "yes" | "no" | "") => void;
  selectedToken: string;
  setSelectedToken: (v: string) => void;
  customTokenAddress: string;
  setCustomTokenAddress: (v: string) => void;
  fundsWithoutEscrow: FundsWithoutEscrow;
  setFundsWithoutEscrow: React.Dispatch<
    React.SetStateAction<FundsWithoutEscrow>
  >;
  validation: FormValidation;
  updateValidation: (field: keyof FormValidation, value: string) => void;
}

export const FundsSection = ({
  includeFunds,
  setIncludeFunds,
  fundsWithoutEscrow,
  setFundsWithoutEscrow,
  validation,
  updateValidation,
}: Props) => {
  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const tokenRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Include Funds Toggle */}
      <div>
        <label className="text-muted-foreground mb-2 block text-sm">
          Does this Agreement Include Funds{" "}
          <span className="text-cyan-400">(Optional)</span>
        </label>
        <div className="flex gap-4">
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setIncludeFunds(v)}
              className={`rounded-md border px-4 py-2 capitalize transition-colors ${
                includeFunds === v
                  ? "border-cyan-400 bg-cyan-500/30 text-cyan-200"
                  : "border-white/10 text-white/70 hover:border-cyan-400/40"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Funds details panel */}
      {includeFunds === "yes" && (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-3">
          {/* Token dropdown */}
          <div className="relative flex w-full flex-col gap-2" ref={tokenRef}>
            <label className="text-sm font-semibold text-white">
              Token <span className="text-cyan-400">(Optional)</span>
            </label>
            <div
              onClick={() => setIsTokenOpen((p) => !p)}
              className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
            >
              <span>{fundsWithoutEscrow.token || "Select Token"}</span>
              <ChevronDown
                className={`transition-transform ${isTokenOpen ? "rotate-180" : ""}`}
              />
            </div>
            {isTokenOpen && (
              <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                {TOKEN_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setFundsWithoutEscrow((prev) => ({
                        ...prev,
                        token: option.value,
                        customTokenAddress:
                          option.value !== "custom"
                            ? ""
                            : prev.customTokenAddress,
                      }));
                      setIsTokenOpen(false);
                    }}
                    className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
            {fundsWithoutEscrow.token === "custom" && (
              <div className="mt-3">
                <label className="text-muted-foreground mb-2 block text-sm">
                  Paste Contract Address{" "}
                  <span className="text-cyan-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={fundsWithoutEscrow.customTokenAddress}
                  onChange={(e) =>
                    setFundsWithoutEscrow((prev) => ({
                      ...prev,
                      customTokenAddress: e.target.value,
                    }))
                  }
                  placeholder="0x..."
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                />
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-muted-foreground mb-2 block text-sm">
              Amount <span className="text-cyan-400">(Optional)</span>
            </label>
            <input
              value={formatNumberWithCommas(fundsWithoutEscrow.amount)}
              onChange={(e) => {
                const raw = parseFormattedNumber(e.target.value);
                setFundsWithoutEscrow((prev) => ({ ...prev, amount: raw }));
                updateValidation("amount", raw);
              }}
              onBlur={() =>
                updateValidation("amount", fundsWithoutEscrow.amount)
              }
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
              placeholder="10,000 or 0.5"
              type="text"
              inputMode="decimal"
            />
            {validation.amount.isTouched && fundsWithoutEscrow.amount && (
              <div
                className={`mt-1 text-xs ${validation.amount.isValid ? "text-green-400" : "text-amber-400"}`}
              >
                {validation.amount.message}
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="md:col-span-3">
            <div className="flex items-start gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
              <div>
                <p className="text-sm text-cyan-300">
                  Funds information is for reference only in reputational
                  agreements.
                </p>
                <p className="mt-1 text-xs text-cyan-300/70">
                  This helps track the financial scope of the agreement without
                  automated fund handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
