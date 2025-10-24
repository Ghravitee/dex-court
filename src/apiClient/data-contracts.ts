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

export interface AgreementsRequest {
  /** Title of agreement */
  title: string;
  /** Description of agreement */
  description: string;
  /** Type of agreement > enum > [Reputation = 1, Escrow] */
  type: number;
  /** Visibility of agreement > enum > [Private = 1, Public, AutoPublic - used when a dispute has been raised, it's automatically] */
  visibility: number;
  /** first party of agreement */
  firstParty: string;
  /** counter party of agreement */
  counterParty: string;
  /** Deadline of agreement > requires a bigger date than today, expected input: '2025-10-14T00:00:00.000Z' */
  deadline: string;
  /** Token symbol of escrow agreement > required only when amount has been setted, if not it's optional */
  tokenSymbol?: string;
  /** Amount of escrow agreement > required only when token symbol has been setted, if not it's optional */
  amount?: number;
  /** contract Address of agreement > required only when token symbol has been setted as custom, if not it's optional */
  contractAddress?: string;
}

export interface AgreementSignRequest {
  /** Agreement is accepted by X Party */
  accepted: boolean;
}

export type AgreementListQueryResquest = any;

export interface EditAgreementsRequest {
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

export interface RegisterTelegramRequest {
  /** User's telegramId */
  telegramId: string;
  /** User's username */
  username: string;
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
}

export interface AgreementListItem {
  /** Agreement unique identifier */
  id: number;
  /** Date when agreement was created (ISO 8601) */
  dateCreated: string;
  /** Title of the agreement */
  title: string;
  firstParty: AgreementParty;
  counterParty: AgreementParty;
  /** Amount of the agreement (nullable) */
  amount?: number;
  /** Token symbol of the agreement (nullable) */
  tokenSymbol?: string;
  /** Deadline of the agreement (nullable, ISO 8601) */
  deadline?: string;
  /** Agreement status > enum > [Pending = 1, Active, Completed, Disputed, Cancelled, Expired] */
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
  /** Agreement status > enum > [PendingAcceptance = 1, Active, Completed, Disputed, Cancelled, Expired] */
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
}

export interface AgreementActivity {
  /** Event name (e.g. Agreement Created) */
  event?: string;
  /** Date of event (ISO 8601) */
  date?: string;
  /** Username or wallet who triggered the event */
  by?: string;
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

export interface AgreementDetailsDTO {
  /** Agreement unique identifier */
  id: number;
  /** Title of the agreement */
  title: string;
  /** Description text of the agreement */
  description: string;
  /** Agreement type > enum > [Reputation = 1, Escrow] */
  type: number;
  /** Visibility > enum > [Private = 1, Public, AutoPublic] */
  visibility: number;
  /** Agreement status > enum > [PendingAcceptance = 1, Active, Completed, Disputed, Cancelled, Expired] */
  status: number;
  /** Escrow amount (if applicable) */
  amount?: number;
  /** Token symbol (if applicable) */
  tokenSymbol?: string;
  /** Escrow contract address (nullable) */
  escrowContract?: string;
  /** Date when the agreement was created (ISO 8601) */
  createdAt: string;
  /** Deadline date (ISO 8601) */
  deadline: string;
  creator: AgreementPartyInfo;
  firstParty: AgreementPartyInfo;
  counterParty: AgreementPartyInfo;
  files?: AgreementFileDTO[];
}

export interface LoginDTO {
  /** Session token */
  token: string;
}

export interface OtpTelegramDTO {
  otp: string;
}
