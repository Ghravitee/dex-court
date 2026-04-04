export const LoadingScreen = () => (
  <div className="relative flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="relative mx-auto mb-8">
        <div className="mx-auto size-24 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400" />
        <div className="absolute inset-0 mx-auto size-24 animate-ping rounded-full border-2 border-cyan-400/40" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-cyan-300">
          Loading Disputes
        </h3>
        <p className="text-sm text-cyan-200/70">
          Preparing your disputes list...
        </p>
      </div>
      <div className="mt-4 flex justify-center space-x-1">
        {[0, 1, 2].map((i) => (
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
