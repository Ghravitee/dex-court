export interface DisputeSocketJoinRequest {
  disputeId: number;
}

export interface DisputeSocketMessageCreateRequest {
  disputeId: number;
  content: string;
}

export interface DisputeSocketMessageDeleteRequest {
  disputeId: number;
  messageId: number;
}

export interface DisputeSocketMessageDeletedEventRequest {
  messageId: number;
}
