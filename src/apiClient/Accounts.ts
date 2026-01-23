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

import {
  AccountListDTO,
  AccountSummaryDTO,
  AccountUpdateRequest,
  ReputationFeedDTO,
  ReputationHistoryDTO,
  ReputationLeaderboardDTO,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Accounts<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Retrieve authenticated account information Returns full profile data for the logged-in account, including username, bio, Telegram info, wallet address, and verification status.
   *
   * @tags Account
   * @name MineList
   * @request GET:/accounts/mine
   * @secure
   */
  mineList = (params: RequestParams = {}) =>
    this.request<AccountSummaryDTO, void>({
      path: `/accounts/mine`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get account profile by ID Returns information about an account, including username, bio, Telegram info, wallet address, verification status, and avatar ID.
   *
   * @tags Account
   * @name GetAccounts
   * @request GET:/accounts/id/{accountId}
   * @secure
   */
  getAccounts = (accountId: number, params: RequestParams = {}) =>
    this.request<AccountSummaryDTO, void>({
      path: `/accounts/id/${accountId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get account profile by username / telegram username / wallet address in case of not having neither telegram linked or change his username. Returns information about an account, including username, bio, Telegram info, wallet address, verification status, and avatar ID.
   *
   * @tags Account
   * @name UsernameDetail
   * @request GET:/accounts/username/{username}
   * @secure
   */
  usernameDetail = (username: string, params: RequestParams = {}) =>
    this.request<AccountSummaryDTO, void>({
      path: `/accounts/username/${username}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update authenticated account (bio) Allows the authenticated user to update their bio. Both fields are optional, but at least one must be provided. Validation rules: - Bio: up to 400 characters
   *
   * @tags Account
   * @name AccountsPartialUpdate
   * @request PATCH:/accounts
   * @secure
   */
  accountsPartialUpdate = (
    data: AccountUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/accounts`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Requires authentication Returns full profile data for the account list, including username, bio, Telegram info, wallet address, and verification status.
   *
   * @tags Account
   * @name AccountsList
   * @request GET:/accounts
   * @secure
   */
  accountsList = (params: RequestParams = {}) =>
    this.request<AccountListDTO, void>({
      path: `/accounts`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Upload account avatar (only JPEG/PNG allowed) Allows the authenticated user to upload a new avatar image. Only JPEG and PNG files are accepted, with a maximum size of 2MB. The uploaded file is stored and linked to the user's profile.
   *
   * @tags Account
   * @name AvatarPartialUpdate
   * @request PATCH:/accounts/avatar
   * @secure
   */
  avatarPartialUpdate = (
    data: {
      /**
       * The avatar image (JPEG/PNG)
       * @format binary
       */
      avatar: File;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/accounts/avatar`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });
  /**
   * @description Download an account file (e.g. avatar) This endpoint allows downloading a file associated with an account (e.g., its avatar). It validates that both account and file exist and streams the file back with proper headers.
   *
   * @tags Account
   * @name FileDetail
   * @request GET:/accounts/{accountId}/file/{fileId}
   * @secure
   */
  fileDetail = (
    accountId: number,
    fileId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/accounts/${accountId}/file/${fileId}`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Get paginated reputation history for a user. This endpoint returns all reputation events for a given account, fully paginated, including: - Id of entry - Event type - Event value (+/-) - Event ID > Attached entity ID (if applicable) - ISO creation date Each user starts with **50 base reputation points**, which are included in the `finalScore` result.
   *
   * @tags Account
   * @name ReputationList
   * @request GET:/accounts/{accountId}/reputation
   * @secure
   */
  reputationList = (
    accountId: number,
    query?: {
      /** Number of results per page (default: 10) */
      top?: number;
      /** Results to skip for pagination (default: 0) */
      skip?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<ReputationHistoryDTO, void>({
      path: `/accounts/${accountId}/reputation`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get reputation leaderboard. Returns a paginated leaderboard of accounts ordered by reputation score. Score = BASE_SCORE (50) + value of all reputation events for the account. Only accounts with at least one reputation event and active accounts Search parameter filters by telegram username or wallet address. Sort by lowest / highest > same param as the other ones > highest by default.
   *
   * @tags Account
   * @name ReputationLeaderboardList
   * @request GET:/accounts/reputation/leaderboard
   */
  reputationLeaderboardList = (
    query?: {
      /** Number of results per page (default: 10) */
      top?: number;
      /** Results to skip for pagination (default: 0) */
      skip?: number;
      /** Sort by reputation score > enum > [asc, desc] (default: desc [highest]) */
      sort?: string;
      /** Search by telegram username or wallet address */
      search?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<ReputationLeaderboardDTO, void>({
      path: `/accounts/reputation/leaderboard`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Get latest reputation events (global feed). Returns the most recent reputation events across ALL accounts, ordered by creation date (DESC). Only events from non-deleted accounts (IsDeleted = 0) are included.
   *
   * @tags Account
   * @name ReputationUpdatesList
   * @request GET:/accounts/reputation/updates
   */
  reputationUpdatesList = (
    query?: {
      /** Number of results per page (default: 5, max: 50) */
      top?: number;
      /** Results to skip for pagination (default: 0) */
      skip?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<ReputationFeedDTO, void>({
      path: `/accounts/reputation/updates`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
