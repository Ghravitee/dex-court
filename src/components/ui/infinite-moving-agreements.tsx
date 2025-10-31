"use client";

import { cn } from "../../lib/utils";
import React, { useEffect, useState } from "react";
import { UserAvatar } from "../UserAvatar";
import { FaArrowRightArrowLeft } from "react-icons/fa6";

interface AgreementItem {
  quote: string;
  name: string;
  title: string;
  createdByUserId?: string;
  createdByAvatarId?: number | null;
  counterpartyUserId?: string;
  counterpartyAvatarId?: number | null;
  createdBy?: string;
  counterparty?: string;
}

interface InfiniteMovingAgreementsProps {
  items: AgreementItem[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}

export const InfiniteMovingAgreements = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: InfiniteMovingAgreementsProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const getDirection = () => {
      if (containerRef.current) {
        if (direction === "left") {
          containerRef.current.style.setProperty(
            "--animation-direction",
            "forwards",
          );
        } else {
          containerRef.current.style.setProperty(
            "--animation-direction",
            "reverse",
          );
        }
      }
    };

    const getSpeed = () => {
      if (containerRef.current) {
        if (speed === "fast") {
          containerRef.current.style.setProperty("--animation-duration", "20s");
        } else if (speed === "normal") {
          containerRef.current.style.setProperty("--animation-duration", "40s");
        } else {
          containerRef.current.style.setProperty("--animation-duration", "80s");
        }
      }
    };

    const addAnimation = () => {
      if (containerRef.current && scrollerRef.current) {
        const scrollerContent = Array.from(scrollerRef.current.children);

        scrollerContent.forEach((item) => {
          const duplicatedItem = item.cloneNode(true);
          if (scrollerRef.current) {
            scrollerRef.current.appendChild(duplicatedItem);
          }
        });

        getDirection();
        getSpeed();
        setStart(true);
      }
    };

    addAnimation();
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items.map((item, idx) => (
          <li
            className="relative w-[350px] max-w-full shrink-0 rounded-2xl border border-b-0 border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent px-8 py-6 md:w-[450px]"
            key={`${item.name}-${idx}`}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none pointer-events-none absolute -top-0.5 -left-0.5 -z-1 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>

              {/* Quote - At the top */}
              <span className="relative z-20 mb-4 line-clamp-4 block text-[14px] leading-[1.6] font-normal text-white">
                {item.quote}
              </span>

              {/* Additional Info */}

              {/* Avatars Section - At the bottom */}
              <div className="relative z-20 flex items-center justify-center gap-3 pt-4">
                <div className="flex flex-col items-center gap-1">
                  <UserAvatar
                    userId={item.createdByUserId || item.createdBy || ""}
                    avatarId={item.createdByAvatarId || null}
                    username={item.createdBy || ""}
                    size="md"
                  />
                  <span className="max-w-[140px] text-xs text-cyan-300">
                    {item.createdBy}
                  </span>
                </div>

                <span className="text-cyan-400">
                  <FaArrowRightArrowLeft />
                </span>

                <div className="flex flex-col items-center gap-1">
                  <UserAvatar
                    userId={item.counterpartyUserId || item.counterparty || ""}
                    avatarId={item.counterpartyAvatarId || null}
                    username={item.counterparty || ""}
                    size="md"
                  />
                  <span className="max-w-[80px] text-sm text-cyan-300">
                    {item.counterparty}
                  </span>
                </div>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
