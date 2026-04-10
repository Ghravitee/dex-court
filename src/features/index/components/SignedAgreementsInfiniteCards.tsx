import { useMemo } from "react";
import { FileSignature, Users, AlertCircle } from "lucide-react";
import { InfiniteMovingAgreements } from "../../../components/ui/infinite-moving-agreements";
import { usePublicAgreements } from "../../../hooks/usePublicAgreements";
import { PulseLoader } from "./PulseLoader";

export const SignedAgreementsInfiniteCards = () => {
  const { agreements, loading, error } = usePublicAgreements();

  const signedAgreements = useMemo(
    () =>
      agreements.filter(
        (a) => a.status === "signed" || a.status === "completed",
      ),
    [agreements],
  );

  const agreementItems = useMemo(
    () =>
      signedAgreements.map((agreement) => ({
        id: agreement.id,
        quote: agreement.description,
        name: `${agreement.createdBy} ↔ ${agreement.counterparty}`,
        title: agreement.title,
        createdBy: agreement.createdBy,
        counterparty: agreement.counterparty,
        createdByUserId: agreement.createdByUserId,
        createdByAvatarId: agreement.createdByAvatarId,
        counterpartyUserId: agreement.counterpartyUserId,
        counterpartyAvatarId: agreement.counterpartyAvatarId,
      })),
    [signedAgreements],
  );

  return (
    <div className="card-cyan rounded-2xl border border-cyan-400/60 p-4 sm:p-6">
      <h3 className="glow-text mb-4 text-lg font-semibold text-cyan-100 sm:text-xl">
        Signed Agreements
        {!loading &&
          !error &&
          signedAgreements.length > 0 &&
          ` (${signedAgreements.length})`}
      </h3>

      {loading && (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-cyan-300">
          <PulseLoader size="medium" />
          <span className="text-sm">Loading agreements...</span>
        </div>
      )}

      {!loading && error && (
        <div className="py-2">
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Failed to load agreements
            </p>
            <p className="max-w-[260px] text-xs leading-relaxed text-slate-500">
              {error}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && signedAgreements.length === 0 && (
        <div className="py-2">
          <p className="mb-4 text-sm leading-relaxed text-slate-400">
            Agreements that both parties have signed will appear here as a live
            feed across the network.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                <Users className="h-3.5 w-3.5 text-cyan-400/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300/90">
                  Both parties
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  Creator and counterparty shown with avatars
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                <FileSignature className="h-3.5 w-3.5 text-cyan-400/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-300/90">
                  Agreement terms
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  Title and description surfaced per card
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && signedAgreements.length > 0 && (
        <InfiniteMovingAgreements
          items={agreementItems}
          direction="left"
          speed="slow"
          pauseOnHover={true}
          className="max-w-full"
        />
      )}
    </div>
  );
};
