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
}
