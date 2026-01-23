/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AccountUpdateRequest {
  /** New bio (optional, max 300 chars) */
  bio?: string;
}

export interface AccountsRoleRequest {
  accountsId: any[];
}

export interface AgreementSignRequest {
  /** Agreement is accepted by X Party */
  accepted: boolean;
}

export type AgreementListQueryResquest = any;

export interface AgreementsEditRequest {
  /** Title of the agreement */
  title?: string;
  /** Description of the agreement */
  description?: string;
  /** Type of agreement > enum > [Reputation = 1, Escrow] */
  type?: number;
  /** Visibility of agreement > enum > [Private = 1, Public, AutoPublic - used when a dispute has been raised, it's automatically] */
  visibility?: number;
  /** Deadline of agreement > requires a future date, example: '2025-10-14T00:00:00.000Z' */
  deadline?: string;
  /** Token symbol of escrow agreement > required only when amount is set */
  tokenSymbol?: string;
  /** Amount of escrow agreement > required only when tokenSymbol is set */
  amount?: number;
  /** Contract address > required only when tokenSymbol is 'custom' */
  contractAddress?: string;
  /** Indicates if the agreement includes funds */
  includesFunds?: boolean;
  /** Indicates if the agreement should secure the funds */
  secureTheFunds?: boolean;
  txnhash?: string;
  contractAgreementId?: string;
  chainId?: number;
  votingId?: string;
  payerWalletAddress?: string;
  payeeWalletAddress?: string;
}

export interface AgreementDeliveryRequest {
  /**
   * Delivery status marked by the first party.
   * Values:
   *   - 0 - Not delivered
   *   - 1 - Delivered
   */
  deliveredStatus?: number;
  /**
   * Delivery confirmation status marked by the counterparty.
   * Values:
   *   - 0 - Not confirmed
   *   - 1 - Confirmed (delivery accepted)
   *   - 2 - Rejected (delivery disputed)
   */
  confirmedStatus?: number;
}

export interface AgreementCancelRespondRequest {
  /** true = confirm cancelation, false = reject */
  accepted: boolean;
}

export interface DisputesRequest {
  /** Title of the dispute */
  title: string;
  /** Description of the dispute */
  description: string;
  /** Type of dispute > enum > [ProBono = 1, Paid] - requires having wallet */
  requestKind: number;
  /** Identifier of the defendant (can be username, Telegram username, or wallet address) */
  defendant: string;
  /** Formal claim text describing the issue or complaint */
  claim: string;
  votingId: string;
  chainId?: number;
  witnesses?: string[];
}

export interface EditPlaintiffClaimRequest {
  /** Title of the dispute */
  title?: string;
  /** Description of the dispute */
  description?: string;
  /** Type of dispute > enum > [ProBono = 1, Paid] - requires having wallet */
  requestKind?: number;
  /** Formal claim text describing the issue or complaint */
  claim?: string;
  feeAmount?: number;
  txnhash?: string;
  contractAgreementId?: string;
  chainId?: number;
  witnesses?: string[];
}

export interface DisputesByAgreementRequest {
  /** Title of the dispute */
  title: string;
  /** Description of the dispute */
  description: string;
  /** Type of dispute > enum > [ProBono = 1, Paid] */
  requestKind: number;
  /** Formal claim text by the plaintiff */
  claim: string;
  chainId?: number;
  votingId: string;
  contractAgreementId?: string;
  witnesses?: string[];
}

export interface DisputesTriggeredRequest {
  /** Title of the dispute */
  title: string;
  /** Description of the dispute */
  description: string;
  /** Identifier of the defendant */
  defendant: string;
}

export interface DisputesDefendantClaimRequest {
  /** Formal claim text provided by the defendant */
  defendantClaim: string;
  witnesses?: string[];
}

export interface DisputesEditDefendantClaimRequest {
  /** Updated claim text provided by the defendant */
  defendantClaim?: string;
  witnesses?: string[];
}

export interface DisputesReplyRequest {
  /** Text content of the message reply */
  content: string;
}

export interface DisputesEditReplyRequest {
  /** Updated text content of the message reply */
  content?: string;
}

export type DisputeListQueryRequest = any;

export interface DisputeVoteRequest {
  /** Type of vote > enum > [Plaintiff = 1, Defendant = 2, DismissCase = 3] */
  voteType: number;
  /** Optional comment explaining the reasoning for the vote */
  comment?: string;
}

