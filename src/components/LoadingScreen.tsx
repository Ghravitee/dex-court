export function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="absolute inset-0 z-[50] rounded-full bg-cyan-500/10 blur-3xl"></div>
      <div className="text-center">
        <div className="relative mx-auto mb-8">
          <div className="mx-auto size-32 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400"></div>
          <div className="absolute inset-0 mx-auto size-32 animate-ping rounded-full border-2 border-cyan-400/40"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-cyan-300">
            Loading Escrow
          </h3>
          <p className="text-sm text-cyan-200/70">
            Preparing your escrow details...
          </p>
        </div>
        <div className="mt-4 flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
