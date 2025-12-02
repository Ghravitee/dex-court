export const GlobalLoader = () => {
  return (
    <div className="global-loader fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0C] text-white">
      {/* Rotating ring */}
      <div className="global-loader__ring" />

      {/* Node pulse */}
      <div className="global-loader__pulse mt-6 flex gap-2">
        <div className="global-loader__dot global-loader__dot--1" />
        <div className="global-loader__dot global-loader__dot--2" />
        <div className="global-loader__dot global-loader__dot--3" />
      </div>

      <p className="mt-4 text-sm tracking-wide text-gray-300">
        Loading decentralized experience…
      </p>
    </div>
  );
};