export type DisputeListVoteSettledQueryRequest = any;

export interface DisputeSocketJoinRequest {
  /** Dispute ID to join (loads full chat history) */
  disputeId: number;
}

export interface DisputeSocketMessageCreateRequest {
  /** Dispute ID to which the message belongs */
  disputeId: number;
  /** Content text of the message */
  content: string;
}

export interface DisputeSocketMessageDeleteRequest {
  /** Dispute ID */
  disputeId: number;
  /** Message ID to delete */
  messageId: number;
}

export interface DisputeSocketMessageDeletedEventRequest {
  /** ID of the message that was deleted */
  messageId: number;
}

export interface LoginTelegramRequest {
  /** User’s OTP code */
  otp: string;
}

export interface LoginWalletNonceRequest {
  /** User's wallet address */
  walletAddress: string;
}

export interface LoginWalletVerifyNonceRequest {
  /** User's wallet address */
  walletAddress: string;
  /** User's wallet signature */
  signature: string;
}

export interface OtpTelegramRequest {
  telegramId: string;
}

export interface OtpTelegramPatchRequest {
  username: string;
}

export interface RegisterTelegramRequest {
  /** User's telegramId */
  telegramId: string;
  /** User's username */
  username: string;
}

export interface TestingRequest {
  disputeIds: any[];
}

export interface AccountSummaryDTO {
  /** Account unique identifier */
  id: number;
  /** Account username (nullable) */
  username?: string;
  /** Account biography (nullable) */
  bio?: string;
  /** Whether the account is platform verified */
  isVerified: boolean;
  /** Whether the account is admin or no */
  isAdmin: boolean;
  /** Telegram information */
  telegram?: object;
  /** Telegram username (nullable) */
  "telegram.username"?: string;
  /** Telegram ID (nullable) */
  "telegram.id"?: string;
  /** Connected wallet address (nullable) */
  walletAddress?: string;
  /** Account role > enum > [1 = Member, 2 = Judge, 3 = Admin] */
  role: number;
  /** Avatar file ID (nullable) */
  avatarId?: number;
}

export interface AccountListDTO {
  results: AccountSummaryDTO[];
}

export interface ReputationEntryDTO {
  /** Reputation entry ID */
  id: number;
  /** Event type (enum ReputationEventTypeEnum > TelegramVerified = 1, AgreementCompleted = 2, AgreementEscrowCompleted = 3, DisputeWon = 4, VotedWinningOutcome = 5, WitnessEvery5Comments = 6, JudgeWinningVote = 7, JudgeCommentAdded = 8, FirstJudgeToVote = 9, FirstCommunityToVote = 10, CommunityVoteLost = 50, JudgeVoteLost = 51, DisputeLostRegular = 52, DisputeLostEscrow = 53, LateDelivery = 54, FrequentCancellationsBanned = 55, SpamAgreementsTempBan = 56, }) */
  eventType: number;
  /** Event reputation value (+/-) */
  value: number;
  /** Attached entity ID (agreementId, disputeId) > only used if it's associated with agreements or disputes */
  eventId?: string;
  /** ISO creation timestamp */
  createdAt: string;
}

export interface ReputationHistoryDTO {
  /** Total number of reputation events */
  total: number;
  /** Number of results in this page */
  totalResults: number;
  /** Base reputation (always 50) */
  baseScore: number;
  /** Total score including base + events */
  finalScore: number;
  results: ReputationEntryDTO[];
}

export interface DisputeStatsDTO {
  /** Number of disputes cancelled */
  disputes: number;
}

export interface ReputationLeaderboardEntryDTO {
  /** Account unique identifier */
  id: number;
  /** Display username (telegram handle or wallet) */
  username?: string;
  /** Avatar file ID (nullable) */
  avatarId?: number;
  /** Reputation score including base score */
  finalScore: number;
  /** Rank in the current page (1-based) */
  rank: number;
  /** Total agreements for this account */
  agreementsTotal: number;
  /** Number of disputes cancelled */
  disputes: number;
  lastEvents: ReputationEntryDTO[];
}

export interface ReputationLeaderboardDTO {
  /** Total number of matching accounts */
  total: number;
  /** Number of results in this page */
  totalResults: number;
  results: ReputationLeaderboardEntryDTO[];
}

