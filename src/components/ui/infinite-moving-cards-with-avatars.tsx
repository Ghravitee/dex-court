import { cn } from "../../lib/utils";
import React, { useEffect, useState } from "react";
import { UserAvatar } from "../UserAvatar";
import { Link } from "react-router-dom";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { AvatarErrorBoundary } from "../AvatarErrorBoundary";

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
  plaintiffUserId?: string; // ADD THIS
  defendantUserId?: string; // ADD THIS
  evidenceCount?: number;
}

// ADD NEW LiveVotingItem interface
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
  plaintiffUserId?: string; // ADD THIS
  defendantUserId?: string; // ADD THIS
  endsAt?: number;
  hasVoted?: boolean;
  timeRemaining?: string;
}

interface InfiniteMovingCardsWithAvatarsProps {
  items: (AgreementItem | JudgeItem | DisputeItem | LiveVotingItem)[]; // UPDATE to include LiveVotingItem
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
  type: "agreements" | "judges" | "disputes" | "live-voting"; // ADD "live-voting" type
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

  // Helper function to render the appropriate card content based on type
  const renderCardContent = (
    item: AgreementItem | JudgeItem | DisputeItem | LiveVotingItem,
  ) => {
    // Agreements type
    if (type === "agreements" && "createdBy" in item) {
      return (
        <>
          {/* Avatars Section */}
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
        </>
      );
    }

    // Judges type
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
        </>
      );
    }

    // Disputes type
    if (type === "disputes" && "plaintiff" in item) {
      const disputeItem = item as DisputeItem;
      return (
        <div className="flex flex-col">
          {/* Avatars Section for Disputes */}

          <h2 className="mb-4 block text-[16px] leading-[1.6] font-normal text-amber-300">
            {disputeItem.title}
          </h2>

          {/* Quote */}
          <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
            {disputeItem.quote}
          </span>

          {/* Additional Info */}
          {/* <div className="flex items-center justify-between text-sm leading-[1.6] font-normal text-cyan-200/70">
            <p>{disputeItem.title}</p>
          </div> */}

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
                @{disputeItem.plaintiff}
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
                @{disputeItem.defendant}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Live Voting type - NEW
    if (type === "live-voting" && "plaintiff" in item) {
      const votingItem = item as LiveVotingItem;
      return (
        <>
          {/* Voting Badge */}
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

          {/* Quote */}
          <span className="relative z-20 line-clamp-3 text-sm leading-[1.6] font-normal text-white">
            {votingItem.quote}
          </span>

          {/* Additional Info */}
          <div className="relative z-20 my-4 flex flex-row items-center justify-between">
            <span className="text-sm leading-[1.6] font-normal text-cyan-200/70">
              {votingItem.title}
            </span>
          </div>

          {/* Time Remaining */}
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

          {/* Avatars Section for Live Voting */}
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
                {votingItem.plaintiff}
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
                {votingItem.defendant}
              </span>
            </div>
          </div>
        </>
      );
    }

    // Fallback for unknown types
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
            className="relative w-[350px] max-w-full shrink-0 cursor-pointer rounded-2xl border border-b-0 border-cyan-400/60 from-cyan-500/20 to-transparent px-8 py-6 transition-all duration-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20 md:w-[450px] dark:bg-gradient-to-br" // ADD hover effects and cursor
            key={`${item.name}-${idx}`}
          >
            {/* WRAP CONTENT IN LINK FOR DISPUTES AND LIVE VOTING */}
            {(type === "disputes" || type === "live-voting") && "id" in item ? (
              <Link
                to={type === "live-voting" ? `/voting` : `/disputes/${item.id}`}
                className="block h-full w-full"
              >
                <blockquote className="h-full">
                  {renderCardContent(item)}
                </blockquote>
              </Link>
            ) : (
              <blockquote>{renderCardContent(item)}</blockquote>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
