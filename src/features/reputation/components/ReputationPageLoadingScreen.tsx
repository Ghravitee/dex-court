export const ReputationPageLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0C]">
      <style>{`
        @keyframes rep-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes rep-pulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px #22d3ee); }
          50%       { opacity: 0.3; filter: none; }
        }
        @keyframes rep-fade {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 1; }
        }
        @keyframes rep-star-pop {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%       { transform: scale(1.3); opacity: 1; }
        }
        @keyframes rep-bar-rise {
          0%, 100% { transform: scaleY(0.6); }
          50%       { transform: scaleY(1); }
        }
        .rep-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #22d3ee;
          animation: rep-spin linear infinite;
        }
        .rep-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(100px, 16vw, 140px);
          height: clamp(100px, 16vw, 140px);
        }
        .rep-ring-1 {
          width: clamp(100px, 16vw, 140px);
          height: clamp(100px, 16vw, 140px);
          animation-duration: 1.4s;
        }
        .rep-ring-2 {
          width: clamp(75px, 12vw, 105px);
          height: clamp(75px, 12vw, 105px);
          animation-duration: 1s;
          animation-direction: reverse;
          border-top-color: rgba(34,211,238,0.45);
        }
        .rep-ring-3 {
          width: clamp(50px, 8vw, 70px);
          height: clamp(50px, 8vw, 70px);
          animation-duration: 0.65s;
          border-top-color: rgba(34,211,238,0.2);
        }
        .rep-icon {
          position: relative;
          z-index: 2;
          animation: rep-pulse 1.6s ease-in-out infinite;
          width: clamp(44px, 7vw, 58px);
          height: clamp(44px, 7vw, 58px);
        }
        .rep-star {
          animation: rep-star-pop 2s ease-in-out infinite;
          transform-origin: center;
        }
        .rep-bar-1 {
          animation: rep-bar-rise 1.2s ease-in-out infinite;
          transform-origin: bottom;
        }
        .rep-bar-2 {
          animation: rep-bar-rise 1.2s ease-in-out 0.3s infinite;
          transform-origin: bottom;
        }
        .rep-bar-3 {
          animation: rep-bar-rise 1.2s ease-in-out 0.6s infinite;
          transform-origin: bottom;
        }
        .rep-label {
          font-family: Georgia, serif;
          font-size: clamp(10px, 1.4vw, 13px);
          letter-spacing: 0.22em;
          color: rgba(34,211,238,0.5);
          text-transform: uppercase;
          animation: rep-fade 1.6s ease-in-out infinite;
          margin-top: clamp(20px, 3vw, 32px);
          text-align: center;
          padding: 0 16px;
        }
      `}</style>

      <div className="rep-wrapper">
        <div className="rep-ring rep-ring-1" />
        <div className="rep-ring rep-ring-2" />
        <div className="rep-ring rep-ring-3" />

        <svg className="rep-icon" viewBox="0 0 36 36" fill="none">
          {/* Trophy cup */}
          <path
            d="M12 7 L12 14 C12 17.3 14.7 20 18 20 C21.3 20 24 17.3 24 14 L24 7"
            stroke="#22d3ee"
            strokeWidth="1.8"
            fill="rgba(34,211,238,0.06)"
            strokeLinejoin="round"
          />
          {/* Cup handles */}
          <path
            d="M12 11 C9 11 7 13 7 14.5 C7 16 9 17 12 16"
            stroke="#22d3ee"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M24 11 C27 11 29 13 29 14.5 C29 16 27 17 24 16"
            stroke="#22d3ee"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Cup base */}
          <rect
            x="14"
            y="20"
            width="8"
            height="3"
            rx="1"
            stroke="#22d3ee"
            strokeWidth="1.4"
            fill="rgba(34,211,238,0.1)"
          />
          <rect
            x="10"
            y="23"
            width="16"
            height="3"
            rx="1.5"
            stroke="#22d3ee"
            strokeWidth="1.4"
            fill="rgba(34,211,238,0.06)"
          />
          {/* Star */}
          <g className="rep-star">
            <path
              d="M18 4 L19.5 8.5 L24 9 L20.5 12 L21.5 16.5 L18 14 L14.5 16.5 L15.5 12 L12 9 L16.5 8.5 Z"
              stroke="#22d3ee"
              strokeWidth="1"
              fill="rgba(34,211,238,0.15)"
              strokeLinejoin="round"
            />
          </g>
          {/* Rising bars (reputation growth) */}
          <rect
            className="rep-bar-1"
            x="27"
            y="18"
            width="2.5"
            height="6"
            rx="1"
            fill="#22d3ee"
            opacity="0.5"
          />
          <rect
            className="rep-bar-2"
            x="30.5"
            y="15"
            width="2.5"
            height="9"
            rx="1"
            fill="#22d3ee"
            opacity="0.65"
          />
          <rect
            className="rep-bar-3"
            x="6.5"
            y="16"
            width="2.5"
            height="8"
            rx="1"
            fill="#22d3ee"
            opacity="0.55"
          />
        </svg>
      </div>

      <p className="rep-label">Calculating Reputation…</p>
    </div>
  );
};
