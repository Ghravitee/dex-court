import { useState } from "react";

export const JudgesIntro = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      className={`card-cyan relative col-span-2 overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
        expanded ? "h-auto" : "lg:h-[14rem]"
      }`}
    >
      <div className="absolute top-0 -right-10 block rounded-full bg-cyan-500/20 blur-3xl lg:size-[20rem]" />

      <h3 className="space text-lg font-semibold text-white/90">
        Have you been wronged or cheated? Don't stay silent, start a{" "}
        <span className="text-[#0891b2]">dispute</span>.
      </h3>

      <div className="text-muted-foreground mt-3 text-sm">
        <h3 className="font-semibold text-white/90">Who Judges Your Case?</h3>
        <p className="text-muted-foreground space mt-1 text-cyan-400">Judges</p>
        <p>
          DexCourt's panel of judges consists of reputable and well-known
          figures across both Web3 and traditional spaces.
        </p>

        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Top influencers (e.g., IncomeSharks)</li>
          {expanded && (
            <>
              <li>Leading project founders (e.g., CZ)</li>
              <li>Experienced blockchain developers</li>
              <li>Respected degens with strong community reputation</li>
              <li>Licensed lawyers and real-world judges</li>
              <li>Prominent Web2 personalities</li>
            </>
          )}
        </ul>

        {expanded && (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              These individuals are selected based on proven{" "}
              <span className="text-cyan-400">
                credibility, influence, and integrity
              </span>{" "}
              within their respective domains.
            </p>

            <p className="text-muted-foreground space mt-3 text-cyan-400">
              The Community
            </p>
            <p className="text-muted-foreground text-sm">
              In addition to the judges, the broader DexCourt community also
              plays a vital role. Holders of the $LAW token can review cases and
              cast their votes, ensuring that justice remains decentralized and
              inclusive.
            </p>
          </>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm text-cyan-300 hover:underline"
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      </div>
    </section>
  );
};
