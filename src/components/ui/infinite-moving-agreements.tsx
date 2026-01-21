"use client";

import { cn } from "../../lib/utils";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { UserAvatar } from "../UserAvatar";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AgreementItem {
  id: string;
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
  speed?: "fast" | "normal" | "slow" | "manual";
  pauseOnHover?: boolean;
  className?: string;
  showControls?: boolean;
}

export const InfiniteMovingAgreements = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
  showControls = true,
}: InfiniteMovingAgreementsProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Calculate speed value
  const getSpeedValue = useCallback(() => {
    switch (speed) {
      case "fast":
        return 0.8;
      case "normal":
        return 0.4;
      case "slow":
        return 0.2;
      case "manual":
        return 0;
      default:
        return 0.4;
    }
  }, [speed]);

  // Initialize animation
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
      if (containerRef.current && speed !== "manual") {
        if (speed === "fast") {
          containerRef.current.style.setProperty("--animation-duration", "20s");
        } else if (speed === "normal") {
          containerRef.current.style.setProperty("--animation-duration", "40s");
        } else if (speed === "slow") {
          containerRef.current.style.setProperty("--animation-duration", "80s");
        }
      }
    };

    const addAnimation = () => {
      if (containerRef.current && scrollerRef.current) {
        const scrollerContent = Array.from(scrollerRef.current.children);

        // Only duplicate if not in manual mode
        if (speed !== "manual") {
          scrollerContent.forEach((item) => {
            const duplicatedItem = item.cloneNode(true);
            if (scrollerRef.current) {
              scrollerRef.current.appendChild(duplicatedItem);
            }
          });
        }

        getDirection();
        getSpeed();
        setStart(true);
      }
    };

    addAnimation();
  }, [direction, speed]);

  // Manual scroll animation
  useEffect(() => {
    if (speed === "manual" && scrollerRef.current) {
      const animate = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        if (scrollerRef.current && !isHovering) {
          const newPosition =
            currentPosition +
            getSpeedValue() * delta * (direction === "left" ? -1 : 1);
          setCurrentPosition(newPosition);
          scrollerRef.current.style.transform = `translateX(${newPosition}px)`;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [speed, isHovering, currentPosition, getSpeedValue, direction]);

  // Control functions
  const scrollToPrevious = () => {
    if (scrollerRef.current) {
      const cardWidth = 450; // Approximate card width with gap
      const newPosition =
        currentPosition + (direction === "left" ? cardWidth : -cardWidth);
      setCurrentPosition(newPosition);
      scrollerRef.current.style.transform = `translateX(${newPosition}px)`;
    }
  };

  const scrollToNext = () => {
    if (scrollerRef.current) {
      const cardWidth = 450;
      const newPosition =
        currentPosition + (direction === "left" ? -cardWidth : cardWidth);
      setCurrentPosition(newPosition);
      scrollerRef.current.style.transform = `translateX(${newPosition}px)`;
    }
  };

  // Click handler for cards to bring into focus
  const handleCardClick = (index: number) => {
    if (scrollerRef.current) {
      const cardWidth = 450;
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const targetPosition =
        -(index * cardWidth) + containerWidth / 2 - cardWidth / 2;
      setCurrentPosition(targetPosition);
      scrollerRef.current.style.transform = `translateX(${targetPosition}px)`;
    }
  };

  // Handle hover for pausing animation
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsHovering(true);
      if (scrollerRef.current && speed !== "manual") {
        scrollerRef.current.style.animationPlayState = "paused";
      }
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsHovering(false);
      if (scrollerRef.current && speed !== "manual") {
        scrollerRef.current.style.animationPlayState = "running";
      }
    }
  };

  return (
    <div className="relative">
      {/* Controls - Moved to sides */}
      {showControls && (
        <>
          {/* Left control */}
          <div className="absolute top-1/2 left-0 z-30 -translate-y-1/2">
            <button
              onClick={scrollToPrevious}
              className="rounded-full bg-black/50 p-3 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70"
              title="Previous card"
            >
              {/* <FaStepBackward className="h-5 w-5 text-cyan-300" /> */}
              <ChevronLeft className="h-5 w-5 text-cyan-300" />
            </button>
          </div>

          {/* Right control */}
          <div className="absolute top-1/2 right-0 z-30 -translate-y-1/2">
            <button
              onClick={scrollToNext}
              className="rounded-full bg-black/50 p-3 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70"
              title="Next card"
            >
              {/* <FaStepForward className="h-5 w-5 text-cyan-300" /> */}
              <ChevronRight className="h-5 w-5 text-cyan-300" />
            </button>
          </div>
        </>
      )}

      <div
        ref={containerRef}
        className={cn(
          "scroller relative z-10 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ul
          ref={scrollerRef}
          className={cn(
            "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
            start && speed !== "manual" && "animate-scroll",
            speed === "manual" && "transition-transform duration-300 ease-out",
          )}
          style={
            speed === "manual"
              ? { transform: `translateX(${currentPosition}px)` }
              : {}
          }
        >
          {items.map((item, idx) => (
            <li
              className={cn(
                "card-cyan relative w-[350px] max-w-full shrink-0 rounded-2xl border border-b-0 border-cyan-400/60 px-8 py-4 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 md:w-[450px]",
                "cursor-pointer",
              )}
              key={`${item.id}-${idx}`}
              onClick={() => handleCardClick(idx)}
            >
              <Link
                to={`/agreements/${item.id}`}
                className="block h-full w-full no-underline"
                onClick={(e) => e.stopPropagation()} // Prevent card click handler from firing
              >
                <blockquote className="flex h-full flex-col">
                  <div
                    aria-hidden="true"
                    className="user-select-none pointer-events-none absolute -top-0.5 -left-0.5 -z-1 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
                  ></div>
                  <h2 className="mb-4 block text-[16px] leading-[1.6] font-normal text-amber-300">
                    {item.title}
                  </h2>

                  {/* Quote - At the top */}
                  <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
                    {item.quote}
                  </span>

                  {/* Additional Info */}

                  {/* Avatars Section - At the bottom */}
                  <div className="relative z-20 mt-auto flex items-center justify-center gap-3 pt-4">
                    <div className="flex flex-col items-center gap-1">
                      <UserAvatar
                        userId={item.createdByUserId || item.createdBy || ""}
                        avatarId={item.createdByAvatarId ?? null}
                        username={item.createdBy || ""}
                        size="md"
                      />
                      <span className="max-w-[130px] text-xs text-cyan-300">
                        {item.createdBy}
                      </span>
                    </div>

                    <span className="text-cyan-400">
                      <FaArrowRightArrowLeft />
                    </span>

                    <div className="flex flex-col items-center gap-1">
                      <UserAvatar
                        userId={
                          item.counterpartyUserId || item.counterparty || ""
                        }
                        avatarId={item.counterpartyAvatarId ?? null}
                        username={item.counterparty || ""}
                        size="md"
                      />
                      <span className="max-w-[130px] text-xs text-cyan-300">
                        {item.counterparty}
                      </span>
                    </div>
                  </div>
                </blockquote>
              </Link>

              {/* Click indicator */}
              <div className="absolute right-2 bottom-2 opacity-0 transition-opacity hover:opacity-100">
                <span className="text-xs text-cyan-400/70">Click to focus</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