export interface ReputationFeedAccountDTO {
  /** Account unique identifier */
  id: number;
  /** Display username (telegram handle or wallet) */
  username?: string;
  /** Avatar file ID (nullable) */
  avatarId?: number;
}

export interface ReputationFeedEntryDTO {
  /** Reputation entry id */
  id: number;
  account: ReputationFeedAccountDTO;
  /** Reputation event type enum */
  eventType: number;
  /** Event value (+/-) */
  value: number;
  /** Attached entity ID (if applicable) */
  eventId?: number;
  /** ISO creation date */
  createdAt: string;
}

export interface ReputationFeedDTO {
  /** Total number of reputation entries (for non-deleted accounts) */
  total: number;
  /** Number of results in this page */
  totalResults: number;
  results: ReputationFeedEntryDTO[];
}

export interface AgreementParty {
  /** Account unique identifier */
  id?: number;
  /** Account username */
  username?: string;
  /** Telegram username (if available) */
  telegramUsername?: string;
  /** Wallet address (if available) */
  wallet?: string;
  /** Account avatarId */
  avatarId?: string;
}

export interface AgreementListItem {
  /** Agreement unique identifier */
  id: number;
  /** Date when agreement was created (ISO 8601) */
  dateCreated: string;
  /** Title of the agreement */
  title: string;
  /** Description text of the agreement */
  description: string;
  payerWalletAddress?: string;
  payeeWalletAddress?: string;
  contractAgreementId?: string;
  chainId?: number;
  escrowContractAddress?: string;
  firstParty: AgreementParty;
  counterParty: AgreementParty;
  /** Agreement type > enum > [Reputation = 1, Escrow] */
  type: number;
  /** Amount of the agreement (nullable) */
  amount?: number;
  /** Token symbol of the agreement (nullable) */
  tokenSymbol?: string;
  /** Deadline of the agreement (nullable, ISO 8601) */
  deadline?: string;
  /** Agreement status > enum > [Pending = 1, Active, Completed, Disputed, Cancelled, Expired, PartySubmittedDelivery] */
  status: number;
}

export interface AgreementListDTO {
  /** Total number of agreements matching the filters (before pagination) */
  totalAgreements: number;
  /** Number of agreements returned in this response (after pagination) */
  totalResults: number;
  results: AgreementListItem[];
}

export interface AgreementMineParty {
  /** Account unique identifier */
  id?: number;
  /** Account username */
  username?: string;
  /** Telegram username (nullable) */
  telegramUsername?: string;
  /** Wallet address (nullable) */
  wallet?: string;
}

export interface AgreementMineItem {
  /** Agreement unique identifier */
  id: number;
  /** Agreement status > enum > [PendingAcceptance = 1, Active, Completed, Disputed, Cancelled, Expired, PartySubmittedDelivery] */
  status: number;
  /** Creation date (ISO 8601) */
  dateCreated: string;
  firstParty: AgreementMineParty;
  counterParty: AgreementMineParty;
}

export interface AgreementMineListDTO {
  /** Total number of agreements found */
  count: number;
  results: AgreementMineItem[];
}

export interface AgreementPartyInfo {
  /** Account unique identifier */
  id?: number;
  /** Account username or Telegram username or wallet address */
  username?: string;
  /** Account avatarId */
  avatarId?: string;
}

export interface AgreementContextCancelPending {
  /** Indicates if a cancel request is currently active */
  active: boolean;
  /** True if the authenticated user initiated the cancel request */
  initiatedByUser: boolean;
  /** True if the other party initiated the cancel request */
  initiatedByOther: boolean;
}

export interface AgreementContextPendingApproval {
  /** Indicates if the agreement is currently pending approval (delivery stage) */
  active: boolean;
  /** True if the authenticated user initiated the delivery */
  initiatedByUser: boolean;
  /** True if the other party initiated the delivery */
  initiatedByOther: boolean;
}

export interface AgreementContext {
  cancelPending: AgreementContextCancelPending;
  pendingApproval: AgreementContextPendingApproval;
}

export interface AgreementFileDTO {
  id?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  uploadedBy?: object;
  "uploadedBy.id"?: number;
  "uploadedBy.username"?: string;
  "uploadedBy.telegramUsername"?: string;
}

