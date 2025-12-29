"use client";

import { cn } from "../../lib/utils";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { UserAvatar } from "../UserAvatar";
import { FaArrowRightArrowLeft, FaPause, FaPlay } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { FaStepBackward, FaStepForward } from "react-icons/fa";

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
  speed?: "fast" | "normal" | "slow" | "manual"; // Added "manual" speed
  pauseOnHover?: boolean;
  className?: string;
  showControls?: boolean; // Added prop to show/hide controls
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
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
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
    if (speed === "manual" && scrollerRef.current && !isPaused && !isDragging) {
      const animate = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        if (scrollerRef.current) {
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
  }, [speed, isPaused, isDragging, currentPosition, getSpeedValue, direction]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scrollerRef.current) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setScrollLeftStart(currentPosition);

      // Pause animation while dragging
      setIsPaused(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scrollerRef.current) {
      const delta = e.clientX - dragStartX;
      const newPosition = scrollLeftStart + delta;
      setCurrentPosition(newPosition);
      scrollerRef.current.style.transform = `translateX(${newPosition}px)`;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Resume animation after a short delay
    setTimeout(() => setIsPaused(false), 100);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollerRef.current) {
      setIsDragging(true);
      setDragStartX(e.touches[0].clientX);
      setScrollLeftStart(currentPosition);
      setIsPaused(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scrollerRef.current) {
      const delta = e.touches[0].clientX - dragStartX;
      const newPosition = scrollLeftStart + delta;
      setCurrentPosition(newPosition);
      scrollerRef.current.style.transform = `translateX(${newPosition}px)`;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 100);
  };

  // Control functions
  const togglePause = () => {
    setIsPaused(!isPaused);

    if (scrollerRef.current) {
      if (!isPaused) {
        scrollerRef.current.style.animationPlayState = "paused";
      } else {
        scrollerRef.current.style.animationPlayState = "running";
      }
    }
  };

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
  const handleCardClick = (index: number, e: React.MouseEvent) => {
    if (!isDragging) {
      e.stopPropagation();
      if (scrollerRef.current) {
        const cardWidth = 450;
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const targetPosition =
          -(index * cardWidth) + containerWidth / 2 - cardWidth / 2;
        setCurrentPosition(targetPosition);
        scrollerRef.current.style.transform = `translateX(${targetPosition}px)`;
      }
    }
  };

  return (
    <div className="relative">
      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-lg bg-black/50 p-2 backdrop-blur-sm">
          <button
            onClick={scrollToPrevious}
            className="rounded-full p-2 transition-colors hover:bg-cyan-500/20"
            title="Previous card"
          >
            <FaStepBackward className="h-4 w-4 text-cyan-300" />
          </button>
          <button
            onClick={togglePause}
            className="rounded-full p-2 transition-colors hover:bg-cyan-500/20"
            title={isPaused ? "Play animation" : "Pause animation"}
          >
            {isPaused ? (
              <FaPlay className="h-4 w-4 text-cyan-300" />
            ) : (
              <FaPause className="h-4 w-4 text-cyan-300" />
            )}
          </button>
          <button
            onClick={scrollToNext}
            className="rounded-full p-2 transition-colors hover:bg-cyan-500/20"
            title="Next card"
          >
            <FaStepForward className="h-4 w-4 text-cyan-300" />
          </button>
        </div>
      )}

      {/* Drag overlay indicator */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-300">
            Dragging to scroll...
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "scroller relative z-10 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
          isDragging && "cursor-grabbing",
          !isDragging && "cursor-grab",
          className,
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ul
          ref={scrollerRef}
          className={cn(
            "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
            start && speed !== "manual" && "animate-scroll",
            pauseOnHover &&
              speed !== "manual" &&
              "hover:[animation-play-state:paused]",
            speed === "manual" && "transition-transform duration-300 ease-out",
            isPaused && speed !== "manual" && "[animation-play-state:paused]",
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
                isDragging ? "cursor-grabbing" : "cursor-pointer",
              )}
              key={`${item.id}-${idx}`}
              onClick={(e) => handleCardClick(idx, e)}
            >
              <Link
                to={`/agreements/${item.id}`}
                className="block h-full w-full no-underline"
                onClick={(e) => isDragging && e.preventDefault()}
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
