// src/components/PageTransitionLoader.tsx
import { useEffect, useRef, useState } from "react";

interface Props {
  isLoading: boolean;
}

export const PageTransitionLoader = ({ isLoading }: Props) => {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (isLoading) {
      setWidth(0);
      setVisible(true);
      clear();

      // Rush to 30% immediately
      setWidth(30);

      // Then slowly crawl toward 85%, slowing down as it gets there
      intervalRef.current = setInterval(() => {
        setWidth((prev) => {
          if (prev >= 85) {
            clearInterval(intervalRef.current!);
            return prev;
          }
          // Smaller increments as it approaches 85
          const remaining = 85 - prev;
          return prev + remaining * 0.08;
        });
      }, 150);
    } else {
      // Navigation done — snap to 100% then fade out
      clear();
      setWidth(100);

      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }

    return clear;
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-[#22d3ee66]"
      style={{
        width: `${width}%`,
        transition:
          width === 100
            ? "width 0.2s ease-out" // fast snap to finish
            : "width 0.4s ease-out", // smooth crawl
        boxShadow: "0 0 8px #2C89F5, 0 0 4px #22d3ee66",
      }}
    />
  );
};