export interface AgreementEventDTO {
  /** Event ID */
  id: number;
  /**
   * Type of event (AgreementEventTypeEnum)
   * {
   * Created = 1, // Agreement was created
   * Signed, // A party signed (accepted)
   * Rejected, // A party rejected
   * Delivered, // First party delivered
   * DeliveryConfirmed, // Counterparty confirmed delivery
   * DeliveryRejected, // Counterparty rejected delivery
   * CancelRequested, // One party requested cancel
   * CancelConfirmed, // Cancel confirmed by other party
   * CancelRejected, // Cancel rejected by other party
   * Expired, // (10) Agreement auto-expired after deadline
   * AutoCancelled, // (11) Cancelled automatically after no response
   * }
   */
  type: number;
  /** Status before the event (Status of the agreement) */
  fromStatus?: number;
  /** Status after the event (AgreementStatusEnum) */
  toStatus?: number;
  /** Optional event note (e.g., "Auto-cancelled after 3 days") */
  note?: string;
  /** Timestamp of the event (ISO 8601) */
  createdAt: string;
  actor?: AgreementPartyInfo;
  target?: AgreementPartyInfo;
}

export interface DisputesAssociatedDTO {
  /** disputeId associated to the agreement */
  disputeId: number;
}

export interface AgreementDetailsDTO {
  /** Agreement unique identifier */
  id: number;
  disputes?: DisputesAssociatedDTO[];
  /** Title of the agreement */
  title: string;
  /** Description text of the agreement */
  description: string;
  /** Agreement type > enum > [Reputation = 1, Escrow] */
  type: number;
  /** Visibility > enum > [Private = 1, Public, AutoPublic] */
  visibility: number;
  /** Agreement status > enum > [PendingAcceptance = 1, Active, Completed, Disputed, Cancelled, Expired, PartySubmittedDelivery] */
  status: number;
  /** Whether the agreement has secured funds */
  hasSecuredFunds: boolean;
  /** Whether the agreement includes funds */
  includesFunds: boolean;
  /** Escrow amount (if applicable) */
  amount?: number;
  /** Token symbol (if applicable) */
  tokenSymbol?: string;
  /** Escrow contract address (nullable) */
  escrowContract?: string;
  txnhash?: string;
  contractAgreementId?: string;
  chainId?: number;
  votingId?: string;
  payerWalletAddress?: string;
  payeeWalletAddress?: string;
  /** Date when the agreement was created (ISO 8601) */
  createdAt: string;
  /** Deadline date (ISO 8601) */
  deadline?: string;
  creator: AgreementPartyInfo;
  firstParty: AgreementPartyInfo;
  counterParty: AgreementPartyInfo;
  context?: AgreementContext;
  files?: AgreementFileDTO[];
  timeline?: AgreementEventDTO[];
}

export interface AgreementCreationDTO {
  /** Agreement unique identifier */
  id?: number;
}

export interface DisputeAccountDTO {
  /** Account unique identifier > can be null if it's a ghost account */
  id?: number;
  /** Account username or Telegram username or wallet address */
  username?: string;
  /** Account avatar file ID (nullable) */
  avatarId?: number;
}

export interface DisputeFileDTO {
  /** File unique identifier */
  id?: number;
  /** Original file name */
  fileName?: string;
  /** File size in bytes (nullable) */
  fileSize?: number;
  /** File side (1 = Plaintiff, 2 = Defendant) */
  side?: number;
  /** MIME type (e.g., 'application/pdf') */
  mimeType?: string;
  /** Upload timestamp (ISO 8601) */
  uploadedAt?: string;
}

export interface DisputeCreationDTO {
  /** Dispute unique identifier */
  id?: number;
}

export interface DisputeMessageDTO {
  /** Unique identifier from MeiliSearch (UUID) */
  id: string;
  /** Internal database ID for message (nullable) */
  disputeMessageId?: number;
  /** Dispute ID to which this message belongs */
  disputeId: number;
  creator?: DisputeAccountDTO;
  /** Message side (1 = Plaintiff, 2 = Defendant) */
  side: number;
  /** Message content text */
  content: string;
  /** Message creation timestamp (ISO 8601) */
  createdAt: string;
  files?: DisputeFileDTO[];
}

export interface DisputeWitnessesDTO {
  plaintiff?: DisputeAccountDTO[];
  defendant?: DisputeAccountDTO[];
}

export interface DisputePlaintiffSectionDTO {
  /** Description or argument text provided by the party */
  description?: string;
  /** Formal claim text written by the party */
  formalClaim?: string;
  /** Formal claim timestamp when added */
  createdAt?: string;
  /** Formal claim timestamp when updated */
  updatedAt?: string;
  evidenceFiles?: DisputeFileDTO[];
}

