export type DisputeChatRole =
  | "plaintiff"
  | "defendant"
  | "judge"
  | "witness"
  | "admin"
  | "community"; // Add this

/**
 * Represents a file attached to a dispute chat message
 */
export interface DisputeSocketFileDTO {
  id: number;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
}

/**
 * Represents a message in a dispute chat
 */
export interface DisputeSocketMessageDTO {
  id: number;
  disputeId: number;
  avatarId: number | null;
  accountId: number;
  username: string;
  role?: DisputeChatRole;
  content: string;
  creationDate: string;
  files?: DisputeSocketFileDTO[];
}

/**
 * Event emitted when new files are attached to a message
 */
export interface DisputeSocketMessageFilesAddedEvent {
  messageId: number;
  files: {
    id: number;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
  }[];
}

/**
 * Event emitted when a message is deleted
 */
export interface DisputeSocketMessageDeletedEvent {
  messageId: number;
}

/**
 * Response to "dispute:join"
 */
export interface DisputeSocketJoinDTO {
  ok: boolean;
  error?: number;
  history?: DisputeSocketMessageDTO[];
}

/**
 * Response to "message:create"
 */
export interface DisputeSocketMessageCreateDTO {
  ok: boolean;
  error?: number;
  message?: DisputeSocketMessageDTO;
}

/**
 * Response to "message:delete"
 */
export interface DisputeSocketMessageDeleteDTO {
  ok: boolean;
  error?: number;
}
