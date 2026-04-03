/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TimeframeGroupedData {
  period: string;
  newAgreements: number;
  totalAgreements: number;
}

export interface RevenueDataPoint {
  t: string | number;
  revenue: number;
}

export interface DisputeItem {
  id: string;
  quote: string;
  name: string;
  title: string;
  plaintiff: string;
  defendant: string;
  plaintiffData?: {
    username: string;
    userId: string;
    avatarId: number | null;
    telegramUsername: string | null;
  };
  defendantData?: {
    username: string;
    userId: string;
    avatarId: number | null;
    telegramUsername: string | null;
  };
  plaintiffUserId: string;
  defendantUserId: string;
  evidenceCount: number;
}

export interface LiveVotingItem {
  id: string;
  quote: string;
  name: string;
  title: string;
  plaintiff: string;
  defendant: string;
  plaintiffData?: any;
  defendantData?: any;
  plaintiffUserId: string;
  defendantUserId: string;
  endsAt: number;
  hasVoted: boolean;
}

export interface AgreementItem {
  id: number;
  quote: string;
  name: string;
  title: string;
  createdBy: string;
  counterparty: string;
  createdByUserId: string;
  createdByAvatarId: number | null;
  counterpartyUserId: string;
  counterpartyAvatarId: number | null;
}

export interface JudgeItem {
  quote: string;
  name: string;
  title: string;
  avatar: string;
  userId: string;
}

export interface Stat {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  prefix?: string;
}
