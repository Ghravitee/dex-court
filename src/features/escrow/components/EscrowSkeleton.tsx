export function EscrowSkeleton() {
  return (
    <div className="web3-corner-border group relative rounded-3xl p-[2px]">
      <div className="h-fit rounded-[1.4rem] bg-black/40 p-8 shadow-[0_0_40px_#00eaff20] backdrop-blur-xl">
        <div className="mb-4">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-cyan-500/20" />
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-4 w-12 animate-pulse rounded bg-white/10" />
              <div className="h-5 w-20 animate-pulse rounded bg-cyan-400/20" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-20 animate-pulse rounded bg-cyan-400/20" />
        </div>
      </div>
    </div>
  );
}
