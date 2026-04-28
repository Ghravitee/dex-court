import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { InfiniteMovingCardsWithAvatars } from "../../../components/ui/infinite-moving-cards-with-avatars";
import { useJudges } from "../../../hooks/useAccounts";
import { type JudgeItem } from "../types";

export const RenownedJudgesInfiniteCards = () => {
  const { data, isLoading, isError } = useJudges();

  const judgeItems: JudgeItem[] = useMemo(
    () =>
      (data?.results ?? []).map((u) => ({
        quote: u.bio ?? "Judge and arbitrator on the platform.",
        name: u.username ?? u.walletAddress ?? "Unknown",
        rawName: u.username ?? u.walletAddress ?? undefined,
        title: "Judge",
        avatarId: u.avatarId ?? null,
        userId: String(u.id),
      })),
    [data?.results],
  );

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
      <h3 className="glow-text mb-4 text-xl font-semibold text-cyan-100">
        Renowned Judges
        {!isLoading &&
          !isError &&
          judgeItems.length > 0 &&
          ` (${judgeItems.length})`}
      </h3>

      {/* LOADING */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading judges…
        </div>
      )}

      {/* ERROR */}
      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center py-10 text-sm text-red-300/70">
          Failed to load judges
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !isError && judgeItems.length === 0 && (
        <div className="py-10 text-center text-sm text-white/40">
          No judges available yet.
        </div>
      )}

      {/* SUCCESS */}
      {!isLoading && !isError && judgeItems.length > 0 && (
        <InfiniteMovingCardsWithAvatars
          items={judgeItems}
          type="judges"
          direction="right"
          speed="slow"
          pauseOnHover={true}
          className="max-w-full"
        />
      )}
    </div>
  );
};
