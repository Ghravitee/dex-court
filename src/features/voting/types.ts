/* eslint-disable @typescript-eslint/no-explicit-any */
// Types for the Voting component
export interface LiveCase {
  id: string;
  title: string;
  parties: {
    plaintiff: string;
    defendant: string;
    plaintiffAvatar?: number | null;
    defendantAvatar?: number | null;
    plaintiffId: string;
    defendantId: string;
  };
  description: string;
  endsAt: number;
  totalVotes: number;
  plaintiffVotes: number;
  defendantVotes: number;
  dismissedVotes: number;
  hasVoted: boolean | null;
  participants: {
    handle: string;
    commented: boolean;
    role: "judge" | "community";
    voted: boolean;
  }[];
  agreement?: {
    type: number;
    id?: number;
  };
  contractAgreementId?: number;
  chainId?: number;
  txnhash?: string;
  type?: number;
  voteStartedAt?: string;
  rawDispute?: any;
}

export interface DoneCase {
  id: string;
  title: string;
  parties: {
    plaintiff: string;
    defendant: string;
    plaintiffAvatar?: number | null;
    defendantAvatar?: number | null;
    plaintiffId: string;
    defendantId: string;
  };
  description: string;
  winner: "plaintiff" | "defendant" | "dismissed";
  judgeVotes: number;
  communityVotes: number;
  judgePct: number;
  communityPct: number;
  weighted: {
    plaintiff: number;
    defendant: number;
    dismiss: number;
  };
  votesPerGroup: {
    judges: {
      plaintiff: number;
      defendant: number;
      dismiss: number;
      total: number;
    };
    communityTierOne: {
      plaintiff: number;
      defendant: number;
      dismiss: number;
      total: number;
    };
    communityTierTwo: {
      plaintiff: number;
      defendant: number;
      dismiss: number;
      total: number;
    };
  };
  percentagesPerGroup: {
    judges: {
      plaintiff: number;
      defendant: number;
      dismiss: number;
    };
    communityTierOne: {
      plaintiff: number;
      defendant: number;
      dismiss: number;
    };
    communityTierTwo: {
      plaintiff: number;
      defendant: number;
      dismiss: number;
    };
  };
  comments: Array<{
    accountId: number;
    username: string;
    avatarId: number | null;
    role: number;
    comment: string;
  }>;
  rawData?: any;
}

export type VoteChoice = "plaintiff" | "defendant" | "dismissed" | null;

export interface VoteOptionProps {
  label: string;
  active: boolean;
  onClick: () => void;
  choice: VoteChoice;
  optionType: "plaintiff" | "defendant" | "dismissed";
  disabled?: boolean;
  username?: string;
  avatarId?: number | null;
  userId?: string;
  roleLabel?: string;
}

export interface UsernameWithAvatarProps {
  username: string;
  avatarId: number | null;
  userId: string;
}

export interface LiveCaseCardProps {
  c: LiveCase;
  currentTime: number;
  refetchLiveDisputes: () => void;
  isVoteStarted: (disputeId: string) => boolean;
  isJudge?: boolean;
}

export interface DoneCaseCardProps {
  c: DoneCase;
}
