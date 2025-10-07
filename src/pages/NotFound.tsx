import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="glass p-10 text-center ring-1 ring-white/10">
        <h1 className="text-5xl font-extrabold mb-2 text-white glow-text">404</h1>
        <p className="text-sm text-muted-foreground mb-6">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-cyan-200 hover:bg-cyan-500/15 neon-hover">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
