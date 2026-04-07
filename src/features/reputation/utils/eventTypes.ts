// features/reputation/utils/eventTypes.ts
import {
  CheckCircle,
  FileCheck,
  Wallet,
  Award,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Shield,
  Star,
  XCircle,
  Clock,
  Ban,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface EventTypeDetails {
  text: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  isPositive: boolean;
}

export const ReputationEventType = {
  TelegramVerified: 1,
  AgreementCompleted: 2,
  AgreementEscrowCompleted: 3,
  DisputeWon: 4,
  VotedWinningOutcome: 5,
  WitnessEvery5Comments: 6,
  JudgeWinningVote: 7,
  JudgeCommentAdded: 8,
  FirstJudgeToVote: 9,
  FirstCommunityToVote: 10,
  CommunityVoteLost: 50,
  JudgeVoteLost: 51,
  DisputeLostRegular: 52,
  DisputeLostEscrow: 53,
  LateDelivery: 54,
  FrequentCancellationsBanned: 55,
  SpamAgreementsTempBan: 56,
} as const;

// Pre-built lookup map — O(1) vs repeated switch evaluation
const EVENT_TYPE_MAP: Record<number, EventTypeDetails> = {
  [ReputationEventType.TelegramVerified]: {
    text: "Telegram Verified",
    icon: CheckCircle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-400/30",
    description: "Linked and verified Telegram account",
    isPositive: true,
  },
  [ReputationEventType.AgreementCompleted]: {
    text: "Agreement Completed",
    icon: FileCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-400/30",
    description: "Successfully completed a reputational agreement",
    isPositive: true,
  },
  [ReputationEventType.AgreementEscrowCompleted]: {
    text: "Escrow Agreement Completed",
    icon: Wallet,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-400/30",
    description: "Successfully completed an escrow-protected agreement",
    isPositive: true,
  },
  [ReputationEventType.DisputeWon]: {
    text: "Dispute Won",
    icon: Award,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-400/30",
    description: "Won a dispute resolution",
    isPositive: true,
  },
  [ReputationEventType.VotedWinningOutcome]: {
    text: "Voted Winning Outcome",
    icon: ThumbsUp,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-400/30",
    description: "Voted for the winning outcome in a dispute",
    isPositive: true,
  },
  [ReputationEventType.WitnessEvery5Comments]: {
    text: "Witness Contribution",
    icon: MessageSquare,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-400/30",
    description: "Provided valuable witness comments (every 5 comments)",
    isPositive: true,
  },
  [ReputationEventType.JudgeWinningVote]: {
    text: "Judge Winning Vote",
    icon: Shield,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-400/30",
    description: "As a judge, voted for the winning outcome",
    isPositive: true,
  },
  [ReputationEventType.JudgeCommentAdded]: {
    text: "Judge Comment Added",
    icon: MessageSquare,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-400/30",
    description: "Added insightful comments as a judge",
    isPositive: true,
  },
  [ReputationEventType.FirstJudgeToVote]: {
    text: "First Judge to Vote",
    icon: Star,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-400/30",
    description: "Was the first judge to vote in a dispute",
    isPositive: true,
  },
  [ReputationEventType.FirstCommunityToVote]: {
    text: "First Community to Vote",
    icon: Star,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-400/30",
    description: "Was the first community member to vote in a dispute",
    isPositive: true,
  },
  [ReputationEventType.CommunityVoteLost]: {
    text: "Community Vote Lost",
    icon: ThumbsDown,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-400/30",
    description: "Voted for losing outcome as community member",
    isPositive: false,
  },
  [ReputationEventType.JudgeVoteLost]: {
    text: "Judge Vote Lost",
    icon: ThumbsDown,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-400/30",
    description: "Voted for losing outcome as judge",
    isPositive: false,
  },
  [ReputationEventType.DisputeLostRegular]: {
    text: "Dispute Lost (Regular)",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-400/30",
    description: "Lost a regular dispute",
    isPositive: false,
  },
  [ReputationEventType.DisputeLostEscrow]: {
    text: "Dispute Lost (Escrow)",
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-600/10",
    borderColor: "border-red-500/30",
    description: "Lost an escrow dispute",
    isPositive: false,
  },
  [ReputationEventType.LateDelivery]: {
    text: "Late Delivery",
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-400/30",
    description: "Delivered agreement services late",
    isPositive: false,
  },
  [ReputationEventType.FrequentCancellationsBanned]: {
    text: "Frequent Cancellations",
    icon: Ban,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-400/30",
    description: "Temporarily banned for frequent agreement cancellations",
    isPositive: false,
  },
  [ReputationEventType.SpamAgreementsTempBan]: {
    text: "Spam Agreements",
    icon: AlertCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-600/10",
    borderColor: "border-gray-500/30",
    description: "Temporarily banned for creating spam agreements",
    isPositive: false,
  },
};

const FALLBACK_EVENT: EventTypeDetails = {
  text: "Unknown Event",
  icon: AlertTriangle,
  color: "text-gray-400",
  bgColor: "bg-gray-500/10",
  borderColor: "border-gray-400/30",
  description: "Unknown reputation event",
  isPositive: false,
};

export function getEventTypeDetails(eventType: number): EventTypeDetails {
  return EVENT_TYPE_MAP[eventType] ?? { ...FALLBACK_EVENT, isPositive: eventType <= 10 };
}
