import { cn } from "../../lib/utils";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { UserAvatar } from "../UserAvatar";
import { Link } from "react-router-dom";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { AvatarErrorBoundary } from "../AvatarErrorBoundary";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

interface DisputeItem {
  id: string;
  quote: string;
  name: string;
  title: string;
  plaintiff: string;
  defendant: string;
  plaintiffData?: {
    userId?: string;
    avatarId?: number | null;
    username?: string;
  };
  defendantData?: {
    userId?: string;
    avatarId?: number | null;
    username?: string;
  };
  plaintiffUserId?: string;
  defendantUserId?: string;
  evidenceCount?: number;
}

interface LiveVotingItem {
  id: string;
  quote: string;
  name: string;
  title: string;
  plaintiff: string;
  defendant: string;
  plaintiffData?: {
    userId?: string;
    avatarId?: number | null;
    username?: string;
  };
  defendantData?: {
    userId?: string;
    avatarId?: number | null;
    username?: string;
  };
  plaintiffUserId?: string;
  defendantUserId?: string;
  endsAt?: number;
  hasVoted?: boolean;
  timeRemaining?: string;
}

interface InfiniteMovingCardsWithAvatarsProps {
  items: (AgreementItem | JudgeItem | DisputeItem | LiveVotingItem)[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow" | "manual";
  pauseOnHover?: boolean;
  className?: string;
  type: "agreements" | "judges" | "disputes" | "live-voting";
  showControls?: boolean;
}

export const InfiniteMovingCardsWithAvatars = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
  type,
  showControls = true,
}: InfiniteMovingCardsWithAvatarsProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const scrollSpeedRef = useRef<number>(0.5);

  // Calculate speed value for manual mode
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
          scrollSpeedRef.current = 0.8;
        } else if (speed === "normal") {
          containerRef.current.style.setProperty("--animation-duration", "40s");
          scrollSpeedRef.current = 0.4;
        } else if (speed === "slow") {
          containerRef.current.style.setProperty("--animation-duration", "80s");
          scrollSpeedRef.current = 0.2;
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

  // Manual scroll animation (for manual mode)
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

  const isWalletAddress = (address: string): boolean => {
    if (!address) return false;
    return address.startsWith("0x") && address.length > 10;
  };

  const sliceWalletAddress = (address: string): string => {
    if (!address) return "";
    if (isWalletAddress(address)) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  const formatDisplayName = (address: string): string => {
    if (!address) return "";
    const slicedAddress = sliceWalletAddress(address);
    if (isWalletAddress(address)) {
      return slicedAddress;
    } else {
      return `@${slicedAddress}`;
    }
  };

  const renderCardContent = (
    item: AgreementItem | JudgeItem | DisputeItem | LiveVotingItem,
  ) => {
    if (type === "agreements" && "createdBy" in item) {
      return (
        <>
          <div className="relative z-20 mb-4 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <AvatarErrorBoundary>
                <UserAvatar
                  userId={item.createdByUserId || item.createdBy || "unknown"}
                  avatarId={item.createdByAvatarId ?? null}
                  username={item.createdBy || "unknown"}
                  size="sm"
                />
              </AvatarErrorBoundary>
              <span className="text-xs text-cyan-300">{item.createdBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <AvatarErrorBoundary>
                <UserAvatar
                  userId={item.counterpartyUserId || item.counterparty || ""}
                  avatarId={item.counterpartyAvatarId ?? null}
                  username={item.counterparty || ""}
                  size="sm"
                />
              </AvatarErrorBoundary>
              <span className="text-xs text-cyan-300">{item.counterparty}</span>
            </div>
          </div>

          <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
            {item.quote}
          </span>

          <div className="relative z-20 mt-4 flex flex-row items-center justify-between">
            <span className="text-sm leading-[1.6] font-normal text-cyan-300">
              {item.name}
            </span>
            <span className="text-sm leading-[1.6] font-normal text-cyan-200/70">
              {item.title}
            </span>
          </div>
        </>
      );
    }

    if (type === "judges" && "avatar" in item) {
      return (
        <>
          <div className="relative z-20 mb-4 flex items-center justify-start gap-3">
            {"avatar" in item && item.avatar ? (
              <img
                src={item.avatar}
                alt={item.name}
                className="h-10 w-10 rounded-full border-2 border-cyan-400/60 object-cover"
              />
            ) : (
              <UserAvatar
                userId={("userId" in item ? item.userId : item.name) || ""}
                avatarId={"avatarId" in item ? (item.avatarId ?? null) : null}
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

          <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
            {item.quote}
          </span>

          <div className="relative z-20 mt-4 flex flex-row items-center justify-between">
            <span className="text-sm leading-[1.6] font-normal text-cyan-300">
              {item.name}
            </span>
            <span className="text-sm leading-[1.6] font-normal text-cyan-200/70">
              {item.title}
            </span>
          </div>
        </>
      );
    }

    if (type === "disputes" && "plaintiff" in item) {
      const disputeItem = item as DisputeItem;
      return (
        <div className="flex flex-col">
          <h2 className="mb-4 block text-[16px] leading-[1.6] font-normal text-amber-300">
            {disputeItem.title}
          </h2>

          <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
            {disputeItem.quote}
          </span>

          <div className="relative z-20 mt-10 flex items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                userId={
                  disputeItem.plaintiffData?.userId ||
                  disputeItem.plaintiffUserId ||
                  disputeItem.plaintiff ||
                  ""
                }
                avatarId={disputeItem.plaintiffData?.avatarId ?? null}
                username={disputeItem.plaintiff}
                size="md"
              />
              <span className="text-xs text-cyan-300">
                {formatDisplayName(disputeItem.plaintiff)}
              </span>
            </div>
            <span className="text-cyan-400">
              <FaArrowRightArrowLeft />
            </span>

            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                userId={
                  disputeItem.defendantData?.userId ||
                  disputeItem.defendantUserId ||
                  disputeItem.defendant ||
                  ""
                }
                avatarId={disputeItem.defendantData?.avatarId ?? null}
                username={disputeItem.defendant}
                size="md"
              />
              <span className="text-xs text-cyan-300">
                {formatDisplayName(disputeItem.defendant)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (type === "live-voting" && "plaintiff" in item) {
      const votingItem = item as LiveVotingItem;
      return (
        <>
          <div className="relative z-20 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-400"></div>
              </div>
              <span className="text-xs font-medium text-red-400">
                LIVE VOTING
              </span>
            </div>
            {votingItem.hasVoted && (
              <span className="text-xs text-green-400">✓ Voted</span>
            )}
          </div>

          <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
            {votingItem.quote}
          </span>

          <div className="relative z-20 my-4 flex flex-row items-center justify-between">
            <span className="text-sm leading-[1.6] font-normal text-cyan-200/70">
              {votingItem.title}
            </span>
          </div>

          {votingItem.timeRemaining && (
            <div className="relative z-20 mt-3 flex items-center justify-between">
              <span className="text-xs text-amber-400">
                ⏳ {votingItem.timeRemaining}
              </span>
              {votingItem.endsAt && (
                <span className="text-xs text-amber-200/70">
                  Ends in{" "}
                  {Math.ceil(
                    (votingItem.endsAt - Date.now()) / (1000 * 60 * 60 * 24),
                  )}{" "}
                  days
                </span>
              )}
            </div>
          )}

          <div className="relative z-20 mb-4 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <UserAvatar
                userId={
                  votingItem.plaintiffData?.userId ||
                  votingItem.plaintiffUserId ||
                  votingItem.plaintiff ||
                  ""
                }
                avatarId={votingItem.plaintiffData?.avatarId ?? null}
                username={votingItem.plaintiff}
                size="md"
              />
              <span className="text-xs text-cyan-300">
                {formatDisplayName(votingItem.plaintiff)}
              </span>
            </div>
            <span className="text-cyan-400">
              <FaArrowRightArrowLeft />
            </span>

            <div className="flex items-center gap-2">
              <UserAvatar
                userId={
                  votingItem.defendantData?.userId ||
                  votingItem.defendantUserId ||
                  votingItem.defendant ||
                  ""
                }
                avatarId={votingItem.defendantData?.avatarId ?? null}
                username={votingItem.defendant}
                size="md"
              />
              <span className="text-xs text-cyan-300">
                {formatDisplayName(votingItem.defendant)}
              </span>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
          {item.quote}
        </span>
        <div className="relative z-20 mt-4 flex flex-row items-center justify-between">
          <span className="text-sm leading-[1.6] font-normal text-cyan-300">
            {item.name}
          </span>
          <span className="text-sm leading-[1.6] font-normal text-cyan-200/70">
            {item.title}
          </span>
        </div>
      </>
    );
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
                "relative w-[350px] max-w-full shrink-0 rounded-2xl border border-b-0 border-cyan-400/60 from-cyan-500/20 to-transparent px-8 py-6 transition-all duration-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20 md:w-[450px] dark:bg-gradient-to-br",
                "cursor-pointer",
              )}
              key={`${item.name}-${idx}`}
              onClick={() => handleCardClick(idx)}
            >
              {(type === "disputes" || type === "live-voting") &&
              "id" in item ? (
                <Link
                  to={
                    type === "live-voting"
                      ? `/disputes/${item.id}` // Changed from `/voting` to `/disputes/${item.id}`
                      : `/disputes/${item.id}`
                  }
                  className="block h-full w-full"
                  onClick={(e) => e.stopPropagation()} // Prevent card click handler from firing
                >
                  <blockquote className="h-full">
                    {renderCardContent(item)}
                  </blockquote>
                </Link>
              ) : (
                <blockquote className="h-full">
                  {renderCardContent(item)}
                </blockquote>
              )}

              {/* Click indicator */}
              <div className="absolute right-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs text-cyan-400/70">Click to focus</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
