export const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0C]">
      <style>{`
        @keyframes dc-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dc-pulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px #22d3ee); }
          50%       { opacity: 0.3; filter: none; }
        }
        @keyframes dc-fade {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 1; }
        }
        .dc-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #22d3ee;
          animation: dc-spin linear infinite;
        }
        .dc-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(100px, 16vw, 140px);
          height: clamp(100px, 16vw, 140px);
        }
        .dc-ring-1 {
          width: clamp(100px, 16vw, 140px);
          height: clamp(100px, 16vw, 140px);
          animation-duration: 1.4s;
        }
        .dc-ring-2 {
          width: clamp(75px, 12vw, 105px);
          height: clamp(75px, 12vw, 105px);
          animation-duration: 1s;
          animation-direction: reverse;
          border-top-color: rgba(34,211,238,0.45);
        }
        .dc-ring-3 {
          width: clamp(50px, 8vw, 70px);
          height: clamp(50px, 8vw, 70px);
          animation-duration: 0.65s;
          border-top-color: rgba(34,211,238,0.2);
        }
        .dc-icon {
          position: relative;
          z-index: 2;
          animation: dc-pulse 1.6s ease-in-out infinite;
          width: clamp(44px, 7vw, 58px);
          height: clamp(44px, 7vw, 58px);
        }
        .dc-label {
          font-family: Georgia, serif;
          font-size: clamp(10px, 1.4vw, 13px);
          letter-spacing: 0.22em;
          color: rgba(34,211,238,0.5);
          text-transform: uppercase;
          animation: dc-fade 1.6s ease-in-out infinite;
          margin-top: clamp(20px, 3vw, 32px);
          text-align: center;
          padding: 0 16px;
        }
      `}</style>

      <div className="dc-wrapper">
        <div className="dc-ring dc-ring-1" />
        <div className="dc-ring dc-ring-2" />
        <div className="dc-ring dc-ring-3" />

        <svg
          className="dc-icon"
          viewBox="0 0 36 36"
          fill="none"
          style={{
            position: "relative",
            zIndex: 2,
            animation: "dc-pulse 1.6s ease-in-out infinite",
          }}
        >
          {/* Hexagon */}
          <path
            d="M18 2 L31 9.5 L31 26.5 L18 34 L5 26.5 L5 9.5 Z"
            stroke="#22d3ee"
            strokeWidth="1.8"
            fill="rgba(34,211,238,0.06)"
            strokeLinejoin="round"
          />
          {/* Beam */}
          <line
            x1="11"
            y1="14"
            x2="25"
            y2="14"
            stroke="#22d3ee"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Centre post */}
          <line
            x1="18"
            y1="14"
            x2="18"
            y2="26"
            stroke="#22d3ee"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Left pan strings */}
          <line
            x1="13"
            y1="14"
            x2="11"
            y2="20"
            stroke="#22d3ee"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <line
            x1="13"
            y1="14"
            x2="15"
            y2="20"
            stroke="#22d3ee"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Right pan strings */}
          <line
            x1="23"
            y1="14"
            x2="21"
            y2="20"
            stroke="#22d3ee"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <line
            x1="23"
            y1="14"
            x2="25"
            y2="20"
            stroke="#22d3ee"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Left pan */}
          <path
            d="M10 20 Q13 22.5 16 20"
            stroke="#22d3ee"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Right pan */}
          <path
            d="M20 20 Q23 22.5 26 20"
            stroke="#22d3ee"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Base */}
          <line
            x1="15"
            y1="26"
            x2="21"
            y2="26"
            stroke="#22d3ee"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="dc-label">Agree. Dispute. Resolve…</p>
    </div>
  );
};
