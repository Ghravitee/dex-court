export type AgreementStatusFilter =
  | "all"
  | "pending"
  | "signed"
  | "cancelled"
  | "completed"
  | "disputed";

export type AgreementStatus =
  | "pending"
  | "signed"
  | "cancelled"
  | "completed"
  | "disputed";

// types.ts - Update Agreement interface// In your types file, update the Agreement interface
// types.ts - Update Agreement interface
export interface Agreement {
  id: string;
  title: string;
  description: string;
  type: "Public" | "Private";
  counterparty: string;
  createdBy: string;
  status: AgreementStatus;
  dateCreated: string;
  deadline: string;
  amount?: string;
  token?: string;
  includeFunds?: "yes" | "no";
  useEscrow?: boolean;
  escrowAddress?: string;
  files: number;
  images?: string[];

  // 🚨 UPDATE: Change avatar IDs from string to number
  createdByAvatarId?: number | null;
  counterpartyAvatarId?: number | null;
  createdByUserId?: string;
  counterpartyUserId?: string;

  // Creator information (the user who created the agreement in the system)
  creator?: string;
  creatorUserId?: string;
  creatorAvatarId?: number | null; // 🚨 UPDATE: Change from string to number
}
// Add API response types
export interface ApiAgreement {
  id: number;
  title: string;
  description: string;
  type: number;
  visibility: number;
  status: number;
  amount?: number;
  tokenSymbol?: string;
  deadline: string;
  createdAt: string;
  escrowContract?: string;
  creator: {
    username: string;
  };
  firstParty: {
    username: string;
  };
  counterParty: {
    username: string;
  };
  files: Array<{
    fileName: string;
  }>;
}

export type Escrow = {
  id: string;
  title: string;
  from: string;
  to: string;
  token: string;
  amount: number;
  status:
    | "pending"
    | "active"
    | "cancelled"
    | "completed"
    | "frozen"
    | "disputed";
  deadline: string;
  type: "public" | "private";
  description: string;
  createdAt: number;
};

// Local type extension at the top of your Escrow component file
export type ExtendedEscrow = Escrow & {
  escrowType?: "myself" | "others";
};