export interface DisputeDefendantSectionDTO {
  /** Formal claim text written by the defendant */
  formalClaim?: string;
  /** Formal claim timestamp when added */
  createdAt?: string;
  /** Formal claim timestamp when updated */
  updatedAt?: string;
  evidenceFiles?: DisputeFileDTO[];
}

export interface AgreementDetailDisputeDTO {
  /** agreement id */
  id?: number;
  /** agreement type */
  type?: number;
  /** agreement status */
  status?: number;
  /** agreement title */
  title?: string;
}

export interface DisputeDetailsDTO {
  /** Dispute unique identifier */
  id: number;
  /** Agreement associated */
  agreement?: agreementDetailDisputeDto;
  /** Title or short summary of the dispute */
  title: string;
  /** Current dispute status (DisputeStatusEnum > Pending = 1, VoteInProgress, Settled, Dismissed) */
  status: number;
  /** Type of dispute (DisputeTypeEnum > ProBono = 1, Paid) */
  type: number;
  txnhash?: string;
  contractAgreementId?: string;
  votingId?: string;
  /** Fee Amount of the dispute to vote */
  feeAmount?: number;
  chainId?: number;
  /** Result of dispute (DisputeResultEnum, nullable > Pending = 1, PartyA, PartyB, Draw, Cancelled) */
  result?: number;
  /** Date when the dispute was created (ISO 8601 format) */
  createdAt: string;
  /** Date when dispute entered pending vote) */
  votePendingAt?: string;
  /** Date when voting started (nullable) */
  voteStartedAt?: string;
  /** Date when voting ended (nullable) */
  voteEndedAt?: string;
  plaintiff: DisputeAccountDTO;
  defendant: DisputeAccountDTO;
  witnesses: DisputeWitnessesDTO;
  plaintiffComplaint: DisputePlaintiffSectionDTO;
  defendantResponse?: DisputeDefendantSectionDTO;
  /** if user is logged in and it's not pending, will show a flag if user has voted */
  hasVoted: string;
}

export interface DisputeListItemDTO {
  /** Unique identifier of the dispute */
  id: number;
  /** Title of the dispute */
  title: string;
  /** Shortened version of the plaintiff’s claim or complaint */
  claim?: string;
  /** Agreement associated */
  agreement?: agreementDetailDisputeDto;
  /** Dispute type > enum > [ProBono = 1, Paid] */
  requestType: number;
  /** Current status of the dispute > enum > [Pending = 1, VoteInProgress = 2, Settled = 3, Dismissed = 4] */
  status: number;
  /** Result of the dispute (nullable, depends on voting outcome) */
  result?: number;
  /** Date when the dispute was created (ISO 8601 format) */
  createdAt: string;
  /** Date when dispute entered pending vote) */
  votePendingAt?: string;
  /** Date when voting started (nullable) */
  voteStartedAt?: string;
  /** Date when voting ended (nullable) */
  voteEndedAt?: string;
  /** Object containing both parties */
  parties: object;
  "parties.plaintiff"?: DisputeAccountDTO;
  "parties.defendant"?: DisputeAccountDTO;
}

export interface DisputeListDTO {
  /** Total number of disputes found in the query */
  totalDisputes: number;
  /** Number of disputes returned in the current page */
  totalResults: number;
  results: DisputeListItemDTO[];
}

export interface DisputeVoteInProgressListDTO {
  /** Unique identifier of the dispute */
  id: number;
  /** Title of the dispute */
  title: string;
  /** Shortened version of the plaintiff’s claim or complaint */
  claim?: string;
  /** Agreement associated */
  agreement?: agreementDetailDisputeDto;
  /** if user is logged in, will show a flag if user has voted */
  hasVoted: string;
  /** Dispute type > enum > [ProBono = 1, Paid] */
  requestType: number;
  /** Current status of the dispute > enum > [Pending = 1, VoteInProgress = 2, Settled = 3, Dismissed = 4] */
  status: number;
  /** Result of the dispute (nullable, depends on voting outcome) */
  result?: number;
  /** Fee Amount of the dispute to vote */
  feeAmount?: number;
  /** Date when the dispute was created (ISO 8601 format) */
  createdAt: string;
  /** Date when dispute entered pending vote) */
  votePendingAt?: string;
  /** Date when voting started (nullable) */
  voteStartedAt?: string;
  /** Date when voting ended (nullable) */
  voteEndedAt?: string;
  /** Object containing both parties */
  parties: object;
  "parties.plaintiff"?: DisputeAccountDTO;
  "parties.defendant"?: DisputeAccountDTO;
}

