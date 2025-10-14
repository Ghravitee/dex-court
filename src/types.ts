export type AgreementStatus =
  | "all"
  | "draft"
  | "pending"
  | "signed"
  | "cancelled"
  | "completed"
  | "disputed";

export type Agreement = {
  id: number;
  title: string;
  type: "Public" | "Private";
  counterparty: string;
  description: string;
  images: string[];
  deadline: string;
  includeFunds: "yes" | "no";
  useEscrow?: boolean;
  token?: string;
  customTokenAddress?: string;
  amount?: string;
  status: AgreementStatus;
  createdBy: string;
  dateCreated: string;
  escrowAddress?: string;
  // Removed: terms, escrowEnabled
};

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
