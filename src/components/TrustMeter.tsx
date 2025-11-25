// components/TrustMeter.tsx
import { clamp } from "../lib/reputationHelpers";

export default function TrustMeter({ score }: { score: number }) {
  const r = 54;
  const cx = 64;
  const cy = 64;
  const c = 2 * Math.PI * r;
  const trust = clamp(score);
  const greenLen = (trust / 100) * c;
  const redLen = c - greenLen;

  return (
    <svg viewBox="0 0 128 128" className="h-32 w-32">
      <defs>
        <linearGradient id="gGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
        <linearGradient id="gRed" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fca5a5" />
        </linearGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={10}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="url(#gGreen)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${greenLen} ${c}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="[filter:drop-shadow(0_0_12px_rgba(16,185,129,0.6))]"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="url(#gRed)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${redLen} ${c}`}
        strokeDashoffset={greenLen}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="[filter:drop-shadow(0_0_12px_rgba(244,63,94,0.5))]"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-white text-xl font-bold"
      >
        {trust}
      </text>
      <text
        x="50%"
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-cyan-300 text-[10px]"
      >
        Trust
      </text>
    </svg>
  );
}