export interface DisputeVoteInProgressResultListDTO {
  results: DisputeVoteInProgressListDTO[];
}

export interface VoteCountGroupDTO {
  /** Number of votes favoring the plaintiff */
  plaintiff: number;
  /** Number of votes favoring the defendant */
  defendant: number;
  /** Number of votes for dismissing the case */
  dismiss: number;
  /** Total number of votes in this group */
  total: number;
}

export interface GroupsDTO {
  /** Weighted % for Plaintiff (0–100, 2 casas) */
  plaintiff: number;
  /** Weighted % for Defendant (0–100, 2 casas) */
  defendant: number;
  /** Weighted % for Dismiss (0–100, 2 casas) */
  dismiss: number;
}

export interface DisputeVotePercentagesDTO {
  judges: GroupsDTO;
  communityTierOne: GroupsDTO;
  communityTierTwo: GroupsDTO;
}

export interface VoteCommentDTO {
  accountId: number;
  username?: string;
  avatarId?: number;
  /** AccountRoleEnum (1=CommunityMember, 2=Judge, 3=Admin) */
  role: number;
  comment: string;
}

export interface VoteGroupBreakdownDTO {
  judges: VoteCountGroupDTO;
  communityTierOne: VoteCountGroupDTO;
  communityTierTwo: VoteCountGroupDTO;
}

export interface DisputePartiesDTO {
  plaintiff: DisputeAccountDTO;
  defendant: DisputeAccountDTO;
}

export interface DisputeVoteResultListDTO {
  /** Total number of disputes found in the query */
  totalDisputes: number;
  /** Number of disputes returned in the current page */
  totalResults: number;
  results: any[];
}

export interface DisputeSocketFileDTO {
  /** Unique file identifier (MySQL) */
  id: number;
  /** Original name of the file */
  fileName: string;
  /** File size in bytes (nullable) */
  fileSize?: number;
  /** MIME type of the file (e.g., image/png) */
  mimeType?: string;
  /** Upload timestamp (ISO 8601 format) */
  uploadedAt?: string;
}

export interface DisputeSocketMessageDTO {
  /** Message unique identifier (MySQL) */
  id: number;
  /** Dispute ID to which this message belongs */
  disputeId: number;
  /** Author avatar file ID (nullable) */
  avatarId?: number;
  /** Author account ID (nullable) */
  accountId?: number;
  /** Display name of the author (username, Telegram username, or wallet) */
  username: string;
  /** Role of the message author within the dispute (plaintiff, defendant, judge, witness, admin) */
  role?: string;
  /** Message side (DisputeMessageEnum: None=0, Plaintiff=1, Defendant=2) */
  side: number;
  /** Text content of the message */
  content: string;
  /** ISO 8601 timestamp when the message was created */
  creationDate: string;
  files?: DisputeSocketFileDTO[];
}

export interface DisputeSocketJoinDTO {
  /** Whether join succeeded */
  ok: boolean;
  /** Error code (ErrorsEnum) if failed */
  error?: number;
  history?: DisputeSocketMessageDTO[];
}

export interface DisputeSocketMessageCreateDTO {
  /** Whether message creation succeeded */
  ok: boolean;
  /** Error code (ErrorsEnum) if applicable */
  error?: number;
  message?: DisputeSocketMessageDTO;
}

export interface DisputeSocketMessageDeleteDTO {
  /** Whether delete succeeded */
  ok: boolean;
  /** Error code (ErrorsEnum) if applicable */
  error?: number;
}

export interface DisputeVoteEligibilityDTO {
  /** If user's wallet is eligible to vote */
  isEligible: boolean;
  /** why user's wallet is/isn't eligible to vote > ErrorsEnum > if no tier returns Forbidden = 17 > if on loadProofForAddress there's an error returns Forbidden = 17 > If user has no wallet, returns MissingWallet = 12 */
  reason?: number;
  /** user's tier vote > don't forget if judge tier is 0. */
  tier?: number;
  /** user's weight vote */
  weight?: number;
}

export interface LoginDTO {
  /** Session token */
  token: string;
}

export interface OtpTelegramDTO {
  otp: string;
}
