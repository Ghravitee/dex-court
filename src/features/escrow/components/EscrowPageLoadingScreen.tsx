export const EscrowPageLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0C]">
      <style>{`
        @keyframes escrow-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes escrow-pulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px #22d3ee); }
          50%       { opacity: 0.3; filter: none; }
        }
        @keyframes escrow-fade {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 1; }
        }
        @keyframes escrow-lock-shift {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-3px); }
        }
        @keyframes escrow-key-turn {
          0%, 100% { transform: rotate(0deg); }
          25%       { transform: rotate(15deg); }
          75%       { transform: rotate(-15deg); }
        }
        .escrow-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #22d3ee;
          animation: escrow-spin linear infinite;
        }
        .escrow-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(100px, 16vw, 140px);
          height: clamp(100px, 16vw, 140px);
        }
        .escrow-ring-1 {
          width: clamp(100px, 16vw, 140px);
          height: clamp(100px, 16vw, 140px);
          animation-duration: 1.4s;
        }
        .escrow-ring-2 {
          width: clamp(75px, 12vw, 105px);
          height: clamp(75px, 12vw, 105px);
          animation-duration: 1s;
          animation-direction: reverse;
          border-top-color: rgba(34,211,238,0.45);
        }
        .escrow-ring-3 {
          width: clamp(50px, 8vw, 70px);
          height: clamp(50px, 8vw, 70px);
          animation-duration: 0.65s;
          border-top-color: rgba(34,211,238,0.2);
        }
        .escrow-icon {
          position: relative;
          z-index: 2;
          animation: escrow-pulse 1.6s ease-in-out infinite;
          width: clamp(44px, 7vw, 58px);
          height: clamp(44px, 7vw, 58px);
        }
        .escrow-lock-body {
          animation: escrow-lock-shift 2s ease-in-out infinite;
        }
        .escrow-keyhole {
          animation: escrow-key-turn 3s ease-in-out infinite;
          transform-origin: center;
        }
        .escrow-label {
          font-family: Georgia, serif;
          font-size: clamp(10px, 1.4vw, 13px);
          letter-spacing: 0.22em;
          color: rgba(34,211,238,0.5);
          text-transform: uppercase;
          animation: escrow-fade 1.6s ease-in-out infinite;
          margin-top: clamp(20px, 3vw, 32px);
          text-align: center;
          padding: 0 16px;
        }
      `}</style>

      <div className="escrow-wrapper">
        <div className="escrow-ring escrow-ring-1" />
        <div className="escrow-ring escrow-ring-2" />
        <div className="escrow-ring escrow-ring-3" />

        <svg className="escrow-icon" viewBox="0 0 36 36" fill="none">
          {/* Shield background */}
          <path
            d="M18 3 L30 8 L30 20 C30 27 24 31 18 33 C12 31 6 27 6 20 L6 8 Z"
            stroke="#22d3ee"
            strokeWidth="1.8"
            fill="rgba(34,211,238,0.06)"
            strokeLinejoin="round"
          />
          {/* Lock body */}
          <g className="escrow-lock-body">
            <rect
              x="13"
              y="16"
              width="10"
              height="9"
              rx="2"
              stroke="#22d3ee"
              strokeWidth="1.6"
              fill="rgba(34,211,238,0.1)"
            />
            {/* Lock shackle */}
            <path
              d="M14 16 L14 12 C14 9.8 15.8 8 18 8 C20.2 8 22 9.8 22 12 L22 16"
              stroke="#22d3ee"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          {/* Keyhole */}
          <g className="escrow-keyhole">
            <circle
              cx="18"
              cy="19.5"
              r="1.8"
              stroke="#22d3ee"
              strokeWidth="1"
              fill="none"
            />
            <line
              x1="18"
              y1="21"
              x2="18"
              y2="23.5"
              stroke="#22d3ee"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
          {/* Checkmark inside shield (subtle) */}
          <path
            d="M13 20 L16.5 23.5 L23 17"
            stroke="#22d3ee"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
        </svg>
      </div>

      <p className="escrow-label">Loading Escrows</p>
    </div>
  );
};
