"use client";

import { cn } from "../../lib/utils";
import React, { useEffect, useState } from "react";
import { UserAvatar } from "../UserAvatar";

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

interface JudgeItem {
  quote: string;
  name: string;
  title: string;
  avatar?: string;
  avatarId?: number | null;
  userId?: string;
}

interface InfiniteMovingCardsWithAvatarsProps {
  items: (AgreementItem | JudgeItem)[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
  type: "agreements" | "judges";
}

export const InfiniteMovingCardsWithAvatars = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
  type,
}: InfiniteMovingCardsWithAvatarsProps) => {
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
            className="relative w-[350px] max-w-full shrink-0 rounded-2xl border border-b-0 border-cyan-400/30 from-cyan-500/20 to-transparent px-8 py-6 md:w-[450px] dark:bg-gradient-to-br"
            key={`${item.name}-${idx}`}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none pointer-events-none absolute -top-0.5 -left-0.5 -z-1 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>

              {/* Avatars Section */}
              {type === "agreements" && "createdBy" in item && (
                <div className="relative z-20 mb-4 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      userId={item.createdByUserId || item.createdBy || ""}
                      avatarId={item.createdByAvatarId ?? null}
                      username={item.createdBy || ""}
                      size="sm"
                    />
                    <span className="text-xs text-cyan-300">
                      {item.createdBy}
                    </span>
                  </div>
                  <span className="text-xs text-cyan-400">↔</span>
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      userId={
                        item.counterpartyUserId || item.counterparty || ""
                      }
                      avatarId={item.counterpartyAvatarId ?? null}
                      username={item.counterparty || ""}
                      size="sm"
                    />
                    <span className="text-xs text-cyan-300">
                      {item.counterparty}
                    </span>
                  </div>
                </div>
              )}

              {type === "judges" && (
                <div className="relative z-20 mb-4 flex items-center justify-start gap-3">
                  {"avatar" in item && item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="h-10 w-10 rounded-full border-2 border-cyan-400/40 object-cover"
                    />
                  ) : (
                    <UserAvatar
                      userId={
                        ("userId" in item ? item.userId : item.name) || ""
                      }
                      avatarId={
                        "avatarId" in item ? (item.avatarId ?? null) : null
                      }
                      username={item.name}
                      size="md"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-cyan-300">
                      {item.name}
                    </div>
                    <div className="text-xs text-cyan-200/70">{item.title}</div>
                  </div>
                </div>
              )}

              {/* Quote */}
              <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
                {item.quote}
              </span>

              {/* Additional Info */}
              <div className="relative z-20 mt-4 flex flex-row items-center justify-between">
                <span className="text-sm leading-[1.6] font-normal text-cyan-300">
                  {item.name}
                </span>
                <span className="text-sm leading-[1.6] font-normal text-cyan-200/70">
                  {item.title}
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
