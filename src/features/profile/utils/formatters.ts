/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReputationEventTypeEnum } from "../constants";

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatWalletAddress = (address: string | undefined): string => {
  if (!address) return "Not connected";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
};

export const formatShortWallet = (address: string | undefined): string => {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export const formatUsername = (username: string | undefined): string => {
  if (!username) return "@you";
  return username.startsWith("@") ? username : `@${username}`;
};

export const formatReputationEvent = (event: any) => {
  const getEventTypeDisplay = (eventType: number) => {
    switch (eventType) {
      case ReputationEventTypeEnum.TelegramVerified:
        return "Telegram Verified";
      case ReputationEventTypeEnum.AgreementCompleted:
        return "Agreement Completed";
      case ReputationEventTypeEnum.AgreementEscrowCompleted:
        return "Escrow Agreement Completed";
      case ReputationEventTypeEnum.DisputeWon:
        return "Dispute Won";
      case ReputationEventTypeEnum.VotedWinningOutcome:
        return "Voted Winning Outcome";
      case ReputationEventTypeEnum.WitnessEvery5Comments:
        return "Witness Contribution";
      case ReputationEventTypeEnum.JudgeWinningVote:
        return "Judge Winning Vote";
      case ReputationEventTypeEnum.JudgeCommentAdded:
        return "Judge Comment Added";
      case ReputationEventTypeEnum.FirstJudgeToVote:
        return "First Judge to Vote";
      case ReputationEventTypeEnum.FirstCommunityToVote:
        return "First Community to Vote";
      case ReputationEventTypeEnum.CommunityVoteLost:
        return "Community Vote Lost";
      case ReputationEventTypeEnum.JudgeVoteLost:
        return "Judge Vote Lost";
      case ReputationEventTypeEnum.DisputeLostRegular:
        return "Dispute Lost (Regular)";
      case ReputationEventTypeEnum.DisputeLostEscrow:
        return "Dispute Lost (Escrow)";
      case ReputationEventTypeEnum.LateDelivery:
        return "Late Delivery";
      case ReputationEventTypeEnum.FrequentCancellationsBanned:
        return "Frequent Cancellations";
      case ReputationEventTypeEnum.SpamAgreementsTempBan:
        return "Spam Agreements";
      default:
        return "Reputation Event";
    }
  };

  const getEventIcon = (eventType: number) => {
    if (eventType <= 10) return "🟢";
    if (eventType >= 50) return "🔴";
    return "⚪";
  };

  return {
    id: event.id,
    eventType: getEventTypeDisplay(event.eventType),
    icon: getEventIcon(event.eventType),
    value: event.value,
    isPositive: event.eventType <= 10,
    eventId: event.eventId,
    createdAt: event.createdAt,
  };
};
